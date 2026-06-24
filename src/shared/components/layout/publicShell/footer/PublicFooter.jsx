import { Link, useLocation } from 'react-router-dom';
import { Mail, Phone, Send } from 'lucide-react';
import FooterBottomBar from './FooterBottomBar';
import FooterBrand from './FooterBrand';
import FooterLinkColumn from './FooterLinkColumn';
import { footerLinkColumns } from './footerLinkColumns';
import { footerSocialLinks } from './footerSocialLinks';
import { HHH_JOBS_MASTER_CONTACT_NUMBERS, HHH_JOBS_SUPPORT_EMAIL } from '../../../../constants/contactInfo';

const socialLabels = new Set(['LinkedIn', 'Facebook', 'YouTube', 'Instagram']);
const publicSocialLinks = footerSocialLinks.filter((item) => socialLabels.has(item.label));

const PublicFooter = () => {
  const location = useLocation();

  if (/^\/campus-connect(?:\/.*)?$/i.test(location.pathname)) {
    return null;
  }

  return (
    <footer className="relative overflow-hidden border-t border-slate-800 bg-[#0d1420] text-white">
      <div className="h-0.5 bg-gold/70" />

      <div className="vw-shell py-8 sm:py-9 lg:py-10">
        <div className="grid gap-x-8 gap-y-7 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[minmax(16rem,1.25fr)_repeat(5,minmax(0,0.7fr))_minmax(15rem,0.95fr)]">
          <FooterBrand />

          {footerLinkColumns.map((column) => (
            <FooterLinkColumn key={column.title} column={column} />
          ))}

          <section>
            <h4 className="font-heading text-sm font-bold text-slate-100">Contact & Alerts</h4>
            <div className="mt-3.5 grid gap-3 text-sm leading-6 text-slate-400">
              <a
                href={`mailto:${HHH_JOBS_SUPPORT_EMAIL}`}
                className="group flex items-start gap-2.5 transition hover:text-gold"
              >
                <Mail className="mt-1 h-4 w-4 flex-none text-slate-500 transition group-hover:text-gold" aria-hidden="true" />
                <span className="break-all">{HHH_JOBS_SUPPORT_EMAIL}</span>
              </a>

              <div className="flex items-start gap-2.5">
                <Phone className="mt-1 h-4 w-4 flex-none text-slate-500" aria-hidden="true" />
                <div className="grid gap-0.5">
                  {HHH_JOBS_MASTER_CONTACT_NUMBERS.map((phone) => (
                    <a key={phone.value} href={phone.href} className="transition hover:text-gold">
                      {phone.label}
                    </a>
                  ))}
                </div>
              </div>

              <Link
                to="/sign-up"
                className="mt-1 inline-flex max-w-max items-center gap-2 rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-gold/40 hover:text-gold"
              >
                Email for latest job updates
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              {publicSocialLinks.map((item) => {
                const Icon = item.icon;
                const shouldOpenInNewTab = item.href.startsWith('http') && item.newTab !== false;

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-white/[0.025] text-slate-300 transition hover:-translate-y-0.5 hover:border-gold/40 hover:text-gold"
                    target={shouldOpenInNewTab ? '_blank' : undefined}
                    rel={shouldOpenInNewTab ? 'noreferrer' : undefined}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </section>
        </div>

        <FooterBottomBar />
      </div>
    </footer>
  );
};

export default PublicFooter;
