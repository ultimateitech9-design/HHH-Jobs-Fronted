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
  compact = false
}) => {
  const gradientClass = toneClasses[tone] || toneClasses.brand;
  const sectionClass = compact
    ? 'rounded-[1.75rem] px-4 py-4 md:px-5 md:py-5'
    : 'rounded-[2.25rem] px-6 py-7 md:px-8 md:py-9';
  const layoutClass = compact
    ? 'grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_340px] xl:items-start'
    : 'grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px] xl:items-start';
  const titleClass = compact
    ? 'mt-2.5 max-w-3xl font-heading text-[1.95rem] font-extrabold leading-tight md:text-[2.3rem]'
    : 'mt-4 max-w-3xl font-heading text-3xl font-extrabold leading-tight md:text-4xl';
  const descriptionClass = compact
    ? 'mt-2.5 max-w-2xl text-sm leading-5.5 text-white/78'
    : 'mt-4 max-w-2xl text-sm leading-7 text-white/78 md:text-base';
  const chipsWrapClass = compact ? 'mt-3 flex flex-wrap gap-1.5' : 'mt-5 flex flex-wrap gap-2';
  const chipClass = compact
    ? 'inline-flex rounded-full border border-white/18 bg-white/8 px-2.5 py-0.5 text-[10px] font-semibold text-white/88'
    : 'inline-flex rounded-full border border-white/18 bg-white/8 px-3 py-1 text-xs font-semibold text-white/88';
  const actionsWrapClass = compact ? 'mt-4 flex flex-wrap gap-2' : 'mt-6 flex flex-wrap gap-3';
  const primaryActionClass = compact
    ? 'inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900 transition-transform hover:-translate-y-0.5'
    : 'inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 transition-transform hover:-translate-y-0.5';
  const secondaryActionClass = compact
    ? 'inline-flex items-center justify-center rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/16'
    : 'inline-flex items-center justify-center rounded-full border border-white/18 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/16';
  const metricsWrapClass = compact ? 'grid gap-2 sm:grid-cols-2 xl:grid-cols-2' : 'grid gap-3';
  const metricCardClass = compact
    ? 'rounded-[1.1rem] border border-white/15 bg-slate-950/18 px-3.5 py-3 backdrop-blur-md'
    : 'rounded-[1.4rem] border border-white/15 bg-slate-950/18 px-4 py-4 backdrop-blur-md';
  const metricValueClass = compact ? 'mt-1 text-[1.8rem] font-black text-white' : 'mt-2 text-3xl font-black text-white';
  const metricHelperClass = compact ? 'mt-1 text-[13px] leading-5 text-white/74' : 'mt-2 text-sm text-white/74';

  return (
    <section className={`relative overflow-hidden bg-gradient-to-br text-white shadow-xl ${sectionClass} ${gradientClass}`}>
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

      <div className={`relative ${layoutClass}`}>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            {eyebrow ? (
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">{eyebrow}</p>
            ) : null}
            {badge ? (
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/85 backdrop-blur-sm">
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
                  className={primaryActionClass}
                >
                  {primaryAction.label}
                </Link>
              ) : null}
              {secondaryAction ? (
                <Link
                  to={secondaryAction.to}
                  className={secondaryActionClass}
                >
                  {secondaryAction.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={metricsWrapClass}>
          {aside ||
            metrics.map((metric) => (
              <article
                key={metric.label}
                className={metricCardClass}
              >
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/58">{metric.label}</p>
                <p className={metricValueClass}>{metric.value}</p>
                {metric.helper ? <p className={metricHelperClass}>{metric.helper}</p> : null}
              </article>
            ))}
        </div>
      </div>
    </section>
  );
};

export default PortalDashboardHero;
