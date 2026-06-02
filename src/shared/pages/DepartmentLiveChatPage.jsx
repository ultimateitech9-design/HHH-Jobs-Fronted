import { useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiClock, FiRefreshCw, FiSend, FiSlash, FiTrash2, FiUnlock } from 'react-icons/fi';
import ChatMessage from '../../modules/support/components/ChatMessage';
import EmptyState from '../../modules/support/components/EmptyState';
import SupportHeader from '../../modules/support/components/SupportHeader';
import {
  clearSupportChatMessages,
  deleteSupportChatMessage,
  getSupportChats,
  moderateSupportChat,
  sendSupportChatMessage,
  transferSupportChat,
  updateSupportChatStatus
} from '../services/liveSupportChatApi';
import { formatSupportDepartment } from '../../modules/support/utils/ticketHelpers';

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

const transferOptions = [
  { value: 'support', label: 'Support' },
  { value: 'dataentry', label: 'Data Entry' },
  { value: 'sales', label: 'Sales' },
  { value: 'accounts', label: 'Accounts' }
];

const DepartmentLiveChatPage = ({ department = 'support' }) => {
  const copy = departmentCopy[department] || departmentCopy.dataentry;
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [transferring, setTransferring] = useState(false);
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

  const handleTransfer = async (targetDepartment) => {
    if (!activeChat?.id || !targetDepartment) return;
    const currentDepartment = String(activeChat.assignedDepartment || department || '').toLowerCase();
    if (currentDepartment === targetDepartment) return;

    const reason = window.prompt(
      `Transfer reason for ${formatSupportDepartment(targetDepartment)}`,
      `Needs ${formatSupportDepartment(targetDepartment)} follow-up.`
    );
    if (reason === null) return;

    setTransferring(true);
    setError('');
    try {
      const updatedChat = await transferSupportChat(activeChat.id, {
        department: targetDepartment,
        reason: reason.trim() || `Needs ${formatSupportDepartment(targetDepartment)} follow-up.`
      });
      updateChat(activeChat.id, updatedChat);
    } catch (transferError) {
      setError(transferError.message || 'Unable to transfer chat.');
    } finally {
      setTransferring(false);
    }
  };

  const handleTransferSelect = (event) => {
    const targetDepartment = event.target.value;
    event.target.value = '';
    handleTransfer(targetDepartment);
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

  const handleModerateChat = async (actionPayload = {}) => {
    if (!activeChat?.id || !actionPayload?.action) return;
    const action = actionPayload.action;
    const label = action === 'ban' ? 'ban this customer for 24 hours' : action === 'block' ? 'block this customer' : 'unblock this customer';
    if (!window.confirm(`Do you want to ${label}?`)) return;
    const reason = window.prompt('Reason for moderation', action === 'ban' ? 'Abusive or inappropriate chat behavior.' : '') || '';
    setError('');
    try {
      const updatedChat = await moderateSupportChat(activeChat.id, { ...actionPayload, reason });
      updateChat(activeChat.id, updatedChat);
    } catch (moderationError) {
      setError(moderationError.message || 'Unable to update moderation status.');
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
              <p className="text-xs font-semibold text-slate-500">Chats assigned to {formatSupportDepartment(department)} appear here.</p>
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
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <div className="min-w-0 flex-1 basis-[220px]">
                  <h3 className="truncate text-[15px] font-extrabold leading-5 text-slate-900">{activeChat.visitor}</h3>
                  <p className="mt-0.5 truncate text-[12px] font-semibold leading-4 text-slate-500">
                    {activeChat.company} | {activeChat.stateName || 'State not set'} | Support transferred to {formatSupportDepartment(activeChat.assignedDepartment || department)}
                  </p>
                </div>
                <div className="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(['closed', 'resolved'].includes(String(activeChat.status || '').toLowerCase()) ? 'open' : 'resolved')}
                    className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 text-[10px] font-extrabold uppercase leading-none text-emerald-700 transition-colors hover:bg-emerald-100 whitespace-nowrap"
                  >
                    {['closed', 'resolved'].includes(String(activeChat.status || '').toLowerCase()) ? <FiRefreshCw size={12} /> : <FiCheckCircle size={12} />}
                    {['closed', 'resolved'].includes(String(activeChat.status || '').toLowerCase()) ? 'Reopen' : 'Resolve'}
                  </button>
                  <button
                    type="button"
                    disabled={!(activeChat.messages || []).length}
                    onClick={handleClearChat}
                    className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 text-[10px] font-extrabold uppercase leading-none text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
                  >
                    <FiTrash2 size={12} /> Clear
                  </button>
                  <select
                    value=""
                    disabled={transferring}
                    onChange={handleTransferSelect}
                    className="h-7 rounded-full border border-sky-200 bg-sky-50 px-2.5 text-[10px] font-extrabold uppercase leading-none text-sky-800 outline-none transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Transfer chat"
                  >
                    <option value="" disabled>{transferring ? 'Transferring...' : 'Transfer'}</option>
                    {transferOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={String(activeChat.assignedDepartment || department || '').toLowerCase() === option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="inline-flex h-7 items-center justify-center rounded-full bg-amber-50 px-2.5 text-[10px] font-extrabold uppercase leading-none text-amber-700 whitespace-nowrap">
                    {formatSupportDepartment(activeChat.assignedDepartment || department)}
                  </span>
                </div>
              </div>
              {['ban', 'block'].includes(String(activeChat.moderation?.action || '').toLowerCase()) ? (
                <p className="flex items-center gap-2 border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-800">
                  <FiSlash /> Customer is {activeChat.moderation.action === 'ban' ? 'banned temporarily' : 'blocked'} from live support chat.
                  <button type="button" className="btn-link" onClick={() => handleModerateChat({ action: 'unblock' })}><FiUnlock /> Unblock</button>
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-2">
                  <button type="button" className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 text-[10px] font-extrabold uppercase leading-none text-amber-800 whitespace-nowrap" onClick={() => handleModerateChat({ action: 'ban', hours: 24 })}>
                    <FiClock size={12} /> Ban 24h
                  </button>
                  <button type="button" className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 text-[10px] font-extrabold uppercase leading-none text-slate-800 whitespace-nowrap" onClick={() => handleModerateChat({ action: 'block' })}>
                    <FiSlash size={12} /> Block
                  </button>
                </div>
              )}
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
