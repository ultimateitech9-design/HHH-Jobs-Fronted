import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { getUsers } from '../services/usersApi';
import rankedSearch from '../../../shared/utils/rankedSearch';

const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const deferredSearch = useDeferredValue(String(filters.search || '').trim());

  useEffect(() => {
    const load = async () => {
      const response = await getUsers();
      setUsers(response.data || []);
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };

    load();

    const refreshUsers = async () => {
      const response = await getUsers();
      setUsers(response.data || []);
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };

    window.addEventListener('managed-users-changed', refreshUsers);
    window.addEventListener('storage', refreshUsers);

    return () => {
      window.removeEventListener('managed-users-changed', refreshUsers);
      window.removeEventListener('storage', refreshUsers);
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const roleFiltered = users.filter((user) => {
      const matchesRole = !filters.role || user.role === filters.role;
      const matchesStatus = !filters.status || user.status === filters.status;
      return matchesRole && matchesStatus;
    });

    if (!deferredSearch) {
      return roleFiltered;
    }

    return rankedSearch(roleFiltered, deferredSearch, ['name', 'email', 'company', 'id', 'displayId']);
  }, [users, filters.role, filters.status, deferredSearch]);

  return { users, setUsers, filteredUsers, filters, setFilters, loading, error, isDemo };
};

export default useUsers;
