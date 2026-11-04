import { AlertCircle, RotateCw } from 'lucide-react';
import { errorMessage } from '../utils/errors';
import { Button } from './Button';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title = 'Could not load data' }: ErrorStateProps) {
  return (
    <div className="card flex flex-col items-center gap-2 border-red-200 bg-red-50/40 px-6 py-10 text-center" role="alert">
      <AlertCircle className="h-7 w-7 text-red-500" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="max-w-md text-sm text-slate-600">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={<RotateCw className="h-3.5 w-3.5" />} onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  );
}
