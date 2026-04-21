export const dashboardSectionActionClassName =
  'group inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-brand-200/80 bg-[linear-gradient(180deg,rgba(239,246,255,0.96),rgba(255,255,255,0.98))] px-4 py-2 text-sm font-bold text-brand-700 shadow-[0_8px_20px_rgba(37,99,235,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-800 hover:shadow-[0_14px_28px_rgba(37,99,235,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2';

export const getDashboardHeroActionClassName = ({ variant = 'primary', compact = true } = {}) => {
  const sizeClass = compact
    ? 'min-h-[44px] px-4 py-2 text-[12px] sm:px-4.5 sm:text-[13px]'
    : 'min-h-[48px] px-5 py-3 text-sm';

  const baseClass = `group inline-flex items-center justify-center gap-2 rounded-full font-black tracking-[0.01em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${sizeClass}`;

  if (variant === 'secondary') {
    return `${baseClass} border border-white/18 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md hover:-translate-y-0.5 hover:bg-white/18`;
  }

  return `${baseClass} border border-white/75 bg-white text-slate-950 shadow-[0_14px_34px_rgba(15,23,42,0.22)] hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_18px_38px_rgba(15,23,42,0.28)]`;
};

export const getDashboardWorkspaceButtonClassName = (active) =>
  active
    ? 'inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-900 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(37,99,235,0.92))] px-4 py-2 text-sm font-bold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(15,23,42,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2'
    : 'inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2';
