import StatCard from '../../../shared/components/StatCard';

const DashboardStatsCards = ({ cards = [], className = '' }) => {
  return (
    <div className={`stats-grid ${className}`.trim()}>
      {cards.map((card) => <StatCard key={card.label} {...card} />)}
    </div>
  );
};

export default DashboardStatsCards;
