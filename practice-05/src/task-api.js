import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

// client — объект, созданный createApiClient.
// Контракт результата:
// getTasks(filters) -> Promise<{ tasks, meta }>
// getTaskById(id) -> Promise<task>
// getCategories() -> Promise<category[]>
// loadInitialData(filters) -> Promise<{ tasks, categories, meta }>
export function createTaskApi(client) {
  // TODO:
  // 1. Проверить наличие client.requestJson.
  // 2. Нормализовать и проверить только completed, priority, categoryId и q.
  // 3. Реализовать три запроса к tasks/categories.
  // 4. Проверить форму JSON по isTask/isCategory, включая уникальность id.
  // 5. Реализовать параллельную загрузку через Promise.all.
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("Требуется клиент с методом requestJson.");
  }

  function normalizeFilters(filters = {}) {
    if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
      throw new TypeError("Фильтры должны быть объектом.");
    }
    const query = {};
    for (const [name, value] of Object.entries(filters)) {
      if (!ALLOWED_FILTERS.has(name)) throw new TypeError(`Неизвестный фильтр: ${name}`);
      if (name === "completed") {
        if (typeof value !== "boolean") throw new TypeError("completed должен быть boolean.");
        query.completed = value;
      } else if (name === "priority") {
        if (!ALLOWED_PRIORITIES.has(value)) throw new TypeError("Некорректный priority.");
        query.priority = value;
      } else if (name === "categoryId") {
        if (!isPositiveSafeInteger(value)) throw new TypeError("Некорректный categoryId.");
        query.categoryId = value;
      } else {
        if (typeof value !== "string") throw new TypeError("q должен быть строкой.");
        const normalized = value.trim();
        if (normalized.length > 100) throw new TypeError("q не должен превышать 100 символов.");
        if (normalized) query.q = normalized;
      }
    }
    return query;
  }

  function ensureUniqueIds(items) {
    return new Set(items.map((item) => item.id)).size === items.length;
  }

  async function getTasks(filters = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query });
    if (!payload || !Array.isArray(payload.data) || !payload.data.every(isTask)
      || !ensureUniqueIds(payload.data) || !payload.meta
      || payload.meta.total !== payload.data.length) {
      throw invalidResponse("Ответ списка задач не соответствует контракту.");
    }
    return { tasks: payload.data, meta: payload.meta };
  }

  async function getTaskById(id) {
    if (!isPositiveSafeInteger(id)) throw new TypeError("Некорректный id задачи.");
    const payload = await client.requestJson(`/tasks/${id}`);
    if (!payload || !isTask(payload.data)) {
      throw invalidResponse("Ответ задачи не соответствует контракту.");
    }
    return payload.data;
  }

  async function getCategories() {
    const payload = await client.requestJson("/categories");
    if (!payload || !Array.isArray(payload.data) || !payload.data.every(isCategory)
      || !ensureUniqueIds(payload.data) || payload.meta?.total !== payload.data.length) {
      throw invalidResponse("Ответ категорий не соответствует контракту.");
    }
    return payload.data;
  }

  async function loadInitialData(filters = {}) {
    const tasksPromise = getTasks(filters);
    const categoriesPromise = getCategories();
    const [{ tasks, meta }, categories] = await Promise.all([tasksPromise, categoriesPromise]);
    return { tasks, categories, meta };
  }

  return { getTasks, getTaskById, getCategories, loadInitialData };
}
