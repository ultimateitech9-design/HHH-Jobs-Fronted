import { Link } from 'react-router-dom';

const FooterBrand = () => {
  return (
    <div className="sm:col-span-2 lg:col-span-1">
      <div className="mb-4 flex items-center gap-3">
        <img
          src="/hhh-job-logo.png"
          alt="HHH Jobs"
          className="h-10 w-10 rounded-2xl object-cover ring-1 ring-white/10"
        />
        <div className="flex flex-col leading-none">
          <span className="font-heading text-xl font-bold text-white">HHH Jobs</span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gold">
            Connecting Future
          </span>
        </div>
      </div>

      <p className="max-w-md text-sm leading-6 text-white/68">
        Trusted hiring for freshers, professionals, recruiters, and retired talent, all in one place.
      </p>

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <Link
          to="/sign-up"
          className="inline-flex w-full items-center justify-center rounded-full gradient-gold px-4 py-2 text-xs font-semibold text-primary shadow-lg shadow-gold/20 sm:w-auto"
        >
          Start Free
        </Link>
        <Link
          to="/contact-us"
          className="inline-flex w-full items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/88 transition-colors hover:border-white/25 hover:bg-white/5 sm:w-auto"
        >
          Contact Team
        </Link>
      </div>
    </div>
  );
};

export default FooterBrand;
