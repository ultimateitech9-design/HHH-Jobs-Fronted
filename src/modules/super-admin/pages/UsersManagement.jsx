import { useMemo, useState } from 'react';
import { FiEye, FiEyeOff, FiSearch } from 'react-icons/fi';
import AdminHeader from '../components/AdminHeader';
import ConfirmModal from '../components/ConfirmModal';
import DashboardStatsCards from '../components/DashboardStatsCards';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import UsersTable from '../components/UsersTable';
import useUsers from '../hooks/useUsers';
import { ASSIGNABLE_DASHBOARD_ROLE_OPTIONS, USER_ROLES, USER_ROLE_LABELS } from '../constants/userRoles';
import { createAdminUser, deleteUser, updateUserStatus } from '../services/usersApi';
import { PASSWORD_POLICY_HELPER, getPasswordPolicyError } from '../../../utils/passwordPolicy';

const INITIAL_ADMIN_FORM = {
  name: '',
  email: '',
  company: 'HHH Jobs',
  password: '',
  role: 'admin'
};

const CreateUserForm = ({ existingEmails, onCreate }) => {
  const [adminForm, setAdminForm] = useState(INITIAL_ADMIN_FORM);
  const [formError, setFormError] = useState('');
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordPolicyError = adminForm.password
    ? getPasswordPolicyError(adminForm.password, '')
    : '';
  const passwordPolicyMessage = adminForm.password
    ? (passwordPolicyError || 'Strong password ready to use.')
    : PASSWORD_POLICY_HELPER;

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    const name = adminForm.name.trim();
    const email = adminForm.email.trim().toLowerCase();
    const company = adminForm.company.trim() || 'HHH Jobs';
    const password = String(adminForm.password || '');
    const role = adminForm.role || 'admin';

    if (!name || !email || !password) {
      setFormError('Name, email, and password are required to create a user ID.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Enter a valid email address like user@example.com.');
      return;
    }

    const passwordError = getPasswordPolicyError(password);
    if (passwordError) {
      setFormError(passwordError);
      return;
    }

    if (existingEmails.has(email)) {
      setFormError('An account with this email already exists.');
      return;
    }

    setSavingAdmin(true);
    setFormError('');

    try {
      await onCreate({ name, email, company, password, role });
      setAdminForm(INITIAL_ADMIN_FORM);
    } catch (createError) {
      setFormError(createError.message || 'Unable to create user ID.');
    } finally {
      setSavingAdmin(false);
    }
  };

  return (
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
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={adminForm.password}
            onChange={(event) => {
              setAdminForm((current) => ({ ...current, password: event.target.value }));
              if (formError) setFormError('');
            }}
            placeholder="Create a strong password"
            autoComplete="new-password"
            minLength={8}
            aria-invalid={Boolean(passwordPolicyError)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          </button>
        </div>
        <span className={`text-xs font-semibold ${passwordPolicyError ? 'text-rose-600' : 'text-slate-500'}`}>{passwordPolicyMessage}</span>
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
          {ASSIGNABLE_DASHBOARD_ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
      </label>
      {formError ? <p className="form-error">{formError}</p> : null}
      <div className="student-job-actions">
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={savingAdmin}>
          {savingAdmin ? 'Creating User...' : `Create ${USER_ROLE_LABELS[adminForm.role] || 'User'} ID`}
        </button>
      </div>
    </form>
  );
};

const UsersManagement = () => {
  const { users, setUsers, filteredUsers, filters, setFilters, loading, error, isDemo } = useUsers();
  const [page, setPage] = useState(1);
  const [pendingStatusAction, setPendingStatusAction] = useState(null);
  const [formMessage, setFormMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [statusBusyId, setStatusBusyId] = useState('');
  const [deletingAdmin, setDeletingAdmin] = useState(null);
  const [draftFilters, setDraftFilters] = useState(filters);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(
    () => filteredUsers.slice((page - 1) * pageSize, page * pageSize),
    [filteredUsers, page]
  );

  const cards = useMemo(() => [
    { label: 'Total Users', value: String(users.length), helper: `${users.filter((item) => item.status === 'active').length} active`, tone: 'info' },
    { label: 'Pending Verification', value: String(users.filter((item) => item.status === 'pending').length), helper: 'Requires approval or onboarding review', tone: 'warning' },
    { label: 'Blocked', value: String(users.filter((item) => item.status === 'blocked').length), helper: 'Temporarily restricted', tone: 'danger' },
    { label: 'Banned', value: String(users.filter((item) => item.status === 'banned').length), helper: 'Permanently removed from access', tone: 'danger' },
    { label: 'Verified Accounts', value: String(users.filter((item) => item.verified).length), helper: 'Identity checks complete', tone: 'success' }
  ], [users]);

  const handleCreateAdmin = async ({ name, email, company, password, role }) => {
    setFormMessage('');

    const createdUser = await createAdminUser({ name, email, company, password, role });
    setUsers((current) => [{ ...createdUser, role }, ...current]);
    setFormMessage(`${USER_ROLE_LABELS[role] || 'User'} ID ${(createdUser.displayId || createdUser.id)} created for ${name}. This email and password can now open the assigned dashboard.`);
    setPage(1);
  };

  const existingEmails = useMemo(
    () => new Set(users.map((user) => String(user.email || '').toLowerCase()).filter(Boolean)),
    [users]
  );

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;
    try {
      await deleteUser(deletingAdmin.id);
      setUsers((current) => current.filter((user) => user.id !== deletingAdmin.id));
      setFormMessage(`${USER_ROLE_LABELS[deletingAdmin.role] || 'User'} ID ${(deletingAdmin.displayId || deletingAdmin.id)} deleted.`);
      setActionError('');
      setDeletingAdmin(null);
    } catch (deleteError) {
      setActionError(deleteError.message || 'Unable to delete this user.');
    }
  };

  const applyFilters = (nextFilters) => {
    setPage(1);
    setFilters(nextFilters);
  };

  const handleStatusAction = (user, status) => {
    if (!user || user.status === status) return;
    setPendingStatusAction({ user, status });
  };

  const confirmStatusAction = async () => {
    if (!pendingStatusAction?.user || !pendingStatusAction?.status) return;

    const { user, status } = pendingStatusAction;
    setStatusBusyId(user.id);
    try {
      const updated = await updateUserStatus(user.id, status);
      setUsers((current) => current.map((entry) => (entry.id === user.id ? { ...entry, ...updated, status } : entry)));
      setFormMessage(`${user.name} is now ${status}.`);
      setActionError('');
      setPendingStatusAction(null);
    } catch (updateError) {
      setActionError(updateError.message || 'Unable to update this user.');
    } finally {
      setStatusBusyId('');
    }
  };

  return (
    <div className="module-page module-page--admin min-w-0">
      <AdminHeader title="Users Management" subtitle="Control account lifecycle, role visibility, verification state, and risk response across the portal." />
      {isDemo ? <p className="module-note">Demo user data is shown because super admin user endpoints are not connected yet.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {actionError ? <p className="form-error">{actionError}</p> : null}
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
        <CreateUserForm existingEmails={existingEmails} onCreate={handleCreateAdmin} />
      </section>
      <section className="panel-card min-w-0">
        <FilterBar
          filters={draftFilters}
          onChange={(key, value) => setDraftFilters((current) => ({ ...current, [key]: value }))}
          fields={[
            { key: 'role', label: 'Role', options: USER_ROLES.map((role) => ({ value: role, label: USER_ROLE_LABELS[role] || role })) },
            { key: 'status', label: 'Status', options: ['active', 'pending', 'blocked', 'banned'].map((status) => ({ value: status, label: status })) }
          ]}
          actions={(
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const nextFilters = {
                    ...draftFilters,
                    role: draftFilters.role === 'hr' ? '' : 'hr'
                  };
                  setDraftFilters(nextFilters);
                  applyFilters(nextFilters);
                }}
              >
                {draftFilters.role === 'hr' ? 'Show All IDs' : 'Show HR IDs'}
              </button>
              <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={() => applyFilters(draftFilters)}>
                <FiSearch size={14} /> Search
              </button>
            </>
          )}
        />
        {loading ? <p className="module-note">Loading users...</p> : null}
        <UsersTable rows={paginatedUsers} onDelete={setDeletingAdmin} onStatusChange={handleStatusAction} busyUserId={statusBusyId} />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </section>
      <ConfirmModal
        open={Boolean(deletingAdmin)}
        title="Delete user account"
        message={deletingAdmin ? `Delete ${USER_ROLE_LABELS[deletingAdmin.role] || 'user'} ID ${(deletingAdmin.displayId || deletingAdmin.id)} for ${deletingAdmin.name}? This action removes portal access for that account.` : ''}
        confirmLabel={`Delete ${USER_ROLE_LABELS[deletingAdmin?.role] || 'user'}`}
        onConfirm={handleDeleteAdmin}
        onClose={() => setDeletingAdmin(null)}
      />
      <ConfirmModal
        open={Boolean(pendingStatusAction)}
        title="Change user status"
        message={pendingStatusAction ? `Set ${pendingStatusAction.user.name} to ${pendingStatusAction.status}?` : ''}
        confirmLabel={`Mark ${pendingStatusAction?.status || 'user'}`}
        onConfirm={confirmStatusAction}
        onClose={() => setPendingStatusAction(null)}
      />
    </div>
  );
};

export default UsersManagement;
