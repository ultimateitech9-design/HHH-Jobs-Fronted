import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import HomePage from '../modules/common/pages/HomePage';

const initialPublicPath = typeof window === 'undefined' ? '/' : window.location.pathname;
const lazyPublicRoute = (pattern, importer) => {
  const warmedModule = pattern.test(initialPublicPath) ? importer() : null;
  return lazy(() => warmedModule || importer());
};

const PublicAtsPage = lazyPublicRoute(/^\/ats\/?$/, () => import('../modules/common/pages/PublicAtsPage'));
const ServicesPage = lazyPublicRoute(/^\/services\/?$/, () => import('../modules/common/pages/ServicesPage'));
const EmpVerifyPage = lazyPublicRoute(/^\/emp-verify\/?$/, () => import('../modules/common/pages/EmpVerifyPage'));
const RetiredEmployeePage = lazyPublicRoute(/^\/retired-employee\/?$/, () => import('../modules/common/pages/RetiredEmployeePage'));
const JobSeekersPage = lazyPublicRoute(/^\/job-seekers\/?$/, () => import('../modules/common/pages/JobSeekersPage'));
const RecruitersPage = lazyPublicRoute(/^\/recruiters\/?$/, () => import('../modules/common/pages/RecruitersPage'));
const FreshersPage = lazyPublicRoute(/^\/freshers\/?$/, () => import('../modules/common/pages/FreshersPage'));
const VeteransPage = lazyPublicRoute(/^\/veterans\/?$/, () => import('../modules/common/pages/VeteransPage'));
const CampusConnectPage = lazyPublicRoute(/^\/campus-connect\/?$/, () => import('../modules/common/pages/CampusConnectPage'));
const ConsultancyLandingPage = lazyPublicRoute(/^\/consultancy\/?$/, () => import('../modules/consultancy/pages/ConsultancyLandingPage'));
const PublicJobsLandingPage = lazyPublicRoute(/^\/jobs\/?$/, () => import('../modules/student/pages/PublicJobsLandingPage'));
const StudentJobDetailsPage = lazyPublicRoute(
  /^\/jobs\/(?!(?:categories|cities|sectors)(?:\/|$))[^/]+\/?$/,
  () => import('../modules/student/pages/StudentJobDetailsPage')
);
const FacetDirectoryPage = lazyPublicRoute(
  /^\/jobs\/(?:categories|sectors)\/?$/,
  () => import('../modules/common/pages/FacetDirectoryPage')
);
const LocationDirectoryPage = lazyPublicRoute(
  /^\/jobs\/cities\/?$/,
  () => import('../modules/common/pages/LocationDirectoryPage')
);
const StudentGovtJobsPage = lazyPublicRoute(/^\/govt-jobs\/?$/, () => import('../modules/student/pages/StudentGovtJobsPage'));
const StudentGovtJobDetailsPage = lazyPublicRoute(/^\/govt-jobs\/[^/]+\/?$/, () => import('../modules/student/pages/StudentGovtJobDetailsPage'));
const ForbiddenPage = lazy(() => import('../modules/common/pages/ForbiddenPage'));
const NotFoundPage = lazy(() => import('../modules/common/pages/NotFoundPage'));

const LoginPage = lazyPublicRoute(/^\/login(?:\/[^/]+)?\/?$/, () => import('../modules/auth/pages/LoginPage'));
const SignupPage = lazyPublicRoute(/^\/sign-up\/?$/, () => import('../modules/auth/pages/SignupPage'));
const CampusConnectRegisterPage = lazyPublicRoute(/^\/campus-connect\/register\/?$/, () => import('../modules/auth/pages/CampusConnectRegisterPage'));
const OtpVerificationPage = lazyPublicRoute(/^\/verify-otp\/?$/, () => import('../modules/auth/pages/OtpVerificationPage'));
const ForgotPasswordPage = lazyPublicRoute(/^\/forgot-password\/?$/, () => import('../modules/auth/pages/ForgotPasswordPage'));
const OAuthCallbackPage = lazyPublicRoute(/^\/(?:oauth\/callback|auth\/oauth\/(?:google|linkedin)\/callback)\/?$/, () => import('../modules/auth/pages/OAuthCallbackPage'));

const AboutUsPage = lazyPublicRoute(/^\/about-us\/?$/, () => import('../modules/common/pages/footer/AboutUsPage'));
const BlogPage = lazyPublicRoute(/^\/blog\/?$/, () => import('../modules/common/pages/footer/BlogPage'));
const BlogArticlePage = lazyPublicRoute(/^\/blog\/[^/]+\/?$/, () => import('../modules/common/pages/footer/BlogArticlePage'));
const CareersPage = lazyPublicRoute(/^\/careers\/?$/, () => import('../modules/common/pages/footer/CareersPage'));
const CompaniesPage = lazyPublicRoute(/^\/companies\/?$/, () => import('../modules/common/pages/CompaniesPage'));
const CompanyJobsPage = lazyPublicRoute(/^\/companies\/[^/]+\/?$/, () => import('../modules/common/pages/CompanyJobsPage'));
const ContactUsPage = lazyPublicRoute(/^\/contact-us\/?$/, () => import('../modules/common/pages/footer/ContactUsPage'));
const HelpCenterPage = lazyPublicRoute(/^\/help-center\/?$/, () => import('../modules/common/pages/footer/HelpCenterPage'));
const PrivacyPolicyPage = lazyPublicRoute(/^\/privacy-policy\/?$/, () => import('../modules/common/pages/footer/PrivacyPolicyPage'));
const TermsAndConditionsPage = lazyPublicRoute(/^\/terms-and-conditions\/?$/, () => import('../modules/common/pages/footer/TermsAndConditionsPage'));
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
  { path: 'pricing', element: <Navigate to="/services" replace /> },
  { path: 'emp-verify', element: <EmpVerifyPage /> },
  { path: 'job-seekers', element: <JobSeekersPage /> },
  { path: 'recruiters', element: <RecruitersPage /> },
  { path: 'freshers', element: <FreshersPage /> },
  { path: 'veterans', element: <VeteransPage /> },
  { path: 'campus-connect', element: <CampusConnectPage /> },
  { path: 'consultancy', element: <ConsultancyLandingPage /> },
  { path: 'retired-employee', element: <RetiredEmployeePage /> },
  { path: 'jobs/categories', element: <FacetDirectoryPage /> },
  { path: 'jobs/cities', element: <LocationDirectoryPage /> },
  { path: 'jobs/sectors', element: <FacetDirectoryPage /> },
  { path: 'jobs', element: <PublicJobsLandingPage /> },
  { path: 'jobs/:jobId', element: <StudentJobDetailsPage publicMode /> },
  { path: 'govt-jobs', element: <StudentGovtJobsPage publicMode /> },
  { path: 'govt-jobs/:jobId', element: <StudentGovtJobDetailsPage publicMode /> },
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
  { path: 'about', element: <Navigate to="/about-us" replace /> },
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
