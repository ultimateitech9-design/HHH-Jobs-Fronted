import { useLocation } from 'react-router-dom';
import AuthPageShell from '../components/AuthPageShell';
import LoginPanelContent from '../components/LoginPanelContent';
import { loginShellBenefits } from '../config/authOptions';

const LoginPage = () => {
  const location = useLocation();
  const portalLabel = location.state?.portalLabel || 'Portal Login';

  return (
    <AuthPageShell
      eyebrow="Secure Access"
      title={portalLabel}
      description="Sign in to manage applications, hiring activity, and account updates with confidence."
      sideTitle="Welcome back to your HHH Jobs account"
      sideDescription="Use a secure sign-in path to continue into the account experience that matches your role and goals."
      benefits={loginShellBenefits}
      balancedPanels
      panelClassName="w-full"
      sideClassName="w-full"
    >
      <LoginPanelContent portalLabel={portalLabel} />
    </AuthPageShell>
  );
};

export default LoginPage;
