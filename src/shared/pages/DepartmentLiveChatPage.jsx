import { useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiRefreshCw, FiSend, FiTrash2 } from 'react-icons/fi';
import ChatMessage from '../../modules/support/components/ChatMessage';
import EmptyState from '../../modules/support/components/EmptyState';
import SupportHeader from '../../modules/support/components/SupportHeader';
import {
  clearSupportChatMessages,
  deleteSupportChatMessage,
  getSupportChats,
  sendSupportChatMessage,
  updateSupportChatStatus
} from '../services/liveSupportChatApi';

const departmentCopy = {
  dataentry: {
    title: 'Data Entry Chat',
    subtitle: 'Reply to support-transferred customer chats related to data posting, records, and publishing.'
  },
  accounts: {
    title: 'Accounts Chat',
    subtitle: 'Handle billing, invoices, payout, refund, and payment queries transferred by support.'
  },
  sales: {
    title: 'Sales Chat',
    subtitle: 'Continue support-transferred customer chats for packages, leads, onboarding, and sales follow-up.'
  }
};

const DepartmentLiveChatPage = ({ department = 'support' }) => {
  const copy = departmentCopy[department] || departmentCopy.dataentry;
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeId) || chats[0] || null,
    [activeId, chats]
  );
  const handleEnterToSend = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const rows = await getSupportChats({ department });
        if (!active) return;
        setChats(rows);
        setError('');
      } catch (loadError) {
        if (active) setError(loadError.message || 'Unable to load transferred chats.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [department]);

  const handleReply = async (event) => {
    event.preventDefault();
    if (!activeChat?.id || !reply.trim()) return;

    setSending(true);
    setError('');
    try {
      const response = await sendSupportChatMessage(activeChat.id, reply.trim());
      setChats((current) => current.map((chat) => (
        chat.id === activeChat.id
          ? {
            ...chat,
            ...response.chat,
            messages: [...(chat.messages || []), response.message].filter((message) => message?.id)
          }
          : chat
      )));
      setReply('');
    } catch (replyError) {
      setError(replyError.message || 'Unable to send reply.');
    } finally {
      setSending(false);
    }
  };

  const updateChat = (chatId, nextChat) => {
    setChats((current) => current.map((chat) => (
      chat.id === chatId ? { ...chat, ...nextChat } : chat
    )));
  };

  const handleUpdateStatus = async (status) => {
    if (!activeChat?.id || !status) return;
    setError('');
    try {
      const updatedChat = await updateSupportChatStatus(activeChat.id, status);
      updateChat(activeChat.id, updatedChat);
    } catch (statusError) {
      setError(statusError.message || 'Unable to update chat status.');
    }
  };

  const handleDeleteMessage = async (message) => {
    if (!activeChat?.id || !message?.id) return;
    if (!window.confirm('Delete this message?')) return;
    setError('');
    try {
      const updatedChat = await deleteSupportChatMessage(activeChat.id, message.id);
      updateChat(activeChat.id, updatedChat);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete message.');
    }
  };

  const handleClearChat = async () => {
    if (!activeChat?.id || !(activeChat.messages || []).length) return;
    if (!window.confirm('Clear all messages in this chat?')) return;
    setError('');
    try {
      const updatedChat = await clearSupportChatMessages(activeChat.id);
      updateChat(activeChat.id, updatedChat);
    } catch (clearError) {
      setError(clearError.message || 'Unable to clear chat.');
    }
  };

  return (
    <div className="module-page module-page--platform">
      <SupportHeader title={copy.title} subtitle={copy.subtitle} />
      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="module-note inline-flex items-center gap-2"><FiRefreshCw className="animate-spin" /> Loading chats...</p> : null}

      {!loading ? (
        <div className="grid min-h-[620px] gap-4 xl:grid-cols-[320px_1fr]">
          <aside className="panel-card flex min-h-0 flex-col !p-0">
            <div className="border-b border-slate-100 p-4">
              <h3 className="text-base font-extrabold text-slate-900">Transferred Chats</h3>
              <p className="text-xs font-semibold text-slate-500">Only {department} assigned chats appear here.</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {chats.length ? chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => setActiveId(chat.id)}
                  className={`mb-2 w-full rounded-2xl border p-3 text-left transition-colors ${
                    activeChat?.id === chat.id
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-extrabold text-slate-900">{chat.visitor}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                      chat.status === 'waiting' || chat.queueStatus === 'waiting'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>{chat.status}</span>
                  </div>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">{chat.subject}</p>
                  <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">{chat.stateName || 'No state'} | {chat.lastMessage || 'No message'}</p>
                </button>
              )) : (
                <p className="p-4 text-sm font-semibold text-slate-500">No chats transferred here yet.</p>
              )}
            </div>
          </aside>

          {activeChat ? (
            <section className="panel-card flex min-h-[560px] flex-col overflow-hidden !p-0">
              <div className="dash-card-head">
                <div>
                  <h3>{activeChat.visitor}</h3>
                  <p>{activeChat.company} | {activeChat.stateName || 'State not set'} | Support transferred to {department}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(['closed', 'resolved'].includes(String(activeChat.status || '').toLowerCase()) ? 'open' : 'resolved')}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    {['closed', 'resolved'].includes(String(activeChat.status || '').toLowerCase()) ? <FiRefreshCw size={13} /> : <FiCheckCircle size={13} />}
                    {['closed', 'resolved'].includes(String(activeChat.status || '').toLowerCase()) ? 'Reopen' : 'Resolve'}
                  </button>
                  <button
                    type="button"
                    disabled={!(activeChat.messages || []).length}
                    onClick={handleClearChat}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black uppercase text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiTrash2 size={13} /> Clear
                  </button>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase text-amber-700">{activeChat.assignedDepartment}</span>
                </div>
              </div>
              {activeChat.transferReason ? <p className="module-note px-4">Transfer note: {activeChat.transferReason}</p> : null}
              <div className="flex-1 space-y-3 overflow-y-auto border-y border-slate-100 bg-slate-50 p-4">
                {(activeChat.messages || []).map((message) => (
                  <ChatMessage key={message.id} message={message} onDelete={handleDeleteMessage} />
                ))}
              </div>
              <form onSubmit={handleReply} className="flex items-end gap-3 p-4">
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  onKeyDown={handleEnterToSend}
                  rows={3}
                  className="min-h-[72px] flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-amber-400"
                  placeholder="Reply and ask for the needed details..."
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="btn-primary min-w-[108px] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? 'Sending...' : <span className="inline-flex items-center gap-2"><FiSend /> Send</span>}
                </button>
              </form>
            </section>
          ) : (
            <EmptyState title="No transferred chat selected." description="When support transfers a chat to this department, it will appear here." />
          )}
        </div>
      ) : null}
    </div>
  );
};

export default DepartmentLiveChatPage;
