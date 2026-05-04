import { FiCheckCircle } from 'react-icons/fi';
import AnimatedSection from '../../../../shared/components/AnimatedSection';

const formatHeading = (heading) => String(heading || '').replace(/^\s*\d+\.\s*/, '');

const FooterInfoSectionCard = ({ section, delay = 0 }) => {
  return (
    <AnimatedSection delay={delay}>
      <article className="border-b border-slate-200 pb-7">
        {section.image ? (
          <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200">
            <img
              src={section.image}
              alt={section.imageAlt || section.heading || 'Section cover'}
              className="h-56 w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}
        {section.tag || section.readTime ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {section.tag ? (
              <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">
                {section.tag}
              </span>
            ) : null}
            {section.readTime ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {section.readTime}
              </span>
            ) : null}
          </div>
        ) : null}
        <h3 className="font-heading text-[1.85rem] font-bold leading-tight text-navy">{formatHeading(section.heading)}</h3>
        {section.body ? <p className="mt-3 text-[15px] leading-8 text-slate-600">{section.body}</p> : null}
        {Array.isArray(section.items) && section.items.length > 0 ? (
          <div className="mt-5 grid gap-2.5">
            {section.items.map((item) => (
              <div key={item} className="flex items-start gap-3 px-0.5 py-1.5">
                <FiCheckCircle className="mt-1 shrink-0 text-brand-600" size={16} />
                <p className="text-[15px] leading-7 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        ) : null}
      </article>
    </AnimatedSection>
  );
};

export default FooterInfoSectionCard;
