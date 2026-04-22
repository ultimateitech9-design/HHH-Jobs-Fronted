import { Navigate, useLocation, useParams } from 'react-router-dom';
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
        <div className="w-full max-w-[34rem]">
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
            allowedLoginRoles={portalConfig.allowedLoginRoles}
            emailLabel={portalConfig.emailLabel}
            emailPlaceholder={portalConfig.emailPlaceholder}
            passwordPlaceholder={portalConfig.passwordPlaceholder}
          />
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
