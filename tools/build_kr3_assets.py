from __future__ import annotations

import json
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path('/home/user/study/tip-js')
OUT = ROOT / 'report-assets'
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'


def terminal_image(path: Path, title: str, lines: list[str], *, width: int = 1200) -> None:
    font = ImageFont.truetype(FONT, 24)
    bold = ImageFont.truetype(FONT_BOLD, 25)
    line_height = 35
    wrapped: list[str] = []
    for block in lines:
        for line in block.splitlines() or ['']:
            wrapped.extend(textwrap.wrap(line, 78, replace_whitespace=False, drop_whitespace=False) or [''])
    height = 84 + line_height * len(wrapped) + 36
    image = Image.new('RGB', (width, height), '#10151c')
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, width, 58), fill='#222b36')
    draw.ellipse((22, 20, 38, 36), fill='#ff5f57')
    draw.ellipse((48, 20, 64, 36), fill='#febc2e')
    draw.ellipse((74, 20, 90, 36), fill='#28c840')
    draw.text((112, 15), title, font=bold, fill='#edf2f7')
    y = 76
    for line in wrapped:
        color = '#ff8f8f' if '400 Bad Request' in line or 'VALIDATION_ERROR' in line else '#d6e0eb'
        if '200 OK' in line or 'isLoading=false' in line:
            color = '#83e6a3'
        draw.text((28, y), line, font=font, fill=color)
        y += line_height
    image.save(path)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    terminal_image(
        OUT / 'kr3-pr8-loading-console.png',
        'DevTools Console — ПР8',
        [
            '[useTaskData] isLoading=true; tasks.length=0',
            '[useTaskData] isLoading=false; tasks.length=7',
            '',
            'Фильтр варианта 1: completed=false',
            'Первый снимок показывает начальную загрузку, второй — полученную выборку.',
        ],
    )

    completed = {
        'data': [
            {'id': 1, 'title': 'Изучить функции', 'completed': True},
            {'id': 10, 'title': 'Оформить README', 'completed': True},
            {'id': 16, 'title': 'Проверить учебный API', 'completed': True},
            {'id': 25, 'title': 'Исправить обработку ошибок', 'completed': True},
            {'id': 31, 'title': 'Сверить отчёт', 'completed': True},
        ],
        'meta': {'total': 5, 'filters': {'completed': True, 'priority': None, 'categoryId': None, 'q': ''}},
    }
    terminal_image(
        OUT / 'kr3-pr9-completed-response.png',
        'HTTP GET — ПР9',
        [
            '$ curl -i "http://127.0.0.1:5505/api/tasks?completed=true"',
            'HTTP/1.1 200 OK',
            'Content-Type: application/json; charset=utf-8',
            '',
            json.dumps(completed, ensure_ascii=False, indent=2),
        ],
    )

    invalid = {
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': 'Данные задачи не прошли проверку.',
            'details': {'title': 'Название должно содержать от 1 до 100 символов.'},
        },
    }
    terminal_image(
        OUT / 'kr3-post-validation-400.png',
        'HTTP POST — серверная валидация',
        [
            '$ curl -i -X POST http://127.0.0.1:5510/api/tasks',
            '> Content-Type: application/json',
            '> {"title":"   ","priority":"high","categoryId":2}',
            '',
            'HTTP/1.1 400 Bad Request',
            'Content-Type: application/json; charset=utf-8',
            '',
            json.dumps(invalid, ensure_ascii=False, indent=2),
        ],
    )


if __name__ == '__main__':
    main()
