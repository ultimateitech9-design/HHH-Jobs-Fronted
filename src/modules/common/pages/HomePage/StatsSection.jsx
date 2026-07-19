import StatCounter from './StatCounter';
import { HOME_PLATFORM_METRICS } from './platformMetrics';

export function StatsSection() {
  return (
    <section className="home-platform-stats relative overflow-hidden border-y border-slate-800 bg-slate-950 py-12 text-white md:py-14">
      <div className="home-platform-stats__line absolute inset-x-0 top-0" aria-hidden="true" />
      <div className="vw-shell-wide relative z-10 grid gap-9 lg:grid-cols-[minmax(15rem,0.65fr)_minmax(0,1.35fr)] lg:items-center">
        <div>
          <p className="text-[11px] font-black uppercase text-emerald-300">India-wide coverage</p>
          <h2 className="mt-3 font-heading text-2xl font-black text-white md:text-3xl">Built beyond the biggest metros.</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">A stable location and career directory designed to connect opportunity across India.</p>
        </div>

        <div className="grid grid-cols-2 border-l border-white/15 sm:grid-cols-4">
          {HOME_PLATFORM_METRICS.map((item, index) => (
            <div key={item.id} className={`min-h-[132px] border-y border-r border-white/15 px-3 py-5 ${index > 1 ? 'border-t-0 sm:border-t' : ''}`}>
              <span className="mb-3 block font-mono text-[10px] font-bold text-white/35">{String(index + 1).padStart(2, '0')}</span>
              <StatCounter end={item.value} label={item.label} inline />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
