import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSession } from '../utils/auth.js';
import { isSupabaseConfigured } from '../utils/supabase.js';

export default function RequireAuth({ children }) {
  const { session, loading } = useSession();

  if (!isSupabaseConfigured) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 size={32} className="spin" />
        <p>Carregando...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
