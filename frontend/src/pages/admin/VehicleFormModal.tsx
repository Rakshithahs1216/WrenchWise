import { useEffect, useState, type FormEvent } from 'react';
import { vehiclesApi } from '../../api/vehicles';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { Modal } from '../../components/Modal';
import { VEHICLE_DEPENDENT_KEYS } from '../../hooks/queryKeys';
import { useApiMutation } from '../../hooks/useApiMutation';
import { VEHICLE_STATUSES, type Vehicle, type VehicleInput, type VehicleStatus } from '../../types';
import { fieldErrorsFrom } from '../../utils/errors';
import { VEHICLE_STATUS_META } from '../../utils/status';

interface FormState {
  registrationNumber: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  mileage: string;
  status: VehicleStatus;
}

type Errors = Partial<Record<keyof FormState, string>>;

const MAX_YEAR = new Date().getFullYear() + 1;

function initialState(vehicle: Vehicle | null): FormState {
  return {
    registrationNumber: vehicle?.registrationNumber ?? '',
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    year: vehicle ? String(vehicle.year) : String(new Date().getFullYear()),
    vin: vehicle?.vin ?? '',
    mileage: vehicle?.mileage != null ? String(vehicle.mileage) : '',
    status: vehicle?.status ?? 'active',
  };
}

/** Same normalisation as the backend: whitespace removed, upper-case. */
const normaliseReg = (value: string) => value.replace(/\s+/g, '').toUpperCase();

function validate(form: FormState): Errors {
  const errors: Errors = {};
  if (!/^[A-Z0-9-]{4,15}$/.test(normaliseReg(form.registrationNumber)))
    errors.registrationNumber = '4–15 letters, digits or dashes';
  if (!form.make.trim()) errors.make = 'Make is required';
  if (!form.model.trim()) errors.model = 'Model is required';
  const year = Number(form.year);
  if (!Number.isInteger(year) || year < 1980 || year > MAX_YEAR) errors.year = `Enter a year between 1980 and ${MAX_YEAR}`;
  if (form.vin.trim().length > 17) errors.vin = 'VIN is at most 17 characters';
  if (form.mileage !== '' && (!Number.isInteger(Number(form.mileage)) || Number(form.mileage) < 0))
    errors.mileage = 'Mileage must be a whole number ≥ 0';
  return errors;
}

function toPayload(form: FormState): VehicleInput {
  return {
    registrationNumber: normaliseReg(form.registrationNumber),
    make: form.make.trim(),
    model: form.model.trim(),
    year: Number(form.year),
    status: form.status,
    // An empty VIN is sent as null so editing can clear it.
    vin: form.vin.trim().toUpperCase() || null,
    ...(form.mileage !== '' ? { mileage: Number(form.mileage) } : {}),
  };
}

interface Props {
  open: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
}

export function VehicleFormModal({ open, vehicle, onClose }: Props) {
  const [form, setForm] = useState<FormState>(() => initialState(vehicle));
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (open) {
      setForm(initialState(vehicle));
      setErrors({});
    }
  }, [open, vehicle]);

  const mutation = useApiMutation({
    mutationFn: (payload: VehicleInput) => (vehicle ? vehiclesApi.update(vehicle.id, payload) : vehiclesApi.create(payload)),
    invalidate: VEHICLE_DEPENDENT_KEYS,
    successMessage: (v) => `${v.registrationNumber} ${vehicle ? 'updated' : 'added'}`,
    onSuccess: onClose,
    onError: (err) => setErrors(fieldErrorsFrom(err)),
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length === 0) mutation.mutate(toPayload(form));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={vehicle ? 'Edit vehicle' : 'Add vehicle'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="vehicle-form" loading={mutation.isPending}>
            {vehicle ? 'Save changes' : 'Add vehicle'}
          </Button>
        </>
      }
    >
      <form id="vehicle-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Registration number" error={errors.registrationNumber} required className="sm:col-span-2">
          <input
            value={form.registrationNumber}
            onChange={(e) => set('registrationNumber', e.target.value)}
            placeholder="KA01AB1234"
            className="uppercase"
          />
        </Field>
        <Field label="Make" error={errors.make} required>
          <input value={form.make} onChange={(e) => set('make', e.target.value)} placeholder="Tata" />
        </Field>
        <Field label="Model" error={errors.model} required>
          <input value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="Ace EV" />
        </Field>
        <Field label="Year" error={errors.year} required>
          <input type="number" inputMode="numeric" value={form.year} onChange={(e) => set('year', e.target.value)} />
        </Field>
        <Field label="Mileage (km)" error={errors.mileage}>
          <input type="number" inputMode="numeric" min={0} value={form.mileage} onChange={(e) => set('mileage', e.target.value)} />
        </Field>
        <Field label="VIN" error={errors.vin} hint="Optional, up to 17 characters">
          <input value={form.vin} onChange={(e) => set('vin', e.target.value)} className="uppercase" maxLength={17} />
        </Field>
        <Field label="Status" error={errors.status}>
          <select value={form.status} onChange={(e) => set('status', e.target.value as VehicleStatus)}>
            {VEHICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {VEHICLE_STATUS_META[s].label}
              </option>
            ))}
          </select>
        </Field>
      </form>
    </Modal>
  );
}
