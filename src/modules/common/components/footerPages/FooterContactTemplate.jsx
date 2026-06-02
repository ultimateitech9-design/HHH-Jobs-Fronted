import { FiClock, FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import PublicPageHero from '../publicPages/PublicPageHero';
import PublicSectionHeader from '../publicPages/PublicSectionHeader';
import FooterContactChannels from './FooterContactChannels';
import FooterContactForm from './FooterContactForm';

const FooterContactTemplate = ({ pageData }) => {
  return (
    <div className="pb-20">
      <PublicPageHero
        eyebrow={pageData.eyebrow}
        title={pageData.title}
        description={pageData.summary}
        compact
        tightTop
      />

      <section className="pb-12 pt-2 md:pb-16 md:pt-4">
        <div className="vw-shell">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
            <FooterContactChannels />
            <FooterContactForm />
          </div>
        </div>
      </section>
    </div>
  );
};

export default FooterContactTemplate;
