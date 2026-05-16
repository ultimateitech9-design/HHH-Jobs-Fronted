import { useEffect, useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import ApplicationsTable from '../components/ApplicationsTable';
import DashboardStatsCards from '../components/DashboardStatsCards';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import useApplications from '../hooks/useApplications';

const PAGE_SIZE = 10;

const ApplicationsManagement = () => {
  const { applications, filteredApplications, filters, setFilters, loading, error, isDemo } = useApplications();
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.stage]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
  const paginatedApplications = useMemo(
    () => filteredApplications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredApplications, page]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const cards = useMemo(() => [
    { label: 'Total Applications', value: String(applications.length), helper: `${applications.filter((item) => item.stage === 'interview').length} in interview`, tone: 'info' },
    { label: 'Selected', value: String(applications.filter((item) => item.stage === 'selected').length), helper: 'Successful closures', tone: 'success' },
    { label: 'Rejected', value: String(applications.filter((item) => item.stage === 'rejected').length), helper: 'Candidate exits from workflow', tone: 'default' },
    { label: 'Avg Score', value: String(Math.round(applications.reduce((sum, item) => sum + item.score, 0) / Math.max(applications.length, 1))), helper: 'Screening quality signal', tone: 'warning' }
  ], [applications]);

  return (
    <div className="module-page module-page--admin">
      <AdminHeader title="Applications Management" subtitle="Track candidate progression, conversion quality, and cross-company hiring pipeline performance." />
      {isDemo ? <p className="module-note">Demo application data is shown because super admin application endpoints are not connected yet.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <DashboardStatsCards cards={cards} />
      <section className="panel-card">
        <FilterBar
          filters={filters}
          onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
          fields={[{ key: 'stage', label: 'Stage', options: ['shortlisted', 'interview', 'selected', 'rejected'].map((stage) => ({ value: stage, label: stage })) }]}
        />
        {loading ? <p className="module-note">Loading applications...</p> : null}
        <ApplicationsTable rows={paginatedApplications} />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>
    </div>
  );
};

export default ApplicationsManagement;
