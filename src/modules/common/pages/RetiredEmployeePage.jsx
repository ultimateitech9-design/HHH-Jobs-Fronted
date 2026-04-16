import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
  FiShield,
  FiStar,
  FiUsers
} from 'react-icons/fi';
import PublicCallToAction from '../components/publicPages/PublicCallToAction';
import PublicFeatureCard from '../components/publicPages/PublicFeatureCard';
import PublicPageHero from '../components/publicPages/PublicPageHero';
import PublicSectionHeader from '../components/publicPages/PublicSectionHeader';
import { getCurrentUser } from '../../../utils/auth';

const supportCards = [
  {
    title: 'Retirement-Friendly Roles',
    description: 'Browse opportunities built for experienced professionals after retirement.',
    icon: FiUsers
  },
  {
    title: 'Profile Verification',
    description: 'Highlight verified work history to improve shortlist confidence and credibility.',
    icon: FiShield
  },
  {
    title: 'Flexible Work Options',
    description: 'Discover part-time, consulting, advisory, and remote assignments that match your pace.',
    icon: FiCheckCircle
  }
];

const roleTracks = [
  {
    title: 'Mentor and Trainer',
    description: 'Share your domain knowledge with junior teams and new hires.',
    badge: 'Flexible Hours',
    icon: FiStar
  },
  {
    title: 'Operations Consultant',
    description: 'Improve process quality, compliance, and execution for growing teams.',
    badge: 'Consulting',
    icon: FiBriefcase
  },
  {
    title: 'Part-time Administration',
    description: 'Support documentation, coordination, and daily office operations.',
    badge: 'Part-time',
    icon: FiFileText
  }
];

const onboardingSteps = [
  {
    title: 'Create Profile',
    detail: 'Add your work history, skills, and preferred work type to improve role fit.',
    icon: FiFileText
  },
  {
    title: 'Set Availability',
    detail: 'Choose part-time, consulting, project-based, or remote preferences.',
    icon: FiCalendar
  },
  {
    title: 'Apply With Confidence',
    detail: 'Submit to curated roles where senior experience is a direct advantage.',
    icon: FiArrowRight
  }
];

const faqs = [
  {
    question: 'Can retired employees apply only for part-time roles?',
    answer: 'No. You can explore part-time, contract, consulting, and full-time roles based on your preference.'
  },
  {
    question: 'Is age treated as a barrier?',
    answer: 'The platform prioritizes experience, reliability, and role-fit rather than reducing the profile to age alone.'
  },
  {
    question: 'Can availability change later?',
    answer: 'Yes. You can update schedule, location, and role preferences whenever your plans shift.'
  }
];

const RetiredEmployeePage = () => {
  const currentUser = getCurrentUser();
  const exploreJobsPath = currentUser?.role === 'retired_employee'
    ? '/portal/student/home'
    : '/sign-up?role=retired_employee&redirect=%2Fportal%2Fstudent%2Fhome';

  return (
    <div className="pb-16 md:pb-24">
      <PublicPageHero
        eyebrow="Retired Employee Program"
        title={<>Opportunities For <span className="gradient-text">Retired Professionals</span></>}
        description="Continue your professional journey with work that respects your experience, schedule, and expertise. HHH Jobs helps retired professionals move into flexible second-innings roles without losing credibility."
        chips={['Consulting roles', 'Flexible schedules', 'Experience-first matching']}
        actions={[
          { label: 'Explore Jobs', to: exploreJobsPath },
          { label: 'Create Profile', to: '/sign-up?role=retired_employee&redirect=%2Fportal%2Fretired%2Fjobs', variant: 'ghost' }
        ]}
        metrics={[
          { label: 'Role model', value: 'Flexible', helper: 'Part-time, advisory, remote, consulting' },
          { label: 'Audience', value: 'Experienced Talent', helper: 'Built for senior professionals' },
          { label: 'Outcome', value: 'Second Innings', helper: 'Career continuity with better role fit' }
        ]}
        aside={
          <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-brand-700 to-indigo-700 p-6 text-white shadow-xl">
            <h2 className="font-heading text-2xl font-extrabold">Why this lane exists</h2>
            <div className="mt-6 space-y-3">
              {[
                'Senior-experience-focused opportunities',
                'Flexible and part-time role discovery',
                'Better visibility for second-innings careers'
              ].map((item) => (
                <div key={item} className="rounded-[1.4rem] border border-white/14 bg-white/10 px-4 py-3 text-sm font-semibold text-white/88">
                  {item}
                </div>
              ))}
            </div>
          </div>
        }
      />

      <section className="container mx-auto max-w-7xl px-4">
        <PublicSectionHeader
          centered
          eyebrow="Support"
          title="Built for reliability, trust, and flexible career continuity"
          description="The retired professional lane is designed to reduce friction and make experience a visible hiring strength."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {supportCards.map((item, index) => (
            <PublicFeatureCard
              key={item.title}
              delay={index * 0.06}
              icon={item.icon}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </section>

      <section className="container mx-auto mt-16 max-w-7xl px-4">
        <PublicSectionHeader
          eyebrow="Role Tracks"
          title="Popular work types for retired candidates"
          description="These role paths make it easier to stay active in the workforce without forcing a one-size-fits-all schedule."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {roleTracks.map((track, index) => (
            <PublicFeatureCard
              key={track.title}
              delay={index * 0.06}
              icon={track.icon}
              title={track.title}
              description={track.description}
              badge={track.badge}
            />
          ))}
        </div>
      </section>

      <section className="container mx-auto mt-16 max-w-7xl px-4">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <PublicSectionHeader
              eyebrow="Getting Started"
              title="Start in three practical steps"
              description="The onboarding path stays focused on clarity so you can move from profile creation to applications quickly."
            />

            <div className="mt-8 grid gap-4">
              {onboardingSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <article key={step.title} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-sm font-black text-brand-700">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-brand-700"><Icon size={16} /></span>
                          <p className="font-heading text-lg font-bold text-navy">{step.title}</p>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{step.detail}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <PublicSectionHeader
              eyebrow="FAQs"
              title="Common questions from retired candidates"
              description="A quick view of what to expect before you create your profile and start applying."
            />

            <div className="mt-8 space-y-4">
              {faqs.map((item) => (
                <article key={item.question} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5">
                  <h3 className="font-heading text-lg font-bold text-navy">{item.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-[1.6rem] border border-brand-100 bg-brand-50 p-5">
              <p className="font-heading text-lg font-bold text-navy">Need a guided start?</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Create your retired employee profile first, then move into role discovery with a clearer match signal for employers.
              </p>
              <Link
                to="/sign-up?role=retired_employee&redirect=%2Fportal%2Fretired%2Fjobs"
                className="mt-5 inline-flex rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white"
              >
                Create Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto mt-16 max-w-7xl px-4">
        <PublicCallToAction
          eyebrow="Second Innings"
          title="Ready for your next professional chapter?"
          description="Build your profile, set your preferred schedule, and start applying to roles where experience is a real hiring asset."
          actions={[
            { label: 'Create Retired Profile', to: '/sign-up?role=retired_employee&redirect=%2Fportal%2Fretired%2Fjobs' },
            { label: 'Open Jobs', to: exploreJobsPath }
          ]}
          chips={['Consulting', 'Remote', 'Part-time', 'Advisory']}
        />
      </div>
    </div>
  );
};

export default RetiredEmployeePage;
