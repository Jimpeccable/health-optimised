import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import RatingStars from '../shared/RatingStars.jsx';
import { loadSuppliers, SUPPLIERS_EVENT } from '../data/suppliers.js';
import { getAnonymousUserId } from '../utils/anon.js';

export default function SupplierDetail() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(() => loadSuppliers().find((entry) => entry.id === id));
  const [showCode, setShowCode] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const anonId = useMemo(() => getAnonymousUserId(), []);

  useEffect(() => {
    const refresh = () => {
      const next = loadSuppliers().find((entry) => entry.id === id);
      setSupplier(next || null);
    };
    refresh();
    if (typeof window === 'undefined') return () => {};
    const handler = (event) => {
      const list = Array.isArray(event?.detail) ? event.detail : loadSuppliers();
      const next = list.find((entry) => entry.id === id);
      setSupplier(next || null);
    };
    window.addEventListener(SUPPLIERS_EVENT, handler);
    return () => window.removeEventListener(SUPPLIERS_EVENT, handler);
  }, [id]);

  useEffect(() => {
    if (!supplier) return;
    try {
      const stored = localStorage.getItem(`ratings:${supplier.id}:${anonId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserRating(parsed);
      } else {
        setUserRating(null);
      }
    } catch (error) {
      setUserRating(null);
    }
  }, [supplier, anonId]);

  if (!supplier) {
    return (
      <section className="space-y-4 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Supplier not found</h2>
        <p className="text-gray-600">Return to the directory to explore verified suppliers.</p>
        <Link to="/suppliers" className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600">
          Back to suppliers
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header className="space-y-2 text-center">
        <span className="inline-flex px-3 py-1 rounded-full text-xs uppercase tracking-wider bg-emerald-100 text-emerald-600">Verified supplier</span>
        <h2 className="text-3xl font-semibold text-gray-900">{supplier.brand}</h2>
        <p className="text-sm text-gray-500">Profile curated by Health Optimised. Research use only.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 bg-white/30 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-lg">
          <p className="text-sm text-gray-600 leading-relaxed">{supplier.verification_notes}</p>
          <p className="text-xs text-gray-500">Verified by {supplier.verified_by} on {supplier.date_verified}</p>
          <a href={supplier.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gray-900/90 px-4 py-2 text-sm text-white font-medium shadow hover:bg-black">
            Visit supplier site
          </a>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-gray-700">
              <span className="font-medium">Community rating</span>
              <span className="text-emerald-600 font-semibold">{supplier.average_rating.toFixed(1)} ★</span>
            </div>
            <p className="text-xs text-gray-500">Drawn from {supplier.total_reviews}+ researcher submissions.</p>
            {userRating?.overall && (
              <p className="text-xs text-emerald-600">Your stored overall rating: {userRating.overall.toFixed(1)} ★</p>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setShowCode((prev) => !prev)}
              className="w-full inline-flex items-center justify-between rounded-full border border-white/70 bg-white/40 px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-white/70"
            >
              <span>Discount access</span>
              <span className="text-xs text-emerald-600">{showCode ? supplier.discount_code || 'None' : 'Click to reveal'}</span>
            </button>
            {showCode && supplier.offer_details && (
              <p className="text-xs text-gray-500">{supplier.offer_details}</p>
            )}
          </div>
        </div>

        <div className="space-y-4 bg-white/30 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-lg" id="rate">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Rate this supplier</h3>
            <button
              onClick={() => document.getElementById('rate')?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-full border border-white/70 bg-white/50 px-3 py-1 text-xs uppercase tracking-wide text-gray-700"
            >
              Rate now
            </button>
          </div>
          <p className="text-xs text-gray-500">Ratings are saved anonymously inside this browser session.</p>
          <RatingStars supplierId={supplier.id} />
        </div>
      </div>
    </section>
  );
}

