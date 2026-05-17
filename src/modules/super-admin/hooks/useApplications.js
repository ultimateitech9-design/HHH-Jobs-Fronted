import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { getApplications } from '../services/applicationsApi';
import rankedSearch from '../../../shared/utils/rankedSearch';

const useApplications = () => {
  const [applications, setApplications] = useState([]);
  const [filters, setFilters] = useState({ search: '', stage: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const deferredSearch = useDeferredValue(String(filters.search || '').trim());

  useEffect(() => {
    const load = async () => {
      const response = await getApplications();
      setApplications(response.data || []);
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };

    load();
  }, []);

  const filteredApplications = useMemo(() => {
    const stageFiltered = applications.filter((application) => {
      const matchesStage = !filters.stage || application.stage === filters.stage;
      return matchesStage;
    });

    if (!deferredSearch) {
      return stageFiltered;
    }

    return rankedSearch(stageFiltered, deferredSearch, ['candidate', 'jobTitle', 'company', 'id']);
  }, [applications, filters.stage, deferredSearch]);

  return { applications, filteredApplications, filters, setFilters, loading, error, isDemo };
};

export default useApplications;
