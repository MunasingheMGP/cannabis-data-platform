import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../components/Navbar';

const API = process.env.API_BASE || 'http://localhost:8000';

export async function getServerSideProps({ query }) {
  const q = query.q || '';
  if (!q || q.length < 2) return { props: { results: null, q: '' } };

  try {
    const res     = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`);
    const results = await res.json();
    return { props: { results, q } };
  } catch {
    return { props: { results: null, q } };
  }
}

export default function SearchPage({ results, q }) {
  const router  = useRouter();
  const [input, setInput] = useState(q);

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.trim().length > 1) router.push(`/search?q=${encodeURIComponent(input.trim())}`);
  };

  return (
    <>
      <Navbar />
      <div className="page-header">
        <h1 className="page-title">Search</h1>
      </div>
      <div className="container">
        {/* Search input */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, maxWidth: 560, marginBottom: 40 }}>
          <input
            type="text"
            className="filter-input"
            style={{ flex: 1, fontSize: '1rem', padding: '12px 16px' }}
            placeholder="Search products, brands, stores…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        {!results && q && (
          <p style={{ color: 'var(--muted)' }}>No results found. Try a different keyword.</p>
        )}

        {results && (
          <>
            <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: '0.9rem' }}>
              Showing results for &ldquo;<strong style={{ color: 'var(--cream)' }}>{q}</strong>&rdquo; —{' '}
              {results.total_products} products, {results.total_stores} stores
            </p>

            {/* PRODUCTS */}
            {results.products?.length > 0 && (
              <div className="search-section">
                <div className="section-header">
                  <h2 className="section-title">Products</h2>
                  <span className="result-count">{results.total_products} results</span>
                </div>
                <div className="card-grid">
                  {results.products.map((p, i) => (
                    <Link href={`/products/${p.id}`} className="card" key={i}>
                      <div className="product-brand">{p.brand || 'Unknown'}</div>
                      <div className="product-name">{p.product_name}</div>
                      <div className="price-row" style={{ marginTop: 12 }}>
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
              </div>
            )}

            {/* STORES */}
            {results.stores?.length > 0 && (
              <div className="search-section" style={{ marginTop: 40 }}>
                <div className="section-header">
                  <h2 className="section-title">Stores</h2>
                  <span className="result-count">{results.total_stores} results</span>
                </div>
                <div className="card-grid">
                  {results.stores.map((s, i) => (
                    <Link href={`/stores/${s.id}`} className="card" key={i}>
                      <div className="store-card-name">{s.store_name}</div>
                      <div className="store-meta">
                        <span>📍 {s.address}, {s.city}</span>
                        {s.phone_number && s.phone_number !== 'Not listed' && (
                          <span>📞 {s.phone_number}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.total_products === 0 && results.total_stores === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No results for &ldquo;{q}&rdquo;</h3>
                <p>Try searching for a brand name, product type, or city.</p>
              </div>
            )}
          </>
        )}

        {!q && (
          <div className="empty-state">
            <div className="empty-icon">🌿</div>
            <h3>Start searching</h3>
            <p>Enter a product name, brand, or store to get started.</p>
          </div>
        )}
      </div>
      <footer style={{ marginTop: 40 }}>
        <p>GreenLeaf · <Link href="/">Home</Link></p>
      </footer>
    </>
  );
}
