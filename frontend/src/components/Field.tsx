import clsx from 'clsx';
import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  /** A single input/select/textarea; id and aria attributes are injected. */
  children: ReactElement<{ id?: string; className?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>;
}

export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        className: clsx('input', error && 'input-invalid', children.props.className),
        'aria-invalid': Boolean(error) || undefined,
        'aria-describedby': error || hint ? messageId : undefined,
      })
    : children;

  return (
    <div className={clsx('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {control}
      {(error || hint) && (
        <p id={messageId} className={clsx('text-xs', error ? 'text-red-600' : 'text-slate-500')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
      {children}
    </div>
  );
}
