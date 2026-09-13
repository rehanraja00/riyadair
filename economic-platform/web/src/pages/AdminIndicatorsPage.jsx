import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const FREQUENCIES = ['MONTHLY', 'QUARTERLY', 'ANNUAL'];

const emptyForm = { code: '', name: '', description: '', unit: '', frequency: 'MONTHLY', source: '', sourceUrl: '', categoryId: '' };

export default function AdminIndicatorsPage() {
  const { hasRole } = useAuth();
  const [indicators, setIndicators] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  function reload() {
    api.listIndicators().then(setIndicators).catch((err) => setError(err.message));
  }

  useEffect(() => {
    reload();
    api.listCategories().then(setCategories).catch(() => {});
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createIndicator({ ...form, sourceUrl: form.sourceUrl || undefined });
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
      {hasRole('EDITOR') && (
        <form className="form-card" onSubmit={onCreate}>
          <h3>New indicator</h3>
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
          <button type="submit">Add indicator</button>
        </form>
      )}
      {error && <div className="form-error">{error}</div>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Category</th>
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
              <td>{i._count.dataPoints}</td>
              <td className="admin-row-actions">
                <Link to={`/admin/indicators/${i.id}`}>Manage</Link>
                {hasRole('ADMIN') && (
                  <button type="button" className="btn-danger" onClick={() => onDelete(i.id)}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
