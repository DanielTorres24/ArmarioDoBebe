import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { CatalogoProvider } from './lib/catalogo';
import Layout from './components/Layout';
import AdminLayout from './components/admin/AdminLayout';

import Home from './pages/Home';
import Armario from './pages/Armario';
import Precisamos from './pages/Precisamos';
import MaisDesejados from './pages/MaisDesejados';
import Sugestoes from './pages/Sugestoes';
import Preferencias from './pages/Preferencias';
import NaoEncontrado from './pages/NaoEncontrado';

import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import AdminItems from './pages/admin/Items';
import AdminCategories from './pages/admin/Categories';
import AdminSuggestions from './pages/admin/Suggestions';
import AdminReservations from './pages/admin/Reservations';
import AdminPreferences from './pages/admin/Preferences';
import AdminSettings from './pages/admin/Settings';

export default function App() {
  return (
    <CatalogoProvider>
      <BrowserRouter>
        <Routes>
          {/* Área pública */}
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="armario" element={<Armario />} />
            <Route path="precisamos" element={<Precisamos />} />
            <Route path="mais-desejados" element={<MaisDesejados />} />
            <Route path="sugestoes" element={<Sugestoes />} />
            <Route path="preferencias" element={<Preferencias />} />
            <Route path="*" element={<NaoEncontrado />} />
          </Route>

          {/* Área dos pais */}
          <Route path="admin/login" element={<Login />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="items" element={<AdminItems />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="suggestions" element={<AdminSuggestions />} />
            <Route path="reservations" element={<AdminReservations />} />
            <Route path="preferences" element={<AdminPreferences />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CatalogoProvider>
  );
}
