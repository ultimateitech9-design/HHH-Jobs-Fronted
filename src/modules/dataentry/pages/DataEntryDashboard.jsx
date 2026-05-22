import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiEye, FiEyeOff, FiPlus, FiX } from 'react-icons/fi';
import DashboardMetricCards from '../../../shared/components/dashboard/DashboardMetricCards';
import { PASSWORD_POLICY_HELPER, getPasswordPolicyError } from '../../../utils/passwordPolicy';
import { createDataEntryUserId, getDataEntryDashboard } from '../services/dataentryApi';

const emptyDashboard = {
  totals: {
    candidatesAdded: 0,
    jobsPosted: 0,
    companiesAdded: 0,
    hrContactsAdded: 0,
    totalEntries: 0
  },
  candidateWorkflow: {
    profileCreated: 0,
    resumeUploaded: 0,
    detailsUpdated: 0,
    candidateIdsGenerated: 0
  },
  companyWorkflow: {
    companyDetailsAdded: 0,
    hrContactsAdded: 0,
    jobOpeningsAdded: 0
  },
  pipeline: {
    applied: 0,
    shortlisted: 0,
    interview: 0,
    selected: 0,
    rejected: 0
  },
  quality: {
    errors: 0,
    duplicateEntries: 0,
    pendingReview: 0,
    approved: 0,
    drafts: 0
  },
  activityFeed: []
};

const dataEntryUserRoles = [
  { value: 'hr', label: 'HR Dashboard' },
  { value: 'student', label: 'Student Dashboard' }
];

const roleLabels = {
  hr: 'HR',
  student: 'Student'
};

const initialUserForm = {
  name: '',
  email: '',
  password: '',
  company: 'HHH Jobs',
  role: 'hr'
};

const CreateDataEntryUserModal = ({ open, onClose, onCreated }) => {
  const [userForm, setUserForm] = useState(initialUserForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordPolicyError = userForm.password
    ? getPasswordPolicyError(userForm.password, '')
    : '';
  const passwordPolicyMessage = userForm.password
    ? (passwordPolicyError || 'Strong password ready to use.')
    : PASSWORD_POLICY_HELPER;

  useEffect(() => {
    if (!open) return undefined;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setUserForm(initialUserForm);
      setFormError('');
      setSaving(false);
      setShowPassword(false);
    }
  }, [open]);

  const updateForm = (key, value) => {
    setUserForm((current) => ({ ...current, [key]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: userForm.name.trim(),
      email: userForm.email.trim().toLowerCase(),
      password: String(userForm.password || ''),
      company: userForm.company.trim(),
      role: userForm.role
    };

    if (!payload.name || !payload.email || !payload.password || !payload.company) {
      setFormError('Full name, email, password, and company/team are required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setFormError('Enter a valid email address like user@example.com.');
      return;
    }

    const passwordError = getPasswordPolicyError(payload.password);
    if (passwordError) {
      setFormError(passwordError);
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const createdUser = await createDataEntryUserId(payload);
      onCreated(createdUser);
      onClose();
    } catch (error) {
      setFormError(error.message || 'Unable to create user ID.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return createPortal((
    <div className="fixed inset-0 z-[120] bg-slate-900/45 px-4 py-6 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <div className="mx-auto flex h-full max-w-5xl items-start justify-center overflow-y-auto">
        <div className="w-full rounded-[28px] border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Create user ID" onMouseDown={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-navy">Create User ID</h2>
              <p className="mt-1 text-sm text-slate-500">Create HR or Student portal accounts from Data Entry.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
              aria-label="Close create user dialog"
            >
              <FiX size={16} />
            </button>
          </div>
          <div className="px-5 py-5 sm:px-6">
            <form className="form-grid" onSubmit={handleSubmit}>
              <label>
                Full Name
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                  placeholder="Enter full name"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(event) => updateForm('email', event.target.value)}
                  placeholder="user@hhh-jobs.com"
                />
              </label>
              <label>
                Password
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={userForm.password}
                    onChange={(event) => updateForm('password', event.target.value)}
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
                  value={userForm.company}
                  onChange={(event) => updateForm('company', event.target.value)}
                  placeholder="HHH Jobs"
                />
              </label>
              <label>
                Assigned Role
                <select value={userForm.role} onChange={(event) => updateForm('role', event.target.value)}>
                  {dataEntryUserRoles.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </label>
              {formError ? <p className="form-error">{formError}</p> : null}
              <div className="student-job-actions">
                <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onClose} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
                  {saving ? 'Creating User...' : `Create ${roleLabels[userForm.role] || 'User'} ID`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  ), document.body);
};

const DataEntryDashboard = () => {
  const [state, setState] = useState({
    loading: true,
    error: '',
    isDemo: false,
    dashboard: emptyDashboard
  });
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [formMessage, setFormMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: '' }));

      try {
        const dashboardRes = await getDataEntryDashboard();
        if (!mounted) return;

        setState({
          loading: false,
          error: dashboardRes.error || '',
          isDemo: Boolean(dashboardRes.isDemo),
          dashboard: { ...emptyDashboard, ...(dashboardRes.data || {}) }
        });
      } catch (error) {
        if (!mounted) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message || 'Unable to load data entry dashboard.'
        }));
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totals = state.dashboard.totals || {};
    const quality = state.dashboard.quality || {};

    return [
      {
        label: 'Candidates Added',
        value: Number(totals.candidatesAdded || 0),
        helper: 'Profiles created by the data entry team'
      },
      {
        label: 'Jobs Posted',
        value: Number(totals.jobsPosted || 0),
        helper: 'Openings added to the system'
      },
      {
        label: 'Companies Added',
        value: Number(totals.companiesAdded || 0),
        helper: 'Company records created'
      },
      {
        label: 'Errors / Duplicates',
        value: Number(quality.errors || 0) + Number(quality.duplicateEntries || 0),
        helper: `${quality.errors || 0} errors | ${quality.duplicateEntries || 0} duplicates`
      }
    ];
  }, [state.dashboard]);

  const statCards = stats.map((card, index) => ({
    ...card,
    tone: ['accent', 'info', 'success', 'danger'][index] || 'default'
  }));

  const handleCreatedUser = (user) => {
    const roleName = roleLabels[user?.role] || 'User';
    const createdFor = user?.name || user?.email || 'new account';
    setFormMessage(`${roleName} ID created for ${createdFor}. This login opens the assigned ${roleName} dashboard.`);
  };

  return (
    <div className="space-y-3 pb-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Data Entry Workspace</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-navy sm:text-3xl">Data Entry Dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-500">
            Candidate, company, and job entry operations in one command view.
          </p>
        </div>
        <button type="button" className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto" onClick={() => setIsCreateUserOpen(true)}>
          <FiPlus size={14} /> Create User ID
        </button>
      </div>

      {state.isDemo ? <p className="module-note">Demo data is being shown because the data entry backend is not connected.</p> : null}
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {formMessage ? <p className="module-note">{formMessage}</p> : null}

      {state.loading ? <p className="module-note">Loading dashboard...</p> : null}

      {!state.loading ? (
        <>
          <DashboardMetricCards cards={statCards} />
        </>
      ) : null}
      <CreateDataEntryUserModal
        open={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        onCreated={handleCreatedUser}
      />
    </div>
  );
};

export default DataEntryDashboard;
