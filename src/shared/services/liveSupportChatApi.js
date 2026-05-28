import { apiFetch } from '../../utils/api';

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const request = async (path, options = {}) => {
  const response = await apiFetch(path, options);
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return payload || {};
};

export const normalizeChatMessage = (message = {}) => ({
  id: message.id,
  chatId: message.chatId || message.chat_id,
  author: message.author || message.authorName || message.author_name || 'User',
  authorRole: message.authorRole || message.author_role || '',
  role: message.role || (['support', 'admin', 'super_admin', 'dataentry', 'sales', 'accounts'].includes(String(message.authorRole || message.author_role || '').toLowerCase()) ? 'agent' : 'customer'),
  message: message.message || message.text || '',
  text: message.text || message.message || '',
  isInternal: Boolean(message.isInternal || message.is_internal),
  createdAt: message.createdAt || message.created_at || new Date().toISOString()
});

export const normalizeChat = (chat = {}) => ({
  id: chat.id,
  requesterId: chat.requesterId || chat.requester_id,
  requesterName: chat.requesterName || chat.requester_name || '',
  requesterEmail: chat.requesterEmail || chat.requester_email || '',
  requesterRole: chat.requesterRole || chat.requester_role || '',
  visitor: chat.visitor || chat.requesterName || chat.requester_name || chat.requesterEmail || chat.requester_email || 'Customer',
  company: chat.company || chat.campus || chat.meta?.company || chat.requesterRole || chat.requester_role || 'Portal user',
  subject: chat.subject || 'Live support',
  stateName: chat.stateName || chat.state_name || chat.meta?.stateName || '',
  status: chat.status || 'open',
  assignedDepartment: chat.assignedDepartment || chat.assigned_department || 'support',
  assignedTo: chat.assignedTo || chat.assigneeName || chat.assignee_name || chat.assignedDepartment || chat.assigned_department || 'Support',
  assigneeId: chat.assigneeId || chat.assignee_id || '',
  assigneeName: chat.assigneeName || chat.assignee_name || '',
  lastMessage: chat.lastMessage || chat.last_message || '',
  transferReason: chat.transferReason || chat.transfer_reason || '',
  createdAt: chat.createdAt || chat.created_at || '',
  updatedAt: chat.updatedAt || chat.updated_at || '',
  messages: (chat.messages || []).map(normalizeChatMessage)
});

export const getSupportChats = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.department) searchParams.set('department', params.department);
  if (params.stateName) searchParams.set('stateName', params.stateName);
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const payload = await request(`/support/chats${suffix}`);
  return (payload.chats || []).map(normalizeChat);
};

export const getMySupportChat = async () => {
  const payload = await request('/support/chats/mine');
  return payload.chat ? normalizeChat(payload.chat) : null;
};

export const createSupportChat = async (body = {}) => {
  const payload = await request('/support/chats', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return normalizeChat(payload.chat || {});
};

export const getSupportChatMessages = async (chatId) => {
  const payload = await request(`/support/chats/${chatId}/messages`);
  return (payload.messages || []).map(normalizeChatMessage);
};

export const sendSupportChatMessage = async (chatId, message, options = {}) => {
  const payload = await request(`/support/chats/${chatId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message, ...options })
  });
  return {
    message: normalizeChatMessage(payload.message || {}),
    chat: normalizeChat(payload.chat || {})
  };
};

export const deleteSupportChatMessage = async (chatId, messageId) => {
  const payload = await request(`/support/chats/${chatId}/messages/${messageId}`, {
    method: 'DELETE'
  });
  return normalizeChat(payload.chat || {});
};

export const clearSupportChatMessages = async (chatId) => {
  const payload = await request(`/support/chats/${chatId}/messages`, {
    method: 'DELETE'
  });
  return normalizeChat(payload.chat || {});
};

export const transferSupportChat = async (chatId, body = {}) => {
  const payload = await request(`/support/chats/${chatId}/transfer`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  });
  return normalizeChat(payload.chat || {});
};
