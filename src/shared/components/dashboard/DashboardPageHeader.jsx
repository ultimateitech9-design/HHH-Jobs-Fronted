const DashboardPageHeader = ({
  eyebrow,
  title,
  description,
  actions,
  meta = [],
  className = ''
}) => (
  <header className={`dashboard-page-header ${className}`.trim()}>
    <div className="dashboard-page-header__copy">
      {eyebrow ? <p className="dashboard-page-header__eyebrow">{eyebrow}</p> : null}
      <h1 className="dashboard-page-header__title">{title}</h1>
      {description ? <p className="dashboard-page-header__description">{description}</p> : null}
    </div>

    {(actions || meta.length > 0) ? (
      <div className="dashboard-page-header__aside">
        {meta.length > 0 ? (
          <dl className="dashboard-page-header__meta" aria-label={`${title} summary`}>
            {meta.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {actions ? <div className="dashboard-page-header__actions">{actions}</div> : null}
      </div>
    ) : null}
  </header>
);

export default DashboardPageHeader;
