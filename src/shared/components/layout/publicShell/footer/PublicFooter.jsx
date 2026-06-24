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
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#080c12] text-white">
      <div className="h-1 bg-gold" />

      <div className="vw-shell py-12 sm:py-14 lg:py-16">
        <div className="grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[minmax(18rem,1.3fr)_repeat(5,minmax(0,0.72fr))_minmax(16rem,1fr)]">
          <FooterBrand />

          {footerLinkColumns.map((column) => (
            <FooterLinkColumn key={column.title} column={column} />
          ))}

          <section>
            <h4 className="font-heading text-base font-bold text-white">Contact & Alerts</h4>
            <div className="mt-5 grid gap-4 text-base leading-7 text-slate-400">
              <a
                href={`mailto:${HHH_JOBS_SUPPORT_EMAIL}`}
                className="group flex items-start gap-3 transition hover:text-gold"
              >
                <Mail className="mt-1 h-5 w-5 flex-none text-slate-500 transition group-hover:text-gold" aria-hidden="true" />
                <span className="break-all">{HHH_JOBS_SUPPORT_EMAIL}</span>
              </a>

              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 flex-none text-slate-500" aria-hidden="true" />
                <div className="grid gap-1">
                  {HHH_JOBS_MASTER_CONTACT_NUMBERS.map((phone) => (
                    <a key={phone.value} href={phone.href} className="transition hover:text-gold">
                      {phone.label}
                    </a>
                  ))}
                </div>
              </div>

              <Link
                to="/sign-up"
                className="mt-2 inline-flex max-w-max items-center gap-2 rounded-xl border border-white/[0.12] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-gold/50 hover:text-gold"
              >
                Email for latest job updates
                <Send className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {publicSocialLinks.map((item) => {
                const Icon = item.icon;
                const shouldOpenInNewTab = item.href.startsWith('http') && item.newTab !== false;

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.03] text-white transition hover:-translate-y-0.5 hover:border-gold/50 hover:text-gold"
                    target={shouldOpenInNewTab ? '_blank' : undefined}
                    rel={shouldOpenInNewTab ? 'noreferrer' : undefined}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
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
