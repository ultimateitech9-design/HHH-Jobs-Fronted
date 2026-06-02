import { useEffect } from 'react';
import { BLOG_BASE_URL } from '../../../../shared/utils/externalLinks.js';

const BlogPage = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace(BLOG_BASE_URL);
    }
  }, []);

  return (
    <div className="vw-shell flex min-h-[320px] items-center justify-center py-16 text-center">
      <a
        href={BLOG_BASE_URL}
        className="inline-flex rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white"
      >
        Continue to HHH Jobs Blog
      </a>
    </div>
  );
};

export default BlogPage;
