const DashboardSectionCard = ({
  eyebrow,
  title,
  subtitle,
  action,
  className = '',
  bodyClassName = '',
  children,
  ...sectionProps
}) => {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm md:p-4 ${className}`.trim()}
      {...sectionProps}
    >
      {(eyebrow || title || subtitle || action) ? (
        <div className="mb-3.5 flex min-w-0 flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-1 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-brand-700">{eyebrow}</p>
            ) : null}
            {title ? <h2 className="break-words font-heading text-xl font-bold leading-tight text-navy md:text-[1.35rem]">{title}</h2> : null}
            {subtitle ? <p className="mt-1 max-w-3xl text-[0.94rem] font-medium leading-6 text-slate-500">{subtitle}</p> : null}
          </div>
          {action ? <div className="w-full min-w-0 md:w-auto md:shrink-0">{action}</div> : null}
        </div>
      ) : null}

      <div className={`min-w-0 ${bodyClassName}`.trim()}>{children}</div>
    </section>
  );
};

export default DashboardSectionCard;
