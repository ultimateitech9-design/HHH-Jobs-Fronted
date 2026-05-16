import { useEffect, useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import ConfirmModal from '../components/ConfirmModal';
import DashboardStatsCards from '../components/DashboardStatsCards';
import FilterBar from '../components/FilterBar';
import JobsTable from '../components/JobsTable';
import Pagination from '../components/Pagination';
import useJobs from '../hooks/useJobs';
import { updateJobStatus } from '../services/jobsApi';

const PAGE_SIZE = 10;

const JobsManagement = () => {
  const { jobs, setJobs, filteredJobs, filters, setFilters, loading, error, isDemo } = useJobs();
  const [targetJob, setTargetJob] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.status]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const paginatedJobs = useMemo(
    () => filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredJobs, page]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const cards = useMemo(() => [
    { label: 'Live Jobs', value: String(jobs.filter((job) => job.status === 'open').length), helper: 'Visible in the marketplace', tone: 'success' },
    { label: 'Pending Review', value: String(jobs.filter((job) => job.approvalStatus === 'pending').length), helper: 'Compliance or payment hold', tone: 'warning' },
    { label: 'Closed', value: String(jobs.filter((job) => job.status === 'closed').length), helper: 'No longer accepting applications', tone: 'danger' },
    { label: 'Applications', value: String(jobs.reduce((sum, job) => sum + job.applications, 0)), helper: 'Pipeline across listed jobs', tone: 'info' }
  ], [jobs]);

  const handleToggleStatus = async () => {
    if (!targetJob) return;
    const nextStatus = targetJob.status === 'open' ? 'closed' : 'open';
    const updated = await updateJobStatus(targetJob.id, nextStatus);
    setJobs((current) => current.map((job) => (job.id === targetJob.id ? { ...job, ...updated, status: nextStatus } : job)));
    setTargetJob(null);
  };

  return (
    <div className="module-page module-page--admin">
      <AdminHeader title="Jobs Management" subtitle="Moderate publishing state, freeze risky listings, and keep job quality aligned with portal policy." />
      {isDemo ? <p className="module-note">Demo job data is shown because super admin job endpoints are not connected yet.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <DashboardStatsCards cards={cards} />
      <section className="panel-card">
        <FilterBar
          filters={filters}
          onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
          fields={[{ key: 'status', label: 'Status', options: ['open', 'pending', 'closed', 'approved', 'rejected'].map((status) => ({ value: status, label: status })) }]}
        />
        {loading ? <p className="module-note">Loading jobs...</p> : null}
        <JobsTable rows={paginatedJobs} />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>
      <ConfirmModal
        open={Boolean(targetJob)}
        title="Change job status"
        message={targetJob ? `Set ${targetJob.title} to ${targetJob.status === 'open' ? 'closed' : 'open'}?` : ''}
        confirmLabel="Apply job action"
        onConfirm={handleToggleStatus}
        onClose={() => setTargetJob(null)}
      />
    </div>
  );
};

export default JobsManagement;
