import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AdminOverviewPage } from '../pages/admin/AdminOverviewPage';
import { ServicesPage } from '../pages/admin/ServicesPage';
import { UsersPage } from '../pages/admin/UsersPage';
import { VehiclesPage } from '../pages/admin/VehiclesPage';
import { LoginPage } from '../pages/shared/LoginPage';
import { NotFoundPage } from '../pages/shared/NotFoundPage';
import { VehicleTimelinePage } from '../pages/shared/VehicleTimelinePage';
import { TechnicianAssignmentsPage } from '../pages/technician/TechnicianAssignmentsPage';
import { UserDashboardPage } from '../pages/user/UserDashboardPage';
import { ProtectedRoute, PublicOnlyRoute, RoleHomeRedirect } from './ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleHomeRedirect />} />

        <Route path="admin">
          <Route index element={<ProtectedRoute roles={['admin']}><AdminOverviewPage /></ProtectedRoute>} />
          <Route path="vehicles" element={<ProtectedRoute roles={['admin']}><VehiclesPage /></ProtectedRoute>} />
          <Route path="services" element={<ProtectedRoute roles={['admin']}><ServicesPage /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
        </Route>

        <Route
          path="technician"
          element={<ProtectedRoute roles={['technician']}><TechnicianAssignmentsPage /></ProtectedRoute>}
        />
        <Route path="dashboard" element={<ProtectedRoute roles={['user']}><UserDashboardPage /></ProtectedRoute>} />

        <Route path="vehicles/:id/timeline" element={<VehicleTimelinePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
