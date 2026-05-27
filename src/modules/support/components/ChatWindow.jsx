import ChatMessage from './ChatMessage';
import EmptyState from './EmptyState';

const transferOptions = [
  { value: 'support', label: 'Support' },
  { value: 'admin', label: 'Admin' },
  { value: 'dataentry', label: 'Data Entry' },
  { value: 'sales', label: 'Sales' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'hr', label: 'HR' },
  { value: 'student', label: 'Student' },
  { value: 'campus_connect', label: 'Campus Connect' },
  { value: 'platform', label: 'Platform Ops' },
  { value: 'audit', label: 'Audit' }
];

const ChatWindow = ({ chat, onTransfer, transferring = false }) => {
  if (!chat) {
    return <EmptyState title="No active chat selected." description="Open a conversation to review customer messages." />;
  }

  return (
    <section className="panel-card">
      <div className="dash-card-head">
        <div>
          <h3>{chat.visitor}</h3>
          <p>{chat.company} | Assigned to {chat.assignedTo || chat.assignedDepartment || 'Support'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {transferOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="btn-secondary !px-3 !py-1.5 text-xs"
              disabled={transferring || (chat.assignedDepartment || '').toLowerCase() === option.value}
              onClick={() => onTransfer?.(chat, option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {chat.transferReason ? <p className="module-note">Last transfer: {chat.transferReason}</p> : null}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {(chat.messages || []).map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
    </section>
  );
};

export default ChatWindow;
