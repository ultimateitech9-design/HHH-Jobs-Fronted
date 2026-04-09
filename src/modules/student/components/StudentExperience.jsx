import { isValidElement } from 'react';
import { Link } from 'react-router-dom';

const renderIcon = (icon) => {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  const Icon = icon;
  return <Icon className="h-5 w-5" />;
};

const noticeTone = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-brand-200 bg-brand-50 text-brand-700'
};

const metricTone = {
  default: 'border-white/20 bg-white/12 text-white',
  accent: 'border-brand-200/50 bg-brand-400/16 text-white',
  success: 'border-emerald-200/50 bg-emerald-400/14 text-white',
  warning: 'border-amber-200/50 bg-amber-400/14 text-white',
  info: 'border-sky-200/50 bg-sky-400/14 text-white'
};

export const studentFieldClassName =
  'w-full rounded-[1.15rem] border border-slate-200 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100';

export const studentMutedFieldClassName =
  'w-full cursor-not-allowed rounded-[1.15rem] border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-400';

export const studentTextareaClassName = `${studentFieldClassName} min-h-[130px] resize-y`;

export const studentPrimaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 via-brand-500 to-warning-400 px-5 py-3 text-sm font-black text-white shadow-[0_18px_34px_rgba(229,155,23,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_42px_rgba(229,155,23,0.3)] disabled:cursor-not-allowed disabled:opacity-70';

export const studentSecondaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-70';

export const studentGhostButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-70';

export const StudentNotice = ({ type = 'info', text, action }) => {
  if (!text) return null;

  return (
    <div className={`rounded-[1.35rem] border px-4 py-3 text-sm font-semibold shadow-sm ${noticeTone[type] || noticeTone.info}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span>{text}</span>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
};

export const StudentPageShell = ({
  eyebrow,
  badge,
  title,
  subtitle,
  stats = [],
  actions,
  children,
  heroClassName = '',
  bodyClassName = ''
}) => {
  return (
    <div className={`space-y-6 pb-8 ${bodyClassName}`.trim()}>
      <section
        className={`relative overflow-hidden rounded-[2.35rem] border border-white/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,33,59,0.94)_36%,rgba(47,83,143,0.9)_68%,rgba(229,155,23,0.86))] px-6 py-7 text-white shadow-[0_26px_70px_rgba(17,33,59,0.16)] md:px-8 md:py-8 ${heroClassName}`.trim()}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,214,102,0.22),transparent_24%),linear-gradient(180deg,transparent,rgba(255,255,255,0.02))]" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-white/8 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-brand-200/20 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.95fr)] xl:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              {eyebrow ? (
                <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">{eyebrow}</p>
              ) : null}
              {badge ? (
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/85">
                  {badge}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 max-w-4xl font-heading text-3xl font-extrabold leading-tight text-white md:text-4xl">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/76 md:text-base">
                {subtitle}
              </p>
            ) : null}

            {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
          </div>

          {stats.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {stats.map((metric) => (
                <article
                  key={metric.label}
                  className={`rounded-[1.45rem] border px-4 py-4 backdrop-blur-sm ${metricTone[metric.tone] || metricTone.default}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/62">{metric.label}</p>
                      <p className="mt-2 font-heading text-3xl font-black text-white">{metric.value}</p>
                    </div>
                    {metric.icon ? (
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white">
                        {renderIcon(metric.icon)}
                      </div>
                    ) : null}
                  </div>
                  {metric.helper ? <p className="mt-3 text-sm leading-6 text-white/74">{metric.helper}</p> : null}
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {children}
    </div>
  );
};

export const StudentSurfaceCard = ({
  eyebrow,
  title,
  subtitle,
  action,
  className = '',
  bodyClassName = '',
  children
}) => {
  return (
    <section
      className={`relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur xl:p-7 ${className}`.trim()}
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/80 to-transparent" />
      {(eyebrow || title || subtitle || action) ? (
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            {eyebrow ? (
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-brand-700">{eyebrow}</p>
            ) : null}
            {title ? <h2 className="font-heading text-2xl font-extrabold text-navy">{title}</h2> : null}
            {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}

      <div className={bodyClassName}>{children}</div>
    </section>
  );
};

export const StudentEmptyState = ({ icon, title, description, action, className = '' }) => {
  return (
    <div
      className={`rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center ${className}`.trim()}
    >
      {icon ? (
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm">
          {renderIcon(icon)}
        </div>
      ) : null}
      {title ? <h3 className="mt-5 font-heading text-2xl font-bold text-navy">{title}</h3> : null}
      {description ? <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
};

export const StudentQuickLink = ({ to, label }) => (
  <Link to={to} className={studentSecondaryButtonClassName}>
    {label}
  </Link>
);
