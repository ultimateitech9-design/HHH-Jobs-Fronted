const DashboardSectionCard = ({
  eyebrow,
  title,
  subtitle,
  action,
  className = '',
  bodyClassName = '',
  children
}) => {
  return (
    <section className={`rounded-[1.2rem] border border-slate-200 bg-white p-4 shadow-sm md:p-4.5 ${className}`.trim()}>
      {(eyebrow || title || subtitle || action) ? (
        <div className="mb-4 flex min-w-0 flex-col gap-2.5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-brand-700">{eyebrow}</p>
            ) : null}
            {title ? <h2 className="break-words font-heading text-[1.12rem] font-bold leading-tight text-navy md:text-[1.28rem]">{title}</h2> : null}
            {subtitle ? <p className="mt-1.5 max-w-3xl text-[13px] leading-4.5 text-slate-500">{subtitle}</p> : null}
          </div>
          {action ? <div className="w-full min-w-0 md:w-auto md:shrink-0">{action}</div> : null}
        </div>
      ) : null}

      <div className={`min-w-0 ${bodyClassName}`.trim()}>{children}</div>
    </section>
  );
};

export default DashboardSectionCard;
