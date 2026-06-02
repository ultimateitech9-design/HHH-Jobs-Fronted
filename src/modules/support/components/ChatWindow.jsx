import { FiCheckCircle, FiClock, FiRefreshCw, FiSend, FiSlash, FiTrash2, FiUnlock } from 'react-icons/fi';
import ChatMessage from './ChatMessage';
import EmptyState from './EmptyState';

const transferOptions = [
  { value: 'support', label: 'Support' },
  { value: 'dataentry', label: 'Data Entry' },
  { value: 'sales', label: 'Sales' },
  { value: 'accounts', label: 'Accounts' }
];

const ChatWindow = ({
  chat,
  message,
  onMessageChange,
  onReply,
  onTransfer,
  onUpdateStatus,
  onModerate,
  onDeleteMessage,
  onClearChat,
  sending = false,
  transferring = false
}) => {
  const canSend = Boolean(String(message || '').trim()) && !sending;
  const isWaiting = chat?.status === 'waiting' || chat?.queueStatus === 'waiting';
  const isClosed = ['closed', 'resolved'].includes(String(chat?.status || '').toLowerCase());
  const moderationAction = String(chat?.moderation?.action || '').toLowerCase();
  const isRestricted = ['ban', 'block'].includes(moderationAction);
  const handleTransferSelect = (event) => {
    const targetDepartment = event.target.value;
    event.target.value = '';
    onTransfer?.(chat, targetDepartment);
  };
  const handleEnterToSend = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  if (!chat) {
    return <EmptyState title="No active chat selected." description="Open a conversation to review customer messages." />;
  }

  return (
    <section className="panel-card flex min-h-[520px] flex-col overflow-hidden !p-0">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-extrabold leading-5 text-slate-900">{chat.visitor}</h3>
          <p className="mt-0.5 truncate text-[12px] font-semibold leading-4 text-slate-500">
            {chat.company} | {chat.stateName || 'State not set'} | Assigned to {chat.assignedTo || chat.assignedDepartment || 'Support'}
          </p>
        </div>
        <div className="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            disabled={!onUpdateStatus}
            onClick={() => onUpdateStatus?.(chat, isClosed ? 'open' : 'resolved')}
            className={`inline-flex h-7 items-center justify-center gap-1 rounded-full border px-2.5 text-[10px] font-extrabold uppercase leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap ${
              isClosed
                ? 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {isClosed ? <><FiRefreshCw size={12} /> Reopen</> : <><FiCheckCircle size={12} /> Resolve</>}
          </button>
          <button
            type="button"
            disabled={!(chat.messages || []).length}
            onClick={() => onClearChat?.(chat)}
            className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 text-[10px] font-extrabold uppercase leading-none text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
          >
            <FiTrash2 size={12} /> Clear
          </button>
          <select
            value=""
            disabled={transferring || !onTransfer}
            onChange={handleTransferSelect}
            className="h-7 rounded-full border border-sky-200 bg-sky-50 px-2.5 text-[10px] font-extrabold uppercase leading-none text-sky-800 outline-none transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-55"
            aria-label="Transfer chat"
          >
            <option value="" disabled>{transferring ? 'Transferring...' : 'Transfer'}</option>
            {transferOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={(chat.assignedDepartment || '').toLowerCase() === option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!onModerate || isRestricted}
            onClick={() => onModerate?.(chat, { action: 'ban', hours: 24 })}
            className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 text-[10px] font-extrabold uppercase leading-none text-amber-800 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
          >
            <FiClock size={12} /> Ban 24h
          </button>
          <button
            type="button"
            disabled={!onModerate || isRestricted}
            onClick={() => onModerate?.(chat, { action: 'block' })}
            className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 text-[10px] font-extrabold uppercase leading-none text-slate-800 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
          >
            <FiSlash size={12} /> Block
          </button>
          <button
            type="button"
            disabled={!onModerate || !isRestricted}
            onClick={() => onModerate?.(chat, { action: 'unblock' })}
            className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 text-[10px] font-extrabold uppercase leading-none text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
          >
            <FiUnlock size={12} /> Unblock
          </button>
        </div>
      </div>
      {isWaiting ? (
        <p className="flex items-start gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2 text-[12px] font-semibold text-amber-800">
          <FiClock className="mt-0.5 shrink-0" size={13} />
          <span>{chat.waitingMessage || 'Customer is waiting for an available support agent.'}</span>
        </p>
      ) : null}
      {isRestricted ? (
        <p className="flex items-start gap-2 border-b border-rose-100 bg-rose-50 px-4 py-2 text-[12px] font-semibold text-rose-800">
          <FiSlash className="mt-0.5 shrink-0" size={13} />
          <span>
            Customer is {moderationAction === 'ban' ? 'banned temporarily' : 'blocked'} from live support chat
            {chat.moderation?.expiresAt ? ` until ${new Date(chat.moderation.expiresAt).toLocaleString()}` : ''}.
          </span>
        </p>
      ) : null}
      {chat.transferReason ? <p className="border-b border-slate-100 px-4 py-2 text-[12px] font-semibold text-slate-500">Last transfer: {chat.transferReason}</p> : null}
      <div className="flex-1 space-y-2.5 overflow-y-auto bg-slate-50 px-4 py-3">
        {(chat.messages || []).map((message) => (
          <ChatMessage key={message.id} message={message} onDelete={onDeleteMessage ? () => onDeleteMessage(chat, message) : null} />
        ))}
        {(chat.messages || []).length === 0 ? (
          <EmptyState title="No messages yet." description="Customer messages will appear here." />
        ) : null}
      </div>
      <form onSubmit={onReply} className="flex items-end gap-2.5 border-t border-slate-100 bg-white px-4 py-3">
        <textarea
          value={message}
          onChange={(event) => onMessageChange?.(event.target.value)}
          onKeyDown={handleEnterToSend}
          rows={2}
          className="min-h-[54px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-[13px] font-semibold leading-5 outline-none focus:border-amber-400"
          placeholder="Reply to customer..."
        />
        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex h-[54px] min-w-[104px] shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-extrabold shadow-sm transition-colors disabled:cursor-not-allowed"
          style={{
            backgroundColor: canSend ? '#0f766e' : '#f1f5f9',
            border: `1px solid ${canSend ? '#0f766e' : '#cbd5e1'}`,
            color: canSend ? '#ffffff' : '#475569',
            opacity: 1
          }}
        >
          {sending ? 'Sending...' : <><FiSend size={15} /> Send</>}
        </button>
      </form>
    </section>
  );
};

export default ChatWindow;
