import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function ViewListPage() {
  const [views, setViews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listViews()
      .then(setViews)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header row">
        <div>
          <h1>Views</h1>
          <p>Customizable dashboards built from the indicator library.</p>
        </div>
        <Link to="/views/new" className="btn-primary">
          + New view
        </Link>
      </div>

      {error && <div className="page-state error">{error}</div>}
      {loading ? (
        <div className="page-state">Loading…</div>
      ) : views.length === 0 ? (
        <div className="page-state">No views yet.</div>
      ) : (
        <div className="card-grid">
          {views.map((view) => (
            <Link to={`/views/${view.slug}`} key={view.id} className="view-card">
              <div className="indicator-card-top">
                {view.section && <span className="pill">{view.section.name}</span>}
                <span className="pill muted">{view._count.widgets} widgets</span>
              </div>
              <h3>{view.title}</h3>
              {view.description && <p className="indicator-desc">{view.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
