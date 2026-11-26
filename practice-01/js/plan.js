"use strict";

// Вариант 1.
const totalTasks = 12;
const completedTasks = 5;
const dailyLimit = 3;

console.log(
  `Входные данные: totalTasks = ${String(totalTasks)}, completedTasks = ${String(completedTasks)}, dailyLimit = ${String(dailyLimit)}`,
);

if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  console.log("Ошибка: количество задач должно быть задано целыми числами.");
} else if (totalTasks < 0 || completedTasks < 0) {
  console.log("Ошибка: количество задач не может быть отрицательным.");
} else if (totalTasks > 1000 || completedTasks > 1000) {
  console.log("Ошибка: количество задач не может превышать 1000.");
} else if (completedTasks > totalTasks) {
  console.log("Ошибка: выполнено больше задач, чем существует.");
} else if (!Number.isInteger(dailyLimit)) {
  console.log("Ошибка: дневной лимит должен быть задан целым числом.");
} else if (dailyLimit < 1 || dailyLimit > 1000) {
  console.log("Ошибка: дневной лимит должен быть от 1 до 1000.");
} else {
  let remainingTasks = totalTasks - completedTasks;
  let day = 0;

  console.log(`Осталось задач: ${remainingTasks}`);

  if (remainingTasks === 0) {
    console.log("Все задачи уже выполнены");
  }

  while (remainingTasks > 0) {
    day += 1;
    const tasksForDay = Math.min(dailyLimit, remainingTasks);
    remainingTasks -= tasksForDay;
    console.log(`День ${day}: выполнено ${tasksForDay}, осталось ${remainingTasks}`);
  }

  console.log(`Потребуется дней: ${day}`);
}
