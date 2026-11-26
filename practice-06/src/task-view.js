const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

export function createTaskElement(task, category) {
  // TODO: создать li.task-card с data-task-id, текстом и тремя кнопками:
  // data-action="toggle", data-action="edit", data-action="delete".
  // Пользовательские данные добавляются только через textContent.
  const item = document.createElement("li");
  item.className = "task-card";
  item.classList.toggle("is-completed", task.completed);
  item.dataset.taskId = String(task.id);
  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;
  const status = document.createElement("p");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнена" : "В работе";
  const priority = document.createElement("p");
  priority.className = "task-priority";
  priority.textContent = PRIORITY_LABELS[task.priority];
  const categoryNode = document.createElement("p");
  categoryNode.className = "task-category";
  categoryNode.textContent = category?.name ?? "Неизвестная категория";
  const actions = document.createElement("div");
  actions.className = "task-actions";
  for (const [action, label] of [["toggle", task.completed ? "Вернуть в работу" : "Выполнить"], ["edit", "Изменить"], ["delete", "Удалить"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = action;
    const span = document.createElement("span");
    span.className = "action-label";
    span.textContent = label;
    button.append(span);
    actions.append(button);
  }
  item.append(title, status, priority, categoryNode, actions);
  return item;
}

export function renderTaskList(list, tasks, categories) {
  // TODO: сопоставить categoryId с категорией и заменить содержимое списка.
  const byId = new Map(categories.map((category) => [category.id, category]));
  list.replaceChildren(...tasks.map((task) => createTaskElement(task, byId.get(task.categoryId))));
}
