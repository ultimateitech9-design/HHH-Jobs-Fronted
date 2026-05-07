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
  { icon: UserPlus, title: 'Create Profile', desc: 'Set up your account and make your profile searchable.' },
  { icon: Search, title: 'Search Jobs', desc: 'Use the cleaner search experience to find the right roles fast.' },
  { icon: Send, title: 'Apply Easily', desc: 'Track applications, saved roles, and alerts in one place.' },
  { icon: CheckCircle2, title: 'Get Hired', desc: 'Move from shortlist to interview to offer with more clarity.' }
];

const recruiterSteps = [
  { icon: Building2, title: 'Set Up Company', desc: 'Create a recruiter profile and prepare your hiring workspace.' },
  { icon: Users, title: 'Post Jobs', desc: 'Publish roles and keep them visible inside the recruiter module.' },
  { icon: Filter, title: 'Review Candidates', desc: 'Shortlist and manage applicants with cleaner dashboards.' },
  { icon: Handshake, title: 'Hire Talent', desc: 'Track interviews, offers, and final decisions from one flow.' }
];

function StepGrid({ steps }) {
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-4">
      {steps.map((step, index) => (
        <AnimatedSection key={step.title} delay={index * 0.08}>
          <motion.div whileHover={{ y: -6 }} className="group relative text-center">
            {index < steps.length - 1 ? (
              <div className="absolute left-[60%] top-8 hidden h-[2px] w-[80%] bg-gradient-to-r from-brand-200 to-transparent md:block" />
            ) : null}
            <motion.div
              whileHover={{ rotate: [0, -5, 5, 0], scale: 1.08 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl gradient-primary text-white shadow-xl shadow-navy/20"
            >
              <step.icon className="h-7 w-7" />
            </motion.div>
            <span className="absolute right-4 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-primary shadow-lg md:-left-2 md:right-auto">
              {index + 1}
            </span>
            <h3 className="font-heading text-lg font-semibold text-slate-900">{step.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{step.desc}</p>
          </motion.div>
        </AnimatedSection>
      ))}
    </div>
  );
}

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState('seekers');

  return (
    <section className="px-4 py-20">
      <div className="container mx-auto max-w-6xl">
        <AnimatedSection className="text-center">
          <h2 className="font-heading text-3xl font-extrabold text-navy md:text-4xl">
            How <span className="gradient-text">It Works</span>
          </h2>
        </AnimatedSection>

        <AnimatedSection className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'seekers'}
              className={`rounded-full px-6 py-3 text-sm font-bold transition-all ${
                activeTab === 'seekers' ? 'gradient-primary text-white' : 'text-slate-600 hover:text-navy'
              }`}
              onClick={() => setActiveTab('seekers')}
            >
              For Job Seekers
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'recruiters'}
              className={`rounded-full px-6 py-3 text-sm font-bold transition-all ${
                activeTab === 'recruiters' ? 'gradient-primary text-white' : 'text-slate-600 hover:text-navy'
              }`}
              onClick={() => setActiveTab('recruiters')}
            >
              For Employers
            </button>
          </div>
        </AnimatedSection>

        {activeTab === 'seekers' ? <StepGrid steps={seekerSteps} /> : <StepGrid steps={recruiterSteps} />}
      </div>
    </section>
  );
}
