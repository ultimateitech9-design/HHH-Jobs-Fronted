import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch, AUTH_REQUEST_TIMEOUT_MS } from '../../../utils/api';
import AuthFormMessage from '../components/AuthFormMessage';
import AuthInputField from '../components/AuthInputField';
import AuthPageShell from '../components/AuthPageShell';
import AuthPasswordField from '../components/AuthPasswordField';
import { forgotPasswordBenefits } from '../config/authOptions';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const sendOtp = async (event) => {
    event.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
        timeoutMs: AUTH_REQUEST_TIMEOUT_MS
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message || 'Unable to send OTP.');
        return;
      }

      if (payload.deliveryFailed) {
        setError(payload.message || 'Unable to send OTP right now.');
        return;
      }

      setStep('reset');
    } catch (requestError) {
      setError(requestError.message || 'Network error while sending OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError('');

    if (!otp || !newPassword || !confirmPassword) {
      setError('OTP and password fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword }),
        timeoutMs: AUTH_REQUEST_TIMEOUT_MS
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message || 'Unable to reset password.');
        return;
      }

      navigate('/login', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Network error while resetting password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      eyebrow="Account Recovery"
      title={step === 'email' ? 'Forgot Password' : 'Reset Password'}
      description={
        step === 'email'
          ? 'Enter your email and we will send the OTP required to continue.'
          : `Enter the OTP sent to ${email} and choose a new password.`
      }
      sideTitle="Recovery flow now matches the updated public auth system"
      sideDescription="The reset journey keeps the same backend endpoints and validation while moving into a cleaner, split-screen shell."
      benefits={forgotPasswordBenefits}
    >
      {step === 'email' ? (
        <form onSubmit={sendOtp} className="space-y-5">
          <AuthInputField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            placeholder="Enter your account email"
          />
          <AuthFormMessage>{error}</AuthFormMessage>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-5">
          <AuthInputField
            label="OTP"
            value={otp}
            maxLength={6}
            onChange={(event) => setOtp(event.target.value)}
            disabled={isSubmitting}
            placeholder="Enter 6-digit OTP"
          />
          <AuthPasswordField
            label="New Password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            disabled={isSubmitting}
            showPassword={showNewPassword}
            onTogglePassword={() => setShowNewPassword((current) => !current)}
          />
          <AuthPasswordField
            label="Confirm Password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={isSubmitting}
            showPassword={showConfirmPassword}
            onTogglePassword={() => setShowConfirmPassword((current) => !current)}
          />
          <AuthFormMessage>{error}</AuthFormMessage>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
          <button
            type="button"
            onClick={() => setStep('email')}
            className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-brand-100 hover:bg-brand-50"
            disabled={isSubmitting}
          >
            Use another email
          </button>
        </form>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
        <Link to="/login" className="text-brand-700 transition-colors hover:text-brand-800">
          Back to login
        </Link>
        <Link to="/sign-up" className="text-navy transition-colors hover:text-brand-700">
          Create account
        </Link>
      </div>
    </AuthPageShell>
  );
};

export default ForgotPasswordPage;
