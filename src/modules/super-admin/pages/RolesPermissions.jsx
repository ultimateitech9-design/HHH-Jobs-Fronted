import { useEffect, useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import DashboardStatsCards from '../components/DashboardStatsCards';
import { PERMISSIONS } from '../constants/permissions';
import { USER_ROLE_LABELS } from '../constants/userRoles';
import { getRolesPermissions, saveRolesPermissions } from '../services/settingsApi';
import { describePermission } from '../utils/permissionHelpers';

const RolesPermissions = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await getRolesPermissions();
      const nextRoles = response.data || [];
      setRoles(nextRoles);
      setSelectedRole(nextRoles[0]?.role || '');
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };
    load();
  }, []);

  const activeRole = useMemo(() => roles.find((role) => role.role === selectedRole) || roles[0] || { permissions: [] }, [roles, selectedRole]);

  const cards = useMemo(() => [
    { label: 'Configured Roles', value: String(roles.length), helper: 'Permission bundles currently defined', tone: 'info' },
    { label: 'Permission Keys', value: String(PERMISSIONS.length), helper: 'Platform capabilities under control', tone: 'success' },
    { label: 'Active Role', value: USER_ROLE_LABELS[activeRole.role] || activeRole.role || '-', helper: 'Role currently being edited', tone: 'default' },
    { label: 'Assigned Permissions', value: String(activeRole.permissions?.length || 0), helper: 'Capabilities granted to selected role', tone: 'warning' }
  ], [roles, activeRole]);

  const togglePermission = (permission) => {
    setRoles((current) => current.map((role) => {
      if (role.role !== activeRole.role) return role;
      const exists = role.permissions.includes(permission);
      return { ...role, permissions: exists ? role.permissions.filter((item) => item !== permission) : [...role.permissions, permission] };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const saved = await saveRolesPermissions(roles);
    setRoles(saved);
    setSaving(false);
  };

  return (
    <div className="module-page module-page--admin">
      <AdminHeader title="Roles & Permissions" subtitle="Configure access rights across all modules." />
      {isDemo ? <p className="module-note">Demo data is shown.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <DashboardStatsCards cards={cards} />
      <section className="panel-card">
        <div className="student-inline-controls">
          <label>
            Role
            <select value={activeRole.role || ''} onChange={(event) => setSelectedRole(event.target.value)}>
              {roles.map((role) => <option key={role.role} value={role.role}>{USER_ROLE_LABELS[role.role] || role.role}</option>)}
            </select>
          </label>
          <div className="student-job-actions">
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save permissions'}</button>
          </div>
        </div>
        {loading ? <p className="module-note">Loading role configuration...</p> : null}
        {!loading ? (
          <div className="split-grid">
            {PERMISSIONS.map((permission) => (
              <label key={permission} className="panel-card">
                <strong>{describePermission(permission)}</strong>
                <span className="module-note">{permission}</span>
                <input type="checkbox" checked={Boolean(activeRole.permissions?.includes(permission))} onChange={() => togglePermission(permission)} />
              </label>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default RolesPermissions;
