import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';

const WIDGET_TYPES = [
  { value: 'KPI', label: 'KPI tiles' },
  { value: 'LINE_CHART', label: 'Line chart' },
  { value: 'BAR_CHART', label: 'Bar chart' },
  { value: 'TABLE', label: 'Table' },
  { value: 'CONTENT', label: 'Free-form content' },
];

const GROWTH_MODES = [
  { value: 'PREVIOUS', label: 'vs. previous interval' },
  { value: 'TARGET', label: 'vs. target' },
  { value: 'BASELINE', label: 'vs. baseline' },
];

function widgetToDraft(widget) {
  return {
    key: widget.id || `new-${Math.random().toString(36).slice(2)}`,
    type: widget.type,
    title: widget.title || '',
    contentHtml: widget.contentHtml || '',
    rangeMonths: widget.config?.rangeMonths || '',
    growthModes: widget.config?.growthModes || [],
    targetType: widget.config?.targetType || 'INTERVAL',
    baselineId: widget.config?.baselineId || '',
    columnStart: widget.columnStart ?? '',
    columnSpan: widget.columnSpan || 1,
    rowStart: widget.rowStart ?? '',
    rowSpan: widget.rowSpan || 1,
    indicatorIds: (widget.indicators || []).map((wi) => wi.indicator.id),
  };
}

function newWidgetDraft() {
  return {
    key: `new-${Math.random().toString(36).slice(2)}`,
    type: 'KPI',
    title: '',
    contentHtml: '',
    rangeMonths: '',
    growthModes: [],
    targetType: 'INTERVAL',
    baselineId: '',
    columnStart: '',
    columnSpan: 1,
    rowStart: '',
    rowSpan: 1,
    indicatorIds: [],
  };
}

export default function ViewEditPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState(null);
  const [indicators, setIndicators] = useState([]);
  const [sections, setSections] = useState([]);
  const [meta, setMeta] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.getView(slug), api.listIndicators(), api.listSections()])
      .then(([v, allIndicators, allSections]) => {
        if (!v.canManage) {
          setError("You don't have permission to edit this page.");
          return;
        }
        setView(v);
        setMeta({
          title: v.title,
          description: v.description || '',
          visibility: v.visibility,
          published: v.published,
          sectionId: v.sectionId || '',
          layoutTemplate: v.layoutTemplate,
          gridColumns: v.gridColumns,
        });
        setWidgets(v.widgets.map(widgetToDraft));
        setIndicators(allIndicators);
        setSections(allSections);
      })
      .catch((err) => setError(err.message));
  }, [slug]);

  function addWidget() {
    setWidgets((w) => [...w, newWidgetDraft()]);
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

  function toggleGrowthMode(key, mode) {
    setWidgets((w) =>
      w.map((widget) => {
        if (widget.key !== key) return widget;
        const has = widget.growthModes.includes(mode);
        return {
          ...widget,
          growthModes: has ? widget.growthModes.filter((m) => m !== mode) : [...widget.growthModes, mode],
        };
      })
    );
  }

  function baselinesForWidget(widget) {
    const selected = indicators.filter((ind) => widget.indicatorIds.includes(ind.id));
    return selected.flatMap((ind) => (ind.baselines || []).map((b) => ({ ...b, indicatorName: ind.name })));
  }

  async function onSaveMeta(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const updated = await api.updateView(view.id, { ...meta, sectionId: meta.sectionId || null });
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
      const invalid = widgets.find((w) => w.type !== 'CONTENT' && w.indicatorIds.length === 0);
      if (invalid) throw new Error('Every non-content widget needs at least one indicator.');

      const isGrid = meta.layoutTemplate === 'GRID';
      const payload = widgets.map((w) => {
        const config = {};
        if (w.rangeMonths) config.rangeMonths = Number(w.rangeMonths);
        if (w.type === 'KPI' && w.growthModes.length > 0) {
          config.growthModes = w.growthModes;
          if (w.growthModes.includes('TARGET')) config.targetType = w.targetType;
          if (w.growthModes.includes('BASELINE') && w.baselineId) config.baselineId = w.baselineId;
        }
        return {
          type: w.type,
          title: w.title || undefined,
          contentHtml: w.type === 'CONTENT' ? w.contentHtml : undefined,
          config,
          indicatorIds: w.type === 'CONTENT' ? undefined : w.indicatorIds,
          columnStart: isGrid && w.columnStart ? Number(w.columnStart) : undefined,
          columnSpan: isGrid ? Number(w.columnSpan || 1) : undefined,
          rowStart: isGrid && w.rowStart ? Number(w.rowStart) : undefined,
          rowSpan: isGrid ? Number(w.rowSpan || 1) : undefined,
        };
      });
      const updated = await api.setViewWidgets(view.id, payload);
      setWidgets(updated.widgets.map(widgetToDraft));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !view) return <div className="page-state error">{error}</div>;
  if (!view || !meta) return <div className="page-state">Loading…</div>;

  const isGrid = meta.layoutTemplate === 'GRID';

  return (
    <div>
      <Link to={`/views/${view.slug}`} className="back-link">
        ← {view.title}
      </Link>
      <div className="page-header">
        <h1>Edit page</h1>
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
        <div className="form-grid">
          <label>
            Section
            <select value={meta.sectionId} onChange={(e) => setMeta((m) => ({ ...m, sectionId: e.target.value }))}>
              <option value="">No section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Layout
            <select value={meta.layoutTemplate} onChange={(e) => setMeta((m) => ({ ...m, layoutTemplate: e.target.value }))}>
              <option value="ONE_COL">One column</option>
              <option value="TWO_COL">Two column</option>
              <option value="GRID">Collage grid</option>
            </select>
          </label>
          {isGrid && (
            <label>
              Grid columns
              <input
                type="number"
                min={1}
                max={12}
                value={meta.gridColumns}
                onChange={(e) => setMeta((m) => ({ ...m, gridColumns: Number(e.target.value) }))}
              />
            </label>
          )}
          <label>
            Visibility
            <select value={meta.visibility} onChange={(e) => setMeta((m) => ({ ...m, visibility: e.target.value }))}>
              <option value="PRIVATE">Private (only me)</option>
              <option value="SHARED">Shared (any signed-in user)</option>
              <option value="PUBLIC">Public (anyone)</option>
            </select>
          </label>
        </div>
        <label className="checklist-item">
          <input
            type="checkbox"
            checked={meta.published}
            onChange={(e) => setMeta((m) => ({ ...m, published: e.target.checked }))}
          />
          Published (uncheck to keep as a draft, visible only to you)
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

            {isGrid && (
              <div className="widget-editor-controls">
                <label className="grid-pos-label">
                  Col start
                  <input
                    type="number"
                    min={1}
                    max={meta.gridColumns}
                    value={widget.columnStart}
                    onChange={(e) => updateWidget(widget.key, { columnStart: e.target.value })}
                  />
                </label>
                <label className="grid-pos-label">
                  Col span
                  <input
                    type="number"
                    min={1}
                    max={meta.gridColumns}
                    value={widget.columnSpan}
                    onChange={(e) => updateWidget(widget.key, { columnSpan: e.target.value })}
                  />
                </label>
                <label className="grid-pos-label">
                  Row start
                  <input
                    type="number"
                    min={1}
                    value={widget.rowStart}
                    onChange={(e) => updateWidget(widget.key, { rowStart: e.target.value })}
                  />
                </label>
                <label className="grid-pos-label">
                  Row span
                  <input
                    type="number"
                    min={1}
                    value={widget.rowSpan}
                    onChange={(e) => updateWidget(widget.key, { rowSpan: e.target.value })}
                  />
                </label>
              </div>
            )}

            {widget.type === 'CONTENT' ? (
              <textarea
                rows={3}
                placeholder="Free-form content (basic HTML: <p>, <strong>, <br> …)"
                value={widget.contentHtml}
                onChange={(e) => updateWidget(widget.key, { contentHtml: e.target.value })}
              />
            ) : (
              <>
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

                {widget.type === 'KPI' && (
                  <div className="growth-mode-config">
                    <strong>Growth rate modes</strong>
                    <div className="indicator-checklist">
                      {GROWTH_MODES.map((mode) => (
                        <label key={mode.value} className="checklist-item">
                          <input
                            type="checkbox"
                            checked={widget.growthModes.includes(mode.value)}
                            onChange={() => toggleGrowthMode(widget.key, mode.value)}
                          />
                          {mode.label}
                        </label>
                      ))}
                    </div>
                    {widget.growthModes.includes('TARGET') && (
                      <label className="inline-form">
                        Target type
                        <select
                          value={widget.targetType}
                          onChange={(e) => updateWidget(widget.key, { targetType: e.target.value })}
                        >
                          <option value="INTERVAL">Interval target</option>
                          <option value="LONG_TERM">Long-term target</option>
                        </select>
                      </label>
                    )}
                    {widget.growthModes.includes('BASELINE') && (
                      <label className="inline-form">
                        Baseline
                        <select
                          value={widget.baselineId}
                          onChange={(e) => updateWidget(widget.key, { baselineId: e.target.value })}
                        >
                          <option value="">Indicator&rsquo;s active baseline (default)</option>
                          {baselinesForWidget(widget).map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.indicatorName} — {b.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                )}
              </>
            )}
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
