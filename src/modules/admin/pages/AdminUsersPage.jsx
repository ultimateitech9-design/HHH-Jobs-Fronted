import { useEffect, useMemo, useState } from 'react';
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
import { getDashboardPathByRole } from '../../../utils/auth';
import { PASSWORD_POLICY_HELPER, getPasswordPolicyError } from '../../../utils/passwordPolicy';
import {
  createManagedAccount,
  deleteManagedAccount,
  getManagedAccounts,
  getManagementDisplayId
} from '../../../utils/managedUsers';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  { value: 'platform', label: 'Platform Ops' },
  { value: 'audit', label: 'Audit Desk' },
  { value: 'campus_connect', label: 'Campus Connect' },
  { value: 'company_admin', label: 'Company Admin' }
];

const ADMIN_MANAGED_ROLE_OPTIONS = [
  { value: 'admin', label: 'Management' },
  { value: 'platform', label: 'Platform Ops' },
  { value: 'audit', label: 'Audit Desk' },
  { value: 'dataentry', label: 'Data Entry' },
  { value: 'support', label: 'Support' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'sales', label: 'Sales' },
  { value: 'campus_connect', label: 'Campus Connect' }
];

const toApiFilters = (filters) => ({
  role: filters.role === 'all' ? '' : filters.role,
  status: filters.status === 'all' ? '' : filters.status,
  search: filters.search
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
  const [managedAccounts, setManagedAccounts] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [showAuthKey, setShowAuthKey] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'admin',
    department: 'Operations'
  });
  const normalizedAccountEmail = String(accountForm.email || '').trim().toLowerCase();
  const emailValidationMessage = !normalizedAccountEmail
    ? 'Use a valid work email like user@example.com.'
    : (emailRegex.test(normalizedAccountEmail) ? 'Valid work email format.' : 'Enter a valid email address like user@example.com.');
  const authKeyPolicyError = accountForm.password
    ? getPasswordPolicyError(accountForm.password, '')
    : '';
  const authKeyValidationMessage = accountForm.password
    ? (authKeyPolicyError || 'Strong Auth Key ready to use.')
    : PASSWORD_POLICY_HELPER;

  const loadUsers = async (nextFilters = filters) => {
    setLoading(true);
    setError('');

    const response = await getAdminUsers(toApiFilters(nextFilters));
    setUsers(response.data || []);
    setManagedAccounts(getManagedAccounts());
    setError(response.error || '');
    setLoading(false);
  };

  useEffect(() => {
    loadUsers(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleUsersChanged = () => {
      loadUsers(filters);
    };

    window.addEventListener('managed-users-changed', handleUsersChanged);
    window.addEventListener('storage', handleUsersChanged);

    return () => {
      window.removeEventListener('managed-users-changed', handleUsersChanged);
      window.removeEventListener('storage', handleUsersChanged);
    };
  // loadUsers is intentionally refreshed when filters change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleCreateManagedAccount = () => {
    setError('');
    setMessage('');

    const email = normalizedAccountEmail;
    const passwordError = getPasswordPolicyError(accountForm.password, 'Auth Key is required.');

    if (!accountForm.name || !email) {
      setError('Name and Email are required.');
      return;
    }

    if (!emailRegex.test(email)) {
      setError('Enter a valid email address like user@example.com.');
      return;
    }

    if (passwordError) {
      setError(passwordError.replace('Password', 'Auth Key'));
      return;
    }

    try {
      const created = createManagedAccount(accountForm);
      setManagedAccounts(getManagedAccounts());
      setAccountForm({
        name: '',
        phone: '',
        email: '',
        password: '',
        role: 'admin',
        department: 'Operations'
      });
      setMessage(`${created.name} account ${getManagementDisplayId(created.id, created.role)} created for ${created.role}. Login will open ${getDashboardPathByRole(created.role)}.`);
      setTimeout(() => setMessage(''), 4000);
    } catch (actionError) {
      setError(String(actionError.message || 'Unable to create managed account.'));
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
    const totalUsers = users.length;
    const hrUsers = users.filter((user) => String(user.role || '').toLowerCase() === 'hr');
    const pendingHr = hrUsers.filter((user) => !user.is_hr_approved).length;
    const blocked = users.filter((user) => String(user.status || '').toLowerCase() === 'blocked').length;
    const banned = users.filter((user) => String(user.status || '').toLowerCase() === 'banned').length;

    return [
      {
        label: 'Total Platform Users',
        value: String(totalUsers),
        helper: `${hrUsers.length} HR accounts`,
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
  }, [users]);

  const filteredSecurityUsers = useMemo(() => {
    if (filters.hrClearance === 'all') return users;
    return users.filter((user) => {
      const isHr = String(user.role || '').toLowerCase() === 'hr';
      if (!isHr) return false;
      return filters.hrClearance === 'verified' ? Boolean(user.is_hr_approved) : !user.is_hr_approved;
    });
  }, [users, filters.hrClearance]);

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
    <div className="space-y-6 pb-8">
      
      <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="mb-1.5 flex items-center gap-3 text-2xl font-bold font-heading tracking-tight text-primary md:text-[2rem]">
            Identity & Access
          </h1>
          <p className="text-base text-neutral-500">Manage platform users, HR verifications, and internal workforce accounts.</p>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 shadow-sm animate-fade-in">
          <FiXCircle size={20} className="shrink-0" /> <span className="font-semibold">{error}</span>
        </div>
      )}
      {message && !error && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 shadow-sm animate-fade-in">
          <FiCheckCircle size={20} className="shrink-0" /> <span className="font-semibold">{message}</span>
        </div>
      )}

      {/* Stats Grid */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((card) => (
          <article key={card.label} className="flex items-start gap-3 rounded-[1.5rem] border border-neutral-100 bg-white p-4 shadow-sm">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg ${card.bg}`}>
              {card.icon}
            </div>
            <div>
              <h3 className="mb-0.5 text-xl font-black text-primary">{card.value}</h3>
              <p className="mb-0.5 text-xs font-bold text-neutral-600">{card.label}</p>
              <p className="text-xs font-medium text-neutral-400">{card.helper}</p>
            </div>
          </article>
        ))}
      </section>

      {/* Internal Workforce Management */}
      <section className="overflow-hidden rounded-[2rem] border border-neutral-100 bg-white shadow-sm">
        <div className="flex flex-col items-start justify-between border-b border-neutral-100 bg-neutral-50/50 p-5 md:flex-row md:items-center md:p-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-primary">
              <FiKey className="text-brand-500" /> Internal Workforce Accounts
            </h2>
            <p className="mt-1 text-xs text-neutral-500 md:text-sm">Provision access credentials for Data Entry, Accounts, and Support teams.</p>
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
                      if (error) setError('');
                    }}
                    autoComplete="email"
                    inputMode="email"
                    aria-invalid={Boolean(normalizedAccountEmail) && !emailRegex.test(normalizedAccountEmail)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500"
                  />
                  <p className={`text-[11px] font-semibold ${normalizedAccountEmail && !emailRegex.test(normalizedAccountEmail) ? 'text-rose-600' : 'text-neutral-500'}`}>{emailValidationMessage}</p>
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
                        if (error) setError('');
                      }}
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
                  <p className={`text-[11px] font-semibold ${authKeyPolicyError ? 'text-rose-600' : 'text-neutral-500'}`}>{authKeyValidationMessage}</p>
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

              <button 
                type="button" 
                onClick={handleCreateManagedAccount}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-neutral-800"
              >
                <FiPlus /> Provision Account
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
                  managedAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-3 pl-5 align-middle">
                        <div className="text-sm font-bold text-primary">{acc.name}</div>
                        <div className="font-medium text-neutral-500 text-xs">{acc.email}</div>
                        <div className="mt-1 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                          ID {getManagementDisplayId(acc.id, acc.role)}
                        </div>
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
          </div>

        </div>
      </section>

      {/* Public Platform Users */}
      <section className="flex min-h-[420px] flex-col overflow-hidden rounded-[2rem] border border-neutral-100 bg-white shadow-sm">
        <div className="border-b border-neutral-100 bg-neutral-50/50 p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-primary">
                <FiUsers className="text-brand-500" /> Platform Security Database
              </h2>
              <p className="mt-1 text-xs text-neutral-500 md:text-sm">Audit trail of all public users (Students & Recruiters).</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
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
                  placeholder="Search by name or email"
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers(filters)}
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
                onClick={() => loadUsers(filters)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-500 sm:w-auto"
              >
                <FiFilter /> Apply
              </button>
            </div>
          </div>
        </div>

        <div className="relative flex-1 overflow-x-auto custom-scrollbar">
          {loading ? (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
               <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
             </div>
          ) : null}

          <table className="w-full min-w-[920px] border-collapse text-left xl:min-w-[980px]">
            <thead>
              <tr className="bg-neutral-50">
                <th className="border-b border-neutral-200 p-3 pl-5 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">Account Identity</th>
                <th className="w-[118px] border-b border-neutral-200 p-3 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">System Role</th>
                <th className="w-[118px] border-b border-neutral-200 p-3 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">Auth Status</th>
                <th className="w-[126px] border-b border-neutral-200 p-3 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">HR Clearance</th>
                <th className="min-w-[280px] border-b border-neutral-200 p-3 pr-5 text-right text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">Security Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {filteredSecurityUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-sm font-medium text-neutral-500">
                    No users matched the current security filters.
                  </td>
                </tr>
              ) : (
                filteredSecurityUsers.map((user) => {
                  const isHr = String(user.role).toLowerCase() === 'hr';
                  const isStatusBusy = busyAction === `status:${user.id}`;
                  const isApprovalBusy = busyAction === `approval:${user.id}`;
                  
                  return (
                    <tr key={user.id} className="group transition-colors hover:bg-neutral-50/50">
                      <td className="p-3 pl-5">
                        <div className="text-sm font-bold text-primary">{user.name || 'Unknown'}</div>
                        <div className="font-medium text-neutral-500 text-xs">{user.email || 'No email'}</div>
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
                          <div className="flex flex-nowrap bg-neutral-100 rounded-lg p-0.5 border border-neutral-200">
                             <button
                               disabled={isStatusBusy}
                               onClick={() => handleStatusChange(user.id, 'active')}
                               className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${user.status === 'active' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-700'} disabled:opacity-50`}
                             >
                               Active
                             </button>
                             <button
                               disabled={isStatusBusy}
                               onClick={() => handleStatusChange(user.id, 'blocked')}
                               className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${user.status === 'blocked' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-neutral-500 hover:text-amber-700'} disabled:opacity-50`}
                             >
                               Block
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
      </section>

    </div>
  );
};

export default AdminUsersPage;
