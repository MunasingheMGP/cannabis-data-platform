import Link from 'next/link';
import Navbar from '../../components/Navbar';

const API = process.env.API_BASE || 'http://localhost:8000';

export async function getServerSideProps({ params }) {
  try {
    const res  = await fetch(`${API}/api/products/${params.id}`);
    if (!res.ok) return { notFound: true };
    const product = await res.json();
    return { props: { product } };
  } catch {
    return { notFound: true };
  }
}

export default function ProductDetail({ product }) {
  const cheapest = product.stores?.reduce((best, s) => {
    const price = parseFloat(String(s.sale_price || s.regular_price || '').replace('$', ''));
    return (!best || price < best.price) ? { ...s, price } : best;
  }, null);

  return (
    <>
      <Navbar />
      <div className="page-header">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep">/</span>
          <Link href="/products">Products</Link>
          <span className="breadcrumb-sep">/</span>
          <span>{product.product_name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="product-brand" style={{ fontSize: '0.9rem', marginBottom: 6 }}>{product.brand}</div>
            <h1 className="page-title" style={{ marginBottom: 8 }}>{product.product_name}</h1>
            {product.stores?.[0]?.regular_price && (
              <div className="price-row">
                {product.stores[0].sale_price ? (
                  <>
                    <span className="price-sale" style={{ fontSize: '1.6rem' }}>{product.stores[0].sale_price}</span>
                    <span className="price-was" style={{ fontSize: '1rem' }}>{product.stores[0].regular_price}</span>
                    <span className="badge badge-sale">ON SALE</span>
                  </>
                ) : (
                  <span className="price-regular" style={{ fontSize: '1.6rem' }}>{product.lowest_price}</span>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span className="badge badge-green">Available at {product.store_count} stores</span>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* STORES TABLE */}
        <div>
          <div className="info-panel">
            <div className="info-panel-title">Where to buy</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>City</th>
                  <th>Regular</th>
                  <th>Sale</th>
                  <th>Promo Until</th>
                </tr>
              </thead>
              <tbody>
                {product.stores?.map((s, i) => (
                  <tr key={i} style={s.store_id === cheapest?.store_id ? { background: 'rgba(82,183,136,0.06)' } : {}}>
                    <td>
                      <Link href={`/stores/${s.store_id}`}>{s.store_name}</Link>
                      {s.store_id === cheapest?.store_id && (
                        <span className="badge badge-green" style={{ marginLeft: 8 }}>Best price</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{s.store_city}</td>
                    <td>{s.regular_price || '—'}</td>
                    <td>{s.sale_price ? <span style={{ color: 'var(--amber)' }}>{s.sale_price}</span> : '—'}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                      {s.promotion_duration && s.promotion_duration !== 'Not listed' ? s.promotion_duration : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="detail-sidebar">
          <div className="info-panel">
            <div className="info-panel-title">Product Info</div>
            <div className="info-row"><span className="info-key">Brand</span><span className="info-val">{product.brand || '—'}</span></div>
            <div className="info-row"><span className="info-key">Size</span><span className="info-val">{product.stores?.[0]?.size_format || '—'}</span></div>
            <div className="info-row"><span className="info-key">Lowest price</span><span className="info-val" style={{ color: 'var(--lime)' }}>{product.lowest_price || '—'}</span></div>
            <div className="info-row"><span className="info-key">Carried by</span><span className="info-val">{product.store_count} stores</span></div>
          </div>
          <Link href="/products" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
            ← Back to Products
          </Link>
        </div>
      </div>

      <footer>
        <p>GreenLeaf · <Link href="/">Home</Link></p>
      </footer>
    </>
  );
}
