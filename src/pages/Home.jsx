export default function Home() {
  return (
    <section className="space-y-10">
      <div className="space-y-4 text-center">
        <span className="inline-flex px-4 py-1 rounded-full text-xs tracking-wide uppercase bg-emerald-100 text-emerald-700">Research Use Only</span>
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">Health Optimised Supplier Verification</h1>
        <p className="max-w-2xl mx-auto text-gray-600 text-lg">
          Explore vetted peptide suppliers through community. Discover verification notes, transparent peer ratings, and
          compliance-first insights - Informational and not endorsed by Health Optimised, its admins or associates in any
          way. Submissions are based on anecdotal opinion only.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 text-left">
        {[{
          title: 'Verified Transparency',
          body: 'Admins document rigorous checks with dated notes so you know exactly what was validated.'
        }, {
          title: 'Anonymous Ratings',
          body: 'Leave feedback anonymously per session to help researchers without sharing personal details.'
        }, {
          title: 'Compliance First',
          body: 'Disclaimers, access controls, and research-only messaging built to minimise legal risk.'
        }].map((item) => (
          <div key={item.title} className="bg-white/60 backdrop-blur border border-white/70 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
