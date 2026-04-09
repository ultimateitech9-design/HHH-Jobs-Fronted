export const JOB_GATE_PORTAL_LABEL = 'Login to Unlock Jobs';

export const shouldLockJobBoards = (isAuthenticated) => !isAuthenticated;

export const getPublicJobsNavPath = () => '/jobs';

export const getLoginRedirectState = (fromPath, portalLabel = JOB_GATE_PORTAL_LABEL) => ({
  from: fromPath,
  portalLabel
});

export const getCompanyEntryIntent = ({ companySlug, isAuthenticated, totalJobs = 0 }) => {
  const companyPath = `/companies/${companySlug}`;
  const hasJobs = Number(totalJobs || 0) > 0;

  if (shouldLockJobBoards(isAuthenticated)) {
    return {
      accessLabel: 'Private role board',
      helperText: 'Login required to unlock company jobs.',
      state: getLoginRedirectState(companyPath),
      to: '/login',
      tone: 'locked'
    };
  }

  return {
    accessLabel: hasJobs ? 'Hiring unlocked' : 'View profile',
    helperText: hasJobs ? 'Open the company hiring lounge.' : 'View this company profile.',
    state: undefined,
    to: companyPath,
    tone: hasJobs ? 'active' : 'default'
  };
};
