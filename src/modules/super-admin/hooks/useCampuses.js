import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { getCampuses } from '../services/campusesApi';
import rankedSearch from '../../../shared/utils/rankedSearch';

const useCampuses = () => {
  const [campuses, setCampuses] = useState([]);
  const [summary, setSummary] = useState({});
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const deferredSearch = useDeferredValue(String(filters.search || '').trim());

  useEffect(() => {
    const load = async () => {
      const response = await getCampuses();
      setCampuses(response.data || []);
      setSummary(response.summary || {});
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };

    load();
  }, []);

  const filteredCampuses = useMemo(() => {
    const statusFiltered = campuses.filter((campus) => {
      const matchesStatus = !filters.status || campus.status === filters.status;
      return matchesStatus;
    });

    if (!deferredSearch) {
      return statusFiltered;
    }

    return rankedSearch(statusFiltered, deferredSearch, ['name', 'city', 'state', 'affiliation', 'id']);
  }, [campuses, filters.status, deferredSearch]);

  return { campuses, summary, filteredCampuses, filters, setFilters, loading, error, isDemo };
};

export default useCampuses;
