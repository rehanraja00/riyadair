import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import IntervalPointsEditor from '../components/IntervalPointsEditor.jsx';

const FREQUENCIES = ['MONTHLY', 'QUARTERLY', 'ANNUAL'];

export default function AdminIndicatorDetailPage() {
  const { id } = useParams();
  const [indicator, setIndicator] = useState(null);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [sources, setSources] = useState([]);
  const [form, setForm] = useState(null);
  const [unitSelection, setUnitSelection] = useState({}); // unitId -> true
  const [primaryUnitId, setPrimaryUnitId] = useState('');
  const [sourceSelection, setSourceSelection] = useState({}); // sourceId -> note
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [baselineForm, setBaselineForm] = useState({ label: '', value: '', period: '', intervalType: 'ANNUAL', supersedesId: '' });

  function reload() {
    api
      .getIndicator(id)
      .then((i) => {
        setIndicator(i);
        setForm({
          code: i.code,
          name: i.name,
          description: i.description || '',
          frequency: i.frequency,
          categoryId: i.categoryId,
          longTermTargetLabel: i.longTermTargetLabel || '',
          longTermTargetValue: i.longTermTargetValue ?? '',
        });
        const uSel = {};
        i.units.forEach((u) => {
          uSel[u.unitId] = true;
        });
        setUnitSelection(uSel);
        setPrimaryUnitId((i.units.find((u) => u.isPrimary) || i.units[0])?.unitId || '');
        const sSel = {};
        i.sources.forEach((s) => {
          sSel[s.sourceId] = s.note || '';
        });
        setSourceSelection(sSel);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    reload();
    api.listCategories().then(setCategories).catch(() => {});
    api.listUnits().then(setUnits).catch(() => {});
    api.listSources().then(setSources).catch(() => {});
  }, [id]);

  async function onSaveMeta(e) {
    e.preventDefault();
    setError('');
    const unitIds = Object.keys(unitSelection).filter((k) => unitSelection[k]);
    if (unitIds.length === 0) {
      setError('At least one unit is required.');
      return;
    }
    try {
      await api.updateIndicator(id, {
        ...form,
        longTermTargetValue: form.longTermTargetValue === '' ? undefined : Number(form.longTermTargetValue),
        units: unitIds.map((unitId) => ({ unitId, isPrimary: unitId === primaryUnitId })),
        sources: Object.keys(sourceSelection)
          .filter((k) => sourceSelection[k] !== undefined)
          .map((sourceId) => ({ sourceId, note: sourceSelection[sourceId] || undefined })),
      });
      setNotice('Saved.');
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleUnit(unitId) {
    setUnitSelection((sel) => {
      const next = { ...sel, [unitId]: !sel[unitId] };
      if (!next[unitId] && primaryUnitId === unitId) setPrimaryUnitId('');
      return next;
    });
  }

  function toggleSource(sourceId) {
    setSourceSelection((sel) => {
      const next = { ...sel };
      if (next[sourceId] !== undefined) delete next[sourceId];
      else next[sourceId] = '';
      return next;
    });
  }

  async function onAddBaseline(e) {
    e.preventDefault();
    setError('');
    try {
      await api.addBaseline(id, {
        label: baselineForm.label,
        value: Number(baselineForm.value),
        period: baselineForm.period,
        intervalType: baselineForm.intervalType,
        supersedesId: baselineForm.supersedesId || undefined,
      });
      setBaselineForm({ label: '', value: '', period: '', intervalType: 'ANNUAL', supersedesId: '' });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onActivateBaseline(baselineId) {
    try {
      await api.activateBaseline(id, baselineId);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !indicator) return <div className="page-state error">{error}</div>;
  if (!indicator || !form) return <div className="page-state">Loading…</div>;

  return (
    <div>
      <Link to="/admin/indicators" className="back-link">
        ← Indicators
      </Link>
      <div className="page-header">
        <h1>{indicator.name}</h1>
      </div>

      <form className="form-card" onSubmit={onSaveMeta}>
        <h3>Metadata</h3>
        <div className="form-grid">
          <label>
            Code
            <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required />
          </label>
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </label>
          <label>
            Frequency
            <select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}>
              {FREQUENCIES.map((freq) => (
                <option key={freq} value={freq}>
                  {freq}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Long-term target label
            <input
              value={form.longTermTargetLabel}
              onChange={(e) => setForm((f) => ({ ...f, longTermTargetLabel: e.target.value }))}
            />
          </label>
          <label>
            Long-term target value
            <input
              type="number"
              step="any"
              value={form.longTermTargetValue}
              onChange={(e) => setForm((f) => ({ ...f, longTermTargetValue: e.target.value }))}
            />
          </label>
        </div>
        <label>
          Description
          <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </label>

        <div>
          <strong>Units</strong> <span className="helper-note">(pick a primary)</span>
          <div className="indicator-checklist">
            {units.map((u) => (
              <label key={u.id} className="checklist-item">
                <input type="checkbox" checked={!!unitSelection[u.id]} onChange={() => toggleUnit(u.id)} />
                {u.name} {u.symbol ? `(${u.symbol})` : ''}
                {unitSelection[u.id] && (
                  <input
                    type="radio"
                    name="primaryUnit"
                    checked={primaryUnitId === u.id}
                    onChange={() => setPrimaryUnitId(u.id)}
                    title="Primary unit"
                    style={{ marginLeft: '0.4rem' }}
                  />
                )}
              </label>
            ))}
          </div>
        </div>

        <div>
          <strong>Sources</strong> <span className="helper-note">(multiple sources supported, each with an attribution note)</span>
          <div className="indicator-checklist">
            {sources.map((s) => (
              <label key={s.id} className="checklist-item">
                <input type="checkbox" checked={sourceSelection[s.id] !== undefined} onChange={() => toggleSource(s.id)} />
                {s.name}
                {sourceSelection[s.id] !== undefined && (
                  <input
                    placeholder="note (e.g. Primary)"
                    value={sourceSelection[s.id]}
                    onChange={(e) => setSourceSelection((sel) => ({ ...sel, [s.id]: e.target.value }))}
                    style={{ marginLeft: '0.4rem', width: '8rem' }}
                  />
                )}
              </label>
            ))}
          </div>
        </div>

        {notice && <div className="form-notice">{notice}</div>}
        {error && <div className="form-error">{error}</div>}
        <button type="submit">Save metadata</button>
      </form>

      <div className="panel">
        <h3>Data points ({indicator.dataPoints.length})</h3>
        <IntervalPointsEditor
          points={indicator.dataPoints}
          onAdd={(p) => api.addDataPoints(id, p).then(reload)}
          onBulkAdd={(pts) => api.addDataPoints(id, pts).then(reload)}
          onDelete={(pointId) => api.deleteDataPoint(id, pointId).then(reload)}
        />
      </div>

      <div className="panel">
        <h3>Targets ({indicator.targets.length})</h3>
        <p className="helper-note">Interval-level targets — the plan/budget for each period, shown alongside actuals and forecasts.</p>
        <IntervalPointsEditor
          points={indicator.targets}
          onAdd={(p) => api.addTargets(id, p).then(reload)}
          onBulkAdd={(pts) => api.addTargets(id, pts).then(reload)}
          onDelete={(targetId) => api.deleteTarget(id, targetId).then(reload)}
        />
      </div>

      <div className="panel">
        <h3>Forecasts ({indicator.forecasts.length})</h3>
        <p className="helper-note">
          Rolling forecast — saving never overwrites a prior forecast, it adds a new version. The table shows the latest version per period.
        </p>
        <IntervalPointsEditor
          points={indicator.forecasts}
          onAdd={(p) => api.addForecast(id, p).then(reload)}
          onBulkAdd={(pts) => api.addForecast(id, pts).then(reload)}
          extraColumnLabel="Version"
          extraColumn={(p) => p.version}
        />
      </div>

      <div className="panel">
        <h3>Baselines ({indicator.baselines.length})</h3>
        <p className="helper-note">
          Baselines are never edited — add a new one, optionally marking which baseline it supersedes. Only one baseline is
          &ldquo;active&rdquo; (the widget-level default) at a time.
        </p>
        <form className="inline-form" onSubmit={onAddBaseline}>
          <input
            placeholder="Label"
            value={baselineForm.label}
            onChange={(e) => setBaselineForm((f) => ({ ...f, label: e.target.value }))}
            required
          />
          <input
            type="number"
            step="any"
            placeholder="Value"
            value={baselineForm.value}
            onChange={(e) => setBaselineForm((f) => ({ ...f, value: e.target.value }))}
            required
          />
          <input
            type="date"
            value={baselineForm.period}
            onChange={(e) => setBaselineForm((f) => ({ ...f, period: e.target.value }))}
            required
          />
          <select
            value={baselineForm.intervalType}
            onChange={(e) => setBaselineForm((f) => ({ ...f, intervalType: e.target.value }))}
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <select
            value={baselineForm.supersedesId}
            onChange={(e) => setBaselineForm((f) => ({ ...f, supersedesId: e.target.value }))}
          >
            <option value="">Not superseding any baseline</option>
            {indicator.baselines
              .filter((b) => !indicator.baselines.some((other) => other.supersedesId === b.id))
              .map((b) => (
                <option key={b.id} value={b.id}>
                  Supersedes: {b.label}
                </option>
              ))}
          </select>
          <button type="submit">Add baseline</button>
        </form>

        {indicator.baselines.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Value</th>
                <th>Period</th>
                <th>Interval</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {indicator.baselines.map((b) => (
                <tr key={b.id}>
                  <td>{b.label}</td>
                  <td>{b.value}</td>
                  <td>{new Date(b.period).toLocaleDateString()}</td>
                  <td>{b.intervalType}</td>
                  <td>{b.active ? <span className="pill">Active</span> : '—'}</td>
                  <td>
                    {!b.active && (
                      <button type="button" className="btn-secondary" onClick={() => onActivateBaseline(b.id)}>
                        Set active
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
