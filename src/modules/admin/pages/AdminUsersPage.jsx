import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { 
  FiUsers, 
  FiSearch, 
  FiFilter, 
  FiShield, 
  FiLock, 
  FiUserX, 
  FiCheckCircle, 
  FiXCircle, 
  FiTrash2, 
  FiPlus, 
  FiKey, 
  FiChevronDown,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import {
  formatDateTime,
  getAdminUsers,
  updateAdminHrApproval,
  updateAdminUserStatus
} from '../services/adminApi';
import { createAdminUser } from '../../super-admin/services/usersApi';
import { getDashboardPathByRole } from '../../../utils/auth';
import { PASSWORD_POLICY_HELPER, getPasswordPolicyError } from '../../../utils/passwordPolicy';
import Pagination from '../../../shared/components/Pagination';
import {
  deleteManagedAccount,
  findManagedAccountByEmail,
  getManagedAccounts,
  getManagementDisplayId
} from '../../../utils/managedUsers';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERS_PAGE_SIZE = 10;

const initialFilters = {
  role: 'all',
  status: 'all',
  hrClearance: 'all',
  search: ''
};

const ADMIN_USER_ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Management' },
  { value: 'hr', label: 'Company HR' },
  { value: 'student', label: 'Student / Seeker' },
  { value: 'retired_employee', label: 'Retired Employee' },
  { value: 'support', label: 'Support' },
  { value: 'sales', label: 'Sales' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'dataentry', label: 'Data Entry' },
  { value: 'campus_connect', label: 'Campus Connect' },
  { value: 'company_admin', label: 'Company Admin' }
];

const ADMIN_MANAGED_ROLE_OPTIONS = [
  { value: 'dataentry', label: 'Data Entry' },
  { value: 'support', label: 'Support' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'sales', label: 'Sales' }
];

const toApiFilters = (filters, page = 1) => ({
  role: filters.role === 'all' ? '' : filters.role,
  status: filters.status === 'all' ? '' : filters.status,
  search: filters.search,
  approved: filters.hrClearance === 'verified' ? 'true' : (filters.hrClearance === 'pending' ? 'false' : ''),
  page,
  limit: USERS_PAGE_SIZE
});

const getStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'blocked': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'banned': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  }
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [responseLimit, setResponseLimit] = useState(USERS_PAGE_SIZE);
  const [managedAccounts, setManagedAccounts] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [managedPage, setManagedPage] = useState(1);
  const [securityPage, setSecurityPage] = useState(1);
  const [showAuthKey, setShowAuthKey] = useState(false);
  const [accountFormTouched, setAccountFormTouched] = useState({ email: false, password: false });
  const [accountForm, setAccountForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'dataentry',
    department: 'Operations'
  });
  const normalizedAccountEmail = String(accountForm.email || '').trim().toLowerCase();
  const showEmailValidationMessage = accountFormTouched.email && Boolean(normalizedAccountEmail) && !emailRegex.test(normalizedAccountEmail);
  const emailValidationMessage = 'Enter a valid email address like user@example.com.';
  const authKeyPolicyError = accountForm.password
    ? getPasswordPolicyError(accountForm.password, '')
    : '';
  const showAuthKeyValidationMessage = accountFormTouched.password && Boolean(authKeyPolicyError);
  const authKeyValidationMessage = authKeyPolicyError || PASSWORD_POLICY_HELPER;
  const deferredSearch = useDeferredValue(String(filters.search || '').trim());

  const loadUsers = async (nextFilters = filters, nextPage = securityPage) => {
    setLoading(true);
    setError('');

    const response = await getAdminUsers(toApiFilters(nextFilters, nextPage));
    const payload = response.data || {};
    setUsers(payload.users || []);
    setTotalUsers(Number(payload.total || 0));
    setResponseLimit(Number(payload.limit || USERS_PAGE_SIZE) || USERS_PAGE_SIZE);
    setManagedAccounts(getManagedAccounts());
    setError(response.error || '');
    setLoading(false);
  };

  useEffect(() => {
    loadUsers({ ...filters, search: deferredSearch }, securityPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.role, filters.status, filters.hrClearance, deferredSearch, securityPage]);

  useEffect(() => {
    const handleUsersChanged = () => {
      loadUsers({ ...filters, search: deferredSearch }, securityPage);
    };

    window.addEventListener('managed-users-changed', handleUsersChanged);
    window.addEventListener('storage', handleUsersChanged);

    return () => {
      window.removeEventListener('managed-users-changed', handleUsersChanged);
      window.removeEventListener('storage', handleUsersChanged);
    };
  // loadUsers is intentionally refreshed when filters change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, deferredSearch, securityPage]);

  const handleCreateManagedAccount = async () => {
    setError('');
    setMessage('');

    const email = normalizedAccountEmail;
    const passwordError = getPasswordPolicyError(accountForm.password, 'Auth Key is required.');

    if (!accountForm.name || !email) {
      setAccountFormTouched((current) => ({ ...current, email: true }));
      setError('Name and Email are required.');
      return;
    }

    if (!emailRegex.test(email)) {
      setAccountFormTouched((current) => ({ ...current, email: true }));
      setError('Enter a valid email address like user@example.com.');
      return;
    }

    if (findManagedAccountByEmail(email)) {
      setError('Email already registered.');
      return;
    }

    if (passwordError) {
      setAccountFormTouched((current) => ({ ...current, password: true }));
      setError(passwordError.replace('Password', 'Auth Key'));
      return;
    }

    try {
      setBusyAction('create-managed-account');
      const created = await createAdminUser({
        name: accountForm.name,
        email,
        password: accountForm.password,
        role: accountForm.role,
        mobile: accountForm.phone,
        company: 'HHH Jobs',
        department: accountForm.department
      });
      const managedAccount = findManagedAccountByEmail(email) || created;
      setManagedAccounts(getManagedAccounts());
      setAccountForm({
        name: '',
        phone: '',
        email: '',
        password: '',
        role: 'dataentry',
        department: 'Operations'
      });
      setAccountFormTouched({ email: false, password: false });
      setMessage(`${managedAccount.name || created.name} account ${getManagementDisplayId(managedAccount.id || created.id, managedAccount.role || created.role)} created for ${managedAccount.role || created.role}. Login will open ${getDashboardPathByRole(managedAccount.role || created.role)}.`);
      setTimeout(() => setMessage(''), 4000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to create managed account.'));
    } finally {
      setBusyAction('');
    }
  };

  const handleDeleteManagedAccount = (userId) => {
    if (!window.confirm('Are you sure you want to delete this internal account?')) return;
    
    setError('');
    setMessage('');

    try {
      const deleted = deleteManagedAccount(userId);
      setManagedAccounts(getManagedAccounts());
      setMessage(`${deleted.name} account deleted. Dashboard access removed.`);
      setTimeout(() => setMessage(''), 4000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to delete managed account.'));
    }
  };

  const stats = useMemo(() => {
    const hrUsers = users.filter((user) => String(user.role || '').toLowerCase() === 'hr');
    const pendingHr = hrUsers.filter((user) => !user.is_hr_approved).length;
    const blocked = users.filter((user) => String(user.status || '').toLowerCase() === 'blocked').length;
    const banned = users.filter((user) => String(user.status || '').toLowerCase() === 'banned').length;

    return [
      {
        label: 'Total Platform Users',
        value: String(totalUsers),
        helper: `${hrUsers.length} HR accounts on this page`,
        icon: <FiUsers className="text-blue-500" />,
        bg: 'bg-blue-50'
      },
      {
        label: 'HR Security Approvals',
        value: String(pendingHr),
        helper: 'Requires admin review',
        icon: <FiShield className={pendingHr > 0 ? "text-amber-500" : "text-emerald-500"} />,
        bg: pendingHr > 0 ? 'bg-amber-50' : 'bg-emerald-50'
      },
      {
        label: 'Temporarily Blocked',
        value: String(blocked),
        helper: 'Restricted access',
        icon: <FiLock className="text-amber-500" />,
        bg: 'bg-amber-50'
      },
      {
        label: 'Banned Accounts',
        value: String(banned),
        helper: 'Permanently suspended',
        icon: <FiUserX className="text-red-500" />,
        bg: 'bg-red-50'
      }
    ];
  }, [users, totalUsers]);

  const filteredSecurityUsers = users;

  useEffect(() => {
    setSecurityPage(1);
  }, [filters.role, filters.status, filters.hrClearance, filters.search]);

  const securityTotalPages = Math.max(1, Math.ceil(totalUsers / Math.max(1, responseLimit || USERS_PAGE_SIZE)));
  const paginatedSecurityUsers = filteredSecurityUsers;
  const managedTotalPages = Math.max(1, Math.ceil(managedAccounts.length / USERS_PAGE_SIZE));
  const paginatedManagedAccounts = useMemo(
    () => managedAccounts.slice((managedPage - 1) * USERS_PAGE_SIZE, managedPage * USERS_PAGE_SIZE),
    [managedAccounts, managedPage]
  );

  useEffect(() => {
    if (securityPage > securityTotalPages) {
      setSecurityPage(securityTotalPages);
    }
  }, [securityPage, securityTotalPages]);

  useEffect(() => {
    if (managedPage > managedTotalPages) {
      setManagedPage(managedTotalPages);
    }
  }, [managedPage, managedTotalPages]);

  const securitySearchSuggestions = useMemo(() => {
    const values = new Set();
    users.forEach((user) => {
      [user.name, user.email, user.role, user.status]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .forEach((value) => values.add(value));
    });
    return Array.from(values).sort((left, right) => left.localeCompare(right)).slice(0, 30);
  }, [users]);

  const applyLocalPatch = (userId, patch) => {
    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, ...patch } : user)));
  };

  const handleStatusChange = async (userId, nextStatus) => {
    const user = users.find((entry) => entry.id === userId);
    if (!user || user.status === nextStatus) return;

    if (nextStatus === 'banned' && !window.confirm(`Are you sure you want to PERMANENTLY BAN ${user.name}?`)) return;

    setBusyAction(`status:${userId}`);
    setError('');
    setMessage('');

    try {
      const updated = await updateAdminUserStatus(userId, nextStatus);
      applyLocalPatch(userId, updated);
      setMessage(`Updated ${user.name} to ${nextStatus}.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to update user status.'));
    } finally {
      setBusyAction('');
    }
  };

  const handleHrApproval = async (userId, approved) => {
    const user = users.find((entry) => entry.id === userId);
    if (!user) return;

    setBusyAction(`approval:${userId}`);
    setError('');
    setMessage('');

    try {
      const updated = await updateAdminHrApproval(userId, approved);
      applyLocalPatch(userId, updated);
      setMessage(`${user.name} ${approved ? 'approved' : 'set to pending'} for HR access.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to update HR approval.'));
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="admin-ops-page">
      
      <header className="admin-ops-header">
        <div>
          <h1 className="admin-ops-title">
            Identity & Access
          </h1>
          <p className="admin-ops-subtitle">Manage platform users, HR verifications, and internal workforce accounts.</p>
        </div>
      </header>

      {error && (
        <div className="admin-ops-alert admin-ops-alert--error animate-fade-in">
          <FiXCircle size={20} className="shrink-0" /> <span className="font-semibold">{error}</span>
        </div>
      )}
      {message && !error && (
        <div className="admin-ops-alert admin-ops-alert--success animate-fade-in">
          <FiCheckCircle size={20} className="shrink-0" /> <span className="font-semibold">{message}</span>
        </div>
      )}

      {/* Stats Grid */}
      <section className="admin-ops-stats">
        {stats.map((card) => (
          <article key={card.label} className="admin-ops-stat-card">
            <div className={`admin-ops-stat-card__icon ${card.bg}`}>
              {card.icon}
            </div>
            <div>
              <h3 className="admin-ops-stat-card__value">{card.value}</h3>
              <p className="admin-ops-stat-card__label">{card.label}</p>
              <p className="admin-ops-stat-card__helper">{card.helper}</p>
            </div>
          </article>
        ))}
      </section>

      {/* Internal Workforce Management */}
      <section className="admin-ops-panel">
        <div className="admin-ops-panel-header">
          <div>
            <h2 className="admin-ops-panel-title">
              <FiKey className="text-brand-500" /> Internal Workforce Accounts
            </h2>
            <p className="admin-ops-panel-note">Provision access credentials for Data Entry, Accounts, and Support teams.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-neutral-100">
          
          {/* Create Form */}
          <div className="w-full shrink-0 bg-white p-5 lg:w-1/3 md:p-6">
            <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-neutral-400">Create New Identity</h3>
            <form className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Full Name</label>
                <input
                  value={accountForm.name}
                  placeholder="Employee Name"
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    value={accountForm.email}
                    placeholder="name@company.com"
                    onChange={(e) => {
                      setAccountForm({ ...accountForm, email: e.target.value });
                      setAccountFormTouched((current) => ({ ...current, email: true }));
                      if (error) setError('');
                    }}
                    onBlur={() => setAccountFormTouched((current) => ({ ...current, email: true }))}
                    autoComplete="email"
                    inputMode="email"
                    aria-invalid={Boolean(normalizedAccountEmail) && !emailRegex.test(normalizedAccountEmail)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500"
                  />
                  {showEmailValidationMessage ? <p className="text-[11px] font-semibold text-rose-600">{emailValidationMessage}</p> : null}
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Auth Key</label>
                  <div className="relative">
                    <input
                      type={showAuthKey ? 'text' : 'password'}
                      value={accountForm.password}
                      placeholder="Strong auth key"
                      onChange={(e) => {
                        setAccountForm({ ...accountForm, password: e.target.value });
                        setAccountFormTouched((current) => ({ ...current, password: true }));
                        if (error) setError('');
                      }}
                      onBlur={() => setAccountFormTouched((current) => ({ ...current, password: true }))}
                      autoComplete="new-password"
                      minLength={8}
                      aria-invalid={Boolean(authKeyPolicyError)}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 pr-10 text-sm font-medium focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthKey((current) => !current)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700"
                      aria-label={showAuthKey ? 'Hide password' : 'Show password'}
                      title={showAuthKey ? 'Hide password' : 'Show password'}
                    >
                      {showAuthKey ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {showAuthKeyValidationMessage ? <p className="text-[11px] font-semibold text-rose-600">{authKeyValidationMessage}</p> : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Role Assignment</label>
                  <div className="relative">
                    <select 
                      value={accountForm.role} 
                      onChange={(e) => setAccountForm({ ...accountForm, role: e.target.value })}
                      className="w-full appearance-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-brand-500"
                    >
                      {ADMIN_MANAGED_ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Department</label>
                  <div className="relative">
                    <select 
                      value={accountForm.department} 
                      onChange={(e) => setAccountForm({ ...accountForm, department: e.target.value })}
                      className="w-full appearance-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="Operations">Operations</option>
                      <option value="Customer Support">Customer Support</option>
                      <option value="Finance">Finance</option>
                      <option value="Sales">Sales</option>
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
                State scope is fixed by Super Admin. New dashboard IDs inherit your assigned state automatically.
              </div>

              <button 
                type="button" 
                onClick={handleCreateManagedAccount}
                disabled={busyAction === 'create-managed-account'}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiPlus /> {busyAction === 'create-managed-account' ? 'Provisioning...' : 'Provision Account'}
              </button>
            </form>
          </div>

          {/* Managed Accounts Table */}
          <div className="w-full overflow-x-auto bg-neutral-50/30 p-0 custom-scrollbar lg:w-2/3">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="bg-neutral-100/50">
                  <th className="border-b border-neutral-200 p-3 pl-5 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">Employee</th>
                  <th className="border-b border-neutral-200 p-3 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">Workspace</th>
                  <th className="border-b border-neutral-200 p-3 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">Dept</th>
                  <th className="border-b border-neutral-200 p-3 pr-5 text-right text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {managedAccounts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-sm font-medium text-neutral-500">
                      No internal workforce accounts provisioned yet.
                    </td>
                  </tr>
                ) : (
                  paginatedManagedAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-3 pl-5 align-middle">
                        <div className="text-sm font-bold text-primary">{acc.name}</div>
                        <div className="font-medium text-neutral-500 text-xs">{acc.email}</div>
                        <div className="mt-1 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                          ID {getManagementDisplayId(acc.id, acc.role)}
                        </div>
                        {Array.isArray(acc.assignedStates) && acc.assignedStates.length ? (
                          <div className="mt-1 text-[11px] font-semibold text-neutral-500">
                            {acc.assignedStates.join(', ')}
                          </div>
                        ) : null}
                        {acc.salesCode ? (
                          <div className="mt-1 font-mono text-[11px] font-semibold text-brand-700">
                            Code {acc.salesCode}
                          </div>
                        ) : null}
                      </td>
                      <td className="p-3">
                        <span className="inline-block rounded-md border border-brand-100 bg-brand-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-brand-700">
                          {acc.role}
                        </span>
                      </td>
                      <td className="p-3 text-sm font-bold text-neutral-600">{acc.department}</td>
                      <td className="p-3 pr-5 text-right">
                        <button 
                          onClick={() => handleDeleteManagedAccount(acc.id)}
                          className="rounded-lg border border-transparent p-1.5 text-red-500 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-700"
                          title="Revoke Access"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="border-t border-neutral-100 bg-white px-5 py-3">
              <Pagination page={managedPage} totalPages={managedTotalPages} onChange={setManagedPage} />
            </div>
          </div>

        </div>
      </section>

      {/* Public Platform Users */}
      <section className="admin-ops-panel min-h-[420px]">
        <div className="admin-ops-panel-header">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="admin-ops-panel-title">
                <FiUsers className="text-brand-500" /> Platform Security Database
              </h2>
              <p className="admin-ops-panel-note">Audit trail of all public users (Students & Recruiters).</p>
            </div>

            {/* Filters */}
            <div className="admin-ops-filterbar">
              <div className="relative w-full sm:w-auto">
                <select 
                  value={filters.role} 
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="w-full appearance-none rounded-xl border border-neutral-200 bg-white py-2 pl-3 pr-8 text-sm font-bold text-neutral-700 shadow-sm focus:ring-2 focus:ring-brand-500 sm:min-w-[145px]"
                >
                  {ADMIN_USER_ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              </div>

              <div className="relative w-full sm:w-auto">
                <select 
                  value={filters.status} 
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full appearance-none rounded-xl border border-neutral-200 bg-white py-2 pl-3 pr-8 text-sm font-bold text-neutral-700 shadow-sm focus:ring-2 focus:ring-brand-500 sm:min-w-[145px]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="banned">Banned</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              </div>

              <div className="relative w-full sm:w-auto">
                <select
                  value={filters.hrClearance}
                  onChange={(e) => setFilters({ ...filters, hrClearance: e.target.value })}
                  className="w-full appearance-none rounded-xl border border-neutral-200 bg-white py-2 pl-3 pr-8 text-sm font-bold text-neutral-700 shadow-sm focus:ring-2 focus:ring-brand-500 sm:min-w-[160px]"
                >
                  <option value="all">All HR Clearance</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              </div>

              <div className="relative w-full flex-1 sm:min-w-[200px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={filters.search}
                  placeholder="Search by name, email, role, or status"
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSecurityPage(1);
                      loadUsers({ ...filters, search: e.currentTarget.value }, 1);
                    }
                  }}
                  list="admin-security-user-suggestions"
                  autoComplete="off"
                  className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm font-medium shadow-sm focus:ring-2 focus:ring-brand-500"
                />
                <datalist id="admin-security-user-suggestions">
                  {securitySearchSuggestions.map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
              </div>

              <button 
                onClick={() => {
                  setSecurityPage(1);
                  loadUsers({ ...filters, search: deferredSearch }, 1);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-500 sm:w-auto"
              >
                <FiFilter /> Apply
              </button>
            </div>
          </div>
        </div>

        <div className="admin-ops-table-wrap custom-scrollbar">
          {loading ? (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
               <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
             </div>
          ) : null}

          <table className="w-full min-w-[1220px] border-collapse text-left xl:min-w-[1280px]">
            <thead>
              <tr className="bg-neutral-50">
                <th className="border-b border-neutral-200 p-3 pl-5 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">Account Identity</th>
                <th className="w-[145px] border-b border-neutral-200 p-3 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">Contact</th>
                <th className="w-[118px] border-b border-neutral-200 p-3 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">System Role</th>
                <th className="w-[118px] border-b border-neutral-200 p-3 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">Auth Status</th>
                <th className="w-[126px] border-b border-neutral-200 p-3 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">HR Clearance</th>
                <th className="w-[160px] border-b border-neutral-200 p-3 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">Onboarding</th>
                <th className="w-[160px] border-b border-neutral-200 p-3 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">Last Active</th>
                <th className="min-w-[280px] border-b border-neutral-200 p-3 pr-5 text-right text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">Security Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {filteredSecurityUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-sm font-medium text-neutral-500">
                    No users matched the current security filters.
                  </td>
                </tr>
              ) : (
                paginatedSecurityUsers.map((user) => {
                  const isHr = String(user.role).toLowerCase() === 'hr';
                  const isStatusBusy = busyAction === `status:${user.id}`;
                  const isApprovalBusy = busyAction === `approval:${user.id}`;
                  
                  return (
                    <tr key={user.id} className="group transition-colors hover:bg-neutral-50/50">
                      <td className="p-3 pl-5">
                        <div className="text-sm font-bold text-primary">{user.name || 'Unknown'}</div>
                        <div className="font-medium text-neutral-500 text-xs">{user.email || 'No email'}</div>
                      </td>
                      <td className="p-3 align-middle text-xs font-semibold text-neutral-600">
                        {user.contactNumber || user.phone || user.mobile || '-'}
                      </td>
                      <td className="p-3 align-middle">
                        <span className="inline-flex min-w-[70px] items-center justify-center whitespace-nowrap rounded-md bg-neutral-100 px-2.5 py-1 text-center text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3 align-middle">
                        <span className={`inline-flex min-w-[82px] items-center justify-center whitespace-nowrap rounded-md border px-2.5 py-1 text-center text-[10px] font-black uppercase tracking-wider ${getStatusBadge(user.status || 'active')}`}>
                          {user.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-3 align-middle">
                        {isHr ? (
                          <span className={`inline-flex min-w-[92px] items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2.5 py-1 text-center text-[10px] font-black uppercase tracking-wider ${user.is_hr_approved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {user.is_hr_approved ? <><FiCheckCircle /> Verified</> : <><FiShield /> Pending</>}
                          </span>
                        ) : (
                          <span className="text-neutral-300 text-xs font-bold">—</span>
                        )}
                      </td>
                      <td className="p-3 align-middle text-xs font-semibold leading-5 text-neutral-500">
                        {formatDateTime(user.onboardingDate || user.createdAt || user.created_at)}
                      </td>
                      <td className="p-3 align-middle text-xs font-semibold leading-5 text-neutral-500">
                        {formatDateTime(user.lastActiveAt || user.last_login_at)}
                      </td>
                      <td className="p-3 pr-5 align-middle">
                        <div className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap opacity-100 transition-opacity md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto">
                          {/* HR Verification Toggle */}
                          {isHr && (
                            <button
                              disabled={isApprovalBusy}
                              onClick={() => handleHrApproval(user.id, !user.is_hr_approved)}
                              className={`whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                                user.is_hr_approved 
                                  ? 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              } disabled:opacity-50`}
                            >
                              {isApprovalBusy ? '...' : user.is_hr_approved ? 'Revoke HR' : 'Verify HR'}
                            </button>
                          )}
                          
                          {/* Generic Status Actions */}
                          <div className="flex flex-nowrap items-center rounded-lg border border-neutral-200 bg-neutral-100 p-0.5">
                             <button
                               disabled={isStatusBusy}
                               onClick={() => handleStatusChange(user.id, 'active')}
                               className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${user.status === 'active' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-700'} disabled:opacity-50`}
                             >
                               Active
                             </button>
                             <button
                               disabled={isStatusBusy}
                               onClick={() => handleStatusChange(user.id, 'banned')}
                               className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${user.status === 'banned' ? 'bg-red-100 text-red-800 shadow-sm' : 'text-neutral-500 hover:text-red-700'} disabled:opacity-50`}
                             >
                               Ban
                             </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="admin-ops-pagination">
          <p className="text-xs font-semibold text-neutral-500">
            Showing <span className="text-neutral-800">{paginatedSecurityUsers.length}</span> of <span className="text-neutral-800">{totalUsers}</span> users
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSecurityPage((current) => Math.max(1, current - 1))}
              disabled={securityPage <= 1}
              className="btn-secondary"
            >
              Previous
            </button>
            <p className="text-xs font-semibold text-neutral-500">
              Page <span className="text-neutral-800">{securityPage}</span> of <span className="text-neutral-800">{securityTotalPages}</span>
            </p>
            <button
              type="button"
              onClick={() => setSecurityPage((current) => Math.min(securityTotalPages, current + 1))}
              disabled={securityPage >= securityTotalPages}
              className="btn-secondary"
            >
              Next
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AdminUsersPage;
