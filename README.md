# Cannabis Price Comparison & Store Discovery Platform

Burlington, Ontario · 35 km radius · Licensed Retailers

## Overview

Full-stack web platform to compare cannabis product prices across licensed AGCO retailers near Burlington, ON.

| Layer    | Tech                              |
|----------|-----------------------------------|
| Frontend | Next.js 14 / React 18             |
| Backend  | Python FastAPI + Swagger/OpenAPI  |
| Database | PostgreSQL (`cannabis_db`)        |

---

## Repository Structure

```
cannabis-platform/
├── backend/
│   ├── main.py          # FastAPI app — all 6 API endpoints
│   ├── database.py      # PostgreSQL connection pool
│   ├── requirements.txt
│   └── README.md
└── frontend/
    ├── pages/
    │   ├── index.js          # Homepage — featured deals, stats, nearby stores
    │   ├── products/
    │   │   ├── index.js      # Product listings with brand/city/price filters
    │   │   └── [id].js       # Product detail — all stores carrying it
    │   ├── stores/
    │   │   ├── index.js      # Store listings with city filter
    │   │   └── [id].js       # Store detail — full info + product list
    │   ├── deals.js          # All active sales & promotions
    │   └── search.js         # Keyword search across products & stores
    ├── components/
    │   └── Navbar.js
    ├── styles/
    │   └── globals.css
    ├── next.config.js
    └── package.json
```

---

## Quick Start

### 1. Prerequisites

- PostgreSQL running with `cannabis_db` populated (run the data pipeline first)
- Node.js 18+
- Python 3.11+

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Swagger UI → http://localhost:8000/docs  
ReDoc     → http://localhost:8000/redoc

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App → http://localhost:3000

---

## API Endpoints

| Method | Endpoint                  | Description                                  |
|--------|---------------------------|----------------------------------------------|
| GET    | `/api/stores`             | All stores (filter: city)                    |
| GET    | `/api/stores/{id}`        | Store detail + its full product list         |
| GET    | `/api/products`           | All products (filter: brand, city, price)    |
| GET    | `/api/products/{id}`      | Product detail + all stores carrying it      |
| GET    | `/api/deals`              | Products currently on sale (filter: city)    |
| GET    | `/api/search?q=keyword`   | Full-text search across products & stores    |
| GET    | `/api/stats`              | Homepage dashboard numbers                   |

---

## Frontend Pages

| Route               | Description                                           |
|---------------------|-------------------------------------------------------|
| `/`                 | Homepage — stats, hot deals, nearby stores, search   |
| `/products`         | Browsable product grid with brand/city/price filters |
| `/products/[id]`    | Product detail — prices at every carrying store      |
| `/stores`           | Store list — filterable by city                      |
| `/stores/[id]`      | Store profile — contact info, hours, product list    |
| `/deals`            | All active sales, sorted by city                     |
| `/search`           | Keyword search results                               |

---

## Environment Variables

Create `frontend/.env.local`:

```
API_BASE=http://localhost:8000
```

For production deployment update `API_BASE` to your hosted backend URL.

---

## Team Access

Share the GitHub repository with all team members and set branch protection on `main`.

---

*Confidential — MontKailash Cannabis · Internal Project*
