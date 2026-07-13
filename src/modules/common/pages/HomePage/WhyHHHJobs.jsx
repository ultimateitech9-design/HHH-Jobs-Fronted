import { BadgeCheck, Brain, Globe, Shield, Users, Zap } from 'lucide-react';
import AnimatedSection from '../../../../shared/components/AnimatedSection';

const features = [
  {
    icon: BadgeCheck,
    title: 'Verified opportunity layer',
    desc: 'Structured employer and job checks keep discovery focused on credible openings.'
  },
  {
    icon: Brain,
    title: 'Context-aware matching',
    desc: 'Skills, projects, experience, and location work together instead of relying on keywords alone.'
  },
  {
    icon: Zap,
    title: 'Faster hiring movement',
    desc: 'Search, apply, shortlist, interview, and follow-up stay connected across one workflow.'
  },
  {
    icon: Shield,
    title: 'Trust-led access',
    desc: 'Verification and role-based access support safer candidate and employer interactions.'
  },
  {
    icon: Users,
    title: 'Every hiring participant',
    desc: 'Students, professionals, HR teams, campuses, and operations work inside the same network.'
  },
  {
    icon: Globe,
    title: 'India-wide discovery',
    desc: 'Mapped roles and locations help opportunities travel from national demand to nearby talent.'
  }
];

export function WhyHHHJobs() {
  return (
    <section className="home-trust-story relative overflow-hidden border-y border-slate-800 bg-[#081426] py-14 text-white md:py-20">
      <div className="home-trust-story__grid absolute inset-0" aria-hidden="true" />

      <div className="vw-shell-wide relative z-10 grid gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-16">
        <AnimatedSection className="lg:pt-3">
          <p className="text-[11px] font-black uppercase text-amber-300">The HHH Jobs network</p>
          <h2 className="mt-4 max-w-xl font-heading text-3xl font-black leading-tight text-white md:text-5xl">
            One connected path from potential to placement.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 md:text-base">
            Hiring works better when candidate context, employer intent, campus readiness, and operational trust move together.
          </p>

          <div className="home-trust-signal mt-9" aria-hidden="true">
            <span className="home-trust-signal__line" />
            <span className="home-trust-signal__node home-trust-signal__node--candidate">Talent</span>
            <span className="home-trust-signal__node home-trust-signal__node--match">Match</span>
            <span className="home-trust-signal__node home-trust-signal__node--employer">Hiring</span>
          </div>
        </AnimatedSection>

        <div className="grid border-t border-white/15 sm:grid-cols-2">
          {features.map((feature, index) => (
            <AnimatedSection key={feature.title} delay={index * 0.05}>
              <article
                className={`group min-h-[190px] border-b border-white/15 p-5 transition-colors hover:bg-white/[0.035] md:p-6 ${
                  index % 2 === 1 ? 'sm:border-l' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-300/25 bg-amber-300/10 text-amber-200">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-[10px] font-bold text-white/35">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="mt-7 font-heading text-lg font-black text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{feature.desc}</p>
              </article>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
