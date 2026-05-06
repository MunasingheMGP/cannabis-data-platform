import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="empty-state" style={{ marginTop: 80 }}>
        <div className="empty-icon">🍃</div>
        <h3>Page not found</h3>
        <p style={{ marginBottom: 24 }}>The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="btn btn-primary">Go Home</Link>
      </div>
    </>
  );
}
