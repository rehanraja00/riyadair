import { Link } from 'react-router-dom';
import { LineIndicatorChart, BarIndicatorChart } from './IndicatorChart.jsx';

function widgetIndicators(widget) {
  return widget.indicators.map((wi) => wi.indicator);
}

function KpiWidget({ widget }) {
  const indicators = widgetIndicators(widget);
  return (
    <div className="stat-row">
      {indicators.map((indicator) => {
        const points = indicator.dataPoints;
        const latest = points[points.length - 1];
        const previous = points[points.length - 2];
        const delta = latest && previous ? latest.value - previous.value : null;
        return (
          <Link to={`/indicators/${indicator.id}`} key={indicator.id} className="stat-tile linkable">
            <div className="stat-label">{indicator.name}</div>
            <div className="stat-value">{latest ? `${latest.value.toLocaleString()} ${indicator.unit}` : '—'}</div>
            {delta !== null && (
              <div className={`stat-delta ${delta >= 0 ? 'up' : 'down'}`}>
                {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(2)}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function TableWidget({ widget }) {
  const indicators = widgetIndicators(widget);
  return (
    <table className="widget-table">
      <thead>
        <tr>
          <th>Indicator</th>
          <th>Latest</th>
          <th>Unit</th>
          <th>As of</th>
        </tr>
      </thead>
      <tbody>
        {indicators.map((indicator) => {
          const latest = indicator.dataPoints[indicator.dataPoints.length - 1];
          return (
            <tr key={indicator.id}>
              <td>
                <Link to={`/indicators/${indicator.id}`}>{indicator.name}</Link>
              </td>
              <td>{latest ? latest.value.toLocaleString() : '—'}</td>
              <td>{indicator.unit}</td>
              <td>{latest ? new Date(latest.period).toLocaleDateString() : '—'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function Widget({ widget }) {
  const indicators = widgetIndicators(widget);
  const rangeMonths = widget.config?.rangeMonths;

  return (
    <div className="widget-card">
      {widget.title && <h3 className="widget-title">{widget.title}</h3>}
      {widget.type === 'KPI' && <KpiWidget widget={widget} />}
      {widget.type === 'LINE_CHART' && <LineIndicatorChart indicators={indicators} rangeMonths={rangeMonths} />}
      {widget.type === 'BAR_CHART' && <BarIndicatorChart indicators={indicators} rangeMonths={rangeMonths} />}
      {widget.type === 'TABLE' && <TableWidget widget={widget} />}
    </div>
  );
}
