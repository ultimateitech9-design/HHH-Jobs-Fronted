import { useEffect, useMemo, useRef, useState } from 'react';
import { FiClock, FiMessageCircle, FiMinus, FiSend, FiTrash2 } from 'react-icons/fi';
import {
  clearSupportChatMessages,
  createSupportChat,
  deleteSupportChatMessage,
  getMySupportChat,
  sendSupportChatMessage
} from '../services/liveSupportChatApi';

const portalLabels = {
  student: 'Student',
  hr: 'HR',
  'campus-connect': 'Campus'
};

const LiveSupportChatWidget = ({ portalKey = '' }) => {
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState(null);
  const [message, setMessage] = useState('');
  const [stateName, setStateName] = useState('');
  const [subject, setSubject] = useState('Need help');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const portalLabel = useMemo(() => portalLabels[portalKey] || 'Portal', [portalKey]);
  const isWaitingForSupport = Boolean(chat?.id && (chat.status === 'waiting' || chat.queueStatus === 'waiting'));
  const supportDeskLabel = isWaitingForSupport
    ? 'Waiting for support'
    : `${chat?.assignedTo || 'Support desk'} will help you`;

  useEffect(() => {
    if (!open) return undefined;

    let active = true;
    const loadChat = async () => {
      try {
        const currentChat = await getMySupportChat();
        if (active) setChat(currentChat);
      } catch (error) {
        if (active) setStatus(error.message || 'Unable to load chat.');
      }
    };

    loadChat();
    const timer = window.setInterval(loadChat, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat?.messages?.length, open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading) return;

    setLoading(true);
    setStatus('');

    try {
      const nextChat = chat?.id
        ? (await sendSupportChatMessage(chat.id, text)).chat
        : await createSupportChat({
          subject: subject.trim() || 'Need help',
          stateName: stateName.trim(),
          company: portalLabel,
          message: text
        });

      setChat(nextChat);
      setMessage('');
      setStatus(
        nextChat?.status === 'waiting' || nextChat?.queueStatus === 'waiting'
          ? (nextChat.waitingMessage || 'All support agents are busy. You are in queue and will connect automatically.')
          : 'Message sent to support.'
      );
    } catch (error) {
      setStatus(error.message || 'Message send failed.');
    } finally {
      setLoading(false);
    }
  };
  const handleEnterToSend = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };
  const handleDeleteMessage = async (messageId) => {
    if (!chat?.id || !messageId) return;
    if (!window.confirm('Delete this message?')) return;
    setLoading(true);
    setStatus('');
    try {
      const nextChat = await deleteSupportChatMessage(chat.id, messageId);
      setChat(nextChat);
    } catch (error) {
      setStatus(error.message || 'Message delete failed.');
    } finally {
      setLoading(false);
    }
  };
  const handleClearMessages = async () => {
    if (!chat?.id || !(chat.messages || []).length) return;
    if (!window.confirm('Clear all messages in this chat?')) return;
    setLoading(true);
    setStatus('');
    try {
      const nextChat = await clearSupportChatMessages(chat.id);
      setChat(nextChat);
    } catch (error) {
      setStatus(error.message || 'Chat clear failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!['student', 'hr', 'campus-connect'].includes(portalKey)) return null;

  return (
    <div className="fixed z-[70]" style={{ bottom: 'max(1rem, 2vw)', right: 'max(1rem, 2vw)' }}>
      {open ? (
        <section className="flex h-[min(74vh,560px)] max-h-[calc(100vh-2rem)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-slate-100 bg-slate-950 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-extrabold">Live Support</p>
              <p className="text-[11px] font-semibold text-slate-300">{supportDeskLabel}</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" className="rounded-full p-2 hover:bg-white/10" onClick={() => setOpen(false)} aria-label="Minimize live chat">
                <FiMinus size={15} />
              </button>
              <button
                type="button"
                className="rounded-full p-2 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleClearMessages}
                disabled={!chat?.id || !(chat.messages || []).length || loading}
                aria-label="Clear chat messages"
              >
                <FiTrash2 size={15} />
              </button>
            </div>
          </header>

          {!chat?.id ? (
            <div className="grid gap-2 border-b border-slate-100 p-3">
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-amber-400"
                placeholder="Subject"
              />
              <input
                value={stateName}
                onChange={(event) => setStateName(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-amber-400"
                placeholder="State / location"
              />
            </div>
          ) : null}

          <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3">
            {isWaitingForSupport ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
                <FiClock className="mt-0.5 shrink-0" size={14} />
                <span>{chat.waitingMessage || 'All support agents are busy. You are in queue and will connect automatically.'}</span>
              </div>
            ) : null}
            {(chat?.messages || []).length ? (
              chat.messages.map((item) => {
                const isAgent = item.role === 'agent';
                const initial = String(item.author || (isAgent ? 'S' : portalLabel)).trim().charAt(0).toUpperCase() || 'U';
                return (
                  <div key={item.id || item.createdAt} className={`flex items-end gap-2 ${isAgent ? 'justify-start' : 'justify-end'}`}>
                    {isAgent ? (
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-900 text-[11px] font-black text-white shadow-sm">
                        {initial}
                      </span>
                    ) : null}
                    <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${isAgent ? 'bg-white text-slate-700' : 'bg-amber-500 text-white'}`}>
                      <div className="flex items-start gap-2">
                        <p className="min-w-0 flex-1 whitespace-pre-wrap break-words">{item.message}</p>
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(item.id)}
                          disabled={loading}
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors ${
                            isAgent ? 'text-rose-500 hover:bg-rose-50' : 'text-white/90 hover:bg-white/15'
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                          aria-label="Delete message"
                          title="Delete message"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                      <p className={`mt-1 text-[10px] font-semibold ${isAgent ? 'text-slate-400' : 'text-amber-50'}`}>{item.author}</p>
                    </div>
                    {!isAgent ? (
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-100 text-[11px] font-black text-amber-800 shadow-sm">
                        {initial}
                      </span>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
                Send your first message. Support will route it to the right team if needed.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {status ? <p className="border-t border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">{status}</p> : null}

          <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-slate-100 bg-white p-3">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleEnterToSend}
              rows={2}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-amber-400"
              placeholder="Type your message..."
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500 text-white shadow-sm transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              aria-label="Send live support message"
            >
              <FiSend size={17} />
            </button>
          </form>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-slate-950 px-[clamp(0.9rem,1.1vw,1.2rem)] py-[clamp(0.7rem,0.8vw,0.85rem)] text-sm font-extrabold text-white shadow-xl transition-transform hover:-translate-y-0.5"
        >
          <FiMessageCircle size={18} />
          Live Chat
        </button>
      )}
    </div>
  );
};

export default LiveSupportChatWidget;
