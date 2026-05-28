import { supportDummyData } from '../data/supportDummyData';
import { SUPPORT_BASE, safeRequest } from './ticketApi';
import { normalizeChat, transferSupportChat } from '../../../shared/services/liveSupportChatApi';

export const getChats = async () =>
  safeRequest({
    path: `${SUPPORT_BASE}/chats`,
    emptyData: [],
    fallbackData: supportDummyData.chats,
    extract: (payload) => (payload?.chats || []).map(normalizeChat)
  });

export const transferChat = async (chatId, payload = {}) => {
  try {
    return { data: await transferSupportChat(chatId, payload), error: '', isDemo: false };
  } catch (error) {
    return { data: null, error: error.message || 'Request failed.', isDemo: false };
  }
};
