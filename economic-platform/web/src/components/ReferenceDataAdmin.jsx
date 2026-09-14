import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

// DU-04: Source and Unit management share the same CRUD + deactivate + merge
// shape, so both admin screens are driven by this one component.
export default function ReferenceDataAdmin({ title, description, extraFieldKey, extraFieldLabel, api }) {
  const { hasRole } = useAuth();
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [extraValue, setExtraValue] = useState('');
  const [mergeTarget, setMergeTarget] = useState({});
  const [error, setError] = useState('');

  function reload() {
    api.list(true).then(setItems).catch((err) => setError(err.message));
  }
  useEffect(reload, []);

  async function onCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.create({ name, [extraFieldKey]: extraValue || undefined });
      setName('');
      setExtraValue('');
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onToggleActive(item) {
    setError('');
    try {
      if (item.active) await api.deactivate(item.id);
      else await api.reactivate(item.id);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onMerge(item) {
    const intoId = mergeTarget[item.id];
    if (!intoId) return;
    if (!window.confirm(`Merge "${item.name}" into the selected item? This moves all indicator links and cannot be undone.`)) return;
    setError('');
    try {
      await api.merge(item.id, intoId);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  const activeItems = items.filter((i) => i.active);

  return (
    <div>
      <div className="page-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {hasRole('EDITOR') && (
        <form className="form-card inline-form" onSubmit={onCreate}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input
            placeholder={`${extraFieldLabel} (optional)`}
            value={extraValue}
            onChange={(e) => setExtraValue(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>
      )}
      {error && <div className="form-error">{error}</div>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>{extraFieldLabel}</th>
            <th>Status</th>
            <th>Indicators</th>
            {hasRole('ADMIN') && <th>Merge into</th>}
            {hasRole('ADMIN') && <th />}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item[extraFieldKey] || '—'}</td>
              <td>
                {item.active ? (
                  'Active'
                ) : (
                  <span className="pill muted">
                    Inactive{item.mergedIntoId ? ' (merged)' : ''}
                  </span>
                )}
              </td>
              <td>{item._count.indicators}</td>
              {hasRole('ADMIN') && (
                <td>
                  {item.active && (
                    <select
                      value={mergeTarget[item.id] || ''}
                      onChange={(e) => setMergeTarget((m) => ({ ...m, [item.id]: e.target.value }))}
                    >
                      <option value="">Select…</option>
                      {activeItems
                        .filter((i) => i.id !== item.id)
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                          </option>
                        ))}
                    </select>
                  )}
                </td>
              )}
              {hasRole('ADMIN') && (
                <td className="admin-row-actions">
                  {item.active && mergeTarget[item.id] && (
                    <button type="button" className="btn-secondary" onClick={() => onMerge(item)}>
                      Merge
                    </button>
                  )}
                  <button type="button" className="btn-secondary" onClick={() => onToggleActive(item)}>
                    {item.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
