import PublicPageHero from '../publicPages/PublicPageHero';
import PublicSectionHeader from '../publicPages/PublicSectionHeader';
import FooterArticleCard from './FooterArticleCard';
import FooterInfoSectionCard from './FooterInfoSectionCard';

const getSectionMode = (pageKey, pageData) => {
  if (pageKey === 'blog') return 'article';
  if (Array.isArray(pageData.sections) && pageData.sections.some((section) => section.to)) return 'article';
  return 'info';
};

const FooterGenericTemplate = ({ pageKey, pageData }) => {
  const sectionMode = getSectionMode(pageKey, pageData);

  return (
    <div className="pb-20">
      <PublicPageHero
        eyebrow={pageData.eyebrow}
        title={pageData.title}
        description={pageData.summary}
        tightTop
        className="pb-6 sm:pb-7 md:pb-8"
      />

      <section className="px-4 pb-8 pt-2 md:pb-10 md:pt-3">
        <div className="container mx-auto max-w-7xl">
          <div className="min-w-0">
            <PublicSectionHeader
              eyebrow={pageData.eyebrow}
              title={sectionMode === 'article' ? 'Featured reads' : 'What you need to know'}
              description={
                sectionMode === 'article'
                  ? 'Explore practical guidance written to support smarter career and hiring decisions.'
                  : 'This page brings together the essential context, guidance, and next steps in one place.'
              }
              compact
            />

            <div className={`mt-6 grid gap-5 sm:mt-7 sm:gap-6 ${sectionMode === 'article' ? 'xl:grid-cols-2' : ''}`}>
              {(pageData.sections || []).map((section, index) =>
                sectionMode === 'article' && section.to ? (
                  <FooterArticleCard
                    key={`${section.heading}-${index}`}
                    section={section}
                    delay={index * 0.06}
                  />
                ) : (
                  <FooterInfoSectionCard
                    key={`${section.heading}-${index}`}
                    section={section}
                    delay={index * 0.06}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FooterGenericTemplate;
