import { useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { buildBlogUrl } from '../../../../shared/utils/externalLinks.js';

const BlogArticlePage = () => {
  const { slug = '' } = useParams();
  const location = useLocation();
  const targetUrl = useMemo(
    () => buildBlogUrl({ slug, search: location.search, hash: location.hash }),
    [location.hash, location.search, slug]
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace(targetUrl);
    }
  }, [targetUrl]);

  return (
    <div className="vw-shell flex min-h-[320px] items-center justify-center py-16 text-center">
      <a
        href={targetUrl}
        className="inline-flex rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white"
      >
        Open article on HHH Jobs Blog
      </a>
    </div>
  );
};

export default BlogArticlePage;
