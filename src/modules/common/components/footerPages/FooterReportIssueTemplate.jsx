import PublicCallToAction from '../publicPages/PublicCallToAction';
import PublicPageHero from '../publicPages/PublicPageHero';
import PublicSectionHeader from '../publicPages/PublicSectionHeader';
import FooterInfoSectionCard from './FooterInfoSectionCard';
import FooterReportIssueForm from './FooterReportIssueForm';

const FooterReportIssueTemplate = ({ pageData }) => {
  return (
    <div className="pb-20">
      <PublicPageHero
        eyebrow={pageData.eyebrow}
        title={pageData.title}
        description={pageData.summary}
        tightTop
        chips={['Platform issues', 'Content concerns', 'Policy escalation']}
        metrics={[
          { value: '4 Steps', label: 'Review flow', helper: 'Submit, acknowledge, investigate, follow up.' },
          { value: 'Fast', label: 'Escalation path', helper: 'The report form routes directly into support review.' },
          { value: 'Safer', label: 'Community outcome', helper: 'User reports help keep the hiring environment reliable.' }
        ]}
        actions={[
          { label: 'Open Contact Page', to: '/contact-us', variant: 'primary' },
          { label: 'Read Trust & Safety', to: '/trust-and-safety', variant: 'ghost' }
        ]}
      />

      <section className="px-4 py-8 md:py-12">
        <div className="container mx-auto max-w-7xl">
          <PublicSectionHeader
            eyebrow="Issue Handling"
            title="Report concerns clearly so our team can review them faster"
            description="Share the issue, affected page, and any supporting detail so our team can investigate efficiently and respond with the right action."
            centered
          />

          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="grid gap-6">
              {pageData.sections.map((section, index) => (
                <FooterInfoSectionCard
                  key={`${section.heading}-${index}`}
                  section={section}
                  delay={index * 0.06}
                />
              ))}
            </div>

            <FooterReportIssueForm />
          </div>
        </div>
      </section>

      <section className="px-4 py-4 md:py-8">
        <div className="container mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-600">What to include</p>
            <h3 className="mt-4 font-heading text-2xl font-bold text-navy">High-signal reports get resolved faster</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                'Describe the issue path clearly: page, action, and failure point.',
                'Attach screenshots when the concern is visual or workflow-specific.',
                'Mention whether the issue affects candidates, employers, or both.',
                'If the concern is safety-related, include any relevant usernames or listing links.'
              ].map((item) => (
                <div key={item} className="rounded-[1.5rem] bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4">
        <div className="container mx-auto max-w-7xl">
          <PublicCallToAction
            eyebrow="Safe Platform"
            title="Help us keep HHH Jobs reliable, respectful, and secure"
            description="Timely reports help us review issues faster, protect users, and improve the overall hiring experience."
            chips={['Clear reporting', 'Timely review', 'User protection']}
            actions={[
              { label: 'Open Grievances', to: '/grievances' },
              { label: 'View Help Center', to: '/help-center' }
            ]}
            tone="light"
          />
        </div>
      </section>
    </div>
  );
};

export default FooterReportIssueTemplate;
