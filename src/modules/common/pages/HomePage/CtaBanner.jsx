import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Building2, GraduationCap, UserRoundSearch } from 'lucide-react';
import AnimatedSection from '../../../../shared/components/AnimatedSection';
import useAuthStore from '../../../../core/auth/authStore';
import { normalizeRole } from '../../../../utils/auth';

const routeNodes = [
  { label: 'Student', icon: GraduationCap },
  { label: 'Professional', icon: UserRoundSearch },
  { label: 'Employer', icon: Briefcase },
  { label: 'Campus', icon: Building2 }
];

export function CtaBanner() {
  const user = useAuthStore((state) => state.user);
  const isHrUser = normalizeRole(user?.role) === 'hr';
  const hrDashboardPath = '/portal/hr/dashboard';
  const hrSignupPath = '/sign-up?role=hr&redirect=%2Fportal%2Fhr%2Fdashboard';

  return (
    <section className="border-b border-slate-200 bg-white py-10 md:py-12">
      <div className="vw-shell-wide">
        <AnimatedSection>
          <div className="home-cta-frame relative overflow-hidden rounded-lg border border-slate-700 bg-[#0b1729] p-6 text-white md:p-9">
            <span className="home-cta-frame__corner home-cta-frame__corner--tl" aria-hidden="true" />
            <span className="home-cta-frame__corner home-cta-frame__corner--br" aria-hidden="true" />

            <div className="relative z-10 grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.8fr)] lg:items-center">
              <div>
                <p className="text-[11px] font-black uppercase text-amber-300">Choose your next move</p>
                <h2 className="mt-3 max-w-2xl font-heading text-3xl font-black text-white md:text-4xl">
                  Find the right role. Build the right team.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                  Enter HHH Jobs from the side of the network that matches what you need today.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/jobs"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300"
                  >
                    Explore jobs <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to={isHrUser ? hrDashboardPath : hrSignupPath}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:border-white/40 hover:bg-white/5"
                  >
                    <Briefcase className="h-4 w-4" />
                    {isHrUser ? 'Open HR workspace' : 'Start hiring'}
                  </Link>
                </div>
              </div>

              <div className="home-cta-route grid grid-cols-2 border-l border-t border-white/15" aria-label="HHH Jobs network participants">
                {routeNodes.map((node, index) => (
                  <div key={node.label} className="relative flex min-h-[96px] items-center gap-3 border-b border-r border-white/15 p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-amber-200">
                      <node.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="block font-mono text-[9px] font-bold text-white/35">0{index + 1}</span>
                      <span className="mt-1 block text-xs font-black text-slate-100">{node.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
