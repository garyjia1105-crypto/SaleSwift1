import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant?: 'danger' | 'primary';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
}) => {
  const { colors } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const dialog = (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`w-full max-w-sm rounded-2xl shadow-2xl pointer-events-auto animate-in zoom-in-95 duration-200 ${colors.bg.card} border ${colors.border.default} overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                variant === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
              }`}>
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-bold ${colors.text.primary}`}>{title}</h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{message}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`shrink-0 p-1.5 rounded-lg ${colors.bg.hover} text-gray-400 hover:text-gray-600 transition-colors`}
                aria-label={cancelLabel}
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold btn-active-scale ${colors.button.secondary}`}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold btn-active-scale transition-colors ${
                  variant === 'danger'
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : colors.button.primary
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (mounted && typeof document !== 'undefined') {
    return createPortal(dialog, document.body);
  }
  return dialog;
};

export default ConfirmDialog;
