import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ClinicaPage from './pages/Clinica/ClinicaPage';

// Placeholder pages for navigation
function PlaceholderPage({ title }: { title: string }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            flexDirection: 'column',
            gap: '12px',
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

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<ClinicaPage />} />
                    <Route path="/agenda" element={<PlaceholderPage title="Agenda" />} />
                    <Route path="/pacientes" element={<PlaceholderPage title="Pacientes" />} />
                    <Route path="/comunicacion" element={<PlaceholderPage title="Comunicación" />} />
                    <Route path="/ia" element={<PlaceholderPage title="IA Asistente" />} />
                    <Route path="/configuracion" element={<PlaceholderPage title="Configuración" />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
