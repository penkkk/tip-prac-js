import { validateTaskDraft } from "./src/form-validation.js";

const common = { id: "20", priority: "high" };

console.log("Проверка 1:", validateTaskDraft(
  { ...common, title: "  Изучить localStorage  " },
  [],
));
console.log("Проверка 2:", validateTaskDraft(
  { ...common, title: "   " },
  [],
));
