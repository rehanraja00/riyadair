import { Link } from 'react-router-dom';
import { LineIndicatorChart, BarIndicatorChart } from './IndicatorChart.jsx';
import { unitLabel } from '../lib/indicatorFormat.js';
import { computeGrowthModes } from '../lib/growthRate.js';
import { sanitizeContentHtml } from '../lib/sanitizeHtml.js';

function widgetIndicators(widget) {
  return widget.indicators.map((wi) => wi.indicator);
}

function GrowthModeRows({ indicator, config }) {
  const rows = computeGrowthModes(indicator, config);
  if (rows.length === 0) return null;
  return (
    <div className="growth-modes">
      {rows.map((row) => (
        <div key={row.mode} className="growth-mode-row">
          <span>{row.label}</span>
          <span className={`growth-mode-value ${row.absolute >= 0 ? 'up' : 'down'}`}>
            {row.absolute >= 0 ? '▲' : '▼'} {Math.abs(row.absolute).toFixed(2)}
            {row.percent != null ? ` (${Math.abs(row.percent).toFixed(1)}%)` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

function KpiWidget({ widget }) {
  const indicators = widgetIndicators(widget);
  return (
    <div className="stat-row">
      {indicators.map((indicator) => {
        const points = indicator.dataPoints;
        const latest = points[points.length - 1];
        const unit = unitLabel(indicator);
        return (
          <Link to={`/indicators/${indicator.id}`} key={indicator.id} className="stat-tile linkable">
            <div className="stat-label">{indicator.name}</div>
            <div className="stat-value">{latest ? `${latest.value.toLocaleString()} ${unit}` : '—'}</div>
            <GrowthModeRows indicator={indicator} config={widget.config} />
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
              <td>{unitLabel(indicator)}</td>
              <td>{latest ? new Date(latest.period).toLocaleDateString() : '—'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ContentWidget({ widget }) {
  return <div className="content-widget" dangerouslySetInnerHTML={{ __html: sanitizeContentHtml(widget.contentHtml) }} />;
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
      {widget.type === 'CONTENT' && <ContentWidget widget={widget} />}
    </div>
  );
}
