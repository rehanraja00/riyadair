export default function FleetMatrix({ orders }) {
  return (
    <div className="fleet-grid">
      {orders.map((item) => (
        <article className="fleet-card" key={item.aircraftType}>
          <div className="fleet-card__header">
            <h3>{item.aircraftType}</h3>
            <span>{item.totalPotential} aircraft</span>
          </div>
          <dl className="fleet-card__stats">
            <div>
              <dt>Firm</dt>
              <dd>{item.firmOrders}</dd>
            </div>
            <div>
              <dt>Options / Rights</dt>
              <dd>{item.options}</dd>
            </div>
          </dl>
          <p>{item.role}</p>
          <div className="chips" aria-label={`Typical route examples for ${item.aircraftType}`}>
            {item.routeExamples.map((route) => (
              <span className="chip" key={route}>{route}</span>
            ))}
          </div>
          <p className="muted-text">{item.strategicMeaning}</p>
        </article>
      ))}
    </div>
  );
}
