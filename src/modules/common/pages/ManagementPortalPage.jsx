import { FiArrowLeft, FiBarChart2, FiBriefcase, FiCreditCard, FiHeadphones, FiShield, FiUserCheck } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthSession, hasRole, isAuthenticated } from '../../../utils/auth';
import { PORTAL_ACCESS } from '../../../routes/portalAccess';
import './ManagementPortalPage.css';

const managementLinks = [
  { label: 'Admin Dashboard', to: '/portal/admin/dashboard', portalLabel: 'Admin Portal', icon: FiShield, roles: PORTAL_ACCESS.admin },
  { label: 'Super Admin', to: '/portal/super-admin/dashboard', portalLabel: 'Super Admin Portal', icon: FiUserCheck, roles: PORTAL_ACCESS.superAdmin },
  { label: 'Platform Ops', to: '/portal/platform/dashboard', portalLabel: 'Platform Operations Portal', icon: FiBarChart2, roles: PORTAL_ACCESS.platform },
  { label: 'Audit Desk', to: '/portal/audit/dashboard', portalLabel: 'Audit Portal', icon: FiShield, roles: PORTAL_ACCESS.audit }
];

const employeeLinks = [
  { label: 'Support Desk', to: '/portal/support/dashboard', portalLabel: 'Support Portal', icon: FiHeadphones, roles: PORTAL_ACCESS.support },
  { label: 'Sales Dashboard', to: '/portal/sales/overview', portalLabel: 'Sales Portal', icon: FiBarChart2, roles: PORTAL_ACCESS.sales },
  { label: 'Data Entry', to: '/portal/dataentry/dashboard', portalLabel: 'Data Entry Portal', icon: FiBriefcase, roles: PORTAL_ACCESS.dataentry },
  { label: 'Accounts Dashboard', to: '/portal/accounts/overview', portalLabel: 'Accounts Portal', icon: FiCreditCard, roles: PORTAL_ACCESS.accounts }
];

const ManagementPortalPage = () => {
  const navigate = useNavigate();

  const openPortalLogin = (item) => {
    if (isAuthenticated() && hasRole(item.roles)) {
      navigate(item.to);
      return;
    }

    clearAuthSession();

    navigate('/login', {
      state: {
        from: item.to,
        portalLabel: item.portalLabel
      }
    });
  };

  return (
    <div className="management-portal">
      <div className="management-portal__backdrop" />
      <section className="management-portal__shell">
        <header className="management-portal__header">
          <Link to="/" className="management-portal__back">
            <FiArrowLeft />
            <span>Back to Home</span>
          </Link>

          <p className="management-portal__brand">
            <strong>HHH Jobs</strong>
            <span>Internal Portal</span>
          </p>
        </header>

        <div className="management-portal__grid">
          <article className="management-card management-card--management">
            <span className="management-card__icon" aria-hidden="true">
              <FiShield />
            </span>
            <h1>Management</h1>
            <p>Access for administrators, platform operators, and compliance leadership workspaces.</p>
            <span className="management-card__hint">Hover to reveal login options</span>
            <div className="management-card__actions">
              {managementLinks.map((item) => (
                <button
                  key={item.to}
                  type="button"
                  className="management-card__link"
                  onClick={() => openPortalLogin(item)}
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </article>

          <article className="management-card management-card--employee">
            <span className="management-card__icon" aria-hidden="true">
              <FiBriefcase />
            </span>
            <h2>Employee</h2>
            <p>Access for support, sales, and operations teams inside HHH Jobs.</p>
            <span className="management-card__hint">Hover to reveal login options</span>
            <div className="management-card__actions">
              {employeeLinks.map((item) => (
                <button
                  key={item.to}
                  type="button"
                  className="management-card__link"
                  onClick={() => openPortalLogin(item)}
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </article>
        </div>

        <footer className="management-portal__footer">
          <p>&copy; 2026 HHH Jobs. Authorized personnel only.</p>
        </footer>
      </section>
    </div>
  );
};

export default ManagementPortalPage;
