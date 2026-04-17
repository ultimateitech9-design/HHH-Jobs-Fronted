import PublicCallToAction from '../publicPages/PublicCallToAction';
import PublicPageHero from '../publicPages/PublicPageHero';
import PublicSectionHeader from '../publicPages/PublicSectionHeader';
import FooterArticleCard from './FooterArticleCard';
import FooterInfoSectionCard from './FooterInfoSectionCard';
import FooterPageAside from './FooterPageAside';

const getSectionMode = (pageKey, pageData) => {
  if (pageKey === 'blog') return 'article';
  if (Array.isArray(pageData.sections) && pageData.sections.some((section) => section.to)) return 'article';
  return 'info';
};

const FooterGenericTemplate = ({ pageKey, pageData, relatedLinks }) => {
  const sectionMode = getSectionMode(pageKey, pageData);
  const chips = (pageData.sections || []).slice(0, 3).map((section) => section.heading);
  const ctaActions = pageKey === 'employer-home'
    ? [
      { label: 'Explore Services', to: '/services' },
      { label: 'Create Account', to: '/sign-up' }
    ]
    : [
      { label: 'Contact Support', to: '/contact-us' },
      { label: 'Explore Services', to: '/services' }
    ];

  return (
    <div className="pb-20">
      <PublicPageHero
        eyebrow={pageData.eyebrow}
        title={pageData.title}
        description={pageData.summary}
        chips={chips}
        metrics={[
          { value: `${pageData.sections?.length || 0}`, label: 'Key sections', helper: 'Focused blocks that explain the topic clearly.' },
          { value: pageData.eyebrow || 'Info', label: 'Page focus', helper: 'Support, policy, company, or insight-led content.' },
          { value: `${relatedLinks.length}`, label: 'Related links', helper: 'Useful next pages connected to the same topic.' }
        ]}
        actions={[
          { label: ctaActions[0].label, to: ctaActions[0].to, variant: 'primary' },
          { label: ctaActions[1].label, to: ctaActions[1].to, variant: 'ghost' }
        ]}
      />

      <section className="px-4 py-8 md:py-12">
        <div className="container mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:gap-10">
          <div className="min-w-0">
            <PublicSectionHeader
              eyebrow={pageData.eyebrow}
              title={sectionMode === 'article' ? 'Featured reads' : 'What you need to know'}
              description={
                sectionMode === 'article'
                  ? 'Explore practical guidance written to support smarter career and hiring decisions.'
                  : 'This page brings together the essential context, guidance, and next steps in one place.'
              }
            />

            <div className={`mt-8 grid gap-5 sm:mt-10 sm:gap-6 ${sectionMode === 'article' ? 'xl:grid-cols-2' : ''}`}>
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

          <div className="lg:sticky lg:top-24 lg:self-start">
            <FooterPageAside
              relatedLinks={relatedLinks}
              title={pageKey === 'blog' ? 'Need more guidance?' : 'Explore related pages'}
              description={
                pageKey === 'blog'
                  ? 'Move from insight to action with the right support, service, or company pages.'
                  : 'Use these nearby pages to continue with support, policy, or hiring information that matches your next step.'
              }
            />
          </div>
        </div>
      </section>

      <section className="px-4">
        <div className="container mx-auto max-w-7xl">
          <PublicCallToAction
            eyebrow="Next Step"
            title={pageKey === 'blog' ? 'Turn insight into action on HHH Jobs' : 'Continue to the right next page with confidence'}
            description="Explore support, services, and company information through a public experience designed to stay clear and easy to navigate."
            chips={['Clear guidance', 'Trusted support', 'Relevant next steps']}
            actions={ctaActions}
            tone={pageKey === 'privacy-policy' || pageKey === 'terms-and-conditions' ? 'light' : 'dark'}
          />
        </div>
      </section>
    </div>
  );
};

export default FooterGenericTemplate;
