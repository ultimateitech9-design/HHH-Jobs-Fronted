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

  return (
    <article className={`group relative min-h-[116px] overflow-hidden rounded-[1.35rem] border bg-white px-5 py-4 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-26px_rgba(15,23,42,0.34)] ${styles.border}`}>
      <div className={`absolute -right-7 -top-7 h-24 w-24 rounded-full opacity-55 transition-transform duration-300 group-hover:scale-110 ${styles.glow}`} />
      <div className={`absolute bottom-0 left-0 h-0.5 w-full ${styles.bar} opacity-40`} />
      <div className="relative z-10">
        <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${styles.accent}`}>{label}</p>
        <p className="mt-2 font-heading text-[1.65rem] font-extrabold leading-none text-navy">{value}</p>
        {helper ? (
          <p className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles.chip}`}>
            {helper}
          </p>
        ) : null}
      </div>
    </article>
  );
};

export default StatCard;
