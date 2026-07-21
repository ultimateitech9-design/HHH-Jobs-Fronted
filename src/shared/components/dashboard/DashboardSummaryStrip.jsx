import { isValidElement } from 'react';
import { Link } from 'react-router-dom';

const renderIcon = (icon) => {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  const Icon = icon;
  return <Icon aria-hidden="true" />;
};

const SummaryItem = ({ item }) => {
  const content = (
    <>
      {item.icon ? <span className="dashboard-summary-strip__icon">{renderIcon(item.icon)}</span> : null}
      <span className="dashboard-summary-strip__copy">
        <strong>{item.value}</strong>
        <span>{item.label}</span>
        {item.helper ? <small>{item.helper}</small> : null}
      </span>
    </>
  );

  if (item.to) {
    return (
      <Link to={item.to} className="dashboard-summary-strip__item dashboard-summary-strip__item--link">
        {content}
      </Link>
    );
  }

  return <div className="dashboard-summary-strip__item">{content}</div>;
};

const DashboardSummaryStrip = ({ items = [], loading = false, label = 'Dashboard summary', className = '' }) => (
  <section
    className={`dashboard-summary-strip ${className}`.trim()}
    aria-label={label}
    aria-busy={loading}
    style={{ '--dashboard-summary-columns': Math.min(Math.max(items.length, 1), 4) }}
  >
    {items.map((item) => (
      <SummaryItem
        key={item.key || item.label}
        item={{ ...item, value: loading ? '--' : item.value }}
      />
    ))}
  </section>
);

export default DashboardSummaryStrip;
