import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  CheckCircle2,
  Filter,
  Handshake,
  Search,
  Send,
  UserPlus,
  Users
} from 'lucide-react';
import AnimatedSection from '../../../../shared/components/AnimatedSection';

const seekerSteps = [
  { icon: UserPlus, title: 'Build your profile', desc: 'Bring skills, projects, experience, and location into one searchable identity.' },
  { icon: Search, title: 'Discover the right work', desc: 'Search private and government opportunities with relevant filters and context.' },
  { icon: Send, title: 'Apply with clarity', desc: 'Move from role detail to application, saved jobs, and alerts without losing context.' },
  { icon: CheckCircle2, title: 'Track the outcome', desc: 'Follow shortlist, interview, and offer movement from your candidate workspace.' }
];

const recruiterSteps = [
  { icon: Building2, title: 'Set up the employer', desc: 'Create a trusted company presence and prepare the hiring workspace.' },
  { icon: Users, title: 'Publish the requirement', desc: 'Post structured roles with clear skills, location, salary, and job context.' },
  { icon: Filter, title: 'Review candidate fit', desc: 'Use profile evidence and workflow signals to focus the shortlist.' },
  { icon: Handshake, title: 'Move to hire', desc: 'Coordinate interviews, decisions, and offers through one connected process.' }
];

function StepGrid({ steps, panelId }) {
  return (
    <motion.div
      key={panelId}
      id={panelId}
      role="tabpanel"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      className="mt-9 grid border-y border-slate-200 md:grid-cols-4"
    >
      {steps.map((step, index) => (
        <article
          key={step.title}
          className={`group relative min-h-[220px] p-6 transition-colors hover:bg-slate-50 md:p-7 ${
            index < steps.length - 1 ? 'border-b border-slate-200 md:border-b-0 md:border-r' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white transition-transform group-hover:-translate-y-1">
              <step.icon className="h-5 w-5" />
            </span>
            <span className="font-mono text-xs font-bold text-amber-600">{String(index + 1).padStart(2, '0')}</span>
          </div>
          <h3 className="mt-8 font-heading text-lg font-black text-slate-950">{step.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-500">{step.desc}</p>
          <span className="absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-amber-500 transition-transform duration-300 group-hover:scale-x-100" />
        </article>
      ))}
    </motion.div>
  );
}

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState('seekers');
  const isSeekerTab = activeTab === 'seekers';

  return (
    <section className="border-b border-slate-200 bg-white py-14 md:py-20">
      <div className="vw-shell-wide">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <AnimatedSection>
            <p className="text-[11px] font-black uppercase text-brand-700">Connected workflow</p>
            <h2 className="mt-3 max-w-2xl font-heading text-3xl font-black text-navy md:text-4xl">
              A clear route through every hiring stage.
            </h2>
          </AnimatedSection>

          <AnimatedSection>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="Hiring journey">
              <button
                type="button"
                role="tab"
                aria-controls="seeker-hiring-journey"
                aria-selected={isSeekerTab}
                className={`rounded-md px-5 py-2.5 text-sm font-bold ${
                  isSeekerTab ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:text-navy'
                }`}
                onClick={() => setActiveTab('seekers')}
              >
                Job seekers
              </button>
              <button
                type="button"
                role="tab"
                aria-controls="employer-hiring-journey"
                aria-selected={!isSeekerTab}
                className={`rounded-md px-5 py-2.5 text-sm font-bold ${
                  !isSeekerTab ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:text-navy'
                }`}
                onClick={() => setActiveTab('recruiters')}
              >
                Employers
              </button>
            </div>
          </AnimatedSection>
        </div>

        <StepGrid
          steps={isSeekerTab ? seekerSteps : recruiterSteps}
          panelId={isSeekerTab ? 'seeker-hiring-journey' : 'employer-hiring-journey'}
        />
      </div>
    </section>
  );
}
