import { motion } from 'framer-motion';
import { BadgeCheck, Brain, Globe, Shield, Users, Zap } from 'lucide-react';
import AnimatedSection from '../../../../shared/components/AnimatedSection';

const features = [
  {
    icon: BadgeCheck,
    title: 'Verified Jobs Only',
    desc: 'Every listing is checked so seekers are not wasting time on low-trust posts.'
  },
  {
    icon: Brain,
    title: 'AI-Powered Matching',
    desc: 'Role discovery and candidate routing both get smarter as platform data improves.'
  },
  {
    icon: Zap,
    title: 'Faster Workflows',
    desc: 'Search, apply, shortlist, and follow-up all happen through cleaner guided screens.'
  },
  {
    icon: Shield,
    title: 'Trusted & Secure',
    desc: 'A more structured system for account verification, access, and workflow control.'
  },
  {
    icon: Users,
    title: 'Inclusive Platform',
    desc: 'Students, recruiters, admins, retired professionals, and support teams all fit into one system.'
  },
  {
    icon: Globe,
    title: 'Scalable Modules',
    desc: 'Keep the module-wise backend and routing, while unifying the UI language across them.'
  }
];

export function WhyHHHJobs() {
  return (
    <section className="px-4 py-12 md:py-14">
      <div className="container mx-auto max-w-7xl">
        <AnimatedSection className="mb-8 text-center md:mb-10">
          <h2 className="font-heading text-3xl font-bold text-navy md:text-4xl">
            Why Choose <span className="gradient-text">HHH Jobs</span>
          </h2>
        </AnimatedSection>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <AnimatedSection key={feature.title} delay={index * 0.08}>
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-gold/20 hover:shadow-strong"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gold/5 via-transparent to-navy/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold-dark transition-all duration-300 group-hover:gradient-gold group-hover:text-primary"
                  >
                    <feature.icon className="h-6 w-6" />
                  </motion.div>
                  <h3 className="font-heading text-lg font-semibold text-navy">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{feature.desc}</p>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
