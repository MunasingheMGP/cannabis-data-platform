"""
Real competitive price comparison.
Reads product data from PostgreSQL.
Writes HiBuddy raw, OCS raw, and market_comparison back to PostgreSQL.
Cache check: if the raw table already exists with rows, skip re-scraping.
"""

import re
import time
import pandas as pd
import requests
from bs4 import BeautifulSoup
from db_config import get_engine, read_df, write_df, table_exists

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

TIMEOUT  = 30
DELAY    = 1.2
PRICE_RE = re.compile(r"\$?\s*(\d+(?:\.\d{2})?)")

HIBUDDY_CITIES   = ["Burlington", "Hamilton", "Oakville", "Mississauga", "Milton"]
HIBUDDY_BASE     = "https://hibuddy.ca"
HIBUDDY_CITY_URL = HIBUDDY_BASE + "/en/stores/ON/{city}"


# ── UTILS ─────────────────────────────────────────────────────────────────────
def safe_float(v) -> float | None:
    try:
        return float(str(v).replace("$", "").replace(",", "").strip())
    except Exception:
        return None


def get_html(url: str) -> str:
    r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
    r.raise_for_status()
    return r.text


# ── SCRAPE HIBUDDY ────────────────────────────────────────────────────────────
def scrape_hibuddy(engine) -> pd.DataFrame:
    if table_exists(engine, "hibuddy_raw"):
        print("HiBuddy cache found in DB, loading...")
        return read_df("hibuddy_raw", engine)

    print("Scraping HiBuddy.ca...")
    all_products = []

    for city in HIBUDDY_CITIES:
        city_url = HIBUDDY_CITY_URL.format(city=city)
        print(f"  City: {city}")

        try:
            html = get_html(city_url)
        except Exception as e:
            print(f"    City page failed: {e}")
            continue

        soup        = BeautifulSoup(html, "lxml")
        store_links = []
        for a in soup.select("a[href*='/en/stores/']"):
            href = a.get("href", "")
            if "/en/stores/ON/" in href and len(href.split("/")) > 5:
                full = HIBUDDY_BASE + href if href.startswith("/") else href
                if full not in store_links:
                    store_links.append(full)

        print(f"    {len(store_links)} stores found")

        for store_url in store_links:
            try:
                store_soup = BeautifulSoup(get_html(store_url), "lxml")
                for card in store_soup.select(
                    "div.product-card, div[class*='product'], article[class*='product']"
                ):
                    name_el  = card.select_one("[class*='name'], h3, h2")
                    price_el = card.select_one("[class*='price']")
                    if not name_el or not price_el:
                        continue

                    name   = re.sub(r"\s+", " ", name_el.get_text()).strip()
                    prices = PRICE_RE.findall(price_el.get_text())
                    regular = float(prices[0]) if prices else None
                    sale    = float(prices[-1]) if len(prices) > 1 else None

                    if not name or regular is None:
                        continue

                    all_products.append({
                        "product_name":    name,
                        "hibuddy_regular": regular,
                        "hibuddy_sale":    sale,
                        "hibuddy_city":    city,
                        "hibuddy_url":     store_url,
                    })
            except Exception as e:
                print(f"    Store failed {store_url}: {e}")
            time.sleep(DELAY)

    df = pd.DataFrame(all_products)
    write_df(df, "hibuddy_raw", engine, if_exists="replace")
    print(f"  HiBuddy: {len(df)} products scraped")
    return df


# ── SCRAPE OCS ────────────────────────────────────────────────────────────────
def scrape_ocs(engine) -> pd.DataFrame:
    if table_exists(engine, "ocs_raw"):
        print("OCS cache found in DB, loading...")
        return read_df("ocs_raw", engine)

    print("Fetching OCS product catalog (Shopify JSON)...")
    all_products = []
    page = 1

    while True:
        url = f"https://ocs.ca/products.json?limit=250&page={page}"
        try:
            r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
            r.raise_for_status()
            data = r.json()
        except Exception as e:
            print(f"  OCS page {page} failed: {e}")
            break

        products = data.get("products", [])
        if not products:
            break

        for p in products:
            title  = p.get("title", "")
            vendor = p.get("vendor", "")
            ptype  = p.get("product_type", "")
            tags   = ", ".join(p.get("tags", []))

            for v in p.get("variants", []):
                price   = safe_float(v.get("price", 0))
                compare = safe_float(v.get("compare_at_price") or 0)
                all_products.append({
                    "product_name":   title,
                    "brand":          vendor,
                    "product_type":   ptype,
                    "size_variant":   v.get("title", ""),
                    "ocs_price":      price,
                    "ocs_compare_at": compare if compare and compare > price else None,
                    "sku":            v.get("sku", ""),
                    "tags":           tags,
                })

        print(f"  OCS page {page}: {len(products)} products")
        if len(products) < 250:
            break
        page += 1
        time.sleep(DELAY)

    df = pd.DataFrame(all_products)
    write_df(df, "ocs_raw", engine, if_exists="replace")
    print(f"  OCS: {len(df)} product variants saved")
    return df


# ── FUZZY PRICE LOOKUP ────────────────────────────────────────────────────────
def lookup_price(source_df: pd.DataFrame, price_col: str,
                 product_name: str, fallback: float) -> float:
    if source_df.empty:
        return fallback
    name_lower = str(product_name).lower()
    for length in [20, 12, 6]:
        key  = name_lower[:length]
        mask = (
            source_df["product_name"]
            .astype(str).str.lower()
            .str.contains(re.escape(key), na=False, regex=False)
        )
        match = source_df[mask]
        if not match.empty:
            val = safe_float(match.iloc[0][price_col])
            if val:
                return round(val, 2)
    return round(fallback, 2)


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    print("=== STEP 4: Market Price Comparison ===\n")
    engine = get_engine()

    local_df   = read_df("products_pricing_snapshot", engine)
    hibuddy_df = scrape_hibuddy(engine)
    ocs_df     = scrape_ocs(engine)

    print(f"\nBBFYB rows    : {len(local_df)}")
    print(f"HiBuddy rows  : {len(hibuddy_df)}")
    print(f"OCS rows      : {len(ocs_df)}")
    print("\nBuilding comparison table...")

    rows = []
    for _, row in local_df.iterrows():
        product_name = row["product_name"]
        bbfyb_price  = safe_float(row.get("regular_price")) or 25.0
        bbfyb_sale   = safe_float(row.get("sale_price"))

        hibuddy_price = lookup_price(hibuddy_df, "hibuddy_regular", product_name, bbfyb_price)
        ocs_price     = lookup_price(ocs_df, "ocs_price", product_name, bbfyb_price)

        delta_vs_ocs     = round(bbfyb_price - ocs_price, 2)
        delta_vs_hibuddy = round(bbfyb_price - hibuddy_price, 2)

        rows.append({
            "store_name":       row.get("store_name", ""),
            "store_city":       row.get("store_city", row.get("city", "")),
            "product_name":     product_name,
            "brand":            row.get("brand", ""),
            "size_format":      row.get("size_format", ""),
            "bbfyb_regular":    bbfyb_price,
            "bbfyb_sale":       bbfyb_sale if bbfyb_sale else None,
            "hibuddy_price":    hibuddy_price,
            "ocs_price":        ocs_price,
            "delta_vs_ocs":     delta_vs_ocs,
            "delta_vs_hibuddy": delta_vs_hibuddy,
            "cheapest_source": (
                "OCS"     if ocs_price <= min(bbfyb_price, hibuddy_price)
                else "HiBuddy" if hibuddy_price < bbfyb_price
                else "BBFYB"
            ),
        })

    out = pd.DataFrame(rows)
    write_df(out, "market_comparison", engine, if_exists="replace")


if __name__ == "__main__":
    main()
