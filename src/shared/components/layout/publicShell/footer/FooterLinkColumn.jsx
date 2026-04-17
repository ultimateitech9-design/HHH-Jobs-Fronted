import { Link } from 'react-router-dom';
import { isExternalHref } from '../../../../utils/externalLinks.js';

const FooterLinkColumn = ({ column }) => {
  return (
    <div>
      <h4 className="mb-2.5 font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
        {column.title}
      </h4>

      <ul className="space-y-1.5">
        {column.links.map((link) => {
          const isExternal = isExternalHref(link.to);
          const className =
            'group inline-flex items-center gap-2 text-[13px] leading-6 text-white/60 transition-all hover:translate-x-1 hover:text-white';

          return (
            <li key={link.to}>
              {isExternal ? (
                <a href={link.to} className={className}>
                  <span className="h-1.5 w-1.5 rounded-full bg-gold/60 transition-all group-hover:scale-125 group-hover:bg-gold" />
                  <span>{link.label}</span>
                </a>
              ) : (
                <Link to={link.to} className={className}>
                  <span className="h-1.5 w-1.5 rounded-full bg-gold/60 transition-all group-hover:scale-125 group-hover:bg-gold" />
                  <span>{link.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default FooterLinkColumn;
