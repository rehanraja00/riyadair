import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function IndicatorLibraryPage() {
  const [indicators, setIndicators] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(() => {
      api
        .listIndicators({ category, search })
        .then(setIndicators)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(handle);
  }, [category, search]);

  return (
    <div>
      <div className="page-header">
        <h1>Indicator library</h1>
        <p>Browse the economic indicators available to build views from.</p>
      </div>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search indicators…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name} ({c._count.indicators})
            </option>
          ))}
        </select>
      </div>

      {error && <div className="page-state error">{error}</div>}
      {loading ? (
        <div className="page-state">Loading…</div>
      ) : indicators.length === 0 ? (
        <div className="page-state">No indicators match your filters.</div>
      ) : (
        <div className="card-grid">
          {indicators.map((indicator) => (
            <Link to={`/indicators/${indicator.id}`} key={indicator.id} className="indicator-card">
              <div className="indicator-card-top">
                <span className="pill">{indicator.category.name}</span>
                <span className="pill muted">{indicator.frequency}</span>
              </div>
              <h3>{indicator.name}</h3>
              <p className="indicator-code">{indicator.code}</p>
              {indicator.description && <p className="indicator-desc">{indicator.description}</p>}
              <div className="indicator-card-bottom">
                <span>{indicator._count.dataPoints} observations</span>
                <span>{indicator.unit}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
