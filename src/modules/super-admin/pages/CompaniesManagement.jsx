import { useEffect, useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import CompaniesTable from '../components/CompaniesTable';
import DashboardStatsCards from '../components/DashboardStatsCards';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import useCompanies from '../hooks/useCompanies';

const PAGE_SIZE = 8;

const CompaniesManagement = () => {
  const { companies, filteredCompanies, filters, setFilters, loading, error, isDemo } = useCompanies();
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.status]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE));
  const paginatedCompanies = useMemo(
    () => filteredCompanies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredCompanies, page]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const cards = useMemo(() => [
    { label: 'Total Companies', value: String(companies.length), helper: `${companies.filter((item) => item.status === 'active').length} active accounts`, tone: 'info' },
    { label: 'Warning Health', value: String(companies.filter((item) => item.health === 'warning').length), helper: 'Needs billing or onboarding attention', tone: 'warning' },
    { label: 'Degraded', value: String(companies.filter((item) => item.health === 'degraded').length), helper: 'Low usage or unresolved issues', tone: 'danger' },
    { label: 'Hiring Volume', value: String(companies.reduce((sum, item) => sum + item.jobs, 0)), helper: 'Total live and managed openings', tone: 'success' }
  ], [companies]);

  return (
    <div className="module-page module-page--admin">
      <AdminHeader title="Companies Management" subtitle="Review employer account health, billing plans, usage depth, and platform access across all companies." />
      {isDemo ? <p className="module-note">Demo company data is shown because super admin company endpoints are not connected yet.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <DashboardStatsCards cards={cards} />
      <section className="panel-card">
        <FilterBar
          filters={filters}
          onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
          fields={[{ key: 'status', label: 'Status', options: ['active', 'pending', 'inactive'].map((status) => ({ value: status, label: status })) }]}
        />
        {loading ? <p className="module-note">Loading companies...</p> : null}
        <CompaniesTable rows={paginatedCompanies} />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>
    </div>
  );
};

export default CompaniesManagement;
