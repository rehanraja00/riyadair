import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">EP</span>
          <div>
            <div className="brand-title">Economic Decision Support Platform</div>
            <div className="brand-subtitle">Indicators &amp; customizable views</div>
          </div>
        </div>
        <nav className="app-nav">
          <NavLink to="/views" className={({ isActive }) => (isActive ? 'active' : '')}>
            Views
          </NavLink>
          <NavLink to="/indicators" className={({ isActive }) => (isActive ? 'active' : '')}>
            Indicators
          </NavLink>
          {hasRole('EDITOR') && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
              Admin
            </NavLink>
          )}
        </nav>
        <div className="app-user">
          {user ? (
            <>
              <span className="user-chip">
                {user.name} <span className="role-badge">{user.role}</span>
              </span>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/login">Sign in</NavLink>
          )}
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
