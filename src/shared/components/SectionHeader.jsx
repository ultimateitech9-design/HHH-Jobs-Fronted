const SectionHeader = ({ eyebrow, title, subtitle, action }) => {
  return (
    <div className="section-header">
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="section-eyebrow">{eyebrow}</p>
        ) : null}
        <h2 className="section-title break-words font-heading font-bold text-navy">{title}</h2>
        {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0 self-start md:self-end">{action}</div> : null}
    </div>
  );
};

export default SectionHeader;
