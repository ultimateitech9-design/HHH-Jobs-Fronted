import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiArrowRight,
  FiBell,
  FiBriefcase,
  FiMapPin,
  FiStar
} from 'react-icons/fi';

import useAuthStore from '../../../core/auth/authStore';
import { normalizeRole } from '../../../utils/auth';
import {
  getCompanySubscription,
  updateCompanySubscription
} from '../services/companyDirectoryApi';

const primaryActionClassName =
  'inline-flex min-h-9 min-w-0 items-center justify-center gap-1 rounded-full bg-gradient-to-r from-brand-500 via-brand-500 to-warning-400 px-2.5 py-2 text-[11px] font-black text-white shadow-[0_12px_22px_rgba(229,155,23,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_28px_rgba(229,155,23,0.24)]';

const secondaryActionClassName =
  'inline-flex min-h-9 min-w-0 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700';

const getInitials = (name = '') =>
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'CO';

const getCategoryList = (company = {}) => {
  const categories = Array.isArray(company.categories)
    ? company.categories.filter(Boolean).slice(0, 2)
    : [];

  return categories.length > 0 ? categories : ['General hiring'];
};

const buildCurrentPath = (location) =>
  `${location.pathname || ''}${location.search || ''}${location.hash || ''}`;

const canRoleSubscribeToCompany = (role) =>
  ['student', 'retired_employee', 'hr', 'campus_connect', 'admin', 'super_admin'].includes(normalizeRole(role));

const CompanyDirectoryCard = ({
  company,
  onOpenCompany,
  onSubscriptionChange,
  primaryLabel = 'Open company'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(user);
  const canSubscribe = canRoleSubscribeToCompany(user?.role);
  const [logoError, setLogoError] = useState(false);
  const [subscriptionState, setSubscriptionState] = useState({
    subscribed: Boolean(company?.subscription?.subscribed),
    loading: false
  });
  const categories = getCategoryList(company);

  const readSubscribedFlag = (subscription, fallback = false) =>
    typeof subscription?.subscribed === 'boolean' ? subscription.subscribed : fallback;

  useEffect(() => {
    let mounted = true;

    const loadSubscription = async () => {
      if (!isAuthenticated || !canSubscribe || !company?.name || !company?.slug) {
        setSubscriptionState({ subscribed: false, loading: false });
        return;
      }

      setSubscriptionState((current) => ({ ...current, loading: true }));
      const response = await getCompanySubscription({
        companySlug: company.slug,
        companyName: company.name
      });

      if (!mounted) return;

      setSubscriptionState({
        subscribed: readSubscribedFlag(response.data?.subscription),
        loading: false
      });
    };

    loadSubscription();

    return () => {
      mounted = false;
    };
  }, [canSubscribe, company?.name, company?.slug, isAuthenticated]);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast('Login first to subscribe for company job alerts.');
      navigate('/login', { state: { from: buildCurrentPath(location) } });
      return;
    }

    if (!canSubscribe) {
      toast.error('This portal role cannot subscribe to company job alerts.');
      return;
    }

    if (!company?.name || !company?.slug || subscriptionState.loading) return;

    const nextSubscribed = !subscriptionState.subscribed;
    setSubscriptionState((current) => ({ ...current, loading: true }));
    const response = await updateCompanySubscription({
      companySlug: company.slug,
      companyName: company.name,
      subscribed: nextSubscribed
    });

    if (response.error) {
      setSubscriptionState((current) => ({ ...current, loading: false }));
      toast.error(response.error);
      return;
    }

    const nextSubscription = response.data?.subscription || { subscribed: nextSubscribed };
    setSubscriptionState({
      subscribed: readSubscribedFlag(nextSubscription, nextSubscribed),
      loading: false
    });
    onSubscriptionChange?.(company, nextSubscription);
    toast.success(nextSubscribed ? `Subscribed to ${company.name}.` : `Unsubscribed from ${company.name}.`);
  };

  return (
    <article className="flex h-full min-w-0 flex-col rounded-[1rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-3 shadow-[0_10px_20px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {company.logoUrl && !logoError ? (
            <img
              src={company.logoUrl}
              alt={company.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1.5"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-black text-brand-700">
              {getInitials(company.name)}
            </div>
          )}

          <div className="min-w-0">
            <h3
              title={company.name}
              className="line-clamp-2 text-base font-bold leading-5 text-navy"
            >
              {company.name}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-[12px] leading-4 text-slate-500">
              {company.headline || company.industry || 'Hiring on HHH Jobs'}
            </p>
          </div>
        </div>

        <span className={`inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${
          company.premium
            ? 'border border-amber-200 bg-amber-50 text-amber-700'
            : 'border border-slate-200 bg-slate-50 text-slate-600'
        }`}>
          <FiStar size={10} />
          {company.premium ? 'Premium' : 'Employer'}
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="rounded-[0.8rem] border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-sm text-slate-600">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            <FiBriefcase size={11} />
            Open roles
          </p>
          <p className="mt-1 text-lg font-bold text-navy">{Number(company.totalJobs || 0)}</p>
        </div>

        <div className="rounded-[0.8rem] border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-sm text-slate-600">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            <FiMapPin size={11} />
            Location
          </p>
          <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-4 text-slate-800">
            {company.location || 'Multi-city hiring'}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex min-h-7 flex-wrap gap-1.5">
        {categories.map((category) => (
          <span
            key={`${company.id}-${category}`}
            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600"
          >
            {category}
          </span>
        ))}
      </div>

      <div className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 border-t border-slate-100 pt-3">
        <button type="button" className={`${primaryActionClassName} w-full whitespace-nowrap`} onClick={() => onOpenCompany(company)}>
          <span className="truncate">{primaryLabel}</span>
          <FiArrowRight size={13} />
        </button>

        {(!isAuthenticated || canSubscribe) ? (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={subscriptionState.loading}
            className={`${secondaryActionClassName} whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-70 ${
              subscriptionState.subscribed ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700' : ''
            }`}
          >
            <FiBell size={13} />
            {subscriptionState.loading
              ? 'Updating'
              : subscriptionState.subscribed
                ? 'Unsubscribe'
                : 'Subscribe'}
          </button>
        ) : null}
      </div>
    </article>
  );
};

export default CompanyDirectoryCard;
