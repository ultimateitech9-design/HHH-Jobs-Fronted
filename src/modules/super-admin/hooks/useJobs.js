import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { getJobs } from '../services/jobsApi';
import rankedSearch from '../../../shared/utils/rankedSearch';

const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const deferredSearch = useDeferredValue(String(filters.search || '').trim());

  useEffect(() => {
    const load = async () => {
      const response = await getJobs();
      setJobs(response.data || []);
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };

    load();
  }, []);

  const filteredJobs = useMemo(() => {
    const statusFiltered = jobs.filter((job) => {
      const matchesStatus = !filters.status || job.status === filters.status || job.approvalStatus === filters.status;
      return matchesStatus;
    });

    if (!deferredSearch) {
      return statusFiltered;
    }

    return rankedSearch(statusFiltered, deferredSearch, ['title', 'company', 'location', 'id']);
  }, [jobs, filters.status, deferredSearch]);

  return { jobs, setJobs, filteredJobs, filters, setFilters, loading, error, isDemo };
};

export default useJobs;
