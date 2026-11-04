import { ApiError } from '../api/client';

/** Human-readable message for any thrown value, including backend field details. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.details.length === 0) return error.message;
    const fields = error.details.map((d) => (d.path ? `${d.path}: ${d.message}` : d.message)).join('; ');
    return `${error.message} — ${fields}`;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

/** Map backend validation details to a { field: message } record for forms. */
export function fieldErrorsFrom(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  return Object.fromEntries(error.details.filter((d) => d.path).map((d) => [d.path.split('.')[0], d.message]));
}
