import { useEffect, useMemo, useState } from 'react';
import { getAnonymousUserId } from '../utils/anon.js';

const CATEGORIES = [
  { key: 'quality', label: 'Product Quality' },
  { key: 'communication', label: 'Communication' },
  { key: 'delivery_time', label: 'Delivery Time' },
  { key: 'overall', label: 'Overall Satisfaction' },
];

function Star({ filled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={(filled ? 'text-amber-500' : 'text-gray-300') + ' text-2xl hover:scale-110 transition-transform'}
      aria-label={filled ? 'star filled' : 'star empty'}
    >
      ★
    </button>
  );
}

export default function RatingStars({ supplierId }) {
  const anonId = useMemo(() => getAnonymousUserId(), []);
  const storageKey = `ratings:${supplierId}:${anonId}`;
  const [ratings, setRatings] = useState({ quality: 0, communication: 0, delivery_time: 0, overall: 0 });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setRatings(JSON.parse(saved));
    } catch {}
  }, [storageKey]);

  function setCategory(key, value) {
    const next = { ...ratings, [key]: value };
    setRatings(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  }

  return (
    <div className="space-y-4">
      {CATEGORIES.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-3">
          <span className="w-48 text-sm text-gray-700">{label}</span>
          <div className="flex gap-1">
            {[1,2,3,4,5].map((n) => (
              <Star key={n} filled={ratings[key] >= n} onClick={() => setCategory(key, n)} />
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-gray-500">Stored anonymously in this browser session.</p>
    </div>
  );
}

