const SectionHeader = ({ eyebrow, title, subtitle, action }) => {
  return (
    <div className="mb-4 flex flex-col gap-0.5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-600">{eyebrow}</p>
        ) : null}
        <h2 className="break-words font-heading text-base font-bold leading-snug text-navy md:text-lg">{title}</h2>
        {subtitle ? <p className="mt-0.5 max-w-2xl text-[12px] leading-relaxed text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0 md:max-w-fit">{action}</div> : null}
    </div>
  );
};

export default SectionHeader;
