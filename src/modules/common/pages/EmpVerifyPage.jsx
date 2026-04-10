import { FiArrowUpRight, FiCheckCircle, FiClock, FiGlobe, FiLock, FiShield } from 'react-icons/fi';
import PublicCallToAction from '../components/publicPages/PublicCallToAction';
import PublicFeatureCard from '../components/publicPages/PublicFeatureCard';
import PublicPageHero from '../components/publicPages/PublicPageHero';
import PublicSectionHeader from '../components/publicPages/PublicSectionHeader';

const highlights = [
  {
    title: 'Automated Verification Flow',
    description: 'Employer and candidate checks move through a structured digital workflow that supports faster review cycles.',
    icon: FiCheckCircle
  },
  {
    title: 'Fast Turnaround',
    description: 'Verification responses are designed to reduce waiting time when hiring decisions need to move quickly.',
    icon: FiClock
  },
  {
    title: 'Security-First Handling',
    description: 'Sensitive verification data is handled with a strong emphasis on secure processing and responsible access.',
    icon: FiLock
  },
  {
    title: 'Multi-Industry Reach',
    description: 'The verification model supports hiring requirements across technology, finance, healthcare, logistics, and more.',
    icon: FiGlobe
  }
];

const processSteps = [
  'Create an organization account and submit the relevant candidate details.',
  'Run background checks and document validation through the verification flow.',
  'Review the generated report, flags, and supporting trust signals.',
  'Use verified records to support more confident hiring decisions.'
];

const industries = [
  'IT & Tech',
  'Finance & Banking',
  'Healthcare',
  'Education',
  'Retail & Lifestyle',
  'Hospitality',
  'BPO',
  'Logistics',
  'Manufacturing',
  'Aviation'
];

const EmpVerifyPage = ({ compact = false }) => {
  return (
    <div className={compact ? 'pb-10 md:pb-14' : 'pb-16 md:pb-24'}>
      <PublicPageHero
        className={compact ? 'py-3 md:py-5' : ''}
        eyebrow="Employee Verification"
        title={<>Employee Verification Powered by <span className="gradient-text">Eimager</span></>}
        description="Understand how the Eimager verification workflow supports employer due diligence, reduces uncertainty, and adds stronger trust signals to hiring decisions."
        chips={['Verification support', 'Employer ready', 'Multi-industry use']}
        metrics={[
          { label: 'Focus', value: 'Background Checks', helper: 'Verification support for employer-led review' },
          { label: 'Response', value: 'Faster Reviews', helper: 'Built to reduce avoidable hiring delays' },
          { label: 'Coverage', value: '10+ Sectors', helper: 'Relevant across multiple hiring environments' }
        ]}
        aside={
          <div className="rounded-[2rem] border border-slate-200 bg-white/92 p-6 shadow-xl backdrop-blur-sm">
            <img
              src="/images/emiger.png"
              alt="Eimager brand visual"
              className="w-full rounded-[1.5rem] border border-slate-100 bg-slate-50 object-cover"
            />
            <div className="mt-6 space-y-3">
              <a
                href="https://www.eimager.com/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700"
              >
                <span>Visit Eimager</span>
                <FiArrowUpRight />
              </a>
              <a
                href="https://eimager.com/about"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700"
              >
                <span>Read Brand Story</span>
                <FiArrowUpRight />
              </a>
            </div>
          </div>
        }
      />

      <section className={`container mx-auto max-w-7xl px-4 ${compact ? 'mt-2' : ''}`.trim()}>
        <PublicSectionHeader
          centered
          eyebrow="Verification Signals"
          title="What employers look for before they trust the process"
          description="These are the core verification strengths that make the service relevant inside a serious hiring workflow."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item, index) => (
            <PublicFeatureCard
              key={item.title}
              delay={index * 0.05}
              icon={item.icon}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </section>

      <section className={`container mx-auto max-w-7xl px-4 ${compact ? 'mt-10' : 'mt-16'}`.trim()}>
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <PublicSectionHeader
              eyebrow="Process"
              title="How the verification flow works"
              description="A straightforward four-step process helps employers move from data submission to verification-backed decisions with less friction."
            />

            <div className="mt-8 grid gap-4">
              {processSteps.map((step, index) => (
                <article
                  key={step}
                  className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-sm font-black text-brand-700">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold leading-7 text-slate-700">{step}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <PublicSectionHeader
              eyebrow="Industry Fit"
              title="Sectors where verification support matters most"
              description="Verification support is especially valuable in regulated, trust-sensitive, and high-volume hiring environments."
            />

            <div className="mt-8 flex flex-wrap gap-3">
              {industries.map((industry) => (
                <span
                  key={industry}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  {industry}
                </span>
              ))}
            </div>

            <div className="mt-8 rounded-[1.6rem] border border-brand-100 bg-brand-50 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm">
                  <FiShield size={20} />
                </span>
                <div>
                  <p className="font-heading text-lg font-bold text-navy">Why it fits HHH Jobs</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Verification strengthens employer credibility, supports responsible screening, and improves trust across the hiring journey.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={`container mx-auto max-w-7xl px-4 ${compact ? 'mt-10' : 'mt-16'}`.trim()}>
        <PublicCallToAction
          eyebrow="Next Step"
          title="Need verification support inside your hiring flow?"
          description="Connect your hiring workflow with stronger trust signals, better candidate screening, and verification support that helps decisions move forward with confidence."
          actions={[
            { label: 'Contact HHH Jobs', to: '/contact-us' },
            { label: 'Open Employer Home', to: '/employer-home' }
          ]}
          chips={['Employer support', 'Verification workflow', 'Faster trust checks']}
        />
      </div>
    </div>
  );
};

export default EmpVerifyPage;
