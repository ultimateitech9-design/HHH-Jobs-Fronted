import AnimatedSection from '../../../../shared/components/AnimatedSection';

const PublicSectionHeader = ({
  eyebrow,
  title,
  description,
  centered = false,
  className = '',
  compact = false
}) => {
  return (
    <AnimatedSection className={className}>
      <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
        {eyebrow ? (
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-700">{eyebrow}</p>
        ) : null}
        <h2
          className={`mt-3 font-heading font-extrabold text-navy ${
            compact ? 'text-2xl md:text-[2rem]' : 'text-3xl md:text-4xl'
          }`}
        >
          {title}
        </h2>
        {description ? (
          <p className={`text-slate-600 ${compact ? 'mt-3 text-sm leading-6' : 'mt-4 text-base leading-8'}`}>
            {description}
          </p>
        ) : null}
      </div>
    </AnimatedSection>
  );
};

export default PublicSectionHeader;
