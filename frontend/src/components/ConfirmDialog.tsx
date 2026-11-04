import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { errorMessage } from '../utils/errors';
import { Button } from './Button';
import { FormError } from './Field';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  /** Error from the confirmed action, shown inside the dialog (e.g. a 409 conflict). */
  error?: unknown;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', loading, error, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className="h-fit rounded-full bg-red-50 p-2 text-red-600">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 space-y-3 text-sm text-slate-600">
          <div>{message}</div>
          {Boolean(error) && <FormError>{errorMessage(error)}</FormError>}
        </div>
      </div>
    </Modal>
  );
}
