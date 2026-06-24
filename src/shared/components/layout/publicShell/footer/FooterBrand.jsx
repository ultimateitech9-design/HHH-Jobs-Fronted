import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone } from 'lucide-react';
import { HHH_JOBS_MASTER_CONTACT_NUMBERS, HHH_JOBS_SUPPORT_EMAIL } from '../../../../constants/contactInfo';

const FooterBrand = () => {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_22px_55px_rgba(0,0,0,0.2)] backdrop-blur sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src="/hhh-job-logo-128.png"
            alt="HHH Jobs"
            className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/15"
          />
          <div className="min-w-0 leading-none">
            <span className="block truncate font-heading text-2xl font-black tracking-tight text-white">HHH Jobs</span>
            <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.26em] text-gold">
              Connecting Future
            </span>
          </div>
        </div>

        <Link
          to="/sign-up"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-navy shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-gold hover:text-primary"
        >
          Start Free
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <p className="mt-5 max-w-xl text-sm leading-7 text-white/72">
        Trusted jobs, hiring workflows, campus placement support, and candidate-first career tools for India.
      </p>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/[0.12] px-3.5 py-3">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            Master Contact
          </span>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {HHH_JOBS_MASTER_CONTACT_NUMBERS.map((phone) => (
              <a key={phone.value} href={phone.href} className="text-sm font-bold text-white transition-colors hover:text-gold">
                {phone.label}
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/[0.12] px-3.5 py-3">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            Support Desk
          </span>
          <a
            href={`mailto:${HHH_JOBS_SUPPORT_EMAIL}`}
            className="mt-2 block truncate text-sm font-bold text-white transition-colors hover:text-gold"
          >
            {HHH_JOBS_SUPPORT_EMAIL}
          </a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/contact-us"
          className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs font-bold text-white/82 transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
        >
          Contact Team
        </Link>
        <Link
          to="/ats"
          className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs font-bold text-white/82 transition hover:border-teal-300/40 hover:bg-teal-300/10 hover:text-teal-100"
        >
          Resume ATS
        </Link>
      </div>
    </section>
  );
};

export default FooterBrand;
