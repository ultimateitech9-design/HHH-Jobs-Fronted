import { isValidElement } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const toneMap = {
  default: {
    border: 'border-slate-200',
    surface: 'bg-slate-100 text-slate-700',
    glow: 'bg-slate-100'
  },
  info: {
    border: 'border-sky-100',
    surface: 'bg-sky-100 text-sky-700',
    glow: 'bg-sky-100'
  },
  success: {
    border: 'border-emerald-100',
    surface: 'bg-emerald-100 text-emerald-700',
    glow: 'bg-emerald-100'
  },
  warning: {
    border: 'border-amber-100',
    surface: 'bg-amber-100 text-amber-700',
    glow: 'bg-amber-100'
  },
  danger: {
    border: 'border-red-100',
    surface: 'bg-red-100 text-red-700',
    glow: 'bg-red-100'
  },
  accent: {
    border: 'border-brand-100',
    surface: 'bg-brand-100 text-brand-700',
    glow: 'bg-brand-100'
  }
};

const renderIcon = (icon) => {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  const Icon = icon;
  return <Icon className="h-5 w-5" />;
};

const renderMetricCard = (card, tone) => (
  <>
    <div className={`pointer-events-none absolute inset-x-4 top-0 h-1 rounded-full opacity-90 ${tone.surface}`} />
    <div className={`pointer-events-none absolute -right-7 -top-8 h-24 w-24 rounded-full opacity-60 transition-transform duration-300 group-hover:scale-125 ${tone.glow}`} />

    <div className="relative z-10 flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-[13px] font-semibold leading-4.5 text-slate-500">{card.label}</p>
          <p className="mt-1.5 font-heading text-[1.4rem] font-bold leading-none text-navy">{card.value}</p>
        </div>
        {card.icon ? (
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.surface}`}>
            {renderIcon(card.icon)}
          </div>
        ) : null}
      </div>

      {card.helper ? (
        <p className={`mt-2 inline-flex max-w-full break-words rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 ${tone.surface}`}>
          {card.helper}
        </p>
      ) : null}

      {card.to ? (
        <div className="mt-auto pt-3">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 transition-colors duration-200 group-hover:text-navy group-focus-visible:text-navy">
            {card.ctaLabel || 'View details'}
            <FiArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5" />
          </span>
        </div>
      ) : null}
    </div>
  </>
);

const DashboardMetricCards = ({ cards = [], className = '' }) => {
  return (
    <div className={`grid gap-2 sm:grid-cols-2 xl:grid-cols-4 ${className}`.trim()}>
      {cards.map((card) => {
        const tone = toneMap[card.tone] || toneMap.default;
        const containerClass = `group relative flex min-h-[140px] overflow-hidden rounded-[1.25rem] border bg-white px-4 pb-4 pt-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-200 ${card.to ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300' : 'hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]'} ${tone.border}`;

        if (card.to) {
          return (
            <Link
              key={card.label}
              to={card.to}
              aria-label={card.ctaLabel ? `${card.label} - ${card.ctaLabel}` : `${card.label} details`}
              className={containerClass}
            >
              {renderMetricCard(card, tone)}
            </Link>
          );
        }

        return (
          <article
            key={card.label}
            className={containerClass}
          >
            {renderMetricCard(card, tone)}
          </article>
        );
      })}
    </div>
  );
};

export default DashboardMetricCards;
