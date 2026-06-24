import { Link, useLocation } from 'react-router-dom';
import { BriefcaseBusiness, GraduationCap, ShieldCheck } from 'lucide-react';
import FooterBottomBar from './FooterBottomBar';
import FooterBrand from './FooterBrand';
import FooterLinkColumn from './FooterLinkColumn';
import { footerLinkColumns } from './footerLinkColumns';

const footerAudienceLinks = [
  {
    label: 'Students',
    text: 'Jobs, ATS, alerts',
    to: '/jobs',
    icon: GraduationCap
  },
  {
    label: 'Employers',
    text: 'Post jobs, hire faster',
    to: '/recruiters',
    icon: BriefcaseBusiness
  },
  {
    label: 'Trust Desk',
    text: 'Safety, support, reports',
    to: '/trust-and-safety',
    icon: ShieldCheck
  }
];

const PublicFooter = () => {
  const location = useLocation();

  if (/^\/campus-connect(?:\/.*)?$/i.test(location.pathname)) {
    return null;
  }

  return (
    <footer className="relative overflow-hidden bg-[#0b1b33] text-white">
      <div className="h-1 bg-gradient-to-r from-gold via-gold-light to-teal-400" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-gold/[0.12] blur-3xl" />
      <div className="pointer-events-none absolute right-[-6rem] top-20 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="vw-shell relative py-8 sm:py-10 lg:py-12">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)] lg:items-stretch">
          <FooterBrand />

          <div className="grid gap-3 sm:grid-cols-3">
            {footerAudienceLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="group flex min-h-32 flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.16)] transition duration-200 hover:-translate-y-1 hover:border-gold/35 hover:bg-white/[0.075]"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-gold transition group-hover:border-gold/40 group-hover:bg-gold/15">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-heading text-base font-bold text-white">{item.label}</span>
                    <span className="mt-1 block text-sm leading-5 text-white/58">{item.text}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {footerLinkColumns.map((column) => (
            <FooterLinkColumn key={column.title} column={column} />
          ))}
        </div>

        <FooterBottomBar />
      </div>
    </footer>
  );
};

export default PublicFooter;
