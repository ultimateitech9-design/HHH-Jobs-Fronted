import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { getUsers } from '../services/usersApi';

const useUsers = ({ page = 1, pageSize = 10 } = {}) => {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [responseLimit, setResponseLimit] = useState(pageSize);
  const deferredSearch = useDeferredValue(String(filters.search || '').trim());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await getUsers({
        ...filters,
        search: deferredSearch,
        page,
        limit: pageSize
      });
      setUsers(response.data || []);
      setTotalUsers(Number(response.total || response.data?.length || 0));
      setResponseLimit(Number(response.limit || pageSize) || pageSize);
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };

    load();
  }, [deferredSearch, filters.role, filters.status, page, pageSize]);

  useEffect(() => {
    const refreshUsers = async () => {
      const response = await getUsers({
        ...filters,
        search: deferredSearch,
        page,
        limit: pageSize
      });
      setUsers(response.data || []);
      setTotalUsers(Number(response.total || response.data?.length || 0));
      setResponseLimit(Number(response.limit || pageSize) || pageSize);
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
  }, [deferredSearch, filters, page, pageSize]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalUsers / Math.max(1, responseLimit || pageSize))),
    [totalUsers, responseLimit, pageSize]
  );

  return {
    users,
    setUsers,
    filteredUsers: users,
    filters,
    setFilters,
    loading,
    error,
    isDemo,
    totalUsers,
    totalPages
  };
};

export default useUsers;
