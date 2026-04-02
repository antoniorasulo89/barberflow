import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';
import AgendaPage from './pages/AgendaPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import StaffPage from './pages/StaffPage';
import ServicesPage from './pages/ServicesPage';
import ClientPortalPage from './pages/ClientPortalPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/admin/agenda" replace />} />
        <Route path="agenda" element={<AgendaPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="services" element={<ServicesPage />} />
      </Route>
      <Route path="/:slug" element={<ClientPortalPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
