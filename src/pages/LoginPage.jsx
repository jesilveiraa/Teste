import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { signIn } from '../utils/auth.js';
import { isSupabaseConfigured } from '../utils/supabase.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Falha ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <span className="logo-knn">KNN</span>
          <span className="logo-sub">Saguaçu</span>
        </div>
        <h1>Planejador de Conteúdo</h1>
        <p className="login-subtitle">Entre com suas credenciais da equipe</p>

        {!isSupabaseConfigured && (
          <div className="login-warning">
            <AlertCircle size={16} />
            <span>
              Supabase não está configurado. Defina <code>VITE_SUPABASE_URL</code> e{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> em <code>.env.local</code>.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="voce@exemplo.com"
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-msg">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin" /> Entrando...
              </>
            ) : (
              <>
                <LogIn size={18} /> Entrar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
