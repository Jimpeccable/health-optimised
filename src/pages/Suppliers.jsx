import SupplierTable from '../shared/SupplierTable.jsx';
import LegalBanner from '../components/LegalBanner.jsx';

export default function Suppliers() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Health Optimised Supplier Directory</h2>
        <p className="text-sm text-gray-600">Transparent verification with researcher-first design. All suppliers are surfaced for informational purposes only.</p>
      </div>
      <LegalBanner />
      <SupplierTable />
    </section>
  );
}

