import { useEffect, useState } from 'react';
import { vehiclesApi } from '../../api/vehicles';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { Modal } from '../../components/Modal';
import { useUsers } from '../../hooks/queries';
import { VEHICLE_DEPENDENT_KEYS } from '../../hooks/queryKeys';
import { useApiMutation } from '../../hooks/useApiMutation';
import type { Vehicle } from '../../types';

interface Props {
  vehicle: Vehicle | null;
  onClose: () => void;
}

export function AssignVehicleModal({ vehicle, onClose }: Props) {
  const users = useUsers('user');
  const [userId, setUserId] = useState('');

  useEffect(() => setUserId(vehicle?.assignedUser?.id ?? ''), [vehicle]);

  const mutation = useApiMutation({
    mutationFn: (id: string | null) => vehiclesApi.assign(vehicle!.id, id),
    invalidate: VEHICLE_DEPENDENT_KEYS,
    successMessage: (v) => (v.assignedUser ? `Assigned to ${v.assignedUser.name}` : `${v.registrationNumber} unassigned`),
    onSuccess: onClose,
  });

  return (
    <Modal
      open={Boolean(vehicle)}
      onClose={onClose}
      title="Assign vehicle"
      description={vehicle ? `${vehicle.registrationNumber} · ${vehicle.make} ${vehicle.model}` : undefined}
      size="sm"
      footer={
        <>
          {vehicle?.assignedUser && (
            <Button variant="secondary" className="sm:mr-auto" onClick={() => mutation.mutate(null)} disabled={mutation.isPending}>
              Unassign
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate(userId)} loading={mutation.isPending} disabled={!userId}>
            Assign
          </Button>
        </>
      }
    >
      <Field
        label="Fleet user"
        hint={users.isError ? 'Could not load users' : 'Only users with the "user" role can be assigned'}
      >
        <select value={userId} onChange={(e) => setUserId(e.target.value)} disabled={users.isPending}>
          <option value="">{users.isPending ? 'Loading users…' : 'Select a user'}</option>
          {users.data?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      </Field>
    </Modal>
  );
}
