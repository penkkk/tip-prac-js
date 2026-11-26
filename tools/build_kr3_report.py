from __future__ import annotations

import shutil
import tempfile
from zipfile import ZIP_DEFLATED, ZipFile
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt


ROOT = Path('/home/user/study/tip-js')
SOURCE = Path('/home/user/Загрузки/КР3 ТИП (3 семестр).docx')
OUTPUT = ROOT / 'КР3_ЭФБО-01-25_ПетровА.docx'
ASSETS = ROOT / 'report-assets'


LISTINGS = {
    14: (
        'Листинг 1 — условный вывод списка и клиентская фильтрация ПР7',
        '''// TaskList.jsx
export default function TaskList({ tasks, categories, onToggle, onEdit, onDelete }) {
  return <section aria-label="Список задач">
    <h2>Задачи</h2>
    <p>Найдено: {tasks.length}.</p>
    {tasks.length === 0
      ? <p>Список задач пуст: по выбранным условиям задач нет.</p>
      : <ul>{tasks.map(task => <TaskItem
          key={task.id}
          task={task}
          categoryName={categories.find(c => c.id === task.categoryId)?.name
            ?? 'Неизвестная категория'}
          onToggle={onToggle} onEdit={onEdit} onDelete={onDelete}
        />)}</ul>}
  </section>;
}

// App.jsx
const [tasks, setTasks] = useState(() => initialTasks.map(task => ({ ...task })));
const [filters, setFilters] = useState(createInitialFilters);
const visibleTasks = selectTasks(tasks, filters);

// task-service.js: все непустые условия объединяются через И
export function selectTasks(tasks, filters) {
  const query = filters.q.trim().toLocaleLowerCase('ru-RU');
  return tasks.filter(task => {
    if (query && !task.title.toLocaleLowerCase('ru-RU').includes(query)) return false;
    if (filters.completed && task.completed !== (filters.completed === 'true')) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.categoryId && task.categoryId !== Number(filters.categoryId)) return false;
    return true;
  });
}''',
        None,
    ),
    20: (
        'Листинг 2 — ключевая асинхронная часть useTaskData ПР8',
        '''export function useTaskData({ api, filters }) {
  const [snapshot, setSnapshot] = useState({ tasks: [], categories: [], meta: { total: 0 } });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const mountedRef = useRef(false);
  const mutationControllerRef = useRef(null);
  const { q, completed, priority, categoryId } = filters;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      mutationControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setStatus('loading');
    setError(null);
    async function load() {
      try {
        const result = await api.loadInitialData(
          { q, completed, priority, categoryId }, { signal: controller.signal });
        if (!active || controller.signal.aborted) return;
        setSnapshot(result);
        setStatus('ready');
      } catch (loadError) {
        if (!active || controller.signal.aborted) return;
        setError(loadError);
        setStatus('error');
      }
    }
    void load();
    return () => { active = false; controller.abort(); };
  }, [api, q, completed, priority, categoryId, revision]);

  async function mutate(operation) {
    if (!mountedRef.current || mutationControllerRef.current) return false;
    const controller = new AbortController();
    mutationControllerRef.current = controller;
    setPending(true);
    setMutationError(null);
    try {
      await operation(controller.signal);
      if (!mountedRef.current || controller.signal.aborted) return false;
      setRevision(previous => previous + 1);
      return true;
    } catch (operationError) {
      if (mountedRef.current && !controller.signal.aborted) setMutationError(operationError);
      return false;
    } finally {
      if (mutationControllerRef.current === controller) {
        mutationControllerRef.current = null;
        if (mountedRef.current) setPending(false);
      }
    }
  }

  return {
    snapshot, status, error, mutationError, pending,
    refresh: () => setRevision(previous => previous + 1),
    saveTask: (id, value) => id === null
      ? mutate(signal => api.createTask(value, { signal }))
      : mutate(signal => api.updateTask(id, value, { signal })),
    toggleTask: task => mutate(signal =>
      api.setTaskCompleted(task.id, !task.completed, { signal })),
    deleteTask: id => mutate(signal => api.deleteTask(id, { signal })),
    resetData: () => mutate(signal => api.resetDemoData({ signal })),
  };
}''',
        None,
    ),
    26: (
        'Листинг 3 — обработка GET /api/tasks и query-параметров ПР9',
        '''// routes.js
router.get('/tasks', (req, res) => {
  const searchParams = new URL(req.originalUrl, 'http://localhost').searchParams;
  const filters = parseFilters(searchParams);
  const data = store.listTasks(filters);
  res.json({ data, meta: { total: data.length, filters } });
});

// validation.js
export function parseFilters(searchParams) {
  const allowed = new Set(['completed', 'priority', 'categoryId', 'q']);
  for (const key of searchParams.keys()) {
    if (!allowed.has(key)) throw new ApiError(400, 'INVALID_QUERY',
      `Неизвестный параметр: ${key}.`);
  }
  for (const key of allowed) {
    if (searchParams.getAll(key).length > 1) throw new ApiError(
      400, 'INVALID_QUERY', `Параметр ${key} не должен повторяться.`);
  }
  const result = { completed: null, priority: null, categoryId: null, q: '' };
  if (searchParams.has('completed')) {
    const raw = searchParams.get('completed');
    if (raw !== 'true' && raw !== 'false') throw new ApiError(
      400, 'INVALID_QUERY', 'completed должен быть true или false.');
    result.completed = raw === 'true';
  }
  // priority, categoryId и q проверяются по тем же строгим правилам.
  return result;
}

// task-service.js
export function selectTasks(tasks, filters) {
  const query = filters.q.toLocaleLowerCase('ru-RU');
  return tasks.filter(task =>
    (filters.completed === null || task.completed === filters.completed)
    && (filters.priority === null || task.priority === filters.priority)
    && (filters.categoryId === null || task.categoryId === filters.categoryId)
    && (!query || task.title.toLocaleLowerCase('ru-RU').includes(query)));
}''',
        None,
    ),
    34: (
        'Листинг 4 — серверная валидация POST /api/tasks и ответ 400',
        '''function validateTaskFields(value, { categoryIds } = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { body: 'Тело запроса должно быть JSON-объектом.' };
  }
  const errors = {};
  for (const name of ['title', 'priority', 'categoryId']) {
    if (!(name in value)) errors[name] = 'Обязательное поле.';
  }
  if ('title' in value
      && (typeof value.title !== 'string'
          || value.title.trim().length < 1
          || value.title.trim().length > 100)) {
    errors.title = 'Название должно содержать от 1 до 100 символов.';
  }
  if ('priority' in value && !PRIORITIES.has(value.priority)) {
    errors.priority = 'Приоритет должен быть low, medium или high.';
  }
  if ('categoryId' in value
      && (!Number.isSafeInteger(value.categoryId) || !categoryIds.has(value.categoryId))) {
    errors.categoryId = 'Указана неизвестная категория.';
  }
  return errors;
}

if (req.method === 'POST' && url.pathname === '/api/tasks') {
  const body = await readJsonBody(req);
  const details = validateTaskFields(body, { categoryIds });
  if (Object.keys(details).length > 0) {
    sendError(res, 400, 'VALIDATION_ERROR',
      'Данные задачи не прошли проверку.', details);
    return;
  }
  // После успешной проверки создаётся задача и возвращается 201.
}''',
        ('Серверная валидация обязательна, потому что HTML-ограничения действуют только '
         'в интерфейсе браузера и обходятся прямым HTTP-запросом. Сервер является границей '
         'доверия и должен проверять типы, обязательные поля и допустимые значения независимо от клиента.'),
    ),
}


EVIDENCE = {
    15: ('Скриншот 1 — активен фильтр «Завершённые»', ASSETS / 'kr3-pr7-completed.png', 4.5),
    21: ('Скриншот 2 — последовательность loading → ready в ПР8', ASSETS / 'kr3-pr8-loading-console.png', 6.05),
    27: ('Скриншот 3 — GET completed=true, статус 200 и пять выполненных задач', ASSETS / 'kr3-pr9-completed-response.png', 6.05),
    35: ('Скриншот 4 — невалидный title, статус 400 и VALIDATION_ERROR', ASSETS / 'kr3-post-validation-400.png', 6.05),
}


def clear_paragraph(paragraph):
    for child in list(paragraph._element):
        if child.tag != qn('w:pPr'):
            paragraph._element.remove(child)


def set_shading(paragraph, fill='F2F4F6'):
    p_pr = paragraph._p.get_or_add_pPr()
    shading = p_pr.find(qn('w:shd'))
    if shading is None:
        shading = OxmlElement('w:shd')
        p_pr.append(shading)
    shading.set(qn('w:fill'), fill)


def set_run_font(run, name, size, *, bold=False, italic=False):
    run.font.name = name
    run._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:ascii'), name)
    run._element.rPr.rFonts.set(qn('w:hAnsi'), name)
    run._element.rPr.rFonts.set(qn('w:eastAsia'), name)
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic


def fill_listing(paragraph, caption, code, explanation):
    clear_paragraph(paragraph)
    set_shading(paragraph)
    paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
    paragraph.paragraph_format.first_line_indent = Inches(0)
    paragraph.paragraph_format.left_indent = Inches(0.08)
    paragraph.paragraph_format.right_indent = Inches(0.08)
    paragraph.paragraph_format.line_spacing = 1
    paragraph.paragraph_format.space_before = Pt(4)
    paragraph.paragraph_format.space_after = Pt(6)
    paragraph.paragraph_format.keep_together = False
    title = paragraph.add_run(caption)
    set_run_font(title, 'Times New Roman', 11, bold=True)
    paragraph.add_run().add_break()
    code_run = paragraph.add_run(code)
    set_run_font(code_run, 'DejaVu Sans Mono', 7.4)
    if explanation:
        paragraph.add_run().add_break()
        paragraph.add_run().add_break()
        lead = paragraph.add_run('Пояснение. ')
        set_run_font(lead, 'Times New Roman', 10.5, bold=True)
        body = paragraph.add_run(explanation)
        set_run_font(body, 'Times New Roman', 10.5)


def fill_evidence(paragraph, caption, image_path, width):
    clear_paragraph(paragraph)
    set_shading(paragraph)
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.first_line_indent = Inches(0)
    paragraph.paragraph_format.line_spacing = 1
    paragraph.paragraph_format.space_before = Pt(4)
    paragraph.paragraph_format.space_after = Pt(7)
    paragraph.paragraph_format.keep_together = True
    title = paragraph.add_run(caption)
    set_run_font(title, 'Times New Roman', 11, bold=True)
    paragraph.add_run().add_break()
    picture = paragraph.add_run()
    picture.add_picture(str(image_path), width=Inches(width))
    for doc_pr in picture._r.xpath('.//wp:docPr'):
        doc_pr.set('descr', caption)
        doc_pr.set('title', caption)


def replace_line(paragraph, text):
    clear_paragraph(paragraph)
    run = paragraph.add_run(text)
    set_run_font(run, 'Times New Roman', 14)


def restore_preserved_parts(source, output):
    editable = {
        '[Content_Types].xml',
        'word/document.xml',
        'word/_rels/document.xml.rels',
        'word/footer1.xml',
    }
    with ZipFile(source) as source_zip, ZipFile(output) as output_zip:
        source_parts = {name: source_zip.read(name) for name in source_zip.namelist()}
        output_parts = {name: output_zip.read(name) for name in output_zip.namelist()}
    for name, payload in source_parts.items():
        if name not in editable:
            output_parts[name] = payload
    with tempfile.NamedTemporaryFile(dir=output.parent, suffix='.docx', delete=False) as handle:
        temporary = Path(handle.name)
    try:
        with ZipFile(temporary, 'w', ZIP_DEFLATED) as archive:
            for name, payload in output_parts.items():
                archive.writestr(name, payload)
        temporary.replace(output)
    finally:
        temporary.unlink(missing_ok=True)


def main():
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    for _, path, _ in EVIDENCE.values():
        if not path.exists():
            raise FileNotFoundError(path)

    shutil.copy2(SOURCE, OUTPUT)
    document = Document(OUTPUT)
    paragraphs = document.paragraphs

    replace_line(paragraphs[4], 'ФИО: Петров Артём')
    replace_line(paragraphs[5], 'Группа: ЭФБО-01-25')
    replace_line(paragraphs[6], 'Дата: 26 ноября 2026 г.')

    for index, (caption, code, explanation) in LISTINGS.items():
        fill_listing(paragraphs[index], caption, code, explanation)
    for index, (caption, image_path, width) in EVIDENCE.items():
        fill_evidence(paragraphs[index], caption, image_path, width)

    footer_paragraph = document.sections[0].footer.paragraphs[0]
    if footer_paragraph.runs and 'КР № 1' in footer_paragraph.runs[0].text:
        footer_paragraph.runs[0].text = footer_paragraph.runs[0].text.replace('КР № 1', 'КР № 3')

    document.save(OUTPUT)
    restore_preserved_parts(SOURCE, OUTPUT)
    OUTPUT.chmod(0o664)
    print(OUTPUT)


if __name__ == '__main__':
    main()
