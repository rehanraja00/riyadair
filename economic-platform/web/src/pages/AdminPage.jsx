import { NavLink, Outlet } from 'react-router-dom';

export default function AdminPage() {
  return (
    <div>
      <div className="page-header">
        <h1>Admin</h1>
        <p>Manage the content that powers indicators and views.</p>
      </div>
      <div className="admin-tabs">
        <NavLink to="/admin/indicators" className={({ isActive }) => (isActive ? 'active' : '')}>
          Indicators
        </NavLink>
        <NavLink to="/admin/categories" className={({ isActive }) => (isActive ? 'active' : '')}>
          Categories
        </NavLink>
      </div>
      <Outlet />
    </div>
  );
}
