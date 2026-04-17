import { apiFetch, areDemoFallbacksEnabled } from '../../../utils/api';
import { supportDummyData } from '../data/supportDummyData';
import { normalizeTicket } from '../utils/ticketHelpers';

export const SUPPORT_BASE = '/support';

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const clone = (value) => {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
};

const strictRequest = async ({ path, options, extract = (payload) => payload }) => {
  const response = await apiFetch(path, options);
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return extract(payload || {});
};

export const safeRequest = async ({ path, options, emptyData, fallbackData, extract = (payload) => payload }) => {
  try {
    const data = await strictRequest({ path, options, extract });
    return { data, error: '', isDemo: false };
  } catch (error) {
    const resolvedFallback = areDemoFallbacksEnabled()
      ? (typeof fallbackData === 'function' ? fallbackData() : fallbackData)
      : undefined;
    return {
      data: clone(resolvedFallback !== undefined ? resolvedFallback : emptyData),
      error: error.message || 'Request failed.',
      isDemo: resolvedFallback !== undefined
    };
  }
};

export const getSupportStats = async () =>
  safeRequest({
    path: `${SUPPORT_BASE}/stats`,
    emptyData: {
      totalTickets: 0,
      openTickets: 0,
      pendingTickets: 0,
      resolvedTickets: 0,
      escalatedTickets: 0,
      liveChats: 0,
      complaints: 0,
      feedbackItems: 0,
      avgResolutionHours: 0
    },
    fallbackData: supportDummyData.stats,
    extract: (payload) => payload?.stats || payload || {}
  });

export const getTickets = async () =>
  safeRequest({
    path: `${SUPPORT_BASE}/tickets`,
    emptyData: [],
    fallbackData: supportDummyData.tickets.map(normalizeTicket),
    extract: (payload) => (payload?.tickets || []).map(normalizeTicket)
  });

export const getTicketDetails = async (ticketId) =>
  safeRequest({
    path: `${SUPPORT_BASE}/tickets/${ticketId}`,
    emptyData: {},
    fallbackData: supportDummyData.tickets.find((ticket) => ticket.id === ticketId) || supportDummyData.tickets[0] || {},
    extract: (payload) => payload?.ticket || payload || {}
  });

export const createTicket = async (ticketPayload) =>
  safeRequest({
    path: `${SUPPORT_BASE}/tickets`,
    options: { method: 'POST', body: JSON.stringify(ticketPayload) },
    emptyData: null,
    extract: (payload) => payload?.ticket || payload
  });

export const replyToTicket = async (ticketId, message) =>
  safeRequest({
    path: `${SUPPORT_BASE}/tickets/${ticketId}/reply`,
    options: { method: 'POST', body: JSON.stringify({ message }) },
    emptyData: null,
    extract: (payload) => payload?.reply || payload
  });

export const escalateTicket = async (ticketId, reason = '') =>
  safeRequest({
    path: `${SUPPORT_BASE}/tickets/${ticketId}/escalate`,
    options: { method: 'POST', body: JSON.stringify({ reason }) },
    emptyData: null,
    extract: (payload) => payload?.ticket || payload
  });

export const addInternalNote = async (ticketId, message) =>
  safeRequest({
    path: `${SUPPORT_BASE}/tickets/${ticketId}/internal-note`,
    options: { method: 'POST', body: JSON.stringify({ message }) },
    emptyData: null,
    extract: (payload) => payload?.note || payload
  });

export const updateTicket = async (ticketId, updates = {}) =>
  safeRequest({
    path: `${SUPPORT_BASE}/tickets/${ticketId}`,
    options: { method: 'PATCH', body: JSON.stringify(updates) },
    emptyData: null,
    extract: (payload) => payload?.ticket || payload
  });
