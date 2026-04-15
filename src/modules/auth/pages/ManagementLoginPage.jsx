import { Navigate, useLocation, useParams } from 'react-router-dom';
import { FiArrowLeft, FiBriefcase, FiShield } from 'react-icons/fi';
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
  const isEmployeePortal = ['support', 'sales', 'dataentry', 'accounts'].includes(portalConfig.key);
  const accentIcon = isEmployeePortal ? FiBriefcase : FiShield;
  const AccentIcon = accentIcon;

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#eef2f7] px-4 py-6 md:px-6 md:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(17,33,59,0.18),transparent_26%),radial-gradient(circle_at_100%_0%,rgba(212,175,55,0.12),transparent_26%),linear-gradient(180deg,#0f1728_0%,#162033_34%,#edf1f6_34%,#f6f7fa_100%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[40rem] items-center justify-center">
        <div className="w-full rounded-[2rem] border border-slate-200/80 bg-white/94 p-4 shadow-[0_28px_90px_rgba(15,23,42,0.18)] backdrop-blur md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4 rounded-[1.4rem] border border-slate-200/80 bg-[#f6f8fb] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5efe1] text-navy">
                <AccentIcon size={20} />
              </div>
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-gold-dark">
                  Internal access
                </p>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {portalLabel}
                </p>
              </div>
            </div>
            <a
              href="/management"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-navy"
            >
              <FiArrowLeft />
              <span>Back</span>
            </a>
          </div>

          <div className="w-full rounded-[1.9rem] border border-slate-200 bg-white p-5 shadow-[0_18px_56px_rgba(15,23,42,0.08)] md:p-7">
            <LoginPanelContent
              portalLabel={portalLabel}
              description={portalConfig.helperText}
              defaultRedirectPath={portalConfig.defaultRedirectPath}
              allowSocialLogin={false}
              showCreateAccount={false}
              showOtpLogin={true}
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
