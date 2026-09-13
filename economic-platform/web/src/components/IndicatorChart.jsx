import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#2563eb', '#d97706', '#059669', '#dc2626', '#7c3aed'];

function formatPeriod(period) {
  return new Date(period).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

function mergeSeries(indicators, rangeMonths) {
  const byPeriod = new Map();
  indicators.forEach((indicator) => {
    let points = indicator.dataPoints;
    if (rangeMonths) {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - rangeMonths);
      points = points.filter((p) => new Date(p.period) >= cutoff);
    }
    points.forEach((p) => {
      const key = p.period;
      if (!byPeriod.has(key)) byPeriod.set(key, { period: key });
      byPeriod.get(key)[indicator.code] = p.value;
    });
  });
  return Array.from(byPeriod.values()).sort((a, b) => new Date(a.period) - new Date(b.period));
}

export function LineIndicatorChart({ indicators, rangeMonths, height = 260 }) {
  const data = mergeSeries(indicators, rangeMonths);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="period" tickFormatter={formatPeriod} tick={{ fontSize: 11 }} minTickGap={24} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip labelFormatter={formatPeriod} contentStyle={{ fontSize: 12 }} />
        {indicators.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {indicators.map((indicator, i) => (
          <Line
            key={indicator.id}
            type="monotone"
            dataKey={indicator.code}
            name={indicator.name}
            stroke={COLORS[i % COLORS.length]}
            dot={false}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BarIndicatorChart({ indicators, rangeMonths, height = 260 }) {
  const data = mergeSeries(indicators, rangeMonths);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis dataKey="period" tickFormatter={formatPeriod} tick={{ fontSize: 11 }} minTickGap={24} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip labelFormatter={formatPeriod} contentStyle={{ fontSize: 12 }} />
        {indicators.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {indicators.map((indicator, i) => (
          <Bar key={indicator.id} dataKey={indicator.code} name={indicator.name} fill={COLORS[i % COLORS.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
