import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppShell from './layouts/AppShell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import CalendarPage from './pages/CalendarPage';
import LiveMapPage from './pages/LiveMapPage';
import InventoryPage from './pages/InventoryPage';
import TechniciansPage from './pages/TechniciansPage';
import ClientsPage from './pages/ClientsPage';
import AuditPage from './pages/AuditPage';
import SettingsPage from './pages/SettingsPage';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: '#64748b', fontSize: 14 }}>
      Cargando...
    </div>
  );
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { token, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: '#64748b', fontSize: 14 }}>
      Cargando...
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<AuthGuard><AppShell /></AuthGuard>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/ordenes" element={<OrdersPage />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/mapa" element={<LiveMapPage />} />
        <Route path="/inventario" element={<InventoryPage />} />
        <Route path="/tecnicos" element={<TechniciansPage />} />
        <Route path="/clientes" element={<ClientsPage />} />
        <Route path="/auditoria" element={<AuditPage />} />
        <Route path="/configuracion" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
