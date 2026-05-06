import Link from 'next/link';
import { useState } from 'react';
import Navbar from '../../components/Navbar';

const API = process.env.API_BASE || 'http://localhost:8000';

export async function getServerSideProps({ query }) {
  try {
    const params = new URLSearchParams({ limit: '200' });
    if (query.city) params.set('city', query.city);
    const res    = await fetch(`${API}/api/stores?${params}`);
    const data   = await res.json();
    const stores = data.stores || [];
    const cities = [...new Set(stores.map((s) => s.city).filter(Boolean))].sort();
    return { props: { stores, cities, activeCity: query.city || '' } };
  } catch {
    return { props: { stores: [], cities: [], activeCity: '' } };
  }
}

export default function StoresPage({ stores, cities, activeCity }) {
  const [city, setCity] = useState(activeCity);

  const applyCity = (c) => {
    setCity(c);
    window.location.href = c ? `/stores?city=${encodeURIComponent(c)}` : '/stores';
  };

  return (
    <>
      <Navbar />
      <div className="page-header">
        <h1 className="page-title">Licensed Stores</h1>
        <p className="page-subtitle">{stores.length} stores within 35 km of Burlington, ON</p>
      </div>
      <div className="container">
        {/* City filter pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          <button
            className={`btn ${!city ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 16px', fontSize: '0.85rem' }}
            onClick={() => applyCity('')}
          >All</button>
          {cities.map((c) => (
            <button
              key={c}
              className={`btn ${city === c ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 16px', fontSize: '0.85rem' }}
              onClick={() => applyCity(c)}
            >{c}</button>
          ))}
        </div>

        {stores.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏪</div>
            <h3>No stores found</h3>
          </div>
        ) : (
          <div className="card-grid" style={{ marginBottom: 60 }}>
            {stores.map((s, i) => (
              <Link href={`/stores/${s.id}`} className="card" key={i}>
                <div className="store-card-name">{s.store_name}</div>
                <div className="store-meta">
                  <span>📍 {s.address}, {s.city} {s.postal_code}</span>
                  {s.phone_number && s.phone_number !== 'Not listed' && (
                    <span>📞 {s.phone_number}</span>
                  )}
                  {s.hours_of_operation && s.hours_of_operation !== 'Not listed' && s.hours_of_operation !== 'Pending' && (
                    <span>🕐 {s.hours_of_operation.slice(0, 60)}{s.hours_of_operation.length > 60 ? '…' : ''}</span>
                  )}
                </div>
                <div style={{ marginTop: 14 }}>
                  <span className="badge badge-green">{s.distance_km} km away</span>
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
