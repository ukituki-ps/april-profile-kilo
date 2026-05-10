# Отчёт по задаче 078 (внешнее исполнение — DisignApril)

## Статус

Выполнено в монорепозитории **DisignApril** как задача **DS-015** (`tasks/ds-015-april-profile-task-078-mobile-shell-bar/`).

## Результат

- **Пакет:** `@ukituki-ps/april-ui` версия **0.1.10** (patch): a11y триггера встроенного поиска (`aria-expanded`), `type="button"` на кнопках поиска; расширены unit-тесты (controlled `searchExpanded` / `searchValue`, `position="absolute"`).
- **Документация DS:** `DESIGN_SYSTEM.md` §11 — уточнение MUST по `aria-expanded`; пример алиаса в `docs/PUBLISHING.md` обновлён на `^0.1.10` для UI.
- **Showcase:** правок не потребовалось — сценарий Vaul в Mobile lab уже отключает поиск при открытом листе (`shellWithSearch={!opened}`).

## Следующие шаги

1. Закоммитить и смержить изменения в **DisignApril**, опубликовать **0.1.10** в GitHub Packages (штатный workflow).
2. Поднять lock/диапазон semver у потребителей (**076/077** или micro-bump) после появления пакета в GPR.
3. Отметить чеклист в `TASK.md` этой папки при закрытии трекинга.

## Ссылка

- Постановка и отчёт DS: репозиторий `DisignApril`, ветка/PR — по факту команды; папка задачи `tasks/ds-015-april-profile-task-078-mobile-shell-bar/`.
