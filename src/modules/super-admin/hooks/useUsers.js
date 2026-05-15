import { useEffect, useMemo, useState } from 'react';
import { getUsers } from '../services/usersApi';

const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

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
    return users.filter((user) => {
      const search = String(filters.search || '').toLowerCase();
      const matchesSearch = !search || [user.name, user.email, user.company, user.id, user.displayId].some((value) => String(value || '').toLowerCase().includes(search));
      const matchesRole = !filters.role || user.role === filters.role;
      const matchesStatus = !filters.status || user.status === filters.status;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, filters]);

  return { users, setUsers, filteredUsers, filters, setFilters, loading, error, isDemo };
};

export default useUsers;
