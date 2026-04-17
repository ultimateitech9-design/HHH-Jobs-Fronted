import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import LoginPanelContent from '../components/LoginPanelContent';
import { getLoginPortalConfig, isManagementLoginPortal } from '../config/loginPortals';

const LoginPage = () => {
  const location = useLocation();
  const { portalKey } = useParams();

  if (isManagementLoginPortal(portalKey)) {
    return <Navigate to={`/management/login/${portalKey}`} replace state={location.state} />;
  }

  const portalConfig = getLoginPortalConfig(portalKey);
  const portalLabel = location.state?.portalLabel || portalConfig.title;

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f5f1e8] px-4 py-6 md:px-6 md:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.14),transparent_24%),radial-gradient(circle_at_100%_0%,rgba(15,23,42,0.08),transparent_28%),linear-gradient(180deg,#f7f3ea_0%,#fcfbf8_48%,#f7f8fb_100%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[40rem] items-center justify-center">
        <div className="w-full rounded-[1.75rem] border border-slate-200/80 bg-white/94 p-4 shadow-[0_24px_72px_rgba(15,23,42,0.1)] backdrop-blur sm:p-5 md:rounded-[2rem] md:p-6">
          <div className="mb-5 flex flex-col items-start justify-between gap-3 rounded-[1.4rem] border border-slate-200/80 bg-[#fcfaf5] px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-gold-dark">
                {portalConfig.eyebrow}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {portalLabel}
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-navy"
            >
              Back to home
            </Link>
          </div>

          <div className="mx-auto max-w-[34rem] overflow-visible rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-[0_16px_42px_rgba(15,23,42,0.06)] sm:p-5 md:rounded-[1.75rem] md:p-7">
            <LoginPanelContent
              portalLabel={portalLabel}
              description={portalConfig.helperText}
              defaultRedirectPath={portalConfig.defaultRedirectPath}
              allowSocialLogin={portalConfig.allowSocialLogin}
              showCreateAccount={portalConfig.showCreateAccount}
              createAccountPath={portalConfig.createAccountPath}
              createAccountLabel={portalConfig.createAccountLabel}
              showOtpLogin={portalConfig.showOtpLogin}
              socialRole={portalConfig.socialRole}
              emailLabel={portalConfig.emailLabel}
              emailPlaceholder={portalConfig.emailPlaceholder}
              passwordPlaceholder={portalConfig.passwordPlaceholder}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
