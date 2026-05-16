import { useEffect, useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import CampusesTable from '../components/CampusesTable';
import DashboardStatsCards from '../components/DashboardStatsCards';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import useCampuses from '../hooks/useCampuses';

const PAGE_SIZE = 8;

const CampusesManagement = () => {
  const { campuses, summary, filteredCampuses, filters, setFilters, loading, error, isDemo } = useCampuses();
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.status]);

  const totalPages = Math.max(1, Math.ceil(filteredCampuses.length / PAGE_SIZE));
  const paginatedCampuses = useMemo(
    () => filteredCampuses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredCampuses, page]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const cards = useMemo(() => [
    { label: 'Total Campuses', value: String(summary.totalCampuses || campuses.length || 0), helper: 'Registered campus partners', tone: 'info' },
    { label: 'Connected Campuses', value: String(summary.connectedCampuses || campuses.filter((campus) => campus.connectedCompanies > 0).length), helper: 'Accepted company relationships', tone: 'success' },
    { label: 'Active Campuses', value: String(summary.activeCampuses || campuses.filter((campus) => campus.status === 'active').length), helper: 'Operational campus accounts', tone: 'warning' },
    { label: 'Talent Pool', value: String(summary.totalTalentPool || campuses.reduce((sum, campus) => sum + Number(campus.totalPool || 0), 0)), helper: 'Students available in campus pools', tone: 'info' },
    { label: 'Placed Students', value: String(summary.placedStudents || campuses.reduce((sum, campus) => sum + Number(campus.placedStudents || 0), 0)), helper: 'Placement outcomes recorded', tone: 'success' },
    { label: 'Live Drives', value: String(summary.liveDrives || campuses.reduce((sum, campus) => sum + Number(campus.activeDrives || 0), 0)), helper: 'Ongoing campus hiring activity', tone: 'warning' }
  ], [campuses, summary]);

  return (
    <div className="module-page module-page--admin">
      <AdminHeader title="Campus Management" subtitle="Track campus partner activation, talent pool depth, campus-company links, and live placement activity." />
      {isDemo ? <p className="module-note">Demo campus data is shown because super admin campus endpoints are not connected yet.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <DashboardStatsCards cards={cards} />
      <section className="panel-card">
        <FilterBar
          filters={filters}
          onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
          fields={[{ key: 'status', label: 'Status', options: ['active', 'pending', 'inactive'].map((status) => ({ value: status, label: status })) }]}
        />
        {loading ? <p className="module-note">Loading campuses...</p> : null}
        <CampusesTable rows={paginatedCampuses} />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>
    </div>
  );
};

export default CampusesManagement;
