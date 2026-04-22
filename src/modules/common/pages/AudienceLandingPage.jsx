import { Link } from 'react-router-dom';
import {
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiBookOpen,
  FiBriefcase,
  FiCheckCircle,
  FiCompass,
  FiFileText,
  FiFlag,
  FiLayers,
  FiShield,
  FiStar,
  FiTarget,
  FiTrendingUp,
  FiUsers,
  FiZap
} from 'react-icons/fi';
import PublicCallToAction from '../components/publicPages/PublicCallToAction';
import PublicFeatureCard from '../components/publicPages/PublicFeatureCard';
import PublicPageHero from '../components/publicPages/PublicPageHero';
import PublicSectionHeader from '../components/publicPages/PublicSectionHeader';

const audienceContent = {
  'job-seekers': {
    eyebrow: 'For Job Seekers',
    title: <>Built For <span className="gradient-text">Working Professionals</span></>,
    description: 'Move beyond generic job boards with a cleaner search flow, stronger profile positioning, and better application visibility. This page is for active professionals who want the next move to feel more deliberate.',
    chips: ['Experienced candidates', 'Smart search', 'Application clarity'],
    metrics: [
      { label: 'Positioning', value: 'Sharper', helper: 'Present experience with less clutter and more credibility' },
      { label: 'Focus', value: 'Role-fit', helper: 'Discover opportunities aligned to your level and intent' },
      { label: 'Momentum', value: 'Faster', helper: 'Track jobs, alerts, and interviews from one dashboard' }
    ],
    heroActions: [
      { label: 'Create Professional Account', to: '/sign-up?role=student&redirect=%2Fportal%2Fstudent%2Fdashboard' },
      { label: 'Professional Login', to: '/login', variant: 'ghost' }
    ],
    asideTitle: 'What improves here',
    asidePoints: [
      'Targeted discovery instead of noisy listings',
      'Cleaner profile visibility for recruiter trust',
      'One place for jobs, alerts, and applications'
    ],
    featuresTitle: 'Everything needed for the next career move',
    featuresDescription: 'The professional lane focuses on practical outcomes: discover stronger roles, present yourself better, and keep momentum visible.',
    featureCards: [
      {
        title: 'Role Discovery',
        description: 'Search relevant openings without drifting through low-fit results.',
        icon: FiCompass,
        badge: 'Find Better Fits'
      },
      {
        title: 'Stronger Profile',
        description: 'Make your experience, projects, and skill signal easier for recruiters to assess.',
        icon: FiFileText,
        badge: 'Profile Quality'
      },
      {
        title: 'Career Momentum',
        description: 'Keep track of applications, alerts, and upcoming interviews without switching context.',
        icon: FiTrendingUp,
        badge: 'Stay Visible'
      }
    ],
    stepsEyebrow: 'How It Works',
    stepsTitle: 'A cleaner path from profile to shortlist',
    stepsDescription: 'The flow is intentionally simple so experienced candidates can act quickly.',
    steps: [
      {
        title: 'Create your account',
        description: 'Open a candidate account and set the foundation for search, alerts, and profile visibility.',
        icon: FiUsers
      },
      {
        title: 'Polish your profile',
        description: 'Add resume details, experience signal, and role preferences to improve relevance.',
        icon: FiStar
      },
      {
        title: 'Apply with context',
        description: 'Use alerts, saved jobs, and application tracking to stay deliberate instead of reactive.',
        icon: FiArrowRight
      }
    ],
    spotlightEyebrow: 'Why Professionals Use It',
    spotlightTitle: 'Built for controlled, serious job movement',
    spotlightDescription: 'The professional experience is not about hype. It is about better structure around search, signaling, and follow-through.',
    spotlightPoints: [
      'Search jobs with less distraction and more role-fit',
      'Keep profile and resume improvements tied to actual applications',
      'Maintain visibility across alerts, interviews, and saved opportunities'
    ],
    cta: {
      eyebrow: 'Career Move',
      title: 'Create your account and start a more focused search',
      description: 'If you already know the kind of move you want, this lane gives you the tools to search, present, and apply with more control.',
      actions: [
        { label: 'Create Account', to: '/sign-up?role=student&redirect=%2Fportal%2Fstudent%2Fdashboard' },
        { label: 'Login', to: '/login' }
      ],
      chips: ['Search smarter', 'Track applications', 'Improve profile']
    }
  },
  recruiters: {
    eyebrow: 'For Recruiters',
    title: <>Give HR Teams A <span className="gradient-text">Cleaner Hiring Workflow</span></>,
    description: 'This lane is designed for recruiters and HR operators who need speed, structure, and better candidate visibility. Instead of managing scattered hiring tasks, your team gets one organized flow for jobs, applicants, ATS, and reporting.',
    chips: ['HR benefits', 'Hiring workflow', 'ATS visibility'],
    metrics: [
      { label: 'Hiring Flow', value: 'Structured', helper: 'Post, review, shortlist, and track from one place' },
      { label: 'Visibility', value: 'Clearer', helper: 'Candidate signals, activity, and ATS context stay easier to read' },
      { label: 'Control', value: 'Practical', helper: 'Use dashboards and reports without operational clutter' }
    ],
    heroActions: [
      { label: 'Create Recruiter Account', to: '/sign-up?role=hr&redirect=%2Fportal%2Fhr%2Fdashboard' },
      { label: 'HR Login', to: '/login', variant: 'ghost' }
    ],
    asideTitle: 'Platform benefits for HR',
    asidePoints: [
      'Post and manage roles inside one consistent workspace',
      'Review applicants with better structure and less fragmentation',
      'Use ATS, analytics, and profile signals to shortlist faster'
    ],
    featuresTitle: 'Why this works better for recruiting teams',
    featuresDescription: 'The recruiter lane is focused on real platform utility, not just generic employer messaging.',
    featureCards: [
      {
        title: 'Faster Job Publishing',
        description: 'Open hiring demand quickly and keep role details visible in one recruiter module.',
        icon: FiBriefcase,
        badge: 'Speed'
      },
      {
        title: 'Cleaner Candidate Review',
        description: 'Move from applicant list to ATS insight and interviews without juggling scattered tools.',
        icon: FiLayers,
        badge: 'Workflow'
      },
      {
        title: 'Better Hiring Decisions',
        description: 'Use dashboards, reports, and profile context to improve shortlisting quality.',
        icon: FiBarChart2,
        badge: 'Decision Quality'
      }
    ],
    stepsEyebrow: 'Recruiter Flow',
    stepsTitle: 'A practical HR journey inside the platform',
    stepsDescription: 'Everything here is aimed at reducing friction for live hiring teams.',
    steps: [
      {
        title: 'Create HR access',
        description: 'Set up the company-facing account and enter the hiring workspace with the right role.',
        icon: FiShield
      },
      {
        title: 'Launch jobs and review applicants',
        description: 'Publish roles, inspect applicant quality, and keep shortlisting decisions centralized.',
        icon: FiTarget
      },
      {
        title: 'Track ATS and outcomes',
        description: 'Use ATS and analytics views to keep pipeline movement and quality visible.',
        icon: FiActivity
      }
    ],
    spotlightEyebrow: 'What HR Gains',
    spotlightTitle: 'Less operational drag, better hiring visibility',
    spotlightDescription: 'The value here is in simplification. Recruiters get a clearer workspace and fewer handoff gaps between posting, review, and follow-up.',
    spotlightPoints: [
      'A more organized hiring workspace for small and growing teams',
      'Better candidate screening context through ATS and analytics',
      'Clearer pipeline movement from posting to shortlist to interview'
    ],
    cta: {
      eyebrow: 'Recruiter Access',
      title: 'Set up your HR account and start hiring from one workspace',
      description: 'If your team wants a cleaner, easier workflow for posting and shortlisting, start with the recruiter lane.',
      actions: [
        { label: 'Create Recruiter Account', to: '/sign-up?role=hr&redirect=%2Fportal%2Fhr%2Fdashboard' },
        { label: 'Recruiter Login', to: '/login' }
      ],
      chips: ['Post jobs', 'Review candidates', 'Track ATS']
    }
  },
  freshers: {
    eyebrow: 'For Freshers',
    title: <>Start Your First Job Search With <span className="gradient-text">More Clarity</span></>,
    description: 'This lane is designed for first-time candidates who need a simple starting point. Instead of guessing what matters, you get a focused path for profile setup, job discovery, resume basics, and early application momentum.',
    chips: ['First job', 'Simple onboarding', 'Resume support'],
    metrics: [
      { label: 'Starting Point', value: 'Simple', helper: 'Clear account setup with role-appropriate guidance' },
      { label: 'Confidence', value: 'Higher', helper: 'Understand what to do before your first applications' },
      { label: 'Growth', value: 'Visible', helper: 'Track jobs, ATS, and interviews as you begin' }
    ],
    heroActions: [
      { label: 'Create Fresher Account', to: '/sign-up?role=student&redirect=%2Fportal%2Fstudent%2Fdashboard' },
      { label: 'Fresher Login', to: '/login', variant: 'ghost' }
    ],
    asideTitle: 'Why freshers need a dedicated lane',
    asidePoints: [
      'Start with profile and resume basics that actually matter',
      'Avoid confusion by following a clearer first-job path',
      'Learn through jobs, ATS feedback, and application tracking'
    ],
    featuresTitle: 'A fresher-focused flow, not a crowded one',
    featuresDescription: 'Freshers need a cleaner first step. These sections keep the experience grounded and actionable.',
    featureCards: [
      {
        title: 'Easy Profile Setup',
        description: 'Create a strong candidate base even if you have limited work experience today.',
        icon: FiUsers,
        badge: 'Step 1'
      },
      {
        title: 'Resume and ATS Support',
        description: 'Understand how your resume is read and improve it before sending more applications.',
        icon: FiBookOpen,
        badge: 'Step 2'
      },
      {
        title: 'First Opportunity Tracking',
        description: 'Keep saved jobs, interviews, and application status in one predictable flow.',
        icon: FiZap,
        badge: 'Step 3'
      }
    ],
    stepsEyebrow: 'Getting Started',
    stepsTitle: 'What a fresher should do first',
    stepsDescription: 'The goal is to reduce overthinking and give you a concrete first-job routine.',
    steps: [
      {
        title: 'Create your account',
        description: 'Open a student candidate account and get access to the fresher-facing dashboard.',
        icon: FiCheckCircle
      },
      {
        title: 'Complete basics well',
        description: 'Add education, skills, and resume details so your profile stops looking incomplete.',
        icon: FiFileText
      },
      {
        title: 'Start applying steadily',
        description: 'Use alerts, ATS feedback, and saved jobs to improve quality over time.',
        icon: FiArrowRight
      }
    ],
    spotlightEyebrow: 'What Helps Most',
    spotlightTitle: 'Freshers do better with a calmer, guided setup',
    spotlightDescription: 'This lane avoids unnecessary complexity and focuses on the steps that move a fresher forward.',
    spotlightPoints: [
      'Profile setup that does not assume prior job experience',
      'Resume improvement that connects directly to ATS and applications',
      'A cleaner routine for finding, saving, and applying to the right roles'
    ],
    cta: {
      eyebrow: 'First Step',
      title: 'Create your fresher account and begin with the basics done right',
      description: 'This is the simplest place to start if you want your first serious job-search flow to feel structured instead of overwhelming.',
      actions: [
        { label: 'Create Account', to: '/sign-up?role=student&redirect=%2Fportal%2Fstudent%2Fdashboard' },
        { label: 'Login', to: '/login' }
      ],
      chips: ['First job search', 'ATS basics', 'Application tracking']
    }
  },
  veterans: {
    eyebrow: 'For Veterans',
    title: <>Open The Next Chapter For <span className="gradient-text">Experienced Talent</span></>,
    description: 'This lane is built for seasoned professionals, retired employees, and veterans who want flexible opportunities, clearer positioning, and a more respectful second-career experience.',
    chips: ['Second career', 'Flexible roles', 'Experience-first'],
    metrics: [
      { label: 'Positioning', value: 'Experience-led', helper: 'Your depth and reliability stay visible' },
      { label: 'Work Style', value: 'Flexible', helper: 'Consulting, part-time, advisory, or lighter schedules' },
      { label: 'Transition', value: 'Smoother', helper: 'Move into a second-career lane without confusion' }
    ],
    heroActions: [
      { label: 'Create Veteran Profile', to: '/sign-up?role=retired_employee&redirect=%2Fportal%2Fretired%2Fjobs' },
      { label: 'Veteran Login', to: '/login', variant: 'ghost' }
    ],
    asideTitle: 'Why this lane matters',
    asidePoints: [
      'Experience is treated as a hiring asset, not a side note',
      'Flexible work preferences are easier to surface and explain',
      'A second-career flow feels more respectful and practical'
    ],
    featuresTitle: 'Built for credibility, stability, and flexible work',
    featuresDescription: 'Veterans and retired professionals need a cleaner experience that respects work history and changing availability.',
    featureCards: [
      {
        title: 'Experience-first Roles',
        description: 'Discover roles where judgment, reliability, and depth matter more than hype.',
        icon: FiFlag,
        badge: 'Credibility'
      },
      {
        title: 'Flexible Preferences',
        description: 'Set up consulting, part-time, remote, or advisory expectations more clearly.',
        icon: FiLayers,
        badge: 'Flexibility'
      },
      {
        title: 'Second-Career Continuity',
        description: 'Continue working with better fit instead of forcing a full-reset job search.',
        icon: FiTrendingUp,
        badge: 'Continuity'
      }
    ],
    stepsEyebrow: 'Second-Career Flow',
    stepsTitle: 'A simple way to restart without starting over',
    stepsDescription: 'The aim is to let experienced talent move back into work with less friction.',
    steps: [
      {
        title: 'Create the right profile',
        description: 'Open the retired employee account and describe your strengths and preferred work mode.',
        icon: FiUsers
      },
      {
        title: 'Set availability and direction',
        description: 'Choose how you want to work now, not how you worked in the past.',
        icon: FiCompass
      },
      {
        title: 'Apply to better-fit roles',
        description: 'Focus on roles where maturity, consistency, and domain depth improve outcomes.',
        icon: FiArrowRight
      }
    ],
    spotlightEyebrow: 'Audience Fit',
    spotlightTitle: 'Designed for experienced candidates who want the next chapter to fit',
    spotlightDescription: 'This is not a generic candidate flow. It is a lane for people whose experience should work in their favor.',
    spotlightPoints: [
      'A better path for retired and senior professionals re-entering the market',
      'Clearer communication of flexible work and experience strengths',
      'An easier bridge into consulting, advisory, and part-time opportunities'
    ],
    cta: {
      eyebrow: 'Next Chapter',
      title: 'Create your veteran profile and begin a better-fit second career',
      description: 'Use the veteran lane if you want opportunities that respect your experience and current work preferences.',
      actions: [
        { label: 'Create Profile', to: '/sign-up?role=retired_employee&redirect=%2Fportal%2Fretired%2Fjobs' },
        { label: 'Login', to: '/login' }
      ],
      chips: ['Retired employees', 'Advisory work', 'Flexible opportunities']
    }
  },
  'campus-connect': {
    eyebrow: 'For Campuses',
    title: <>Bring Placement Operations Into <span className="gradient-text">One Campus Workspace</span></>,
    description: 'Campus Connect is built for colleges, placement cells, and training campuses that want student records, drives, company outreach, and reporting in one cleaner workflow instead of scattered sheets and inbox threads.',
    chips: ['Placement cell', 'Campus drives', 'Student pipeline'],
    metrics: [
      { label: 'Student Records', value: 'Structured', helper: 'Keep batch, branch, CGPA, and placement status easier to manage' },
      { label: 'Drive Ops', value: 'Faster', helper: 'Publish drives, monitor eligibility, and track status from one dashboard' },
      { label: 'Employer Reach', value: 'Clearer', helper: 'Manage company connections and responses without fragmented follow-up' }
    ],
    heroActions: [
      { label: 'Open Campus Connect', to: '/management/login/campus-connect' },
      { label: 'Explore Hiring Platform', to: '/recruiters', variant: 'ghost' }
    ],
    asideTitle: 'What campuses get here',
    asidePoints: [
      'A dedicated dashboard for placement and college operations',
      'Cleaner student data, drive planning, and recruiter connection tracking',
      'A more institutional workflow than generic employer tools'
    ],
    featuresTitle: 'Campus workflows designed around placement teams',
    featuresDescription: 'This lane focuses on campus-specific operations: managing students, publishing drives, handling company interest, and reporting outcomes clearly.',
    featureCards: [
      {
        title: 'Student Database',
        description: 'Maintain placement-ready student records with degree, branch, CGPA, skills, and placement status.',
        icon: FiUsers,
        badge: 'Campus Records'
      },
      {
        title: 'Drive Management',
        description: 'Run campus drives with eligibility, dates, packages, and workflow visibility in one place.',
        icon: FiBriefcase,
        badge: 'Placement Ops'
      },
      {
        title: 'Company Connections',
        description: 'Track outreach, responses, and recruiter relationships through a dedicated campus pipeline.',
        icon: FiTarget,
        badge: 'Outreach'
      }
    ],
    stepsEyebrow: 'Campus Flow',
    stepsTitle: 'How a placement team uses Campus Connect',
    stepsDescription: 'The flow is designed to reduce manual follow-up and centralize college placement work.',
    steps: [
      {
        title: 'Open the campus workspace',
        description: 'Use the dedicated campus login to enter a dashboard built for placement operations.',
        icon: FiShield
      },
      {
        title: 'Manage students and drives',
        description: 'Keep student records current, launch drives, and monitor participation through one system.',
        icon: FiBookOpen
      },
      {
        title: 'Track outreach and outcomes',
        description: 'Follow recruiter interest, placements, and reporting from a cleaner campus CRM flow.',
        icon: FiBarChart2
      }
    ],
    spotlightEyebrow: 'Why Colleges Need It',
    spotlightTitle: 'A placement workflow that feels closer to an operations system',
    spotlightDescription: 'Campus Connect is not just another employer page. It is a dedicated lane for colleges that need structure around student readiness, recruiter outreach, and placement reporting.',
    spotlightPoints: [
      'Placement teams can centralize student and drive operations',
      'College-recruiter communication stays easier to track and follow up',
      'Reports and placement progress become more visible for each batch'
    ],
    cta: {
      eyebrow: 'Campus Access',
      title: 'Open the campus portal and manage placement operations properly',
      description: 'If your college or placement cell needs a cleaner workflow for drives, students, and recruiter outreach, Campus Connect should be entered directly from the public home experience.',
      actions: [
        { label: 'Campus Login', to: '/management/login/campus-connect' },
        { label: 'Back to Home', to: '/' }
      ],
      chips: ['Placement cell', 'Drive management', 'Employer outreach']
    }
  }
};

const AudienceLandingPage = ({ audienceKey }) => {
  const content = audienceContent[audienceKey];

  if (!content) return null;

  return (
    <div className="pb-16 md:pb-24">
      <PublicPageHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        chips={content.chips}
        actions={content.heroActions}
        metrics={content.metrics}
        tightTop
        aside={(
          <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-brand-700 to-indigo-700 p-6 text-white shadow-xl">
            <h2 className="font-heading text-2xl font-extrabold">{content.asideTitle}</h2>
            <div className="mt-6 space-y-3">
              {content.asidePoints.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] border border-white/14 bg-white/10 px-4 py-3 text-sm font-semibold text-white/88"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      />

      <section className="container mx-auto max-w-7xl px-4">
        <PublicSectionHeader
          centered
          eyebrow={content.eyebrow}
          title={content.featuresTitle}
          description={content.featuresDescription}
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {content.featureCards.map((card, index) => (
            <PublicFeatureCard
              key={card.title}
              delay={index * 0.06}
              icon={card.icon}
              title={card.title}
              description={card.description}
              badge={card.badge}
            />
          ))}
        </div>
      </section>

      <section className="container mx-auto mt-16 max-w-7xl px-4">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <PublicSectionHeader
              eyebrow={content.stepsEyebrow}
              title={content.stepsTitle}
              description={content.stepsDescription}
            />

            <div className="mt-8 grid gap-4">
              {content.steps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <article key={step.title} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-sm font-black text-brand-700">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-brand-700"><Icon size={17} /></span>
                          <h3 className="font-heading text-lg font-bold text-navy">{step.title}</h3>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <PublicSectionHeader
              eyebrow={content.spotlightEyebrow}
              title={content.spotlightTitle}
              description={content.spotlightDescription}
            />

            <div className="mt-8 space-y-4">
              {content.spotlightPoints.map((point) => (
                <article key={point} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-brand-700">
                      <FiCheckCircle size={18} />
                    </span>
                    <p className="text-sm leading-7 text-slate-600">{point}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-[1.6rem] border border-brand-100 bg-brand-50 p-5">
              <p className="font-heading text-lg font-bold text-navy">Ready to start?</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Open the right account type first, then continue into the matching login and dashboard flow.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to={content.cta.actions[0].to}
                  className="inline-flex rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white"
                >
                  {content.cta.actions[0].label}
                </Link>
                <Link
                  to={content.cta.actions[1].to}
                  className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-navy"
                >
                  {content.cta.actions[1].label}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto mt-16 max-w-7xl px-4">
        <PublicCallToAction
          eyebrow={content.cta.eyebrow}
          title={content.cta.title}
          description={content.cta.description}
          actions={content.cta.actions}
          chips={content.cta.chips}
        />
      </div>
    </div>
  );
};

export default AudienceLandingPage;
