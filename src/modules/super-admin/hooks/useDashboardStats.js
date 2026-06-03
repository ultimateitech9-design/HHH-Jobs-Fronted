import { useEffect, useState } from 'react';
import { getSuperAdminDashboard } from '../services/reportsApi';

const useDashboardStats = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const response = await getSuperAdminDashboard();
      if (!mounted) return;
      setDashboard(response.data || null);
      setError(response.error || '');
      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return { dashboard, loading, error };
};

export default useDashboardStats;
