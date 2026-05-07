import { useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FiBriefcase, FiCheck, FiUser } from 'react-icons/fi';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AnimatedSection from '../../../shared/components/AnimatedSection';
import { apiFetch, apiUrl, areDemoFallbacksEnabled, AUTH_REQUEST_TIMEOUT_MS } from '../../../utils/api';
import {
  beginPendingVerificationSession,
  getDashboardPathByRole,
  normalizeRedirectPath,
  setAuthSession
} from '../../../utils/auth';
import { createLocalSignupFallback } from '../../../utils/localAuthFallback';
import { PASSWORD_POLICY_HELPER } from '../../../utils/passwordPolicy';
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
  countryCodeOptions
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
  'Build your profile and let recruiters find you',
  'Get job postings delivered right to your email',
  'Find a job and grow your career'
];

const socialProviderMeta = {
  google: {
    label: 'Google',
    icon: FcGoogle
  }
};
const signupRoleButtons = [
  {
    label: 'Candidate',
    value: 'student',
    description: 'For job seekers',
    icon: FiUser
  },
  {
    label: 'Recruiters',
    value: 'hr',
    description: 'For hiring teams',
    icon: FiBriefcase
  }
];

const SignupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const roleParam = new URLSearchParams(location.search).get('role');
  const isCampusConnectSignup = roleParam === 'campus_connect';

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

  useEffect(() => {
    if (isCampusConnectSignup) return;

    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (!roleParam) return;

    const allowedRoles = new Set(['student', 'hr', 'retired_employee']);
    if (!allowedRoles.has(roleParam)) return;

    setForm((current) => ({ ...current, role: roleParam }));
  }, [isCampusConnectSignup, location.search]);

  useEffect(() => {
    if (isCampusConnectSignup) {
      setAvailableProviders([]);
      setProvidersLoading(false);
      return undefined;
    }

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
  }, [isCampusConnectSignup]);

  if (isCampusConnectSignup) {
    const redirectParam = new URLSearchParams(location.search).get('redirect');
    const nextSearch = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : '';
    return <Navigate to={`/campus-connect/register${nextSearch}`} replace />;
  }

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

  const handleRoleSelect = (role) => {
    const nextForm = {
      ...form,
      role
    };

    setForm(nextForm);
    setFieldErrors((current) => ({
      ...current,
      companyName: validateSignupField('companyName', nextForm.companyName, nextForm)
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
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f5f1e8] px-4 pb-6 pt-1 md:px-6 md:pb-8 md:pt-2">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.14),transparent_26%),radial-gradient(circle_at_100%_0%,rgba(15,23,42,0.06),transparent_28%),linear-gradient(180deg,#f6f1e8_0%,#fbfaf7_52%,#f6f8fb_100%)]" />

      <div className="relative mx-auto grid w-full max-w-[74rem] gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <div className="hidden lg:block">
          <aside className="sticky top-6 mx-auto w-full max-w-[16rem] max-h-[calc(100vh-3rem)] overflow-y-auto rounded-[1rem] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] xl:max-w-[17rem] xl:p-5">
            <div className="flex justify-center rounded-[1.3rem] bg-[#f6f8fe] px-4 py-5">
              <svg viewBox="0 0 220 160" className="h-[7.75rem] w-full max-w-[10.75rem]" aria-hidden="true">
                <circle cx="110" cy="78" r="59" fill="#eef1fb" />
                <path d="M54 31C61 48 79 52 91 42C100 35 100 22 93 14" stroke="#f55d3e" strokeWidth="10" strokeLinecap="round" />
                <path d="M168 33L180 26V40L168 33Z" fill="none" stroke="#1f2937" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M61 54H62" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
                <path d="M178 56H179" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
                <circle cx="100" cy="60" r="17" fill="#fff" stroke="#171c2d" strokeWidth="2" />
                <path d="M86 56C88 43 99 39 110 42C116 35 128 36 135 43C140 49 141 58 137 64C132 71 123 72 116 69C111 75 100 77 91 73C83 69 80 61 86 56Z" fill="#171c2d" />
                <circle cx="93" cy="60" r="4" fill="#171c2d" />
                <circle cx="107" cy="60" r="4" fill="#171c2d" />
                <path d="M104 59L115 52" stroke="#171c2d" strokeWidth="2" strokeLinecap="round" />
                <path d="M116 65C112 68 107 70 101 70C95 70 90 68 86 64" stroke="#171c2d" strokeWidth="2" strokeLinecap="round" />
                <path d="M92 79C82 86 78 95 78 111V132" stroke="#171c2d" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M107 79C118 87 124 99 127 112" stroke="#171c2d" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M78 111C96 98 114 98 129 110" stroke="#171c2d" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M126 89C137 96 145 104 152 116" stroke="#171c2d" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M152 116L160 100" stroke="#171c2d" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M149 121L164 128" stroke="#171c2d" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </div>

            <h2 className="mt-4 text-[1.55rem] font-semibold leading-[1.2] tracking-[-0.04em] text-slate-950">
              On registering, you can
            </h2>

            <div className="mt-4 space-y-3">
              {signupBenefitItems.map((item) => (
                <div key={item} className="flex items-start gap-2.5 text-[0.88rem] leading-7 text-slate-700">
                  <span className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#57b947] text-white">
                    <FiCheck size={10} />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <AnimatedSection delay={0.06}>
          <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-4 shadow-[0_24px_72px_rgba(15,23,42,0.09)] backdrop-blur sm:p-5 md:rounded-[2rem] md:p-8">
            <div className="max-w-[34rem]">
              <p className="text-[0.76rem] font-semibold uppercase tracking-[0.22em] text-gold-dark">Create your profile</p>
              <h1 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.04em] text-slate-950 md:text-[2.15rem]">
                Create your HHH Jobs profile
              </h1>
              <div className="mt-5">
                <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Choose profile type
                </p>
                <div className="inline-flex w-full flex-col gap-1.5">
                  <div className="inline-flex w-full flex-wrap gap-1.5 rounded-full border border-slate-200 bg-[linear-gradient(180deg,#fcfaf5_0%,#f7f3ea_100%)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:w-auto sm:flex-nowrap">
                    {signupRoleButtons.map((roleOption) => {
                      const isActive = form.role === roleOption.value;
                      const Icon = roleOption.icon;

                      return (
                        <button
                          key={roleOption.value}
                          type="button"
                          onClick={() => handleRoleSelect(roleOption.value)}
                          aria-pressed={isActive}
                          className={`inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[0.87rem] font-semibold transition-all duration-200 sm:min-w-[156px] ${
                            isActive
                              ? 'bg-[#172033] text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)]'
                              : 'bg-transparent text-slate-600 hover:bg-white hover:text-slate-950'
                          }`}
                        >
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                              isActive ? 'bg-white/12 text-gold-light' : 'bg-white/70 text-gold-dark'
                            }`}
                          >
                            <Icon size={13} />
                          </span>
                          <span>{roleOption.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="pl-1 text-[0.76rem] text-slate-500">
                    {signupRoleButtons.find((roleOption) => roleOption.value === form.role)?.description}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6 md:mt-8">
              <div className={`grid gap-6 ${isSocialSignupAllowed ? 'lg:grid-cols-[minmax(0,1fr)_160px] xl:grid-cols-[minmax(0,1fr)_176px]' : ''}`}>
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
                    className="!rounded-[1.1rem] !border-slate-200 !bg-[#f7f5ef] !px-4 !py-3.5 !text-[0.95rem] placeholder:!text-slate-400 focus:!border-gold/60 focus:!bg-white"
                  />

                  <AuthPasswordField
                    label="Password"
                    value={form.password}
                    onChange={(event) => handleChange('password', event.target.value)}
                    placeholder="Create a secure password"
                    disabled={isSubmitting || Boolean(socialLoading)}
                    error={fieldErrors.password}
                    helper={PASSWORD_POLICY_HELPER}
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
                      className="!rounded-[1.1rem] !border-slate-200 !bg-[#f7f5ef] !px-4 !py-3.5 !text-[0.95rem] placeholder:!text-slate-400 focus:!border-gold/60 focus:!bg-white"
                    />
                  </div>
                </div>

                {isSocialSignupAllowed ? (
                  <div className="relative lg:pl-10">
                    <div className="flex items-center gap-3 pb-4 lg:hidden">
                      <span className="h-px flex-1 bg-slate-200" />
                      <span className="text-[0.76rem] font-semibold text-slate-400">Or</span>
                      <span className="h-px flex-1 bg-slate-200" />
                    </div>

                    <span className="pointer-events-none hidden lg:block lg:absolute lg:bottom-6 lg:left-0 lg:top-6 lg:w-px lg:bg-slate-200" />
                    <span className="hidden lg:block lg:absolute lg:left-0 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:bg-white lg:px-1.5 lg:text-[1rem] lg:text-[#8c90b3]">
                      Or
                    </span>

                    <div className="mt-3 flex flex-col gap-3 lg:mt-0 lg:min-h-full lg:items-center lg:justify-center lg:pt-14">
                      <p className="text-[0.92rem] font-semibold text-slate-800 lg:text-[1.05rem]">Continue with</p>

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
                              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#2d67ff] bg-white px-5 py-2.5 text-[0.98rem] font-semibold text-[#2d67ff] transition-colors hover:bg-[#f7faff] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-[148px]"
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
                  </div>
                ) : null}
              </div>

              <AuthFormMessage>{error}</AuthFormMessage>

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
