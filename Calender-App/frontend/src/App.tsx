import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { RequireAuth } from './components/RequireAuth';
import { AdminLayout } from './components/AdminLayout';

// Pages
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { Dashboard } from './pages/Dashboard';
import { EventTypes } from './pages/EventTypes';
import { EventTypeForm } from './pages/EventTypeForm';
import { Bookings } from './pages/Bookings';
import { Settings } from './pages/Settings';
import { ClinicPage } from './pages/ClinicPage';
import { BookingPage } from './pages/BookingPage';
import { CancelPage } from './pages/CancelPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Admin (protected) */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <AdminLayout><Dashboard /></AdminLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/event-types"
            element={
              <RequireAuth>
                <AdminLayout><EventTypes /></AdminLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/event-types/new"
            element={
              <RequireAuth>
                <AdminLayout><EventTypeForm /></AdminLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/event-types/:id/edit"
            element={
              <RequireAuth>
                <AdminLayout><EventTypeForm /></AdminLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/bookings"
            element={
              <RequireAuth>
                <AdminLayout><Bookings /></AdminLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <AdminLayout><Settings /></AdminLayout>
              </RequireAuth>
            }
          />

          {/* Public booking */}
          <Route path="/cancel/:cancelToken" element={<CancelPage />} />
          <Route path="/:clinicSlug/:eventSlug" element={<BookingPage />} />
          <Route path="/:clinicSlug" element={<ClinicPage />} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
