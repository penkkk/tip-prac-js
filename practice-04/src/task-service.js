// Перед началом ПР4 перенести проверенную реализацию функций ПР2–ПР3.
// Затем добавить updateTask по контракту ПР4.
// Для предусмотренных ошибок возвращается { ok: false, error: "..." }.
// DOM, localStorage и внешнее состояние в этом модуле не используются.

const ALLOWED_PRIORITIES = ["low", "medium", "high"];

function validateId(id) {
  return Number.isSafeInteger(id) && id > 0
    ? { ok: true }
    : { ok: false, error: "Идентификатор должен быть положительным безопасным целым числом" };
}

function normalizeTitle(title) {
  if (typeof title !== "string") return { ok: false, error: "Название задачи должно быть строкой" };
  const normalized = title.trim();
  return normalized.length >= 1 && normalized.length <= 100
    ? { ok: true, title: normalized }
    : { ok: false, error: "Длина названия должна быть от 1 до 100 символов" };
}

function validatePriority(priority) {
  return ALLOWED_PRIORITIES.includes(priority)
    ? { ok: true }
    : { ok: false, error: "Приоритет должен быть low, medium или high" };
}

export function createTask(id, title, priority = "medium") {
  const idResult = validateId(id);
  if (!idResult.ok) return idResult;
  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) return titleResult;
  const priorityResult = validatePriority(priority);
  if (!priorityResult.ok) return priorityResult;
  return { ok: true, task: { id, title: titleResult.title, completed: false, priority } };
}

export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => !task.completed);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  return { total, completed, pending, progress: total === 0 ? 0 : completed / total * 100 };
}

export function addTask(tasks, id, title, priority = "medium") {
  const created = createTask(id, title, priority);
  if (!created.ok) return created;
  if (findTaskById(tasks, id)) return { ok: false, error: `Задача с id ${id} уже существует` };
  return { ok: true, tasks: [...tasks, created.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  const idResult = validateId(id);
  if (!idResult.ok) return idResult;
  if (typeof completed !== "boolean") return { ok: false, error: "Статус completed должен быть логическим значением" };
  if (!findTaskById(tasks, id)) return { ok: false, error: `Задача с id ${id} не найдена` };
  return { ok: true, tasks: tasks.map((task) => task.id === id ? { ...task, completed } : task) };
}

export function renameTask(tasks, id, title) {
  const idResult = validateId(id);
  if (!idResult.ok) return idResult;
  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) return titleResult;
  if (!findTaskById(tasks, id)) return { ok: false, error: `Задача с id ${id} не найдена` };
  return { ok: true, tasks: tasks.map((task) => task.id === id ? { ...task, title: titleResult.title } : task) };
}

export function removeTask(tasks, id) {
  const idResult = validateId(id);
  if (!idResult.ok) return idResult;
  if (!findTaskById(tasks, id)) return { ok: false, error: `Задача с id ${id} не найдена` };
  return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}

export function updateTask(tasks, id, title, priority) {
  // TODO ПР4: проверить id, существование задачи, title и priority.
  // Вернуть новый массив, изменив только title и priority выбранной задачи.
  // Поле completed и исходный массив должны сохраниться.
  const idResult = validateId(id);
  if (!idResult.ok) return idResult;
  if (!findTaskById(tasks, id)) return { ok: false, error: `Задача с id ${id} не найдена` };
  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) return titleResult;
  const priorityResult = validatePriority(priority);
  if (!priorityResult.ok) return priorityResult;
  return {
    ok: true,
    tasks: tasks.map((task) => task.id === id
      ? { ...task, title: titleResult.title, priority }
      : task),
  };
}
