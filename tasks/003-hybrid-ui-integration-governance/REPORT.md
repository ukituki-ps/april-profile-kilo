## 1) Итого

- Статус: ✅ выполнено
- Задача: Документировать гибридную UI-архитектуру (Host + Widgets + API/BFF-first) и ввести governance-артефакты
- Ветка: `feature/003-hybrid-ui-integration-governance`
- Коммиты: основной документационный — `084a6cf`; дальнейшие коммиты на ветке — только уточнения `REPORT.md` (см. `git log feature/003-hybrid-ui-integration-governance`)
- PR: не создавался (merge в `develop` через PR по политике репозитория)

## 2) Что сделано

- [docs] Добавлен **ADR-0004** (`docs/adr/0004-hybrid-ui-integration-model.md`, slug на сайте `/adr/hybrid-ui-integration-model`): контекст, три режима, trade-offs, migration/rollback, ссылки на контракты и стратегию.
- [docs] Созданы **контракты и governance**: `docs/WIDGET_CONTRACTS.md`, `DECISION_MATRIX_UI_INTEGRATION.md`, `VERSIONING_AND_COMPATIBILITY.md`, `WIDGET_RELEASE_CHECKLIST.md`, `WIDGET_INTEGRATION_CHECKLIST.md`, `WIDGET_OBSERVABILITY_GUIDE.md`.
- [docs] Добавлены **шаблоны**: `docs/templates/WIDGET_SPEC_TEMPLATE.md`, `HOST_INTEGRATION_SPEC_TEMPLATE.md`, `WIDGET_CHANGELOG_TEMPLATE.md`.
- [docs] Обновлены **стратегический roadmap** (`tasks/000-full-service-aprilhub-roadmap/PLAN.md`): три модели, сжатая матрица, фазирование внедрения; **FRONTEND_STRATEGY** и зеркало Docusaurus — три модели, границы DS/domain/host, HostContext/events/versioning, перекрёстные ссылки.
- [docs] **Индексация**: `README.md`, `docs-site/docs/intro.md`, страница `docs-site/docs/ui-integration-governance.md`; `docs/adr/README.md`; `task_list.md` с отметкой выполнения и ссылкой на отчёт.

## 3) Принятые правила (кратко)

- Три равноправных режима: **Host-driven**, **Widget-driven**, **API/BFF-first**; выбор по матрице (`DECISION_MATRIX_UI_INTEGRATION.md`).
- **DS** без доменной логики; домен в **`@april/*-ui`**; **host** владеет навигацией и страничным state; виджет эмитит **intent/events**, не глобальный роутер.
- **HostContext v1** и **Widget Props/Events v1** зафиксированы в `WIDGET_CONTRACTS.md`; semver и матрица host × widget — в `VERSIONING_AND_COMPATIBILITY.md`.
- Telemetry: минимум `requestId` в `HostContext.telemetry` и цепочке BFF (`WIDGET_OBSERVABILITY_GUIDE.md`).

## 4) Decision matrix (сжато)

| Сигнал | Режим |
|--------|--------|
| Одинаковый UX в ≥2 местах / репозиториях | Widget-driven |
| Уникальный оркестрационный экран, сложная IA | Host-driven |
| Ранний этап, нет виджета, достаточно API | API/BFF-first → при стабилизации UX возможна миграция к виджету |

## 5) Изменённые и созданные файлы

- `docs/adr/0004-hybrid-ui-integration-model.md`
- `docs/adr/README.md`
- `docs/WIDGET_CONTRACTS.md`
- `docs/DECISION_MATRIX_UI_INTEGRATION.md`
- `docs/VERSIONING_AND_COMPATIBILITY.md`
- `docs/WIDGET_RELEASE_CHECKLIST.md`
- `docs/WIDGET_INTEGRATION_CHECKLIST.md`
- `docs/WIDGET_OBSERVABILITY_GUIDE.md`
- `docs/templates/WIDGET_SPEC_TEMPLATE.md`
- `docs/templates/HOST_INTEGRATION_SPEC_TEMPLATE.md`
- `docs/templates/WIDGET_CHANGELOG_TEMPLATE.md`
- `docs/FRONTEND_STRATEGY.md`
- `docs-site/docs/frontend-strategy.md`
- `docs-site/docs/ui-integration-governance.md`
- `docs-site/docs/widget-contracts.md`
- `docs-site/docs/decision-matrix-ui-integration.md`
- `docs-site/docs/versioning-and-compatibility.md`
- `docs-site/docs/widget-release-checklist.md`
- `docs-site/docs/widget-integration-checklist.md`
- `docs-site/docs/widget-observability-guide.md`
- `docs-site/docs/intro.md`
- `tasks/000-full-service-aprilhub-roadmap/PLAN.md`
- `README.md`
- `task_list.md`
- `tasks/003-hybrid-ui-integration-governance/PLAN.md`
- `tasks/003-hybrid-ui-integration-governance/REPORT.md`

## 6) Миграции и данные

- Миграции Atlas: нет

## 7) Проверка качества

- Линтер: не запускался отдельно для markdown
- Сборка: **ok** — `make docs-build`
- Unit / integration / E2E: не применялось (документация)

Команды:

```bash
make docs-build
```

## 8) Деплой

- Среда: нет
- Rollback: нет

## 9) Риски и ограничения

- Шаблоны и часть ссылок в `docs/` используют относительные пути к `.md`; на сайте Docusaurus ADR ссылается на маршруты `/docs/...`. При правках ADR сохранять согласованность slug (`hybrid-ui-integration-model`).

## 10) Открытые вопросы

- Точные имена и первый semver `@april/profile-ui` при появлении пайплайна публикации.
- Нужен ли отдельный ADR при внедрении Module Federation (доставка бандла), если контракты props/events не меняются.

## 11) Следующий шаг (пилот widget v1)

- Реализовать один виджет (например карточка профиля сущности) с `HostContext`, `onSaveSuccess` / `onError`, прокидыванием `requestId`; интеграционная спецификация по `HOST_INTEGRATION_SPEC_TEMPLATE.md`; smoke в Hub и проверка чеклистов релиза/интеграции.
