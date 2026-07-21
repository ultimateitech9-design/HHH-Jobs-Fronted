import { isValidElement } from 'react';

const renderIcon = (icon) => {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  const Icon = icon;
  return <Icon aria-hidden="true" className="h-[18px] w-[18px]" />;
};

const DashboardFocusNav = ({
  items,
  activeKey,
  onChange,
  label = 'Dashboard views',
  title = 'Workspace'
}) => {
  const activeItem = items.find((item) => item.key === activeKey) || items[0];

  const handleTabKeyDown = (event, itemKey) => {
    const currentIndex = items.findIndex((item) => item.key === itemKey);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % items.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + items.length) % items.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = items.length - 1;
    else return;

    event.preventDefault();
    onChange(items[nextIndex].key);
    event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')?.[nextIndex]?.focus();
  };

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
                tabIndex={selected ? 0 : -1}
                onClick={() => onChange(item.key)}
                onKeyDown={(event) => handleTabKeyDown(event, item.key)}
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
