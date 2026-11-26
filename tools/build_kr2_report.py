from __future__ import annotations

import shutil
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt


ROOT = Path("/home/user/study/tip-js")
SOURCE = Path("/home/user/Загрузки/КР2 ТИП (3 семестр).docx")
OUTPUT = ROOT / "КР2_ЭФБО-01-25_ПетровА.docx"
ASSETS = ROOT / "report-assets"


LISTINGS = {
    16: (
        "Листинг 1 — нормализация и проверка названия задачи",
        """export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  const id = editingId === null ? Number(draft.id) : editingId;
  const title = typeof draft.title === \"string\" ? draft.title.trim() : \"\";
  const priority = draft.priority;

  // Остальные проверки полей id и priority опущены.
  if (typeof draft.title !== \"string\" || title.length < 1 || title.length > 100) {
    errors.title = \"Название должно содержать от 1 до 100 символов.\";
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, value: { id, title, priority } };
}

const common = { id: \"20\", priority: \"high\" };
console.log(validateTaskDraft({ ...common, title: \"  Изучить localStorage  \" }, []));
console.log(validateTaskDraft({ ...common, title: \"   \" }, []));""",
    ),
    22: (
        "Листинг 2 — чтение и запись localStorage, точки вызова",
        """export function loadTasks(storage, key, fallbackTasks) {
  const fallback = fallbackTasks.map((task) => ({ ...task }));
  try {
    const raw = storage.getItem(key);
    if (raw === null) return { ok: true, source: \"initial\", tasks: fallback };
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== STORAGE_VERSION || !isValidTaskList(parsed.tasks)) {
      return { ok: false, source: \"fallback\", tasks: fallback,
        error: \"Сохранённые данные имеют неверный формат.\" };
    }
    return { ok: true, source: \"storage\",
      tasks: parsed.tasks.map((task) => ({ ...task })) };
  } catch (error) {
    return { ok: false, source: \"fallback\", tasks: fallback,
      error: `Не удалось прочитать localStorage: ${error.message}` };
  }
}

export function saveTasks(storage, key, tasks) {
  if (!isValidTaskList(tasks)) return { ok: false,
    error: \"Список задач имеет неверный формат.\" };
  try {
    storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось сохранить данные: ${error.message}` };
  }
}

loaded = loadTasks(window.localStorage, storageKey, initialTasks);
const saved = saveTasks(window.localStorage, storageKey, currentTasks);""",
    ),
    29: (
        "Листинг 3 — фильтрация через GET /tasks",
        """export function createTaskApi(client) {
  async function getTasks(filters = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson(\"/tasks\", { query });
    if (!payload || !Array.isArray(payload.data) || !payload.data.every(isTask)
      || payload.meta.total !== payload.data.length) {
      throw invalidResponse(\"Ответ списка задач не соответствует контракту.\");
    }
    return { tasks: payload.data, meta: payload.meta };
  }
  return { getTasks };
}

const client = createApiClient({
  baseUrl: \"http://localhost:3000\",
  timeoutMs: 2000,
});
const api = createTaskApi(client);
const result = await api.getTasks({ completed: false, priority: \"high\" });
console.log(result.tasks.map((task) => task.id)); // [4, 13, 34]
console.log(result.meta.total);                  // 3""",
    ),
    35: (
        "Листинг 4 — явная обработка HTTP-ошибки",
        """if (!response.ok) {
  let payload = null;
  if (response.headers.get(\"content-type\")?.includes(\"application/json\")) {
    payload = await response.json();
  }
  const apiError = payload?.error;
  throw new ApiError(apiError?.message ?? `HTTP ${response.status}`, {
    kind: \"http\",
    status: response.status,
    code: apiError?.code ?? null,
    details: apiError?.details ?? null,
    url,
  });
}

const api = createTaskApi(createApiClient({
  baseUrl: \"http://localhost:3000\",
}));
try {
  await api.getTaskById(999);
} catch (error) {
  console.log({ kind: error.kind, status: error.status });
  // { kind: \"http\", status: 404 }
}""",
    ),
    42: (
        "Листинг 5 — изменение completed и повторная загрузка",
        """async function setTaskCompleted(id, completed, options = {}) {
  if (typeof completed !== \"boolean\") {
    throw new TypeError(\"completed должен быть boolean.\");
  }
  return updateTask(id, { completed }, options);
}

async function updateTask(id, changes, options = {}) {
  return readTask(await client.requestJson(`/tasks/${id}`, {
    method: \"PATCH\",
    body: changes,
    ...signalOption(options),
  }));
}

async function toggleTask(id) {
  const task = tasks.find((item) => item.id === id);
  return mutate(
    () => api.setTaskCompleted(id, !task.completed),
    \"Статус задачи изменён.\",
  );
}

// mutate() вызывает load(), а load() повторяет GET с текущими фильтрами:
result = await api.getTasks(filters, { signal: loadController.signal });""",
    ),
}


EVIDENCE = {
    17: (
        "Скриншот 1 — два результата validateTaskDraft",
        ASSETS / "validation-results.png",
        None,
    ),
    23: (
        "Скриншот 2 — задача id 20 после перезагрузки и запись localStorage",
        ASSETS / "pr4-storage-evidence.png",
        None,
    ),
    30: (
        "Скриншот 3 — ids [4, 13, 34] и meta.total = 3",
        ASSETS / "api-filter-results.png",
        None,
    ),
    36: (
        "Скриншот 4 — ApiError с kind = http и status = 404",
        ASSETS / "http-error-results.png",
        "fetch отклоняет Promise только при сетевом сбое или отмене, поэтому HTTP-статус проверяется через response.ok явно.",
    ),
    43: (
        "Скриншот 5 — PATCH /tasks/4 → 200 и повторный GET completed=false",
        ASSETS / "pr6-network-evidence.png",
        "После успешного PATCH задача 4 получила completed = true и исчезла из списка, отфильтрованного по completed = false.",
    ),
}


def clear_paragraph(paragraph):
    element = paragraph._element
    for child in list(element):
        if child.tag != qn("w:pPr"):
            element.remove(child)


def set_cell_shading(paragraph, fill="F2F4F6"):
    p_pr = paragraph._p.get_or_add_pPr()
    shading = p_pr.find(qn("w:shd"))
    if shading is None:
        shading = OxmlElement("w:shd")
        p_pr.append(shading)
    shading.set(qn("w:fill"), fill)


def add_caption(paragraph, caption):
    run = paragraph.add_run(caption)
    run.bold = True
    run.italic = False
    run.font.name = "Times New Roman"
    run.font.size = Pt(11)
    return run


def fill_listing(paragraph, caption, code):
    clear_paragraph(paragraph)
    set_cell_shading(paragraph)
    paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
    paragraph.paragraph_format.line_spacing = 1
    paragraph.paragraph_format.space_before = Pt(4)
    paragraph.paragraph_format.space_after = Pt(4)
    paragraph.paragraph_format.keep_together = False
    add_caption(paragraph, caption)
    paragraph.add_run().add_break()
    run = paragraph.add_run(code)
    run.font.name = "DejaVu Sans Mono"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "DejaVu Sans Mono")
    run.font.size = Pt(7.6)
    run.italic = False


def fill_evidence(paragraph, caption, image_path, explanation):
    clear_paragraph(paragraph)
    set_cell_shading(paragraph)
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.line_spacing = 1
    paragraph.paragraph_format.space_before = Pt(4)
    paragraph.paragraph_format.space_after = Pt(6)
    add_caption(paragraph, caption)
    paragraph.add_run().add_break()
    picture = paragraph.add_run()
    picture.add_picture(str(image_path), width=Inches(6.05))
    for doc_pr in picture._r.xpath(".//wp:docPr"):
        doc_pr.set("descr", caption)
        doc_pr.set("title", caption)
    if explanation:
        paragraph.add_run().add_break()
        explanation_run = paragraph.add_run(explanation)
        explanation_run.font.name = "Times New Roman"
        explanation_run.font.size = Pt(10.5)
        explanation_run.italic = False


def main():
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    for _, image_path, _ in EVIDENCE.values():
        if not image_path.exists():
            raise FileNotFoundError(image_path)

    shutil.copy2(SOURCE, OUTPUT)
    document = Document(OUTPUT)
    paragraphs = document.paragraphs

    identity = {
        5: "ФИО: Артём Петров",
        6: "Группа: ЭФБО-01-25",
        7: "Дата: 26.11.2026",
    }
    for index, value in identity.items():
        paragraph = paragraphs[index]
        clear_paragraph(paragraph)
        run = paragraph.add_run(value)
        run.font.name = "Times New Roman"
        run.font.size = Pt(14)

    for index, (caption, code) in LISTINGS.items():
        fill_listing(paragraphs[index], caption, code)

    for index, (caption, image_path, explanation) in EVIDENCE.items():
        fill_evidence(paragraphs[index], caption, image_path, explanation)

    document.core_properties.title = "Контрольная работа № 2 — практические работы 4–6"
    document.core_properties.subject = "Формы, хранение данных и API"
    document.core_properties.author = "Артём Петров"
    document.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()
