import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function ViewNewPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('PRIVATE');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const view = await api.createView({ title, description, visibility });
      navigate(`/views/${view.slug}/edit`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Link to="/views" className="back-link">
        ← Views
      </Link>
      <div className="page-header">
        <h1>New view</h1>
        <p>Give it a name, then add widgets on the next screen.</p>
      </div>
      <form className="form-card" onSubmit={onSubmit}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>
        <label>
          Visibility
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            <option value="PRIVATE">Private (only me)</option>
            <option value="SHARED">Shared (any signed-in user)</option>
            <option value="PUBLIC">Public (anyone)</option>
          </select>
        </label>
        {error && <div className="form-error">{error}</div>}
        <button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create view'}
        </button>
      </form>
    </div>
  );
}
