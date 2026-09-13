import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RequireRole from './components/RequireRole.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ViewListPage from './pages/ViewListPage.jsx';
import ViewDetailPage from './pages/ViewDetailPage.jsx';
import ViewNewPage from './pages/ViewNewPage.jsx';
import ViewEditPage from './pages/ViewEditPage.jsx';
import IndicatorLibraryPage from './pages/IndicatorLibraryPage.jsx';
import IndicatorDetailPage from './pages/IndicatorDetailPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AdminIndicatorsPage from './pages/AdminIndicatorsPage.jsx';
import AdminIndicatorDetailPage from './pages/AdminIndicatorDetailPage.jsx';
import AdminCategoriesPage from './pages/AdminCategoriesPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/views" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/views" element={<ViewListPage />} />
        <Route
          path="/views/new"
          element={
            <RequireRole role="EDITOR">
              <ViewNewPage />
            </RequireRole>
          }
        />
        <Route
          path="/views/:slug/edit"
          element={
            <RequireRole role="EDITOR">
              <ViewEditPage />
            </RequireRole>
          }
        />
        <Route path="/views/:slug" element={<ViewDetailPage />} />

        <Route path="/indicators" element={<IndicatorLibraryPage />} />
        <Route path="/indicators/:id" element={<IndicatorDetailPage />} />

        <Route
          path="/admin"
          element={
            <RequireRole role="EDITOR">
              <AdminPage />
            </RequireRole>
          }
        >
          <Route index element={<Navigate to="indicators" replace />} />
          <Route path="indicators" element={<AdminIndicatorsPage />} />
          <Route path="indicators/:id" element={<AdminIndicatorDetailPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
        </Route>

        <Route path="*" element={<div className="page-state">Page not found.</div>} />
      </Route>
    </Routes>
  );
}
