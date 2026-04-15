import { FiChrome, FiLinkedin } from 'react-icons/fi';

const providerConfig = [
  { key: 'google', label: 'Google', icon: FiChrome },
  { key: 'linkedin', label: 'LinkedIn', icon: FiLinkedin }
];

const AuthSocialButtons = ({
  onProviderClick,
  loading = '',
  disabled = false,
  availableProviders = null,
  providersLoading = false,
  compact = false,
  premium = false
}) => {
  if (providersLoading) {
    return (
      <p className="py-1.5 text-center text-sm font-semibold text-gold-dark">
        Loading social sign-in...
      </p>
    );
  }

  const visibleProviders = availableProviders === null
    ? providerConfig
    : providerConfig.filter((p) => availableProviders.includes(p.key));

  if (visibleProviders.length === 0) return null;

  return (
    <div className={`grid ${compact ? (premium ? 'grid-cols-2 gap-2.5' : 'gap-1.5 sm:grid-cols-2') : 'gap-2 sm:grid-cols-2'}`}>
      {visibleProviders.map((provider) => {
        const Icon = provider.icon;

        return (
          <button
            key={provider.key}
            type="button"
            onClick={() => onProviderClick(provider.key)}
            disabled={disabled}
            className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden border px-4 ${
              premium
                ? compact
                  ? 'min-h-[44px] rounded-[1.25rem] py-2 text-[13px]'
                  : 'rounded-full py-2 text-sm'
                : compact
                  ? 'min-h-[38px] rounded-full py-1.5 text-[13px]'
                  : 'rounded-full py-2 text-sm'
            } font-semibold transition-all duration-200 ${
              premium
                ? 'border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.97)_100%)] text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.07)] hover:-translate-y-0.5 hover:border-[#e4bc76] hover:bg-[linear-gradient(180deg,#fffefb_0%,#fff7e8_100%)] hover:text-slate-900 hover:shadow-[0_16px_28px_rgba(15,23,42,0.12)]'
                : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-brand-100 hover:bg-brand-50'
            } disabled:cursor-not-allowed disabled:opacity-70`.trim()}
          >
            {premium ? (
              <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
            ) : null}
            <span
              className={`flex items-center justify-center rounded-full ${
                premium
                  ? 'bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fb_100%)] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'
                  : 'bg-slate-100 text-slate-600'
              } ${compact ? (premium ? 'h-6 w-6' : 'h-5 w-5') : 'h-6 w-6'}`.trim()}
            >
              <Icon size={compact ? (premium ? 13 : 12) : 14} />
            </span>
            <span>{loading === provider.key ? 'Redirecting...' : provider.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default AuthSocialButtons;
