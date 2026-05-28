import { FiSend, FiTrash2 } from 'react-icons/fi';
import ChatMessage from './ChatMessage';
import EmptyState from './EmptyState';

const transferOptions = [
  { value: 'support', label: 'Support' },
  { value: 'admin', label: 'Admin' },
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
  onDeleteMessage,
  onClearChat,
  sending = false,
  transferring = false
}) => {
  const canSend = Boolean(String(message || '').trim()) && !sending;
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
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            disabled={!(chat.messages || []).length}
            onClick={() => onClearChat?.(chat)}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold leading-4 text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiTrash2 size={12} /> Clear
          </button>
          {transferOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold leading-4 text-sky-800 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-55"
              disabled={transferring || (chat.assignedDepartment || '').toLowerCase() === option.value}
              onClick={() => onTransfer?.(chat, option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
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
