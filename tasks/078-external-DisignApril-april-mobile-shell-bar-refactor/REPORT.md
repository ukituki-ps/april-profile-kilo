# Отчёт по задаче 078 (внешнее исполнение — DisignApril)

## Статус

Выполнено в монорепозитории **DisignApril** как задача **DS-015** (`tasks/ds-015-april-profile-task-078-mobile-shell-bar/`).

## Результат

- **Пакет:** `@ukituki-ps/april-ui` версия **0.1.10** (patch): a11y триггера встроенного поиска (`aria-expanded`), `type="button"` на кнопках поиска; расширены unit-тесты (controlled `searchExpanded` / `searchValue`, `position="absolute"`).
- **Документация DS:** `DESIGN_SYSTEM.md` §11 — уточнение MUST по `aria-expanded`; пример алиаса в `docs/PUBLISHING.md` обновлён на `^0.1.10` для UI.
- **Showcase:** правок не потребовалось — сценарий Vaul в Mobile lab уже отключает поиск при открытом листе (`shellWithSearch={!opened}`).

## Статус публикации (обновлено)

- **PR:** https://github.com/ukituki-ps/DisignApril/pull/34 (merged в `main`).
- **GPR:** `@ukituki-ps/april-tokens@0.1.10`, `@ukituki-ps/april-ui@0.1.10` — workflow https://github.com/ukituki-ps/DisignApril/actions/runs/25639729831 (`both`, success).

## Следующие шаги

1. Поднять lock/диапазон semver у потребителей (**076/077** или micro-bump) при необходимости.
2. Закоммитить этот `REPORT.md` в **april-profile**.

## Ссылка

- Отчёт DS-015: `DisignApril` — `tasks/ds-015-april-profile-task-078-mobile-shell-bar/REPORT.md`.
