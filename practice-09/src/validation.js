import { ApiError } from './errors.js';

// raw: строка; результат: безопасное положительное целое либо null.
export function parsePositiveId(raw) {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

// URLSearchParams -> { completed: boolean|null, priority: string|null,
// categoryId: number|null, q: string }. Ошибка: ApiError(400, 'INVALID_QUERY', ...).
// Неизвестные и повторяющиеся параметры запрещены. Правила — в методичке.
export function parseFilters(searchParams) {
  const allowed = new Set(['completed', 'priority', 'categoryId', 'q']);
  for (const key of searchParams.keys()) {
    if (!allowed.has(key)) throw new ApiError(400, 'INVALID_QUERY', `Неизвестный параметр: ${key}.`);
  }
  for (const key of allowed) {
    if (searchParams.getAll(key).length > 1) {
      throw new ApiError(400, 'INVALID_QUERY', `Параметр ${key} не должен повторяться.`);
    }
  }

  const result = { completed: null, priority: null, categoryId: null, q: '' };
  if (searchParams.has('completed')) {
    const raw = searchParams.get('completed');
    if (raw !== 'true' && raw !== 'false') {
      throw new ApiError(400, 'INVALID_QUERY', 'completed должен быть true или false.');
    }
    result.completed = raw === 'true';
  }
  if (searchParams.has('priority')) {
    const raw = searchParams.get('priority');
    if (!['low', 'medium', 'high'].includes(raw)) {
      throw new ApiError(400, 'INVALID_QUERY', 'Некорректный приоритет.');
    }
    result.priority = raw;
  }
  if (searchParams.has('categoryId')) {
    const value = parsePositiveId(searchParams.get('categoryId'));
    if (value === null) throw new ApiError(400, 'INVALID_QUERY', 'Некорректный categoryId.');
    result.categoryId = value;
  }
  if (searchParams.has('q')) {
    const value = searchParams.get('q').trim();
    if (value.length > 100) throw new ApiError(400, 'INVALID_QUERY', 'Поиск не должен превышать 100 символов.');
    result.q = value;
  }
  return result;
}
