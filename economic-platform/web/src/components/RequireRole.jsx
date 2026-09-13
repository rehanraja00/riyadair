import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RequireRole({ role, children }) {
  const { user, loading, hasRole } = useAuth();

  if (loading) return <div className="page-state">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole(role)) {
    return <div className="page-state error">You don&rsquo;t have permission to view this page.</div>;
  }
  return children;
}
