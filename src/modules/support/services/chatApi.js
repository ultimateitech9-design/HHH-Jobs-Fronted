import { supportDummyData } from '../data/supportDummyData';
import { SUPPORT_BASE, safeRequest } from './ticketApi';

export const getChats = async () =>
  safeRequest({
    path: `${SUPPORT_BASE}/chats`,
    emptyData: [],
    fallbackData: supportDummyData.chats,
    extract: (payload) => payload?.chats || []
  });

export const transferChat = async (chatId, payload = {}) =>
  safeRequest({
    path: `${SUPPORT_BASE}/chats/${chatId}/transfer`,
    options: {
      method: 'PATCH',
      body: JSON.stringify(payload)
    },
    emptyData: null,
    fallbackData: null,
    extract: (responsePayload) => responsePayload?.chat || responsePayload || null
  });
