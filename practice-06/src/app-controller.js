import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

// view — адаптер из dom-app.js. Контроллер не должен обращаться к document.
// Обязательные методы результата:
// start, applyFilters, refresh, submit, beginEdit, cancelEdit,
// toggleTask, deleteTask, resetData и destroy.
export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  // TODO:
  // 1. Хранить текущие tasks, categories, filters и editingId.
  // 2. При загрузке показывать loading, затем ready/empty или error.
  // 3. Перед новой загрузкой отменять предыдущую через AbortController.
  // 4. Не позволять устаревшему ответу изменить интерфейс.
  // 5. После успешной мутации повторно запросить список с текущими фильтрами.
  // 6. Ошибку отменённого запроса не показывать пользователю.
  // 7. Если категории ещё не были получены, retry снова выполняет начальную загрузку.
  const apiMethods = ["loadInitialData", "getTasks", "createTask", "updateTask", "setTaskCompleted", "deleteTask", "resetDemoData"];
  const viewMethods = ["setListState", "setTasks", "setCategories", "setTotal", "setFormTask", "showFormErrors", "setMutationPending", "notify"];
  if (!api || apiMethods.some((name) => typeof api[name] !== "function")
    || !view || viewMethods.some((name) => typeof view[name] !== "function")
    || typeof validateDraft !== "function") throw new TypeError("Некорректные зависимости контроллера.");

  let tasks = [];
  let categories = [];
  let filters = {};
  let editingId = null;
  let loadController = null;
  let loadVersion = 0;
  let destroyed = false;

  async function load() {
    if (destroyed) return;
    loadController?.abort();
    loadController = new AbortController();
    const version = ++loadVersion;
    view.setListState("loading");
    try {
      let result;
      if (categories.length === 0) {
        result = await api.loadInitialData(filters, { signal: loadController.signal });
      } else {
        result = await api.getTasks(filters, { signal: loadController.signal });
      }
      if (destroyed || version !== loadVersion) return;
      if (result.categories) {
        categories = result.categories;
        view.setCategories(categories);
      }
      tasks = result.tasks;
      view.setTasks(tasks, categories);
      view.setTotal(result.meta.total);
      view.setListState(tasks.length === 0 ? "empty" : "ready");
    } catch (error) {
      if (destroyed || version !== loadVersion || (error instanceof ApiError && error.kind === "aborted")) return;
      view.setListState("error", messageForError(error));
    }
  }

  async function mutate(action, successMessage, { clearForm = false } = {}) {
    view.setMutationPending(true);
    view.notify("");
    try {
      await action();
      if (clearForm) {
        editingId = null;
        view.setFormTask(null);
        view.showFormErrors({});
      }
      await load();
      view.notify(successMessage, "success");
      return true;
    } catch (error) {
      view.notify(messageForError(error), "error");
      return false;
    } finally {
      view.setMutationPending(false);
    }
  }

  function matchesCurrentFilters(task) {
    if ("completed" in filters && task.completed !== filters.completed) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.categoryId && task.categoryId !== filters.categoryId) return false;
    if (filters.q && !task.title.toLocaleLowerCase("ru").includes(filters.q.toLocaleLowerCase("ru"))) return false;
    return true;
  }

  return {
    async start(initialFilters = {}) {
      filters = { ...initialFilters };
      view.setFormTask(null);
      await load();
    },
    async applyFilters(nextFilters = {}) {
      filters = { ...nextFilters };
      await load();
    },
    async refresh() { await load(); },
    async submit(draft) {
      const checked = validateDraft(draft, categories);
      view.showFormErrors(checked.errors);
      if (!checked.valid) return false;
      if (editingId === null) {
        return mutate(async () => {
          const created = await api.createTask(checked.value);
          // POST уже подтвердил запись на сервере. Показываем подтверждённую задачу
          // сразу, затем обычный повторный GET синхронизирует весь список.
          if (matchesCurrentFilters(created) && !tasks.some((task) => task.id === created.id)) {
            tasks = [...tasks, created];
            view.setTasks(tasks, categories);
            view.setTotal(tasks.length);
            view.setListState("ready");
          }
          return created;
        }, "Задача добавлена.", { clearForm: true });
      }
      const id = editingId;
      return mutate(() => api.updateTask(id, checked.value), "Изменения сохранены.", { clearForm: true });
    },
    beginEdit(id) {
      const task = tasks.find((item) => item.id === id);
      if (!task) {
        view.notify("Задача не найдена в текущем списке.", "error");
        return false;
      }
      editingId = id;
      view.showFormErrors({});
      view.setFormTask(task);
      return true;
    },
    cancelEdit() {
      editingId = null;
      view.showFormErrors({});
      view.setFormTask(null);
    },
    async toggleTask(id) {
      const task = tasks.find((item) => item.id === id);
      if (!task) {
        view.notify("Задача не найдена в текущем списке.", "error");
        return false;
      }
      return mutate(() => api.setTaskCompleted(id, !task.completed), "Статус задачи изменён.");
    },
    async deleteTask(id) {
      return mutate(() => api.deleteTask(id), "Задача удалена.");
    },
    async resetData() {
      return mutate(() => api.resetDemoData(), "Исходные данные восстановлены.", { clearForm: true });
    },
    destroy() {
      destroyed = true;
      loadVersion += 1;
      loadController?.abort();
    },
  };
}
