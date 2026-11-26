import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";

function printStats(label, tasks) {
  const { total, completed, pending, progress } = getTaskStats(tasks);
  console.log(`\n${label}`);
  console.log(`Всего: ${total}; выполнено: ${completed}; осталось: ${pending}`);

  if (total === 0) {
    console.log("Задач пока нет");
  } else {
    console.log(`Прогресс: ${progress.toFixed(1)}%`);
  }
}

function useResult(label, currentTasks, result) {
  if (!result.ok) {
    console.error(`${label}. Ошибка: ${result.error}`);
    return currentTasks;
  }

  console.log(`${label}: выполнено`);
  return result.tasks;
}

console.log("ПР2. Общий демонстрационный сценарий");
console.table(demoTasks);
console.log("Названия:", getTaskTitles(demoTasks));
console.log("Невыполненные id:", getPendingTasks(demoTasks).map((task) => task.id));

const demoSnapshot = JSON.stringify(demoTasks);
let currentTasks = demoTasks;
printStats("Исходный набор", currentTasks);

currentTasks = useResult(
  "Добавление id = 20",
  currentTasks,
  addTask(currentTasks, 20, "Добавить проверку", "high"),
);
printStats("После добавления id = 20", currentTasks);

currentTasks = useResult(
  "Выполнение id = 4",
  currentTasks,
  setTaskCompleted(currentTasks, 4, true),
);
printStats("После выполнения id = 4", currentTasks);

currentTasks = useResult(
  "Переименование id = 10",
  currentTasks,
  renameTask(currentTasks, 10, "Подготовить инструкцию запуска"),
);
printStats("После переименования id = 10", currentTasks);

currentTasks = useResult(
  "Удаление id = 7",
  currentTasks,
  removeTask(currentTasks, 7),
);
printStats("После удаления id = 7", currentTasks);

currentTasks = useResult(
  "Повторное добавление id = 20",
  currentTasks,
  addTask(currentTasks, 20, "Дубликат", "low"),
);

console.log("Итоговые id:", currentTasks.map((task) => task.id));
console.log("Название id = 10:", findTaskById(currentTasks, 10).title);
console.log("demoTasks сохранён:", JSON.stringify(demoTasks) === demoSnapshot);

console.log(`\nПР2. Индивидуальный сценарий, вариант ${variantNumber}`);
console.table(variantTasks);

const variantSnapshot = JSON.stringify(variantTasks);
let variantCurrentTasks = variantTasks;
printStats("Исходный набор варианта", variantCurrentTasks);

variantCurrentTasks = useResult(
  "Добавление id = 80",
  variantCurrentTasks,
  addTask(variantCurrentTasks, 80, "Подготовить демонстрацию проекта", "high"),
);
printStats("После добавления id = 80", variantCurrentTasks);

variantCurrentTasks = useResult(
  "Выполнение id = 11",
  variantCurrentTasks,
  setTaskCompleted(variantCurrentTasks, 11, true),
);
printStats("После выполнения id = 11", variantCurrentTasks);

variantCurrentTasks = useResult(
  "Переименование id = 23",
  variantCurrentTasks,
  renameTask(variantCurrentTasks, 23, "Уточнить структуру учебного проекта"),
);
printStats("После переименования id = 23", variantCurrentTasks);

variantCurrentTasks = useResult(
  "Удаление id = 37",
  variantCurrentTasks,
  removeTask(variantCurrentTasks, 37),
);
printStats("После удаления id = 37", variantCurrentTasks);

variantCurrentTasks = useResult(
  "Повторное добавление id = 80",
  variantCurrentTasks,
  addTask(variantCurrentTasks, 80, "Повторная задача", "high"),
);

console.log("Итоговые id варианта:", variantCurrentTasks.map((task) => task.id));
printStats("Итоговая сводка варианта", variantCurrentTasks);
console.log("variantTasks сохранён:", JSON.stringify(variantTasks) === variantSnapshot);
