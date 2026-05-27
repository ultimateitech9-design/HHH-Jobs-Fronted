import { useEffect, useState } from 'react';
import { getChats } from '../services/chatApi';

const useChat = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await getChats();
      setChats(response.data || []);
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };

    load();
  }, []);

  return { chats, setChats, loading, error, setError, isDemo };
};

export default useChat;
