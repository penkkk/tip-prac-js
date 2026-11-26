import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function isTask(value) {
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

export function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

// Методы результата:
// getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask,
// setTaskCompleted, deleteTask и resetDemoData.
// Последний аргумент каждого метода данных — { signal }.
export function createTaskApi(client) {
  // Перенесите getTasks/getCategories/loadInitialData из ПР5 и добавьте:
  // getTaskById(id)               -> GET /tasks/:id
  // createTask(draft)             -> POST /tasks
  // updateTask(id, changes)       -> PATCH /tasks/:id
  // setTaskCompleted(id, value)   -> PATCH /tasks/:id
  // deleteTask(id)                -> DELETE /tasks/:id, ожидается null
  // resetDemoData()               -> POST /debug/reset без тела
  // Любая полученная задача и категория проверяется до передачи интерфейсу.
  if (!client || typeof client.requestJson !== "function") throw new TypeError("Требуется API-клиент.");

  function normalizeFilters(filters = {}) {
    if (!filters || typeof filters !== "object" || Array.isArray(filters)) throw new TypeError("Фильтры должны быть объектом.");
    const query = {};
    for (const [name, value] of Object.entries(filters)) {
      if (!ALLOWED_FILTERS.has(name)) throw new TypeError(`Неизвестный фильтр ${name}.`);
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
        if (normalized.length > 100) throw new TypeError("q слишком длинный.");
        if (normalized) query.q = normalized;
      }
    }
    return query;
  }
  const hasUniqueIds = (items) => new Set(items.map((item) => item.id)).size === items.length;
  const signalOption = (options) => options?.signal ? { signal: options.signal } : {};
  function readTask(payload) {
    if (!payload || !isTask(payload.data)) throw invalidResponse("Задача не соответствует контракту.");
    return payload.data;
  }

  async function getTasks(filters = {}, options = {}) {
    const payload = await client.requestJson("/tasks", {
      query: normalizeFilters(filters), ...signalOption(options),
    });
    if (!payload || !Array.isArray(payload.data) || !payload.data.every(isTask)
      || !hasUniqueIds(payload.data) || payload.meta?.total !== payload.data.length) {
      throw invalidResponse("Список задач не соответствует контракту.");
    }
    return { tasks: payload.data, meta: payload.meta };
  }
  async function getTaskById(id, options = {}) {
    if (!isPositiveSafeInteger(id)) throw new TypeError("Некорректный id.");
    return readTask(await client.requestJson(`/tasks/${id}`, Object.keys(signalOption(options)).length ? signalOption(options) : undefined));
  }
  async function getCategories(options = {}) {
    const requestOptions = signalOption(options);
    const payload = await client.requestJson("/categories", Object.keys(requestOptions).length ? requestOptions : undefined);
    if (!payload || !Array.isArray(payload.data) || !payload.data.every(isCategory)
      || !hasUniqueIds(payload.data) || payload.meta?.total !== payload.data.length) {
      throw invalidResponse("Категории не соответствуют контракту.");
    }
    return payload.data;
  }
  async function loadInitialData(filters = {}, options = {}) {
    const tasksPromise = getTasks(filters, options);
    const categoriesPromise = getCategories(options);
    const [{ tasks, meta }, categories] = await Promise.all([tasksPromise, categoriesPromise]);
    return { tasks, categories, meta };
  }
  async function createTask(draft, options = {}) {
    return readTask(await client.requestJson("/tasks", { method: "POST", body: draft, ...signalOption(options) }));
  }
  async function updateTask(id, changes, options = {}) {
    if (!isPositiveSafeInteger(id)) throw new TypeError("Некорректный id.");
    return readTask(await client.requestJson(`/tasks/${id}`, { method: "PATCH", body: changes, ...signalOption(options) }));
  }
  async function setTaskCompleted(id, completed, options = {}) {
    if (typeof completed !== "boolean") throw new TypeError("completed должен быть boolean.");
    return updateTask(id, { completed }, options);
  }
  async function deleteTask(id, options = {}) {
    if (!isPositiveSafeInteger(id)) throw new TypeError("Некорректный id.");
    const result = await client.requestJson(`/tasks/${id}`, { method: "DELETE", ...signalOption(options) });
    if (result !== null) throw invalidResponse("DELETE должен вернуть пустой ответ.");
    return null;
  }
  async function resetDemoData(options = {}) {
    const payload = await client.requestJson("/debug/reset", { method: "POST", ...signalOption(options) });
    if (!payload?.data || payload.data.reset !== true || !Number.isSafeInteger(payload.data.total)) {
      throw invalidResponse("Подтверждение сброса не соответствует контракту.");
    }
    return payload.data;
  }
  return {
    getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask,
    setTaskCompleted, deleteTask, resetDemoData,
  };
}
