import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { LineIndicatorChart } from '../components/IndicatorChart.jsx';

export default function IndicatorDetailPage() {
  const { id } = useParams();
  const [indicator, setIndicator] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getIndicator(id)
      .then(setIndicator)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="page-state error">{error}</div>;
  if (!indicator) return <div className="page-state">Loading…</div>;

  const latest = indicator.dataPoints[indicator.dataPoints.length - 1];
  const previous = indicator.dataPoints[indicator.dataPoints.length - 2];
  const delta = latest && previous ? latest.value - previous.value : null;

  return (
    <div>
      <Link to="/indicators" className="back-link">
        ← Indicator library
      </Link>
      <div className="page-header">
        <span className="pill">{indicator.category.name}</span>
        <h1>{indicator.name}</h1>
        <p className="indicator-code">{indicator.code}</p>
        {indicator.description && <p>{indicator.description}</p>}
      </div>

      <div className="stat-row">
        <div className="stat-tile">
          <div className="stat-label">Latest value</div>
          <div className="stat-value">
            {latest ? `${latest.value.toLocaleString()} ${indicator.unit}` : '—'}
          </div>
          {delta !== null && (
            <div className={`stat-delta ${delta >= 0 ? 'up' : 'down'}`}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(2)} vs prior period
            </div>
          )}
        </div>
        <div className="stat-tile">
          <div className="stat-label">Frequency</div>
          <div className="stat-value">{indicator.frequency}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Observations</div>
          <div className="stat-value">{indicator.dataPoints.length}</div>
        </div>
      </div>

      <div className="panel">
        <h3>History</h3>
        {indicator.dataPoints.length > 0 ? (
          <LineIndicatorChart indicators={[indicator]} height={320} />
        ) : (
          <p>No data points yet.</p>
        )}
      </div>

      {indicator.source && (
        <div className="source-note">
          Source: {indicator.sourceUrl ? <a href={indicator.sourceUrl} target="_blank" rel="noreferrer">{indicator.source}</a> : indicator.source}
        </div>
      )}
    </div>
  );
}
