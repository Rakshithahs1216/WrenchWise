import type { Role, User, UserInput } from '../types';
import { request } from './client';

export const usersApi = {
  list: (role?: Role) => request<{ users: User[] }>('/users', { query: { role } }).then((r) => r.users),
  create: (input: UserInput) => request<{ user: User }>('/users', { method: 'POST', body: input }).then((r) => r.user),
  update: (id: string, input: Partial<UserInput>) =>
    request<{ user: User }>(`/users/${id}`, { method: 'PATCH', body: input }).then((r) => r.user),
  remove: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
};
