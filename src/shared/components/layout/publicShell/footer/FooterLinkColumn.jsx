import { Link } from 'react-router-dom';
import { isExternalHref } from '../../../../utils/externalLinks.js';

const FooterLinkColumn = ({ column }) => {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-white/15 hover:bg-white/[0.05]">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-5 w-1 rounded-full bg-gold" aria-hidden="true" />
        <h4 className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
          {column.title}
        </h4>
      </div>

      <ul className="grid gap-1">
        {column.links.map((link) => {
          const isExternal = isExternalHref(link.to);
          const className =
            'group flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-[13px] font-medium text-white/62 transition-all hover:bg-white/[0.08] hover:text-white';

          return (
            <li key={link.to}>
              {isExternal ? (
                <a href={link.to} className={className}>
                  <span>{link.label}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-gold/50 transition group-hover:bg-gold" />
                </a>
              ) : (
                <Link to={link.to} className={className}>
                  <span>{link.label}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-gold/50 transition group-hover:bg-gold" />
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
