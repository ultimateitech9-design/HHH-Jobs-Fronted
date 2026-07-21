import { isValidElement } from 'react';

const renderIcon = (icon) => {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  const Icon = icon;
  return <Icon aria-hidden="true" className="h-4 w-4" />;
};

const DashboardFocusNav = ({
  items,
  activeKey,
  onChange,
  label = 'Dashboard views',
  title = 'Workspace'
}) => {
  const activeItem = items.find((item) => item.key === activeKey) || items[0];

  return (
    <nav className="dashboard-focus-nav" aria-label={label}>
      <div className="dashboard-focus-nav__label">{title}</div>
      <div className="dashboard-focus-nav__scroller">
        <div className="dashboard-focus-nav__tabs" role="tablist" aria-label={label}>
          {items.map((item) => {
            const selected = item.key === activeKey;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`dashboard-view-${item.key}`}
                id={`dashboard-tab-${item.key}`}
                onClick={() => onChange(item.key)}
                className={`dashboard-focus-nav__tab${selected ? ' is-active' : ''}`}
              >
                {renderIcon(item.icon)}
                <span>{item.label}</span>
                {item.count !== undefined && item.count !== null ? (
                  <span className="dashboard-focus-nav__count">
                    {Number(item.count || 0).toLocaleString('en-IN')}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      {activeItem?.description ? (
        <p className="dashboard-focus-nav__description">
          {activeItem.description}
        </p>
      ) : null}
    </nav>
  );
};

export default DashboardFocusNav;
