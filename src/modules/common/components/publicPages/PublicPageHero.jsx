import { Link } from 'react-router-dom';
import AnimatedSection from '../../../../shared/components/AnimatedSection';

const buttonClassByVariant = {
  primary: 'gradient-gold text-primary shadow-lg shadow-gold/20',
  secondary: 'border border-white/18 bg-white/10 text-white backdrop-blur-sm hover:bg-white/16',
  ghost: 'border border-slate-200 bg-white text-navy hover:bg-slate-50'
};

const PublicPageHero = ({
  eyebrow,
  title,
  description,
  actions = [],
  chips = [],
  metrics = [],
  media,
  aside,
  className = '',
  contentClassName = '',
  eyebrowClassName = '',
  titleClassName = '',
  descriptionClassName = '',
  actionsClassName = '',
  actionClassName = '',
  compact = false,
  tightTop = false
}) => {
  const hasVisual = Boolean(aside || media);

  return (
    <section
      className={`relative overflow-hidden px-4 ${
        compact
          ? 'py-8 sm:py-10 md:py-12'
          : tightTop
            ? 'pt-2 pb-12 sm:pt-3 sm:pb-14 md:pt-4 md:pb-18'
            : 'py-12 sm:py-14 md:py-20'
      } ${className}`.trim()}
    >
      <div className="absolute left-8 top-10 h-72 w-72 rounded-full bg-gold/8 blur-3xl" />
      <div className="absolute bottom-0 right-8 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" />

      <div className="container relative z-10 mx-auto max-w-7xl">
        <div
          className={`grid items-center ${
            hasVisual ? 'lg:grid-cols-[1.05fr_0.95fr]' : 'grid-cols-1'
          } ${
            compact ? 'gap-6 lg:gap-7' : 'gap-8 lg:gap-10'
          }`}
        >
          <AnimatedSection>
            <div className={`${hasVisual ? 'max-w-3xl' : 'max-w-4xl'} ${contentClassName}`.trim()}>
              {eyebrow ? (
                <span
                  className={`inline-flex items-center rounded-full border border-gold/20 bg-gold/10 font-semibold text-gold-dark ${
                    compact ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'
                  } ${eyebrowClassName}`.trim()}
                >
                  {eyebrow}
                </span>
              ) : null}

              <div className={compact ? 'mt-4' : 'mt-6'}>
                <h1
                  className={`font-heading font-extrabold leading-tight text-navy ${
                    compact ? 'text-2xl sm:text-3xl md:text-[2.7rem]' : 'text-3xl sm:text-4xl md:text-5xl'
                  } ${titleClassName}`.trim()}
                >
                  {title}
                </h1>
                {description ? (
                  <p
                    className={`max-w-2xl text-slate-600 ${
                      compact
                        ? 'mt-3 text-sm leading-6 sm:text-[0.96rem]'
                        : 'mt-4 text-sm leading-7 sm:text-base md:mt-5 md:text-lg'
                    } ${descriptionClassName}`.trim()}
                  >
                    {description}
                  </p>
                ) : null}
              </div>

              {chips.length > 0 ? (
                <div className={`flex flex-wrap gap-2 ${compact ? 'mt-4' : 'mt-6'}`}>
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className={`rounded-full border border-slate-200 bg-white/85 font-semibold text-slate-600 shadow-sm ${
                        compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1 text-xs'
                      }`}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}

              {actions.length > 0 ? (
                <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap ${compact ? 'mt-5' : 'mt-7'} ${actionsClassName}`.trim()}>
                  {actions.map((action) => (
                    <Link
                      key={`${action.label}-${action.to || action.href}`}
                      to={action.to}
                      className={`inline-flex w-full items-center justify-center rounded-full font-semibold transition-all hover:-translate-y-0.5 sm:w-auto ${
                        compact ? 'px-4 py-2.5 text-sm' : 'px-5 py-3 text-sm'
                      } ${
                        buttonClassByVariant[action.variant || 'primary']
                      } ${actionClassName}`.trim()}
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.12}>
            {aside ? (
              aside
            ) : media ? (
              <div className="relative mx-auto w-full max-w-[34rem] lg:max-w-none">
                <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-gold/20 via-brand-500/10 to-transparent blur-xl" />
                <img
                  src={media.src}
                  alt={media.alt}
                  className="relative z-10 w-full rounded-[2rem] border border-white/60 object-cover shadow-2xl"
                />
              </div>
            ) : null}
          </AnimatedSection>
        </div>

        {metrics.length > 0 ? (
          <AnimatedSection delay={0.18} className={compact ? 'mt-7' : 'mt-10'}>
            <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${compact ? 'xl:gap-3.5' : ''}`}>
              {metrics.map((metric) => (
                <article
                  key={metric.label}
                  className={`rounded-[1.6rem] border border-slate-200 bg-white/88 shadow-sm backdrop-blur-sm ${
                    compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'
                  }`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    {metric.label}
                  </p>
                  <p className={`font-heading font-extrabold text-navy ${compact ? 'mt-2.5 text-[1.7rem]' : 'mt-3 text-3xl'}`}>
                    {metric.value}
                  </p>
                  {metric.helper ? (
                    <p className={`text-slate-500 ${compact ? 'mt-1.5 text-[13px] leading-5' : 'mt-2 text-sm leading-6'}`}>
                      {metric.helper}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </AnimatedSection>
        ) : null}
      </div>
    </section>
  );
};

export default PublicPageHero;
