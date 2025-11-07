export default function Footer() {
  return (
    <footer className="border-t text-xs text-gray-600 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-2">
        <p>
          Disclaimer: Health Optimised is an informational resource for research purposes only. No claims are made
          regarding human or veterinary use. The website and its administrators do not endorse, sell, or distribute
          peptides.
        </p>
        <p className="text-[11px]">© {new Date().getFullYear()} Health Optimised — Research Use Only.</p>
      </div>
    </footer>
  );
}

