import { FiBarChart2, FiBriefcase, FiHeadphones, FiInfo, FiMail } from 'react-icons/fi';
import AnimatedSection from '../../../../shared/components/AnimatedSection';

const businessRegions = [
  { region: 'India', email: 'sales@hhh-jobs.com' },
  { region: 'Africa', email: 'africa@hhh-jobs.com' },
  { region: 'Europe', email: 'europe@hhh-jobs.com' },
  { region: 'Middle East', email: 'middleeast@hhh-jobs.com' }
];

const FooterContactChannels = () => {
  return (
    <div className="grid gap-6">
      <AnimatedSection>
        <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <FiHeadphones size={22} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-700">Support</p>
              <h3 className="mt-3 font-heading text-2xl font-bold text-navy">Support Requests</h3>
              <a
                href="mailto:support@hhh-jobs.com"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700"
              >
                <FiMail size={16} />
                support@hhh-jobs.com
              </a>
            </div>
          </div>
        </article>
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <article className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <FiBarChart2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-teal-700">Business</p>
              <h3 className="mt-2 font-heading text-[1.6rem] font-bold text-navy">Business & Partnerships</h3>
              <div className="mt-3 divide-y divide-slate-200 border-t border-slate-200">
                {businessRegions.map((item) => (
                  <a
                    key={item.region}
                    href={`mailto:${item.email}`}
                    className="flex items-center justify-between gap-4 py-3 text-sm text-slate-700 transition-colors hover:text-teal-700"
                  >
                    <span className="font-semibold">{item.region}</span>
                    <span className="text-xs font-medium lowercase tracking-normal text-slate-500">
                      {item.email}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </article>
      </AnimatedSection>

      <div className="grid gap-6 sm:grid-cols-2">
        <AnimatedSection delay={0.12}>
          <article className="flex h-full flex-col rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <FiInfo size={20} />
            </div>
            <h3 className="mt-5 font-heading text-xl font-bold text-navy">General Information</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">For product queries and general business communication.</p>
            <a href="mailto:info@hhh-jobs.com" className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-indigo-700">
              <FiMail size={16} />
              info@hhh-jobs.com
            </a>
          </article>
        </AnimatedSection>

        <AnimatedSection delay={0.16}>
          <article className="flex h-full flex-col rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
              <FiBriefcase size={20} />
            </div>
            <h3 className="mt-5 font-heading text-xl font-bold text-navy">Careers & HR</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">For career opportunities with HHH Jobs and team-related professional enquiries.</p>
            <a href="mailto:hr@hhh-jobs.com" className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-orange-700">
              <FiMail size={16} />
              hr@hhh-jobs.com
            </a>
          </article>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default FooterContactChannels;
