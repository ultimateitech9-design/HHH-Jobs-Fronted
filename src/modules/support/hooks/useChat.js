import { useEffect, useState } from 'react';
import { getChats } from '../services/chatApi';

const useChat = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const response = await getChats();
      if (!active) return;
      setChats(response.data || []);
      setError(response.error || '');
      setIsDemo(Boolean(response.isDemo));
      setLoading(false);
    };

    load();
    const timer = window.setInterval(load, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return { chats, setChats, loading, error, setError, isDemo };
};

export default useChat;
