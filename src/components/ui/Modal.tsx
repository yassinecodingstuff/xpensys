import type { FC, ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export const Modal: FC<ModalProps> = ({ open, title, children, footer, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8 sm:px-6">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />

      <div className="relative z-50 w-full max-w-lg transform rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/5 transition-all">
        {title && (
          <header className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Fermer"
            >
              <span className="block h-4 w-4">×</span>
            </button>
          </header>
        )}

        <div className="text-sm text-slate-700">{children}</div>

        {footer && (
          <footer className="mt-6 flex items-center justify-end gap-2">{footer}</footer>
        )}
      </div>
    </div>
  );
};

export default Modal;

