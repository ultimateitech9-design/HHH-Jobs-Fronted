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
  FiChevronDown 
} from 'react-icons/fi';
import {
  formatDateTime,
  getAdminUsers,
  updateAdminHrApproval,
  updateAdminUserStatus
} from '../services/adminApi';
import { getDashboardPathByRole } from '../../../utils/auth';
import {
  createManagedAccount,
  deleteManagedAccount,
  getManagedAccounts
} from '../../../utils/managedUsers';

const initialFilters = {
  role: 'all',
  status: 'all',
  search: ''
};

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
  const [accountForm, setAccountForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'dataentry',
    department: 'Operations'
  });

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

    if (!accountForm.name || !accountForm.email) {
      setError('Name and Email are required.');
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
        role: 'dataentry',
        department: 'Operations'
      });
      setMessage(`${created.name} account created for ${created.role}. Login will open ${getDashboardPathByRole(created.role)}.`);
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
    <div className="space-y-8 pb-10">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-primary tracking-tight mb-2 flex items-center gap-3">
            Identity & Access
          </h1>
          <p className="text-neutral-500 text-lg">Manage platform users, HR verifications, and internal workforce accounts.</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-200 shadow-sm animate-fade-in">
          <FiXCircle size={20} className="shrink-0" /> <span className="font-semibold">{error}</span>
        </div>
      )}
      {message && !error && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 border border-emerald-200 shadow-sm animate-fade-in">
          <FiCheckCircle size={20} className="shrink-0" /> <span className="font-semibold">{message}</span>
        </div>
      )}

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((card) => (
          <article key={card.label} className="bg-white rounded-[2rem] p-6 border border-neutral-100 shadow-sm flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${card.bg}`}>
              {card.icon}
            </div>
            <div>
              <h3 className="text-2xl font-black text-primary mb-1">{card.value}</h3>
              <p className="text-sm font-bold text-neutral-600 mb-0.5">{card.label}</p>
              <p className="text-xs font-medium text-neutral-400">{card.helper}</p>
            </div>
          </article>
        ))}
      </section>

      {/* Internal Workforce Management */}
      <section className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-neutral-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-neutral-50/50">
          <div>
            <h2 className="text-xl font-extrabold text-primary flex items-center gap-2">
              <FiKey className="text-brand-500" /> Internal Workforce Accounts
            </h2>
            <p className="text-neutral-500 text-sm mt-1">Provision access credentials for Data Entry, Accounts, and Support teams.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-neutral-100">
          
          {/* Create Form */}
          <div className="w-full lg:w-1/3 p-6 md:p-8 bg-white shrink-0">
            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-6">Create New Identity</h3>
            <form className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Full Name</label>
                <input
                  value={accountForm.name}
                  placeholder="Employee Name"
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Email</label>
                  <input
                    value={accountForm.email}
                    placeholder="name@company.com"
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium text-sm"
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Auth Key</label>
                  <input
                    type="text"
                    value={accountForm.password}
                    placeholder="Min 6 chars"
                    onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Role Assignment</label>
                  <div className="relative">
                    <select 
                      value={accountForm.role} 
                      onChange={(e) => setAccountForm({ ...accountForm, role: e.target.value })}
                      className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-bold text-sm appearance-none"
                    >
                      <option value="dataentry">Data Entry</option>
                      <option value="support">Support</option>
                      <option value="accounts">Accounts</option>
                      <option value="sales">Sales</option>
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
                      className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-bold text-sm appearance-none"
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
                className="w-full py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-colors shadow-sm mt-4 flex justify-center items-center gap-2"
              >
                <FiPlus /> Provision Account
              </button>
            </form>
          </div>

          {/* Managed Accounts Table */}
          <div className="w-full lg:w-2/3 p-0 bg-neutral-50/30 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-neutral-100/50">
                  <th className="p-4 pl-6 text-xs font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-200">Employee</th>
                  <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-200">Workspace</th>
                  <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-200">Dept</th>
                  <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-200 text-right pr-6">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {managedAccounts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-neutral-500 font-medium">
                      No internal workforce accounts provisioned yet.
                    </td>
                  </tr>
                ) : (
                  managedAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-extrabold text-primary text-sm">{acc.name}</div>
                        <div className="font-medium text-neutral-500 text-xs">{acc.email}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-brand-50 text-brand-700 border border-brand-100 rounded-md text-[10px] uppercase font-black tracking-wider inline-block">
                          {acc.role}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-neutral-600 text-sm">{acc.department}</td>
                      <td className="p-4 pr-6 text-right">
                        <button 
                          onClick={() => handleDeleteManagedAccount(acc.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Revoke Access"
                        >
                          <FiTrash2 size={16} />
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
      <section className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-6 md:p-8 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div>
              <h2 className="text-xl font-extrabold text-primary flex items-center gap-2">
                <FiUsers className="text-brand-500" /> Platform Security Database
              </h2>
              <p className="text-neutral-500 text-sm mt-1">Audit trail of all public users (Students & Recruiters).</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <div className="relative w-full sm:w-auto">
                <select 
                  value={filters.role} 
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="w-full pl-3 pr-8 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-bold text-sm text-neutral-700 appearance-none shadow-sm sm:min-w-[160px]"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">System Admin</option>
                  <option value="hr">Company HR</option>
                  <option value="student">Student/Seeker</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              </div>

              <div className="relative w-full sm:w-auto">
                <select 
                  value={filters.status} 
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full pl-3 pr-8 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-bold text-sm text-neutral-700 appearance-none shadow-sm sm:min-w-[160px]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="banned">Banned</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              </div>

              <div className="relative w-full flex-1 sm:min-w-[220px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={filters.search}
                  placeholder="Search by name or email"
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers(filters)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium text-sm shadow-sm"
                />
              </div>

              <button 
                onClick={() => loadUsers(filters)}
                className="w-full px-4 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-500 transition-colors shadow-sm flex items-center justify-center gap-2 sm:w-auto"
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

          <table className="w-full text-left border-collapse min-w-[920px] xl:min-w-[1000px]">
            <thead>
              <tr className="bg-neutral-50">
                <th className="p-4 pl-6 text-xs font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-200">Account Identity</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-200">System Role</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-200">Auth Status</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-200">HR Clearance</th>
                <th className="p-4 text-xs font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-200 text-right pr-6">Security Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-neutral-500 font-medium">
                    No users matched the current security filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isHr = String(user.role).toLowerCase() === 'hr';
                  const isStatusBusy = busyAction === `status:${user.id}`;
                  const isApprovalBusy = busyAction === `approval:${user.id}`;
                  
                  return (
                    <tr key={user.id} className="hover:bg-neutral-50/50 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="font-extrabold text-primary text-sm">{user.name || 'Unknown'}</div>
                        <div className="font-medium text-neutral-500 text-xs">{user.email || 'No email'}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-neutral-700 text-xs bg-neutral-100 px-2 py-1 rounded inline-block uppercase tracking-wider">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wider border inline-block ${getStatusBadge(user.status || 'active')}`}>
                          {user.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-4">
                        {isHr ? (
                          <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wider border inline-flex items-center gap-1 ${user.is_hr_approved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {user.is_hr_approved ? <><FiCheckCircle /> Verified</> : <><FiShield /> Pending</>}
                          </span>
                        ) : (
                          <span className="text-neutral-300 text-xs font-bold">—</span>
                        )}
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {/* HR Verification Toggle */}
                          {isHr && (
                            <button
                              disabled={isApprovalBusy}
                              onClick={() => handleHrApproval(user.id, !user.is_hr_approved)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                                user.is_hr_approved 
                                  ? 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              } disabled:opacity-50`}
                            >
                              {isApprovalBusy ? '...' : user.is_hr_approved ? 'Revoke HR' : 'Verify HR'}
                            </button>
                          )}
                          
                          {/* Generic Status Actions */}
                          <div className="flex bg-neutral-100 rounded-lg p-0.5 border border-neutral-200">
                             <button
                               disabled={isStatusBusy}
                               onClick={() => handleStatusChange(user.id, 'active')}
                               className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${user.status === 'active' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-700'} disabled:opacity-50`}
                             >
                               Active
                             </button>
                             <button
                               disabled={isStatusBusy}
                               onClick={() => handleStatusChange(user.id, 'blocked')}
                               className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${user.status === 'blocked' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-neutral-500 hover:text-amber-700'} disabled:opacity-50`}
                             >
                               Block
                             </button>
                             <button
                               disabled={isStatusBusy}
                               onClick={() => handleStatusChange(user.id, 'banned')}
                               className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${user.status === 'banned' ? 'bg-red-100 text-red-800 shadow-sm' : 'text-neutral-500 hover:text-red-700'} disabled:opacity-50`}
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
