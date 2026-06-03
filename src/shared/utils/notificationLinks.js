const parseNotificationMeta = (meta) => {
  if (!meta) return {};
  if (typeof meta === 'object') return meta;
  try {
    const parsed = JSON.parse(meta);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    return {};
  }
};

const buildHrJobApplicantsLink = ({ jobId, applicationId }) => {
  const base = `/portal/hr/jobs/${jobId}/applicants`;
  return applicationId ? `${base}?applicationId=${applicationId}` : base;
};

export const resolveNotificationLink = (notification = {}) => {
  const explicitLink = String(notification.link || '').trim();
  const meta = parseNotificationMeta(notification.meta);
  const type = String(notification.type || '').toLowerCase();
  const jobId = meta.jobId || meta.job_id;
  const applicationId = meta.applicationId || meta.application_id;
  const isHrApplicationNotification = [
    'new_application',
    'application_offer_response',
    'application_status_update'
  ].includes(type);

  if (
    explicitLink
    && (
      explicitLink.startsWith('/portal/hr/jobs/')
      || explicitLink.startsWith('/hr/jobs/')
    )
  ) {
    return explicitLink.startsWith('/hr/jobs/') ? `/portal${explicitLink}` : explicitLink;
  }

  if (
    jobId
    && (
      isHrApplicationNotification
      || explicitLink === '/hr'
      || explicitLink === '/portal/hr/jobs'
      || explicitLink.startsWith('/portal/hr/jobs/')
      || explicitLink.startsWith('/hr/jobs')
    )
  ) {
    return buildHrJobApplicantsLink({ jobId, applicationId });
  }

  if (explicitLink === '/hr') return '/portal/hr/dashboard';
  if (explicitLink.startsWith('/hr/')) return `/portal${explicitLink}`;
  return explicitLink;
};
