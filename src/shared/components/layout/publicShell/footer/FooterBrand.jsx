import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const FooterBrand = () => {
  return (
    <section className="max-w-md">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src="/hhh-job-logo-128.png"
          alt="HHH Jobs"
          className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/15"
        />
        <div className="min-w-0">
          <span className="block truncate font-heading text-2xl font-black tracking-tight text-white">HHH Jobs</span>
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.26em] text-gold">
            Connecting Future
          </span>
        </div>
      </div>

      <p className="mt-6 text-base leading-8 text-slate-300">
        Jobs, hiring workflows, campus placement support, ATS tools, and trusted career discovery for candidates and employers.
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          to="/sign-up"
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-navy transition hover:bg-gold hover:text-primary"
        >
          Start Free
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          to="/jobs"
          className="inline-flex items-center rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-white transition hover:border-gold/50 hover:text-gold"
        >
          Browse Jobs
        </Link>
      </div>
    </section>
  );
};

export default FooterBrand;
