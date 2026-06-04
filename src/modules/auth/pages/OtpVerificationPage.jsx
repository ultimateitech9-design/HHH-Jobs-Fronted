import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch, AUTH_REQUEST_TIMEOUT_MS } from '../../../utils/api';
import {
  beginPendingVerificationSession,
  getDashboardPathByRole,
  getPendingVerificationSession,
  getStoredUser,
  isRedirectPathAllowedForRole,
  isEmailVerifiedUser,
  normalizeRole,
  normalizeRedirectPath,
  setAuthSession
} from '../../../utils/auth';
import { generateRetiredEmployeeId, generateStudentCandidateId } from '../../../utils/hrIdentity';
import { resendLocalSignupOtp, verifyLocalSignupOtp } from '../../../utils/localAuthFallback';
import AuthFormMessage from '../components/AuthFormMessage';
import AuthOtpInputGroup from '../components/AuthOtpInputGroup';
import AuthPageShell from '../components/AuthPageShell';
import { otpBenefits } from '../config/authOptions';

const normalizeOtpErrorMessage = (message = '') => {
  const normalized = String(message || '').trim();
  if (!normalized) return 'Unable to resend OTP right now.';

  if (/daily_quota_exceeded|quota exceeded|quota|rate limit/i.test(normalized)) {
    return 'OTP email sending limit has been reached right now. Please wait and try again later or contact support.';
  }

  if (/otp email could not be sent|smtp|connection timeout|enetunreach|econn|timed out|authentication|could not send/i.test(normalized)) {
    return 'We could not deliver the OTP right now. Please wait a moment and try Resend OTP again.';
  }

  return normalized;
};

const normalizeAllowedLoginRoles = (allowedLoginRoles = []) => (
  Array.isArray(allowedLoginRoles)
    ? allowedLoginRoles.map((role) => normalizeRole(role)).filter(Boolean)
    : []
);

const getRoleSafeRedirectPath = (role) => {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return '';
  return getDashboardPathByRole(normalizedRole);
};

const getVerificationSuccessDestination = ({ payloadRedirectTo = '', role = '' } = {}) => {
  if (isRedirectPathAllowedForRole(payloadRedirectTo, role)) {
    return normalizeRedirectPath(payloadRedirectTo || getDashboardPathByRole(role), role);
  }

  return getRoleSafeRedirectPath(role);
};

const withVerifiedAuthFlags = (user = null) => {
  if (!user) return null;
  const normalizedRole = normalizeRole(user.role);
  return {
    ...user,
    role: normalizedRole || user.role || 'student',
    isEmailVerified: true,
    is_email_verified: true
  };
};

const buildVerifiedSessionUser = ({ payloadUser = null, fallbackRole = '', email = '' } = {}) => {
  const role = normalizeRole(payloadUser?.role || fallbackRole) || 'student';
  const baseUser = withVerifiedAuthFlags({
    ...(payloadUser || {}),
    email: payloadUser?.email || email,
    role
  });

  if (role === 'student') {
    return {
      ...baseUser,
      studentCandidateId: baseUser?.studentCandidateId || generateStudentCandidateId({
        name: baseUser?.name || '',
        mobile: baseUser?.mobile || baseUser?.phone || ''
      })
    };
  }

  if (role === 'retired_employee') {
    return {
      ...baseUser,
      retiredEmployeeId: baseUser?.retiredEmployeeId || generateRetiredEmployeeId({
        name: baseUser?.name || '',
        mobile: baseUser?.mobile || baseUser?.phone || ''
      })
    };
  }

  return baseUser;
};

const OtpVerificationPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [counter, setCounter] = useState(60);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const focusOtpInput = (index) => {
    requestAnimationFrame(() => {
      const nextInput = inputRefs.current[index];
      if (!nextInput) return;
      nextInput.focus();
      nextInput.select?.();
    });
  };

  const pendingVerification = getPendingVerificationSession();
  const legacyStoredUser = getStoredUser();
  const legacyPendingEmail = legacyStoredUser && !isEmailVerifiedUser(legacyStoredUser)
    ? String(legacyStoredUser.email || '').trim().toLowerCase()
    : '';
  const searchParams = new URLSearchParams(location.search || '');
  const queryEmail = String(searchParams.get('email') || '').trim().toLowerCase();
  const queryEmailWarning = String(searchParams.get('emailWarning') || searchParams.get('email_warning') || '').trim();
  const queryAllowedLoginRoles = [
    ...String(searchParams.get('allowedLoginRoles') || '').split(','),
    ...searchParams.getAll('allowedLoginRoles'),
    ...searchParams.getAll('role')
  ]
    .map((role) => normalizeRole(role))
    .filter(Boolean);
  const effectiveQueryAllowedLoginRoles = queryAllowedLoginRoles.length ? queryAllowedLoginRoles : null;

  const email = String(
    location.state?.email
    || queryEmail
    || pendingVerification?.email
    || legacyPendingEmail
    || ''
  ).trim().toLowerCase();
  const matchingPendingVerification = pendingVerification?.email === email ? pendingVerification : null;
  const emailWarning = String(
    location.state?.emailWarning
    || queryEmailWarning
    || matchingPendingVerification?.emailWarning
    || ''
  );
  const verificationRole = normalizeRole(
    location.state?.role
    || matchingPendingVerification?.role
    || ''
  );
  const verificationSource = String(
    location.state?.source
    || matchingPendingVerification?.source
    || ''
  ).trim().toLowerCase();
  const rawAllowedLoginRoles =
    location.state?.allowedLoginRoles
    || effectiveQueryAllowedLoginRoles
    || matchingPendingVerification?.allowedLoginRoles
    || [];
  const allowedLoginRoles = verificationSource === 'signup'
    ? []
    : normalizeAllowedLoginRoles(rawAllowedLoginRoles);
  const allowedLoginRolesKey = allowedLoginRoles.join('|');

  useEffect(() => {
    if (!email) {
      navigate('/sign-up', { replace: true });
      return;
    }

    beginPendingVerificationSession({
      email,
      emailWarning,
      role: verificationRole,
      source: verificationSource,
      allowedLoginRoles: allowedLoginRolesKey ? allowedLoginRolesKey.split('|') : []
    });
    focusOtpInput(0);
  }, [allowedLoginRolesKey, email, emailWarning, navigate, verificationRole, verificationSource]);

  useEffect(() => {
    const normalizedWarning = String(emailWarning || '').trim();
    if (!normalizedWarning) {
      setNotice('');
      return;
    }

    if (/otp email could not be sent|smtp|connection timeout|authentication|login failed|could not send|daily_quota_exceeded|quota exceeded|quota|rate limit/i.test(normalizedWarning)) {
      setNotice('');
      setError(normalizeOtpErrorMessage(normalizedWarning));
      return;
    }

    setError('');
    setNotice(normalizedWarning);
  }, [emailWarning]);

  useEffect(() => {
    if (counter <= 0) return undefined;
    const timer = setTimeout(() => setCounter((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [counter]);

  const handleChange = (index, value) => {
    const digits = String(value || '').replace(/\D/g, '');

    if (!digits) {
      const updated = [...otp];
      updated[index] = '';
      setOtp(updated);
      return;
    }

    if (digits.length === 1) {
      const updated = [...otp];
      updated[index] = digits;
      setOtp(updated);

      if (index < 5) {
        focusOtpInput(index + 1);
      }
      return;
    }

    const updated = [...otp];
    digits.slice(0, 6 - index).split('').forEach((digit, offset) => {
      updated[index + offset] = digit;
    });
    setOtp(updated);

    const nextIndex = Math.min(index + digits.length, 5);
    focusOtpInput(nextIndex);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const updated = [...otp];

      if (otp[index]) {
        updated[index] = '';
        setOtp(updated);
        return;
      }

      if (index > 0) {
        updated[index - 1] = '';
        setOtp(updated);
        focusOtpInput(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusOtpInput(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      focusOtpInput(index + 1);
      return;
    }

    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      const updated = [...otp];
      updated[index] = event.key;
      setOtp(updated);

      if (index < 5) {
        focusOtpInput(index + 1);
      }
    }
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    event.preventDefault();
    const nextOtp = pasted.padEnd(6, ' ').slice(0, 6).split('').map((char) => (char === ' ' ? '' : char));
    setOtp(nextOtp);
    focusOtpInput(Math.min(pasted.length - 1, 5));
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    setNotice('');
    setError('');

    if (otpCode.length !== 6) {
      setError('Enter the complete 6-digit OTP.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp: otpCode }),
        timeoutMs: AUTH_REQUEST_TIMEOUT_MS
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message || 'OTP verification failed.');
        return;
      }

      if (!payload.token) {
        setError('OTP verified, but login session was not created. Please try signing in again.');
        return;
      }

      const nextUser = buildVerifiedSessionUser({
        payloadUser: payload.user,
        fallbackRole: verificationRole,
        email
      });

      const destination = getVerificationSuccessDestination({
        payloadRedirectTo: payload.redirectTo,
        role: nextUser?.role
      }) || getDashboardPathByRole(nextUser?.role);

      setAuthSession(payload.token, nextUser);
      navigate(destination, { replace: true });
    } catch (requestError) {
      try {
        const payload = verifyLocalSignupOtp({ email, otp: otpCode });

        if (!payload.token) {
          setError('OTP verified, but login session was not created. Please try signing in again.');
          return;
        }

        const nextUser = buildVerifiedSessionUser({
          payloadUser: payload.user,
          fallbackRole: verificationRole,
          email
        });

        const destination = getVerificationSuccessDestination({
          payloadRedirectTo: payload.redirectTo,
          role: nextUser?.role
        }) || getDashboardPathByRole(nextUser?.role);

        setAuthSession(payload.token, nextUser);
        navigate(destination, { replace: true });
      } catch (fallbackError) {
        setError(fallbackError.message || 'Unable to verify OTP right now.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (counter > 0) return;
    setNotice('');
    setError('');

    try {
      const response = await apiFetch('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
        timeoutMs: AUTH_REQUEST_TIMEOUT_MS
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message || 'Unable to resend OTP.');
        return;
      }

      if (payload.deliveryFailed) {
        setError(normalizeOtpErrorMessage(payload.emailWarning || payload.message || 'Unable to resend OTP.'));
        return;
      }

      setCounter(60);
      setNotice('A fresh OTP is on the way. Check your inbox and spam folder.');
      beginPendingVerificationSession({
        email,
        emailWarning: '',
        allowedLoginRoles,
        role: verificationRole,
        source: verificationSource
      });
      setOtp(['', '', '', '', '', '']);
      focusOtpInput(0);
    } catch (requestError) {
      try {
        resendLocalSignupOtp(email);
        setCounter(60);
        setNotice('A fresh OTP has been generated for this session.');
        beginPendingVerificationSession({
          email,
          emailWarning: '',
          allowedLoginRoles,
          role: verificationRole,
          source: verificationSource
        });
        setOtp(['', '', '', '', '', '']);
        focusOtpInput(0);
      } catch (fallbackError) {
        setError(normalizeOtpErrorMessage(fallbackError.message || 'Network error while resending OTP.'));
      }
    }
  };

  return (
    <AuthPageShell
      eyebrow="OTP Verification"
      title="Verify your code"
      description={`Enter the 6-digit code sent to ${email}.`}
      sideTitle="One verification step before dashboard access"
      sideDescription="The OTP stage now follows the same auth shell pattern as login and signup, while keeping resend and fallback behavior intact."
      benefits={otpBenefits}
    >
      <div className="space-y-6">
        <AuthOtpInputGroup
          values={otp}
          inputRefs={inputRefs}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />

        <AuthFormMessage tone="info">{notice}</AuthFormMessage>
        <AuthFormMessage>{error}</AuthFormMessage>

        <button
          type="button"
          onClick={handleVerify}
          className="inline-flex w-full items-center justify-center rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Verifying...' : 'Verify and Continue'}
        </button>

        <button
          type="button"
          onClick={handleResend}
          className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-brand-100 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={counter > 0}
        >
          {counter > 0 ? `Resend OTP in ${counter}s` : 'Resend OTP'}
        </button>
      </div>
    </AuthPageShell>
  );
};

export default OtpVerificationPage;
