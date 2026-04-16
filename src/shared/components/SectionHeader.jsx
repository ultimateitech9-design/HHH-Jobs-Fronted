const SectionHeader = ({ eyebrow, title, subtitle, action }) => {
  return (
    <div className="mb-4 flex flex-col gap-2.5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700 md:text-[11px] md:tracking-[0.22em]">{eyebrow}</p>
        ) : null}
        <h2 className="break-words font-heading text-[1.15rem] font-extrabold leading-tight text-navy md:text-[1.35rem]">{title}</h2>
        {subtitle ? <p className="mt-1.5 max-w-3xl text-[13px] leading-4.5 text-slate-500 md:text-sm md:leading-5">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0 md:max-w-fit">{action}</div> : null}
    </div>
  );
};

export default SectionHeader;
