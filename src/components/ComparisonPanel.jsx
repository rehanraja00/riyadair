import { formatValue } from '../lib/scoring.js';

export default function ComparisonPanel({ profiles }) {
  return (
    <div className="comparison-grid">
      {profiles.map((profile) => (
        <article className="comparison-card" key={profile.airline}>
          <p className="eyebrow">{profile.hub}</p>
          <h3>{profile.airline}</h3>
          <div className="comparison-card__metrics">
            <div>
              <span>{formatValue(profile.passengerMetric)}</span>
              <small>{profile.passengerPeriod}</small>
            </div>
            <div>
              <span>{formatValue(profile.destinations, 0)}</span>
              <small>Destinations / connected points</small>
            </div>
            <div>
              <span>{formatValue(profile.cargoTonnes)}</span>
              <small>M tonnes cargo if available</small>
            </div>
          </div>
          <div className="two-column-list">
            <div>
              <h4>Strengths</h4>
              <ul>
                {profile.strengths.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h4>Vulnerabilities</h4>
              <ul>
                {profile.vulnerabilities.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
