import { FiShield, FiTarget, FiUsers, FiZap } from 'react-icons/fi';
import PublicCallToAction from '../publicPages/PublicCallToAction';
import PublicFeatureCard from '../publicPages/PublicFeatureCard';
import PublicPageHero from '../publicPages/PublicPageHero';
import PublicSectionHeader from '../publicPages/PublicSectionHeader';
import FooterInfoSectionCard from './FooterInfoSectionCard';
import FooterPageAside from './FooterPageAside';

const aboutMetrics = [
  { value: '12+', label: 'Hiring sectors', helper: 'Multiple industries and career tracks supported.' },
  { value: '2-sided', label: 'Platform model', helper: 'Built for both hiring teams and candidates.' },
  { value: 'Clear', label: 'Operating style', helper: 'Structured workflows over noisy recruitment processes.' }
];

const principleCards = [
  {
    icon: FiTarget,
    title: 'Clarity First',
    description: 'Structured job data, simpler workflows, and better communication at every stage.',
    badge: 'Principle'
  },
  {
    icon: FiZap,
    title: 'Speed With Discipline',
    description: 'Fast applications and faster hiring without compromising process quality or visibility.',
    badge: 'Execution'
  },
  {
    icon: FiShield,
    title: 'Trust In Every Step',
    description: 'A professional environment designed around reliability, accountability, and clean records.',
    badge: 'Standard'
  },
  {
    icon: FiUsers,
    title: 'Built Around People',
    description: 'Candidate journeys and employer operations both stay central to the product direction.',
    badge: 'Focus'
  }
];

const FooterAboutTemplate = ({ pageData, relatedLinks }) => {
  return (
    <div className="pb-20">
      <PublicPageHero
        eyebrow={pageData.eyebrow}
        title={pageData.title}
        description={pageData.summary}
        tightTop
        chips={['Hiring clarity', 'Candidate trust', 'Employer workflows']}
        metrics={aboutMetrics}
        actions={[
          { label: 'Explore Services', to: '/services', variant: 'primary' },
          { label: 'Contact Team', to: '/contact-us', variant: 'ghost' }
        ]}
        media={{
          src: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1280&q=80',
          alt: 'Professional hiring discussion'
        }}
      />

      <section className="px-4 py-4 md:py-8">
        <div className="container mx-auto max-w-7xl">
          <PublicSectionHeader
            eyebrow="Why HHH Jobs"
            title="An operating model for better hiring, not just another job board"
            description="HHH Jobs is built to make hiring more transparent, more responsive, and more useful for employers as well as professionals."
            centered
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {principleCards.map((card, index) => (
              <PublicFeatureCard
                key={card.title}
                icon={card.icon}
                title={card.title}
                description={card.description}
                badge={card.badge}
                delay={index * 0.08}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:py-14">
        <div className="container mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:gap-10">
          <div className="grid gap-6">
            {pageData.sections.map((section, index) => (
              <FooterInfoSectionCard
                key={`${section.heading}-${index}`}
                section={section}
                delay={index * 0.06}
              />
            ))}
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <FooterPageAside relatedLinks={relatedLinks} />
          </div>
        </div>
      </section>

      <section className="px-4">
        <div className="container mx-auto max-w-7xl">
          <PublicCallToAction
            eyebrow="Next Step"
            title="Explore the platform with a clearer view of how HHH Jobs works"
            description="Move from company information into services, support, and employer journeys with a more consistent public experience."
            chips={['Employer support', 'Career guidance', 'Trusted process']}
            actions={[
              { label: 'Create Account', to: '/sign-up' },
              { label: 'View Employer Home', to: '/employer-home' }
            ]}
          />
        </div>
      </section>
    </div>
  );
};

export default FooterAboutTemplate;
