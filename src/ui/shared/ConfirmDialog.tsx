import React from 'react';
import { useTheme } from '../../theme/themeProvider';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Yes',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const theme = useTheme();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="relative z-10 rounded-2xl shadow-xl p-6 max-w-sm w-[90%] mx-4"
        style={{ backgroundColor: theme.colors.bgCard }}
      >
        <h2
          className="text-lg font-bold mb-2"
          style={{ color: theme.colors.accent }}
        >
          {title}
        </h2>
        <p className="text-sm text-gray-600 mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="text-sm font-bold px-4 py-2 rounded-lg text-white transition-colors"
            style={{ backgroundColor: theme.colors.accent }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}