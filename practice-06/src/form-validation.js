const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Возвращает { valid, value, errors }.
// value содержит нормализованные title, priority и числовой categoryId.
export function validateTaskDraft(draft, categories) {
  // TODO: проверить название, приоритет и существование категории.
  // Ошибки записываются по ключам title, priority и categoryId.
  const title = typeof draft?.title === "string" ? draft.title.trim() : "";
  const priority = draft?.priority;
  const categoryId = Number(draft?.categoryId);
  const errors = {};
  if (title.length < 1 || title.length > 100) errors.title = "Название должно содержать от 1 до 100 символов.";
  if (!ALLOWED_PRIORITIES.has(priority)) errors.priority = "Выберите допустимый приоритет.";
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0
    || !categories.some((category) => category.id === categoryId)) {
    errors.categoryId = "Выберите существующую категорию.";
  }
  return {
    valid: Object.keys(errors).length === 0,
    value: { title, priority, categoryId },
    errors,
  };
}
