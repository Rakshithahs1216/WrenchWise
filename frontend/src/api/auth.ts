import type { LoginInput, User } from '../types';
import { request } from './client';

export const authApi = {
  login: (input: LoginInput) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: input }).then((r) => r.user),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<{ user: User }>('/auth/me').then((r) => r.user),
};
