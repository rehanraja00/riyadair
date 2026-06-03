export default function SectionCard({ eyebrow, title, description, children, actions }) {
  return (
    <section className="section-card">
      <div className="section-card__header">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
          {description && <p className="section-card__description">{description}</p>}
        </div>
        {actions && <div className="section-card__actions">{actions}</div>}
      </div>
      <div className="section-card__body">{children}</div>
    </section>
  );
}
