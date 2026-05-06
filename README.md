# Cannabis Price Comparison & Store Discovery Platform

> Burlington, Ontario · 35 km radius · Licensed AGCO Retailers

A full-stack web platform to compare cannabis product prices, discover licensed stores, and track deals — powered by an automated data pipeline that collects, enriches, and scores data daily.

---

## Tech Stack

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Frontend  | Next.js 14 / React 18                        |
| Backend   | Python FastAPI + Swagger / OpenAPI           |
| Database  | PostgreSQL (`cannabis_db`)                   |
| Scheduler | APScheduler (auto-runs pipeline every 24 h)  |

---

## Repository Structure

```
cannabis-platform/
├── backend/
│   ├── main.py                        # FastAPI app — all API endpoints
│   ├── database.py                    # PostgreSQL connection pool (psycopg2)
│   ├── scheduler.py                   # APScheduler — auto-runs pipeline on interval
│   ├── requirements.txt
│   └── pipeline/                      # Data collection & enrichment scripts
│       ├── db_config.py               # SQLAlchemy engine config
│       ├── fetch_stores_agco.py       # Step 1 — fetch licensed stores from AGCO
│       ├── enrich_store_contacts.py   # Step 2 — add phone numbers & hours
│       ├── scrape_competitor_products.py  # Step 3 — scrape product prices
│       ├── compare_market_prices.py   # Step 4 — compare vs HiBuddy & OCS
│       ├── reddit_sentiment_analytics.py  # Step 5 — Reddit sentiment & analytics
│       └── run_all.py                 # CLI runner — executes all 5 steps in order
└── frontend/
    ├── pages/
    │   ├── index.js                   # Homepage — stats, hot deals, nearby stores
    │   ├── products/
    │   │   ├── index.js               # Product grid with brand/city/price filters
    │   │   └── [id].js                # Product detail — prices at every store
    │   ├── stores/
    │   │   ├── index.js               # Store listings — filterable by city
    │   │   └── [id].js                # Store profile — contact, hours, products
    │   ├── deals.js                   # Active sales & promotions
    │   └── search.js                  # Keyword search across products & stores
    ├── components/
    │   └── Navbar.js
    ├── styles/
    │   └── globals.css
    ├── next.config.js
    └── package.json
```

---

## Prerequisites

- **PostgreSQL** running locally (port 5432)
- **Node.js** 18+
- **Python** 3.11+

---

## Setup & Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/<your-org>/cannabis-platform.git
cd cannabis-platform
```

### 2. Database

```bash
createdb cannabis_db
```

> The pipeline will create all required tables automatically on first run.

### 3. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- Swagger UI → [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc → [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

App → [http://localhost:3000](http://localhost:3000)

### 5. Environment Variables

Create `frontend/.env.local`:

```
API_BASE=http://localhost:8000
```

For production, update `API_BASE` to your hosted backend URL.

---

## Data Pipeline

The backend includes an automated 5-step data pipeline that populates and refreshes `cannabis_db`.

### Pipeline Steps

| Step | Script                          | What it does                                      |
|------|---------------------------------|---------------------------------------------------|
| 1    | `fetch_stores_agco.py`          | Fetches all licensed cannabis stores from AGCO    |
| 2    | `enrich_store_contacts.py`      | Adds phone numbers, hours, and contact details    |
| 3    | `scrape_competitor_products.py` | Scrapes product listings and pricing              |
| 4    | `compare_market_prices.py`      | Compares prices against HiBuddy and OCS           |
| 5    | `reddit_sentiment_analytics.py` | Pulls Reddit sentiment data and builds analytics  |

### Database Tables Populated

| Table                        | Populated By              |
|------------------------------|---------------------------|
| `stores_master`              | Steps 1 & 2               |
| `products_pricing_snapshot`  | Step 3                    |
| `bbfyb_stores`               | Step 3                    |
| `hibuddy_raw`                | Step 4                    |
| `ocs_raw`                    | Step 4                    |
| `market_comparison`          | Step 4                    |
| `reddit_sentiment_raw`       | Step 5                    |
| `business_analytics_summary` | Step 5                    |

### Running the Pipeline

**Option A — Manual CLI run:**

```bash
cd backend/pipeline
python run_all.py
```

This runs all 5 steps in sequence and prints a row-count summary for every table when complete.

**Option B — Auto-scheduler (runs with the server):**

The pipeline auto-runs every **168 hours** when the FastAPI server is up. To change the interval:

```bash
PIPELINE_INTERVAL_HOURS=12 uvicorn main:app --port 8000
```

**Option C — Trigger via API:**

```bash
POST http://localhost:8000/api/pipeline/run
```

### Pipeline API Endpoints

| Method | Endpoint                  | Description                             |
|--------|---------------------------|-----------------------------------------|
| GET    | `/api/pipeline/status`    | Current state + last run timestamp      |
| POST   | `/api/pipeline/run`       | Trigger a full pipeline run in background |
| GET    | `/api/pipeline/history`   | Last N runs (`?limit=10`)               |

---

## API Endpoints

| Method | Endpoint                  | Query Params                            | Description                                  |
|--------|---------------------------|-----------------------------------------|----------------------------------------------|
| GET    | `/api/stores`             | `city`, `limit`, `offset`               | All stores                                   |
| GET    | `/api/stores/{id}`        | —                                       | Store detail + full product list             |
| GET    | `/api/products`           | `brand`, `city`, `min_price`, `max_price` | All products with pricing                 |
| GET    | `/api/products/{id}`      | —                                       | Product detail + all stores carrying it      |
| GET    | `/api/deals`              | `city`, `limit`, `offset`               | Products currently on sale or promotion      |
| GET    | `/api/search`             | `q` (required)                          | Full-text search across products & stores    |
| GET    | `/api/stats`              | —                                       | Homepage dashboard numbers                   |

Full interactive docs available at `/docs` (Swagger UI) once the backend is running.

---

## Frontend Pages

| Route            | Description                                            |
|------------------|--------------------------------------------------------|
| `/`              | Homepage — stats, hot deals, nearby stores, search     |
| `/products`      | Browsable product grid with brand / city / price filters |
| `/products/[id]` | Product detail — price comparison across all stores    |
| `/stores`        | Store list — filterable by city                        |
| `/stores/[id]`   | Store profile — contact info, hours, product list      |
| `/deals`         | All active sales, sorted by city                       |
| `/search`        | Keyword search results for products and stores         |

---

## Team Access

1. Create a GitHub repository and push all code.
2. Organize with `/frontend` and `/backend` at the root.
3. Add team members as collaborators and set branch protection on `main`.

---

*Confidential — MontKailash Cannabis · Internal Project*
