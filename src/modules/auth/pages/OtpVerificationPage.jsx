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
  normalizeRedirectPath,
  setAuthSession
} from '../../../utils/auth';
import { generateRetiredEmployeeId, generateStudentCandidateId } from '../../../utils/hrIdentity';
import { resendLocalSignupOtp, verifyLocalSignupOtp } from '../../../utils/localAuthFallback';
import AuthFormMessage from '../components/AuthFormMessage';
import AuthOtpInputGroup from '../components/AuthOtpInputGroup';
import AuthPageShell from '../components/AuthPageShell';
import { otpBenefits } from '../config/authOptions';

const OtpVerificationPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [counter, setCounter] = useState(60);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

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
  const prefilledOtp = String(location.state?.otp || pendingVerification?.otp || '').replace(/\D/g, '').slice(0, 6);
  const emailWarning = String(location.state?.emailWarning || pendingVerification?.emailWarning || '');

  useEffect(() => {
    if (!email) {
      navigate('/sign-up', { replace: true });
      return;
    }

    beginPendingVerificationSession({ email, otp: prefilledOtp, emailWarning });
    inputRefs.current[0]?.focus();
  }, [email, emailWarning, navigate, prefilledOtp]);

  useEffect(() => {
    if (emailWarning) setError(emailWarning);
  }, [emailWarning]);

  useEffect(() => {
    if (prefilledOtp.length !== 6) return;
    setOtp(prefilledOtp.split(''));
  }, [prefilledOtp]);

  useEffect(() => {
    if (counter <= 0) return undefined;
    const timer = setTimeout(() => setCounter((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [counter]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    event.preventDefault();
    const nextOtp = pasted.padEnd(6, ' ').slice(0, 6).split('').map((char) => (char === ' ' ? '' : char));
    setOtp(nextOtp);
    inputRefs.current[Math.min(pasted.length - 1, 5)]?.focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
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

      setCounter(60);
      const nextOtp = String(payload.otp || '').replace(/\D/g, '').slice(0, 6);
      beginPendingVerificationSession({ email, otp: nextOtp, emailWarning: '' });
      if (nextOtp.length === 6) {
        setOtp(nextOtp.split(''));
        inputRefs.current[5]?.focus();
      } else {
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (requestError) {
      try {
        const payload = resendLocalSignupOtp(email);
        setCounter(60);
        const nextOtp = String(payload.otp || '').replace(/\D/g, '').slice(0, 6);
        beginPendingVerificationSession({ email, otp: nextOtp, emailWarning: '' });
        if (nextOtp.length === 6) {
          setOtp(nextOtp.split(''));
          inputRefs.current[5]?.focus();
        }
      } catch (fallbackError) {
        setError(fallbackError.message || 'Network error while resending OTP.');
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
