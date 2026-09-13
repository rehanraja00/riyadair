import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminCategoriesPage() {
  const { hasRole } = useAuth();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  function reload() {
    api.listCategories().then(setCategories).catch((err) => setError(err.message));
  }

  useEffect(reload, []);

  async function onCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createCategory({ name, description });
      setName('');
      setDescription('');
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDelete(id) {
    if (!window.confirm('Delete this category? Indicators must be reassigned first.')) return;
    try {
      await api.deleteCategory(id);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      {hasRole('EDITOR') && (
        <form className="form-card inline-form" onSubmit={onCreate}>
          <input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button type="submit">Add category</button>
        </form>
      )}
      {error && <div className="form-error">{error}</div>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Indicators</th>
            {hasRole('ADMIN') && <th />}
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.slug}</td>
              <td>{c._count.indicators}</td>
              {hasRole('ADMIN') && (
                <td>
                  <button type="button" className="btn-danger" onClick={() => onDelete(c.id)}>
                    Delete
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
