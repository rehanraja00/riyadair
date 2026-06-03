import { ArrowUpRight } from 'lucide-react';
import { formatValue, getSource, statusClass } from '../lib/scoring.js';

export default function KpiCard({ item, sources }) {
  const source = getSource(sources, item.sourceId);

  return (
    <article className="kpi-card">
      <div className="kpi-card__topline">
        <span className={statusClass(item.status)}>{item.status}</span>
        {source && (
          <a href={source.url} target="_blank" rel="noreferrer" className="source-link" aria-label={`Open source for ${item.label}`}>
            Source <ArrowUpRight size={14} />
          </a>
        )}
      </div>
      <h3>{item.label}</h3>
      <div className="kpi-card__value">
        <span>{formatValue(item.value)}</span>
        <small>{item.unit}</small>
      </div>
      <div className="kpi-card__footer">
        <span>{item.period}</span>
        <strong>{item.trend}</strong>
      </div>
    </article>
  );
}
