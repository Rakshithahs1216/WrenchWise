import { useEffect, useState, type FormEvent } from 'react';
import { servicesApi } from '../../api/services';
import { Button } from '../../components/Button';
import { Field, FormError } from '../../components/Field';
import { Modal } from '../../components/Modal';
import { useUsers, useVehicles } from '../../hooks/queries';
import { SERVICE_DEPENDENT_KEYS } from '../../hooks/queryKeys';
import { useApiMutation } from '../../hooks/useApiMutation';
import { SERVICE_TYPES, type Service, type ServiceInput, type ServiceType } from '../../types';
import { fieldErrorsFrom } from '../../utils/errors';
import { fromDateInput, serviceTypeLabel, toDateInput } from '../../utils/format';

interface FormState {
  vehicle: string;
  serviceType: ServiceType | '';
  scheduledDate: string;
  technician: string;
  description: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const MAX_DESCRIPTION = 1000;

function initialState(service: Service | null): FormState {
  return {
    vehicle: service?.vehicle?.id ?? '',
    serviceType: service?.serviceType ?? '',
    scheduledDate: toDateInput(service?.scheduledDate),
    technician: service?.technician?.id ?? '',
    description: service?.description ?? '',
  };
}

function validate(form: FormState, isEdit: boolean): Errors {
  const errors: Errors = {};
  if (!isEdit && !form.vehicle) errors.vehicle = 'Choose a vehicle';
  if (!form.serviceType) errors.serviceType = 'Choose a service type';
  if (!form.scheduledDate) errors.scheduledDate = 'Pick a date';
  if (!form.technician) errors.technician = 'Assign a technician';
  if (form.description.length > MAX_DESCRIPTION) errors.description = `At most ${MAX_DESCRIPTION} characters`;
  return errors;
}

interface Props {
  open: boolean;
  service: Service | null;
  onClose: () => void;
}

export function ServiceFormModal({ open, service, onClose }: Props) {
  const isEdit = Boolean(service);
  const vehicles = useVehicles();
  const technicians = useUsers('technician');
  const [form, setForm] = useState<FormState>(() => initialState(service));
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (open) {
      setForm(initialState(service));
      setErrors({});
    }
  }, [open, service]);

  const mutation = useApiMutation({
    mutationFn: (payload: ServiceInput) => {
      if (!service) return servicesApi.create(payload);
      const { vehicle: _vehicle, ...editable } = payload;
      return servicesApi.update(service.id, editable);
    },
    invalidate: SERVICE_DEPENDENT_KEYS,
    successMessage: isEdit ? 'Service updated' : 'Service scheduled',
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
    if (Object.keys(next).length > 0 || !form.serviceType) return;
    mutation.mutate({
      vehicle: form.vehicle,
      serviceType: form.serviceType,
      scheduledDate: fromDateInput(form.scheduledDate),
      technician: form.technician,
      description: form.description.trim(),
    });
  };

  const optionsError = vehicles.isError || technicians.isError;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit service' : 'Schedule a service'}
      description={isEdit ? undefined : 'Create a service and assign it to a technician.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="service-form" loading={mutation.isPending}>
            {isEdit ? 'Save changes' : 'Schedule service'}
          </Button>
        </>
      }
    >
      <form id="service-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {optionsError && (
          <div className="sm:col-span-2">
            <FormError>Could not load vehicles or technicians. Close and try again.</FormError>
          </div>
        )}
        <Field
          label="Vehicle"
          error={errors.vehicle}
          required={!isEdit}
          hint={isEdit ? 'The vehicle cannot be changed after scheduling' : undefined}
          className="sm:col-span-2"
        >
          <select value={form.vehicle} onChange={(e) => set('vehicle', e.target.value)} disabled={isEdit || vehicles.isPending}>
            <option value="">{vehicles.isPending ? 'Loading vehicles…' : 'Select a vehicle'}</option>
            {vehicles.data?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registrationNumber} · {v.make} {v.model}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Service type" error={errors.serviceType} required>
          <select value={form.serviceType} onChange={(e) => set('serviceType', e.target.value as ServiceType)}>
            <option value="">Select a type</option>
            {SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {serviceTypeLabel(t)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Scheduled date" error={errors.scheduledDate} required>
          <input type="date" value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} />
        </Field>
        <Field label="Technician" error={errors.technician} required className="sm:col-span-2">
          <select value={form.technician} onChange={(e) => set('technician', e.target.value)} disabled={technicians.isPending}>
            <option value="">{technicians.isPending ? 'Loading technicians…' : 'Select a technician'}</option>
            {technicians.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Description" error={errors.description} hint={`${form.description.length}/${MAX_DESCRIPTION}`} className="sm:col-span-2">
          <textarea
            rows={3}
            value={form.description}
            maxLength={MAX_DESCRIPTION}
            onChange={(e) => set('description', e.target.value)}
            placeholder="e.g. 10k km service, check brake pads"
          />
        </Field>
      </form>
    </Modal>
  );
}
