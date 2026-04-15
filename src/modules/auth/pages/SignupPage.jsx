import { useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FiAward, FiBriefcase, FiCheckCircle, FiShield, FiUser } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AnimatedSection from '../../../shared/components/AnimatedSection';
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
import AuthPasswordField from '../components/AuthPasswordField';
import AuthSelectField from '../components/AuthSelectField';
import {
  countryCodeOptions,
  signupRoleOptions
} from '../config/authOptions';
import {
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
  role: 'student'
};

const getRoleFromSearch = (search = '') => {
  const roleParam = new URLSearchParams(search).get('role');
  const allowedRoles = new Set(['student', 'hr', 'retired_employee']);
  return allowedRoles.has(roleParam) ? roleParam : initialFormState.role;
};

const signupBenefitItems = [
  'Build your profile and get discovered faster.',
  'Receive updates relevant to your account type.',
  'Start with a cleaner, guided onboarding flow.'
];

const socialProviderMeta = {
  google: {
    label: 'Google',
    icon: FcGoogle
  }
};

const roleCardMeta = {
  student: {
    icon: FiUser,
    eyebrow: 'Candidate profile'
  },
  hr: {
    icon: FiBriefcase,
    eyebrow: 'Recruiter access'
  },
  retired_employee: {
    icon: FiAward,
    eyebrow: 'Experienced profile'
  }
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
      ? signupRoleOptions.filter((option) => option.value !== 'retired_employee')
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
          companyName: validateSignupField('companyName', nextForm.companyName, nextForm)
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
      password: validateSignupField('password', form.password, form)
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
      role: form.role
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
      setError('Employer / Recruiter accounts must use manual signup and login. Google sign-up is only for candidate and retired employee accounts.');
      return;
    }

    const companyNameError = validateSignupField('companyName', form.companyName, form);

    if (companyNameError) {
      setFieldErrors((current) => ({ ...current, companyName: companyNameError }));
      setError(companyNameError);
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
  const visibleSocialProviders = (Array.isArray(availableProviders) ? availableProviders : ['google'])
    .filter((provider) => provider === 'google');
  const roleGridClassName = visibleSignupRoleOptions.length === 1
    ? 'grid-cols-1'
    : visibleSignupRoleOptions.length === 2
      ? 'md:grid-cols-2'
      : 'md:grid-cols-3';
  const activeRoleMeta = roleCardMeta[form.role];
  const ActiveRoleIcon = activeRoleMeta?.icon || FiUser;

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f5f1e8] px-4 py-6 md:px-6 md:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.14),transparent_26%),radial-gradient(circle_at_100%_0%,rgba(15,23,42,0.06),transparent_28%),linear-gradient(180deg,#f6f1e8_0%,#fbfaf7_52%,#f6f8fb_100%)]" />

      <div className="relative mx-auto grid w-full max-w-[74rem] gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <AnimatedSection className="hidden lg:block lg:pt-10">
          <aside className="sticky top-8 mx-auto w-full max-w-[18rem] rounded-[2rem] border border-white/70 bg-[rgba(255,252,246,0.82)] p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="rounded-[1.6rem] border border-white/80 bg-white/80 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5efe1] text-navy">
                <ActiveRoleIcon size={22} />
              </div>
              <p className="mt-4 text-[0.76rem] font-semibold uppercase tracking-[0.22em] text-gold-dark">
                {activeRoleMeta?.eyebrow || 'Profile setup'}
              </p>
              <h2 className="mt-2 text-[1.3rem] font-semibold tracking-[-0.03em] text-slate-950">
                Account setup, without clutter
              </h2>
              <p className="mt-3 text-[0.92rem] leading-6 text-slate-500">
                Create the right HHH Jobs profile with a softer, cleaner registration flow.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {signupBenefitItems.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[1.15rem] border border-white/70 bg-white/75 px-4 py-3 text-[0.92rem] leading-6 text-slate-600">
                  <span className="mt-1 text-brand-600">
                    <FiCheckCircle size={16} />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </AnimatedSection>

        <AnimatedSection delay={0.06}>
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_24px_72px_rgba(15,23,42,0.09)] backdrop-blur md:p-8">
            <div className="max-w-[34rem]">
              <p className="text-[0.76rem] font-semibold uppercase tracking-[0.22em] text-gold-dark">Create your profile</p>
              <h1 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.04em] text-slate-950 md:text-[2.15rem]">
                Create your HHH Jobs profile
              </h1>
              <p className="mt-3 text-[0.95rem] leading-7 text-slate-500">
                Open the right account lane, finish the essentials, and move into your dashboard without a noisy form.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_176px]">
                <div className="space-y-4">
                  <AuthInputField
                    label="Full name"
                    type="text"
                    value={form.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    placeholder={form.role === 'hr' ? 'Enter contact person name' : 'What is your name?'}
                    disabled={isSubmitting || Boolean(socialLoading)}
                    error={fieldErrors.name}
                    className="!rounded-[1.1rem] !border-slate-200 !bg-[#f7f5ef] !px-4 !py-3.5 !text-[0.95rem] placeholder:!text-slate-400 focus:!border-gold/60 focus:!bg-white"
                  />

                  {form.role === 'hr' ? (
                    <AuthInputField
                      label="Company name"
                      type="text"
                      value={form.companyName}
                      onChange={(event) => handleChange('companyName', event.target.value)}
                      placeholder="Enter your company name"
                      disabled={isSubmitting || Boolean(socialLoading)}
                      error={fieldErrors.companyName}
                      helper="This helps us set up your recruiter workspace."
                      className="!rounded-[1.1rem] !border-slate-200 !bg-[#f7f5ef] !px-4 !py-3.5 !text-[0.95rem] placeholder:!text-slate-400 focus:!border-gold/60 focus:!bg-white"
                    />
                  ) : null}

                  <AuthInputField
                    label="Email ID"
                    type="email"
                    value={form.email}
                    onChange={(event) => handleChange('email', event.target.value)}
                    placeholder="Tell us your Email ID"
                    disabled={isSubmitting || Boolean(socialLoading)}
                    error={fieldErrors.email}
                    helper="We'll send relevant updates and verification to this email."
                    className="!rounded-[1.1rem] !border-slate-200 !bg-[#f7f5ef] !px-4 !py-3.5 !text-[0.95rem] placeholder:!text-slate-400 focus:!border-gold/60 focus:!bg-white"
                  />

                  <AuthPasswordField
                    label="Password"
                    value={form.password}
                    onChange={(event) => handleChange('password', event.target.value)}
                    placeholder="Create a secure password"
                    disabled={isSubmitting || Boolean(socialLoading)}
                    error={fieldErrors.password}
                    helper="This helps keep your account protected."
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword((current) => !current)}
                    className="!rounded-[1.1rem] !border-slate-200 !bg-[#f7f5ef] !px-4 !py-3.5 focus-within:!border-gold/60 focus-within:!bg-white"
                  />

                  <div className="grid gap-3 md:grid-cols-[148px_minmax(0,1fr)]">
                    <AuthSelectField
                      label="Country code"
                      value={form.countryCode}
                      onChange={(event) => handleCountryCodeChange(event.target.value)}
                      options={countryCodeOptions}
                      disabled={isSubmitting || Boolean(socialLoading)}
                      className="!rounded-[1.1rem] !border-slate-200 !bg-[#f7f5ef] !px-4 !py-3.5 !text-[0.95rem] focus:!border-gold/60 focus:!bg-white"
                    />
                    <AuthInputField
                      label="Mobile number"
                      type="tel"
                      inputMode="numeric"
                      value={form.mobile}
                      onChange={(event) => handleChange('mobile', event.target.value)}
                      placeholder={`Enter your ${selectedCountry.digits}-digit mobile number`}
                      disabled={isSubmitting || Boolean(socialLoading)}
                      error={fieldErrors.mobile}
                      helper="Recruiters and alerts can reach you on this number."
                      className="!rounded-[1.1rem] !border-slate-200 !bg-[#f7f5ef] !px-4 !py-3.5 !text-[0.95rem] placeholder:!text-slate-400 focus:!border-gold/60 focus:!bg-white"
                    />
                  </div>
                </div>

                <div className="lg:border-l lg:border-slate-200 lg:pl-6">
                  <div className="flex items-center gap-3 pb-4 lg:hidden">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span className="text-[0.76rem] font-semibold text-slate-400">Or</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>

                  <p className="text-[0.78rem] font-semibold text-gold-dark lg:pt-2">Continue with</p>

                  {isSocialSignupAllowed ? (
                    <div className="mt-3 space-y-2.5">
                      {providersLoading ? (
                        <p className="rounded-[1.1rem] border border-slate-200 bg-[#f8f6f1] px-3 py-3 text-[0.84rem] text-slate-500">
                          Loading social sign-up...
                        </p>
                      ) : visibleSocialProviders.length > 0 ? (
                        visibleSocialProviders.map((provider) => {
                          const meta = socialProviderMeta[provider];
                          if (!meta) return null;

                          const Icon = meta.icon;

                          return (
                            <button
                              key={provider}
                              type="button"
                              onClick={() => startSocialSignup(provider)}
                              disabled={isSubmitting || Boolean(socialLoading)}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2.5 text-[0.9rem] font-semibold text-navy shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:bg-[#fdf9ef] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {provider === 'google' ? <Icon size={18} /> : <Icon size={16} />}
                              <span>{socialLoading === provider ? 'Redirecting...' : meta.label}</span>
                            </button>
                          );
                        })
                      ) : (
                        <p className="rounded-[1.1rem] border border-slate-200 bg-[#f8f6f1] px-3 py-3 text-[0.84rem] text-slate-500">
                          Social sign-up is not available right now.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-[1.1rem] border border-slate-200 bg-[#f8f6f1] p-3 text-[0.84rem] leading-5 text-slate-600">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 text-brand-600">
                          <FiShield size={15} />
                        </span>
                        <span>Social sign-up is available for candidate and retired employee profiles.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <AuthFormMessage>{error}</AuthFormMessage>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.92rem] font-semibold text-slate-800">Account type</p>
                    <p className="mt-1 text-[0.8rem] text-slate-500">Choose the profile that matches your goal.</p>
                  </div>
                  {isLockedSignupLane ? (
                    <span className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[0.72rem] font-semibold text-gold-dark">
                      Preselected
                    </span>
                  ) : null}
                </div>

                <div className={`grid gap-3 ${roleGridClassName}`.trim()}>
                  {visibleSignupRoleOptions.map((option) => {
                    const isActive = form.role === option.value;
                    const meta = roleCardMeta[option.value];
                    const Icon = meta?.icon || FiUser;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleChange('role', option.value)}
                        disabled={isSubmitting || Boolean(socialLoading) || isLockedSignupLane}
                        className={`flex items-start justify-between gap-3 rounded-[1rem] border p-4 text-left transition-all ${
                          isActive
                            ? 'border-gold/25 bg-[#fbf6ea] shadow-[0_10px_24px_rgba(212,175,55,0.12)]'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-[#faf8f2]'
                        } ${(isSubmitting || Boolean(socialLoading) || isLockedSignupLane) ? 'cursor-not-allowed opacity-75' : ''}`.trim()}
                      >
                        <div>
                          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate-400">{meta?.eyebrow}</p>
                          <p className="mt-1 text-[0.98rem] font-semibold text-slate-900">{option.label}</p>
                          {option.description ? (
                            <p className="mt-1.5 text-[0.82rem] leading-5 text-slate-500">{option.description}</p>
                          ) : null}
                        </div>
                        <span className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          isActive ? 'bg-white text-gold-dark ring-1 ring-gold/20' : 'bg-slate-50 text-slate-500'
                        }`}>
                          <Icon size={18} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[1.15rem] border border-slate-200 bg-[#f8f6f1] px-4 py-3 text-[0.8rem] leading-6 text-slate-600">
                By creating your account, you agree to use HHH Jobs professionally and keep your details accurate for verification.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-[#172033] px-6 py-3 text-[0.95rem] font-semibold text-white shadow-[0_18px_36px_rgba(15,23,42,0.14)] transition-all hover:-translate-y-0.5 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting || Boolean(socialLoading)}
                >
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </button>

                <div className="text-[0.92rem] text-slate-500">
                  Already registered?{' '}
                  <Link to="/login" className="font-semibold text-navy transition-colors hover:text-gold-dark">
                    Sign in
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default SignupPage;
