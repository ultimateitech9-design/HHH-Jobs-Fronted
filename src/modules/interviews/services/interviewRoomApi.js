import { apiFetch } from '../../../utils/api';

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const strictRequest = async ({ path, options, extract = (payload) => payload }) => {
  const response = await apiFetch(path, options);
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return extract(payload || {});
};

export const getInterviewRoom = async (interviewId) =>
  strictRequest({
    path: `/interviews/${interviewId}`,
    extract: (payload) => payload
  });

export const joinInterviewRoom = async (interviewId) =>
  strictRequest({
    path: `/interviews/${interviewId}/join`,
    options: { method: 'POST', body: JSON.stringify({}) },
    extract: (payload) => payload
  });

export const leaveInterviewRoom = async (interviewId) =>
  strictRequest({
    path: `/interviews/${interviewId}/leave`,
    options: { method: 'POST', body: JSON.stringify({}) },
    extract: (payload) => payload
  });

export const updateInterviewConsent = async (interviewId, payload) =>
  strictRequest({
    path: `/interviews/${interviewId}/consent`,
    options: { method: 'POST', body: JSON.stringify(payload) },
    extract: (responsePayload) => responsePayload
  });

export const getInterviewSignals = async (interviewId, since = '') =>
  strictRequest({
    path: `/interviews/${interviewId}/signals${since ? `?since=${encodeURIComponent(since)}` : ''}`,
    extract: (payload) => payload?.signals || []
  });

export const sendInterviewSignal = async (interviewId, payload) =>
  strictRequest({
    path: `/interviews/${interviewId}/signals`,
    options: { method: 'POST', body: JSON.stringify(payload) },
    extract: (responsePayload) => responsePayload?.signal || responsePayload
  });

export const updateInterviewWorkspace = async (interviewId, payload) =>
  strictRequest({
    path: `/interviews/${interviewId}/workspace`,
    options: { method: 'PATCH', body: JSON.stringify(payload) },
    extract: (responsePayload) => responsePayload
  });

export const executeInterviewCode = async (interviewId, payload) =>
  strictRequest({
    path: `/interviews/${interviewId}/code/execute`,
    options: { method: 'POST', body: JSON.stringify(payload) },
    extract: (responsePayload) => responsePayload?.execution || responsePayload
  });

export const endInterviewRoom = async (interviewId, payload) =>
  strictRequest({
    path: `/interviews/${interviewId}/end`,
    options: { method: 'POST', body: JSON.stringify(payload) },
    extract: (responsePayload) => responsePayload
  });

export const uploadInterviewRecording = async (interviewId, blob, fileName = 'interview-recording.webm') => {
  const formData = new FormData();
  formData.append('recording', blob, fileName);

  return strictRequest({
    path: `/interviews/${interviewId}/recording`,
    options: { method: 'POST', body: formData },
    extract: (payload) => payload?.recording || payload
  });
};

export const getInterviewRecording = async (interviewId) =>
  strictRequest({
    path: `/interviews/${interviewId}/recording`,
    extract: (payload) => payload?.recording || payload
  });
