import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { getCompanies } from '../services/companiesApi';
import rankedSearch from '../../../shared/utils/rankedSearch';

const useCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const deferredSearch = useDeferredValue(String(filters.search || '').trim());

  useEffect(() => {
    const load = async () => {
      const response = await getCompanies();
      setCompanies(response.data || []);
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };

    load();
  }, []);

  const filteredCompanies = useMemo(() => {
    const statusFiltered = companies.filter((company) => {
      const matchesStatus = !filters.status || company.status === filters.status;
      return matchesStatus;
    });

    if (!deferredSearch) {
      return statusFiltered;
    }

    return rankedSearch(statusFiltered, deferredSearch, ['name', 'plan', 'owner', 'id']);
  }, [companies, filters.status, deferredSearch]);

  return { companies, filteredCompanies, filters, setFilters, loading, error, isDemo };
};

export default useCompanies;
