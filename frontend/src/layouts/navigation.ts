import type { LucideIcon } from 'lucide-react';
import { CarFront, ClipboardList, LayoutDashboard, Users, Wrench } from 'lucide-react';
import type { Role } from '../types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Match only the exact path (for index routes). */
  end?: boolean;
}

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/vehicles', label: 'Vehicles', icon: CarFront },
    { to: '/admin/services', label: 'Services', icon: ClipboardList },
    { to: '/admin/users', label: 'Users', icon: Users },
  ],
  technician: [{ to: '/technician', label: 'My Assignments', icon: Wrench }],
  user: [{ to: '/dashboard', label: 'My Fleet', icon: LayoutDashboard }],
};
