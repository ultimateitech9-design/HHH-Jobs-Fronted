import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, Sparkles } from 'lucide-react';
import AnimatedSection from '../../../../shared/components/AnimatedSection';
import useAuthStore from '../../../../core/auth/authStore';
import { normalizeRole } from '../../../../utils/auth';

export function CtaBanner() {
  const user = useAuthStore((state) => state.user);
  const isHrUser = normalizeRole(user?.role) === 'hr';
  const hrDashboardPath = '/portal/hr/dashboard';
  const hrSignupPath = '/sign-up?role=hr&redirect=%2Fportal%2Fhr%2Fdashboard';

  return (
    <section className="px-4 py-10 md:py-12">
      <div className="container mx-auto max-w-5xl">
        <AnimatedSection>
          <div className="gradient-primary relative overflow-hidden rounded-[36px] p-8 text-center md:p-10">
            <motion.div
              className="absolute left-0 top-0 h-64 w-64 rounded-full bg-gold/10 blur-3xl"
              animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-gold/5 blur-3xl"
              animate={{ x: [0, -30, 0], y: [0, -30, 0] }}
              transition={{ duration: 10, repeat: Infinity }}
            />
            {[0, 1, 2, 3].map((item) => (
              <motion.div
                key={item}
                className="absolute"
                style={{ top: `${20 + item * 18}%`, left: `${15 + item * 18}%` }}
                animate={{ y: [0, -15, 0], opacity: [0.2, 0.5, 0.2], rotate: [0, 180, 360] }}
                transition={{ duration: 3 + item, repeat: Infinity, delay: item * 0.5 }}
              >
                <Sparkles className="h-4 w-4 text-gold/30" />
              </motion.div>
            ))}

            <div className="relative z-10">
              <h2 className="font-heading text-3xl font-extrabold text-white md:text-4xl">
                Ready to Transform Your Career?
              </h2>
              <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
                <Link to="/jobs">
                  <motion.span whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center gap-2 rounded-full gradient-gold px-6 py-3 font-semibold text-primary shadow-xl">
                    Find Genuine Jobs <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </Link>
                <Link
                  to={isHrUser ? hrDashboardPath : hrSignupPath}
                >
                  <motion.span
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-gold/10"
                  >
                    <Briefcase className="h-4 w-4" />
                    Hire the Best Candidates
                  </motion.span>
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
