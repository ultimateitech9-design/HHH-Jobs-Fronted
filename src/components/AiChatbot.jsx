import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiLoader, FiMessageCircle, FiSend, FiTrash2, FiX } from 'react-icons/fi';
import { apiFetch } from '../utils/api';
import { getCurrentUser } from '../utils/auth';

const LANGUAGE = {
  AUTO: 'auto',
  ENGLISH: 'english',
  HINDI: 'hindi'
};

const DEVA_RE = /[\u0900-\u097F]/;
const HINDI_LATIN_HINT_RE = /\b(kya|kaise|kyun|nahi|hain|hai|mera|meri|mujhe|aap|kripya|krdo|kar do|samjhao|madad)\b/i;

const uiCopy = {
  english: {
    title: 'HHH Job AI',
    subtitleSignedIn: (role) => `Signed in as ${role} | Assistant`,
    subtitleGuest: 'Guest mode | Assistant',
    resetTitle: 'Reset chat',
    closeTitle: 'Close chatbot',
    loginNote: 'For better answers, ',
    loginCta: 'log in',
    loading: 'Thinking...',
    placeholder: 'Ask about jobs, resume, ATS...',
    openTitle: 'Open AI assistant',
    languageLabel: 'Reply',
    langAuto: 'Auto',
    langEnglish: 'English',
    langHindi: 'Hindi',
    starter:
      'Hi! I am the HHH Job AI Assistant. I can chat naturally and help with jobs, ATS, resume, interviews, and website issues.'
  },
  hindi: {
    title: 'HHH Job AI',
    subtitleSignedIn: (role) => `${role} ke roop me signed in | Assistant`,
    subtitleGuest: 'Guest mode | Assistant',
    resetTitle: 'Chat reset karein',
    closeTitle: 'Chatbot band karein',
    loginNote: 'Behtar answers ke liye ',
    loginCta: 'login karein',
    loading: 'Soch raha hoon...',
    placeholder: 'Jobs, resume, ATS ke baare me puchhiye...',
    openTitle: 'AI assistant kholen',
    languageLabel: 'Bhasha',
    langAuto: 'Auto',
    langEnglish: 'English',
    langHindi: 'Hindi',
    starter:
      'Namaste! Main HHH Job AI Assistant hoon. Main normal human style me baat karke jobs, ATS, resume, interview aur website issues me help kar sakta hoon.'
  }
};

const getUiLanguage = (languageMode, detectedLanguage) => {
  if (languageMode === LANGUAGE.HINDI) return LANGUAGE.HINDI;
  if (languageMode === LANGUAGE.ENGLISH) return LANGUAGE.ENGLISH;
  return detectedLanguage || LANGUAGE.ENGLISH;
};

const createStarterMessage = (language, userRole = 'guest') => {
  const baseCopy = uiCopy[language]?.starter || uiCopy.english.starter;
  const normalizedRole = String(userRole || 'guest').trim().toLowerCase();

  if (normalizedRole === 'hr') {
    return {
      role: 'assistant',
      content: language === LANGUAGE.HINDI
        ? 'Namaste! Main HHH Jobs Recruiter Copilot hoon. Main JD improve karne, screening questions banane, shortlist strategy, interview planning, aur recruiter dashboard tasks me help kar sakta hoon.'
        : 'Hi! I am the HHH Jobs Recruiter Copilot. I can help with job descriptions, screening questions, shortlist strategy, interview planning, and recruiter dashboard tasks.'
    };
  }

  if (normalizedRole === 'admin' || normalizedRole === 'super_admin') {
    return {
      role: 'assistant',
      content: language === LANGUAGE.HINDI
        ? 'Namaste! Main HHH Jobs Operations Copilot hoon. Main dashboard insights, moderation, workflow issues, aur platform actions ko samjhane me help kar sakta hoon.'
        : 'Hi! I am the HHH Jobs Operations Copilot. I can help explain dashboard insights, moderation tasks, workflow issues, and platform actions.'
    };
  }

  return {
    role: 'assistant',
    content: baseCopy
  };
};

const detectMessageLanguage = (text = '') => {
  const message = String(text || '').trim();
  if (!message) return LANGUAGE.ENGLISH;
  if (DEVA_RE.test(message)) return LANGUAGE.HINDI;
  if (HINDI_LATIN_HINT_RE.test(message)) return LANGUAGE.HINDI;
  return LANGUAGE.ENGLISH;
};

const resolveReplyLanguage = (languageMode, text) => {
  if (languageMode === LANGUAGE.HINDI) return LANGUAGE.HINDI;
  if (languageMode === LANGUAGE.ENGLISH) return LANGUAGE.ENGLISH;
  return detectMessageLanguage(text);
};

const fallbackErrorReply = (errorMessage, language = LANGUAGE.ENGLISH) => {
  const inHindi = language === LANGUAGE.HINDI;

  if (/Missing OPENAI_API_KEY|Missing XAI_API_KEY|Missing AI provider configuration|AI request failed|AI provider request failed/i.test(errorMessage)) {
    return inHindi
      ? 'AI service abhi configure nahi lag rahi. Server me OPENAI_API_KEY ya XAI_API_KEY set karke phir try karein.'
      : 'AI service seems unconfigured right now. Please set OPENAI_API_KEY or XAI_API_KEY on the server and try again.';
  }

  if (/Missing server configuration/i.test(errorMessage)) {
    return inHindi
      ? 'Backend configuration incomplete lag rahi hai. SUPABASE_SERVICE_ROLE_KEY aur JWT_SECRET check karein.'
      : 'Backend configuration looks incomplete. Please check SUPABASE_SERVICE_ROLE_KEY and JWT_SECRET.';
  }

  if (/Failed to fetch|NetworkError/i.test(errorMessage)) {
    return inHindi
      ? 'Server se connection nahi ho pa raha. API server chal raha hai ya nahi check karke phir try karein.'
      : 'I could not connect to the server. Please verify the API server is running and try again.';
  }

  return inHindi
    ? 'Abhi response generate nahi ho paya. Aap apna question thoda detail me bhejein, main help karta hoon.'
    : 'I could not generate a response right now. Please resend your question with a bit more detail and I will help.';
};

const AiChatbot = ({ hideToggleButton = false }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [languageMode, setLanguageMode] = useState(LANGUAGE.AUTO);
  const [detectedLanguage, setDetectedLanguage] = useState(LANGUAGE.ENGLISH);
  const [messages, setMessages] = useState([createStarterMessage(LANGUAGE.ENGLISH)]);
  const [user, setUser] = useState(() => getCurrentUser());
  const messagesRef = useRef(null);
  const uiLanguage = getUiLanguage(languageMode, detectedLanguage);
  const currentUiCopy = uiCopy[uiLanguage] || uiCopy.english;

  useEffect(() => {
    const syncUser = () => setUser(getCurrentUser());
    window.addEventListener('auth-changed', syncUser);
    window.addEventListener('storage', syncUser);

    return () => {
      window.removeEventListener('auth-changed', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  useEffect(() => {
    const openChat = () => setIsOpen(true);
    const toggleChat = () => setIsOpen((prev) => !prev);

    window.addEventListener('ai-chatbot:open', openChat);
    window.addEventListener('ai-chatbot:toggle', toggleChat);

    return () => {
      window.removeEventListener('ai-chatbot:open', openChat);
      window.removeEventListener('ai-chatbot:toggle', toggleChat);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('ai-chatbot:state', {
        detail: { isOpen }
      })
    );
  }, [isOpen]);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, isOpen]);

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  const resetChat = () => {
    setMessages([createStarterMessage(uiLanguage, user?.role)]);
    setInput('');
  };

  useEffect(() => {
    setMessages((current) => {
      if (current.length > 1) return current;
      return [createStarterMessage(uiLanguage, user?.role)];
    });
  }, [uiLanguage, user?.role]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || isLoading) return;

    const history = messages
      .filter((item) => item.role === 'user' || item.role === 'assistant')
      .slice(-8)
      .map((item) => ({ role: item.role, content: item.content }));

    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInput('');
    setIsLoading(true);
    const replyLanguage = resolveReplyLanguage(languageMode, message);
    setDetectedLanguage(replyLanguage);

    try {
      const response = await apiFetch('/ai/chatbot', {
        method: 'POST',
        body: JSON.stringify({
          message,
          history,
          pageContext: location.pathname,
          roleContext: user?.role || 'guest',
          languageMode,
          preferredLanguage: replyLanguage,
          responsePolicy: {
            factual: true,
            concise: true,
            citeUncertainty: true
          },
          conversationStyle: {
            tone: 'natural_human',
            helpful: true,
            askClarifyingQuestions: true
          }
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || 'Chatbot failed');
      }

      const answer = String(payload?.answer || '').trim();
      if (!answer) throw new Error('Empty response from chatbot');
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (error) {
      const fallbackReply = fallbackErrorReply(error?.message || '', replyLanguage);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: fallbackReply }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 z-50 flex flex-col items-end sm:bottom-4 sm:right-4">
      {isOpen ? (
        <section className="mb-2 flex h-[min(72vh,500px)] w-[min(96vw,380px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:mb-3">
          <header className="flex items-center justify-between bg-[#1f2e4a] px-4 py-3 text-white">
            <div>
              <h3 className="text-base font-bold">{currentUiCopy.title}</h3>
              <p className="text-xs text-slate-200">
                {user ? currentUiCopy.subtitleSignedIn(user.role) : currentUiCopy.subtitleGuest}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 text-[11px] text-slate-100">
                {currentUiCopy.languageLabel}
                <select
                  value={languageMode}
                  onChange={(event) => setLanguageMode(event.target.value)}
                  className="ml-1 bg-transparent text-[11px] text-white outline-none"
                  aria-label="Select reply language"
                >
                  <option value={LANGUAGE.AUTO} className="text-slate-900">{currentUiCopy.langAuto}</option>
                  <option value={LANGUAGE.ENGLISH} className="text-slate-900">{currentUiCopy.langEnglish}</option>
                  <option value={LANGUAGE.HINDI} className="text-slate-900">{currentUiCopy.langHindi}</option>
                </select>
              </label>
              <button
                type="button"
                onClick={resetChat}
                className="rounded-md p-1 text-slate-200 hover:bg-white/20"
                title={currentUiCopy.resetTitle}
              >
                <FiTrash2 />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-slate-200 hover:bg-white/20"
                title={currentUiCopy.closeTitle}
              >
                <FiX />
              </button>
            </div>
          </header>

          {!user ? (
            <div className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {currentUiCopy.loginNote}
              <Link to="/login" className="font-semibold underline">{currentUiCopy.loginCta}</Link>
              .
            </div>
          ) : null}

          <div ref={messagesRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`max-w-[86%] rounded-xl px-3 py-2 text-sm leading-snug sm:max-w-[80%] ${
                  item.role === 'user'
                    ? 'ml-auto bg-[#236e9f] text-white'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {item.content}
              </div>
            ))}

            {isLoading ? (
              <div className="inline-flex items-center gap-2 rounded-xl bg-slate-200 px-3 py-2 text-sm text-slate-700">
                <FiLoader className="animate-spin" />
                <span>{currentUiCopy.loading}</span>
              </div>
            ) : null}
          </div>

          <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={currentUiCopy.placeholder}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#236e9f]"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#236e9f] text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiSend />
            </button>
          </form>
        </section>
      ) : null}

      {!hideToggleButton ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1f2e4a] text-white shadow-xl transition hover:scale-[1.03] sm:h-14 sm:w-14"
          title={currentUiCopy.openTitle}
          aria-label={currentUiCopy.openTitle}
        >
          <FiMessageCircle size={22} />
        </button>
      ) : null}
    </div>
  );
};

export default AiChatbot;
