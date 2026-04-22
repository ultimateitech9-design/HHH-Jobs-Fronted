import { Navigate, useLocation, useParams } from 'react-router-dom';
import LoginPanelContent from '../components/LoginPanelContent';
import { getLoginPortalConfig, isManagementLoginPortal } from '../config/loginPortals';

const ManagementLoginPage = () => {
  const location = useLocation();
  const { portalKey } = useParams();

  if (!isManagementLoginPortal(portalKey)) {
    return <Navigate to="/management" replace />;
  }

  const portalConfig = getLoginPortalConfig(portalKey);
  const portalLabel = location.state?.portalLabel || portalConfig.title;

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#eef2f7] px-4 py-4 md:px-6 md:py-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(17,33,59,0.18),transparent_26%),radial-gradient(circle_at_100%_0%,rgba(212,175,55,0.12),transparent_26%),linear-gradient(180deg,#0f1728_0%,#162033_34%,#edf1f6_34%,#f6f7fa_100%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[34rem] items-center justify-center md:min-h-[calc(100vh-2.5rem)]">
        <div className="w-full">
          <div className="w-full rounded-[1.9rem] border border-slate-200 bg-white p-5 shadow-[0_18px_56px_rgba(15,23,42,0.08)] md:p-6">
            <LoginPanelContent
              portalLabel={portalLabel}
              description={portalConfig.helperText}
              defaultRedirectPath={portalConfig.defaultRedirectPath}
              allowSocialLogin={false}
              showCreateAccount={portalKey === 'campus-connect'}
              createAccountPath={portalKey === 'campus-connect' ? '/campus-connect/register?redirect=%2Fportal%2Fcampus-connect%2Fdashboard' : '/sign-up'}
              createAccountLabel={portalKey === 'campus-connect' ? 'Register campus' : 'Create account'}
              showOtpLogin={true}
              showAccessNotice={false}
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

export default ManagementLoginPage;
