# Backend — FastAPI + Auto-Pipeline

## Project structure

```
backend/
├── main.py            ← FastAPI app (includes pipeline API endpoints)
├── database.py        ← psycopg2 connection pool for FastAPI queries
├── scheduler.py       ← APScheduler: auto-runs pipeline every N hours
├── requirements.txt
└── pipeline/          ← Data collection scripts
    ├── db_config.py
    ├── fetch_stores_agco.py
    ├── enrich_store_contacts.py
    ├── scrape_competitor_products.py
    ├── compare_market_prices.py
    ├── reddit_sentiment_analytics.py
    ├── score_product_insights.py
    └── run_all.py
```

## Setup

```bash
pip install -r requirements.txt
createdb cannabis_db   # if not yet created
uvicorn main:app --reload --port 8000
```

Pipeline auto-runs every **24 hours**. To change:

```bash
PIPELINE_INTERVAL_HOURS=12 uvicorn main:app --port 8000
```

## Pipeline API endpoints

| Endpoint                | Method | Description                               |
|-------------------------|--------|-------------------------------------------|
| /api/pipeline/status    | GET    | Live state + last DB run                  |
| /api/pipeline/run       | POST   | Trigger full pipeline in background       |
| /api/pipeline/history   | GET    | Last N runs (?limit=10)                   |

## Run pipeline manually (CLI)

```bash
cd backend/pipeline
python run_all.py
```

## Other API endpoints

| Endpoint                | Query params                              |
|-------------------------|-------------------------------------------|
| GET /api/stores         | city, limit, offset                       |
| GET /api/stores/{id}    | —                                         |
| GET /api/products       | brand, city, min_price, max_price         |
| GET /api/products/{id}  | —                                         |
| GET /api/deals          | city, limit, offset                       |
| GET /api/search         | q (required)                              |
| GET /api/stats          | —                                         |

- Swagger UI → http://localhost:8000/docs
- ReDoc      → http://localhost:8000/redoc
