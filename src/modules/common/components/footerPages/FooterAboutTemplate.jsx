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
          src: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1280&q=80',
          alt: 'Professional hiring discussion'
        }}
      />


      <section className="px-4 py-10 md:py-14">
        <div className="container mx-auto max-w-4xl">
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
