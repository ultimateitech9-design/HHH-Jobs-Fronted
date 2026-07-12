import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { FiLink2, FiShare2, FiX } from 'react-icons/fi';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaWhatsapp } from 'react-icons/fa';

const getAbsoluteShareUrl = (value = '') => {
  const candidate = String(value || '').trim();
  if (typeof window === 'undefined') return candidate;
  if (!candidate) return window.location.href;

  try {
    return new URL(candidate, window.location.origin).toString();
  } catch {
    return window.location.href;
  }
};

const copyText = async (value) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
};

const openShareWindow = (url) => {
  const popup = window.open(url, '_blank', 'noopener,noreferrer,width=720,height=720');
  if (popup) popup.opener = null;
};

const networkItems = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: FaWhatsapp,
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    buildUrl: ({ message }) => `https://wa.me/?text=${encodeURIComponent(message)}`
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: FaLinkedinIn,
    tone: 'border-sky-200 bg-sky-50 text-sky-700',
    buildUrl: ({ url }) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: FaFacebookF,
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
    buildUrl: ({ url }) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: FaInstagram,
    tone: 'border-rose-200 bg-rose-50 text-rose-700'
  }
];

const JobShareMenu = ({
  title = 'Job opportunity',
  text = '',
  url = '',
  buttonLabel = 'Share',
  iconOnly = false,
  buttonClassName = ''
}) => {
  const [open, setOpen] = useState(false);
  const shareUrl = useMemo(() => getAbsoluteShareUrl(url), [url]);
  const shareText = useMemo(
    () => String(text || `Explore ${title} on HHH Jobs.`).trim(),
    [text, title]
  );
  const message = `${shareText}\n${shareUrl}`;

  useEffect(() => {
    if (!open) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const stopCardAction = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleOpen = (event) => {
    stopCardAction(event);
    setOpen(true);
  };

  const handleCopy = async () => {
    try {
      await copyText(shareUrl);
      toast.success('Job link copied.');
      setOpen(false);
    } catch {
      toast.error('Unable to copy the job link.');
    }
  };

  const handleNetworkShare = async (network) => {
    if (network.key === 'instagram') {
      if (navigator.share) {
        try {
          await navigator.share({ title, text: shareText, url: shareUrl });
          setOpen(false);
        } catch (error) {
          if (error?.name !== 'AbortError') toast.error('Unable to open the share sheet.');
        }
        return;
      }

      try {
        await copyText(shareUrl);
        toast.success('Link copied. Paste it into your Instagram story or message.');
        openShareWindow('https://www.instagram.com/');
        setOpen(false);
      } catch {
        toast.error('Unable to copy the job link.');
      }
      return;
    }

    openShareWindow(network.buildUrl({ url: shareUrl, message, title, text: shareText }));
    setOpen(false);
  };

  const modal = open && typeof document !== 'undefined'
    ? createPortal(
      <div
        className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:items-center"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-share-title"
          className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.28)]"
        >
          <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase text-brand-700">HHH Jobs</p>
              <h2 id="job-share-title" className="mt-1 text-lg font-bold text-navy">Share this opportunity</h2>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{title}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Close share dialog"
              title="Close"
            >
              <FiX size={17} />
            </button>
          </header>

          <div className="grid grid-cols-2 gap-2 p-5">
            {networkItems.map((network) => {
              const Icon = network.icon;
              return (
                <button
                  key={network.key}
                  type="button"
                  onClick={() => handleNetworkShare(network)}
                  className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-bold transition hover:-translate-y-0.5 hover:shadow-sm ${network.tone}`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80">
                    <Icon size={17} />
                  </span>
                  {network.label}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
            <button
              type="button"
              onClick={handleCopy}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
            >
              <FiLink2 size={16} />
              Copy job link
            </button>
          </div>
        </section>
      </div>,
      document.body
    )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={buttonClassName}
        aria-label={iconOnly ? `Share ${title}` : undefined}
        title={iconOnly ? 'Share job' : undefined}
      >
        <FiShare2 size={15} />
        {iconOnly ? <span className="sr-only">{buttonLabel}</span> : buttonLabel}
      </button>
      {modal}
    </>
  );
};

export default JobShareMenu;
