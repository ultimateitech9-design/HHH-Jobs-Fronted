import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const FooterBrand = () => {
  return (
    <section className="max-w-sm">
      <div className="flex min-w-0 items-center gap-2.5">
        <img
          src="/hhh-job-logo-128.png"
          alt="HHH Jobs"
          className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/10"
        />
        <div className="min-w-0">
          <span className="block truncate font-heading text-xl font-black tracking-tight text-slate-50">HHH Jobs</span>
          <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.24em] text-gold/80">
            Connecting Future
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-400">
        Jobs, hiring workflows, campus placement support, ATS tools, and trusted career discovery for candidates and employers.
      </p>

      <div className="mt-5 flex flex-wrap gap-2.5">
        <Link
          to="/sign-up"
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-navy transition hover:bg-gold/90 hover:text-primary"
        >
          Start Free
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        <Link
          to="/jobs"
          className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 transition hover:border-gold/40 hover:text-gold"
        >
          Browse Jobs
        </Link>
      </div>
    </section>
  );
};

export default FooterBrand;
