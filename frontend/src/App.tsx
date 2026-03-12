import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ClinicaPage from './pages/Clinica/ClinicaPage';
import AgendaPage from './pages/Agenda/AgendaPage';
import PacientesPage from './pages/Pacientes/PacientesPage';
import RadiologiaPage from './pages/Radiologia/RadiologiaPage';
import IAAutomationPage from './pages/IAAutomation/IAAutomationPage';
import InventarioPage from './pages/Inventario/InventarioPage';
import GestoriaPage from './pages/Gestoria/GestoriaPage';
import WhatsAppPage from './pages/WhatsApp/WhatsAppPage';
import Login from './pages/Auth/Login';
import './styles/AreasMapeadas.css';

/** Muestra spinner mientras se verifica la sesión */
function LoadingScreen() {
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: '#f4f7f9',
        }}>
            <div style={{
                width: 40, height: 40,
                border: '3px solid #e2e8f0',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
        </div>
    );
}

/** Rutas protegidas — redirige a /login si no hay sesión */
function ProtectedRoutes() {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;

    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<ClinicaPage />} />
                <Route path="/agenda/*" element={<AgendaPage />} />
                <Route path="/pacientes/*" element={<PacientesPage />} />
                <Route path="/radiologia/*" element={<RadiologiaPage />} />
                <Route path="/whatsapp/*" element={<WhatsAppPage />} />
                <Route path="/ia/*" element={<IAAutomationPage />} />
                <Route path="/inventario/*" element={<InventarioPage />} />
                <Route path="/gestoria/*" element={<GestoriaPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}

/** Ruta de login — redirige al dashboard si ya hay sesión */
function LoginRoute() {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;
    if (user) return <Navigate to="/" replace />;

    return <Login />;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginRoute />} />
                    <Route path="/*" element={<ProtectedRoutes />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
