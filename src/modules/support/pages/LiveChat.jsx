import { useState } from 'react';
import ChatWindow from '../components/ChatWindow';
import SupportHeader from '../components/SupportHeader';
import useChat from '../hooks/useChat';
import { transferChat } from '../services/chatApi';
import { formatSupportDepartment } from '../utils/ticketHelpers';

const LiveChat = () => {
  const { chats, setChats, loading, error, setError, isDemo } = useChat();
  const [transferringId, setTransferringId] = useState('');
  const activeChat = chats[0] || null;

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

  return (
    <div className="module-page module-page--platform">
      <SupportHeader title="Live Chat" subtitle="Review active customer chat sessions and respond to real-time support requests." />
      {isDemo ? <p className="module-note">Demo chat conversations are shown.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="module-note">Loading live chat...</p> : null}
      {!loading ? <ChatWindow chat={activeChat} onTransfer={handleTransfer} transferring={transferringId === activeChat?.id} /> : null}
    </div>
  );
};

export default LiveChat;
