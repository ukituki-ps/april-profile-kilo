# Операционная модель документации виджетов

> Связанные документы: [`WIDGET_CONTRACTS.md`](./WIDGET_CONTRACTS.md), [`WIDGET_INTEGRATION_CHECKLIST.md`](./WIDGET_INTEGRATION_CHECKLIST.md), [`WIDGET_RELEASE_CHECKLIST.md`](./WIDGET_RELEASE_CHECKLIST.md), [`VERSIONING_AND_COMPATIBILITY.md`](./VERSIONING_AND_COMPATIBILITY.md), [`WIDGET_OBSERVABILITY_GUIDE.md`](./WIDGET_OBSERVABILITY_GUIDE.md).  
> Человекопонятная копия: `docs-site/docs/widget-docs-operating-model.md`.

## 1. Зачем эта модель

В контуре April один профиль может включать несколько UI-виджетов с разной зрелостью и графиком релизов. Чтобы инженерный и продуктовый контур не расходились, вводится единая модель:

`profile -> widgets -> contractVersion + lifecycleStatus`.

## 2. Единые идентификаторы и словарь

| Поле | Формат | Обязательность | Назначение |
|------|--------|----------------|------------|
| `profileId` | `kebab-case` (`entity-profile`) | обязательно | Идентификатор доменного профиля в каталоге документации. |
| `widgetId` | `kebab-case` (`entity-profile-editor`) | обязательно | Уникальный идентификатор виджета внутри `profileId`. |
| `contractVersion` | `v<major>[.<minor>]` (`v1`, `v1.1`) | обязательно | Версия документационного/интеграционного контракта HostContext + props/events. |
| `lifecycleStatus` | `draft \| beta \| stable \| deprecated` | обязательно | Текущая стадия эксплуатации. |
| `packageName` | npm name (`@april/profile-ui`) | обязательно | Пакет или артефакт доставки виджета. |
| `owner` | команда/репозиторий | обязательно | Кто отвечает за актуальность карточки и релиз. |

`profileId`, `widgetId`, `contractVersion`, `lifecycleStatus` должны использоваться одинаково в `docs/` и `docs-site/`.

## 3. Жизненный цикл виджета

- `draft` — прототип/внутренний эксперимент, не для массовой интеграции.
- `beta` — доступно для ограниченного использования, возможны несовместимые изменения между minor-итерациями (с явным changelog).
- `stable` — рекомендовано для production-использования, изменения по правилам semver и с обязательным тест-планом.
- `deprecated` — поддерживается ограниченно, указан срок/условие снятия и путь миграции.

## 4. Обязательные разделы карточки виджета

Каждая карточка в `docs/widgets/**` обязана содержать:

1. **Мета:** `profileId`, `widgetId`, `packageName`, `contractVersion`, `lifecycleStatus`, владелец.
2. **Назначение:** что делает виджет и в каком пользовательском сценарии.
3. **Контракт интеграции:** ключевые props/events + ссылки на канонические контракты.
4. **Права доступа:** привязка к ролям/политикам Keycloak и ограничениям API.
5. **Зависимости:** API/BFF, `@april/ui`, required peer dependencies.
6. **Observability:** `requestId`/trace, логирование ошибок, smoke-маркеры.
7. **Ограничения и known issues:** что пока не поддерживается и где follow-up.
8. **Артефакты поставки:** ссылки на `TASK.md`, `PLAN.md`, `REPORT.md`, smoke/e2e.

Шаблон карточки: [`templates/WIDGET_SPEC_TEMPLATE.md`](./templates/WIDGET_SPEC_TEMPLATE.md).

## 5. Политика совместимости и change policy

- Любой breaking change в `HostContext`, props/events или ожидаемом поведении host фиксируется как **major** и отражается в [`VERSIONING_AND_COMPATIBILITY.md`](./VERSIONING_AND_COMPATIBILITY.md).
- Non-breaking изменения (новые optional props, расширение событий без ломки) оформляются как **minor**.
- Исправления без изменения публичного контракта — **patch**.
- Любое изменение модели каталогизации (`profile -> widgets -> ...`) сопровождается обновлением changelog и синхронизацией `docs-site`.

## 6. Структура хранения в `docs/`

- Каноническая модель: `docs/WIDGET_DOCS_OPERATING_MODEL.md`.
- Индекс профилей/виджетов: `docs/widgets/README.md`.
- Карточки по профилям: `docs/widgets/<profileId>/...`.
- Шаблон карточки: `docs/templates/WIDGET_SPEC_TEMPLATE.md`.

Рекомендуемая структура:

```text
docs/
  WIDGET_DOCS_OPERATING_MODEL.md
  widgets/
    README.md
    <profileId>/
      <widgetId>.md
```

## 7. Definition of Done для документационного потока

Изменение/релиз виджета считается завершённым только если:

- [ ] Обновлена карточка виджета в `docs/widgets/...` с актуальными `contractVersion` и `lifecycleStatus`.
- [ ] Синхронизирована адаптированная страница в `docs-site/` без изменения смысла контрактов.
- [ ] Обновлены чеклисты интеграции и/или релиза, если добавлены новые обязательные шаги.
- [ ] Добавлены или обновлены ссылки на task-артефакты (`TASK/PLAN/REPORT`) и smoke/e2e статус.
- [ ] `make docs-build` проходит без ошибок.
