import { getTaskStats } from "./task-service.js";

// Перенести реализацию ПР3 и расширить карточку действием edit.
// Здесь создаётся DOM, но не изменяются данные и localStorage.
export function createTaskElement(task) {
  // TODO: li.task-card[data-task-id], название, статус и приоритет.
  // TODO: три кнопки: toggle, edit и delete; у каждой span.action-label.
  // Название выводится через textContent. Обработчики здесь не назначаются.
  const card = document.createElement("li");
  card.className = "task-card";
  card.classList.toggle("is-completed", task.completed);
  card.dataset.taskId = String(task.id);

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;
  const status = document.createElement("p");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнена" : "В работе";
  const priority = document.createElement("p");
  priority.className = "task-priority";
  priority.textContent = ({ low: "Низкий", medium: "Средний", high: "Высокий" })[task.priority];
  const actions = document.createElement("div");
  actions.className = "task-actions";
  for (const [action, label] of [["toggle", "Выполнена"], ["edit", "Изменить"], ["delete", "Удалить"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = action;
    if (action === "toggle") button.setAttribute("aria-pressed", String(task.completed));
    const span = document.createElement("span");
    span.className = "action-label";
    span.textContent = label;
    button.append(span);
    actions.append(button);
  }
  card.append(title, status, priority, actions);
  return card;
}

export function renderTaskList(listElement, tasks) {
  listElement.replaceChildren(...tasks.map(createTaskElement));
}

export function renderSummary(summaryElement, tasks, visibleCount) {
  const stats = getTaskStats(tasks);
  for (const [name, value] of Object.entries({
    total: stats.total,
    completed: stats.completed,
    pending: stats.pending,
    progress: `${stats.progress.toFixed(1)}%`,
    visible: visibleCount,
  })) summaryElement.querySelector(`[data-stat="${name}"]`).textContent = String(value);
}

export function renderEmptyState(messageElement, total, visibleCount) {
  if (total === 0) {
    messageElement.textContent = "Список задач пуст.";
    messageElement.hidden = false;
  } else if (visibleCount === 0) {
    messageElement.textContent = "Нет задач по выбранному фильтру.";
    messageElement.hidden = false;
  } else {
    messageElement.textContent = "";
    messageElement.hidden = true;
  }
}
