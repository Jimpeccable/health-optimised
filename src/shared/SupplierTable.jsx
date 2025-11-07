import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnonymousUserId } from '../utils/anon.js';
import { loadSuppliers, SUPPLIERS_EVENT } from '../data/suppliers.js';

function Stars({ value = 0 }) {
  const displayValue = Number.isFinite(value) ? value : 0;
  return (
    <div className="flex items-center gap-1 text-amber-400 text-lg">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < Math.round(displayValue) ? '★' : '☆'}</span>
      ))}
      <span className="text-xs text-gray-500 ml-1">{displayValue.toFixed(1)}</span>
    </div>
  );
}

export default function SupplierTable() {
  const [query, setQuery] = useState('');
  const [suppliers, setSuppliers] = useState(() => loadSuppliers());
  const [revealed, setRevealed] = useState({});
  const [userRatings, setUserRatings] = useState({});
  const anonId = useMemo(() => getAnonymousUserId(), []);

  useEffect(() => {
    if (typeof window === 'undefined') return () => {};
    const handleUpdate = (event) => {
      const next = Array.isArray(event?.detail) ? event.detail : loadSuppliers();
      setSuppliers(next);
    };
    window.addEventListener(SUPPLIERS_EVENT, handleUpdate);
    return () => window.removeEventListener(SUPPLIERS_EVENT, handleUpdate);
  }, []);

  useEffect(() => {
    setSuppliers(loadSuppliers());
  }, []);

  useEffect(() => {
    const entries = {};
    suppliers.forEach((supplier) => {
      try {
        const raw = localStorage.getItem(`ratings:${supplier.id}:${anonId}`);
        if (!raw) return;
        const rating = JSON.parse(raw);
        const overall =
          rating.overall || (rating.quality + rating.communication + rating.delivery_time) / 3 || 0;
        entries[supplier.id] = overall;
      } catch (error) {
        // ignore JSON parse errors
      }
    });
    setUserRatings(entries);
  }, [anonId, suppliers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((supplier) =>
      [supplier.brand, supplier.website, supplier.discount_code, supplier.offer_details, supplier.verification_notes]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [query, suppliers]);

  const toggleReveal = (id) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const hostname = (url) => {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return url;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          className="w-full md:w-96 border border-transparent bg-white/60 backdrop-blur px-4 py-2 rounded-full shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder="Search suppliers, discount codes, or notes..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <p className="text-xs text-gray-500">All ratings are anonymised per session.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((supplier) => (
          <div
            key={supplier.id}
            className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/30 backdrop-blur-xl shadow-xl transition-transform hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-6 space-y-4">
              <header className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-emerald-500">Verified Supplier</p>
                  <h3 className="text-xl font-semibold text-gray-900">{supplier.brand}</h3>
                </div>
                <span className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  {supplier.verification_status ? 'Verified' : 'Pending'}
                </span>
              </header>

              <div className="space-y-2 text-sm text-gray-600">
                <a href={supplier.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-600 font-medium hover:underline">
                  {hostname(supplier.website)}
                </a>
                <p className="leading-relaxed">{supplier.verification_notes}</p>
                <p className="text-xs text-gray-500">Verified by {supplier.verified_by} on {supplier.date_verified}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Community rating</span>
                  <Stars value={supplier.average_rating} />
                </div>
                <p className="text-xs text-gray-500">Based on {supplier.total_reviews}+ verified research ratings</p>
                {userRatings[supplier.id] && (
                  <p className="text-xs text-emerald-600">Your saved overall rating: {userRatings[supplier.id].toFixed(1)} ★</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => toggleReveal(supplier.id)}
                  className="w-full inline-flex items-center justify-between gap-2 rounded-full border border-white/80 bg-white/40 px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-white/70"
                >
                  <span>Discount access</span>
                  <span className="text-xs text-emerald-600">
                    {revealed[supplier.id] ? supplier.discount_code || 'None' : 'Click to reveal'}
                  </span>
                </button>
                {revealed[supplier.id] && supplier.offer_details && (
                  <p className="text-xs text-gray-500">{supplier.offer_details}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Link
                  to={`/suppliers/${supplier.id}`}
                  className="flex-1 inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600"
                >
                  Rate supplier
                </Link>
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/40 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white/70"
                >
                  Visit
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

