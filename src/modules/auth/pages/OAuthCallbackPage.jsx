import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../utils/api';
import { getDashboardPathByRole, normalizeRedirectPath, setAuthSession } from '../../../utils/auth';
import { generateRetiredEmployeeId, generateStudentCandidateId } from '../../../utils/hrIdentity';
import AuthFormMessage from '../components/AuthFormMessage';
import AuthPageShell from '../components/AuthPageShell';
import { oauthBenefits } from '../config/authOptions';

const decodeBase64Url = (value) => {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(normalized + padding);
};

const readCallbackParams = (location) => {
  const params = new URLSearchParams(location.search || '');
  const hash = String(location.hash || '').replace(/^#/, '');

  if (hash) {
    const hashParams = new URLSearchParams(hash);
    hashParams.forEach((value, key) => {
      params.set(key, value);
    });
  }

  return params;
};

const buildOAuthUser = (decodedUser) => (
  decodedUser?.role === 'student'
    ? {
      ...decodedUser,
      studentCandidateId: decodedUser?.studentCandidateId || generateStudentCandidateId({
        name: decodedUser?.name || '',
        mobile: decodedUser?.mobile || decodedUser?.phone || ''
      })
    }
    : decodedUser?.role === 'retired_employee'
      ? {
        ...decodedUser,
        retiredEmployeeId: decodedUser?.retiredEmployeeId || generateRetiredEmployeeId({
          name: decodedUser?.name || '',
          mobile: decodedUser?.mobile || decodedUser?.phone || ''
        })
      }
      : decodedUser
);

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const finalizeCallback = async () => {
      const callbackParams = readCallbackParams(location);
      const shouldScrubUrl = Boolean(location.hash)
        || callbackParams.has('code')
        || callbackParams.has('state')
        || callbackParams.has('error')
        || callbackParams.has('error_description');

      if (shouldScrubUrl && typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname);
      }

      const token = callbackParams.get('token');
      const userEncoded = callbackParams.get('user');
      const redirectTo = callbackParams.get('redirectTo');
      const providerError = callbackParams.get('error_description') || callbackParams.get('error');

      if (providerError) {
        if (!cancelled) setError(providerError);
        return;
      }

      if (token && userEncoded) {
        try {
          const decodedUser = JSON.parse(decodeBase64Url(userEncoded));
          const nextUser = buildOAuthUser(decodedUser);
          setAuthSession(token, nextUser);
          navigate(normalizeRedirectPath(redirectTo || getDashboardPathByRole(nextUser?.role), nextUser?.role), { replace: true });
        } catch (decodeError) {
          if (!cancelled) setError('Unable to process social login response. Please try again.');
        }
        return;
      }

      const code = callbackParams.get('code');
      const state = callbackParams.get('state');
      if (!code || !state) {
        if (!cancelled) setError('Social login response is incomplete. Please try again.');
        return;
      }

      try {
        const response = await apiFetch('/auth/oauth/linkedin/exchange', {
          method: 'POST',
          body: JSON.stringify({ code, state })
        });
        let payload = {};
        try {
          payload = await response.json();
        } catch {
          payload = {};
        }

        if (!response.ok) {
          if (!cancelled) setError(payload.message || 'Unable to complete social login. Please try again.');
          return;
        }

        if (!payload.token || !payload.user) {
          if (!cancelled) setError('Social login response is incomplete. Please try again.');
          return;
        }

        const nextUser = buildOAuthUser(payload.user || {});
        setAuthSession(payload.token, nextUser);
        navigate(normalizeRedirectPath(payload.redirectTo || getDashboardPathByRole(nextUser?.role), nextUser?.role), { replace: true });
      } catch (requestError) {
        if (!cancelled) setError(requestError.message || 'Unable to complete social login. Please try again.');
      }
    };

    finalizeCallback();

    return () => {
      cancelled = true;
    };
  }, [location, navigate]);

  return (
    <AuthPageShell
      eyebrow="Social Login"
      title="Finishing Sign In"
      description={error || 'Please wait while we complete your social login.'}
      sideTitle="Social callback now uses the same auth shell as the rest of onboarding"
      sideDescription="The callback step stays simple, but it now matches the modular public-auth structure used throughout the updated pages."
      benefits={oauthBenefits}
    >
      <div className="space-y-5">
        <AuthFormMessage tone={error ? 'error' : 'info'}>
          {error || 'Your account data is being normalized and redirected to the correct dashboard.'}
        </AuthFormMessage>

        {error ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
            <Link to="/login" className="text-brand-700 transition-colors hover:text-brand-800">
              Back to login
            </Link>
            <Link to="/sign-up" className="text-navy transition-colors hover:text-brand-700">
              Create account manually
            </Link>
          </div>
        ) : null}
      </div>
    </AuthPageShell>
  );
};

export default OAuthCallbackPage;
