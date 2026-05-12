import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const ConfirmModal = ({ open, title, message, confirmLabel = 'Confirm', onConfirm, onClose }) => {
  useEffect(() => {
    if (!open) return undefined;
    const originalOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal((
    <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="student-job-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  ), document.body);
};

export default ConfirmModal;
