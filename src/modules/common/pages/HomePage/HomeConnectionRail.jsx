import { ArrowRight, BriefcaseBusiness, Building2, GraduationCap, Network, UserRoundSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

const connectionPaths = [
  {
    number: '01',
    eyebrow: 'Students',
    title: 'Learn, match, begin.',
    description: 'Turn skills, projects, and location into relevant first opportunities.',
    action: 'Start your career',
    to: '/freshers',
    icon: GraduationCap,
    tone: 'text-brand-300'
  },
  {
    number: '02',
    eyebrow: 'Professionals',
    title: 'Move with context.',
    description: 'Discover roles that respect experience, capability, and career direction.',
    action: 'Explore professional roles',
    to: '/job-seekers',
    icon: UserRoundSearch,
    tone: 'text-sky-300'
  },
  {
    number: '03',
    eyebrow: 'Employers & HR',
    title: 'Find stronger fit.',
    description: 'Connect real requirements with candidates who can demonstrate the work.',
    action: 'Build your team',
    to: '/recruiters',
    icon: BriefcaseBusiness,
    tone: 'text-emerald-300'
  },
  {
    number: '04',
    eyebrow: 'Campuses',
    title: 'Turn learning into placement.',
    description: 'Bring students, placement teams, employers, and outcomes into one flow.',
    action: 'Connect your campus',
    to: '/campus-connect',
    icon: Building2,
    tone: 'text-violet-300'
  }
];

const HomeConnectionRail = () => (
  <section className="home-connection-rail border-y border-white/10 bg-slate-950 text-white">
    <div className="vw-shell-wide flex flex-col gap-2 border-b border-white/10 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase text-amber-200">
        <Network className="h-4 w-4" aria-hidden="true" />
        Find your place in the hiring story
      </p>
      <p className="font-mono text-[10px] font-bold text-slate-500">TALENT / SKILLS / MATCH / OUTCOME</p>
    </div>
    <div className="vw-shell-wide grid sm:grid-cols-2 xl:grid-cols-4">
      {connectionPaths.map((path) => {
        const Icon = path.icon;
        return (
          <Link
            key={path.number}
            to={path.to}
            className="home-connection-path group relative flex min-h-[210px] flex-col overflow-hidden border-b border-white/10 px-5 py-6 transition-colors hover:bg-white/[0.045] sm:border-r xl:border-b-0 xl:last:border-r-0"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase text-slate-300">{path.number}</span>
              <Icon className={`h-5 w-5 ${path.tone}`} />
            </div>
            <p className={`mt-8 text-[10px] font-black uppercase ${path.tone}`}>{path.eyebrow}</p>
            <h2 className="mt-2 font-heading text-xl font-black text-white">{path.title}</h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">{path.description}</p>
            <span className="mt-auto inline-flex items-center gap-2 pt-5 text-xs font-bold text-slate-200 transition group-hover:text-white">
              {path.action}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        );
      })}
    </div>
  </section>
);

export default HomeConnectionRail;
