export default function TaskFilters({ filters, categories, onChange }) {
  const change = event => onChange({ ...filters, [event.target.name]: event.target.value });
  return <section aria-label="Фильтры">
    <h2>Фильтры</h2>
    <label htmlFor="filter-q">Поиск</label>
    <input id="filter-q" name="q" value={filters.q} onChange={change} />
    <fieldset className="filter-status">
      <legend>Статус</legend>
      {[['', 'Все'], ['false', 'В работе'], ['true', 'Завершённые']].map(([value, label]) =>
        <button key={value || 'all'} type="button" aria-pressed={filters.completed === value} onClick={() => onChange({ ...filters, completed: value })}>{label}</button>)}
    </fieldset>
    <label htmlFor="filter-priority">Приоритет</label>
    <select id="filter-priority" name="priority" value={filters.priority} onChange={change}>
      <option value="">Все</option><option value="low">Низкий</option><option value="medium">Средний</option><option value="high">Высокий</option>
    </select>
    <label htmlFor="filter-category">Категория</label>
    <select id="filter-category" name="categoryId" value={filters.categoryId} onChange={change}>
      <option value="">Все</option>
      {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
    </select>
    <button type="button" onClick={() => onChange({ q: '', completed: '', priority: '', categoryId: '' })}>Сбросить фильтры</button>
  </section>;
}
