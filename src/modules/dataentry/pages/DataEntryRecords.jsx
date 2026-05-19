import { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../../../shared/components/SectionHeader';
import StatCard from '../../../shared/components/StatCard';
import Pagination from '../../../shared/components/Pagination';
import { getDataEntryPortalRecords } from '../services/dataentryApi';

const RECORDS_PAGE_SIZE = 10;

const emptyState = {
  summary: {
    totalJobs: 0,
    totalCandidates: 0,
    totalCompanies: 0,
    totalNotifications: 0
  },
  jobs: [],
  candidates: [],
  companies: [],
  notifications: [],
  queue: {
    drafts: [],
    pending: [],
    approved: [],
    rejected: []
  }
};

const getTotalPages = (items) => Math.max(1, Math.ceil((items?.length || 0) / RECORDS_PAGE_SIZE));
const getPaginatedItems = (items = [], page = 1) => (
  items.slice((page - 1) * RECORDS_PAGE_SIZE, page * RECORDS_PAGE_SIZE)
);

const DataEntryRecords = () => {
  const [state, setState] = useState({
    loading: true,
    error: '',
    records: emptyState,
    isDemo: false
  });
  const [pages, setPages] = useState({
    jobs: 1,
    candidates: 1,
    companies: 1,
    notifications: 1
  });

  const setPage = (key, value) => {
    setPages((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    let mounted = true;

    const loadRecords = async () => {
      const response = await getDataEntryPortalRecords();
      if (!mounted) return;

      setState({
        loading: false,
        error: response.error || '',
        records: { ...emptyState, ...(response.data || {}) },
        isDemo: Boolean(response.isDemo)
      });
      setPages({
        jobs: 1,
        candidates: 1,
        companies: 1,
        notifications: 1
      });
    };

    loadRecords();

    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(() => ([
    { label: 'Portal Jobs', value: String(state.records.summary?.totalJobs || 0), helper: 'Jobs visible in data entry records', tone: 'info' },
    { label: 'Candidate Records', value: String(state.records.summary?.totalCandidates || 0), helper: 'Candidate profiles linked to entries', tone: 'success' },
    { label: 'Company Records', value: String(state.records.summary?.totalCompanies || 0), helper: 'Companies visible in portal data', tone: 'default' },
    { label: 'Notifications', value: String(state.records.summary?.totalNotifications || 0), helper: 'Alerts and record updates', tone: 'warning' }
  ]), [state.records]);

  const pageData = useMemo(() => ({
    jobs: {
      items: getPaginatedItems(state.records.jobs, pages.jobs),
      totalPages: getTotalPages(state.records.jobs)
    },
    candidates: {
      items: getPaginatedItems(state.records.candidates, pages.candidates),
      totalPages: getTotalPages(state.records.candidates)
    },
    companies: {
      items: getPaginatedItems(state.records.companies, pages.companies),
      totalPages: getTotalPages(state.records.companies)
    },
    notifications: {
      items: getPaginatedItems(state.records.notifications, pages.notifications),
      totalPages: getTotalPages(state.records.notifications)
    }
  }), [pages, state.records]);

  useEffect(() => {
    setPages((current) => ({
      jobs: Math.min(current.jobs, pageData.jobs.totalPages),
      candidates: Math.min(current.candidates, pageData.candidates.totalPages),
      companies: Math.min(current.companies, pageData.companies.totalPages),
      notifications: Math.min(current.notifications, pageData.notifications.totalPages)
    }));
  }, [
    pageData.jobs.totalPages,
    pageData.candidates.totalPages,
    pageData.companies.totalPages,
    pageData.notifications.totalPages
  ]);

  return (
    <div className="module-page module-page--dataentry">
      <SectionHeader
        eyebrow="Portal Records"
        title="HHH Jobs Portal Data Records"
        subtitle="View the jobs, candidates, companies, queue status, and notifications that are available to the data entry team."
      />

      {state.isDemo ? <p className="module-note">Demo portal data is being shown because the records endpoint is not connected yet.</p> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}

      <div className="stats-grid">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {state.loading ? <p className="module-note">Loading portal records...</p> : null}

      {!state.loading ? (
        <>
          <div className="dash-grid-2">
            <section className="panel-card">
              <SectionHeader
                eyebrow="Job Records"
                title="Portal Jobs"
                subtitle="Jobs currently visible inside the data entry workflow."
              />
              <ul className="dash-feed">
                {pageData.jobs.items.map((job) => (
                  <li key={job.id}>
                    <div>
                      <strong>{job.title}</strong>
                      <p>{job.companyName} · {job.location}</p>
                      <span>{job.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination page={pages.jobs} totalPages={pageData.jobs.totalPages} onChange={(page) => setPage('jobs', page)} />
            </section>

            <section className="panel-card">
              <SectionHeader
                eyebrow="Candidate Records"
                title="Portal Candidates"
                subtitle="Candidate profiles attached to posted jobs."
              />
              <ul className="dash-feed">
                {pageData.candidates.items.map((candidate) => (
                  <li key={candidate.id}>
                    <div>
                      <strong>{candidate.name}</strong>
                      <p>{candidate.jobTitle} · {candidate.companyName}</p>
                      <span>{candidate.id}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination page={pages.candidates} totalPages={pageData.candidates.totalPages} onChange={(page) => setPage('candidates', page)} />
            </section>
          </div>

          <div className="dash-grid-2">
            <section className="panel-card">
              <SectionHeader
                eyebrow="Company Records"
                title="Portal Companies"
                subtitle="Companies currently appearing in data entry records."
              />
              <ul className="dash-feed">
                {pageData.companies.items.map((company) => (
                  <li key={company.id}>
                    <div>
                      <strong>{company.companyName}</strong>
                      <p>{company.location} · {company.totalEntries} linked records</p>
                      <span>{company.latestStatus}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination page={pages.companies} totalPages={pageData.companies.totalPages} onChange={(page) => setPage('companies', page)} />
            </section>

            <section className="panel-card">
              <SectionHeader
                eyebrow="Queue Snapshot"
                title="Record Status Queues"
                subtitle="Current draft, pending, approved, and rejected record counts."
              />
              <div className="stats-grid">
                <StatCard label="Draft Jobs" value={String(state.records.queue?.drafts?.length || 0)} helper="Saved but not submitted" tone="default" />
                <StatCard label="Pending" value={String(state.records.queue?.pending?.length || 0)} helper="Awaiting review" tone="warning" />
                <StatCard label="Approved" value={String(state.records.queue?.approved?.length || 0)} helper="Ready on portal" tone="success" />
                <StatCard label="Rejected" value={String(state.records.queue?.rejected?.length || 0)} helper="Needs correction" tone="danger" />
              </div>
            </section>
          </div>

          <section className="panel-card">
            <SectionHeader
              eyebrow="Notifications"
              title="Portal Alerts"
              subtitle="Recent notifications related to records and quality checks."
            />
            <ul className="dash-feed">
              {pageData.notifications.items.map((notification) => (
                <li key={notification.id}>
                  <div>
                    <strong>{notification.title}</strong>
                    <p>{notification.message}</p>
                    <span>{notification.status}</span>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={pages.notifications} totalPages={pageData.notifications.totalPages} onChange={(page) => setPage('notifications', page)} />
          </section>
        </>
      ) : null}
    </div>
  );
};

export default DataEntryRecords;
