import { lazy, Suspense } from 'react';
import { ArrowRight, BookOpen, BriefcaseBusiness, MapPin, UserRound, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  CAREER_HERO_SIZES,
  CAREER_HERO_SRC_SET,
  getCareerHeroSrc
} from '../../../shared/utils/publicHeroImage';

const StudentExternalJobsPage = lazy(() => import('./StudentExternalJobsPage'));

const networkMetrics = [
  { label: 'Role discovery', value: 'Live', helper: 'Fresh company openings.' },
  { label: 'Location match', value: 'India', helper: 'City, state and pincode.' },
  { label: 'Career context', value: 'Skills', helper: 'Roles aligned to capability.' },
  { label: 'Candidate access', value: 'Free', helper: 'No fee to explore jobs.' }
];

const networkPaths = [
  {
    icon: UserRound,
    title: 'Students & professionals',
    text: 'Skills, location and ambition meet the right opening.',
    to: '/job-seekers'
  },
  {
    icon: UsersRound,
    title: 'Companies & HR teams',
    text: 'Roles reach relevant candidates with clearer context.',
    to: '/recruiters'
  },
  {
    icon: BookOpen,
    title: 'Campuses & placement cells',
    text: 'Employers and emerging talent connect through one network.',
    to: '/campus-connect'
  }
];

const JobsSearchFallback = () => (
  <div className="space-y-5" aria-label="Loading jobs">
    <div className="h-16 animate-pulse rounded-lg border border-slate-200 bg-white" />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-64 animate-pulse rounded-lg border border-slate-200 bg-white" />
      ))}
    </div>
  </div>
);

const PublicJobsLandingPage = () => {
  return (
    <div className="pb-10">
    <section className="public-cinematic-hero relative isolate min-h-[390px] overflow-hidden border-b border-slate-800 bg-slate-950 text-white">
      <img
        src={getCareerHeroSrc()}
        srcSet={CAREER_HERO_SRC_SET}
        sizes={CAREER_HERO_SIZES}
        alt="Candidates and hiring teams working together"
        width="1024"
        height="1024"
        className="public-cinematic-image absolute inset-0 h-full w-full object-cover object-center"
        loading="eager"
        decoding="sync"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-slate-950/[0.78]" />
      <div className="vw-shell-wide relative flex min-h-[390px] flex-col justify-end py-8 sm:py-10 lg:py-12">
        <div className="max-w-3xl">
          <p className="text-[11px] font-black uppercase text-brand-300">India&apos;s connected hiring network</p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl font-black leading-[1.08] text-white sm:text-5xl lg:text-6xl">
            Opportunity moves faster when everyone connects.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
            Discover relevant work by role, skill and location while employers and campuses connect talent to real outcomes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#job-search-results"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-brand-400"
            >
              Explore jobs
              <ArrowRight size={16} />
            </a>
            <Link
              to="/govt-jobs"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-slate-950/35 px-5 py-3 text-sm font-bold text-white transition hover:border-white/60 hover:bg-slate-950/55"
            >
              Government jobs
              <BriefcaseBusiness size={15} />
            </Link>
          </div>
        </div>

        <div className="mt-8 grid border-y border-white/15 sm:grid-cols-2 lg:grid-cols-4">
          {networkMetrics.map((metric) => (
            <div key={metric.label} className="border-white/15 px-0 py-3 sm:px-4 sm:first:pl-0 lg:border-r lg:last:border-r-0">
              <p className="text-[10px] font-black uppercase text-white/55">{metric.label}</p>
              <p className="mt-1 flex items-center gap-2 text-xl font-black text-white">
                {metric.label === 'Location match' ? <MapPin size={16} aria-hidden="true" /> : null}
                {metric.value}
              </p>
              <p className="mt-1 text-xs text-white/60">{metric.helper}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="border-b border-slate-200 bg-white">
      <div className="vw-shell-wide grid md:grid-cols-3">
        {networkPaths.map((item) => (
          <Link key={item.title} to={item.to} className="group flex gap-3 border-slate-200 py-5 md:border-r md:px-5 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <item.icon size={17} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-black text-navy">
                {item.title}
                <ArrowRight className="transition group-hover:translate-x-0.5" size={14} aria-hidden="true" />
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{item.text}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>

    <div className="vw-shell-wide pt-5 sm:pt-7">
      <Suspense fallback={<JobsSearchFallback />}>
        <StudentExternalJobsPage embedded />
      </Suspense>
    </div>
    </div>
  );
};

export default PublicJobsLandingPage;
