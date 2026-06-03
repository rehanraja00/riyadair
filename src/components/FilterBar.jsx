export default function FilterBar({ selectedCategory, setSelectedCategory, categories }) {
  return (
    <div className="filter-bar">
      <label htmlFor="category-filter">Threat category</label>
      <select id="category-filter" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
        <option value="All">All categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
    </div>
  );
}
