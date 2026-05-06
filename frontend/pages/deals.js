import Link from 'next/link';
import { useState } from 'react';
import Navbar from '../components/Navbar';

const API = process.env.API_BASE || 'http://localhost:8000';

export async function getServerSideProps({ query }) {
  try {
    const params = new URLSearchParams({ limit: '500' });
    if (query.city) params.set('city', query.city);
    const res   = await fetch(`${API}/api/deals?${params}`);
    const data  = await res.json();
    const deals = data.deals || [];
    const cities = [...new Set(deals.map((d) => d.store_city).filter(Boolean))].sort();
    return { props: { deals, cities, activeCity: query.city || '' } };
  } catch {
    return { props: { deals: [], cities: [], activeCity: '' } };
  }
}

export default function DealsPage({ deals, cities, activeCity }) {
  const [city, setCity] = useState(activeCity);

  const applyCity = (c) => {
    setCity(c);
    window.location.href = c ? `/deals?city=${encodeURIComponent(c)}` : '/deals';
  };

  return (
    <>
      <Navbar />
      <div className="page-header">
        <div className="hero-eyebrow">🔥 Updated regularly</div>
        <h1 className="page-title">Active Deals &amp; Promotions</h1>
        <p className="page-subtitle">{deals.length} products currently on sale across Burlington &amp; surrounding areas</p>
      </div>
      <div className="container">
        {/* City pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          <button className={`btn ${!city ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 16px', fontSize: '0.85rem' }} onClick={() => applyCity('')}>All Cities</button>
          {cities.map((c) => (
            <button key={c} className={`btn ${city === c ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 16px', fontSize: '0.85rem' }} onClick={() => applyCity(c)}>{c}</button>
          ))}
        </div>

        {deals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌿</div>
            <h3>No deals right now</h3>
            <p>Check back soon — deals update frequently.</p>
          </div>
        ) : (
          <div className="card-grid" style={{ marginBottom: 60 }}>
            {deals.map((d, i) => (
              <Link href={`/products/${d.id}`} className="card deal-card" key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div className="product-brand">{d.brand || 'Unknown Brand'}</div>
                  <span className="badge badge-sale">SALE</span>
                </div>
                <div className="product-name">{d.product_name}</div>
                {d.size_format && <div className="product-size">{d.size_format}</div>}
                <div className="price-row" style={{ marginTop: 12 }}>
                  <span className="price-sale">{d.sale_price}</span>
                  <span className="price-was">{d.regular_price}</span>
                </div>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    📍 {d.store_city}
                  </span>
                  {d.promotion_duration && d.promotion_duration !== 'Not listed' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--amber)' }}>
                      Until {d.promotion_duration}
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--lime)' }}>
                  at {d.store_name}
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
