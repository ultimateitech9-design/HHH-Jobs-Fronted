import { Link } from 'react-router-dom';

const toneClasses = {
  brand: 'from-slate-950 via-brand-700 to-indigo-700',
  student: 'from-slate-950 via-brand-700 to-sky-700',
  hr: 'from-stone-950 via-amber-700 to-sky-700',
  admin: 'from-slate-950 via-brand-700 to-cyan-700',
  superAdmin: 'from-slate-950 via-brand-700 to-blue-700',
  dataentry: 'from-slate-950 via-brand-700 to-orange-600',
  accounts: 'from-slate-950 via-emerald-700 to-brand-700',
  sales: 'from-slate-950 via-brand-700 to-rose-700',
  support: 'from-slate-950 via-violet-700 to-brand-700',
  platform: 'from-slate-950 via-sky-800 to-teal-700',
  audit: 'from-slate-950 via-orange-700 to-sky-800'
};

const PortalDashboardHero = ({
  tone = 'brand',
  eyebrow,
  badge,
  title,
  description,
  chips = [],
  primaryAction,
  secondaryAction,
  metrics = [],
  aside,
  compact = true
}) => {
  const gradientClass = toneClasses[tone] || toneClasses.brand;
  const sectionClass = compact
    ? 'rounded-[1.25rem] px-3 py-3 sm:px-4 sm:py-4 lg:px-4.5 lg:py-4'
    : 'rounded-[2rem] px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7';
  const layoutClass = compact
    ? 'grid gap-3 xl:grid-cols-[minmax(0,1.02fr)_minmax(260px,0.98fr)] xl:items-start'
    : 'grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.88fr)] xl:items-start';
  const titleClass = compact
    ? 'mt-1.5 max-w-3xl text-balance break-words font-heading text-[1.35rem] font-extrabold leading-tight sm:text-[1.55rem] lg:text-[1.75rem]'
    : 'mt-3 max-w-3xl text-balance break-words font-heading text-[2rem] font-extrabold leading-tight lg:text-[2.7rem]';
  const descriptionClass = compact
    ? 'mt-1.5 max-w-2xl text-[12px] leading-4.5 text-white/78 sm:text-[13px] sm:leading-5'
    : 'mt-3 max-w-2xl text-sm leading-6 text-white/78 md:text-base';
  const chipsWrapClass = compact ? 'mt-2.5 flex flex-wrap gap-1.5' : 'mt-4 flex flex-wrap gap-2';
  const chipClass = compact
    ? 'inline-flex rounded-full border border-white/18 bg-white/8 px-2 py-0.5 text-[9px] font-semibold leading-none text-white/88 sm:text-[10px]'
    : 'inline-flex rounded-full border border-white/18 bg-white/8 px-3 py-1 text-xs font-semibold text-white/88';
  const actionsWrapClass = compact ? 'mt-3 flex flex-wrap gap-1.5' : 'mt-5 flex flex-wrap gap-3';
  const primaryActionClass = compact
    ? 'inline-flex min-h-[34px] items-center justify-center rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-slate-900 transition-transform hover:-translate-y-0.5'
    : 'inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 transition-transform hover:-translate-y-0.5';
  const secondaryActionClass = compact
    ? 'inline-flex min-h-[34px] items-center justify-center rounded-full border border-white/18 bg-white/10 px-3.5 py-1.5 text-[12px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/16'
    : 'inline-flex items-center justify-center rounded-full border border-white/18 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/16';
  const metricsWrapClass = compact ? 'grid gap-2 grid-cols-2 xl:grid-cols-2' : 'grid gap-3 sm:grid-cols-2';
  const metricCardClass = compact
    ? 'min-w-0 rounded-[0.9rem] border border-white/15 bg-slate-950/18 px-2.5 py-2.5 backdrop-blur-md'
    : 'rounded-[1.4rem] border border-white/15 bg-slate-950/18 px-4 py-4 backdrop-blur-md';
  const clickableMetricCardClass = compact
    ? `${metricCardClass} block transition duration-200 hover:-translate-y-0.5 hover:bg-slate-950/24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`
    : `${metricCardClass} block transition duration-200 hover:-translate-y-0.5 hover:bg-slate-950/24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`;
  const metricValueClass = compact ? 'mt-1 text-[1.2rem] font-black leading-none text-white sm:text-[1.35rem]' : 'mt-2 text-3xl font-black text-white';
  const metricHelperClass = compact ? 'mt-1 text-[11px] leading-4 text-white/74' : 'mt-2 text-sm text-white/74';

  return (
    <section className={`relative overflow-hidden bg-gradient-to-br text-white shadow-xl ${sectionClass} ${gradientClass}`}>
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

      <div className={`relative ${layoutClass}`}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {eyebrow ? (
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70 sm:text-[11px] sm:tracking-[0.22em]">{eyebrow}</p>
            ) : null}
            {badge ? (
              <span className="inline-flex max-w-full items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/85 backdrop-blur-sm sm:text-[10px] sm:tracking-[0.16em]">
                {badge}
              </span>
            ) : null}
          </div>

          <h1 className={titleClass}>
            {title}
          </h1>
          {description ? (
            <p className={descriptionClass}>
              {description}
            </p>
          ) : null}

          {chips.length > 0 ? (
            <div className={chipsWrapClass}>
              {chips.map((chip) => (
                <span
                  key={chip}
                  className={chipClass}
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}

          {(primaryAction || secondaryAction) ? (
            <div className={actionsWrapClass}>
              {primaryAction ? (
                <Link
                  to={primaryAction.to}
                  className={`${primaryActionClass} w-full sm:w-auto`}
                >
                  {primaryAction.label}
                </Link>
              ) : null}
              {secondaryAction ? (
                <Link
                  to={secondaryAction.to}
                  className={`${secondaryActionClass} w-full sm:w-auto`}
                >
                  {secondaryAction.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={`min-w-0 ${metricsWrapClass}`}>
          {aside ||
            metrics.map((metric) => {
              const cardContent = (
                <>
                  <p className="break-words text-[9px] font-bold uppercase tracking-[0.12em] text-white/58 sm:text-[10px] sm:tracking-[0.16em]">{metric.label}</p>
                  <p className={metricValueClass}>{metric.value}</p>
                  {metric.helper ? <p className={`${metricHelperClass} break-words`}>{metric.helper}</p> : null}
                </>
              );

              if (metric.to) {
                return (
                  <Link
                    key={metric.label}
                    to={metric.to}
                    className={clickableMetricCardClass}
                  >
                    {cardContent}
                  </Link>
                );
              }

              return (
                <article
                  key={metric.label}
                  className={metricCardClass}
                >
                  {cardContent}
                </article>
              );
            })}
        </div>
      </div>
    </section>
  );
};

export default PortalDashboardHero;
