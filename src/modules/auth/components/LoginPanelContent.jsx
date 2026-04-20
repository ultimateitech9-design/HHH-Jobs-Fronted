import { useEffect, useRef, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FiX } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiFetch, apiUrl, areDemoFallbacksEnabled, AUTH_REQUEST_TIMEOUT_MS } from '../../../utils/api';
import {
  beginPendingVerificationSession,
  clearAuthSession,
  getDashboardPathByRole,
  isRedirectPathAllowedForRole,
  normalizeRedirectPath,
  setAuthSession
} from '../../../utils/auth';
import {
  findManagedAccountByEmail,
  updateManagedAccountLogin
} from '../../../utils/managedUsers';
import {
  generateHrEmployerId,
  generateRetiredEmployeeId,
  generateStudentCandidateId
} from '../../../utils/hrIdentity';
import AuthFormMessage from './AuthFormMessage';
import { calculateAge } from '../utils/signupValidation';

const tryManagedAccountLogin = ({ email, password, navigate, redirectTo, setError }) => {
  const managedAccount = findManagedAccountByEmail(email);
  if (!managedAccount || managedAccount.password !== password) return false;

  if (!isRedirectPathAllowedForRole(redirectTo, managedAccount.role)) {
    setError?.(`This ID is not allowed for the selected portal. Use the ${managedAccount.role} account on its assigned dashboard.`);
    return true;
  }

  const nextUser = updateManagedAccountLogin(managedAccount.id) || managedAccount;
  setAuthSession(`managed-${nextUser.id}`, nextUser);
  navigate(normalizeRedirectPath(redirectTo || getDashboardPathByRole(nextUser?.role), nextUser?.role), { replace: true });
  return true;
};

const normalizeLoginErrorMessage = (message = '') => {
  const normalizedMessage = String(message || '').trim();
  if (!normalizedMessage) return 'Wrong ID or password.';

  const lower = normalizedMessage.toLowerCase();
  if (
    lower.includes('invalid email or password')
    || lower.includes('invalid credentials')
    || lower.includes('wrong password')
  ) {
    return 'Wrong ID or password.';
  }

  return normalizedMessage;
};

const LoginPanelContent = ({
  portalLabel = 'Login',
  description = '',
  defaultRedirectPath = '',
  allowSocialLogin = true,
  socialRole = 'student',
  showCreateAccount = true,
  createAccountPath = '/sign-up',
  createAccountLabel = 'Create account',
  showOtpLogin = true,
  emailLabel = 'Email ID / Username',
  emailPlaceholder = 'Enter your active Email ID / Username',
  passwordPlaceholder = 'Enter your password',
  showHeader = false,
  onRequestClose
}) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const retryActionsRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || defaultRedirectPath || null;
  const demoFallbacksEnabled = areDemoFallbacksEnabled();

  useEffect(() => {
    const oauthError = new URLSearchParams(location.search).get('oauth_error');
    if (oauthError) {
      setError(oauthError);
    }
  }, [location.search]);

  useEffect(() => {
    const signupMessage = String(location.state?.signupMessage || '').trim();
    if (signupMessage) {
      setError(signupMessage);
    }
  }, [location.state]);

  useEffect(() => {
    if (!error || !retryActionsRef.current) return;

    retryActionsRef.current.scrollIntoView({
      block: 'nearest',
      inline: 'nearest'
    });
  }, [error]);

  const redirectToOtpVerification = ({ email, emailWarning = '' }) => {
    beginPendingVerificationSession({ email, emailWarning });
    navigate('/verify-otp', {
      state: { email, emailWarning },
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
        body: JSON.stringify(form),
        skipAuth: true,
        timeoutMs: AUTH_REQUEST_TIMEOUT_MS
      });
      let payload = {};
      try {
        payload = await response.json();
      } catch {
        payload = {};
      }

      if (payload.requiresOtpVerification) {
        redirectToOtpVerification({
          email: form.email,
          emailWarning: payload.emailWarning || ''
        });
        return;
      }

      if (!response.ok) {
        clearAuthSession();
        setError(normalizeLoginErrorMessage(payload.message || 'Login failed.'));
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

      if (!isRedirectPathAllowedForRole(redirectTo, nextUser?.role)) {
        clearAuthSession();
        setError('Wrong ID or password.');
        return;
      }

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

  const fieldClassName = 'mt-2 w-full rounded-[1.15rem] border border-slate-200 bg-[#f7f5ef] px-4 py-3.5 text-[15px] leading-6 text-navy outline-none transition-all placeholder:text-slate-400 focus:border-gold/60 focus:bg-white focus:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]';

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.22em] text-gold-dark">Secure access</p>
          <h1 className="mt-2 font-heading text-[1.85rem] font-semibold tracking-[-0.04em] text-slate-950">{portalLabel}</h1>
        </div>

        <div className="flex items-center gap-2">
          {showHeader && onRequestClose ? (
            <button
              type="button"
              onClick={onRequestClose}
              className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-gold/10 hover:text-navy"
              aria-label="Close login panel"
            >
              <FiX size={20} />
            </button>
          ) : null}
        </div>
      </div>

      <AuthFormMessage>{error}</AuthFormMessage>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-[0.98rem] font-semibold text-slate-800">{emailLabel}</label>
          <input
            type="email"
            placeholder={emailPlaceholder}
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            disabled={isSubmitting || Boolean(socialLoading)}
            className={fieldClassName}
          />
        </div>

        <div>
          <label className="text-[0.98rem] font-semibold text-slate-800">Password</label>
          <div className="mt-2 flex items-center rounded-[1.15rem] border border-slate-200 bg-[#f7f5ef] px-4 py-3.5 transition-all focus-within:border-gold/60 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={passwordPlaceholder}
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              disabled={isSubmitting || Boolean(socialLoading)}
              className="min-w-0 flex-1 bg-transparent text-[15px] leading-6 text-navy outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="shrink-0 text-[0.95rem] font-semibold text-gold-dark transition-colors hover:text-navy"
              disabled={isSubmitting || Boolean(socialLoading)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-full bg-[#172033] px-6 py-3.5 text-[1rem] font-semibold text-white shadow-[0_18px_36px_rgba(15,23,42,0.14)] transition-all hover:-translate-y-0.5 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting || Boolean(socialLoading)}
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-1 text-[0.92rem] font-semibold">
          <Link to="/forgot-password" className="text-gold-dark transition-colors hover:text-navy">
            Forgot password?
          </Link>
          {showCreateAccount ? (
            <Link to={createAccountPath} className="text-navy transition-colors hover:text-gold-dark">
              {createAccountLabel}
            </Link>
          ) : null}
        </div>
      </form>

      <div ref={retryActionsRef} className="space-y-4 text-center">
        {showOtpLogin ? (
          <Link to="/forgot-password" className="inline-flex justify-center text-[0.98rem] font-semibold text-navy transition-colors hover:text-gold-dark">
            Use OTP to sign in
          </Link>
        ) : null}

        {allowSocialLogin ? (
          <>
            <div className="flex items-center gap-3 text-[0.9rem] text-slate-400">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/35 to-slate-200" />
              <span>Or continue with</span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold/35 to-slate-200" />
            </div>

            <button
              type="button"
              onClick={() => startSocialLogin('google')}
              disabled={isSubmitting || Boolean(socialLoading)}
              className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3 text-[1rem] font-semibold text-navy shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:bg-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <FcGoogle size={22} />
              <span>{socialLoading === 'google' ? 'Redirecting...' : 'Continue with Google'}</span>
            </button>
          </>
        ) : (
          <div className="rounded-[1.15rem] border border-slate-200 bg-[#f8f6f1] px-4 py-3 text-left text-[0.88rem] leading-6 text-slate-500">
            This portal uses secure email-and-password access only.
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPanelContent;
