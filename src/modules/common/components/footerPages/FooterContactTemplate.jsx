import { FiClock, FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import PublicCallToAction from '../publicPages/PublicCallToAction';
import PublicPageHero from '../publicPages/PublicPageHero';
import PublicSectionHeader from '../publicPages/PublicSectionHeader';
import FooterContactChannels from './FooterContactChannels';
import FooterContactForm from './FooterContactForm';

const contactAside = (
  <div className="overflow-hidden rounded-[1.55rem] bg-gradient-to-br from-slate-950 via-brand-700 to-indigo-700 p-4 text-white shadow-2xl sm:rounded-[1.8rem] sm:p-5">
    <p className="text-xs font-black uppercase tracking-[0.24em] text-white/65">Response Standards</p>
    <div className="mt-4 grid gap-3.5 sm:mt-5 sm:gap-4">
      {[
        { icon: FiMail, title: 'Support mailbox', text: 'support@hhh-jobs.com' },
        { icon: FiPhone, title: 'Hiring desk', text: 'Regional employer coordination' },
        { icon: FiMapPin, title: 'Coverage', text: 'India, Africa, Europe, Middle East' },
        { icon: FiClock, title: 'Turnaround', text: 'Initial response target within one business day' }
      ].map((item) => (
        <div key={item.title} className="flex items-start gap-3 rounded-[1.3rem] border border-white/12 bg-white/10 p-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/14">
            <item.icon size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-white/72">{item.text}</p>
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
        compact
        className="-mt-[20px] md:-mt-[24px]"
        contentClassName="-mt-20 md:-mt-24"
        chips={['Employer support', 'Candidate help', 'Business partnerships']}
        actions={[
          { label: 'Send A Message', to: '/contact-us', variant: 'primary' },
          { label: 'Explore Services', to: '/services', variant: 'ghost' }
        ]}
        aside={contactAside}
      />

      <section className="px-4 py-6 md:py-8">
        <div className="container mx-auto max-w-7xl">
          <PublicSectionHeader
            eyebrow="Contact Paths"
            title="Dedicated contact flows for support, partnerships, and general enquiries"
            description="Every request is directed to the team best placed to help, so you receive a clear and timely response."
            centered
            compact
          />

          <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
            <FooterContactChannels />
            <FooterContactForm />
          </div>
        </div>
      </section>

      <section className="px-4 py-3 md:py-6">
        <div className="container mx-auto max-w-7xl">
          <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-700">Team Routing</p>
            <h3 className="mt-3 font-heading text-xl font-bold text-navy sm:text-[1.55rem]">How incoming requests are handled</h3>
            <div className="mt-5 grid gap-3">
              {pageData.sections.map((section) => (
                <div key={section.heading} className="rounded-[1.25rem] bg-slate-50 px-4 py-3.5">
                  <p className="text-sm font-semibold text-navy">{section.heading}</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">{section.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pt-1">
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
