import { Link } from 'react-router-dom';
import AnimatedSection from '../../../../shared/components/AnimatedSection';

const PublicFeatureCard = ({
  icon: Icon,
  title,
  description,
  badge,
  meta,
  to,
  ctaLabel,
  delay = 0
}) => {
  const content = (
    <div className="group h-full rounded-[2rem] border border-slate-200/60 bg-white/60 p-7 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg sm:p-8">
      {Icon ? (
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-brand-50 group-hover:text-brand-700">
          <Icon size={22} />
        </div>
      ) : null}

      <h3 className="mt-2 font-heading text-xl font-bold text-navy transition-colors group-hover:text-brand-700">{title}</h3>
      {description ? (
        <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
      ) : null}
      {meta ? <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{meta}</p> : null}
      {ctaLabel ? (
        <span className="mt-6 inline-flex items-center text-sm font-semibold text-brand-700">
          {ctaLabel}
        </span>
      ) : null}
    </div>
  );

  return (
    <AnimatedSection delay={delay}>
      {to ? <Link to={to}>{content}</Link> : content}
    </AnimatedSection>
  );
};

export default PublicFeatureCard;
