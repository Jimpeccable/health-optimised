import { useEffect, useMemo, useRef, useState } from 'react';
import { loadSuppliers, saveSuppliers } from '../data/suppliers.js';
import { useAuth } from '../state/auth.jsx';

const TIMELINE_SEED = [
  {
    id: 'evt-3',
    title: 'RetaRelief COA audited',
    detail: 'Lot RR-221 cross-checked and confirmed. Packaging photos archived to compliance drive.',
    admin: 'Aurora (Admin)',
    date: '2025-11-07',
  },
  {
    id: 'evt-2',
    title: 'Researchism shipping update',
    detail: 'Delivery times validated with 3 anonymous reviewers. Tracking IDs anonymised and stored.',
    admin: 'Aurora (Admin)',
    date: '2025-11-04',
  },
  {
    id: 'evt-1',
    title: 'Ayve verification refresh',
    detail: 'New documentation uploaded. BAC water sourcing verified with supplier statement.',
    admin: 'Aurora (Admin)',
    date: '2025-11-01',
  },
];

const QUEUE_STORAGE_KEY = 'health-optimised:queue';

const QUEUE_SEED = [
  {
    id: 'queue-1',
    brand: 'Soma Labs',
    ticket: 'RQ-5842',
    submitted: '2025-11-06',
    note: 'Awaiting COA PDF upload from supplier contact.',
  },
  {
    id: 'queue-2',
    brand: 'NanoPeptide EU',
    ticket: 'RQ-5837',
    submitted: '2025-11-05',
    note: 'Need follow-up on customs documentation. User reports delayed shipping.',
  },
];

function loadQueue() {
  if (typeof window === 'undefined') return [...QUEUE_SEED];
  try {
    const stored = window.localStorage.getItem(QUEUE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    // ignore malformed storage
  }
  return [...QUEUE_SEED];
}

const EMPTY_SUPPLIER = {
  id: '',
  brand: '',
  website: '',
  discount_code: '',
  offer_details: '',
  verification_status: false,
  verification_notes: '',
  verified_by: '',
  date_verified: '',
  average_rating: 4.5,
  total_reviews: 0,
};

function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function generateId(prefix) {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createTimelineEntry(title, detail, admin, date = formatDate()) {
  return {
    id: generateId('evt'),
    title,
    detail,
    admin,
    date,
  };
}

function generateCredential(role) {
  const suffix = Math.random().toString(36).slice(2, 8);
  const usernameBase = role === 'admin' ? 'admin' : 'researcher';
  const username = `${usernameBase}-${suffix}@health-optimised.dev`;
  const password = `HO-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
  return { username, password };
}

async function copyToClipboard(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch (error) {
    // ignore clipboard failures silently
  }
}

export default function Admin() {
  const { session, accounts, updateAccount } = useAuth();
  const [suppliers, setSuppliers] = useState(() => loadSuppliers());
  const [timeline, setTimeline] = useState(() => [...TIMELINE_SEED]);
  const [queue, setQueue] = useState(() => loadQueue());
  const [formMode, setFormMode] = useState(null);
  const [formData, setFormData] = useState(EMPTY_SUPPLIER);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const feedbackTimer = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      // ignore persistence errors
    }
  }, [queue]);

  const totalSuppliers = suppliers.length;
  const verifiedSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.verification_status).length,
    [suppliers]
  );
  const averageRating = useMemo(() => {
    if (!suppliers.length) return 0;
    return suppliers.reduce((sum, supplier) => sum + (Number(supplier.average_rating) || 0), 0) / suppliers.length;
  }, [suppliers]);
  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === selectedSupplierId) || null,
    [selectedSupplierId, suppliers]
  );

  const showFeedback = (message) => {
    setFeedback(message);
    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current);
    }
    if (message) {
      feedbackTimer.current = setTimeout(() => {
        setFeedback('');
      }, 4000);
    }
  };

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  const matchQueueEntry = (entry, supplier) => {
    if (!entry || !supplier) return false;
    if (entry.supplierId) return entry.supplierId === supplier.id;
    return entry.brand === supplier.brand;
  };

  const removeSupplierFromQueue = (supplier) => {
    if (!supplier) return;
    setQueue((prev) => prev.filter((entry) => !matchQueueEntry(entry, supplier)));
  };

  const enqueueSupplierReview = (supplier, { note, notify = true, timeline = true } = {}) => {
    if (!supplier) return;
    const entry = {
      id: generateId('queue'),
      supplierId: supplier.id,
      brand: supplier.brand,
      ticket: `RQ-${Math.floor(1000 + Math.random() * 9000)}`,
      submitted: formatDate(new Date()),
      note: note || 'Awaiting administrative verification.',
    };

    setQueue((prev) => [
      entry,
      ...prev.filter((item) => !matchQueueEntry(item, supplier)),
    ]);

    if (timeline) {
      setTimeline((prev) => [
        createTimelineEntry(
          `${supplier.brand} queued for verification`,
          entry.note,
          session?.username || 'Admin'
        ),
        ...prev,
      ]);
    }

    if (notify) {
      showFeedback(`${supplier.brand} added to verification queue.`);
    }
  };

  const syncQueueWithSuppliers = (nextSuppliers) => {
    if (!Array.isArray(nextSuppliers)) return;
    setQueue((prev) =>
      prev.filter((entry) => {
        const match = nextSuppliers.find((supplier) => matchQueueEntry(entry, supplier));
        if (!match) {
          return entry.supplierId ? false : true;
        }
        return !match.verification_status;
      })
    );
  };

  useEffect(() => {
    syncQueueWithSuppliers(suppliers);
  }, [suppliers]);

  const updateSuppliers = (producer, message, onAfter) => {
    setSuppliers((previous) => {
      const cloned = previous.map((supplier) => ({ ...supplier }));
      const next = producer(cloned);
      saveSuppliers(next);
      if (typeof onAfter === 'function') onAfter(next);
      return next;
    });
    if (message) showFeedback(message);
  };

  const openAddSupplier = () => {
    setFormMode('add');
    setFormData({
      ...EMPTY_SUPPLIER,
      verified_by: session?.username || 'Admin',
    });
  };

  const openEditSupplier = (supplier) => {
    setFormMode('edit');
    setFormData({ ...supplier });
  };

  const closeForm = () => {
    setFormMode(null);
    setFormData(EMPTY_SUPPLIER);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    if (!formData.brand?.trim() || !formData.website?.trim()) {
      showFeedback('Brand name and website are required.');
      return;
    }
    if (formMode === 'add') {
      const now = new Date();
      const newSupplier = {
        ...formData,
        id: generateId('supplier'),
        average_rating: Number(formData.average_rating) || 0,
        total_reviews: Number(formData.total_reviews) || 0,
        date_verified: formData.verification_status ? formatDate(now) : '',
      };
      updateSuppliers(
        (current) => [...current, newSupplier],
        `${newSupplier.brand} added to directory.`,
        (nextList) => {
          const created = nextList.find((entry) => entry.id === newSupplier.id);
          if (created && !created.verification_status) {
            enqueueSupplierReview(created, {
              note: 'Awaiting administrative verification for newly added supplier.',
              notify: false,
              timeline: false,
            });
          }
          syncQueueWithSuppliers(nextList);
        }
      );
      setTimeline((prev) => [
        createTimelineEntry(
          `${newSupplier.brand} profile created`,
          'Supplier added by administrator.',
          session?.username || 'Admin',
          formatDate(now)
        ),
        ...prev,
      ]);
    } else if (formMode === 'edit') {
      const now = new Date();
      updateSuppliers(
        (current) =>
          current.map((supplier) => {
            if (supplier.id !== formData.id) return supplier;
            const nextStatus = Boolean(formData.verification_status);
            return {
              ...supplier,
              ...formData,
              average_rating: Number(formData.average_rating) || 0,
              total_reviews: Number(formData.total_reviews) || 0,
              date_verified: nextStatus ? formData.date_verified || formatDate(now) : '',
            };
          }),
        `${formData.brand} updated.`,
        (nextList) => {
          const updated = nextList.find((entry) => entry.id === formData.id);
          if (!updated) return;
          if (updated.verification_status) {
            syncQueueWithSuppliers(nextList);
          } else {
            enqueueSupplierReview(updated, {
              note: 'Pending verification after profile update.',
              notify: false,
              timeline: false,
            });
          }
        }
      );
      setTimeline((prev) => [
        createTimelineEntry(
          `${formData.brand} details updated`,
          'Supplier information revised.',
          session?.username || 'Admin'
        ),
        ...prev,
      ]);
    }
    closeForm();
  };

  const handleBulkVerify = () => {
    const now = new Date();
    updateSuppliers(
      (current) =>
        current.map((supplier) => ({
          ...supplier,
          verification_status: true,
          date_verified: formatDate(now),
          verified_by: session?.username || supplier.verified_by || 'Admin',
        })),
      'All suppliers marked as verified.',
      (nextList) => {
        syncQueueWithSuppliers(nextList);
      }
    );
    setTimeline((prev) => [
      createTimelineEntry(
        'Bulk verification executed',
        'Administrator confirmed all active suppliers.',
        session?.username || 'Admin',
        formatDate(now)
      ),
      ...prev,
    ]);
  };

  const handleToggleVerification = (supplier) => {
    const now = new Date();
    const nextStatus = !supplier.verification_status;
    updateSuppliers(
      (current) =>
        current.map((entry) =>
          entry.id === supplier.id
            ? {
                ...entry,
                verification_status: nextStatus,
                date_verified: nextStatus ? formatDate(now) : '',
                verified_by: session?.username || entry.verified_by || 'Admin',
              }
            : entry
        ),
      nextStatus ? `${supplier.brand} marked verified.` : `${supplier.brand} set to pending verification.`,
      (nextList) => {
        const updated = nextList.find((entry) => entry.id === supplier.id);
        if (!updated) return;
        if (updated.verification_status) {
          removeSupplierFromQueue(updated);
          syncQueueWithSuppliers(nextList);
        } else {
          enqueueSupplierReview(updated, {
            note: 'Awaiting verification after status change.',
            notify: false,
            timeline: false,
          });
        }
      }
    );
    setTimeline((prev) => [
      createTimelineEntry(
        `${supplier.brand} verification ${nextStatus ? 'approved' : 'reset'}`,
        nextStatus ? 'Supplier confirmed via admin review.' : 'Verification status returned to pending.',
        session?.username || 'Admin',
        formatDate(now)
      ),
      ...prev,
    ]);
  };

  const handleDeleteSupplier = (supplier) => {
    if (!supplier) return;
    const confirmed = typeof window === 'undefined' ? true : window.confirm(`Remove ${supplier.brand} from the directory?`);
    if (!confirmed) return;

    const timestamp = new Date();
    updateSuppliers(
      (current) => current.filter((entry) => entry.id !== supplier.id),
      `${supplier.brand} removed from directory.`,
      (nextList) => {
        removeSupplierFromQueue(supplier);
        syncQueueWithSuppliers(nextList);
      }
    );
    setTimeline((prev) => [
      createTimelineEntry(
        `${supplier.brand} removed`,
        'Supplier deleted from directory.',
        session?.username || 'Admin',
        formatDate(timestamp)
      ),
      ...prev,
    ]);
    if (selectedSupplierId === supplier.id) {
      setSelectedSupplierId(null);
    }
  };

  const handleOpenRatings = (supplier) => {
    setSelectedSupplierId((current) => (current === supplier.id ? null : supplier.id));
  };

  const handleResolveQueue = (item) => {
    setQueue((prev) => prev.filter((entry) => entry.id !== item.id));
    setTimeline((prev) => [
      createTimelineEntry(
        `${item.brand} review completed`,
        `Queue ticket ${item.ticket} closed by ${session?.username || 'Admin'}.`,
        session?.username || 'Admin'
      ),
      ...prev,
    ]);
    showFeedback(`${item.ticket} archived.`);
  };

  const handleRotateCredentials = (role) => {
    const credentials = generateCredential(role);
    const updated = updateAccount(role, credentials);
    if (updated) {
      showFeedback(`${role === 'admin' ? 'Admin' : 'User'} credentials rotated.`);
    }
  };

  const handleLaunchDashboard = () => {
    showFeedback('Full analytics dashboard will connect to Chart.js / Supabase metrics in a future release.');
  };

  return (
    <section className="space-y-10">
      {feedback && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm shadow-sm">
          {feedback}
        </div>
      )}

      <header className="space-y-3">
        <h2 className="text-3xl font-semibold text-gray-900">Health Optimised Admin Control Centre</h2>
        <p className="text-sm text-gray-600">
          Manage supplier verification, moderate community sentiment, control credentials, and oversee compliance
          artefacts. All data is persisted locally until serverless integrations are configured.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {accounts.map((account) => (
          <CredentialCard
            key={account.role}
            account={account}
            onRotate={() => handleRotateCredentials(account.role)}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat label="Suppliers in directory" value={totalSuppliers} trend="Live count" />
        <AdminStat label="Verified suppliers" value={verifiedSuppliers} trend={`${verifiedSuppliers}/${totalSuppliers}`} highlight />
        <AdminStat label="Average peer rating" value={`${averageRating.toFixed(1)} ★`} trend="Rolling 7 day" />
        <AdminStat label="Flags awaiting review" value={queue.length} trend={queue.length ? 'Action needed' : 'All clear'} warning={Boolean(queue.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 bg-white/40 backdrop-blur border border-white/70 rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Supplier management</h3>
            <div className="flex gap-2 text-xs">
              <button onClick={openAddSupplier} className="rounded-full border border-white/70 bg-white/60 px-3 py-1 font-medium text-gray-700 hover:bg-white">
                + Add supplier
              </button>
              <button onClick={handleBulkVerify} className="rounded-full border border-white/70 bg-white/40 px-3 py-1 font-medium text-gray-700 hover:bg-white/70">
                Bulk verify
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Edit, verify, or inspect supplier entries. Changes synchronise instantly with the public directory view.
          </p>

          <div className="overflow-hidden rounded-2xl border border-white/80">
            <table className="min-w-full text-sm">
              <thead className="bg-white/60 text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last verification</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/60">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="bg-white/40 backdrop-blur">
                    <td className="px-4 py-3 font-medium text-gray-900">{supplier.brand}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          supplier.verification_status
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-orange-100 text-orange-600'
                        }`}
                      >
                        {supplier.verification_status ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{supplier.date_verified || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <button
                          onClick={() => openEditSupplier(supplier)}
                          className="rounded-full border border-white/70 bg-white/60 px-3 py-1 font-medium text-gray-700 hover:bg-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleVerification(supplier)}
                          className="rounded-full border border-white/70 bg-white/40 px-3 py-1 font-medium text-gray-700 hover:bg-white/70"
                        >
                          {supplier.verification_status ? 'Mark pending' : 'Verify now'}
                        </button>
                        <button
                          onClick={() => handleOpenRatings(supplier)}
                          className="rounded-full border border-white/70 bg-white/20 px-3 py-1 font-medium text-gray-700 hover:bg-white/50"
                        >
                          View ratings
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(supplier)}
                          className="rounded-full border border-white/70 bg-white/10 px-3 py-1 font-medium text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {formMode && (
            <SupplierForm
              mode={formMode}
              data={formData}
              onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
              onCancel={closeForm}
              onSubmit={handleFormSubmit}
            />
          )}

          {selectedSupplier && (
            <div className="rounded-2xl border border-white/70 bg-white/50 backdrop-blur p-5 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-gray-900">Ratings snapshot — {selectedSupplier.brand}</h4>
                <button
                  onClick={() => setSelectedSupplierId(null)}
                  className="rounded-full border border-white/70 bg-white/40 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-white/70"
                >
                  Close
                </button>
              </div>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Average rating</dt>
                  <dd className="text-lg font-semibold text-gray-900">{selectedSupplier.average_rating.toFixed(1)} ★</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Total reviews</dt>
                  <dd className="text-lg font-semibold text-gray-900">{selectedSupplier.total_reviews}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-500">Verification notes</dt>
                  <dd className="text-sm text-gray-600 leading-snug">{selectedSupplier.verification_notes || 'Not provided yet.'}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-3 rounded-3xl border border-white/70 bg-white/40 backdrop-blur p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Verification queue</h3>
            <p className="text-xs text-gray-500">Track outstanding supplier submissions awaiting administrative action.</p>
            <div className="space-y-3 text-sm text-gray-600">
              {queue.length === 0 && <p className="text-xs text-gray-500">No pending tickets.</p>}
              {queue.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/60 bg-white/40 p-3">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wider text-gray-500">
                    <span>{item.ticket}</span>
                    <span>{item.submitted}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900">{item.brand}</p>
                  <p className="text-xs text-gray-600">{item.note}</p>
                  <button
                    onClick={() => handleResolveQueue(item)}
                    className="mt-3 inline-flex rounded-full border border-white/70 bg-white/50 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-white/80"
                  >
                    Close request
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-white/70 bg-white/40 backdrop-blur p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Recent verification activity</h3>
            <p className="text-xs text-gray-500">Auto-generated feed for the forthcoming Firestore collection `verification_logs`.</p>
            <div className="space-y-4">
              {timeline.map((event) => (
                <div key={event.id} className="border border-white/60 bg-white/30 rounded-2xl p-4 text-sm text-gray-600">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wider text-gray-500">
                    <span>{event.date}</span>
                    <span>{event.admin}</span>
                  </div>
                  <p className="mt-2 font-semibold text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-600">{event.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/40 backdrop-blur p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Analytics preview</h3>
          <button
            onClick={handleLaunchDashboard}
            className="rounded-full border border-white/70 bg-white/60 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-white"
          >
            Launch full dashboard
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Integrate Chart.js or Recharts for trend visualisations. Below are placeholder metrics combining supplier rating
          averages with verification cadence.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <AdminMetric label="7-day rating delta" value={'+0.2 ★'} context="Positive sentiment" />
          <AdminMetric label="Verification cadence" value={'Every 14 days'} context="Meets policy" />
          <AdminMetric label="Community submissions" value={'41 this week'} context="Monitor for anomalies" />
        </div>
      </div>
    </section>
  );
}

function CredentialCard({ account, onRotate }) {
  const handleCopy = () => {
    copyToClipboard(`${account.username} / ${account.password}`);
  };
  return (
    <div className="rounded-3xl border border-white/70 bg-white/60 backdrop-blur p-6 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {account.role === 'admin' ? 'Admin credentials' : 'User credentials'}
        </h3>
        <span className="text-xs uppercase tracking-[0.2em] text-gray-500">One-click rotation</span>
      </div>
      <dl className="grid gap-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Login</dt>
          <dd className="text-xl font-semibold text-gray-900 break-all">{account.username}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Password</dt>
          <dd className="text-xl font-semibold text-gray-900 break-all">{account.password}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={onRotate}
          className="rounded-full border border-white/70 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-600"
        >
          Rotate credentials
        </button>
        <button
          onClick={handleCopy}
          className="rounded-full border border-white/70 bg-white/40 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white/70"
        >
          Copy to clipboard
        </button>
      </div>
    </div>
  );
}

function SupplierForm({ mode, data, onChange, onCancel, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-white/70 bg-white/50 backdrop-blur p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-gray-900">
          {mode === 'add' ? 'Add new supplier' : `Edit ${data.brand}`}
        </h4>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/70 bg-white/30 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-white/60"
        >
          Cancel
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs uppercase tracking-wide text-gray-500">
          Brand name
          <input
            className="mt-1 w-full rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
            value={data.brand}
            onChange={(event) => onChange({ brand: event.target.value })}
            required
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-gray-500">
          Website URL
          <input
            className="mt-1 w-full rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
            value={data.website}
            onChange={(event) => onChange({ website: event.target.value })}
            required
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-gray-500">
          Discount code
          <input
            className="mt-1 w-full rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-sm"
            value={data.discount_code}
            onChange={(event) => onChange({ discount_code: event.target.value })}
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-gray-500">
          Offer details
          <input
            className="mt-1 w-full rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-sm"
            value={data.offer_details}
            onChange={(event) => onChange({ offer_details: event.target.value })}
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-gray-500 md:col-span-2">
          Verification notes
          <textarea
            className="mt-1 w-full rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-sm"
            rows={3}
            value={data.verification_notes}
            onChange={(event) => onChange({ verification_notes: event.target.value })}
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-gray-500">
          Verified by
          <input
            className="mt-1 w-full rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-sm"
            value={data.verified_by}
            onChange={(event) => onChange({ verified_by: event.target.value })}
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-gray-500">
          Average rating
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            className="mt-1 w-full rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-sm"
            value={data.average_rating}
            onChange={(event) => onChange({ average_rating: event.target.value })}
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-gray-500">
          Total reviews
          <input
            type="number"
            min="0"
            className="mt-1 w-full rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-sm"
            value={data.total_reviews}
            onChange={(event) => onChange({ total_reviews: event.target.value })}
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-gray-500">
          <span className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(data.verification_status)}
              onChange={(event) => onChange({ verification_status: event.target.checked })}
            />
            Verified status
          </span>
        </label>
        <label className="text-xs uppercase tracking-wide text-gray-500">
          Date verified
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-sm"
            value={data.date_verified || ''}
            onChange={(event) => onChange({ date_verified: event.target.value })}
            disabled={!data.verification_status}
          />
        </label>
      </div>
      <div className="flex justify-end gap-2 text-sm">
        <button
          type="submit"
          className="rounded-full border border-white/70 bg-emerald-500 px-4 py-2 font-semibold text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-600"
        >
          {mode === 'add' ? 'Add supplier' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function AdminStat({ label, value, trend, highlight, warning }) {
  return (
    <div
      className={`rounded-3xl border border-white/70 bg-white/50 backdrop-blur p-4 shadow-lg ${
        highlight ? 'shadow-emerald-200/80' : warning ? 'shadow-orange-200/80' : 'shadow-gray-200/60'
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      <p className={`text-xs mt-1 ${highlight ? 'text-emerald-600' : warning ? 'text-orange-500' : 'text-gray-500'}`}>
        {trend}
      </p>
    </div>
  );
}

function AdminMetric({ label, value, context }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/40 backdrop-blur p-4 text-sm text-gray-600">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{context}</p>
    </div>
  );
}

