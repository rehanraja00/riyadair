import { useState } from 'react';

// Shared UX for entering interval-level values (data points, targets) — DU-10
// requires forecast entry to mirror target entry, and target entry mirrors
// the existing data-point entry, so all three share this component.
export default function IntervalPointsEditor({
  points,
  onAdd,
  onBulkAdd,
  onDelete,
  valueLabel = 'Value',
  extraColumnLabel,
  extraColumn,
}) {
  const [single, setSingle] = useState({ period: '', value: '' });
  const [csv, setCsv] = useState('');
  const [error, setError] = useState('');

  async function submitSingle(e) {
    e.preventDefault();
    setError('');
    try {
      await onAdd({ period: single.period, value: Number(single.value) });
      setSingle({ period: '', value: '' });
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitBulk() {
    setError('');
    try {
      const rows = csv
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const [period, value] = l.split(',').map((s) => s.trim());
          return { period, value: Number(value) };
        });
      if (rows.length === 0) throw new Error('Paste at least one "date,value" line.');
      await onBulkAdd(rows);
      setCsv('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <form className="inline-form" onSubmit={submitSingle}>
        <input
          type="date"
          value={single.period}
          onChange={(e) => setSingle((s) => ({ ...s, period: e.target.value }))}
          required
        />
        <input
          type="number"
          step="any"
          placeholder={valueLabel}
          value={single.value}
          onChange={(e) => setSingle((s) => ({ ...s, value: e.target.value }))}
          required
        />
        <button type="submit">Add</button>
      </form>

      <h4>Bulk paste (CSV: date,value per line)</h4>
      <textarea rows={3} placeholder={'2024-01-01,3.2\n2024-02-01,3.4'} value={csv} onChange={(e) => setCsv(e.target.value)} />
      <button type="button" className="btn-secondary" onClick={submitBulk}>
        Import
      </button>

      {error && <div className="form-error">{error}</div>}

      {points.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>{valueLabel}</th>
              {extraColumnLabel && <th>{extraColumnLabel}</th>}
              {onDelete && <th />}
            </tr>
          </thead>
          <tbody>
            {[...points].reverse().map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.period).toLocaleDateString()}</td>
                <td>{p.value}</td>
                {extraColumnLabel && <td>{extraColumn(p)}</td>}
                {onDelete && (
                  <td>
                    <button type="button" className="btn-danger" onClick={() => onDelete(p.id)}>
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
