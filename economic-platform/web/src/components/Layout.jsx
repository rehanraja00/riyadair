import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
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
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
            Admin
          </NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
