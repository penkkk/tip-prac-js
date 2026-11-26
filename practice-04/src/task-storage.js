export const STORAGE_VERSION = 1;

// Все функции принимают объект storage явно, чтобы их можно было проверить
// без обращения к глобальному window.localStorage.

export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;
  const ids = new Set();
  for (const task of value) {
    if (!task || typeof task !== "object"
      || !Number.isSafeInteger(task.id) || task.id <= 0 || ids.has(task.id)
      || typeof task.title !== "string" || task.title.trim().length < 1
      || task.title.trim().length > 100 || task.title !== task.title.trim()
      || typeof task.completed !== "boolean"
      || !["low", "medium", "high"].includes(task.priority)) return false;
    ids.add(task.id);
  }
  return true;
}

export function loadTasks(storage, key, fallbackTasks) {
  // TODO: прочитать строку, разобрать объект { version, tasks }, проверить данные.
  // Нет записи: { ok: true, source: "initial", tasks: копия fallbackTasks }.
  // Есть корректная запись: { ok: true, source: "storage", tasks: новая копия }.
  // Ошибка чтения, JSON или схемы: { ok: false, source: "fallback",
  // tasks: копия fallbackTasks, error: "понятное сообщение" }.
  const fallback = fallbackTasks.map((task) => ({ ...task }));
  try {
    const raw = storage.getItem(key);
    if (raw === null) return { ok: true, source: "initial", tasks: fallback };
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== STORAGE_VERSION || !isValidTaskList(parsed.tasks)) {
      return { ok: false, source: "fallback", tasks: fallback, error: "Сохранённые данные имеют неверный формат." };
    }
    return { ok: true, source: "storage", tasks: parsed.tasks.map((task) => ({ ...task })) };
  } catch (error) {
    return { ok: false, source: "fallback", tasks: fallback, error: `Не удалось прочитать localStorage: ${error.message}` };
  }
}

export function saveTasks(storage, key, tasks) {
  // TODO: проверить задачи и сохранить JSON.stringify({ version, tasks }).
  // Вернуть { ok: true } либо { ok: false, error: "..." }; исключение не выпускать.
  if (!isValidTaskList(tasks)) return { ok: false, error: "Список задач имеет неверный формат." };
  try {
    storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось сохранить данные: ${error.message}` };
  }
}

export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось удалить сохранённые данные: ${error.message}` };
  }
}
