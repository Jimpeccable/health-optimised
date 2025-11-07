import { useEffect, useState } from 'react';
import { loadSuppliers, SUPPLIERS_EVENT } from '../data/suppliers.js';

export default function Ratings() {
  const [suppliers, setSuppliers] = useState(() => loadSuppliers());

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

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Ratings Overview</h2>
        <p className="text-sm text-gray-600">Health Optimised uses session-based anonymity. Visit a supplier profile to submit or adjust your rating.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="rounded-2xl bg-white/40 backdrop-blur border border-white/70 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-[0.2em]">{supplier.brand}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">{supplier.average_rating.toFixed(1)} ★</p>
            <p className="text-xs text-gray-500">{supplier.total_reviews}+ reviews logged.</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        Ratings displayed above update as administrators verify new data. Production builds should connect to Firestore or Supabase analytics.
      </p>
    </section>
  );
}

