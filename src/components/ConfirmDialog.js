'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Ledger-styled replacement for window.confirm().
 * Render it with open + callbacks; it handles Escape and backdrop clicks.
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="ledger-card w-full max-w-sm overflow-hidden fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b-2 border-ink bg-card-deep px-5 py-4 flex items-center gap-2">
          {destructive && <AlertTriangle className="h-4 w-4 text-debit flex-shrink-0" />}
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-ink-soft">{message}</p>
        </div>
        <div className="px-5 pb-5 flex gap-3 justify-end">
          <button onClick={onCancel} className="btn btn-secondary !py-2">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`btn !py-2 ${destructive
              ? 'bg-debit border-debit-deep text-[#f7f3e6] hover:bg-debit-deep shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)]'
              : 'btn-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
