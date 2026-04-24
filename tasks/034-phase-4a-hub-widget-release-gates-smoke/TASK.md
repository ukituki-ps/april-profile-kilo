# Задача: Фаза 4a.5 (AprilHub) — release gates, smoke/e2e и совместимость виджетов

## Мета
- **Репозиторий выполнения:** **AprilHub** — [`april-worker`](https://github.com/ukituki-ps/april-worker).
- **ID / ветка:** (в april-worker)
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4a**, пункт **4a.5**.
- **Связанные подзадачи:** зависит от [`033-phase-4a-profile-widget-observability-semver`](../033-phase-4a-profile-widget-observability-semver/), shell-каркаса [`035-phase-4a-hub-ui-shell-information-architecture`](../035-phase-4a-hub-ui-shell-information-architecture/) и хостинговых задач [`026`](../026-phase-4a-hub-profiles-list-host-bff-flow/), [`028`](../028-phase-4a-hub-instances-host-routing-e2e/), [`030`](../030-phase-4a-hub-instance-history-host-e2e/), [`032`](../032-phase-4a-hub-conflicts-merge-host-rbac/).
- **Связанные документы:** [`docs/VERSIONING_AND_COMPATIBILITY.md`](../../docs/VERSIONING_AND_COMPATIBILITY.md), [`docs/WIDGET_OBSERVABILITY_GUIDE.md`](../../docs/WIDGET_OBSERVABILITY_GUIDE.md)

## Цель
Зафиксировать в AprilHub релизные гейты для продуктовых виджетов 4a: smoke/e2e критичных сценариев, проверка совместимости semver и контроль интеграционных рисков перед выкладкой.

## Контекст для агента
- Опора на блок **4a.5** в [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md).
- Исполнение в april-worker; здесь хранится постановка и итоговый отчёт.

## Входит в объём
- Определение минимального релизного набора smoke/e2e для виджетов 4a.
- Проверка semver-совместимости подключаемых версий `@april/profile-ui`.
- Инструкции rollback/mitigation при несовместимости или падении smoke.
- Фиксация эксплуатационного чеклиста перед релизом Hub.

## Не входит в объём
- Разработка новых UI-фич на стороне AprilProfile.
- Глубокая переработка CI april-worker вне целевого release-gate контура.

## Заглушки и внешние зависимости
- При временной недоступности отдельных стендов допускается ручной smoke с чеклистом и артефактами.
- Ручные контрольные точки: секреты CI, доступ к Keycloak и dev/stage окружениям.

## Технические ограничения
- Не пропускать релиз при красных критичных smoke/e2e без явного согласования.
- Использовать существующие механизмы CI и управления секретами в april-worker.
- Не вводить незафиксированные breaking обновления пакета виджетов.

## Критерии готовности (acceptance)
- [ ] Для виджетов 4a определен и документирован обязательный release-gate.
- [ ] Проверка semver совместимости встроена в релизный процесс Hub.
- [ ] Известные manual fallback шаги и rollback описаны.

## Проверка (команды)
```bash
# Выполняется в репозитории april-worker:
# pnpm lint
# pnpm test
# pnpm exec playwright test (release smoke набор)
# команды release-checklist по README/CI april-worker
```

## Результат в отчёте
Ссылки на PR/пайплайны april-worker, перечень релизных гейтов, список ручных fallback шагов.

## Человекопонятная история в docs-site (обязательно)
- [ ] Создана/обновлена страница `docs-site/docs/task-story-034-phase-4a-hub-widget-release-gates-smoke.md` с пометкой "исполнение в AprilHub".
- [ ] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и обновлен статус.
- [ ] Простым языком описано, какие проверки теперь обязательны перед релизом.
- [ ] Отдельно указан порядок действий при падении smoke/e2e.
- [ ] В конце страницы есть ссылки на `tasks/034-phase-4a-hub-widget-release-gates-smoke/TASK.md`, `PLAN.md` (если появится), `REPORT.md`.
