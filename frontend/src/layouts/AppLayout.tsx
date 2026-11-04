import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth, useCurrentUser } from '../hooks/useAuth';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar role={user.role} mobileOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="lg:pl-60">
        <Topbar user={user} onMenu={() => setDrawerOpen(true)} onLogout={logout} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
