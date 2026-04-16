import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiBarChart2,
  FiBell,
  FiBookmark,
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiLayers,
  FiShield,
  FiTrendingUp
} from 'react-icons/fi';
import { FaGem, FaMedal } from 'react-icons/fa';
import PublicCallToAction from '../components/publicPages/PublicCallToAction';
import PublicFeatureCard from '../components/publicPages/PublicFeatureCard';
import PublicPageHero from '../components/publicPages/PublicPageHero';
import PublicSectionHeader from '../components/publicPages/PublicSectionHeader';
import { getCurrentUser } from '../../../utils/auth';

const serviceCards = [
  {
    title: 'Job Discovery',
    description: 'Discover stronger-fit opportunities with clearer search and more relevant recommendations.',
    icon: FiBriefcase
  },
  {
    title: 'Resume & Profile',
    description: 'Strengthen resume quality and profile presentation so recruiters can assess you with confidence.',
    icon: FiFileText
  },
  {
    title: 'Career Growth',
    description: 'Improve interview readiness, track progress, and build momentum with each application cycle.',
    icon: FiTrendingUp
  },
  {
    title: 'Alerts & Notifications',
    description: 'Stay informed about important updates, application movement, and next steps without losing track.',
    icon: FiBell
  }
];

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

const jobPostingPlans = [
  {
    title: 'Premium',
    tone: 'premium',
    price: '₹1,200',
    previousPrice: '₹2,000',
    discountText: '40% OFF',
    taxNote: '*GST as applicable',
    features: [
      { label: 'Detailed job description', included: true },
      { label: '20 job locations', included: true },
      { label: 'Unlimited applies', included: true },
      { label: 'Applies expiry 90 days', included: true },
      { label: 'Jobseeker contact details visible', included: true },
      { label: 'Boost on Job Search Page', included: true },
      { label: 'Job Branding', included: true }
    ],
    offerText: 'Flat 10% OFF on 5 Job Postings or more',
    ctaLabel: 'Buy now',
    ctaTo: '/sign-up?plan=Premium',
    withQuantity: true,
    validity: 'Job validity 30 days'
  },
  {
    title: 'Pro',
    tone: 'pro',
    price: '₹600',
    previousPrice: '₹1000',
    discountText: '40% OFF',
    taxNote: '*GST as applicable',
    features: [
      { label: 'Upto 250 character job description', included: true },
      { label: '8 job locations', included: true },
      { label: 'Unlimited applies', included: true },
      { label: 'Applies expiry 60 days', included: true },
      { label: 'Jobseeker contact details visible', included: true },
      { label: 'Boost on Job Search Page', included: false },
      { label: 'Job Branding', included: false }
    ],
    offerText: 'Flat 10% OFF on 5 Job Postings or more',
    ctaLabel: 'Buy now',
    ctaTo: '/sign-up?plan=Pro',
    withQuantity: true,
    validity: 'Job validity 30 days'
  },
  {
    title: 'Standard',
    tone: 'standard',
    price: '₹300',
    previousPrice: '₹500',
    discountText: '40% OFF',
    taxNote: '*GST as applicable',
    features: [
      { label: 'Upto 250 character job description', included: true },
      { label: '3 job locations', included: true },
      { label: '200 applies', included: true },
      { label: 'Applies expiry 30 days', included: true },
      { label: 'Jobseeker contact details visible', included: false },
      { label: 'Boost on Job Search Page', included: false },
      { label: 'Job Branding', included: false }
    ],
    offerText: 'Flat 10% OFF on 5 Job Postings or more',
    ctaLabel: 'Buy now',
    ctaTo: '/sign-up?plan=Standard',
    withQuantity: true,
    validity: 'Job validity 15 days'
  },
  {
    title: 'Free',
    tone: 'free',
    price: 'Free',
    subTitle: 'Job Posting',
    features: [
      { label: 'Upto 250 character job description', included: true },
      { label: '1 job location', included: true },
      { label: '50 applies', included: true },
      { label: 'Applies expiry 15 days', included: true },
      { label: 'Jobseeker contact details visible', included: false },
      { label: 'Boost on Job Search Page', included: false },
      { label: 'Job Branding', included: false }
    ],
    ctaLabel: 'Post a free job',
    ctaTo: '/sign-up?plan=Free',
    withQuantity: false,
    validity: 'Job validity 7 days'
  }
];

const resumeDatabasePlans = [
  {
    title: 'Gold',
    tone: 'gold',
    icon: FaMedal,
    subTitle: 'Best for small and medium businesses with focused hiring needs',
    price: '₹3,600',
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

const ServicesPage = () => {
  const user = getCurrentUser();
  const isStudent = user?.role === 'student';
  const isHr = user?.role === 'hr' || user?.role === 'admin';
  const fallbackPath = '/login';
  const [activePremiumKey, setActivePremiumKey] = useState(premiumFeatures[0].key);

  const getServicePath = (title) => (isStudent ? (studentServicePaths[title] || '/portal/student/home') : fallbackPath);
  const atsPath = isStudent ? '/portal/student/ats' : isHr ? '/portal/hr/ats' : '/login';
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
    <div className="pb-16 md:pb-24">
      <PublicPageHero
        eyebrow="Career Services"
        title={<>Career Services That Strengthen <span className="gradient-text">Every Hiring Move</span></>}
        description="Explore the tools, plans, and premium advantages that help candidates present themselves better and help employers hire with more confidence."
        chips={['Candidate tools', 'Employer plans', 'ATS support']}
        actions={[
          { label: 'Explore Candidate Tools', to: isStudent ? '/portal/student/jobs' : '/sign-up' },
          { label: 'Open ATS Review', to: atsPath, variant: 'ghost' }
        ]}
        metrics={[
          { label: 'Candidate Tools', value: '4 Core Services', helper: 'Discovery, profile, growth, and alerts' },
          { label: 'Premium Features', value: '3 Visibility Boosts', helper: 'Priority, discoverability, and application clarity' },
          { label: 'Employer Plans', value: '4 Hiring Options', helper: 'From entry-level posting to premium reach' }
        ]}
        aside={
          <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-brand-700 to-indigo-700 p-6 text-white shadow-xl">
            <h2 className="font-heading text-2xl font-extrabold">Why these services matter</h2>
            <div className="mt-6 space-y-3">
              {[
                'Improve search quality and application readiness',
                'Strengthen recruiter trust through better visibility',
                'Choose hiring plans that match real team demand'
              ].map((item) => (
                <div key={item} className="rounded-[1.4rem] border border-white/14 bg-white/10 px-4 py-3 text-sm font-semibold text-white/88">
                  {item}
                </div>
              ))}
            </div>
          </div>
        }
      />

      <section className="container mx-auto max-w-7xl px-4">
        <PublicSectionHeader
          centered
          eyebrow="Core Services"
          title="Services that support a serious job search"
          description="Each module is built around a practical need: discover stronger roles, improve presentation, apply with confidence, and track progress clearly."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {serviceCards.map((item, index) => (
            <PublicFeatureCard
              key={item.title}
              delay={index * 0.05}
              icon={item.icon}
              title={item.title}
              description={item.description}
              to={getServicePath(item.title)}
              ctaLabel="Open module"
            />
          ))}
        </div>

        <Link
          to={atsPath}
          className="mt-8 flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-gradient-to-br from-slate-950 via-brand-700 to-indigo-700 p-8 text-white shadow-xl transition-all hover:-translate-y-1 md:flex-row md:items-center"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/16 bg-white/10">
              <FiBarChart2 size={24} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/65">ATS Resume Score</p>
              <h3 className="mt-2 font-heading text-2xl font-extrabold">Review resume compatibility before you apply</h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/74">
                Review keyword coverage, structure, and ATS readiness before your resume reaches employers.
              </p>
            </div>
          </div>
          <span className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900">
            Review My Resume
          </span>
        </Link>
      </section>

      <section className="container mx-auto mt-16 max-w-7xl px-4">
        <div className="rounded-[2.6rem] border border-brand-100 bg-brand-50 p-8 md:p-12">
          <PublicSectionHeader
            centered
            eyebrow="Premium Upgrades"
            title="Get more visibility when timing and discoverability matter"
            description="Premium upgrades focus on surface area: stronger profile placement, better recruiter visibility, and faster application signal."
          />

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="grid gap-3">
              {premiumFeatures.map((feature) => (
                <button
                  key={feature.key}
                  type="button"
                  onClick={() => setActivePremiumKey(feature.key)}
                  className={`w-full rounded-[1.4rem] px-5 py-4 text-left text-sm font-semibold transition-all ${
                    feature.key === activePremiumKey
                      ? 'border border-brand-100 bg-white text-brand-700 shadow-md'
                      : 'border border-transparent bg-white/50 text-slate-600 hover:bg-white'
                  }`}
                >
                  {feature.tabLabel}
                </button>
              ))}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                <ActivePremiumIcon size={28} />
              </span>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-brand-700">
                {activePremiumFeature.subtitle}
              </p>
              <h3 className="mt-3 font-heading text-3xl font-extrabold text-navy">
                {activePremiumFeature.title}
              </h3>
              <p className="mt-4 text-base leading-8 text-slate-600">
                {activePremiumFeature.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={premiumCtaPath}
                  className="inline-flex rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white"
                >
                  Go Premium Now
                </Link>
                <Link
                  to={premiumLearnMorePath(activePremiumKey)}
                  className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold text-navy"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto mt-16 max-w-7xl px-4">
        <PublicSectionHeader
          centered
          eyebrow="For Employers"
          title="Job posting plans designed for hiring volume and reach"
          description="Choose the plan that fits your current recruiting volume, visibility needs, and shortlisting speed."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {jobPostingPlans.map((plan) => (
            <article
              key={plan.title}
              className={`flex flex-col rounded-[2rem] border p-7 ${planWrapperClassByTone[plan.tone]}`}
            >
              <div>
                <h3 className={`font-heading text-2xl font-extrabold ${plan.tone === 'premium' ? 'text-white' : 'text-navy'}`}>
                  {plan.title}
                </h3>
                <div className="mt-4">
                  <span className="text-4xl font-black">{plan.price}</span>
                </div>
                {plan.previousPrice ? (
                  <div className={`mt-2 flex items-center gap-2 text-sm font-semibold ${plan.tone === 'premium' ? 'text-white/72' : 'text-slate-500'}`}>
                    <s>{plan.previousPrice}</s>
                    <span className={plan.tone === 'premium' ? 'text-amber-200' : 'text-emerald-700'}>
                      {plan.discountText}
                    </span>
                  </div>
                ) : null}
                <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.18em] ${plan.tone === 'premium' ? 'text-white/58' : 'text-slate-400'}`}>
                  {plan.taxNote || plan.subTitle}
                </p>
                {plan.offerText ? (
                  <p className={`mt-4 rounded-xl px-3 py-2 text-xs font-bold ${plan.tone === 'premium' ? 'bg-white/10 text-white' : 'bg-orange-50 text-orange-700'}`}>
                    {plan.offerText}
                  </p>
                ) : null}
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature.label}
                    className={`flex items-start gap-3 text-sm ${feature.included ? '' : 'opacity-40'} ${
                      plan.tone === 'premium' ? 'text-white/86' : 'text-slate-600'
                    }`}
                  >
                    <FiCheckCircle className={`mt-0.5 shrink-0 ${plan.tone === 'premium' ? 'text-amber-200' : 'text-brand-700'}`} />
                    <span>{feature.label}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                {plan.withQuantity ? (
                  <select
                    defaultValue="01"
                    className={`mb-4 w-full rounded-xl border px-4 py-3 text-sm font-semibold ${
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
                <Link
                  to={plan.ctaTo}
                  className={`block rounded-full px-5 py-3 text-center text-sm font-semibold ${
                    plan.tone === 'premium'
                      ? 'bg-white text-navy'
                      : 'gradient-gold text-primary shadow-lg shadow-gold/20'
                  }`}
                >
                  {plan.ctaLabel}
                </Link>
                <p className={`mt-3 text-center text-xs font-semibold uppercase tracking-[0.18em] ${plan.tone === 'premium' ? 'text-white/58' : 'text-slate-400'}`}>
                  {plan.validity}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container mx-auto mt-16 max-w-7xl px-4">
        <div className="rounded-[2.6rem] bg-slate-950 p-8 text-white shadow-2xl md:p-12">
          <PublicSectionHeader
            centered
            eyebrow="Resume Database"
            title="Search a larger candidate pool with resume database access"
            description="For employers who need active sourcing instead of waiting only for inbound applications."
            className="text-white [&_h2]:text-white [&_p]:text-white/72 [&_p:first-child]:text-white/60"
          />

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {resumeDatabasePlans.map((plan) => {
              const Icon = plan.icon;
              const isGold = plan.tone === 'gold';

              return (
                <article
                  key={plan.title}
                  className={`flex flex-col rounded-[2rem] border p-7 ${planWrapperClassByTone[plan.tone]}`}
                >
                  <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isGold ? 'bg-white text-amber-600' : 'bg-slate-800 text-slate-200'}`}>
                    <Icon size={24} />
                  </span>
                  <h3 className="mt-6 font-heading text-2xl font-extrabold">
                    {plan.title} Plan
                  </h3>
                  <p className={`mt-3 min-h-[56px] text-sm leading-7 ${isGold ? 'text-white/78' : 'text-white/72'}`}>
                    {plan.subTitle}
                  </p>
                  <div className="mt-5">
                    <span className="text-4xl font-black">{plan.price}</span>
                  </div>
                  <p className={`mt-2 text-xs font-semibold uppercase tracking-[0.18em] ${isGold ? 'text-amber-100' : 'text-slate-400'}`}>
                    {plan.taxNote}
                  </p>
                  {plan.offerText ? (
                    <p className={`mt-4 rounded-xl px-3 py-2 text-xs font-bold ${isGold ? 'bg-white/10 text-white' : 'bg-slate-800 text-slate-300'}`}>
                      {plan.offerText}
                    </p>
                  ) : null}

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className={`flex items-start gap-3 text-sm ${isGold ? 'text-white/86' : 'text-slate-200'}`}>
                        <FiCheckCircle className={`mt-0.5 shrink-0 ${isGold ? 'text-amber-200' : 'text-brand-300'}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-8">
                    {plan.withQuantity ? (
                      <select defaultValue="01" className="mb-4 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white">
                        <option value="01">1 Requirement</option>
                        <option value="03">3 Requirements</option>
                        <option value="05">5 Requirements</option>
                      </select>
                    ) : null}
                    <Link
                      to={plan.ctaTo}
                      className={`block rounded-full px-5 py-3 text-center text-sm font-semibold ${
                        isGold ? 'bg-white text-amber-700' : 'gradient-gold text-primary shadow-lg shadow-gold/20'
                      }`}
                    >
                      {plan.ctaLabel}
                    </Link>
                    <p className={`mt-3 text-center text-xs font-semibold uppercase tracking-[0.18em] ${isGold ? 'text-amber-100' : 'text-slate-400'}`}>
                      {plan.validity}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <div className="container mx-auto mt-16 max-w-7xl px-4">
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
