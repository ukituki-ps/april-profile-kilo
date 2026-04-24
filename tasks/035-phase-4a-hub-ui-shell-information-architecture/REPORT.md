## Итог по задаче 035 (исполнение в AprilHub / `april-worker`)

- **Статус:** ✅ реализовано в репозитории [`april-worker`](https://github.com/ukituki-ps/april-worker) агентом задачи **025** (`tasks/025-aprilhub-execute-external-task-035-april-profile-1/`).
- **Коммиты в `april-worker` (локально):** `488ea51`, `1c221c4`, `18b8bf2` на ветке `feature/025-aprilhub-shell-ia-035` — см. PR после публикации в GitHub.

## Выполнение требований TASK.md (035)

1. **IA профиля:** sidebar-разделы, вложенность по смыслу (платформа vs профиль), условная видимость админ-пункта по роли `admin`; отдельный маршрут для `instanceId` (заглушка до 028).
2. **Вкладки vs маршруты:** для одной сущности — подпути `/card` и `/meta`; экземпляр — отдельный префикс `/app/profile/instances/:instanceId`.
3. **HostContext:** провайдер `HubHostContextProvider` в `hub-shell` (навигация + срез маршрута + базовые поля контракта виджета).
4. **Состояния loading/empty/error/forbidden:** через существующий `SharedState` и сценарии маршрута (403 админ-зоны, not-found).
5. **Header / breadcrumbs / back:** реализованы в каркасе карточки профиля и обзорных страниц.
6. **Confirm + toast:** `Modal` на демо-действии; `ShellToast` на успех сохранения и ошибки API.
7. **Smoke shell-уровня:** Playwright — переход с «Обзор» по ссылке «Профиль — карточка» + deep-link на hash-маршрут.
8. **Документация `april-worker`:** `docs/WIDGET_CONTRACTS.md` §8, `docs/FRONTEND_STRATEGY.md` §7, страница docs-site `task-story-035-phase-4a-hub-ui-shell-information-architecture.md`.

## Ограничения / follow-up

- Hash-router вместо `react-router-dom` из‑за ограничений окружения на установку npm-пакетов; при необходимости — вынести на общий роутер в отдельной задаче.
- Продуктовые виджеты списков/экземпляров — по дорожной карте 026/028.

## Зеркало отчёта

Полный отчёт с перечнем файлов и командами проверки:  
`april-worker/tasks/025-aprilhub-execute-external-task-035-april-profile-1/REPORT.md`
