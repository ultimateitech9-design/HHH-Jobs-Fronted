import { Link } from 'react-router-dom';
import {
  FiActivity,
  FiArrowRight,
  FiBookmark,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
  FiTarget,
  FiUser
} from 'react-icons/fi';
import StudentMarketplaceShell from '../components/StudentMarketplaceShell';
import {
  StudentPageShell,
  StudentSurfaceCard,
  studentPrimaryButtonClassName,
  studentSecondaryButtonClassName
} from '../components/StudentExperience';

const serviceCards = [
  {
    title: 'ATS Analyzer',
    description: 'Run ATS checks, compare score history, and improve resume fit before applying.',
    to: '/portal/student/ats',
    icon: FiActivity
  },
  {
    title: 'Profile Upgrade',
    description: 'Refine headline, resume, skills, and personal details to improve recruiter response.',
    to: '/portal/student/profile',
    icon: FiUser
  },
  {
    title: 'Applications Tracker',
    description: 'Review active applications, progress states, and candidate pipeline movement.',
    to: '/portal/student/applications',
    icon: FiFileText
  },
  {
    title: 'Saved Jobs',
    description: 'Keep shortlisted opportunities ready while you optimize resume and ATS score.',
    to: '/portal/student/saved-jobs',
    icon: FiBookmark
  },
  {
    title: 'Interview Planner',
    description: 'Track interview rounds, upcoming meetings, and follow-up preparation tasks.',
    to: '/portal/student/interviews',
    icon: FiCalendar
  },
  {
    title: 'Jobs Workspace',
    description: 'Browse combined HHH Jobs and Global Jobs from one premium student marketplace.',
    to: '/portal/student/home?jobsView=all',
    icon: FiBriefcase
  }
];

const StudentServicesPage = () => {
  return (
    <StudentMarketplaceShell>
      <StudentPageShell
        eyebrow="Student Services"
        badge="Career stack"
        title="Dedicated student services, inside the same premium workspace"
        subtitle="Open ATS, profile, saved jobs, applications, and interview tools from one student services page instead of jumping to the public services site."
        heroSize="mini"
        stats={[
          { label: 'Core Services', value: '6', helper: 'Focused student service tools', icon: FiTarget },
          { label: 'ATS Support', value: 'Live', helper: 'Resume scoring and fit analysis', icon: FiActivity, tone: 'success' },
          { label: 'Job Flows', value: 'Merged', helper: 'HHH Jobs plus Global Jobs together', icon: FiBriefcase, tone: 'accent' }
        ]}
        actions={(
          <>
            <Link to="/portal/student/ats" className={`${studentPrimaryButtonClassName} px-4 py-2.5 text-[13px]`}>
              <FiActivity size={15} />
              Open ATS
            </Link>
            <Link to="/portal/student/profile" className={`${studentSecondaryButtonClassName} px-4 py-2.5 text-[13px]`}>
              <FiUser size={15} />
              Open Profile
            </Link>
          </>
        )}
      >
        <StudentSurfaceCard
          eyebrow="Services Grid"
          title="Everything important is grouped here"
          subtitle="Every card below opens a separate student page with its own focused features."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {serviceCards.map((card) => (
              <Link
                key={card.title}
                to={card.to}
                className="group rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_20px_42px_rgba(15,23,42,0.1)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <card.icon size={20} />
                </div>
                <h2 className="mt-4 text-xl font-extrabold text-navy">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{card.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-700">
                  Open service
                  <FiArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </StudentSurfaceCard>

        <StudentSurfaceCard
          eyebrow="Service Benefits"
          title="What this student services page gives you"
          subtitle="A clean launchpad for every student feature, while keeping the same jobs-style marketplace shell."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {[
              'ATS opens inside the student marketplace shell',
              'Services no longer redirect to the public website',
              'Profile, applications, saved jobs, and interviews stay one click away',
              'The left profile rail and right helper cards remain visible just like jobs'
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                <div className="mt-0.5 rounded-full bg-emerald-50 p-1.5 text-emerald-600">
                  <FiCheckCircle size={14} />
                </div>
                <p className="text-sm font-semibold text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </StudentSurfaceCard>
      </StudentPageShell>
    </StudentMarketplaceShell>
  );
};

export default StudentServicesPage;
