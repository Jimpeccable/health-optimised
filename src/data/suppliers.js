const STORAGE_KEY = 'health-optimised:suppliers';
export const SUPPLIERS_EVENT = 'suppliers:update';

export const SAMPLE_SUPPLIERS = [
  {
    id: 'ayve',
    brand: 'Ayve',
    website: 'https://ayve.co.uk',
    discount_code: 'PEPTOK20',
    offer_details: 'Code 20% off with PEPTOK20',
    verification_status: true,
    verification_notes: 'Verified COA - Good range, nice packaging, excellent results',
    verified_by: 'Aurora (Admin)',
    date_verified: '2025-11-07',
    average_rating: 4.8,
    total_reviews: 142,
  },
  {
    id: 'retarelief',
    brand: 'RetaRelief',
    website: 'https://retarelief.com',
    discount_code: 'PEPTOK20',
    offer_details: 'Code 20% off with PEPTOK20 + free BAC water',
    verification_status: true,
    verification_notes: 'Verified COA',
    verified_by: 'Aurora (Admin)',
    date_verified: '2025-11-07',
    average_rating: 4.6,
    total_reviews: 97,
  },
  {
    id: 'researchism',
    brand: 'Researchism',
    website: 'https://researchism.store',
    discount_code: 'PEPTOK5',
    offer_details: 'Code PEPTOK5 for £5 off + BAC water',
    verification_status: true,
    verification_notes: 'Verified COA - Bundle deal',
    verified_by: 'Aurora (Admin)',
    date_verified: '2025-11-07',
    average_rating: 4.7,
    total_reviews: 121,
  },
];

function cloneSuppliers(list) {
  return list.map((supplier) => ({ ...supplier }));
}

export function loadSuppliers() {
  if (typeof window === 'undefined') return cloneSuppliers(SAMPLE_SUPPLIERS);
  let parsed;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      parsed = JSON.parse(stored);
    }
  } catch (error) {
    parsed = undefined;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    const fallback = cloneSuppliers(SAMPLE_SUPPLIERS);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    } catch (error) {
      // ignore write errors
    }
    return fallback;
  }

  return parsed.map((supplier) => ({
    average_rating: 0,
    total_reviews: 0,
    discount_code: '',
    offer_details: '',
    verification_notes: '',
    verified_by: '',
    date_verified: '',
    verification_status: false,
    ...supplier,
  }));
}

export function saveSuppliers(nextSuppliers) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSuppliers));
    window.dispatchEvent(new CustomEvent(SUPPLIERS_EVENT, { detail: nextSuppliers }));
  } catch (error) {
    // ignore persistence failures
  }
}

export function getSupplierById(id) {
  const suppliers = loadSuppliers();
  return suppliers.find((supplier) => supplier.id === id);
}

