import { useEffect, useMemo, useState } from 'react';
import { getCampuses } from '../services/campusesApi';

const useCampuses = () => {
  const [campuses, setCampuses] = useState([]);
  const [summary, setSummary] = useState({});
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

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
    return campuses.filter((campus) => {
      const search = String(filters.search || '').toLowerCase();
      const matchesSearch = !search || [campus.name, campus.city, campus.state, campus.affiliation, campus.id].some((value) => String(value || '').toLowerCase().includes(search));
      const matchesStatus = !filters.status || campus.status === filters.status;
      return matchesSearch && matchesStatus;
    });
  }, [campuses, filters]);

  return { campuses, summary, filteredCampuses, filters, setFilters, loading, error, isDemo };
};

export default useCampuses;
