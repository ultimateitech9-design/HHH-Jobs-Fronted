import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import AnimatedSection from '../../../../shared/components/AnimatedSection';
import dashboardPreview from '../../../../assets/career-compass-dashboard.jpg';

export function DashboardPreviewSection() {
  return (
    <section className="overflow-hidden px-4 py-10 md:py-12">
      <div className="container mx-auto max-w-7xl">
        <AnimatedSection className="mb-6 text-center">
          <h2 className="font-heading text-2xl font-bold text-navy md:text-3xl">
            Powerful <span className="gradient-text">Dashboards</span>
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
            Track applications, manage hiring pipelines, and get a more unified module-wise UI across the platform.
          </p>
        </AnimatedSection>
        <AnimatedSection>
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.4 }}
            className="group relative mx-auto h-[320px] max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-strong sm:h-[380px] lg:h-[420px]"
          >
            <div className="absolute -inset-1 rounded-[28px] gradient-gold opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-15" />
            <img
              src={dashboardPreview}
              alt="HHH Jobs dashboard preview"
              className="relative z-10 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 z-20 flex items-end bg-gradient-to-t from-navy/80 to-transparent p-5 md:p-6">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h3 className="font-heading text-xl font-bold text-white">Your command center for hiring and job search</h3>
                <p className="mt-1 max-w-md text-sm text-white/70">
                  The same route structure underneath, but with a much more unified dashboard presentation.
                </p>
                <Link to="/sign-up">
                  <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-3 inline-flex items-center gap-2 rounded-full gradient-gold px-4 py-2 text-sm font-semibold text-primary shadow-xl">
                    Start Free <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}
