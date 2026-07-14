export const JOB_APPLICATION_MODES = Object.freeze({
  INTERNAL: 'internal',
  EXTERNAL: 'external',
  BOTH: 'both'
});

const validModes = new Set(Object.values(JOB_APPLICATION_MODES));

const normalizeModeValue = (value = '') => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  const aliases = {
    hhh: JOB_APPLICATION_MODES.INTERNAL,
    hhh_jobs: JOB_APPLICATION_MODES.INTERNAL,
    platform: JOB_APPLICATION_MODES.INTERNAL,
    company: JOB_APPLICATION_MODES.EXTERNAL,
    company_site: JOB_APPLICATION_MODES.EXTERNAL,
    redirect: JOB_APPLICATION_MODES.EXTERNAL,
    hybrid: JOB_APPLICATION_MODES.BOTH
  };
  return aliases[normalized] || normalized;
};

export const getJobExternalApplyUrl = (job = {}) => {
  const source = job && typeof job === 'object' ? job : {};
  return String(
    source.externalApplyUrl
    || source.external_apply_url
    || source.applyUrl
    || source.apply_url
    || ''
  ).trim();
};

export const getJobApplicationMode = (jobOrMode = {}) => {
  const isJob = jobOrMode && typeof jobOrMode === 'object';
  const explicitMode = isJob
    ? jobOrMode.applicationMode ?? jobOrMode.application_mode
    : jobOrMode;
  const normalized = normalizeModeValue(explicitMode);
  if (validModes.has(normalized)) return normalized;
  if (isJob && getJobExternalApplyUrl(jobOrMode)) return JOB_APPLICATION_MODES.EXTERNAL;
  return JOB_APPLICATION_MODES.INTERNAL;
};

export const canApplyInternallyToJob = (job = {}) =>
  getJobApplicationMode(job) !== JOB_APPLICATION_MODES.EXTERNAL;

export const canApplyExternallyToJob = (job = {}) => {
  const mode = getJobApplicationMode(job);
  return Boolean(getJobExternalApplyUrl(job))
    && (mode === JOB_APPLICATION_MODES.EXTERNAL || mode === JOB_APPLICATION_MODES.BOTH);
};

export const isValidHttpsApplyUrl = (value = '') => {
  try {
    const parsed = new URL(String(value || '').trim());
    return parsed.protocol === 'https:' && Boolean(parsed.hostname) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
};

export const openExternalApplyDestination = (value = '') => {
  const url = String(value || '').trim();
  if (typeof window === 'undefined' || !url) return false;

  const popup = window.open(url, '_blank');
  if (!popup) {
    window.location.assign(url);
    return true;
  }

  try {
    popup.opener = null;
  } catch {
    // Cross-origin windows can reject opener assignment.
  }
  return true;
};
