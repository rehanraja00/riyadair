import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import Widget from '../components/Widget.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ViewDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const [view, setView] = useState(null);
  const [error, setError] = useState('');

  // See ViewListPage: wait for the token restore so a private/shared view's
  // owner doesn't get "not found" on a hard page load or refresh.
  useEffect(() => {
    if (authLoading) return;
    api
      .getView(slug)
      .then(setView)
      .catch((err) => setError(err.message));
  }, [slug, authLoading]);

  async function onDelete() {
    if (!window.confirm(`Delete view "${view.title}"? This cannot be undone.`)) return;
    await api.deleteView(view.id);
    navigate('/views');
  }

  if (error) return <div className="page-state error">{error}</div>;
  if (!view) return <div className="page-state">Loading…</div>;

  return (
    <div>
      <Link to="/views" className="back-link">
        ← Views
      </Link>
      <div className="page-header row">
        <div>
          <span className="pill">{view.visibility}</span>
          <h1>{view.title}</h1>
          {view.description && <p>{view.description}</p>}
        </div>
        {view.canManage && (
          <div className="button-row">
            <Link to={`/views/${view.slug}/edit`} className="btn-secondary">
              Edit widgets
            </Link>
            <button type="button" className="btn-danger" onClick={onDelete}>
              Delete
            </button>
          </div>
        )}
      </div>

      {view.widgets.length === 0 ? (
        <div className="page-state">
          This page has no widgets yet.{' '}
          {view.canManage && <Link to={`/views/${view.slug}/edit`}>Add some.</Link>}
        </div>
      ) : view.layoutTemplate === 'GRID' ? (
        <div className="collage-grid" style={{ '--grid-cols': view.gridColumns }}>
          {view.widgets.map((widget) => (
            <div
              key={widget.id}
              style={{
                gridColumn: widget.columnStart
                  ? `${widget.columnStart} / span ${widget.columnSpan}`
                  : `span ${Math.min(widget.columnSpan || 1, view.gridColumns)}`,
                gridRow: widget.rowStart ? `${widget.rowStart} / span ${widget.rowSpan}` : `span ${widget.rowSpan || 1}`,
              }}
            >
              <Widget widget={widget} />
            </div>
          ))}
        </div>
      ) : (
        <div className="widget-grid" style={view.layoutTemplate === 'TWO_COL' ? { gridTemplateColumns: 'repeat(2, 1fr)' } : { gridTemplateColumns: '1fr' }}>
          {view.widgets.map((widget) => (
            <Widget key={widget.id} widget={widget} />
          ))}
        </div>
      )}
    </div>
  );
}
