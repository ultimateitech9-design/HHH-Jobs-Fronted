import { FiClock, FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import PublicCallToAction from '../publicPages/PublicCallToAction';
import PublicPageHero from '../publicPages/PublicPageHero';
import PublicSectionHeader from '../publicPages/PublicSectionHeader';
import FooterContactChannels from './FooterContactChannels';
import FooterContactForm from './FooterContactForm';
import FooterPageAside from './FooterPageAside';

const contactAside = (
  <div className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-brand-700 to-indigo-700 p-5 text-white shadow-2xl sm:rounded-[2rem] sm:p-7">
    <p className="text-xs font-black uppercase tracking-[0.24em] text-white/65">Response Standards</p>
    <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5">
      {[
        { icon: FiMail, title: 'Support mailbox', text: 'support@hhh-jobs.com' },
        { icon: FiPhone, title: 'Hiring desk', text: 'Regional employer coordination' },
        { icon: FiMapPin, title: 'Coverage', text: 'India, Africa, Europe, Middle East' },
        { icon: FiClock, title: 'Turnaround', text: 'Initial response target within one business day' }
      ].map((item) => (
        <div key={item.title} className="flex items-start gap-4 rounded-[1.5rem] border border-white/12 bg-white/10 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14">
            <item.icon size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-1 text-xs leading-6 text-white/72">{item.text}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FooterContactTemplate = ({ pageData, relatedLinks }) => {
  return (
    <div className="pb-20">
      <PublicPageHero
        eyebrow={pageData.eyebrow}
        title={pageData.title}
        description={pageData.summary}
        chips={['Employer support', 'Candidate help', 'Business partnerships']}
        metrics={[
          { value: '1 Day', label: 'Target response', helper: 'Initial acknowledgement for most support requests.' },
          { value: '4 Regions', label: 'Sales routing', helper: 'Business conversations mapped across operating regions.' },
          { value: 'Direct', label: 'Escalation path', helper: 'Public support and business mailboxes stay visible.' }
        ]}
        actions={[
          { label: 'Send A Message', to: '/contact-us', variant: 'primary' },
          { label: 'Explore Services', to: '/services', variant: 'ghost' }
        ]}
        aside={contactAside}
      />

      <section className="px-4 py-8 md:py-12">
        <div className="container mx-auto max-w-7xl">
          <PublicSectionHeader
            eyebrow="Contact Paths"
            title="Dedicated contact flows for support, partnerships, and general enquiries"
            description="Every request is directed to the team best placed to help, so you receive a clear and timely response."
            centered
          />

          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <FooterContactChannels />
            <FooterContactForm />
          </div>
        </div>
      </section>

      <section className="px-4 py-4 md:py-8">
        <div className="container mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:gap-10">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-700">Team Routing</p>
            <h3 className="mt-4 font-heading text-2xl font-bold text-navy">How incoming requests are handled</h3>
            <div className="mt-6 grid gap-4">
              {pageData.sections.map((section) => (
                <div key={section.heading} className="rounded-[1.5rem] bg-slate-50 px-5 py-4">
                  <p className="text-sm font-semibold text-navy">{section.heading}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{section.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <FooterPageAside
              relatedLinks={relatedLinks}
              title="Need a different route?"
              description="Use the quick links to move into help, policy, or issue-reporting pages if your request fits another support path."
            />
          </div>
        </div>
      </section>

      <section className="px-4">
        <div className="container mx-auto max-w-7xl">
          <PublicCallToAction
            eyebrow="Need More Help"
            title="Reach the right HHH Jobs team without delay"
            description="Use the contact path that matches your need, then continue to employer services or support resources as required."
            chips={['Support guidance', 'Business enquiries', 'Clear routing']}
            actions={[
              { label: 'View Employer Home', to: '/employer-home' },
              { label: 'See Service Plans', to: '/services' }
            ]}
          />
        </div>
      </section>
    </div>
  );
};

export default FooterContactTemplate;
