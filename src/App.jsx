import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Home, ChevronRight, BarChart3, LogOut } from 'lucide-react';
import HomePage from './pages/HomePage.jsx';
import MonthPage from './pages/MonthPage.jsx';
import BrandConfigPage from './pages/BrandConfigPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import { useSession, signOut } from './utils/auth.js';
import { MONTH_NAMES } from './utils/constants.js';
import './styles.css';

function AppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useSession();

  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts[0] === 'config') return [{ label: 'Configurações da Marca' }];
    if (parts[0] === 'relatorios') return [{ label: 'Relatórios' }];
    if (parts[0] === 'month' && parts.length === 3) {
      return [{ label: `${MONTH_NAMES[parseInt(parts[2])]} ${parts[1]}` }];
    }
    return [];
  };

  const breadcrumbs = getBreadcrumbs();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-knn">KNN</span>
            <span className="logo-sub">Saguaçu</span>
          </Link>
          <nav className="nav-breadcrumbs">
            <Link to="/" className="breadcrumb-link">
              <Home size={16} />
              <span>Início</span>
            </Link>
            {breadcrumbs.map((b, i) => (
              <span key={i} className="breadcrumb-item">
                <ChevronRight size={14} />
                <span>{b.label}</span>
              </span>
            ))}
          </nav>
          <div className="header-actions">
            <Link to="/relatorios" className="icon-link" title="Relatórios">
              <BarChart3 size={20} />
            </Link>
            <Link to="/config" className="icon-link" title="Configurações da Marca">
              <Settings size={20} />
            </Link>
            {session && (
              <button className="icon-link" onClick={handleLogout} title="Sair">
                <LogOut size={20} />
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell>
              <HomePage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/month/:year/:month"
        element={
          <RequireAuth>
            <AppShell>
              <MonthPage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/config"
        element={
          <RequireAuth>
            <AppShell>
              <BrandConfigPage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/relatorios"
        element={
          <RequireAuth>
            <AppShell>
              <ReportsPage />
            </AppShell>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;
