import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, FileDown, Plane, Radar, Route, ShieldCheck } from 'lucide-react';
import KpiCard from './components/KpiCard.jsx';
import SectionCard from './components/SectionCard.jsx';
import ThreatBars from './components/ThreatBars.jsx';
import FleetMatrix from './components/FleetMatrix.jsx';
import DataTable from './components/DataTable.jsx';
import FilterBar from './components/FilterBar.jsx';
import ComparisonPanel from './components/ComparisonPanel.jsx';
import {
  actionRegister,
  airlineProfiles,
  executiveKpis,
  fleetOrders,
  lastUpdated,
  metricTracker,
  routeCorridors,
  sourceLinks,
  threatAssessment
} from './data/dashboardData.js';
import { getThreatSummary, statusClass, weightedThreatScore } from './lib/scoring.js';

const navItems = [
  { id: 'executive', label: 'Executive', icon: Activity },
  { id: 'fleet', label: 'Fleet', icon: Plane },
  { id: 'threat', label: 'Threat Matrix', icon: Radar },
  { id: 'routes', label: 'Route Watch', icon: Route },
  { id: 'actions', label: 'Actions', icon: ShieldCheck },
  { id: 'sources', label: 'Sources', icon: FileDown }
];

export default function App() {
  const [activeView, setActiveView] = useState('executive');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(
    () => [...new Set(threatAssessment.map((item) => item.category))],
    []
  );

  const filteredThreats = useMemo(() => {
    if (selectedCategory === 'All') return threatAssessment;
    return threatAssessment.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const summary = useMemo(() => getThreatSummary(threatAssessment), []);
  const riyadhOrderBook = executiveKpis.find((item) => item.id === 'riyadh-air-orderbook')?.value || 'N/A';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">GA</div>
          <div>
            <strong>Gulf Aviation</strong>
            <span>Competitive Tracker</span>
          </div>
        </div>

        <nav aria-label="Dashboard navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={activeView === item.id ? 'nav-button nav-button--active' : 'nav-button'}
                onClick={() => setActiveView(item.id)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-note">
          <AlertTriangle size={18} />
          <p>Use this as a strategic monitoring dashboard. Connect live data feeds before using as a formal operational system.</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="hero-panel">
          <div>
            <p className="eyebrow">Strategic aviation watch · last updated {lastUpdated}</p>
            <h1>Riyadh Air vs Qatar Airways Strategic Threat Dashboard</h1>
            <p>
              Tracks Riyadh Air growth and Qatar Airways exposure across fleet, hub, route and threat indicators.
            </p>
          </div>
          <div className="hero-score">
            <span>Highest tracked threat to Qatar Airways</span>
            <strong>{summary.topThreat.threatArea}</strong>
            <small>Qatar exposure score: {weightedThreatScore(summary.topThreat)}/5</small>
          </div>
        </header>

        {activeView === 'executive' && (
          <div className="view-stack">
            <section className="kpi-grid">
              {executiveKpis.map((item) => <KpiCard key={item.id} item={item} sources={sourceLinks} />)}
            </section>

            <SectionCard
              eyebrow="Exposure summary"
              title="Qatar Airways exposure to Riyadh Air"
              description="Average Qatar Airways exposure across tracked threat areas. 5 means highest exposure."
            >
              <div className="summary-grid">
                <article>
                  <BarChart3 size={22} />
                  <span>Qatar Airways</span>
                  <strong>{summary.qatarAverage}/5</strong>
                  <p>Higher near-term exposure driven by transfer dependency and Riyadh Air route development.</p>
                </article>
                <article>
                  <BarChart3 size={22} />
                  <span>Riyadh Air build-out</span>
                  <strong>{riyadhOrderBook} aircraft</strong>
                  <p>Riyadh Air’s planned fleet gives it the scale to challenge Qatar Airways on premium and transfer corridors.</p>
                </article>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Strategic comparison"
              title="Riyadh Air vs Qatar Airways"
              description="Comparative view of hub position, strengths and vulnerabilities for the two carriers most directly impacted."
            >
              <ComparisonPanel profiles={airlineProfiles} />
            </SectionCard>
          </div>
        )}

        {activeView === 'fleet' && (
          <div className="view-stack">
            <SectionCard
              eyebrow="Fleet capability"
              title="Riyadh Air order book and route implications"
              description="The mix of A321neo, 787-9 and A350-1000 aircraft gives Riyadh Air regional feed, long-haul reach and flagship premium capacity."
            >
              <FleetMatrix orders={fleetOrders} />
            </SectionCard>

            <SectionCard
              eyebrow="Metric tracker"
              title="Baseline indicators"
              description="Baseline figures that should be refreshed as official updates are released."
            >
              <DataTable
                rows={metricTracker}
                getRowKey={(row) => row.metric}
                columns={[
                  { key: 'metric', label: 'Metric' },
                  { key: 'entity', label: 'Entity' },
                  { key: 'baseline', label: 'Baseline' },
                  { key: 'unit', label: 'Unit' },
                  { key: 'direction', label: 'Interpretation' },
                  { key: 'status', label: 'Status', render: (row) => <span className={statusClass(row.status)}>{row.status}</span> }
                ]}
              />
            </SectionCard>
          </div>
        )}

        {activeView === 'threat' && (
          <div className="view-stack">
            <SectionCard
              eyebrow="Threat matrix"
              title="Competitive exposure tracker"
              description="Filter by category and track Qatar Airways exposure to Riyadh Air emergence."
              actions={<FilterBar selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} categories={categories} />}
            >
              <ThreatBars data={filteredThreats} />
              <DataTable
                rows={filteredThreats}
                getRowKey={(row) => row.id}
                columns={[
                  { key: 'threatArea', label: 'Threat area' },
                  { key: 'category', label: 'Category' },
                  { key: 'qatarExposure', label: 'Qatar exposure' },
                  { key: 'trigger', label: 'Trigger' },
                  { key: 'recommendedAction', label: 'Recommended action' }
                ]}
              />
            </SectionCard>
          </div>
        )}

        {activeView === 'routes' && (
          <SectionCard
            eyebrow="Route corridor watch"
            title="Corridors where Riyadh Air can attack Doha flows"
            description="Use this table to prioritize monthly fare, frequency, capacity, load factor and route-launch monitoring for Doha-origin competition."
          >
            <DataTable
              rows={routeCorridors}
              getRowKey={(row) => row.corridor}
              columns={[
                { key: 'corridor', label: 'Corridor' },
                { key: 'currentHubStrength', label: 'Current hub strength' },
                { key: 'threatLevel', label: 'Threat level', render: (row) => <span className={statusClass(row.threatLevel)}>{row.threatLevel}</span> },
                { key: 'riyadhAircraft', label: 'Riyadh aircraft' },
                { key: 'watchMetrics', label: 'Watch metrics', render: (row) => row.watchMetrics.join(', ') }
              ]}
            />
          </SectionCard>
        )}

        {activeView === 'actions' && (
          <SectionCard
            eyebrow="Governance"
            title="Action register"
            description="Actions are structured for ownership, deadline tracking and executive follow-up."
          >
            <DataTable
              rows={actionRegister}
              getRowKey={(row) => row.id}
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'action', label: 'Action' },
                { key: 'owner', label: 'Owner' },
                { key: 'priority', label: 'Priority', render: (row) => <span className={statusClass(row.priority)}>{row.priority}</span> },
                { key: 'due', label: 'Due' },
                { key: 'status', label: 'Status', render: (row) => <span className={statusClass(row.status)}>{row.status}</span> },
                { key: 'linkedThreat', label: 'Linked threat' }
              ]}
            />
          </SectionCard>
        )}

        {activeView === 'sources' && (
          <SectionCard
            eyebrow="Lineage"
            title="Source register"
            description="Production dashboards should retain source ownership, refresh cadence and URL lineage for every tracked indicator."
          >
            <DataTable
              rows={sourceLinks}
              getRowKey={(row) => row.id}
              columns={[
                { key: 'label', label: 'Source' },
                { key: 'owner', label: 'Owner' },
                { key: 'refreshCadence', label: 'Refresh cadence' },
                { key: 'url', label: 'URL', render: (row) => <a href={row.url} target="_blank" rel="noreferrer">Open source</a> }
              ]}
            />
          </SectionCard>
        )}
      </main>
    </div>
  );
}
