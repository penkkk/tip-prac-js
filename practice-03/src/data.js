// Общий контрольный набор. Для своего варианта ниже предусмотрен отдельный массив.
// Идентификатор задачи не совпадает с её индексом в массиве.
export const demoTasks = [
  { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
  { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
  { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
  { id: 10, title: "Оформить README", completed: true, priority: "medium" },
];

// Вариант 1: подготовка учебного проекта. Изначально выполнено 0 задач.
export const variantNumber = 1;
export const variantTasks = [
  { id: 11, title: "Определить требования проекта", completed: false, priority: "medium" },
  { id: 23, title: "Спланировать структуру проекта", completed: false, priority: "high" },
  { id: 37, title: "Настроить репозиторий", completed: false, priority: "low" },
  { id: 41, title: "Реализовать основной модуль", completed: false, priority: "high" },
  { id: 58, title: "Подготовить проверки", completed: false, priority: "medium" },
  { id: 64, title: "Оформить отчёт", completed: false, priority: "low" },
];
