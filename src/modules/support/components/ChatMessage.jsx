import { FiTrash2 } from 'react-icons/fi';
import { formatDateTime } from '../utils/formatDate';

const ChatMessage = ({ message, onDelete }) => {
  const isAgent = message.role === 'agent';
  const initial = String(message.author || (isAgent ? 'S' : 'U')).trim().charAt(0).toUpperCase() || (isAgent ? 'S' : 'U');

  return (
    <div className={`flex w-full items-end gap-2 ${isAgent ? 'justify-end' : 'justify-start'}`}>
      {!isAgent ? (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-[12px] font-black text-slate-700 shadow-sm">
          {initial}
        </span>
      ) : null}
      <article className={`w-fit max-w-[78%] rounded-xl border px-3 py-2 text-left shadow-sm ${isAgent ? 'border-emerald-100 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
        <div className="mb-1 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[13px] font-bold leading-5 text-slate-900">{message.author}</h3>
            <p className="text-[11px] font-semibold leading-4 text-slate-500">{message.isInternal ? 'Internal note' : isAgent ? 'Support' : 'Customer'}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1">
            <span className="rounded-full border border-slate-100 bg-white/80 px-2 py-1 text-[10px] font-semibold leading-3 text-slate-500">{formatDateTime(message.createdAt)}</span>
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(message)}
                className="grid h-6 w-6 place-items-center rounded-full border border-rose-100 bg-white text-rose-500 transition-colors hover:bg-rose-50"
                title="Delete message"
                aria-label="Delete message"
              >
                <FiTrash2 size={12} />
              </button>
            ) : null}
          </span>
        </div>
        <p className="whitespace-pre-wrap break-words text-[13px] font-medium leading-5 text-slate-800">{message.text || message.message}</p>
      </article>
      {isAgent ? (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-emerald-100 bg-emerald-600 text-[12px] font-black text-white shadow-sm">
          {initial}
        </span>
      ) : null}
    </div>
  );
};

export default ChatMessage;
