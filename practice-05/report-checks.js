import { createApiClient } from "./src/api-client.js";
import { createTaskApi } from "./src/task-api.js";

const client = createApiClient({
  baseUrl: "http://127.0.0.1:5505/api",
  timeoutMs: 2000,
});
const api = createTaskApi(client);

const { tasks, meta } = await api.getTasks({
  completed: false,
  priority: "high",
});
console.log("id:", tasks.map((task) => task.id));
console.log("meta.total:", meta.total);

try {
  await api.getTaskById(999);
} catch (error) {
  console.log("Ошибка 999:", { kind: error.kind, status: error.status });
}
