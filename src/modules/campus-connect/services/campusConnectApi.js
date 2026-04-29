import { apiFetch } from '../../../utils/api';

const parseJson = async (res) => {
  try { return await res.json(); } catch { return null; }
};

const strictRequest = async ({ path, options = {}, extract = (p) => p }) => {
  const response = await apiFetch(path, options);
  const payload = await parseJson(response);
  if (!response.ok) throw new Error(payload?.message || `Request failed (${response.status})`);
  return extract(payload || {});
};

const safeRequest = async ({ path, options = {}, emptyData, extract = (p) => p }) => {
  try {
    const data = await strictRequest({ path, options, extract });
    return { data, error: '' };
  } catch (err) {
    return { data: emptyData, error: err.message || 'Request failed.' };
  }
};

// ── Profile ────────────────────────────────────────────────────────────────────
export const getCampusProfile = () =>
  safeRequest({ path: '/campus-connect/profile', emptyData: {}, extract: (p) => p.profile || {} });

export const updateCampusProfile = (payload) =>
  strictRequest({
    path: '/campus-connect/profile',
    options: { method: 'PUT', body: JSON.stringify(payload) },
    extract: (p) => p.profile
  });

// ── Students ──────────────────────────────────────────────────────────────────
export const getCampusStudents = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
  ).toString();
  return safeRequest({
    path: `/campus-connect/students${qs ? `?${qs}` : ''}`,
    emptyData: { students: [], total: 0, page: 1, totalPages: 1 },
    extract: (p) => ({ students: p.students || [], total: p.total || 0, page: p.page || 1, totalPages: p.totalPages || 1 })
  });
};

export const importCampusStudents = (csvFile) => {
  const formData = new FormData();
  formData.append('csv', csvFile);
  return strictRequest({
    path: '/campus-connect/students/import',
    options: { method: 'POST', body: formData },
    extract: (p) => p
  });
};

export const updateCampusStudent = (id, payload) =>
  strictRequest({
    path: `/campus-connect/students/${id}`,
    options: { method: 'PATCH', body: JSON.stringify(payload) },
    extract: (p) => p.student
  });

export const deleteCampusStudent = (id) =>
  strictRequest({ path: `/campus-connect/students/${id}`, options: { method: 'DELETE' } });

export const downloadStudentTemplate = () =>
  apiFetch('/campus-connect/students/template');

// ── Drives ────────────────────────────────────────────────────────────────────
export const getCampusDrives = () =>
  safeRequest({ path: '/campus-connect/drives', emptyData: [], extract: (p) => p.drives || [] });

export const createCampusDrive = (payload) =>
  strictRequest({
    path: '/campus-connect/drives',
    options: { method: 'POST', body: JSON.stringify(payload) },
    extract: (p) => p.drive
  });

export const updateCampusDrive = (id, payload) =>
  strictRequest({
    path: `/campus-connect/drives/${id}`,
    options: { method: 'PATCH', body: JSON.stringify(payload) },
    extract: (p) => p.drive
  });

export const deleteCampusDrive = (id) =>
  strictRequest({ path: `/campus-connect/drives/${id}`, options: { method: 'DELETE' } });

export const getCampusDriveApplications = (driveId) =>
  safeRequest({
    path: `/campus-connect/drives/${driveId}/applications`,
    emptyData: {
      drive: null,
      applications: [],
      summary: {
        total: 0,
        applied: 0,
        shortlisted: 0,
        selected: 0,
        rejected: 0,
        withdrawn: 0
      }
    },
    extract: (p) => ({
      drive: p.drive || null,
      applications: p.applications || [],
      summary: p.summary || {
        total: 0,
        applied: 0,
        shortlisted: 0,
        selected: 0,
        rejected: 0,
        withdrawn: 0
      }
    })
  });

export const updateCampusDriveApplication = (driveId, applicationId, payload) =>
  strictRequest({
    path: `/campus-connect/drives/${driveId}/applications/${applicationId}`,
    options: { method: 'PATCH', body: JSON.stringify(payload) },
    extract: (p) => p.application || p
  });

// ── Connections ───────────────────────────────────────────────────────────────
export const getCampusConnections = () =>
  safeRequest({ path: '/campus-connect/connections', emptyData: [], extract: (p) => p.connections || [] });

export const respondToConnection = (id, status) =>
  strictRequest({
    path: `/campus-connect/connections/${id}`,
    options: { method: 'PATCH', body: JSON.stringify({ status }) },
    extract: (p) => p.connection
  });

// ── Stats ─────────────────────────────────────────────────────────────────────
export const getCampusStats = () =>
  safeRequest({ path: '/campus-connect/stats', emptyData: {}, extract: (p) => p.stats || {} });

// ── Reports ───────────────────────────────────────────────────────────────────
export const exportPlacementReport = async () => {
  const response = await apiFetch('/campus-connect/reports/export');
  if (!response.ok) throw new Error('Export failed.');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'placement-report.csv';
  a.click();
  URL.revokeObjectURL(url);
};
