import AnimatedSection from '../../../../shared/components/AnimatedSection';

const PublicSectionHeader = ({
  eyebrow,
  title,
  description,
  centered = false,
  className = '',
  compact = false,
  as = 'h2'
}) => {
  const Heading = as;

  return (
    <AnimatedSection className={className}>
      <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
        {eyebrow ? (
          <p className={`text-xs font-black uppercase tracking-[0.18em] text-[#14549a] ${centered ? 'inline-flex border-b-2 border-[#d99b20] pb-1' : 'border-l-2 border-[#d99b20] pl-3'}`}>
            {eyebrow}
          </p>
        ) : null}
        <Heading
          className={`mt-3 font-heading font-extrabold text-[#151922] ${
            compact ? 'text-2xl md:text-[2rem]' : 'text-3xl md:text-4xl'
          }`}
        >
          {title}
        </Heading>
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
