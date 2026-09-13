import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';

const WIDGET_TYPES = [
  { value: 'KPI', label: 'KPI tiles' },
  { value: 'LINE_CHART', label: 'Line chart' },
  { value: 'BAR_CHART', label: 'Bar chart' },
  { value: 'TABLE', label: 'Table' },
];

function widgetToDraft(widget) {
  return {
    key: widget.id || `new-${Math.random().toString(36).slice(2)}`,
    type: widget.type,
    title: widget.title || '',
    rangeMonths: widget.config?.rangeMonths || '',
    indicatorIds: widget.indicators.map((wi) => wi.indicator.id),
  };
}

export default function ViewEditPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState(null);
  const [indicators, setIndicators] = useState([]);
  const [meta, setMeta] = useState({ title: '', description: '', visibility: 'PRIVATE' });
  const [widgets, setWidgets] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.getView(slug), api.listIndicators()])
      .then(([v, allIndicators]) => {
        if (!v.canManage) {
          setError("You don't have permission to edit this view.");
          return;
        }
        setView(v);
        setMeta({ title: v.title, description: v.description || '', visibility: v.visibility });
        setWidgets(v.widgets.map(widgetToDraft));
        setIndicators(allIndicators);
      })
      .catch((err) => setError(err.message));
  }, [slug]);

  function addWidget() {
    setWidgets((w) => [...w, { key: `new-${Math.random().toString(36).slice(2)}`, type: 'KPI', title: '', rangeMonths: '', indicatorIds: [] }]);
  }

  function updateWidget(key, patch) {
    setWidgets((w) => w.map((widget) => (widget.key === key ? { ...widget, ...patch } : widget)));
  }

  function removeWidget(key) {
    setWidgets((w) => w.filter((widget) => widget.key !== key));
  }

  function moveWidget(key, dir) {
    setWidgets((w) => {
      const index = w.findIndex((widget) => widget.key === key);
      const target = index + dir;
      if (target < 0 || target >= w.length) return w;
      const copy = [...w];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function toggleIndicator(key, indicatorId) {
    setWidgets((w) =>
      w.map((widget) => {
        if (widget.key !== key) return widget;
        const has = widget.indicatorIds.includes(indicatorId);
        return {
          ...widget,
          indicatorIds: has
            ? widget.indicatorIds.filter((id) => id !== indicatorId)
            : [...widget.indicatorIds, indicatorId],
        };
      })
    );
  }

  async function onSaveMeta(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const updated = await api.updateView(view.id, meta);
      setView((v) => ({ ...v, ...updated }));
      if (updated.slug !== slug) navigate(`/views/${updated.slug}/edit`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onSaveWidgets() {
    setBusy(true);
    setError('');
    try {
      const invalid = widgets.find((w) => w.indicatorIds.length === 0);
      if (invalid) throw new Error('Every widget needs at least one indicator.');

      const payload = widgets.map((w) => ({
        type: w.type,
        title: w.title || undefined,
        config: w.rangeMonths ? { rangeMonths: Number(w.rangeMonths) } : {},
        indicatorIds: w.indicatorIds,
      }));
      const updated = await api.setViewWidgets(view.id, payload);
      setWidgets(updated.widgets.map(widgetToDraft));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !view) return <div className="page-state error">{error}</div>;
  if (!view) return <div className="page-state">Loading…</div>;

  return (
    <div>
      <Link to={`/views/${view.slug}`} className="back-link">
        ← {view.title}
      </Link>
      <div className="page-header">
        <h1>Edit view</h1>
      </div>

      <form className="form-card" onSubmit={onSaveMeta}>
        <h3>Details</h3>
        <label>
          Title
          <input value={meta.title} onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))} required />
        </label>
        <label>
          Description
          <textarea
            rows={2}
            value={meta.description}
            onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
          />
        </label>
        <label>
          Visibility
          <select value={meta.visibility} onChange={(e) => setMeta((m) => ({ ...m, visibility: e.target.value }))}>
            <option value="PRIVATE">Private (only me)</option>
            <option value="SHARED">Shared (any signed-in user)</option>
            <option value="PUBLIC">Public (anyone)</option>
          </select>
        </label>
        <button type="submit" disabled={busy}>
          Save details
        </button>
      </form>

      <div className="panel">
        <div className="panel-header">
          <h3>Widgets</h3>
          <button type="button" className="btn-secondary" onClick={addWidget}>
            + Add widget
          </button>
        </div>

        {widgets.length === 0 && <p>No widgets yet — add one above.</p>}

        {widgets.map((widget, index) => (
          <div key={widget.key} className="widget-editor-row">
            <div className="widget-editor-controls">
              <select value={widget.type} onChange={(e) => updateWidget(widget.key, { type: e.target.value })}>
                {WIDGET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                placeholder="Widget title (optional)"
                value={widget.title}
                onChange={(e) => updateWidget(widget.key, { title: e.target.value })}
              />
              {(widget.type === 'LINE_CHART' || widget.type === 'BAR_CHART') && (
                <input
                  type="number"
                  min={0}
                  placeholder="Range (months)"
                  value={widget.rangeMonths}
                  onChange={(e) => updateWidget(widget.key, { rangeMonths: e.target.value })}
                  style={{ width: '9rem' }}
                />
              )}
              <div className="widget-editor-reorder">
                <button type="button" onClick={() => moveWidget(widget.key, -1)} disabled={index === 0}>
                  ↑
                </button>
                <button type="button" onClick={() => moveWidget(widget.key, 1)} disabled={index === widgets.length - 1}>
                  ↓
                </button>
                <button type="button" className="btn-danger" onClick={() => removeWidget(widget.key)}>
                  Remove
                </button>
              </div>
            </div>
            <div className="indicator-checklist">
              {indicators.map((indicator) => (
                <label key={indicator.id} className="checklist-item">
                  <input
                    type="checkbox"
                    checked={widget.indicatorIds.includes(indicator.id)}
                    onChange={() => toggleIndicator(widget.key, indicator.id)}
                  />
                  {indicator.name}
                </label>
              ))}
            </div>
          </div>
        ))}

        {error && <div className="form-error">{error}</div>}
        <button type="button" onClick={onSaveWidgets} disabled={busy}>
          {busy ? 'Saving…' : 'Save widgets'}
        </button>
      </div>
    </div>
  );
}
