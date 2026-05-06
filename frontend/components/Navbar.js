import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (q.trim().length > 1) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  const isActive = (path) => router.pathname === path || router.pathname.startsWith(path + '/');

  return (
    <nav>
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          Green<span>Leaf</span>
        </Link>
        <ul className="nav-links">
          <li><Link href="/products" className={isActive('/products') ? 'active' : ''}>Products</Link></li>
          <li><Link href="/stores"   className={isActive('/stores')   ? 'active' : ''}>Stores</Link></li>
          <li><Link href="/deals"    className={isActive('/deals')    ? 'active' : ''}>🔥 Deals</Link></li>
        </ul>
        <form onSubmit={handleSearch} className="nav-search">
          <span className="nav-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search products, stores…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
      </div>
    </nav>
  );
}
