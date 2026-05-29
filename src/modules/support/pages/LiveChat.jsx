import { useEffect, useMemo, useState } from 'react';
import ChatWindow from '../components/ChatWindow';
import SupportHeader from '../components/SupportHeader';
import useChat from '../hooks/useChat';
import { transferChat } from '../services/chatApi';
import {
  clearSupportChatMessages,
  deleteSupportChatMessage,
  sendSupportChatMessage,
  updateSupportChatStatus
} from '../../../shared/services/liveSupportChatApi';
import { formatSupportDepartment } from '../utils/ticketHelpers';

const LiveChat = () => {
  const { chats, setChats, loading, error, setError, isDemo } = useChat();
  const [activeId, setActiveId] = useState('');
  const [seenChats, setSeenChats] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('supportLiveChatSeen') || '{}');
    } catch (storageError) {
      return {};
    }
  });
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [transferringId, setTransferringId] = useState('');
  const activeChat = chats.find((chat) => chat.id === activeId) || chats[0] || null;
  const unreadCounts = useMemo(() => chats.reduce((counts, chat) => {
    const seenAt = seenChats[chat.id] ? new Date(seenChats[chat.id]).getTime() : 0;
    counts[chat.id] = (chat.messages || []).filter((message) => (
      message?.role === 'customer' && new Date(message.createdAt || 0).getTime() > seenAt
    )).length;
    return counts;
  }, {}), [chats, seenChats]);

  useEffect(() => {
    if (!activeChat?.id || !(activeChat.messages || []).length) return;

    const latestMessageAt = (activeChat.messages || []).reduce((latest, message) => {
      const createdAt = new Date(message?.createdAt || 0).getTime();
      return Number.isFinite(createdAt) && createdAt > latest ? createdAt : latest;
    }, 0);

    if (!latestMessageAt) return;
    const latestSeen = new Date(latestMessageAt).toISOString();
    if (seenChats[activeChat.id] && new Date(seenChats[activeChat.id]).getTime() >= latestMessageAt) return;

    setSeenChats((current) => {
      const next = { ...current, [activeChat.id]: latestSeen };
      window.localStorage.setItem('supportLiveChatSeen', JSON.stringify(next));
      return next;
    });
  }, [activeChat?.id, activeChat?.messages?.length, seenChats]);

  const handleTransfer = async (chat, department) => {
    if (!chat?.id) return;
    setTransferringId(chat.id);
    setError('');
    const reason = department === 'dataentry'
      ? 'Customer needs onboarding or posting data entry support.'
      : department === 'sales'
        ? 'Customer needs package or onboarding sales handling.'
        : department === 'accounts'
          ? 'Customer needs billing or invoice handling.'
          : `Moved to ${formatSupportDepartment(department)} queue.`;
    const response = await transferChat(chat.id, { department, reason });
    if (response.error && !response.isDemo) {
      setError(response.error);
    }
    setChats((current) => current.map((item) => (
      item.id === chat.id
        ? { ...item, ...(response.data || {}), assignedDepartment: department, assignedTo: department, transferReason: reason }
        : item
    )));
    setTransferringId('');
  };

  const handleReply = async (event) => {
    event.preventDefault();
    if (!activeChat?.id || !reply.trim()) return;

    setSending(true);
    setError('');
    try {
      const response = await sendSupportChatMessage(activeChat.id, reply.trim());
      setChats((current) => current.map((item) => (
        item.id === activeChat.id
          ? {
            ...item,
            ...response.chat,
            messages: [...(item.messages || []), response.message].filter((message) => message?.id)
          }
          : item
      )));
      setReply('');
    } catch (replyError) {
      setError(replyError.message || 'Unable to send reply.');
    } finally {
      setSending(false);
    }
  };

  const updateChat = (chatId, nextChat) => {
    setChats((current) => current.map((item) => (
      item.id === chatId ? { ...item, ...nextChat } : item
    )));
  };

  const handleUpdateStatus = async (chat, status) => {
    if (!chat?.id || !status) return;
    setError('');
    try {
      const updatedChat = await updateSupportChatStatus(chat.id, status);
      updateChat(chat.id, updatedChat);
    } catch (statusError) {
      setError(statusError.message || 'Unable to update chat status.');
    }
  };

  const handleDeleteMessage = async (chat, message) => {
    if (!chat?.id || !message?.id) return;
    if (!window.confirm('Delete this message?')) return;
    setError('');
    try {
      const updatedChat = await deleteSupportChatMessage(chat.id, message.id);
      updateChat(chat.id, updatedChat);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete message.');
    }
  };

  const handleClearChat = async (chat) => {
    if (!chat?.id || !(chat.messages || []).length) return;
    if (!window.confirm('Clear all messages in this chat?')) return;
    setError('');
    try {
      const updatedChat = await clearSupportChatMessages(chat.id);
      updateChat(chat.id, updatedChat);
    } catch (clearError) {
      setError(clearError.message || 'Unable to clear chat.');
    }
  };

  return (
    <div className="module-page module-page--platform">
      <SupportHeader title="Live Chat" subtitle="Review active customer chat sessions and respond to real-time support requests." />
      {isDemo ? <p className="module-note">Demo chat conversations are shown.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="module-note">Loading live chat...</p> : null}
      {!loading ? (
        <div className="grid min-h-[560px] gap-3 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="panel-card flex min-h-0 flex-col !p-0">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-[15px] font-extrabold leading-5 text-slate-900">Active Chats</h3>
              <p className="mt-0.5 text-[12px] font-semibold leading-4 text-slate-500">Support queue, state-wise assigned.</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {chats.length ? chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => setActiveId(chat.id)}
                  className={`mb-2 w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    activeChat?.id === chat.id
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-extrabold leading-5 text-slate-900">{chat.visitor}</p>
                    <span className="flex shrink-0 items-center gap-1">
                      {unreadCounts[chat.id] > 0 ? (
                        <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1.5 text-[10px] font-black leading-none text-white shadow-sm">
                          {unreadCounts[chat.id] > 99 ? '99+' : unreadCounts[chat.id]}
                        </span>
                      ) : null}
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase leading-3 ${
                        chat.status === 'waiting' || chat.queueStatus === 'waiting'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>{chat.status}</span>
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] font-semibold leading-4 text-slate-500">{chat.subject}</p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold leading-4 text-slate-400">{chat.stateName || 'No state'} | {chat.assignedDepartment}</p>
                </button>
              )) : (
                <p className="p-4 text-sm font-semibold text-slate-500">No active chats yet.</p>
              )}
            </div>
          </aside>

          <ChatWindow
            chat={activeChat}
            message={reply}
            onMessageChange={setReply}
            onReply={handleReply}
            onTransfer={handleTransfer}
            onUpdateStatus={handleUpdateStatus}
            onDeleteMessage={handleDeleteMessage}
            onClearChat={handleClearChat}
            sending={sending}
            transferring={transferringId === activeChat?.id}
          />
        </div>
      ) : null}
    </div>
  );
};

export default LiveChat;
