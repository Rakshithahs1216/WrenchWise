import { Pencil, Plus, Trash2, Users as UsersIcon } from 'lucide-react';
import { useState } from 'react';
import { usersApi } from '../../api/users';
import { RoleBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { QueryView } from '../../components/QueryView';
import { RowActions, type RowAction } from '../../components/RowActions';
import { TableSkeleton } from '../../components/Skeleton';
import { Tabs } from '../../components/Tabs';
import { useUsers } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useCurrentUser } from '../../hooks/useAuth';
import { ROLES, type Role, type User } from '../../types';
import { formatDate, initials } from '../../utils/format';
import { ROLE_META } from '../../utils/status';
import { UserFormModal } from './UserFormModal';

type RoleFilter = Role | 'all';

export function UsersPage() {
  const me = useCurrentUser();
  const [role, setRole] = useState<RoleFilter>('all');
  const query = useUsers(role === 'all' ? undefined : role);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const remove = useApiMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    invalidate: [['users'], ['vehicles'], ['me'], ['stats']],
    successMessage: 'User deleted',
    inlineError: true,
    onSuccess: () => setDeleting(null),
  });

  const openForm = (user: User | null) => {
    setEditing(user);
    setFormOpen(true);
  };

  const actionsFor = (u: User): RowAction[] => [
    { label: 'Edit user', icon: Pencil, onClick: () => openForm(u) },
    {
      label: 'Delete user',
      icon: Trash2,
      danger: true,
      onClick: () => {
        remove.reset();
        setDeleting(u);
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage admins, technicians and fleet users."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => openForm(null)}>
            New user
          </Button>
        }
      />

      <div className="mb-4">
        <Tabs<RoleFilter>
          label="Filter users by role"
          value={role}
          onChange={setRole}
          tabs={[{ value: 'all', label: 'All' }, ...ROLES.map((r) => ({ value: r, label: `${ROLE_META[r].label}s` }))]}
        />
      </div>

      <QueryView
        query={query}
        loading={<TableSkeleton />}
        isEmpty={(list) => list.length === 0}
        empty={<EmptyState icon={UsersIcon} title="No users found" description="No users have this role yet." />}
      >
        {(users) => (
          <ul className="card divide-y divide-slate-100">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                  {initials(u.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {u.name}
                    {u.id === me.id && <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-slate-500">{u.email}</p>
                </div>
                <span className="hidden text-xs text-slate-400 md:block">Joined {formatDate(u.createdAt)}</span>
                <RoleBadge role={u.role} />
                <RowActions actions={actionsFor(u)} />
              </li>
            ))}
          </ul>
        )}
      </QueryView>

      <UserFormModal open={formOpen} user={editing} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete user"
        message={
          <>
            Delete <strong>{deleting?.name}</strong> ({deleting?.email})? Vehicles assigned to them will be unassigned.
          </>
        }
        loading={remove.isPending}
        error={remove.error}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
