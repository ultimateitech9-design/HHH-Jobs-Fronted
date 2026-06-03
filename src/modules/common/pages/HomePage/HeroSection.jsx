import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, CheckCircle2, GraduationCap, MapPin, Search, Users } from 'lucide-react';
import heroImage from '../../../../assets/career-compass-hero.jpg';
import useAuthStore from '../../../../core/auth/authStore';
import { normalizeRole } from '../../../../utils/auth';

const trustBadges = ['Verified Jobs', 'AI Matching', 'Free to Apply'];
const quickTags = ['Remote', 'Full-time', 'Internship', 'Part-time', 'Freelance'];
const statItems = [
  { label: 'Active jobs', value: '50,000+' },
  { label: 'Companies hiring', value: '10,000+' },
  { label: 'Verified listings', value: '98%' }
];
const heroActionButtonClass =
  'inline-flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition sm:flex-1';

const canShowDesktopVisual = () =>
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(min-width: 1024px)').matches;

export function HeroSection({ filters, onFiltersChange, onSearch, onKeywordChipClick }) {
  const user = useAuthStore((state) => state.user);
  const [showDesktopVisual, setShowDesktopVisual] = useState(canShowDesktopVisual);
  const isHrUser = normalizeRole(user?.role) === 'hr';
  const hrJobsPath = '/portal/hr/jobs';
  const postJobPath = isHrUser ? hrJobsPath : '/login/hr';

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = () => setShowDesktopVisual(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener?.('change', handleChange);

    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  return (
    <section className="relative flex min-h-[60vh] items-center overflow-hidden bg-gradient-to-br from-white via-[#fbf8f2] to-[#eef3fb] pb-6 pt-0">
      <div className="vw-shell relative z-10 pb-4 pt-3">
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-navy/5 px-4 py-1.5 text-sm font-semibold text-navy">
              <span className="h-2 w-2 rounded-full bg-gold" />
              Trusted by 10,000+ companies
            </div>

            <h1 className="mt-4 font-heading text-3xl font-bold leading-[1.05] text-navy sm:text-4xl lg:text-[3rem]">
              Find Genuine Jobs.
              <span className="gradient-text block">Hire the Best Talent.</span>
            </h1>

            <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-600 lg:text-base">
              A trusted job portal for students, professionals, retired employees, and recruiters. Discover
              opportunities, hiring support, and public guidance inside a cleaner, more professional experience.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              {trustBadges.map((badge) => (
                <span key={badge} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  {badge}
                </span>
              ))}
            </div>

            <form
              onSubmit={onSearch}
              className="relative z-20 mt-6 flex flex-col gap-2 rounded-[24px] border border-slate-200 bg-white p-1.5 shadow-strong shadow-navy/5 sm:flex-row"
            >
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={filters.keyword}
                  onChange={(event) => onFiltersChange({ ...filters, keyword: event.target.value })}
                  placeholder="Job title or keyword"
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                />
              </div>
              <div className="flex flex-1 items-center gap-2 border-t border-slate-200 px-3 sm:border-l sm:border-t-0">
                <MapPin className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={filters.location}
                  onChange={(event) => onFiltersChange({ ...filters, location: event.target.value })}
                  placeholder="Location"
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                />
              </div>
              <button type="submit" className="btn-primary px-6">
                <Search className="h-4 w-4" />
                Search Jobs
              </button>
            </form>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onKeywordChipClick(tag)}
                  className="rounded-full border border-transparent bg-navy/5 px-3 py-1 text-xs font-medium text-navy transition-colors hover:border-gold/20 hover:bg-gold/10 hover:text-gold-dark"
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-nowrap">
              <Link to="/jobs" className="sm:flex-1">
                <span className={`${heroActionButtonClass} btn-primary`}>
                  Explore Opportunities
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link
                to={postJobPath}
                state={isHrUser
                  ? undefined
                  : {
                      portalLabel: 'Recruiter / HR login',
                      from: hrJobsPath
                    }}
                className="sm:flex-1"
              >
                <span className={`${heroActionButtonClass} border border-navy/20 bg-white text-navy shadow-sm hover:bg-navy hover:text-white`}>
                  <Briefcase className="h-4 w-4" />
                  Post a Job
                </span>
              </Link>
              <Link to="/campus-connect" className="sm:flex-1">
                <span className={`${heroActionButtonClass} border border-gold/25 bg-gold/10 text-gold-dark shadow-sm hover:bg-gold hover:text-primary`}>
                  <GraduationCap className="h-4 w-4" />
                  Campus Connect
                </span>
              </Link>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {statItems.map((item) => (
                <div key={item.label}>
                  <p className="font-heading text-2xl font-bold text-navy lg:text-[1.75rem]">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {showDesktopVisual ? (
            <div className="relative hidden lg:block lg:max-w-[36rem] lg:justify-self-end">
              <div className="absolute -inset-1 rounded-[30px] gradient-gold opacity-15 blur-xl" />
              <img
                src={heroImage}
                alt="Professionals collaborating in modern office"
                width="576"
                height="520"
                decoding="async"
                fetchPriority="high"
                className="relative z-10 max-h-[520px] w-full rounded-[30px] border border-gold/10 object-cover shadow-strong"
              />

              <div className="absolute -bottom-4 -left-4 z-20 rounded-3xl border border-slate-200 bg-white p-3 shadow-strong">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-gold text-primary">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">2,500+ Jobs</p>
                    <p className="text-xs text-slate-500">Added this week</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-3 -top-3 z-20 rounded-3xl border border-slate-200 bg-white px-4 py-2.5 shadow-strong">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-success-500" />
                  <p className="text-sm font-bold text-slate-900">98% Verified</p>
                </div>
              </div>

              <div className="absolute bottom-12 -right-6 z-20 rounded-3xl border border-slate-200 bg-white p-3 shadow-strong">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-white">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">10K+ Hired</p>
                    <p className="text-[10px] text-slate-500">This month</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
