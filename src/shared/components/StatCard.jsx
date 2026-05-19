const toneStyles = {
  default: {
    border: 'border-brand-200',
    chip: 'bg-brand-50 text-brand-700',
    glow: 'bg-gradient-to-br from-brand-100 to-brand-50',
    accent: 'text-brand-500',
    bar: 'bg-brand-300'
  },
  success: {
    border: 'border-success-200',
    chip: 'bg-success-50 text-success-700',
    glow: 'bg-gradient-to-br from-success-100 to-success-50',
    accent: 'text-success-600',
    bar: 'bg-success-400'
  },
  warning: {
    border: 'border-warning-200',
    chip: 'bg-warning-50 text-warning-700',
    glow: 'bg-gradient-to-br from-warning-100 to-warning-50',
    accent: 'text-warning-600',
    bar: 'bg-warning-400'
  },
  danger: {
    border: 'border-danger-200',
    chip: 'bg-danger-50 text-danger-700',
    glow: 'bg-gradient-to-br from-danger-100 to-danger-50',
    accent: 'text-danger-600',
    bar: 'bg-danger-400'
  },
  info: {
    border: 'border-info-200',
    chip: 'bg-info-50 text-info-700',
    glow: 'bg-gradient-to-br from-info-100 to-info-50',
    accent: 'text-info-600',
    bar: 'bg-info-400'
  }
};

const StatCard = ({ label, value, helper, tone = 'default' }) => {
  const styles = toneStyles[tone] || toneStyles.default;
  const toneClassName = tone === 'default' ? '' : `stat-card--${tone}`;

  return (
    <article className={`stat-card group relative min-h-[108px] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${styles.border} ${toneClassName}`.trim()}>
      <div className={`absolute -right-7 -top-7 h-24 w-24 rounded-full opacity-55 transition-transform duration-300 group-hover:scale-110 ${styles.glow}`} />
      <div className={`absolute bottom-0 left-0 h-0.5 w-full ${styles.bar} opacity-40`} />
      <div className="relative z-10">
        <p className={`stat-label ${styles.accent}`}>{label}</p>
        <p className="stat-value font-heading font-extrabold leading-none text-navy">{value}</p>
        {helper ? (
          <p className={`stat-helper inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${styles.chip}`}>
            {helper}
          </p>
        ) : null}
      </div>
    </article>
  );
};

export default StatCard;
