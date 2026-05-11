import { useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import ConfirmModal from '../components/ConfirmModal';
import DashboardStatsCards from '../components/DashboardStatsCards';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import UsersTable from '../components/UsersTable';
import useUsers from '../hooks/useUsers';
import { USER_ROLES, USER_ROLE_LABELS } from '../constants/userRoles';
import { createAdminUser, deleteUser, updateUserStatus } from '../services/usersApi';

const INITIAL_ADMIN_FORM = {
  name: '',
  email: '',
  company: 'HHH Jobs',
  password: '',
  role: 'admin'
};

const UsersManagement = () => {
  const { users, setUsers, filteredUsers, filters, setFilters, loading, error, isDemo } = useUsers();
  const [page, setPage] = useState(1);
  const [targetUser, setTargetUser] = useState(null);
  const [adminForm, setAdminForm] = useState(INITIAL_ADMIN_FORM);
  const [formError, setFormError] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState(null);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  const cards = useMemo(() => [
    { label: 'Total Users', value: String(users.length), helper: `${users.filter((item) => item.status === 'active').length} active`, tone: 'info' },
    { label: 'Pending Verification', value: String(users.filter((item) => item.status === 'pending').length), helper: 'Requires approval or onboarding review', tone: 'warning' },
    { label: 'Blocked', value: String(users.filter((item) => item.status === 'blocked').length), helper: 'Trust and policy watchlist', tone: 'danger' },
    { label: 'Verified Accounts', value: String(users.filter((item) => item.verified).length), helper: 'Identity checks complete', tone: 'success' }
  ], [users]);

  const handleSuspend = async () => {
    if (!targetUser) return;
    const nextStatus = targetUser.status === 'active' ? 'blocked' : 'active';
    const updated = await updateUserStatus(targetUser.id, nextStatus);
    setUsers((current) => current.map((user) => (user.id === targetUser.id ? { ...user, ...updated, status: nextStatus } : user)));
    setTargetUser(null);
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    const name = adminForm.name.trim();
    const email = adminForm.email.trim().toLowerCase();
    const company = adminForm.company.trim() || 'HHH Jobs';
    const password = String(adminForm.password || '');
    const role = adminForm.role || 'admin';

    if (!name || !email || !password) {
      setFormError('Name, email, and password are required to create a user ID.');
      setFormMessage('');
      return;
    }

    if (!email.includes('@')) {
      setFormError('Enter a valid email address.');
      setFormMessage('');
      return;
    }

    if (users.some((user) => String(user.email).toLowerCase() === email)) {
      setFormError('An account with this email already exists.');
      setFormMessage('');
      return;
    }

    setSavingAdmin(true);
    setFormError('');
    setFormMessage('');

    try {
      const createdUser = await createAdminUser({ name, email, company, password, role });
      setUsers((current) => [{ ...createdUser, role }, ...current]);
      setAdminForm(INITIAL_ADMIN_FORM);
      setFormMessage(`${USER_ROLE_LABELS[role] || 'User'} ID created for ${name}. This email and password can now open the assigned dashboard.`);
      setPage(1);
    } catch (createError) {
      setFormError(createError.message || 'Unable to create user ID.');
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;
    await deleteUser(deletingAdmin.id);
    setUsers((current) => current.filter((user) => user.id !== deletingAdmin.id));
    setFormMessage(`${USER_ROLE_LABELS[deletingAdmin.role] || 'User'} ID ${deletingAdmin.id} deleted.`);
    setDeletingAdmin(null);
  };

  return (
    <div className="module-page module-page--admin min-w-0">
      <AdminHeader title="Users Management" subtitle="Control account lifecycle, role visibility, verification state, and risk response across the portal." />
      {isDemo ? <p className="module-note">Demo user data is shown because super admin user endpoints are not connected yet.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {formMessage ? <p className="module-note">{formMessage}</p> : null}
      <p className="module-note">Super admin can review and remove Admin, HR, Student, and Super Admin IDs from this panel.</p>
      <DashboardStatsCards cards={cards} />
      <section className="panel-card min-w-0">
        <div className="panel-card__header">
          <div>
            <h3>Create User ID</h3>
            <p className="module-note">Super admin can create operational IDs here. The generated email and password will open the assigned dashboard directly.</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={handleCreateAdmin}>
          <label>
            Full Name
            <input
              type="text"
              value={adminForm.name}
              onChange={(event) => setAdminForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Enter full name"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={adminForm.email}
              onChange={(event) => setAdminForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="user@hhh-jobs.com"
            />
          </label>
          <label>
            Password
            <input
              type="text"
              value={adminForm.password}
              onChange={(event) => setAdminForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Create password"
            />
          </label>
          <label>
            Company / Team
            <input
              type="text"
              value={adminForm.company}
              onChange={(event) => setAdminForm((current) => ({ ...current, company: event.target.value }))}
              placeholder="HHH Jobs"
            />
          </label>
          <label>
            Assigned Role
            <select value={adminForm.role} onChange={(event) => setAdminForm((current) => ({ ...current, role: event.target.value }))}>
              <option value="admin">Admin</option>
              <option value="dataentry">Data Entry</option>
              <option value="support">Support</option>
              <option value="accounts">Accounts</option>
              <option value="sales">Sales</option>
            </select>
          </label>
          {formError ? <p className="form-error">{formError}</p> : null}
          <div className="student-job-actions">
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={savingAdmin}>
              {savingAdmin ? 'Creating User...' : `Create ${USER_ROLE_LABELS[adminForm.role] || 'User'} ID`}
            </button>
          </div>
        </form>
      </section>
      <section className="panel-card min-w-0">
        <FilterBar
          filters={filters}
          onChange={(key, value) => { setPage(1); setFilters((current) => ({ ...current, [key]: value })); }}
          fields={[
            { key: 'role', label: 'Role', options: USER_ROLES.map((role) => ({ value: role, label: USER_ROLE_LABELS[role] || role })) },
            { key: 'status', label: 'Status', options: ['active', 'pending', 'blocked'].map((status) => ({ value: status, label: status })) }
          ]}
          actions={(
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setPage(1);
                  setFilters((current) => ({ ...current, role: current.role === 'hr' ? '' : 'hr' }));
                }}
              >
                {filters.role === 'hr' ? 'Show All IDs' : 'Show HR IDs'}
              </button>
              {paginatedUsers[0] ? (
                <button type="button" className="btn-secondary" onClick={() => setTargetUser(paginatedUsers[0])}>
                  Toggle selected user status
                </button>
              ) : null}
            </>
          )}
        />
        {loading ? <p className="module-note">Loading users...</p> : null}
        <UsersTable rows={paginatedUsers} onDelete={setDeletingAdmin} />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>
      <ConfirmModal
        open={Boolean(targetUser)}
        title="Change user status"
        message={targetUser ? `Set ${targetUser.name} to ${targetUser.status === 'active' ? 'blocked' : 'active'}?` : ''}
        confirmLabel="Apply status change"
        onConfirm={handleSuspend}
        onClose={() => setTargetUser(null)}
      />
      <ConfirmModal
        open={Boolean(deletingAdmin)}
        title="Delete user account"
        message={deletingAdmin ? `Delete ${USER_ROLE_LABELS[deletingAdmin.role] || 'user'} ID ${deletingAdmin.id} for ${deletingAdmin.name}? This action removes portal access for that account.` : ''}
        confirmLabel={`Delete ${USER_ROLE_LABELS[deletingAdmin?.role] || 'user'}`}
        onConfirm={handleDeleteAdmin}
        onClose={() => setDeletingAdmin(null)}
      />
    </div>
  );
};

export default UsersManagement;
