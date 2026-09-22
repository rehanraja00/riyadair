import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function AdminSectionsPage() {
  const [sections, setSections] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function reload() {
    api.listSections().then(setSections).catch((err) => setError(err.message));
  }
  useEffect(reload, []);

  async function onCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createSection({ name });
      setName('');
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDelete(id) {
    if (!window.confirm('Delete this section? Pages must be moved out first.')) return;
    try {
      await api.deleteSection(id);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Sections</h1>
        <p>Pages (Views) are created under a section — the top level of the dashboard navigation.</p>
      </div>

      <form className="form-card inline-form" onSubmit={onCreate}>
        <input placeholder="Section name" value={name} onChange={(e) => setName(e.target.value)} required />
        <button type="submit">Add section</button>
      </form>
      {error && <div className="form-error">{error}</div>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Pages</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sections.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.slug}</td>
              <td>{s._count.views}</td>
              <td>
                <button type="button" className="btn-danger" onClick={() => onDelete(s.id)}>
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
