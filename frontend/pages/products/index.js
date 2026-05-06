import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';

const API = process.env.API_BASE || 'http://localhost:8000';

export async function getServerSideProps({ query }) {
  const params = new URLSearchParams();
  if (query.brand)     params.set('brand', query.brand);
  if (query.city)      params.set('city', query.city);
  if (query.min_price) params.set('min_price', query.min_price);
  if (query.max_price) params.set('max_price', query.max_price);
  params.set('limit', '200');

  try {
    const res      = await fetch(`${API}/api/products?${params}`);
    const data     = await res.json();
    const products = data.products || [];

    // derive unique brands + cities for filter dropdowns
    const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
    const cities  = [...new Set(products.map((p) => p.store_city).filter(Boolean))].sort();

    return { props: { products, brands, cities, filters: query } };
  } catch {
    return { props: { products: [], brands: [], cities: [], filters: {} } };
  }
}

export default function ProductsPage({ products, brands, cities, filters }) {
  const [brand,    setBrand]    = useState(filters.brand    || '');
  const [city,     setCity]     = useState(filters.city     || '');
  const [minPrice, setMinPrice] = useState(filters.min_price || '');
  const [maxPrice, setMaxPrice] = useState(filters.max_price || '');

  const applyFilters = () => {
    const p = new URLSearchParams();
    if (brand)    p.set('brand', brand);
    if (city)     p.set('city', city);
    if (minPrice) p.set('min_price', minPrice);
    if (maxPrice) p.set('max_price', maxPrice);
    window.location.href = `/products?${p}`;
  };

  const clearFilters = () => { window.location.href = '/products'; };

  // deduplicate by product id (show cheapest per product)
  const seen    = new Set();
  const unique  = products.filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });

  return (
    <>
      <Navbar />
      <div className="page-header">
        <h1 className="page-title">All Products</h1>
        <p className="page-subtitle">{unique.length} products across {cities.length} cities</p>
      </div>
      <div className="container">
        {/* FILTERS */}
        <div className="filter-bar">
          <div className="filter-group">
            <label className="filter-label">Brand</label>
            <select className="filter-select" value={brand} onChange={(e) => setBrand(e.target.value)}>
              <option value="">All brands</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">City</label>
            <select className="filter-select" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">All cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Min Price ($)</label>
            <input className="filter-input" type="number" placeholder="0"
              value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={{ width: 100 }} />
          </div>
          <div className="filter-group">
            <label className="filter-label">Max Price ($)</label>
            <input className="filter-input" type="number" placeholder="999"
              value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{ width: 100 }} />
          </div>
          <div className="filter-group" style={{ justifyContent: 'flex-end', marginLeft: 'auto' }}>
            <label className="filter-label">&nbsp;</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={applyFilters}>Apply</button>
              <button className="btn btn-outline" onClick={clearFilters}>Clear</button>
            </div>
          </div>
        </div>

        {/* GRID */}
        {unique.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌿</div>
            <h3>No products found</h3>
            <p>Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="card-grid" style={{ marginBottom: 60 }}>
            {unique.map((p, i) => (
              <Link href={`/products/${p.id}`} className="card" key={i}>
                <div className="product-brand">{p.brand || 'Unknown Brand'}</div>
                <div className="product-name">{p.product_name}</div>
                {p.size_format && <div className="product-size">{p.size_format}</div>}
                <div className="price-row">
                  {p.sale_price ? (
                    <>
                      <span className="price-sale">{p.sale_price}</span>
                      <span className="price-was">{p.regular_price}</span>
                      <span className="badge badge-sale">SALE</span>
                    </>
                  ) : (
                    <span className="price-regular">{p.regular_price || '—'}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <footer>
        <p>GreenLeaf · <Link href="/">Home</Link></p>
      </footer>
    </>
  );
}
