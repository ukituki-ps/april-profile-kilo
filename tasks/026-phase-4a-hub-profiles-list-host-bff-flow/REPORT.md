## 1) Итого
- Статус: ✅ выполнено
- Задача: Фаза 4a.1 (AprilHub) — хостинг виджета списка профилей через BFF/OIDC
- Репозиторий реализации: `april-worker`
- PR/коммиты: не оформлялись в рамках текущей сессии

## 2) Что сделано в AprilHub (`april-worker`)
- Добавлен отдельный host-маршрут списка профилей `/app/profile/entities` и пункт навигации `Профиль — список`.
- Встроен `ProfilesListWidget` из локального пакета AprilProfile (`../april-profile-1/frontend/packages/profile-ui/dist`) с `HostContext` (`tenant`, `auth`, `telemetry`).
- Интеграция работает через BFF-префикс `apiBaseUrl=/api/v1/admin/profile/api`.
- Добавлен callback на host-стороне для фиксации CRUD-результата (`profiles-list-last-action`).
- Расширен Playwright smoke сценарий create-операцией из списка профилей через BFF flow.
- В `run-playwright` скрипт добавлен fallback на root-user в контейнерах при `EACCES` на `hub-shell/node_modules`.
- В `run-playwright` добавлены стабилизации: ожидание `hub-bff` health напрямую, локальные `KC_HOSTNAME`/`KEYCLOAK_ISSUER`, запуск только обязательных сервисов для smoke.
- Для docker runtime добавлен mount `../april-profile-1:/april-profile-1:ro`, чтобы `hub-shell` в контейнере видел локальный пакет виджета.
- Для `hub-bff` включён workspace cache (`/workspace/.cache/go-*`) для более стабильного cold-start.
- Обновлены env/docs в `april-worker` и добавлена человекопонятная история:
  - `docs-site/docs/task-story-026-phase-4a-hub-profiles-list-host-bff-flow.md`
  - `docs-site/docs/task-stories-overview.md`

## 3) Проверки
- ✅ `cd hub-shell && npm run lint`
- ✅ `cd hub-shell && npm run test`
- ✅ `DOCS_HTTP_PORT=18080 ./scripts/run-playwright-aprilhub.sh` — успешно (`6 passed`, включая сценарий списка профилей + create через BFF).

## 4) ENV и ручные точки
- `APRIL_PROFILE_ADMIN_URL` — доступ Hub -> AprilProfile.
- `VITE_PROFILE_LIST_ENTITY_IDS` — CSV идентификаторов для начальной загрузки списка.
- `PLAYWRIGHT_USER` / `PLAYWRIGHT_PASSWORD` — доступы Keycloak для e2e.

## 5) Риски и ограничения
- До публикации пакета в registry используется локальное подключение виджета из соседнего репозитория.

## 6) Что осталось
- [x] Перезапустить e2e smoke после стабилизации ingress и зафиксировать успешный list+CRUD happy-path.
- [ ] Оформить PR/commit ссылки (после оформления коммитов/PR в `april-worker`).
