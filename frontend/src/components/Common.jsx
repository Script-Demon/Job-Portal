import { useEffect, useState } from 'react';
import { APPLICATION_STATUSES, initials } from '../utils/format.js';

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return <div className="alert alert-error">{message}</div>;
}

export function StatusBadge({ status }) {
  return (
    <span className={`badge status-${status.toLowerCase()}`}>{APPLICATION_STATUSES[status] || status}</span>
  );
}

export function CompanyLogo({ name, url, size = 48 }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);
  if (url && !broken) {
    return (
      <img
        className="logo"
        src={url}
        alt={`${name} logo`}
        style={{ width: size, height: size }}
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <div className="logo logo-fallback" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials(name) || '?'}
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="btn btn-ghost" disabled={page === 0} onClick={() => onChange(page - 1)}>
        ← Prev
      </button>
      <span>
        Page {page + 1} of {totalPages}
      </span>
      <button className="btn btn-ghost" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>
        Next →
      </button>
    </nav>
  );
}

/** In-page modal (avoids native confirm() dialogs). */
export function Modal({ title, children, onClose, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger, busy, onConfirm, onClose }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}

export function Field({ label, error, hint, children, htmlFor }) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && !error && <small className="hint">{hint}</small>}
      {error && <small className="error-text">{error}</small>}
    </div>
  );
}
