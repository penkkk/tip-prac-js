// Чистые функции: без React, DOM, сети, случайных значений и изменения аргументов.
// Точные контракты и допустимые входы приведены в методичке.
export function validateTaskDraft(draft, categories) {
  const title = typeof draft?.title === 'string' ? draft.title.trim() : '';
  const priority = draft?.priority;
  const rawCategoryId = draft?.categoryId;
  const categoryId = typeof rawCategoryId === 'string' && rawCategoryId.trim() === ''
    ? Number.NaN
    : Number(rawCategoryId);
  const errors = {};

  if (typeof draft?.title !== 'string' || title.length < 1 || title.length > 100) {
    errors.title = 'Название должно содержать от 1 до 100 символов.';
  }
  if (!['low', 'medium', 'high'].includes(priority)) {
    errors.priority = 'Выберите приоритет.';
  }
  if (!Number.isSafeInteger(categoryId) || !categories.some(category => category.id === categoryId)) {
    errors.categoryId = 'Выберите существующую категорию.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    value: { title, priority, categoryId },
    errors,
  };
}
export function selectTasks(tasks, filters) {
  const query = filters.q.trim().toLocaleLowerCase('ru-RU');
  return tasks.filter(task => {
    if (query && !task.title.toLocaleLowerCase('ru-RU').includes(query)) return false;
    if (filters.completed && task.completed !== (filters.completed === 'true')) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.categoryId && task.categoryId !== Number(filters.categoryId)) return false;
    return true;
  });
}
export function getTaskStats(tasks) {
  const completed = tasks.filter(task => task.completed).length;
  return { total: tasks.length, completed, active: tasks.length - completed };
}
export function addTask(tasks, value, id) {
  if (!Number.isSafeInteger(id) || id <= 0 || tasks.some(task => task.id === id)) {
    throw new RangeError('Id должен быть уникальным положительным целым числом.');
  }
  return [...tasks, { id, ...value, completed: false }];
}
export function updateTask(tasks, id, value) {
  if (!tasks.some(task => task.id === id)) return tasks;
  return tasks.map(task => task.id === id
    ? { ...task, title: value.title, priority: value.priority, categoryId: value.categoryId }
    : task);
}
export function toggleTask(tasks, id) {
  if (!tasks.some(task => task.id === id)) return tasks;
  return tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
}
export function removeTask(tasks, id) {
  if (!tasks.some(task => task.id === id)) return tasks;
  return tasks.filter(task => task.id !== id);
}
