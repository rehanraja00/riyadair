import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function ViewNewPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('PRIVATE');
  const [sectionId, setSectionId] = useState('');
  const [layoutTemplate, setLayoutTemplate] = useState('ONE_COL');
  const [published, setPublished] = useState(true);
  const [sections, setSections] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listSections().then(setSections).catch(() => {});
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const view = await api.createView({
        title,
        description,
        visibility,
        sectionId: sectionId || undefined,
        layoutTemplate,
        published,
      });
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
        <h1>New page</h1>
        <p>Give it a name and a section, then add widgets on the next screen.</p>
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
        <div className="form-grid">
          <label>
            Section
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
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
            <select value={layoutTemplate} onChange={(e) => setLayoutTemplate(e.target.value)}>
              <option value="ONE_COL">One column</option>
              <option value="TWO_COL">Two column</option>
              <option value="GRID">Collage grid</option>
            </select>
          </label>
          <label>
            Visibility
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="PRIVATE">Private (only me)</option>
              <option value="SHARED">Shared (any signed-in user)</option>
              <option value="PUBLIC">Public (anyone)</option>
            </select>
          </label>
        </div>
        <label className="checklist-item">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Published (visible to others immediately; uncheck to keep as a draft)
        </label>
        {error && <div className="form-error">{error}</div>}
        <button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create page'}
        </button>
      </form>
    </div>
  );
}
