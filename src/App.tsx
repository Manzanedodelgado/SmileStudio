import { Shield, Cpu } from 'lucide-react';
import Dashboard from './components/Dashboard';
import './styles/index.css';
import './styles/centinela.css';

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <div className="app__logo">
          <div className="app__logo-icon">
            <Shield size={22} color="white" />
          </div>
          <div className="app__logo-text">
            <span className="app__logo-name">Centinela</span>
            <span className="app__logo-subtitle">SmileStudio Monitor</span>
          </div>
        </div>
        <div className="app__header-right">
          <Cpu size={14} />
          <span>Sistema de Vigilancia de Procesos</span>
        </div>
      </header>
      <Dashboard />
    </div>
  );
}
