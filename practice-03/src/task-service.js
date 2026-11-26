const allowedPriorities = ["low", "medium", "high"];

function validateId(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return { ok: false, error: "Идентификатор должен быть положительным безопасным целым числом" };
  }

  return { ok: true };
}

function normalizeTitle(title) {
  if (typeof title !== "string") {
    return { ok: false, error: "Название задачи должно быть строкой" };
  }

  const normalizedTitle = title.trim();

  if (normalizedTitle.length < 1 || normalizedTitle.length > 100) {
    return { ok: false, error: "Длина названия должна быть от 1 до 100 символов" };
  }

  return { ok: true, title: normalizedTitle };
}

function validatePriority(priority) {
  if (!allowedPriorities.includes(priority)) {
    return { ok: false, error: "Приоритет должен быть low, medium или high" };
  }

  return { ok: true };
}

export function createTask(id, title, priority = "medium") {
  const idResult = validateId(id);
  if (!idResult.ok) {
    return idResult;
  }

  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) {
    return titleResult;
  }

  const priorityResult = validatePriority(priority);
  if (!priorityResult.ok) {
    return priorityResult;
  }

  return {
    ok: true,
    task: {
      id,
      title: titleResult.title,
      completed: false,
      priority,
    },
  };
}

export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed === true).length;
  const pending = total - completed;
  const progress = total === 0 ? 0 : completed / total * 100;

  return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
  const createResult = createTask(id, title, priority);

  if (!createResult.ok) {
    return createResult;
  }

  if (findTaskById(tasks, id) !== undefined) {
    return { ok: false, error: `Задача с id ${id} уже существует` };
  }

  return { ok: true, tasks: [...tasks, createResult.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  const idResult = validateId(id);
  if (!idResult.ok) {
    return idResult;
  }

  if (typeof completed !== "boolean") {
    return { ok: false, error: "Статус completed должен быть логическим значением" };
  }

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  const updatedTasks = tasks.map((task) => (
    task.id === id ? { ...task, completed } : task
  ));

  return { ok: true, tasks: updatedTasks };
}

export function renameTask(tasks, id, title) {
  const idResult = validateId(id);
  if (!idResult.ok) {
    return idResult;
  }

  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) {
    return titleResult;
  }

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  const updatedTasks = tasks.map((task) => (
    task.id === id ? { ...task, title: titleResult.title } : task
  ));

  return { ok: true, tasks: updatedTasks };
}

export function removeTask(tasks, id) {
  const idResult = validateId(id);
  if (!idResult.ok) {
    return idResult;
  }

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}
