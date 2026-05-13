import AnimatedSection from '../../../shared/components/AnimatedSection';

const AuthPageShell = ({
  eyebrow,
  title,
  description,
  sideTitle,
  sideDescription,
  benefits = [],
  balancedPanels = false,
  lockBalancedHeight = true,
  compactHeader = false,
  panelClassName = '',
  sideClassName = '',
  children
}) => {
  const sectionClassName = balancedPanels
    ? `relative overflow-hidden px-4 ${compactHeader ? 'py-4 md:py-5' : 'py-6'} ${lockBalancedHeight ? 'md:min-h-[calc(100vh-4rem)] md:py-8' : compactHeader ? '' : 'md:py-8'}`
    : 'relative overflow-hidden px-4 py-8 md:py-14';
  const gridClassName = balancedPanels
    ? `grid gap-7 lg:grid-cols-2 ${lockBalancedHeight ? 'items-stretch' : 'items-start'}`
    : 'grid items-center gap-7 lg:grid-cols-[0.86fr_1fr]';
  const sideCardClassName = balancedPanels
    ? `flex flex-col rounded-[1.9rem] bg-gradient-to-br from-slate-950 via-brand-700 to-indigo-700 text-white shadow-2xl ${lockBalancedHeight ? 'justify-between p-7 h-full min-h-[36rem] overflow-hidden lg:h-[min(44rem,calc(100vh-6rem))]' : 'self-start gap-5 p-6 h-auto'}`
    : 'rounded-[1.9rem] bg-gradient-to-br from-slate-950 via-brand-700 to-indigo-700 p-7 text-white shadow-2xl';
  const panelCardClassName = balancedPanels
    ? `flex flex-col rounded-[1.9rem] border border-slate-200 bg-white/92 p-5 shadow-2xl backdrop-blur-xl md:p-6 ${lockBalancedHeight ? 'h-full min-h-[36rem] overflow-hidden lg:h-[min(44rem,calc(100vh-6rem))]' : 'h-auto'}`
    : 'rounded-[1.9rem] border border-slate-200 bg-white/92 p-5 shadow-2xl backdrop-blur-xl md:p-6';

  return (
    <section className={sectionClassName}>
      <div className="absolute left-10 top-8 h-52 w-52 rounded-full bg-gold/8 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />

      <div className="container relative z-10 mx-auto max-w-[78rem]">
        <div className={gridClassName}>
          <AnimatedSection className={`hidden lg:block ${balancedPanels && lockBalancedHeight ? 'h-full' : ''}`.trim()}>
            <div className={`${sideCardClassName} ${sideClassName}`.trim()}>
              {eyebrow ? (
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/65">{eyebrow}</p>
              ) : null}

              <h2 className={`font-heading text-[1.75rem] font-bold leading-tight ${lockBalancedHeight ? 'mt-3.5' : 'mt-1'}`}>{sideTitle}</h2>
              {sideDescription ? (
                <p className="mt-2.5 text-sm leading-6 text-white/74">{sideDescription}</p>
              ) : null}

              {benefits.length > 0 ? (
                <div className={`${lockBalancedHeight ? 'mt-6' : 'mt-1'} grid gap-2.5`}>
                  {benefits.map((item) => (
                    <article
                      key={item.title}
                      className="rounded-[1.2rem] border border-white/14 bg-white/10 p-3.5 backdrop-blur-sm"
                    >
                      <p className="font-heading text-[15px] font-bold">{item.title}</p>
                      {item.description ? (
                        <p className="mt-1 text-xs leading-5 text-white/72">{item.description}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.08} className={balancedPanels && lockBalancedHeight ? 'h-full' : ''}>
            <div className={`${panelCardClassName} ${panelClassName}`.trim()}>
              <div className={`${compactHeader ? 'mb-2.5' : 'mb-5'} text-center lg:text-left`.trim()}>
                {eyebrow ? (
                  <span className={`inline-flex rounded-full border border-gold/20 bg-gold/10 ${compactHeader ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} font-semibold text-gold-dark`.trim()}>
                    {eyebrow}
                  </span>
                ) : null}
                <h1 className={`font-heading font-bold text-navy ${compactHeader ? 'mt-1.5 text-[1.3rem] md:text-[1.45rem]' : 'mt-3 text-[1.65rem] md:text-[1.85rem]'}`.trim()}>{title}</h1>
                {description ? (
                  <p className={`${compactHeader ? 'mt-0.5 text-[0.86rem] leading-5' : 'mt-1.5 text-sm leading-6'} text-slate-600`.trim()}>{description}</p>
                ) : null}
              </div>

              <div className={balancedPanels ? (lockBalancedHeight ? 'flex min-h-0 flex-1 flex-col' : 'flex flex-1 flex-col') : ''}>
                {children}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default AuthPageShell;
