import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import Layout from './components/layout/Layout';
import ClinicaPage from './pages/Clinica/ClinicaPage';
import LoginPage from './pages/Auth/LoginPage';

// Placeholder pages
function PlaceholderPage({ title }: { title: string }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '60vh', flexDirection: 'column', gap: '12px',
            color: 'var(--text-tertiary)',
        }}>
            <span style={{ fontSize: '48px' }}>🚧</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--text-secondary)' }}>
                {title}
            </h2>
            <p style={{ fontSize: '14px' }}>Próximamente</p>
        </div>
    );
}

// Redirect if already logged in
function PublicRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return null;
    return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <LoginPage />
                            </PublicRoute>
                        }
                    />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/" element={<ClinicaPage />} />
                            <Route path="/agenda" element={<PlaceholderPage title="Agenda" />} />
                            <Route path="/pacientes" element={<PlaceholderPage title="Pacientes" />} />
                            <Route path="/comunicacion" element={<PlaceholderPage title="Comunicación" />} />
                            <Route path="/ia" element={<PlaceholderPage title="IA Asistente" />} />
                            <Route path="/configuracion" element={<PlaceholderPage title="Configuración" />} />
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

