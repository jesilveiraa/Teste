import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Settings, Home, ChevronRight } from 'lucide-react';
import HomePage from './pages/HomePage.jsx';
import MonthPage from './pages/MonthPage.jsx';
import BrandConfigPage from './pages/BrandConfigPage.jsx';
import './styles.css';

function App() {
  const location = useLocation();

  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts[0] === 'config') return [{ label: 'Configurações da Marca' }];
    if (parts[0] === 'month' && parts.length === 3) {
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
      ];
      return [{ label: `${monthNames[parseInt(parts[2])]} ${parts[1]}` }];
    }
    return [];
  };

  const breadcrumbs = getBreadcrumbs();

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
          <Link to="/config" className="config-btn" title="Configurações da Marca">
            <Settings size={20} />
          </Link>
        </div>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/month/:year/:month" element={<MonthPage />} />
          <Route path="/config" element={<BrandConfigPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
