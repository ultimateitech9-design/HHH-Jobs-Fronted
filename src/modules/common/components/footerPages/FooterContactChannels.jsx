import { FiBriefcase, FiHeadphones, FiInfo, FiMail } from 'react-icons/fi';
import AnimatedSection from '../../../../shared/components/AnimatedSection';

const businessRegions = [
  { region: 'India', email: 'sales@hhh-jobs.com' },
  { region: 'Africa', email: 'africa@hhh-jobs.com' },
  { region: 'Europe', email: 'europe@hhh-jobs.com' },
  { region: 'Middle East', email: 'middleeast@hhh-jobs.com' }
];

const FooterContactChannels = () => {
  return (
    <AnimatedSection>
      <div className="flex h-full flex-col justify-between gap-8 rounded-[2rem] border border-slate-200/60 bg-white/60 p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl sm:p-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-700">Direct Email Channels</p>
          <h2 className="mt-3 font-heading text-[2rem] font-bold leading-tight text-navy">
            Reach out to the right team
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            For specific inquiries, use our direct email channels below to reach the exact department you need.
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="group flex items-start gap-4 rounded-[1.25rem] border border-slate-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100 group-hover:text-brand-700">
              <FiHeadphones size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-navy">Support Requests</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">General help & account issues</p>
              <a href="mailto:support@hhh-jobs.com" className="mt-2 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700">
                support@hhh-jobs.com
              </a>
            </div>
          </div>

          <div className="group flex items-start gap-4 rounded-[1.25rem] border border-slate-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-100 group-hover:text-teal-700">
              <FiBriefcase size={20} />
            </div>
            <div className="w-full">
              <p className="text-sm font-bold text-navy">Business & Sales</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">Partnerships & employer plans</p>
              <div className="mt-2.5 flex flex-col gap-1.5 border-t border-slate-100/80 pt-2.5">
                {businessRegions.map((item) => (
                  <div key={item.region} className="flex items-center justify-between text-[11.5px]">
                    <span className="font-semibold text-slate-600">{item.region}</span>
                    <a href={`mailto:${item.email}`} className="font-medium text-teal-600 transition-colors hover:text-teal-700">
                      {item.email}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="group flex items-start gap-4 rounded-[1.25rem] border border-slate-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-100 group-hover:text-orange-700">
              <FiMail size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-navy">Careers & HR</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">Join our team or verify</p>
              <a href="mailto:hr@hhh-jobs.com" className="mt-2 inline-flex text-sm font-semibold text-orange-600 hover:text-orange-700">
                hr@hhh-jobs.com
              </a>
            </div>
          </div>

          <div className="group flex items-start gap-4 rounded-[1.25rem] border border-slate-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-700">
              <FiInfo size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-navy">Information</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">Media, press, & general</p>
              <a href="mailto:info@hhh-jobs.com" className="mt-2 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                info@hhh-jobs.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default FooterContactChannels;
