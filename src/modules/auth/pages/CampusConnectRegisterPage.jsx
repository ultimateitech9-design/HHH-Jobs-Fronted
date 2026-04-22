import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiShield, FiUsers } from 'react-icons/fi';
import AnimatedSection from '../../../shared/components/AnimatedSection';
import { apiFetch, areDemoFallbacksEnabled, AUTH_REQUEST_TIMEOUT_MS } from '../../../utils/api';
import { beginPendingVerificationSession } from '../../../utils/auth';
import AuthFormMessage from '../components/AuthFormMessage';
import AuthInputField from '../components/AuthInputField';
import AuthPasswordField from '../components/AuthPasswordField';
import AuthSelectField from '../components/AuthSelectField';
import { countryCodeOptions } from '../config/authOptions';
import { getSelectedCountry } from '../utils/signupValidation';
import { PASSWORD_POLICY_HELPER } from '../../../utils/passwordPolicy';

const initialFormState = {
  collegeName: '',
  placementOfficerName: '',
  email: '',
  contactEmail: '',
  countryCode: '+91',
  mobile: '',
  city: '',
  state: '',
  affiliation: '',
  establishedYear: '',
  website: '',
  about: '',
  password: ''
};

const textOnlyRegex = /^[A-Za-z\s]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const institutionNameRegex = /^[A-Za-z0-9&(),.'/\-\s]+$/;
const websiteRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

const formHighlights = [
  'Create one verified access point for your placement cell.',
  'Start with college details already seeded into the campus profile.',
  'Continue into student records, drives, and company connections after OTP verification.'
];

const validateCampusField = (key, value, nextForm) => {
  switch (key) {
    case 'collegeName': {
      const text = String(value || '').trim();
      if (!text) return 'College or university name is required.';
      if (text.length < 3) return 'College name must be at least 3 characters.';
      if (!institutionNameRegex.test(text)) return 'Use letters, numbers, and standard punctuation only.';
      return '';
    }

    case 'placementOfficerName': {
      const text = String(value || '').trim();
      if (!text) return 'Placement officer name is required.';
      if (!textOnlyRegex.test(text)) return 'Placement officer name should contain only letters and spaces.';
      return '';
    }

    case 'email':
    case 'contactEmail': {
      const text = String(value || '').trim();
      if (key === 'email' && !text) return 'Campus email is required.';
      if (text && !emailRegex.test(text)) return 'Enter a valid email address.';
      return '';
    }

    case 'mobile': {
      const selectedCountry = getSelectedCountry(nextForm.countryCode);
      const mobileValue = String(value || '').trim();
      if (!mobileValue) return 'Mobile number is required.';
      if (!/^\d+$/.test(mobileValue)) return 'Mobile number should contain only digits.';
      if (mobileValue.length !== selectedCountry.digits) {
        return `Mobile number must be exactly ${selectedCountry.digits} digits for ${selectedCountry.label}.`;
      }
      return '';
    }

    case 'city':
    case 'state': {
      const text = String(value || '').trim();
      if (!text) return `${key === 'city' ? 'City' : 'State'} is required.`;
      if (!institutionNameRegex.test(text)) return 'Use letters and standard punctuation only.';
      return '';
    }

    case 'affiliation': {
      const text = String(value || '').trim();
      if (!text) return 'Affiliation or university is required.';
      if (!institutionNameRegex.test(text)) return 'Use letters, numbers, and standard punctuation only.';
      return '';
    }

    case 'establishedYear': {
      const text = String(value || '').trim();
      if (!text) return 'Established year is required.';
      if (!/^\d{4}$/.test(text)) return 'Enter a valid 4-digit year.';
      const year = Number(text);
      const currentYear = new Date().getFullYear();
      if (year < 1800 || year > currentYear) return `Year must be between 1800 and ${currentYear}.`;
      return '';
    }

    case 'website': {
      const text = String(value || '').trim();
      if (!text) return 'Website is required.';
      if (!websiteRegex.test(text)) return 'Enter a valid website URL starting with http:// or https://.';
      return '';
    }

    case 'about': {
      const text = String(value || '').trim();
      if (!text) return 'College overview is required.';
      if (text.length < 40) return 'Please add a slightly fuller college overview.';
      return '';
    }

    case 'password':
      return PASSWORD_POLICY_HELPER && String(value || '').trim()
        ? ''
        : '';

    default:
      return '';
  }
};

const validatePasswordField = (value) => {
  const password = String(value || '');
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include a letter, a number, and a special symbol.';
  }
  return '';
};

const readResponsePayload = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      return await response.json();
    }

    const text = await response.text();
    return text ? { message: text } : {};
  } catch {
    return {};
  }
};

const CampusConnectRegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(initialFormState);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const redirectAfterSignupRaw = new URLSearchParams(location.search).get('redirect');
  const redirectAfterSignup = redirectAfterSignupRaw && redirectAfterSignupRaw.startsWith('/')
    ? redirectAfterSignupRaw
    : '/portal/campus-connect/dashboard';

  const selectedCountry = useMemo(() => getSelectedCountry(form.countryCode), [form.countryCode]);

  const handleChange = (key, value) => {
    let nextValue = value;

    if (key === 'placementOfficerName') {
      nextValue = value.replace(/[^A-Za-z\s]/g, '');
    }

    if (key === 'mobile') {
      nextValue = value.replace(/\D/g, '').slice(0, selectedCountry.digits);
    }

    const nextForm = { ...form, [key]: nextValue };
    setForm(nextForm);
    setFieldErrors((current) => ({
      ...current,
      [key]: key === 'password' ? validatePasswordField(nextValue) : validateCampusField(key, nextValue, nextForm)
    }));

    if (error) setError('');
  };

  const handleCountryCodeChange = (value) => {
    const nextCountry = getSelectedCountry(value);
    const cleanedMobile = String(form.mobile || '').replace(/\D/g, '').slice(0, nextCountry.digits);
    const nextForm = {
      ...form,
      countryCode: value,
      mobile: cleanedMobile
    };

    setForm(nextForm);
    setFieldErrors((current) => ({
      ...current,
      mobile: validateCampusField('mobile', cleanedMobile, nextForm)
    }));

    if (error) setError('');
  };

  const validateStep1 = () => {
    const errors = {
      collegeName: validateCampusField('collegeName', form.collegeName, form),
      placementOfficerName: validateCampusField('placementOfficerName', form.placementOfficerName, form),
      email: validateCampusField('email', form.email, form),
      contactEmail: validateCampusField('contactEmail', form.contactEmail, form),
      mobile: validateCampusField('mobile', form.mobile, form),
      password: validatePasswordField(form.password)
    };
    setFieldErrors((current) => ({ ...current, ...errors }));
    return !Object.values(errors).some(Boolean);
  };

  const validateStep2 = () => {
    const errors = {
      city: validateCampusField('city', form.city, form),
      state: validateCampusField('state', form.state, form),
      affiliation: validateCampusField('affiliation', form.affiliation, form),
      establishedYear: validateCampusField('establishedYear', form.establishedYear, form),
      website: validateCampusField('website', form.website, form),
      about: validateCampusField('about', form.about, form)
    };
    setFieldErrors((current) => ({ ...current, ...errors }));
    return !Object.values(errors).some(Boolean);
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError('Please fix the highlighted fields to continue.');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateForm = () => {
    return validateStep1() && validateStep2();
  };

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

    if (!validateForm()) {
      setError('Please fix the highlighted campus registration fields.');
      return;
    }

    const signupPayload = {
      name: form.collegeName.trim(),
      email: form.email.trim(),
      mobile: `${form.countryCode}${form.mobile}`,
      password: form.password,
      role: 'campus_connect',
      placementOfficerName: form.placementOfficerName.trim(),
      contactEmail: (form.contactEmail || form.email).trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      affiliation: form.affiliation.trim(),
      establishedYear: form.establishedYear.trim(),
      website: form.website.trim(),
      about: form.about.trim(),
      redirect: redirectAfterSignup
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
        setError(payload.message || 'Unable to register this campus right now.');
        return;
      }

      if (payload.alreadyRegistered) {
        navigate('/management/login/campus-connect', {
          replace: true,
          state: {
            signupMessage: payload.message || 'Campus account already exists. Please sign in.'
          }
        });
        return;
      }

      if (payload.roleConflict) {
        setError(payload.message || 'This email is already pending verification with a different role.');
        return;
      }

      if (payload.requiresOtpVerification) {
        redirectToOtpVerification({
          email: form.email,
          emailWarning: payload.emailWarning || ''
        });
        return;
      }

      setError(payload.message || 'Campus registration needs OTP verification before access.');
    } catch (requestError) {
      if (areDemoFallbacksEnabled()) {
        setError('Campus registration requires the backend signup service. Please verify the auth API is running.');
      } else {
        setError(requestError.message || 'Campus registration service unavailable. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-brand-50/30 px-4 py-6 pt-24 md:px-6 md:py-8 md:pt-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.08),transparent_40%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.04),transparent_40%)]" />

      <div className="relative mx-auto w-full max-w-3xl">

        <AnimatedSection delay={0.06}>
          <div className="rounded-[2rem] border border-slate-200/60 bg-white/60 p-6 shadow-[0_8px_32px_rgba(15,23,42,0.04)] backdrop-blur-xl md:p-8">
            <div className="max-w-[42rem]">
              <p className="text-[0.76rem] font-semibold uppercase tracking-[0.24em] text-brand-600">Institution Registration</p>
              <h2 className="mt-2 font-heading text-[1.95rem] font-bold text-navy md:text-[2.4rem]">
                Create your Campus Connect account
              </h2>
              <p className="mt-3 max-w-[38rem] text-sm leading-7 text-slate-500">
                Register the institution first. We will use these details to seed your college profile so your placement team can continue with less setup after verification.
              </p>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${currentStep === 1 ? 'bg-navy text-white' : 'bg-brand-50 text-brand-700'}`}>1</span>
                  <span className={`text-sm font-semibold ${currentStep === 1 ? 'text-navy' : 'text-slate-500'}`}>Account Setup</span>
                </div>
                <div className="h-px w-8 bg-slate-200"></div>
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${currentStep === 2 ? 'bg-navy text-white' : 'bg-slate-100 text-slate-400'}`}>2</span>
                  <span className={`text-sm font-semibold ${currentStep === 2 ? 'text-navy' : 'text-slate-400'}`}>Campus Profile</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {currentStep === 1 && (
                <AnimatedSection>
                  <div className="grid gap-4 md:grid-cols-2">
                <AuthInputField
                  label="College / University Name"
                  type="text"
                  value={form.collegeName}
                  onChange={(event) => handleChange('collegeName', event.target.value)}
                  placeholder="e.g. Mangalmay Institute of Engineering"
                  disabled={isSubmitting}
                  error={fieldErrors.collegeName}
                  className="!rounded-[1.1rem] !border-slate-200 !bg-white/80 !px-4 !py-3.5 !text-[0.95rem] focus:!border-brand-300 focus:!bg-white"
                />

                <AuthInputField
                  label="Placement Officer Name"
                  type="text"
                  value={form.placementOfficerName}
                  onChange={(event) => handleChange('placementOfficerName', event.target.value)}
                  placeholder="e.g. Rakesh Sharma"
                  disabled={isSubmitting}
                  error={fieldErrors.placementOfficerName}
                  className="!rounded-[1.1rem] !border-slate-200 !bg-white/80 !px-4 !py-3.5 !text-[0.95rem] focus:!border-brand-300 focus:!bg-white"
                />

                <AuthInputField
                  label="Campus Login Email"
                  type="email"
                  value={form.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  placeholder="placements@college.edu"
                  disabled={isSubmitting}
                  error={fieldErrors.email}
                  className="!rounded-[1.1rem] !border-slate-200 !bg-white/80 !px-4 !py-3.5 !text-[0.95rem] focus:!border-brand-300 focus:!bg-white"
                />

                <AuthInputField
                  label="Contact Email"
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => handleChange('contactEmail', event.target.value)}
                  placeholder="Optional if same as login email"
                  disabled={isSubmitting}
                  error={fieldErrors.contactEmail}
                  helper="This is shown inside the college profile."
                  className="!rounded-[1.1rem] !border-slate-200 !bg-white/80 !px-4 !py-3.5 !text-[0.95rem] focus:!border-brand-300 focus:!bg-white"
                />

                <div className="grid gap-3 md:col-span-2 md:grid-cols-[160px_minmax(0,1fr)]">
                  <AuthSelectField
                    label="Country code"
                    value={form.countryCode}
                    onChange={(event) => handleCountryCodeChange(event.target.value)}
                    options={countryCodeOptions}
                    disabled={isSubmitting}
                    className="!rounded-[1.1rem] !border-slate-200 !bg-white/80 !px-4 !py-3.5 !text-[0.95rem] focus:!border-brand-300 focus:!bg-white"
                  />

                  <AuthInputField
                    label="Contact Phone"
                    type="tel"
                    inputMode="numeric"
                    value={form.mobile}
                    onChange={(event) => handleChange('mobile', event.target.value)}
                    placeholder={`Enter ${selectedCountry.digits}-digit mobile number`}
                    disabled={isSubmitting}
                    error={fieldErrors.mobile}
                    className="!rounded-[1.1rem] !border-slate-200 !bg-white/80 !px-4 !py-3.5 !text-[0.95rem] focus:!border-brand-300 focus:!bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <AuthPasswordField
                    label="Password"
                    value={form.password}
                    onChange={(event) => handleChange('password', event.target.value)}
                    placeholder="Create a secure password"
                    disabled={isSubmitting}
                    error={fieldErrors.password}
                    helper={PASSWORD_POLICY_HELPER}
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword((current) => !current)}
                    className="!rounded-[1.1rem] !border-slate-200 !bg-white/80 !px-4 !py-3.5 focus-within:!border-brand-300 focus-within:!bg-white"
                  />
                </div>
              </div>
              </AnimatedSection>
            )}

            {currentStep === 2 && (
              <AnimatedSection>
                <div className="grid gap-4 md:grid-cols-2">
                  <AuthInputField
                    label="City"
                  type="text"
                  value={form.city}
                  onChange={(event) => handleChange('city', event.target.value)}
                  placeholder="e.g. Greater Noida"
                  disabled={isSubmitting}
                  error={fieldErrors.city}
                  className="!rounded-[1.1rem] !border-slate-200 !bg-white/80 !px-4 !py-3.5 !text-[0.95rem] focus:!border-brand-300 focus:!bg-white"
                />

                <AuthInputField
                  label="State"
                  type="text"
                  value={form.state}
                  onChange={(event) => handleChange('state', event.target.value)}
                  placeholder="e.g. Uttar Pradesh"
                  disabled={isSubmitting}
                  error={fieldErrors.state}
                  className="!rounded-[1.1rem] !border-slate-200 !bg-white/80 !px-4 !py-3.5 !text-[0.95rem] focus:!border-brand-300 focus:!bg-white"
                />

                <AuthInputField
                  label="Affiliation / University"
                  type="text"
                  value={form.affiliation}
                  onChange={(event) => handleChange('affiliation', event.target.value)}
                  placeholder="e.g. AKTU"
                  disabled={isSubmitting}
                  error={fieldErrors.affiliation}
                  className="!rounded-[1.1rem] !border-slate-200 !bg-white/80 !px-4 !py-3.5 !text-[0.95rem] focus:!border-brand-300 focus:!bg-white"
                />

                <AuthInputField
                  label="Established Year"
                  type="text"
                  inputMode="numeric"
                  value={form.establishedYear}
                  onChange={(event) => handleChange('establishedYear', event.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="e.g. 2002"
                  disabled={isSubmitting}
                  error={fieldErrors.establishedYear}
                  className="!rounded-[1.1rem] !border-slate-200 !bg-white/80 !px-4 !py-3.5 !text-[0.95rem] focus:!border-brand-300 focus:!bg-white"
                />

                <div className="md:col-span-2">
                  <AuthInputField
                    label="Website"
                    type="url"
                    value={form.website}
                    onChange={(event) => handleChange('website', event.target.value)}
                    placeholder="https://www.college.edu"
                    disabled={isSubmitting}
                    error={fieldErrors.website}
                    className="!rounded-[1.1rem] !border-slate-200 !bg-white/80 !px-4 !py-3.5 !text-[0.95rem] focus:!border-brand-300 focus:!bg-white"
                  />
                </div>

                <label className="grid gap-1.5 text-sm font-semibold text-slate-700 md:col-span-2">
                  College Overview
                  <textarea
                    rows={5}
                    value={form.about}
                    onChange={(event) => handleChange('about', event.target.value)}
                    placeholder="Add a short overview covering campus background, programs, student strength, and placement focus."
                    disabled={isSubmitting}
                    className="w-full rounded-[1.1rem] border border-slate-200 bg-white/80 px-4 py-3.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand-300 focus:bg-white"
                  />
                  {fieldErrors.about ? <span className="text-xs font-medium text-rose-600">{fieldErrors.about}</span> : null}
                </label>
              </div>
              </AnimatedSection>
            )}

              <AuthFormMessage>{error}</AuthFormMessage>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                {currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center justify-center rounded-full bg-navy px-6 py-3.5 text-[0.96rem] font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Continue to Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3.5 text-[0.96rem] font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center rounded-full bg-navy px-6 py-3.5 text-[0.96rem] font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmitting ? 'Registering...' : 'Register Campus'}
                    </button>
                  </div>
                )}

                <div className="text-[0.92rem] text-slate-500">
                  Already registered?{' '}
                  <Link to="/management/login/campus-connect" className="font-semibold text-brand-700 transition-colors hover:text-navy">
                    Campus login
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

export default CampusConnectRegisterPage;
