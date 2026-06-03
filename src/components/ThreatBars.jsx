import { threatLabel, weightedThreatScore } from '../lib/scoring.js';

export default function ThreatBars({ data }) {
  return (
    <div className="threat-bars">
      {data.map((item) => {
        const score = weightedThreatScore(item);
        return (
          <div className="threat-bar" key={item.id}>
            <div className="threat-bar__label">
              <strong>{item.threatArea}</strong>
              <span>{threatLabel(score)} · {score}/5</span>
            </div>
            <div className="bar-track" aria-label={`${item.threatArea} average threat score ${score} out of 5`}>
              <div className="bar-fill" style={{ width: `${(score / 5) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
