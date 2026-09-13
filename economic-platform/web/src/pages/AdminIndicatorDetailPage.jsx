import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';

const FREQUENCIES = ['MONTHLY', 'QUARTERLY', 'ANNUAL'];

export default function AdminIndicatorDetailPage() {
  const { id } = useParams();
  const [indicator, setIndicator] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [newPoint, setNewPoint] = useState({ period: '', value: '' });
  const [csv, setCsv] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function reload() {
    api
      .getIndicator(id)
      .then((i) => {
        setIndicator(i);
        setForm({
          code: i.code,
          name: i.name,
          description: i.description || '',
          unit: i.unit,
          frequency: i.frequency,
          source: i.source || '',
          sourceUrl: i.sourceUrl || '',
          categoryId: i.categoryId,
        });
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    reload();
    api.listCategories().then(setCategories).catch(() => {});
  }, [id]);

  async function onSaveMeta(e) {
    e.preventDefault();
    setError('');
    try {
      await api.updateIndicator(id, { ...form, sourceUrl: form.sourceUrl || undefined });
      setNotice('Saved.');
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onAddPoint(e) {
    e.preventDefault();
    setError('');
    try {
      await api.addDataPoints(id, { period: newPoint.period, value: Number(newPoint.value) });
      setNewPoint({ period: '', value: '' });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onBulkAdd() {
    setError('');
    try {
      const points = csv
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [period, value] = line.split(',').map((s) => s.trim());
          return { period, value: Number(value) };
        });
      if (points.length === 0) throw new Error('Paste at least one "date,value" line.');
      await api.addDataPoints(id, points);
      setCsv('');
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDeletePoint(pointId) {
    try {
      await api.deleteDataPoint(id, pointId);
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
            Unit
            <input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} required />
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
            Source
            <input value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} />
          </label>
          <label>
            Source URL
            <input value={form.sourceUrl} onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))} />
          </label>
        </div>
        <label>
          Description
          <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </label>
        {notice && <div className="form-notice">{notice}</div>}
        <button type="submit">Save metadata</button>
      </form>

      <div className="panel">
        <h3>Add a data point</h3>
        <form className="inline-form" onSubmit={onAddPoint}>
          <input
            type="date"
            value={newPoint.period}
            onChange={(e) => setNewPoint((p) => ({ ...p, period: e.target.value }))}
            required
          />
          <input
            type="number"
            step="any"
            placeholder="Value"
            value={newPoint.value}
            onChange={(e) => setNewPoint((p) => ({ ...p, value: e.target.value }))}
            required
          />
          <button type="submit">Add point</button>
        </form>

        <h4>Bulk paste (CSV: date,value per line)</h4>
        <textarea
          rows={4}
          placeholder={'2024-01-01,3.2\n2024-02-01,3.4'}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <button type="button" className="btn-secondary" onClick={onBulkAdd}>
          Import points
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel">
        <h3>Data points ({indicator.dataPoints.length})</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Value</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {[...indicator.dataPoints].reverse().map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.period).toLocaleDateString()}</td>
                <td>{p.value}</td>
                <td>
                  <button type="button" className="btn-danger" onClick={() => onDeletePoint(p.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
