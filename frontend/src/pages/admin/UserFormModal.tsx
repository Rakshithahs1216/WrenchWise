import { useEffect, useState, type FormEvent } from 'react';
import { usersApi } from '../../api/users';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { Modal } from '../../components/Modal';
import { useApiMutation } from '../../hooks/useApiMutation';
import { ROLES, type Role, type User, type UserInput } from '../../types';
import { fieldErrorsFrom } from '../../utils/errors';
import { ROLE_META } from '../../utils/status';

type FormState = Required<UserInput>;
type Errors = Partial<Record<keyof FormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initialState(user: User | null): FormState {
  return { name: user?.name ?? '', email: user?.email ?? '', password: '', role: user?.role ?? 'user' };
}

function validate(form: FormState, isEdit: boolean): Errors {
  const errors: Errors = {};
  if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address';
  if ((!isEdit || form.password) && form.password.length < 8) errors.password = 'Password must be at least 8 characters';
  return errors;
}

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

export function UserFormModal({ open, user, onClose }: Props) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState<FormState>(() => initialState(user));
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (open) {
      setForm(initialState(user));
      setErrors({});
    }
  }, [open, user]);

  const mutation = useApiMutation({
    mutationFn: (payload: UserInput) => (user ? usersApi.update(user.id, payload) : usersApi.create(payload)),
    // Users appear in vehicle assignments and service technicians too.
    invalidate: [['users'], ['vehicles'], ['services']],
    successMessage: (u) => `${u.name} ${isEdit ? 'updated' : 'created'}`,
    onSuccess: onClose,
    onError: (err) => setErrors(fieldErrorsFrom(err)),
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate(form, isEdit);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const payload: UserInput = { name: form.name.trim(), email: form.email.trim().toLowerCase(), role: form.role };
    if (form.password) payload.password = form.password;
    mutation.mutate(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit user' : 'Create user'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" loading={mutation.isPending}>
            {isEdit ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} noValidate className="space-y-4">
        <Field label="Full name" error={errors.name} required>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Email" error={errors.email} required>
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="off" />
        </Field>
        <Field
          label={isEdit ? 'New password' : 'Password'}
          error={errors.password}
          required={!isEdit}
          hint={isEdit ? 'Leave blank to keep the current password' : 'At least 8 characters'}
        >
          <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Role" error={errors.role} required>
          <select value={form.role} onChange={(e) => set('role', e.target.value as Role)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_META[r].label}
              </option>
            ))}
          </select>
        </Field>
      </form>
    </Modal>
  );
}
