import { FiArrowUpRight } from 'react-icons/fi';

const metricCards = [
  {
    label: 'Focus',
    value: 'Background Checks',
    helper: 'Verification support for employer-led review'
  },
  {
    label: 'Response',
    value: 'Faster Reviews',
    helper: 'Built to reduce avoidable hiring delays'
  },
  {
    label: 'Coverage',
    value: '10+ Sectors',
    helper: 'Relevant across multiple hiring environments'
  }
];

const chips = ['Verification support', 'Employer ready', 'Multi-industry use'];

const EmployeeVerificationPage = () => {
  return (
    <section className="overflow-hidden">
      <div className="grid items-start gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="pt-0.5">
          <span className="inline-flex items-center rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 text-sm font-semibold text-gold-dark">
            Employee Verification
          </span>

          <h1 className="mt-3 font-heading text-[3.3rem] font-extrabold leading-[0.95] text-navy">
            Employee Verification Powered by <span className="gradient-text">Eimager</span>
          </h1>

          <p className="mt-3 max-w-3xl text-[0.95rem] leading-7 text-slate-600">
            Understand how the Eimager verification workflow supports employer due diligence, reduces uncertainty,
            and adds stronger trust signals to hiring decisions.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white/92 p-4 shadow-xl backdrop-blur-sm">
          <img
            src="/images/emiger.png"
            alt="Eimager brand visual"
            className="w-full rounded-[1.5rem] border border-slate-100 bg-slate-50 object-cover"
          />

          <div className="mt-4 space-y-3">
            <a
              href="https://www.eimager.com/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700"
            >
              <span>Visit Eimager</span>
              <FiArrowUpRight />
            </a>

            <a
              href="https://eimager.com/about"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700"
            >
              <span>Read Brand Story</span>
              <FiArrowUpRight />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {metricCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[1.8rem] border border-slate-200 bg-white/88 p-4 shadow-sm backdrop-blur-sm"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
            <p className="mt-2.5 font-heading text-[3rem] font-extrabold leading-[0.98] text-navy">{card.value}</p>
            <p className="mt-2.5 text-sm leading-6 text-slate-500">{card.helper}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default EmployeeVerificationPage;
