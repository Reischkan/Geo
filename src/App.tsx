import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import AppShell from './layouts/AppShell';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import CalendarPage from './pages/CalendarPage';
import LiveMapPage from './pages/LiveMapPage';
import InventoryPage from './pages/InventoryPage';
import TechniciansPage from './pages/TechniciansPage';
import ClientsPage from './pages/ClientsPage';
import AuditPage from './pages/AuditPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
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
      </BrowserRouter>
    </ToastProvider>
  );
}
