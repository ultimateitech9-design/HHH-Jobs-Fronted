import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiBookmark,
  FiCheckCircle,
  FiFileText,
  FiLayers,
  FiShield,
} from 'react-icons/fi';
import { FaGem, FaMedal } from 'react-icons/fa';
import PublicCallToAction from '../components/publicPages/PublicCallToAction';
import PublicSectionHeader from '../components/publicPages/PublicSectionHeader';
import { getCurrentUser } from '../../../utils/auth';
import { jobPostingPlans } from '../../../shared/config/pricingCatalog';

const premiumFeatures = [
  {
    key: 'fast-track',
    tabLabel: 'Fast Track Application',
    title: 'Fast Track Application',
    subtitle: 'Priority application visibility',
    description: 'Improve the visibility of time-sensitive applications when recruiter review windows are narrow.',
    icon: FiLayers
  },
  {
    key: 'direct-connect',
    tabLabel: 'Direct Recruiter Connect',
    title: 'Direct Recruiter Connect',
    subtitle: 'Application status visibility',
    description: 'Stay closer to recruiter-side activity and keep application progress easier to understand.',
    icon: FiFileText
  },
  {
    key: 'profile-priority',
    tabLabel: 'Profile Priority Ranking',
    title: 'Profile Priority Ranking',
    subtitle: 'Improved recruiter discovery',
    description: 'Increase profile discoverability in higher-intent searches and stronger role-fit recommendations.',
    icon: FiShield
  }
];

const resumeDatabasePlans = [
  {
    title: 'Gold',
    tone: 'gold',
    icon: FaMedal,
    subTitle: 'Best for small and medium businesses with focused hiring needs',
    price: '₹3,600',
    numericPrice: 3600,
    taxNote: '*GST as applicable',
    offerText: 'Flat ₹1,500 OFF on purchasing 3 requirements',
    features: [
      '150 CV views per requirement',
      'Up to 600 search results',
      'Candidates active in last 6 months',
      '10+ advanced filters',
      'Single user access',
      '1 search query (role, location) per requirement'
    ],
    ctaLabel: 'Buy now',
    ctaTo: '/sign-up?plan=Gold',
    validity: 'Database validity 15 days',
    withQuantity: true
  },
  {
    title: 'Diamond',
    tone: 'dimond',
    icon: FaGem,
    subTitle: 'Customised database access and dedicated support for larger, more complex hiring needs',
    price: "Let's customize",
    taxNote: 'Based on your plan',
    features: [
      'CV views as per plan',
      'Unlimited search results',
      'All available candidates',
      '20+ advanced filters',
      'Multiple user access',
      'Email multiple candidates together',
      'Boolean keyword search',
      'Download CVs in bulk'
    ],
    ctaLabel: 'Contact sales',
    ctaTo: '/contact-us?source=dimond-plan',
    validity: 'Database validity as per the plan',
    withQuantity: false
  }
];

const studentServicePaths = {
  'Job Discovery': '/portal/student/jobs',
  'Resume & Profile': '/portal/student/profile?section=resume&focus=resume-builder#resume-builder',
  'Career Growth': '/portal/student/analytics',
  'Alerts & Notifications': '/portal/student/notifications',
  'ATS Resume Score': '/portal/student/ats'
};

const planWrapperClassByTone = {
  premium: 'bg-gradient-to-br from-slate-950 via-brand-700 to-indigo-700 text-white border-transparent shadow-2xl',
  pro: 'bg-white border-slate-200 shadow-sm',
  standard: 'bg-white border-slate-200 shadow-sm',
  free: 'bg-white border-slate-200 shadow-sm',
  gold: 'bg-gradient-to-br from-amber-500 to-amber-700 text-white border-amber-300/40 shadow-2xl',
  dimond: 'bg-slate-900 text-white border-slate-800 shadow-xl'
};

const buildPlanLink = (path, extraParams = {}) => {
  const [pathname, existingSearch = ''] = String(path || '').split('?');
  const searchParams = new URLSearchParams(existingSearch);

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return `${pathname}${query ? `?${query}` : ''}`;
};

const formatPlanPrice = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const ServicesPage = () => {
  const user = getCurrentUser();
  const isStudent = user?.role === 'student';
  const isHr = user?.role === 'hr' || user?.role === 'admin';
  const [activePremiumKey, setActivePremiumKey] = useState(premiumFeatures[0].key);
  const [jobPostingQuantities, setJobPostingQuantities] = useState(() => (
    Object.fromEntries(jobPostingPlans.filter((plan) => plan.withQuantity).map((plan) => [plan.slug, '01']))
  ));
  const [resumePlanQuantities, setResumePlanQuantities] = useState(() => (
    Object.fromEntries(resumeDatabasePlans.filter((plan) => plan.withQuantity).map((plan) => [plan.title, '01']))
  ));

  const premiumCtaPath = isStudent ? '/contact-us' : isHr ? '/portal/hr/jobs' : '/sign-up';
  const premiumLearnMorePath = (featureKey) => {
    if (isStudent) {
      if (featureKey === 'fast-track') return '/portal/student/jobs';
      if (featureKey === 'direct-connect') return '/portal/student/applications';
      if (featureKey === 'profile-priority') return '/portal/student/profile?section=resume&focus=resume-builder#resume-builder';
      return '/portal/student/home';
    }

    if (isHr) return '/portal/hr/jobs';
    return '/sign-up';
  };

  const activePremiumFeature = premiumFeatures.find((feature) => feature.key === activePremiumKey) || premiumFeatures[0];
  const ActivePremiumIcon = activePremiumFeature.icon;

  return (
    <div className="pb-9 md:pb-12">
      <section className="container mx-auto mt-4 max-w-[72rem] px-4 md:mt-5">
        <PublicSectionHeader
          centered
          eyebrow="For Employers"
          title="Job posting plans designed for hiring volume and reach"
        />

        <div className="mt-4.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {jobPostingPlans.map((plan) => {
            const selectedQuantity = Number(jobPostingQuantities[plan.slug] || '01');
            const ctaTo = plan.withQuantity ? buildPlanLink(plan.ctaTo, { quantity: selectedQuantity }) : plan.ctaTo;
            const displayPrice = plan.withQuantity && plan.numericPrice
              ? formatPlanPrice(plan.numericPrice * selectedQuantity)
              : plan.price;

            return (
              <article
                key={plan.title}
                className={`flex flex-col rounded-[1.05rem] border p-2.5 md:p-3 ${planWrapperClassByTone[plan.tone]}`}
              >
              <div>
                <h3 className={`font-heading text-[1.2rem] font-extrabold ${plan.tone === 'premium' ? 'text-white' : 'text-navy'}`}>
                  {plan.title}
                </h3>
                <div className="mt-1.5">
                  <span className="text-[1.35rem] font-black leading-none">{displayPrice}</span>
                </div>
                {plan.previousPrice ? (
                  <div className={`mt-1 flex items-center gap-1.5 text-[13px] font-semibold ${plan.tone === 'premium' ? 'text-white/72' : 'text-slate-500'}`}>
                    <s>{plan.previousPrice}</s>
                    <span className={plan.tone === 'premium' ? 'text-amber-200' : 'text-emerald-700'}>
                      {plan.discountText}
                    </span>
                  </div>
                ) : null}
                <p className={`mt-1 text-[8.5px] font-semibold uppercase tracking-[0.13em] ${plan.tone === 'premium' ? 'text-white/58' : 'text-slate-400'}`}>
                  {plan.taxNote || plan.subTitle}
                </p>
                {plan.offerText ? (
                  <p className={`mt-1.5 rounded-xl px-2 py-1 text-[8.5px] font-bold leading-4 ${plan.tone === 'premium' ? 'bg-white/10 text-white' : 'bg-orange-50 text-orange-700'}`}>
                    {plan.offerText}
                  </p>
                ) : null}
              </div>

              <ul className="mt-3 space-y-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature.label}
                    className={`flex items-start gap-1.5 text-[11.5px] leading-[1.35rem] ${feature.included ? '' : 'opacity-40'} ${
                      plan.tone === 'premium' ? 'text-white/86' : 'text-slate-600'
                    }`}
                  >
                    <FiCheckCircle className={`mt-0.5 shrink-0 ${plan.tone === 'premium' ? 'text-amber-200' : 'text-brand-700'}`} />
                    <span>{feature.label}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-2.5">
                {plan.withQuantity ? (
                  <select
                    value={jobPostingQuantities[plan.slug] || '01'}
                    onChange={(event) => setJobPostingQuantities((current) => ({ ...current, [plan.slug]: event.target.value }))}
                    className={`mb-2 w-full rounded-xl border px-3 py-1.5 text-[10.5px] font-semibold ${
                      plan.tone === 'premium'
                        ? 'border-white/20 bg-white/10 text-white'
                        : 'border-slate-200 bg-slate-50 text-navy'
                    }`}
                  >
                    <option value="01">1 Job Post</option>
                    <option value="02">2 Job Posts</option>
                    <option value="03">3 Job Posts</option>
                    <option value="05">5 Job Posts</option>
                  </select>
                ) : null}
                {plan.withQuantity ? (
                  <p className={`mb-2 text-center text-[9px] font-semibold uppercase tracking-[0.13em] ${plan.tone === 'premium' ? 'text-white/70' : 'text-slate-500'}`}>
                    {selectedQuantity} job post{selectedQuantity > 1 ? 's' : ''} selected
                  </p>
                ) : null}
                <Link
                  to={ctaTo}
                  className={`block rounded-full px-4 py-1.5 text-center text-[10.5px] font-semibold ${
                    plan.tone === 'premium'
                      ? 'bg-white text-navy'
                      : 'gradient-gold text-primary shadow-lg shadow-gold/20'
                  }`}
                >
                  {plan.ctaLabel}
                </Link>
                <p className={`mt-1.5 text-center text-[8.5px] font-semibold uppercase tracking-[0.13em] ${plan.tone === 'premium' ? 'text-white/58' : 'text-slate-400'}`}>
                  {plan.validity}
                </p>
              </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-5 px-4 md:px-6">
        <div className="mx-auto max-w-[72rem] rounded-[1.3rem] bg-slate-950 p-3 text-white shadow-2xl md:p-3.5">
          <PublicSectionHeader
            centered
            eyebrow="Resume Database"
            title="Search a larger candidate pool with resume database access"
            compact
            className="text-white [&_h2]:text-white [&_h2]:max-w-[44rem] [&_h2]:mx-auto [&_p]:text-white/72 [&_p:first-child]:text-white/60"
          />

          <div className="mt-4 grid gap-2.5 md:grid-cols-2">
            {resumeDatabasePlans.map((plan) => {
              const Icon = plan.icon;
              const isGold = plan.tone === 'gold';
              const selectedQuantity = Number(resumePlanQuantities[plan.title] || '01');
              const ctaTo = plan.withQuantity ? buildPlanLink(plan.ctaTo, { quantity: selectedQuantity }) : plan.ctaTo;
              const displayPrice = plan.withQuantity && plan.numericPrice
                ? formatPlanPrice(plan.numericPrice * selectedQuantity)
                : plan.price;

              return (
                <article
                  key={plan.title}
                  className={`flex flex-col rounded-[1.05rem] border p-2.5 ${planWrapperClassByTone[plan.tone]}`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${isGold ? 'bg-white text-amber-600' : 'bg-slate-800 text-slate-200'}`}>
                    <Icon size={15} />
                  </span>
                  <h3 className="mt-2 font-heading text-[0.92rem] font-extrabold md:text-[1.08rem]">
                    {plan.title} Plan
                  </h3>
                  <p className={`mt-1 min-h-[28px] text-[11.5px] leading-[1.3rem] ${isGold ? 'text-white/78' : 'text-white/72'}`}>
                    {plan.subTitle}
                  </p>
                  <div className="mt-2">
                    <span className="text-[1.26rem] font-black md:text-[1.45rem]">{displayPrice}</span>
                  </div>
                  <p className={`mt-1 text-[9.5px] font-semibold uppercase tracking-[0.13em] ${isGold ? 'text-amber-100' : 'text-slate-400'}`}>
                    {plan.taxNote}
                  </p>
                  {plan.offerText ? (
                    <p className={`mt-1.5 rounded-xl px-2.5 py-1 text-[8.5px] font-bold ${isGold ? 'bg-white/10 text-white' : 'bg-slate-800 text-slate-300'}`}>
                      {plan.offerText}
                    </p>
                  ) : null}

                  <ul className="mt-3 space-y-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className={`flex items-start gap-1.5 text-[11.5px] leading-[1.35rem] ${isGold ? 'text-white/86' : 'text-slate-200'}`}>
                        <FiCheckCircle className={`mt-0.5 shrink-0 ${isGold ? 'text-amber-200' : 'text-brand-300'}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-2.5">
                    {plan.withQuantity ? (
                      <select
                        value={resumePlanQuantities[plan.title] || '01'}
                        onChange={(event) => setResumePlanQuantities((current) => ({ ...current, [plan.title]: event.target.value }))}
                        className="mb-2 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-[10.5px] font-semibold text-white"
                      >
                        <option value="01">1 Requirement</option>
                        <option value="03">3 Requirements</option>
                        <option value="05">5 Requirements</option>
                      </select>
                    ) : null}
                    {plan.withQuantity ? (
                      <p className={`mb-2 text-center text-[9px] font-semibold uppercase tracking-[0.13em] ${isGold ? 'text-amber-100' : 'text-slate-400'}`}>
                        {selectedQuantity} requirement{selectedQuantity > 1 ? 's' : ''} selected
                      </p>
                    ) : null}
                    <Link
                      to={ctaTo}
                      className={`block rounded-full px-4 py-1.5 text-center text-[10.5px] font-semibold ${
                        isGold ? 'bg-white text-amber-700' : 'gradient-gold text-primary shadow-lg shadow-gold/20'
                      }`}
                    >
                      {plan.ctaLabel}
                    </Link>
                    <p className={`mt-1.5 text-center text-[9.5px] font-semibold uppercase tracking-[0.13em] ${isGold ? 'text-amber-100' : 'text-slate-400'}`}>
                      {plan.validity}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto mt-9 max-w-[72rem] px-4">
        <div className="rounded-[1.7rem] border border-brand-100 bg-brand-50 p-4 sm:p-5 md:p-6">
          <PublicSectionHeader
            centered
            eyebrow="Premium Upgrades"
            title="Get more visibility when timing and discoverability matter"
            description="Premium upgrades focus on surface area: stronger profile placement, better recruiter visibility, and faster application signal."
          />

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-5">
            <div className="grid min-w-0 gap-2.5">
              {premiumFeatures.map((feature) => (
                <button
                  key={feature.key}
                  type="button"
                  onClick={() => setActivePremiumKey(feature.key)}
                  className={`min-w-0 overflow-hidden rounded-[1rem] px-3 py-2.5 text-left text-[11.5px] font-semibold transition-all ${
                    feature.key === activePremiumKey
                      ? 'border border-brand-100 bg-white text-brand-700 shadow-md'
                      : 'border border-transparent bg-white/50 text-slate-600 hover:bg-white'
                  }`}
                >
                  <span className="block break-words">{feature.tabLabel}</span>
                </button>
              ))}
            </div>

            <div className="min-w-0 overflow-hidden rounded-[1.3rem] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                <ActivePremiumIcon size={19} />
              </span>
              <p className="mt-3 text-[9.5px] font-black uppercase tracking-[0.17em] text-brand-700">
                {activePremiumFeature.subtitle}
              </p>
              <h3 className="mt-2 break-words font-heading text-[1.45rem] font-extrabold text-navy">
                {activePremiumFeature.title}
              </h3>
              <p className="mt-2.5 break-words text-[13.5px] leading-6 text-slate-600">
                {activePremiumFeature.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={premiumCtaPath}
                  className="inline-flex min-w-0 items-center justify-center rounded-full bg-navy px-4 py-2 text-[11.5px] font-semibold text-white"
                >
                  Go Premium Now
                </Link>
                <Link
                  to={premiumLearnMorePath(activePremiumKey)}
                  className="inline-flex min-w-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11.5px] font-semibold text-navy"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto mt-9 max-w-[72rem] px-4">
        <PublicCallToAction
          eyebrow="HHH Jobs Services"
          title="Use candidate tools and recruiter plans from the same platform"
          description="From ATS checks to premium hiring plans, the services layer is built to keep the product useful for both job seekers and employers."
          actions={[
            { label: 'Create Free Account', to: '/sign-up' },
            { label: 'Contact Sales', to: '/contact-us' }
          ]}
          chips={['Candidate tools', 'Employer plans', 'Premium visibility']}
        />
      </div>
    </div>
  );
};

export default ServicesPage;
