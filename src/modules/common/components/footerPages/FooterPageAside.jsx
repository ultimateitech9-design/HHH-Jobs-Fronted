import PublicSidebarLinks from '../publicPages/PublicSidebarLinks';

const FooterPageAside = ({ relatedLinks = [] }) => (
  <PublicSidebarLinks title="Explore More" links={relatedLinks} />
);

export default FooterPageAside;
