import { Link } from 'react-router-dom';
import { isExternalHref } from '../../../../utils/externalLinks.js';

const FooterLinkColumn = ({ column }) => {
  return (
    <section>
      <h2 className="font-heading text-sm font-bold text-slate-100">{column.title}</h2>

      <ul className="mt-3.5 grid gap-2.5">
        {column.links.map((link) => {
          const isExternal = isExternalHref(link.to);
          const className =
            'text-sm leading-5 text-slate-400 transition hover:text-gold';

          return (
            <li key={link.to}>
              {isExternal ? (
                <a href={link.to} className={className}>
                  <span>{link.label}</span>
                </a>
              ) : (
                <Link to={link.to} className={className}>
                  <span>{link.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default FooterLinkColumn;
