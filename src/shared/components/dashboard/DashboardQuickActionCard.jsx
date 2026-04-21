import { FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const toneMap = {
  brand: {
    topBar: 'bg-brand-500',
    glow: 'bg-brand-200/70',
    eyebrow: 'text-brand-700',
    cta: 'text-brand-700 group-hover:text-brand-800'
  },
  info: {
    topBar: 'bg-sky-500',
    glow: 'bg-sky-200/70',
    eyebrow: 'text-sky-700',
    cta: 'text-sky-700 group-hover:text-sky-800'
  },
  success: {
    topBar: 'bg-emerald-500',
    glow: 'bg-emerald-200/70',
    eyebrow: 'text-emerald-700',
    cta: 'text-emerald-700 group-hover:text-emerald-800'
  },
  warning: {
    topBar: 'bg-amber-500',
    glow: 'bg-amber-200/70',
    eyebrow: 'text-amber-700',
    cta: 'text-amber-700 group-hover:text-amber-800'
  },
  accent: {
    topBar: 'bg-violet-500',
    glow: 'bg-violet-200/70',
    eyebrow: 'text-violet-700',
    cta: 'text-violet-700 group-hover:text-violet-800'
  },
  neutral: {
    topBar: 'bg-slate-500',
    glow: 'bg-slate-200/70',
    eyebrow: 'text-slate-700',
    cta: 'text-slate-700 group-hover:text-slate-900'
  }
};

const DashboardQuickActionCard = ({
  to,
  title,
  description,
  eyebrow,
  ctaLabel = 'Open area',
  tone = 'brand',
  className = ''
}) => {
  const palette = toneMap[tone] || toneMap.brand;

  return (
    <Link
      to={to}
      className={`group relative flex min-h-[148px] overflow-hidden rounded-[1.55rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] p-5 shadow-[0_14px_32px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${className}`.trim()}
    >
      <div className={`pointer-events-none absolute inset-x-5 top-0 h-1 rounded-full ${palette.topBar}`} />
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl ${palette.glow}`} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.82),transparent_32%)]" />

      <div className="relative z-10 flex h-full flex-col">
        {eyebrow ? (
          <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${palette.eyebrow}`}>{eyebrow}</p>
        ) : null}
        <h3 className="mt-2 font-heading text-[1.12rem] font-extrabold leading-tight text-navy">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

        <span className={`mt-auto inline-flex items-center gap-2 pt-4 text-sm font-bold transition-colors ${palette.cta}`}>
          {ctaLabel}
          <FiArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
};

export default DashboardQuickActionCard;
