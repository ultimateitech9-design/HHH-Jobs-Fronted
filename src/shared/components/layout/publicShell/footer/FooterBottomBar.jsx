import { Link } from 'react-router-dom';
import { footerSocialLinks } from './footerSocialLinks';

const FooterBottomBar = () => {
  return (
    <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="text-center lg:text-left">
        <p className="text-sm font-medium text-white/58">© 2026 HHH Jobs. All rights reserved.</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-gold/70">Clarity. Speed. Trust.</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
        {footerSocialLinks.map((item) => {
          const Icon = item.icon;
          const isExternal = item.href.startsWith('http');
          const isInternal = item.href.startsWith('/');
          const shouldOpenInNewTab = isExternal && item.newTab !== false;

          if (isInternal) {
            return (
              <Link
                key={item.label}
                to={item.href}
                className="inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 text-[13px] font-semibold text-white/68 transition hover:-translate-y-0.5 hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
                aria-label={item.label}
                title={item.label}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          }

          return (
            <a
              key={item.label}
              href={item.href}
              className="inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 text-[13px] font-semibold text-white/68 transition hover:-translate-y-0.5 hover:border-gold/35 hover:bg-gold/10 hover:text-gold"
              target={shouldOpenInNewTab ? '_blank' : undefined}
              rel={shouldOpenInNewTab ? 'noreferrer' : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{item.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default FooterBottomBar;
