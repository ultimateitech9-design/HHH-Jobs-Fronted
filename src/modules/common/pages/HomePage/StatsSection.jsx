import StatCounter from './StatCounter';

const toCount = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? Math.round(count) : null;
};

export function StatsSection({ totals = {} }) {
  const liveStats = [
    { end: toCount(totals.openJobs), label: 'Open jobs' },
    { end: toCount(totals.companies), label: 'Companies hiring' },
    { end: toCount(totals.roles), label: 'Career categories' },
    { end: toCount(totals.cities), label: 'Hiring cities' }
  ];

  return (
    <section className="home-live-stats relative overflow-hidden border-y border-slate-800 bg-slate-950 py-12 text-white md:py-14">
      <div className="home-live-stats__line absolute inset-x-0 top-0" aria-hidden="true" />
      <div className="vw-shell-wide relative z-10 grid gap-9 lg:grid-cols-[minmax(15rem,0.65fr)_minmax(0,1.35fr)] lg:items-center">
        <div>
          <p className="text-[11px] font-black uppercase text-emerald-300">Live platform signal</p>
          <h2 className="mt-3 font-heading text-2xl font-black text-white md:text-3xl">Hiring activity, not vanity numbers.</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">Current opportunity, employer, category, and city totals from the HHH Jobs network.</p>
        </div>

        <div className="grid grid-cols-2 border-l border-white/15 sm:grid-cols-4">
          {liveStats.map((item, index) => (
            <div key={item.label} className={`min-h-[112px] border-y border-r border-white/15 px-3 py-5 ${index > 1 ? 'border-t-0 sm:border-t' : ''}`}>
              <span className="mb-3 block font-mono text-[10px] font-bold text-white/35">{String(index + 1).padStart(2, '0')}</span>
              <StatCounter end={item.end} label={item.label} inline />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
