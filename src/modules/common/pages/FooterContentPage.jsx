import { FOOTER_PAGE_CONTENT } from './footerPages';
import FooterAboutTemplate from '../components/footerPages/FooterAboutTemplate';
import FooterContactTemplate from '../components/footerPages/FooterContactTemplate';
import FooterGenericTemplate from '../components/footerPages/FooterGenericTemplate';
import FooterReportIssueTemplate from '../components/footerPages/FooterReportIssueTemplate';

const FALLBACK_PAGE = {
  title: 'Information Page',
  eyebrow: 'Footer',
  summary: 'The requested content is not available right now.',
  sections: [
    {
      heading: 'Need assistance?',
      body:
        'Please explore related footer links below or contact support@hhh-jobs.com if you need immediate help.'
    }
  ]
};

const FooterContentPage = ({ pageKey }) => {
  const pageData = FOOTER_PAGE_CONTENT[pageKey] || FALLBACK_PAGE;

  if (pageKey === 'about-us') {
    return <FooterAboutTemplate pageData={pageData} />;
  }

  if (pageKey === 'contact-us') {
    return <FooterContactTemplate pageData={pageData} />;
  }

  if (pageKey === 'report-issue') {
    return <FooterReportIssueTemplate pageData={pageData} />;
  }

  return <FooterGenericTemplate pageKey={pageKey} pageData={pageData} />;
};

export default FooterContentPage;
