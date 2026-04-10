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
  compact = false
}) => {
  if (providersLoading) {
    return (
      <p className="py-2 text-center text-sm font-semibold text-gold-dark">
        Loading social sign-in...
      </p>
    );
  }

  const visibleProviders = availableProviders === null
    ? providerConfig
    : providerConfig.filter((p) => availableProviders.includes(p.key));

  if (visibleProviders.length === 0) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {visibleProviders.map((provider) => {
        const Icon = provider.icon;

        return (
          <button
            key={provider.key}
            type="button"
            onClick={() => onProviderClick(provider.key)}
            disabled={disabled}
            className={`inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 ${compact ? 'py-1.5 text-[13px]' : 'py-2 text-sm'} font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-brand-100 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-70`.trim()}
          >
            <span className={`flex items-center justify-center rounded-full bg-slate-100 text-slate-600 ${compact ? 'h-5 w-5' : 'h-6 w-6'}`.trim()}>
              <Icon size={compact ? 12 : 14} />
            </span>
            <span>{loading === provider.key ? 'Redirecting...' : provider.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default AuthSocialButtons;
