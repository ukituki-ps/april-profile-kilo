# Задача: Фаза 4a.5 (AprilProfile) — observability-события виджетов и semver readiness

## Мета
- **ID / ветка:** (например `feat/phase-4a-widget-observability-semver`)
- **Приоритет:** обычный
- **Родительская дорожная карта:** [`tasks/000-full-service-aprilhub-roadmap/`](../000-full-service-aprilhub-roadmap/) — [`PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md), **Фаза 4a**, пункт **4a.5**.
- **Связанные подзадачи:** зависит от реализации продуктовых виджетов [`025`](../025-phase-4a-profile-profiles-list-crud-widget/), [`027`](../027-phase-4a-profile-instances-crud-widget/), [`029`](../029-phase-4a-profile-instance-history-widget/), [`031`](../031-phase-4a-profile-conflicts-merge-admin-ui/); Hub-интеграция качества — [`034-phase-4a-hub-widget-release-gates-smoke`](../034-phase-4a-hub-widget-release-gates-smoke/).
- **Связанные документы:** [`docs/WIDGET_OBSERVABILITY_GUIDE.md`](../../docs/WIDGET_OBSERVABILITY_GUIDE.md), [`docs/VERSIONING_AND_COMPATIBILITY.md`](../../docs/VERSIONING_AND_COMPATIBILITY.md)

## Цель
Унифицировать события наблюдаемости в `@april/profile-ui` и зафиксировать semver-правила для релизов виджетов, чтобы Hub и Profile имели предсказуемый процесс обновления без скрытых breaking изменений.

## Контекст для агента
- Опора на блок **4a.5** в [`../000-full-service-aprilhub-roadmap/PLAN.md`](../000-full-service-aprilhub-roadmap/PLAN.md).
- Задача охватывает сторону AprilProfile (события виджетов, документация версии/совместимости).

## Входит в объём
- Единый набор событий (`view_loaded`, `save_submitted`, `save_succeeded`, `save_failed`) для виджетов 4a.
- Привязка событий к `request_id/correlation_id`, доступным в существующем контуре.
- Описание semver политики пакета виджетов и правил release notes.
- Минимальные тесты/проверки на эмиссию событий и отсутствие регрессий сборки.

## Не входит в объём
- Настройка алертов/дашбордов на стороне AprilHub (это [`034`](../034-phase-4a-hub-widget-release-gates-smoke/)).
- Изменение глобального observability стека.

## Заглушки и внешние зависимости
- До полной настройки Hub-дашбордов допускается логирование событий в локальный/dev канал с последующей верификацией.
- При отсутствии end-to-end корреляции на стенде зафиксировать ограничение и шаг follow-up.

## Технические ограничения
- Не отходить от существующей observability модели экосистемы AprilHub.
- Не вводить нестабильные публичные события без semver-правил.
- Секреты/ключи не коммитить.

## Критерии готовности (acceptance)
- [ ] Для целевых виджетов внедрен единый событийный минимум.
- [ ] В документации описаны semver правила и совместимость для Hub consumers.
- [ ] Проверки сборки/тестов проходят.

## Проверка (команды)
```bash
make docs-build
cd frontend && npm ci && npm run lint && npm run test && npm run build
```

## Результат в отчёте
Таблица внедренных событий по виджетам, описание semver политики и список оставшихся интеграционных шагов в Hub.

## Человекопонятная история в docs-site (обязательно)
- [ ] Создана/обновлена страница `docs-site/docs/task-story-033-phase-4a-profile-widget-observability-semver.md`.
- [ ] В [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md) добавлена ссылка и обновлен статус.
- [ ] Простым языком описано, какие события теперь есть и зачем нужен semver режим.
- [ ] Указано, как интеграторам проверять совместимость версий.
- [ ] В конце страницы есть ссылки на `tasks/033-phase-4a-profile-widget-observability-semver/TASK.md`, `PLAN.md` (если появится), `REPORT.md`.
