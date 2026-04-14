import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiFetch, apiUrl, areDemoFallbacksEnabled, AUTH_REQUEST_TIMEOUT_MS } from '../../../utils/api';
import {
  beginPendingVerificationSession,
  getDashboardPathByRole,
  normalizeRedirectPath,
  setAuthSession
} from '../../../utils/auth';
import { createLocalSignupFallback } from '../../../utils/localAuthFallback';
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
import AuthSelectField from '../components/AuthSelectField';
import AuthSocialButtons from '../components/AuthSocialButtons';
import {
  casteOptions,
  countryCodeOptions,
  genderOptions,
  religionOptions,
  signupRoleOptions,
  signupShellBenefits
} from '../config/authOptions';
import {
  getMaxSignupDob,
  getSelectedCountry,
  validateSignupField
} from '../utils/signupValidation';

const initialFormState = {
  name: '',
  companyName: '',
  email: '',
  countryCode: '+91',
  mobile: '',
  password: '',
  role: 'student',
  dateOfBirth: '',
  gender: '',
  caste: '',
  religion: ''
};

const getRoleFromSearch = (search = '') => {
  const roleParam = new URLSearchParams(search).get('role');
  const allowedRoles = new Set(['student', 'hr', 'retired_employee']);
  return allowedRoles.has(roleParam) ? roleParam : initialFormState.role;
};

const SignupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({ ...initialFormState, role: getRoleFromSearch(location.search) }));
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [availableProviders, setAvailableProviders] = useState(null);
  const [providersLoading, setProvidersLoading] = useState(true);

  const redirectAfterSignupRaw = new URLSearchParams(location.search).get('redirect');
  const redirectAfterSignup = redirectAfterSignupRaw && redirectAfterSignupRaw.startsWith('/')
    ? redirectAfterSignupRaw
    : null;
  const requestedSignupRole = getRoleFromSearch(location.search);
  const isLockedSignupLane = requestedSignupRole === 'hr' || requestedSignupRole === 'retired_employee';
  const visibleSignupRoleOptions = requestedSignupRole === 'hr'
    ? signupRoleOptions.filter((option) => option.value === 'hr')
    : requestedSignupRole === 'student'
      ? signupRoleOptions.filter((option) => option.value !== 'hr')
      : requestedSignupRole === 'retired_employee'
        ? signupRoleOptions.filter((option) => option.value === 'retired_employee')
      : signupRoleOptions;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (!roleParam) return;

    const allowedRoles = new Set(['student', 'hr', 'retired_employee']);
    if (!allowedRoles.has(roleParam)) return;

    setForm((current) => ({ ...current, role: roleParam }));
  }, [location.search]);

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

  const handleChange = (key, value) => {
    let nextValue = value;

    if (key === 'name' || key === 'companyName') {
      nextValue = value.replace(/[^A-Za-z\s]/g, '');
    }

    if (key === 'mobile') {
      const selectedCountry = getSelectedCountry(form.countryCode);
      nextValue = value.replace(/\D/g, '').slice(0, selectedCountry.digits);
    }

    if (key === 'email') {
      nextValue = value.trimStart();
    }

    const nextForm = { ...form, [key]: nextValue };
    setForm(nextForm);
    setFieldErrors((current) => ({
      ...current,
      [key]: validateSignupField(key, nextValue, nextForm),
      ...(key === 'role'
        ? {
          companyName: validateSignupField('companyName', nextForm.companyName, nextForm),
          dateOfBirth: validateSignupField('dateOfBirth', nextForm.dateOfBirth, nextForm)
        }
        : {})
    }));

    if (error) {
      setError('');
    }
  };

  const handleCountryCodeChange = (value) => {
    const selectedCountry = getSelectedCountry(value);
    const cleanedMobile = String(form.mobile || '').replace(/\D/g, '').slice(0, selectedCountry.digits);
    const nextForm = {
      ...form,
      countryCode: value,
      mobile: cleanedMobile
    };

    setForm(nextForm);
    setFieldErrors((current) => ({
      ...current,
      mobile: validateSignupField('mobile', cleanedMobile, nextForm)
    }));

    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    const errors = {
      name: validateSignupField('name', form.name, form),
      companyName: validateSignupField('companyName', form.companyName, form),
      email: validateSignupField('email', form.email, form),
      mobile: validateSignupField('mobile', form.mobile, form),
      password: validateSignupField('password', form.password, form),
      dateOfBirth: validateSignupField('dateOfBirth', form.dateOfBirth, form)
    };

    setFieldErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const buildSignupUser = (payload) => {
    const hrEmployerId = form.role === 'hr'
      ? generateHrEmployerId({ companyName: form.companyName, mobile: form.mobile })
      : '';
    const studentCandidateId = form.role === 'student'
      ? generateStudentCandidateId({ name: form.name, mobile: form.mobile })
      : '';
    const retiredEmployeeId = form.role === 'retired_employee'
      ? generateRetiredEmployeeId({ name: form.name, mobile: form.mobile })
      : '';

    if (form.role === 'hr') {
      return { ...payload.user, companyName: form.companyName, hrEmployerId };
    }

    if (form.role === 'student') {
      return { ...payload.user, studentCandidateId };
    }

    if (form.role === 'retired_employee') {
      return { ...payload.user, retiredEmployeeId };
    }

    return payload.user;
  };

  const shouldUseLocalSignupFallback = (response, payload) => {
    if (!areDemoFallbacksEnabled()) return false;
    if (!response || response.status < 500) return false;

    const message = String(payload?.message || '').toLowerCase();
    return (
      !message
      || message.includes('gmail')
      || message.includes('smtp')
      || message.includes('otp email')
      || message.includes('login failed')
      || message.includes('authentication')
    );
  };

  const redirectToOtpVerification = ({ email, emailWarning = '' }) => {
    beginPendingVerificationSession({ email, emailWarning });
    navigate('/verify-otp', {
      state: { email, emailWarning },
      replace: true
    });
  };

  const completeLocalSignupFallback = (signupPayload, fallbackMessage = '') => {
    try {
      const payload = createLocalSignupFallback(signupPayload);
      redirectToOtpVerification({
        email: form.email,
        emailWarning: fallbackMessage
      });
      return;
    } catch (error) {
      const message = String(error?.message || '').toLowerCase();
      if (!message.includes('email already registered')) {
        throw error;
      }
    }

    redirectToOtpVerification({
      email: form.email,
      emailWarning: fallbackMessage || 'Your account may already have been created. Enter the OTP if you received it, or resend OTP from the next screen.'
    });
  };

  const readResponsePayload = async (response) => {
    const contentType = response.headers.get('content-type') || '';

    try {
      if (contentType.includes('application/json')) {
        return await response.json();
      }

      const text = await response.text();
      return text ? { message: text } : {};
    } catch (error) {
      return {};
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!validateForm()) {
      setError('Please fix the highlighted fields.');
      return;
    }

    const fullMobile = `${form.countryCode}${form.mobile}`;
    const signupPayload = {
      name: form.name.trim(),
      companyName: form.companyName.trim(),
      email: form.email.trim(),
      mobile: fullMobile,
      password: form.password,
      role: form.role,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      caste: form.caste,
      religion: form.religion
    };

    try {
      setIsSubmitting(true);
      const response = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupPayload),
        timeoutMs: AUTH_REQUEST_TIMEOUT_MS
      });
      const payload = await readResponsePayload(response);

      if (!response.ok) {
        if (shouldUseLocalSignupFallback(response, payload)) {
          completeLocalSignupFallback(signupPayload, payload.message || 'Signup email delivery is unavailable right now. A local OTP has been generated for this session.');
          return;
        }

        setError(payload.message || 'Unable to create account.');
        return;
      }

      if (payload.requiresOtpVerification) {
        redirectToOtpVerification({
          email: form.email,
          emailWarning: payload.emailWarning || ''
        });
        return;
      }

      if (payload.alreadyRegistered) {
        navigate('/login', {
          replace: true,
          state: {
            signupMessage: payload.message || 'Email already registered. Please login instead.'
          }
        });
        return;
      }

      if (payload.roleConflict) {
        setError(payload.message || 'This email is already pending verification with a different role.');
        return;
      }

      const nextUser = buildSignupUser(payload);
      setAuthSession(payload.token, nextUser);

      const fallbackRedirect = payload.redirectTo || getDashboardPathByRole(nextUser?.role);
      const nextPath = nextUser?.role === 'retired_employee' && redirectAfterSignup
        ? redirectAfterSignup
        : fallbackRedirect;

      navigate(normalizeRedirectPath(nextPath, nextUser?.role), { replace: true });
    } catch (requestError) {
      if (areDemoFallbacksEnabled()) {
        try {
          completeLocalSignupFallback(signupPayload);
          return;
        } catch (fallbackError) {
          setError(
            fallbackError.message
            || requestError.message
            || 'Signup service unavailable. Please try again.'
          );
          return;
        }
      }

      setError(requestError.message || 'Signup service unavailable. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startSocialSignup = (provider) => {
    setError('');

    if (form.role === 'hr') {
      setError('HR accounts must use manual signup and login. Google and LinkedIn are only for student and retired employee accounts.');
      return;
    }

    const companyNameError = validateSignupField('companyName', form.companyName, form);
    const dateOfBirthError = validateSignupField('dateOfBirth', form.dateOfBirth, form);

    if (companyNameError) {
      setFieldErrors((current) => ({ ...current, companyName: companyNameError }));
      setError(companyNameError);
      return;
    }

    if (dateOfBirthError) {
      setFieldErrors((current) => ({ ...current, dateOfBirth: dateOfBirthError }));
      setError(dateOfBirthError);
      return;
    }

    setSocialLoading(provider);
    const endpoint = new URL(apiUrl(`/auth/oauth/${provider}/start`));
    endpoint.searchParams.set('role', form.role);
    endpoint.searchParams.set('clientUrl', window.location.origin);
    window.location.assign(endpoint.toString());
  };

  const selectedCountry = getSelectedCountry(form.countryCode);
  const isSocialSignupAllowed = form.role === 'student' || form.role === 'retired_employee';
  const maxSignupDob = getMaxSignupDob();

  return (
    <AuthPageShell
      eyebrow="Create Account"
      title="Register for HHH Jobs"
      description="Create the account that matches your hiring or career goals and start with a clear, guided registration flow."
      sideTitle="Build your HHH Jobs account with confidence"
      sideDescription="Choose the role that fits you, complete a straightforward setup, and begin applying, hiring, or exploring new opportunities."
      benefits={signupShellBenefits}
      balancedPanels
      lockBalancedHeight={false}
      compactHeader
      panelClassName="w-full !p-3.5 md:!p-4"
      sideClassName="w-full !gap-3 !p-4"
    >
      <div className="flex h-full flex-col gap-2.5">
        <div className="space-y-2.5">
            <AuthRoleTabs
              label="Account type"
              helperText=""
              value={form.role}
              options={visibleSignupRoleOptions}
              onChange={(value) => handleChange('role', value)}
              disabled={isSubmitting || Boolean(socialLoading) || isLockedSignupLane}
              compact
              showDescriptions={false}
            />

          {isSocialSignupAllowed ? (
            <AuthSocialButtons
              onProviderClick={startSocialSignup}
              loading={socialLoading}
              disabled={isSubmitting || Boolean(socialLoading)}
              availableProviders={availableProviders}
              providersLoading={providersLoading}
              compact
            />
          ) : (
            <AuthFormMessage tone="info">
              Recruiter accounts are created through the manual form below.
            </AuthFormMessage>
          )}

          <AuthFormMessage>{error}</AuthFormMessage>

          <div className="my-0.5 flex items-center gap-2.5">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Manual signup</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-2.5">
          <div className="space-y-2.5">
            <div className={`grid gap-2.5 ${form.role === 'hr' ? 'md:grid-cols-2' : ''}`}>
              <AuthInputField
                label="Name"
                type="text"
                value={form.name}
                onChange={(event) => handleChange('name', event.target.value)}
                placeholder="Enter full name"
                disabled={isSubmitting || Boolean(socialLoading)}
                error={fieldErrors.name}
                className="py-1"
              />

              {form.role === 'hr' ? (
                <AuthInputField
                  label="Company Name"
                  type="text"
                  value={form.companyName}
                  onChange={(event) => handleChange('companyName', event.target.value)}
                  placeholder="Enter company name"
                  disabled={isSubmitting || Boolean(socialLoading)}
                  error={fieldErrors.companyName}
                  className="py-1"
                />
              ) : null}
            </div>

            <div className="grid gap-2.5 md:grid-cols-[170px_minmax(0,1fr)]">
              <AuthSelectField
                label="Country Code"
                value={form.countryCode}
                onChange={(event) => handleCountryCodeChange(event.target.value)}
                options={countryCodeOptions}
                disabled={isSubmitting || Boolean(socialLoading)}
                className="py-1.5"
              />
              <AuthInputField
                label="Mobile"
                type="tel"
                inputMode="numeric"
                value={form.mobile}
                onChange={(event) => handleChange('mobile', event.target.value)}
                placeholder={`Enter ${selectedCountry.digits}-digit mobile`}
                disabled={isSubmitting || Boolean(socialLoading)}
                error={fieldErrors.mobile}
                className="py-1"
              />
            </div>

            <div className="grid gap-2.5 md:grid-cols-2">
              <AuthInputField
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => handleChange('email', event.target.value)}
                placeholder="Enter email address"
                disabled={isSubmitting || Boolean(socialLoading)}
                error={fieldErrors.email}
                className="py-1"
              />

              <AuthPasswordField
                label="Password"
                value={form.password}
                onChange={(event) => handleChange('password', event.target.value)}
                placeholder="Enter password"
                disabled={isSubmitting || Boolean(socialLoading)}
                error={fieldErrors.password}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((current) => !current)}
                className="py-1"
              />
            </div>

            {form.role !== 'hr' ? (
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-[0.92rem] font-semibold text-navy">Profile metadata</p>
                <div className="mt-2 grid gap-2.5 md:grid-cols-2">
                  <AuthInputField
                    label="Date of Birth"
                    type="date"
                    value={form.dateOfBirth}
                    max={maxSignupDob}
                    onChange={(event) => handleChange('dateOfBirth', event.target.value)}
                    disabled={isSubmitting || Boolean(socialLoading)}
                    error={fieldErrors.dateOfBirth}
                    helper={form.role === 'retired_employee' ? 'Retired employee registration requires age 60+.' : 'Minimum age for registration is 16 years.'}
                    className="py-1"
                  />

                  <AuthSelectField
                    label="Gender"
                    value={form.gender}
                    onChange={(event) => handleChange('gender', event.target.value)}
                    options={genderOptions}
                    disabled={isSubmitting || Boolean(socialLoading)}
                    className="py-1.5"
                  />

                  <AuthSelectField
                    label="Caste"
                    value={form.caste}
                    onChange={(event) => handleChange('caste', event.target.value)}
                    options={casteOptions}
                    disabled={isSubmitting || Boolean(socialLoading)}
                    className="py-1.5"
                  />

                  <AuthSelectField
                    label="Religion"
                    value={form.religion}
                    onChange={(event) => handleChange('religion', event.target.value)}
                    options={religionOptions}
                    disabled={isSubmitting || Boolean(socialLoading)}
                    className="py-1.5"
                  />
                </div>
              </div>
            ) : null}

          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full gradient-gold px-6 py-1.5 text-[0.92rem] font-semibold text-primary shadow-lg shadow-gold/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting || Boolean(socialLoading)}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="flex items-center justify-start pt-1 text-sm font-semibold">
          <Link to="/login" className="text-brand-700 transition-colors hover:text-brand-800">
            Already have an account?
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
};

export default SignupPage;
