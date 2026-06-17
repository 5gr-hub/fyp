import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import ReferralList from './pages/referrals/ReferralList';
import ReferralDetail from './pages/referrals/ReferralDetail';
import NewReferral from './pages/referrals/NewReferral';
import Patients from './pages/patients/Patients';
import Appointments from './pages/appointments/Appointments';
import Reports from './pages/reports/Reports';
import AdminUsers from './pages/admin/AdminUsers';
import AdminFacilities from './pages/admin/AdminFacilities';
import Integrations from './pages/integrations/Integrations';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />

          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/referrals"    element={<ReferralList />} />
            <Route path="/referrals/new" element={<NewReferral />} />
            <Route path="/referrals/:id" element={<ReferralDetail />} />
            <Route path="/patients"     element={<Patients />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/reports"      element={<Reports />} />
            <Route path="/admin/users"       element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
            <Route path="/admin/facilities"  element={<RequireAdmin><AdminFacilities /></RequireAdmin>} />
            <Route path="/integrations"      element={<Integrations />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
