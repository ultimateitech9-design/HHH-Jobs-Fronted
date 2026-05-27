import { useEffect, useMemo, useState } from 'react';
import { getTickets } from '../services/ticketApi';
import { filterTickets } from '../utils/ticketHelpers';

const initialFilters = {
  search: '',
  status: '',
  priority: '',
  category: '',
  department: ''
};

const useTickets = (defaultFilters = {}) => {
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState(() => ({ ...initialFilters, ...defaultFilters }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await getTickets();
      setTickets(response.data || []);
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };

    load();
  }, []);

  const filteredTickets = useMemo(() => filterTickets(tickets, filters), [tickets, filters]);

  return {
    tickets,
    filteredTickets,
    filters,
    setFilters,
    loading,
    error,
    isDemo
  };
};

export default useTickets;
