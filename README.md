# Cannabis Price Comparison & Store Discovery Platform

> Burlington, Ontario · 35 km radius · Licensed AGCO Retailers

A full-stack web platform that lets users compare cannabis product prices across licensed retailers near Burlington, ON. Data is collected automatically through a multi-step backend pipeline and served via a REST API to a Next.js frontend.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
  - [1. PostgreSQL Database](#1-postgresql-database)
  - [2. Backend (FastAPI)](#2-backend-fastapi)
  - [3. Data Pipeline](#3-data-pipeline)
  - [4. Frontend (Next.js)](#4-frontend-nextjs)
- [Data Pipeline](#data-pipeline)
  - [Pipeline Steps](#pipeline-steps)
  - [Database Tables](#database-tables)
  - [Running the Pipeline](#running-the-pipeline)
  - [Automated Scheduling](#automated-scheduling)
- [API Reference](#api-reference)
  - [Stores](#stores)
  - [Products](#products)
  - [Deals](#deals)
  - [Search](#search)
  - [Stats](#stats)
  - [Pipeline Management](#pipeline-management)
- [Frontend Pages](#frontend-pages)
- [Environment Variables](#environment-variables)
- [Team Access](#team-access)

---

## Project Overview

This platform solves the problem of fragmented cannabis pricing across dozens of licensed Ontario retailers. Users can:

- **Browse and compare** product prices across all stores in the Burlington area
- **Find the best deals** on products currently on sale or promotion
- **Discover nearby stores** with full contact info and hours
- **Search** across products and stores by keyword

The backend pipeline runs automatically every 24 hours, pulling fresh store and product data from AGCO, competitor sites, and market sources, then enriching it with contact details and Reddit sentiment scoring.

---

## Tech Stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Frontend  | Next.js 14 / React 18                         |
| Backend   | Python FastAPI + Swagger / OpenAPI            |
| Database  | PostgreSQL (`cannabis_db`)                    |
| Scheduler | APScheduler (background, interval-based)      |
| Pipeline  | Python scripts (SQLAlchemy + BeautifulSoup)   |

---

## Repository Structure

```
cannabis-platform/
├── README.md
├── .gitignore
│
├── backend/
│   ├── main.py               # FastAPI app — all API endpoints + pipeline triggers
│   ├── database.py           # PostgreSQL connection pool (psycopg2)
│   ├── scheduler.py          # APScheduler — runs pipeline every 24 h
│   ├── requirements.txt      # Python dependencies
│   ├── README.md             # Backend-specific notes
│   │
│   └── pipeline/             # 6-step data collection pipeline
│       ├── __init__.py
│       ├── run_all.py                    # Manual runner — executes all 6 steps in order
│       ├── db_config.py                  # SQLAlchemy engine config
│       ├── fetch_stores_agco.py          # Step 1 — pull store list from AGCO
│       ├── enrich_store_contacts.py      # Step 2 — add phone numbers & hours
│       ├── scrape_competitor_products.py # Step 3 — scrape product & pricing data
│       ├── compare_market_prices.py      # Step 4 — compare vs HiBuddy & OCS
│       ├── reddit_sentiment_analytics.py # Step 5 — Reddit sentiment analysis
│       └── score_product_insights.py     # Step 6 — score & rank products
│
└── frontend/
    ├── package.json
    ├── next.config.js
    │
    ├── pages/
    │   ├── _app.js               # Global app wrapper
    │   ├── index.js              # Homepage — stats, hot deals, nearby stores
    │   ├── deals.js              # All active sales & promotions
    │   ├── search.js             # Keyword search results
    │   ├── 404.js                # Custom 404 page
    │   ├── products/
    │   │   ├── index.js          # Product listings — brand/city/price filters
    │   │   └── [id].js           # Product detail — all stores carrying it
    │   └── stores/
    │       ├── index.js          # Store listings — filterable by city
    │       └── [id].js           # Store detail — contact info + product list
    │
    ├── components/
    │   └── Navbar.js             # Shared navigation bar
    │
    └── styles/
        └── globals.css           # Global styles
```

---

## Prerequisites

Before running anything, make sure you have the following installed:

| Tool       | Minimum Version | Purpose                  |
|------------|-----------------|--------------------------|
| PostgreSQL | 14+             | Primary database         |
| Python     | 3.11+           | Backend & pipeline       |
| Node.js    | 18+             | Frontend (Next.js)       |
| npm        | 9+              | Frontend package manager |

---

## Setup & Installation

### 1. PostgreSQL Database

Create the database. The pipeline scripts will create all required tables automatically on first run.

```bash
createdb cannabis_db
```

Default connection settings (configured in `backend/database.py` and `backend/pipeline/db_config.py`):

| Setting  | Default     |
|----------|-------------|
| Host     | localhost   |
| Port     | 5432        |
| Database | cannabis_db |
| User     | postgres    |
| Password | pgadmin     |

> **Note:** To use different credentials, update `DB_CONFIG` in `backend/database.py` and the equivalent config in `backend/pipeline/db_config.py`, or set the `DATABASE_URL` environment variable.

---

### 2. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Once running:

| URL                          | Description              |
|------------------------------|--------------------------|
| http://localhost:8000/docs   | Swagger UI (interactive) |
| http://localhost:8000/redoc  | ReDoc API docs           |
| http://localhost:8000/       | Health check             |

---

### 3. Data Pipeline

The pipeline must be run **at least once** before the frontend has any data to display.

**Option A — Run all steps manually:**

```bash
cd backend/pipeline
python run_all.py
```

This runs all 6 steps in sequence, printing progress and a table summary when complete.

**Option B — Trigger via API (after backend is running):**

```bash
curl -X POST http://localhost:8000/api/pipeline/run
```

Then poll for status:

```bash
curl http://localhost:8000/api/pipeline/status
```

---

### 4. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

App is available at → http://localhost:3000

---

## Data Pipeline

The pipeline is the heart of the platform. It collects, enriches, and scores all store and product data automatically.

### Pipeline Steps

| Step | Script                          | What It Does                                                                 |
|------|---------------------------------|------------------------------------------------------------------------------|
| 1    | `fetch_stores_agco.py`          | Pulls the full list of licensed cannabis retailers from the AGCO registry; filters to Burlington area within 35 km radius; writes to `stores_master` |
| 2    | `enrich_store_contacts.py`      | Enriches each store record with phone numbers and hours of operation; updates `stores_master` |
| 3    | `scrape_competitor_products.py` | Scrapes product names, brands, sizes, regular prices, and sale prices from competitor retailer sites; writes to `products_pricing_snapshot` and `bbfyb_stores` |
| 4    | `compare_market_prices.py`      | Pulls pricing data from HiBuddy and OCS for market comparison; writes to `hibuddy_raw`, `ocs_raw`, and `market_comparison` |
| 5    | `reddit_sentiment_analytics.py` | Fetches Reddit posts mentioning local brands/products; calculates sentiment scores; builds analytics summary in `reddit_sentiment_raw` and `business_analytics_summary` |
| 6    | `score_product_insights.py`     | Scores each product using price, sentiment, and deal data; writes ranked actionable insights to `executive_actionable_insights` |

### Database Tables

| Table                          | Created By  | Description                                           |
|--------------------------------|-------------|-------------------------------------------------------|
| `stores_master`                | Steps 1 & 2 | All licensed stores with address, hours, contacts     |
| `products_pricing_snapshot`    | Step 3      | All products with regular/sale price per store        |
| `bbfyb_stores`                 | Step 3      | Competitor store index                                |
| `hibuddy_raw`                  | Step 4      | Raw pricing data scraped from HiBuddy                 |
| `ocs_raw`                      | Step 4      | Raw pricing data from OCS                             |
| `market_comparison`            | Step 4      | Side-by-side price comparison per product             |
| `reddit_sentiment_raw`         | Step 5      | Raw Reddit posts and sentiment scores per brand       |
| `business_analytics_summary`   | Step 5      | Aggregated brand-level analytics                      |
| `executive_actionable_insights`| Step 6      | Final scored & ranked product insights                |
| `pipeline_run_log`             | Scheduler   | History of every pipeline run with timing & status    |

### Running the Pipeline

**Manually (development):**

```bash
cd backend/pipeline
python run_all.py
```

**Via API (production or testing):**

```bash
# Trigger a run
curl -X POST http://localhost:8000/api/pipeline/run

# Check live status
curl http://localhost:8000/api/pipeline/status

# View run history (last 10 runs)
curl http://localhost:8000/api/pipeline/history
```

**Run a single step (for debugging):**

```bash
cd backend/pipeline
python fetch_stores_agco.py
python enrich_store_contacts.py
python scrape_competitor_products.py
python compare_market_prices.py
python reddit_sentiment_analytics.py
python score_product_insights.py
```

### Automated Scheduling

When the FastAPI backend starts, it automatically launches a background scheduler that re-runs the full pipeline every **24 hours**. This keeps store and product data fresh without manual intervention.

To change the interval, set the environment variable before starting the backend:

```bash
PIPELINE_INTERVAL_HOURS=12 uvicorn main:app --reload --port 8000
```

---

## API Reference

All endpoints return JSON. No authentication required. Full interactive docs at `/docs`.

### Stores

#### `GET /api/stores`

Returns all licensed stores within 35 km of Burlington.

| Query Param | Type    | Description                     |
|-------------|---------|---------------------------------|
| `city`      | string  | Filter by city name (optional)  |
| `limit`     | integer | Max results (default 100)       |
| `offset`    | integer | Pagination offset (default 0)   |

**Response:**
```json
{
  "total": 42,
  "stores": [
    {
      "id": "the-joint-burlington",
      "store_name": "The Joint Burlington",
      "address": "123 Main St",
      "city": "Burlington",
      "postal_code": "L7R 1A1",
      "phone_number": "905-555-0100",
      "hours_of_operation": "Mon-Sun 10am-10pm",
      "owner_details": "...",
      "website": "https://...",
      "distance_km": 1.2
    }
  ]
}
```

---

#### `GET /api/stores/{store_id}`

Returns full details for a single store plus all products it currently carries.

**Response:**
```json
{
  "id": "the-joint-burlington",
  "store_name": "The Joint Burlington",
  "address": "...",
  "products": [
    {
      "product_name": "Blue Dream Pre-Roll",
      "brand": "FIGR",
      "size_format": "1g",
      "regular_price": "$9.99",
      "sale_price": "$7.99",
      "promotion_duration": "Until June 30"
    }
  ]
}
```

---

### Products

#### `GET /api/products`

Returns all products with pricing info across all stores.

| Query Param | Type   | Description                            |
|-------------|--------|----------------------------------------|
| `brand`     | string | Filter by brand name (partial match)   |
| `city`      | string | Filter by store city                   |
| `min_price` | float  | Minimum regular price                  |
| `max_price` | float  | Maximum regular price                  |
| `limit`     | int    | Max results (default 100, max 1000)    |
| `offset`    | int    | Pagination offset                      |

---

#### `GET /api/products/{product_id}`

Returns product info and every store currently carrying it with their prices.

**Response:**
```json
{
  "id": "blue-dream-pre-roll",
  "product_name": "Blue Dream Pre-Roll",
  "brand": "FIGR",
  "size_format": "1g",
  "lowest_price": "$7.99",
  "store_count": 5,
  "stores": [
    {
      "store_id": "the-joint-burlington",
      "store_name": "The Joint Burlington",
      "store_city": "Burlington",
      "regular_price": "$9.99",
      "sale_price": "$7.99",
      "promotion_duration": "Until June 30"
    }
  ]
}
```

---

### Deals

#### `GET /api/deals`

Returns all products currently on sale or promotion.

| Query Param | Type   | Description           |
|-------------|--------|-----------------------|
| `city`      | string | Filter by store city  |
| `limit`     | int    | Max results           |
| `offset`    | int    | Pagination offset     |

---

### Search

#### `GET /api/search?q={keyword}`

Searches both products (by name, brand) and stores (by name, city, address). Returns matched products and stores separately.

| Query Param | Type   | Required | Description              |
|-------------|--------|----------|--------------------------|
| `q`         | string | Yes      | Search keyword (min 2 chars) |
| `limit`     | int    | No       | Max results per category |

**Response:**
```json
{
  "query": "blue dream",
  "total_products": 3,
  "total_stores": 0,
  "products": [...],
  "stores": []
}
```

---

### Stats

#### `GET /api/stats`

Returns summary numbers used on the homepage dashboard.

**Response:**
```json
{
  "stores": 42,
  "products": 1250,
  "brands": 87,
  "deals": 134,
  "cities": 8
}
```

---

### Pipeline Management

#### `GET /api/pipeline/status`

Returns the live pipeline state (if currently running) plus the last persisted run from the database.

#### `POST /api/pipeline/run`

Triggers a full pipeline run in the background. Returns `202 Accepted` immediately. Poll `/api/pipeline/status` for progress. Returns `409 Conflict` if a run is already in progress.

#### `GET /api/pipeline/history?limit=10`

Returns the most recent pipeline run records with timing, step results, and any error messages.

---

## Frontend Pages

| Route            | Description                                              |
|------------------|----------------------------------------------------------|
| `/`              | Homepage — platform stats, hot deals, nearby stores, search bar |
| `/products`      | Browsable product grid with brand, city, and price filters |
| `/products/[id]` | Product detail — prices at every store carrying this product |
| `/stores`        | Store list — filterable by city                          |
| `/stores/[id]`   | Store profile — contact info, hours, and full product list |
| `/deals`         | All active sales and promotions, sorted by city          |
| `/search`        | Keyword search results across products and stores        |

---

## Environment Variables

Create a `.env.local` file inside the `frontend/` folder:

```env
API_BASE=http://localhost:8000
```

For production, update `API_BASE` to point to your hosted backend URL (e.g., `https://api.yourplatform.com`).

---

## Team Access

1. Create a GitHub repository and push this codebase
2. Go to **Settings → Collaborators** and invite all team members
3. Recommended: enable branch protection on `main` (require pull request reviews before merging)

```bash
# First push
git init
git add .
git commit -m "Initial commit — Cannabis Platform"
git remote add origin https://github.com/your-org/cannabis-platform.git
git push -u origin main
```

---

*Confidential — MontKailash Cannabis · Internal Project*
