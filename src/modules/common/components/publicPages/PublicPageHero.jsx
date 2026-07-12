import { Link } from 'react-router-dom';
import AnimatedSection from '../../../../shared/components/AnimatedSection';

const buttonClassByVariant = {
  primary: 'bg-[#d99b20] text-[#151922] shadow-[0_10px_24px_rgba(185,121,8,0.2)] hover:bg-[#e8b23c]',
  secondary: 'border border-white/18 bg-white/10 text-white backdrop-blur-sm hover:bg-white/16',
  ghost: 'border border-[#ded4c2] bg-[#fffdf9] text-[#151922] hover:border-[#d99b20] hover:bg-brand-50'
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
  visualClassName = '',
  compact = false,
  tightTop = false,
  alignVisualTop = false
}) => {
  const hasVisual = Boolean(aside || media);
  const isMediaHero = Boolean(media && !aside);
  const getButtonClass = (variant = 'primary') => {
    if (isMediaHero && variant === 'ghost') {
      return 'border border-white/35 bg-[#071524]/45 text-white hover:border-[#f2c75f] hover:bg-[#071524]/70';
    }
    return buttonClassByVariant[variant] || buttonClassByVariant.primary;
  };

  return (
    <section
      className={`relative overflow-hidden ${isMediaHero
        ? 'flex min-h-[470px] items-end border-b border-[#d99b20]/40 bg-[#071524] py-12 text-white sm:min-h-[520px] sm:py-14'
        : compact
        ? 'py-8 sm:py-10 md:py-12'
        : tightTop
          ? 'pt-0.5 pb-10 sm:pt-1 sm:pb-12 md:pt-1.5 md:pb-14'
          : 'pt-5 pb-12 sm:pt-6 sm:pb-14 md:pt-7 md:pb-16'
        } ${className}`.trim()}
    >
      {isMediaHero ? (
        <>
          <img
            src={media.src}
            alt={media.alt}
            className="public-cinematic-image absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,21,36,0.96)_0%,rgba(7,21,36,0.82)_48%,rgba(7,21,36,0.54)_100%)]" />
        </>
      ) : null}

      <div className="vw-shell relative z-10 w-full">
        <div
          className={`grid ${alignVisualTop ? 'items-start' : 'items-center'} ${isMediaHero ? 'grid-cols-1' : hasVisual ? 'lg:grid-cols-[1.05fr_0.95fr]' : 'grid-cols-1'
            } ${compact ? 'gap-6 lg:gap-7' : 'gap-8 lg:gap-10'
            }`}
        >
          <AnimatedSection>
            <div className={`${isMediaHero ? 'max-w-3xl' : hasVisual ? 'max-w-3xl' : 'max-w-4xl'} ${contentClassName}`.trim()}>
              {eyebrow ? (
                <span
                  className={`inline-flex items-center border-l-2 border-[#d99b20] font-bold uppercase tracking-[0.14em] ${isMediaHero ? 'text-[#f2c75f]' : 'text-[#14549a]'} ${compact ? 'pl-3 text-xs' : 'pl-3 text-sm'
                    } ${eyebrowClassName}`.trim()}
                >
                  {eyebrow}
                </span>
              ) : null}

              <div className={compact ? 'mt-4' : 'mt-6'}>
                <h1
                  className={`font-heading font-extrabold leading-tight ${isMediaHero ? 'text-white' : 'text-[#151922]'} ${compact ? 'text-2xl sm:text-3xl md:text-[2.7rem]' : 'text-3xl sm:text-4xl md:text-5xl'
                    } ${titleClassName}`.trim()}
                >
                  {title}
                </h1>
                {description ? (
                  <p
                    className={`max-w-2xl ${isMediaHero ? 'text-slate-200' : 'text-slate-600'} ${compact
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
                      className={`rounded-full border font-semibold shadow-sm ${isMediaHero ? 'border-white/25 bg-[#071524]/45 text-slate-100' : 'border-[#ded4c2] bg-[#fffdf9] text-slate-600'} ${compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1 text-xs'
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
                      className={`inline-flex w-full items-center justify-center rounded-md font-semibold transition-all hover:-translate-y-0.5 sm:w-auto ${compact ? 'px-4 py-2.5 text-sm' : 'px-5 py-3 text-sm'
                        } ${getButtonClass(action.variant || 'primary')
                        } ${actionClassName}`.trim()}
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </AnimatedSection>

          {aside ? <AnimatedSection delay={0.12}>
            <div className={visualClassName}>
              {aside}
            </div>
          </AnimatedSection> : null}
        </div>

        {metrics.length > 0 ? (
          <AnimatedSection delay={0.18} className={compact ? 'mt-7' : 'mt-10'}>
            <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${compact ? 'xl:gap-3.5' : ''}`}>
              {metrics.map((metric) => (
                <article
                  key={metric.label}
                  className={`rounded-lg border shadow-sm backdrop-blur-sm ${isMediaHero ? 'border-white/20 bg-[#071524]/45' : 'border-[#e3dacb] bg-[#fffdf9]'} ${compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'
                    }`}
                >
                  <p className={`text-xs font-black uppercase tracking-[0.18em] ${isMediaHero ? 'text-[#f2c75f]' : 'text-slate-400'}`}>
                    {metric.label}
                  </p>
                  <p className={`font-heading font-bold ${isMediaHero ? 'text-white' : 'text-[#151922]'} ${compact ? 'mt-2.5 text-[1.7rem]' : 'mt-3 text-3xl'}`}>
                    {metric.value}
                  </p>
                  {metric.helper ? (
                    <p className={`${isMediaHero ? 'text-slate-300' : 'text-slate-500'} ${compact ? 'mt-1.5 text-[13px] leading-5' : 'mt-2 text-sm leading-6'}`}>
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
