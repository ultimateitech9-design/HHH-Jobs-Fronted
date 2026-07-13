import PublicPageHero from '../publicPages/PublicPageHero';
import FooterInfoSectionCard from './FooterInfoSectionCard';



const FooterAboutTemplate = ({ pageData }) => {
  return (
    <div className="pb-20">
      <PublicPageHero
        eyebrow={pageData.eyebrow}
        title={pageData.title}
        description={pageData.summary}
        tightTop
        className="!pt-0"
        alignVisualTop
        visualClassName="pt-[2px]"
        actions={[
          { label: 'Explore Services', to: '/services', variant: 'primary' },
          { label: 'Contact Team', to: '/contact-us', variant: 'ghost' }
        ]}
        media={{
          src: '/career-compass-hero-1024.webp?v=20260713',
          srcSet: '/career-compass-hero-640.webp?v=20260713 640w, /career-compass-hero-1024.webp?v=20260713 1024w',
          sizes: '100vw',
          width: 1024,
          height: 1024,
          alt: 'Professional hiring discussion'
        }}
      />


      <section className="py-10 md:py-14">
        <div className="vw-shell">
          <div className="grid gap-6">
            {pageData.sections.map((section, index) => (
              <FooterInfoSectionCard
                key={`${section.heading}-${index}`}
                section={section}
                delay={index * 0.06}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FooterAboutTemplate;
