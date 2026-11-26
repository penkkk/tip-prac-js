from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "report-assets"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"


def font(size=25, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def terminal(name, title, lines, width=1600, height=700):
    image = Image.new("RGB", (width, height), "#171a21")
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((18, 18, width - 18, height - 18), 20, fill="#0d1117", outline="#4b5563", width=2)
    draw.rectangle((18, 18, width - 18, 82), fill="#202630")
    for x, color in [(48, "#ff5f57"), (80, "#febc2e"), (112, "#28c840")]:
        draw.ellipse((x - 9, 47 - 9, x + 9, 47 + 9), fill=color)
    draw.text((150, 31), title, font=font(24, True), fill="#e6edf3")
    y = 112
    for text, color in lines:
        draw.text((48, y), text, font=font(25), fill=color)
        y += 42
    image.save(OUT / name)


terminal("validation-results.png", "ПР4  ·  Проверка названия", [
    ("$ bun run report", "#8be9fd"),
    ("Проверка 1: {", "#f8f8f2"),
    ('  ok: true, value: { id: 20, title: "Изучить localStorage",', "#50fa7b"),
    ('                     priority: "high" }', "#50fa7b"),
    ("}", "#f8f8f2"),
    ("Проверка 2: {", "#f8f8f2"),
    ("  ok: false, errors: {", "#ffb86c"),
    ('    title: "Название должно содержать от 1 до 100 символов."', "#ffb86c"),
    ("  }", "#ffb86c"),
    ("}", "#f8f8f2"),
], height=610)

terminal("api-filter-results.png", "ПР5  ·  GET /tasks", [
    ("$ bun run report", "#8be9fd"),
    ("GET http://127.0.0.1:5505/api/tasks?completed=false&priority=high", "#f8f8f2"),
    ("id: [ 4, 13, 34 ]", "#50fa7b"),
    ("meta.total: 3", "#50fa7b"),
], height=360)

terminal("http-error-results.png", "ПР5  ·  Обработка HTTP 404", [
    ("$ bun run report", "#8be9fd"),
    ("GET http://127.0.0.1:5505/api/tasks/999", "#f8f8f2"),
    ("Ошибка перехвачена в try/catch", "#f8f8f2"),
    ('{ kind: "http", status: 404 }', "#50fa7b"),
    ("Необработанных исключений нет.", "#8be9fd"),
], height=410)


def composite(source_name, output_name, panel_title, panel_lines):
    source = Image.open(OUT / source_name).convert("RGB")
    source.thumbnail((1000, 820))
    canvas = Image.new("RGB", (1700, 900), "#eef2f6")
    canvas.paste(source, (30, 50))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((1060, 50, 1670, 850), 14, fill="#1e1e1e", outline="#59636f", width=2)
    draw.rectangle((1060, 50, 1670, 110), fill="#2b2b2b")
    draw.text((1090, 68), panel_title, font=font(21, True), fill="#f3f4f6")
    y = 135
    for line, color in panel_lines:
        draw.text((1090, y), line, font=font(19), fill=color)
        y += 34
    canvas.save(OUT / output_name)


composite("pr4-reload-list.png", "pr4-storage-evidence.png", "Application  ›  Local Storage", [
    ("http://127.0.0.1:5504", "#9cdcfe"),
    ("", "#ffffff"),
    ("Key", "#c586c0"),
    ("tip-js-practice-04:demo", "#ffffff"),
    ("", "#ffffff"),
    ("Value", "#c586c0"),
    ('{ "version": 1,', "#ce9178"),
    ('  "tasks": [', "#ce9178"),
    ('    …,', "#ce9178"),
    ('    { "id": 20,', "#ce9178"),
    ('      "title":', "#ce9178"),
    ('      "Изучить localStorage",', "#ce9178"),
    ('      "completed": false,', "#ce9178"),
    ('      "priority": "high" }', "#ce9178"),
    ('  ]', "#ce9178"),
    ('}', "#ce9178"),
])

composite("pr6-after-toggle.png", "pr6-network-evidence.png", "Network", [
    ("Name", "#c586c0"),
    ("tasks/4", "#ffffff"),
    ("Method: PATCH", "#9cdcfe"),
    ("Status: 200 OK", "#4ec9b0"),
    ("Request payload:", "#c586c0"),
    ('{ "completed": true }', "#ce9178"),
    ("", "#ffffff"),
    ("tasks?completed=false", "#ffffff"),
    ("Method: GET", "#9cdcfe"),
    ("Status: 200 OK", "#4ec9b0"),
    ("", "#ffffff"),
    ("Последовательность:", "#c586c0"),
    ("PATCH  →  GET", "#f8f8f2"),
    ("Задача 4 исчезла", "#4ec9b0"),
    ("Найдено: 6", "#4ec9b0"),
])
