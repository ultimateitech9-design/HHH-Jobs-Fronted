const companies = [
  { name: 'Google', mark: 'G', color: '#4285F4' },
  { name: 'Microsoft', mark: 'M', color: '#00A4EF' },
  { name: 'Amazon', mark: 'A', color: '#FF9900' },
  { name: 'Meta', mark: 'M', color: '#0866FF' },
  { name: 'Apple', mark: 'A', color: '#111827' },
  { name: 'Netflix', mark: 'N', color: '#E50914' },
  { name: 'Spotify', mark: 'S', color: '#1ED760' },
  { name: 'Stripe', mark: 'S', color: '#635BFF' }
];

export function TrustedBySection() {
  return (
    <section className="overflow-hidden border-b border-slate-200 py-12 md:py-14">
      <div className="vw-shell">
        <p className="mb-6 text-center text-[12px] font-medium uppercase tracking-[0.3em] text-slate-500">
          Trusted by leading companies worldwide
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {companies.map((company) => (
            <div
              key={company.name}
              className="flex items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black shadow-sm"
                style={{ color: company.color }}
                aria-hidden="true"
              >
                {company.mark}
              </span>
              <span className="truncate font-heading text-sm font-bold text-slate-700">
                {company.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
