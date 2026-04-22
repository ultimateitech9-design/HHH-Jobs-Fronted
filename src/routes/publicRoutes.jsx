import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

const HomePage = lazy(() => import('../modules/common/pages/HomePage'));
const PublicAtsPage = lazy(() => import('../modules/common/pages/PublicAtsPage'));
const ServicesPage = lazy(() => import('../modules/common/pages/ServicesPage'));
const EmpVerifyPage = lazy(() => import('../modules/common/pages/EmpVerifyPage'));
const RetiredEmployeePage = lazy(() => import('../modules/common/pages/RetiredEmployeePage'));
const JobSeekersPage = lazy(() => import('../modules/common/pages/JobSeekersPage'));
const RecruitersPage = lazy(() => import('../modules/common/pages/RecruitersPage'));
const FreshersPage = lazy(() => import('../modules/common/pages/FreshersPage'));
const VeteransPage = lazy(() => import('../modules/common/pages/VeteransPage'));
const CampusConnectPage = lazy(() => import('../modules/common/pages/CampusConnectPage'));
const StudentExternalJobsPage = lazy(() => import('../modules/student/pages/StudentExternalJobsPage'));
const ForbiddenPage = lazy(() => import('../modules/common/pages/ForbiddenPage'));
const NotFoundPage = lazy(() => import('../modules/common/pages/NotFoundPage'));

const LoginPage = lazy(() => import('../modules/auth/pages/LoginPage'));
const SignupPage = lazy(() => import('../modules/auth/pages/SignupPage'));
const CampusConnectRegisterPage = lazy(() => import('../modules/auth/pages/CampusConnectRegisterPage'));
const OtpVerificationPage = lazy(() => import('../modules/auth/pages/OtpVerificationPage'));
const ForgotPasswordPage = lazy(() => import('../modules/auth/pages/ForgotPasswordPage'));
const OAuthCallbackPage = lazy(() => import('../modules/auth/pages/OAuthCallbackPage'));

const AboutUsPage = lazy(() => import('../modules/common/pages/footer/AboutUsPage'));
const BlogPage = lazy(() => import('../modules/common/pages/footer/BlogPage'));
const BlogArticlePage = lazy(() => import('../modules/common/pages/footer/BlogArticlePage'));
const CareersPage = lazy(() => import('../modules/common/pages/footer/CareersPage'));
const CompaniesPage = lazy(() => import('../modules/common/pages/CompaniesPage'));
const CompanyJobsPage = lazy(() => import('../modules/common/pages/CompanyJobsPage'));
const ContactUsPage = lazy(() => import('../modules/common/pages/footer/ContactUsPage'));
const HelpCenterPage = lazy(() => import('../modules/common/pages/footer/HelpCenterPage'));
const PrivacyPolicyPage = lazy(() => import('../modules/common/pages/footer/PrivacyPolicyPage'));
const TermsAndConditionsPage = lazy(() => import('../modules/common/pages/footer/TermsAndConditionsPage'));
const SitemapPage = lazy(() => import('../modules/common/pages/footer/SitemapPage'));
const CreditsPage = lazy(() => import('../modules/common/pages/footer/CreditsPage'));
const GrievancesPage = lazy(() => import('../modules/common/pages/footer/GrievancesPage'));
const ReportIssuePage = lazy(() => import('../modules/common/pages/footer/ReportIssuePage'));
const FraudAlertPage = lazy(() => import('../modules/common/pages/footer/FraudAlertPage'));
const TrustAndSafetyPage = lazy(() => import('../modules/common/pages/footer/TrustAndSafetyPage'));
const SummonsNoticesPage = lazy(() => import('../modules/common/pages/footer/SummonsNoticesPage'));

const publicRoutes = [
  { index: true, element: <HomePage /> },
  { path: 'ats', element: <PublicAtsPage /> },
  { path: 'services', element: <ServicesPage /> },
  { path: 'emp-verify', element: <EmpVerifyPage /> },
  { path: 'job-seekers', element: <JobSeekersPage /> },
  { path: 'recruiters', element: <RecruitersPage /> },
  { path: 'freshers', element: <FreshersPage /> },
  { path: 'veterans', element: <VeteransPage /> },
  { path: 'campus-connect', element: <CampusConnectPage /> },
  { path: 'retired-employee', element: <RetiredEmployeePage /> },
  { path: 'jobs', element: <StudentExternalJobsPage /> },
  { path: 'global-jobs', element: <Navigate to="/jobs" replace /> },
  { path: 'workflow', element: <Navigate to="/" replace /> },
  { path: 'forbidden', element: <ForbiddenPage /> },
  { path: 'login', element: <LoginPage /> },
  { path: 'login/:portalKey', element: <LoginPage /> },
  { path: 'sign-up', element: <SignupPage /> },
  { path: 'campus-connect/register', element: <CampusConnectRegisterPage /> },
  { path: 'verify-otp', element: <OtpVerificationPage /> },
  { path: 'forgot-password', element: <ForgotPasswordPage /> },
  { path: 'oauth/callback', element: <OAuthCallbackPage /> },
  { path: 'auth/oauth/google/callback', element: <OAuthCallbackPage /> },
  { path: 'auth/oauth/linkedin/callback', element: <OAuthCallbackPage /> },
  { path: 'about-us', element: <AboutUsPage /> },
  { path: 'blog', element: <BlogPage /> },
  { path: 'blog/:slug', element: <BlogArticlePage /> },
  { path: 'careers', element: <CareersPage /> },
  { path: 'companies', element: <CompaniesPage /> },
  { path: 'companies/:companySlug', element: <CompanyJobsPage /> },
  { path: 'contact-us', element: <ContactUsPage /> },
  { path: 'employer-home', element: <Navigate to="/companies" replace /> },
  { path: 'help-center', element: <HelpCenterPage /> },
  { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
  { path: 'terms-and-conditions', element: <TermsAndConditionsPage /> },
  { path: 'sitemap', element: <SitemapPage /> },
  { path: 'credits', element: <CreditsPage /> },
  { path: 'grievances', element: <GrievancesPage /> },
  { path: 'report-issue', element: <ReportIssuePage /> },
  { path: 'fraud-alert', element: <FraudAlertPage /> },
  { path: 'trust-and-safety', element: <TrustAndSafetyPage /> },
  { path: 'summons-notices', element: <SummonsNoticesPage /> },
  { path: '*', element: <NotFoundPage /> }
];

export default publicRoutes;
