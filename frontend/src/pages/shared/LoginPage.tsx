import { Lock, Mail, Wrench } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Field, FormError } from '../../components/Field';
import { useAuth } from '../../hooks/useAuth';
import { errorMessage } from '../../utils/errors';
import { ROLE_HOME } from '../../utils/status';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@wrenchwise.dev', password: 'Admin@123' },
  { label: 'Technician', email: 'tech1@wrenchwise.dev', password: 'Tech@123' },
  { label: 'User', email: 'user1@wrenchwise.dev', password: 'User@123' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const user = await login({ email: email.trim(), password });
      const target = from && from.pathname !== '/' ? `${from.pathname}${from.search}` : ROLE_HOME[user.role];
      navigate(target, { replace: true });
    } catch (err) {
      setFormError(errorMessage(err));
      setSubmitting(false);
    }
  };

  const fill = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email);
    setPassword(account.password);
    setErrors({});
    setFormError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="rounded-xl bg-indigo-600 p-2.5 text-white shadow-lg shadow-indigo-600/20">
            <Wrench className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Sign in to WrenchWise</h1>
          <p className="mt-1 text-sm text-slate-500">Fleet maintenance &amp; service management</p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
          <FormError>{formError}</FormError>
          <Field label="Email" error={errors.email} required>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@wrenchwise.dev"
            />
          </Field>
          <Field label="Password" error={errors.password} required>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Button type="submit" className="w-full" loading={submitting} icon={<Lock className="h-4 w-4" />}>
            Sign in
          </Button>
        </form>

        <div className="card mt-4 p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Demo accounts
          </p>
          <ul className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email} className="flex items-center justify-between gap-3">
                <div className="min-w-0 text-xs">
                  <p className="font-medium text-slate-800">{account.label}</p>
                  <p className="truncate text-slate-500">
                    {account.email} / <span className="font-mono">{account.password}</span>
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => fill(account)}>
                  Use
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
