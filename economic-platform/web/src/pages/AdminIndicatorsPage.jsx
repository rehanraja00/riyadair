import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { primaryUnit } from '../lib/indicatorFormat.js';

const FREQUENCIES = ['MONTHLY', 'QUARTERLY', 'ANNUAL'];

const emptyForm = { code: '', name: '', description: '', unitId: '', sourceId: '', frequency: 'MONTHLY', categoryId: '' };

export default function AdminIndicatorsPage() {
  const [indicators, setIndicators] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [sources, setSources] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  function reload() {
    api.listIndicators().then(setIndicators).catch((err) => setError(err.message));
  }

  useEffect(() => {
    reload();
    api.listCategories().then(setCategories).catch(() => {});
    api.listUnits().then(setUnits).catch(() => {});
    api.listSources().then(setSources).catch(() => {});
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createIndicator({
        code: form.code,
        name: form.name,
        description: form.description || undefined,
        frequency: form.frequency,
        categoryId: form.categoryId,
        units: [{ unitId: form.unitId, isPrimary: true }],
        sources: form.sourceId ? [{ sourceId: form.sourceId, note: 'Primary' }] : [],
      });
      setForm(emptyForm);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDelete(id) {
    if (!window.confirm('Delete this indicator and all of its data points?')) return;
    try {
      await api.deleteIndicator(id);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <form className="form-card" onSubmit={onCreate}>
        <h3>New indicator</h3>
        <p className="helper-note">Add more sources/units, targets, forecasts, and baselines from the Manage screen after creating.</p>
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
              Primary unit
              <select value={form.unitId} onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))} required>
                <option value="" disabled>
                  Select…
                </option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.symbol ? `(${u.symbol})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Frequency
              <select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Category
              <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} required>
                <option value="" disabled>
                  Select…
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Source
              <select value={form.sourceId} onChange={(e) => setForm((f) => ({ ...f, sourceId: e.target.value }))}>
                <option value="">None yet</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Description
            <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </label>
          <button type="submit">Add indicator</button>
        </form>
      {error && <div className="form-error">{error}</div>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Category</th>
            <th>Unit</th>
            <th>Points</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {indicators.map((i) => (
            <tr key={i.id}>
              <td>{i.code}</td>
              <td>{i.name}</td>
              <td>{i.category.name}</td>
              <td>{primaryUnit(i)?.symbol || primaryUnit(i)?.name || '—'}</td>
              <td>{i._count.dataPoints}</td>
              <td className="admin-row-actions">
                <Link to={`/admin/indicators/${i.id}`}>Manage</Link>
                <button type="button" className="btn-danger" onClick={() => onDelete(i.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
