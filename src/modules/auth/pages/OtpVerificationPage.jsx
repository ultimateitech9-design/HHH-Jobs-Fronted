import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch, AUTH_REQUEST_TIMEOUT_MS } from '../../../utils/api';
import {
  beginPendingVerificationSession,
  clearPendingVerificationSession,
  getDashboardPathByRole,
  getPendingVerificationSession,
  getStoredUser,
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

  if (/otp email could not be sent|smtp|connection timeout|enetunreach|econn|timed out/i.test(normalized)) {
    return 'We could not deliver the OTP right now. Please wait a moment and try Resend OTP again.';
  }

  return normalized;
};

const normalizeAllowedLoginRoles = (allowedLoginRoles = []) => (
  Array.isArray(allowedLoginRoles)
    ? allowedLoginRoles.map((role) => normalizeRole(role)).filter(Boolean)
    : []
);

const isRoleAllowedOnVerificationPage = (role, allowedLoginRoles = []) => {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return false;
  if (!allowedLoginRoles.length) return true;
  return allowedLoginRoles.includes(normalizedRole);
};

const buildPortalRoleErrorMessage = (allowedLoginRoles = []) => {
  if (allowedLoginRoles.includes('student') && allowedLoginRoles.includes('hr') && allowedLoginRoles.length === 2) {
    return 'This login page only allows Student and HR accounts. Use the dedicated management login page for management dashboards.';
  }

  return 'This account is not allowed on the selected login page.';
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

  const email = String(
    location.state?.email
    || pendingVerification?.email
    || legacyPendingEmail
    || ''
  ).trim().toLowerCase();
  const emailWarning = String(location.state?.emailWarning || pendingVerification?.emailWarning || '');
  const allowedLoginRoles = normalizeAllowedLoginRoles(
    location.state?.allowedLoginRoles || pendingVerification?.allowedLoginRoles || []
  );
  const allowedLoginRolesKey = allowedLoginRoles.join('|');

  useEffect(() => {
    if (!email) {
      navigate('/sign-up', { replace: true });
      return;
    }

    beginPendingVerificationSession({ email, emailWarning, allowedLoginRoles });
    focusOtpInput(0);
  }, [allowedLoginRolesKey, email, emailWarning, navigate]);

  useEffect(() => {
    const normalizedWarning = String(emailWarning || '').trim();
    if (!normalizedWarning) {
      setNotice('');
      return;
    }

    if (/otp email could not be sent|smtp|connection timeout|authentication|login failed|could not send/i.test(normalizedWarning)) {
      setNotice('');
      setError(normalizedWarning);
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

      const nextUser = payload.user?.role === 'student'
        ? {
          ...payload.user,
          studentCandidateId: payload.user?.studentCandidateId || generateStudentCandidateId({
            name: payload.user?.name || '',
            mobile: payload.user?.mobile || payload.user?.phone || ''
          })
        }
        : payload.user?.role === 'retired_employee'
          ? {
            ...payload.user,
            retiredEmployeeId: payload.user?.retiredEmployeeId || generateRetiredEmployeeId({
              name: payload.user?.name || '',
              mobile: payload.user?.mobile || payload.user?.phone || ''
            })
          }
          : payload.user;

      if (!isRoleAllowedOnVerificationPage(nextUser?.role, allowedLoginRoles)) {
        setError(buildPortalRoleErrorMessage(allowedLoginRoles));
        return;
      }

      clearPendingVerificationSession();
      setAuthSession(payload.token, nextUser);
      navigate(normalizeRedirectPath(payload.redirectTo || getDashboardPathByRole(nextUser?.role), nextUser?.role), { replace: true });
    } catch (requestError) {
      try {
        const payload = verifyLocalSignupOtp({ email, otp: otpCode });

        const nextUser = payload.user?.role === 'student'
          ? {
            ...payload.user,
            studentCandidateId: payload.user?.studentCandidateId || generateStudentCandidateId({
              name: payload.user?.name || '',
              mobile: payload.user?.mobile || payload.user?.phone || ''
            })
          }
          : payload.user?.role === 'retired_employee'
            ? {
              ...payload.user,
              retiredEmployeeId: payload.user?.retiredEmployeeId || generateRetiredEmployeeId({
                name: payload.user?.name || '',
                mobile: payload.user?.mobile || payload.user?.phone || ''
              })
            }
            : payload.user;

        if (!isRoleAllowedOnVerificationPage(nextUser?.role, allowedLoginRoles)) {
          setError(buildPortalRoleErrorMessage(allowedLoginRoles));
          return;
        }

        clearPendingVerificationSession();
        setAuthSession(payload.token, nextUser);
        navigate(normalizeRedirectPath(payload.redirectTo || getDashboardPathByRole(nextUser?.role), nextUser?.role), { replace: true });
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
      beginPendingVerificationSession({ email, emailWarning: '', allowedLoginRoles });
      setOtp(['', '', '', '', '', '']);
      focusOtpInput(0);
    } catch (requestError) {
      try {
        resendLocalSignupOtp(email);
        setCounter(60);
        setNotice('A fresh OTP has been generated for this session.');
        beginPendingVerificationSession({ email, emailWarning: '', allowedLoginRoles });
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
