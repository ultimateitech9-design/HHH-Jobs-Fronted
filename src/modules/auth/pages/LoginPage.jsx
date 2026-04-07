import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiFetch, apiUrl, areDemoFallbacksEnabled } from '../../../utils/api';
import {
  beginPendingVerificationSession,
  getDashboardPathByRole,
  normalizeRedirectPath,
  setAuthSession
} from '../../../utils/auth';
import {
  createManagedAccount,
  findManagedAccountByEmail,
  updateManagedAccountLogin
} from '../../../utils/managedUsers';
import {
  generateHrEmployerId,
  generateRetiredEmployeeId,
  generateStudentCandidateId
} from '../../../utils/hrIdentity';
import AuthFormMessage from '../components/AuthFormMessage';
import AuthInputField from '../components/AuthInputField';
import AuthPageShell from '../components/AuthPageShell';
import AuthPasswordField from '../components/AuthPasswordField';
import AuthRoleTabs from '../components/AuthRoleTabs';
import AuthSocialButtons from '../components/AuthSocialButtons';
import { loginShellBenefits, socialRoleOptions } from '../config/authOptions';
import { calculateAge } from '../utils/signupValidation';

const isManagedAccountAllowedForRoute = (role, redirectTo) => {
  if (!redirectTo) return true;

  const normalizedRedirect = normalizeRedirectPath(redirectTo, role);
  const allowedPortalPrefix = getDashboardPathByRole(role)
    .replace(/\/(dashboard|overview)$/, '');

  if (!allowedPortalPrefix) {
    return true;
  }

  return normalizedRedirect.startsWith(allowedPortalPrefix);
};

const DEMO_ACCESS_ACCOUNTS = [
  {
    label: 'Demo Admin',
    role: 'admin',
    email: 'demo.admin@hhh-jobs.local',
    password: 'DemoAdmin123!',
    name: 'Demo Admin',
    phone: '9999999991',
    department: 'Administration',
    redirectPath: '/portal/admin/dashboard'
  },
  {
    label: 'Demo HR',
    role: 'hr',
    email: 'demo.hr@hhh-jobs.local',
    password: 'DemoHr123!',
    name: 'Demo HR',
    phone: '9999999992',
    department: 'Recruitment',
    redirectPath: '/portal/hr/dashboard'
  },
  {
    label: 'Demo Student',
    role: 'student',
    email: 'demo.student@hhh-jobs.local',
    password: 'DemoStudent123!',
    name: 'Demo Student',
    phone: '9999999993',
    department: 'Applicants',
    redirectPath: '/portal/student/dashboard'
  },
  {
    label: 'Demo Super Admin',
    role: 'super_admin',
    email: 'demo.superadmin@hhh-jobs.local',
    password: 'DemoSuperAdmin123!',
    name: 'Demo Super Admin',
    phone: '9999999994',
    department: 'Leadership',
    redirectPath: '/portal/super-admin/dashboard'
  },
  {
    label: 'Demo Support',
    role: 'support',
    email: 'demo.support@hhh-jobs.local',
    password: 'DemoSupport123!',
    name: 'Demo Support',
    phone: '9999999995',
    department: 'Support',
    redirectPath: '/portal/support/dashboard'
  },
  {
    label: 'Demo Sales',
    role: 'sales',
    email: 'demo.sales@hhh-jobs.local',
    password: 'DemoSales123!',
    name: 'Demo Sales',
    phone: '9999999996',
    department: 'Sales',
    redirectPath: '/portal/sales/overview'
  },
  {
    label: 'Demo Data Entry',
    role: 'dataentry',
    email: 'demo.dataentry@hhh-jobs.local',
    password: 'DemoDataEntry123!',
    name: 'Demo Data Entry',
    phone: '9999999997',
    department: 'Operations',
    redirectPath: '/portal/dataentry/dashboard'
  },
  {
    label: 'Demo Accounts',
    role: 'accounts',
    email: 'demo.accounts@hhh-jobs.local',
    password: 'DemoAccounts123!',
    name: 'Demo Accounts',
    phone: '9999999998',
    department: 'Finance',
    redirectPath: '/portal/accounts/overview'
  },
  {
    label: 'Demo Platform',
    role: 'platform',
    email: 'demo.platform@hhh-jobs.local',
    password: 'DemoPlatform123!',
    name: 'Demo Platform',
    phone: '9999999999',
    department: 'Platform',
    redirectPath: '/portal/platform/dashboard'
  },
  {
    label: 'Demo Audit',
    role: 'audit',
    email: 'demo.audit@hhh-jobs.local',
    password: 'DemoAudit123!',
    name: 'Demo Audit',
    phone: '9999999980',
    department: 'Compliance',
    redirectPath: '/portal/audit/dashboard'
  }
];

const ensureDemoManagedAccount = (demoAccount) => {
  const existing = findManagedAccountByEmail(demoAccount.email);
  if (existing) return existing;

  return createManagedAccount({
    name: demoAccount.name,
    email: demoAccount.email,
    password: demoAccount.password,
    role: demoAccount.role,
    phone: demoAccount.phone,
    department: demoAccount.department
  });
};

const tryManagedAccountLogin = ({ email, password, navigate, redirectTo, setError }) => {
  const managedAccount = findManagedAccountByEmail(email);
  if (!managedAccount || managedAccount.password !== password) return false;

  if (!isManagedAccountAllowedForRoute(managedAccount.role, redirectTo)) {
    setError?.(`This ID is not allowed for the selected portal. Use the ${managedAccount.role} account on its assigned dashboard.`);
    return true;
  }

  const nextUser = updateManagedAccountLogin(managedAccount.id) || managedAccount;
  setAuthSession(`managed-${nextUser.id}`, nextUser);
  navigate(normalizeRedirectPath(redirectTo || getDashboardPathByRole(nextUser?.role), nextUser?.role), { replace: true });
  return true;
};

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [socialRole, setSocialRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [availableProviders, setAvailableProviders] = useState(null);
  const [providersLoading, setProvidersLoading] = useState(true);
  const retryActionsRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || null;
  const portalLabel = location.state?.portalLabel || 'Portal Login';
  const demoFallbacksEnabled = areDemoFallbacksEnabled();
  const isLocalBrowser = typeof window !== 'undefined'
    && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
  const showLinkedInLocalHint = isLocalBrowser
    && Array.isArray(availableProviders)
    && !providersLoading
    && !availableProviders.includes('linkedin');

  useEffect(() => {
    const oauthError = new URLSearchParams(location.search).get('oauth_error');
    if (oauthError) {
      setError(oauthError);
    }
  }, [location.search]);

  useEffect(() => {
    if (!error || !retryActionsRef.current) return;

    retryActionsRef.current.scrollIntoView({
      block: 'nearest',
      inline: 'nearest'
    });
  }, [error]);

  useEffect(() => {
    let cancelled = false;
    setProvidersLoading(true);
    apiFetch('/auth/providers')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAvailableProviders(data?.providers ?? []);
      })
      .catch(() => {
        if (!cancelled) setAvailableProviders([]);
      })
      .finally(() => {
        if (!cancelled) setProvidersLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const redirectToOtpVerification = ({ email, otp = '', emailWarning = '' }) => {
    beginPendingVerificationSession({ email, otp, emailWarning });
    navigate('/verify-otp', {
      state: { email, otp, emailWarning },
      replace: true
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }

    if (demoFallbacksEnabled && tryManagedAccountLogin({ email: form.email, password: form.password, navigate, redirectTo, setError })) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      let payload = {};
      try {
        payload = await response.json();
      } catch (parseError) {
        payload = {};
      }

      if (!response.ok) {
        setError(payload.message || 'Login failed.');
        return;
      }

      if (payload.requiresOtpVerification) {
        redirectToOtpVerification({
          email: form.email,
          otp: payload.otp || '',
          emailWarning: payload.emailWarning || payload.message || ''
        });
        return;
      }

      if (payload.user?.role === 'retired_employee') {
        const dob = payload.user?.dateOfBirth || payload.user?.date_of_birth || null;
        const age = calculateAge(dob);
        if (age !== null && age < 60) {
          setError('You are not eligible for Retired Employee login. Minimum age is 60 years.');
          return;
        }
      }

      const nextUser = payload.user?.role === 'hr'
        ? {
          ...payload.user,
          hrEmployerId: generateHrEmployerId({
            companyName: payload.user?.companyName || payload.user?.company_name || payload.user?.name || '',
            mobile: payload.user?.mobile || ''
          })
        }
        : payload.user?.role === 'student'
          ? {
            ...payload.user,
            studentCandidateId: generateStudentCandidateId({
              name: payload.user?.name || '',
              mobile: payload.user?.mobile || payload.user?.phone || ''
            })
          }
          : payload.user?.role === 'retired_employee'
            ? {
              ...payload.user,
              retiredEmployeeId: generateRetiredEmployeeId({
                name: payload.user?.name || '',
                mobile: payload.user?.mobile || payload.user?.phone || ''
              })
            }
            : payload.user;

      setAuthSession(payload.token, nextUser);

      navigate(normalizeRedirectPath(redirectTo || payload.redirectTo || getDashboardPathByRole(nextUser?.role), nextUser?.role), { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign in right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startSocialLogin = (provider) => {
    setError('');
    setSocialLoading(provider);
    const endpoint = new URL(apiUrl(`/auth/oauth/${provider}/start`));
    endpoint.searchParams.set('role', socialRole);
    endpoint.searchParams.set('clientUrl', window.location.origin);
    window.location.assign(endpoint.toString());
  };

  const handleDemoAccess = (demoAccount) => {
    setError('');

    const managedAccount = ensureDemoManagedAccount(demoAccount);
    if (!isManagedAccountAllowedForRoute(managedAccount.role, redirectTo)) {
      setError(`This demo account is not allowed for the selected portal.`);
      return;
    }

    const nextUser = updateManagedAccountLogin(managedAccount.id) || managedAccount;
    setAuthSession(`managed-${nextUser.id}`, nextUser);
    navigate(normalizeRedirectPath(redirectTo || demoAccount.redirectPath, managedAccount.role), { replace: true });
  };

  return (
    <AuthPageShell
      eyebrow="Secure Access"
      title={portalLabel}
      description="Sign in to manage applications, hiring activity, and account updates with confidence."
      sideTitle="Welcome back to your HHH Jobs account"
      sideDescription="Use a secure sign-in path to continue into the account experience that matches your role and goals."
      benefits={loginShellBenefits}
      balancedPanels
      panelClassName="w-full"
      sideClassName="w-full"
    >
      <div className="space-y-4">
        <AuthRoleTabs
          label="Social login role"
          helperText="Only student and retired accounts."
          value={socialRole}
          options={socialRoleOptions}
          onChange={setSocialRole}
          disabled={isSubmitting || Boolean(socialLoading)}
          compact
          showDescriptions={false}
        />

        <AuthSocialButtons
          onProviderClick={startSocialLogin}
          loading={socialLoading}
          disabled={isSubmitting || Boolean(socialLoading)}
          availableProviders={availableProviders}
          providersLoading={providersLoading}
        />

        {showLinkedInLocalHint ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            LinkedIn local sign-in needs an HTTPS callback URL, such as a tunnel URL, registered in the LinkedIn app Auth tab.
          </p>
        ) : null}

        {demoFallbacksEnabled ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Quick Access Preview</p>
              <p className="mt-1 text-sm text-slate-600">Choose a role-based preview account to explore the platform experience instantly.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {DEMO_ACCESS_ACCOUNTS.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy transition-colors hover:border-brand-400 hover:text-brand-700"
                  onClick={() => handleDemoAccess(account)}
                  disabled={isSubmitting || Boolean(socialLoading)}
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <AuthFormMessage>{error}</AuthFormMessage>

        <div className="my-5 flex items-center gap-4">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Or sign in with email</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <AuthInputField
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            disabled={isSubmitting || Boolean(socialLoading)}
          />

          <AuthPasswordField
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            disabled={isSubmitting || Boolean(socialLoading)}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((current) => !current)}
          />

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-navy px-6 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting || Boolean(socialLoading)}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div ref={retryActionsRef} className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
          <Link to="/forgot-password" className="text-brand-700 transition-colors hover:text-brand-800">
            Forgot password?
          </Link>
          <Link to="/sign-up" className="text-navy transition-colors hover:text-brand-700">
            Create account
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
};

export default LoginPage;
