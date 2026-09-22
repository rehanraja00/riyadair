import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
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
import AdminSectionsPage from './pages/AdminSectionsPage.jsx';
import AdminSourcesPage from './pages/AdminSourcesPage.jsx';
import AdminUnitsPage from './pages/AdminUnitsPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/views" replace />} />

        <Route path="/views" element={<ViewListPage />} />
        <Route path="/views/new" element={<ViewNewPage />} />
        <Route path="/views/:slug/edit" element={<ViewEditPage />} />
        <Route path="/views/:slug" element={<ViewDetailPage />} />

        <Route path="/indicators" element={<IndicatorLibraryPage />} />
        <Route path="/indicators/:id" element={<IndicatorDetailPage />} />

        <Route path="/admin" element={<AdminPage />}>
          <Route index element={<Navigate to="indicators" replace />} />
          <Route path="indicators" element={<AdminIndicatorsPage />} />
          <Route path="indicators/:id" element={<AdminIndicatorDetailPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="sections" element={<AdminSectionsPage />} />
          <Route path="sources" element={<AdminSourcesPage />} />
          <Route path="units" element={<AdminUnitsPage />} />
        </Route>

        <Route path="*" element={<div className="page-state">Page not found.</div>} />
      </Route>
    </Routes>
  );
}
