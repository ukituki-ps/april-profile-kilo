# TASK: micro — entity-types-widget → master–detail (как profiles-widget)

## Мета

| Поле | Значение |
|------|----------|
| **id** | `071-micro-entity-types-widget-master-detail-refactor` |
| **ветка (рекомендация)** | `feature/entity-types-widget-master-detail-refactor` |
| **приоритет** | P2 (архитектура UI, согласование с эталоном) |
| **пакет** | `@april/profile-ui` |
| **ключевые файлы (сейчас)** | `frontend/packages/profile-ui/src/components/EntityTypesWidgetCore.tsx`, `EntityTypesApiWidget.tsx`, `EntityTypesWidget.tsx` |
| **нормативные документы** | [`docs/widgets/MASTER_DETAIL_WIDGET_PATTERN.md`](../../docs/widgets/MASTER_DETAIL_WIDGET_PATTERN.md), [`docs/widgets/profile/profiles-widget.md`](../../docs/widgets/profile/profiles-widget.md), [`docs/widgets/profile/profiles-widget-profile-detail.md`](../../docs/widgets/profile/profiles-widget-profile-detail.md), [`docs/widgets/profile/entity-types-widget.md`](../../docs/widgets/profile/entity-types-widget.md) |

## Цель

Привести **entity-types-widget** к той же **архитектурной декомпозиции master–detail**, что и **profiles-widget**, опираясь на зафиксированный паттерн **MASTER_DETAIL_WIDGET_PATTERN**:

1. **Отдельно каталог (список)** — server-driven левая колонка (`CardListColumn`), выбор семейства типа, пагинация/фильтры по контракту каталога; без смешивания с логикой черновика/ревизий/upgrade в одном «комке».
2. **Отдельно детальная карточка** — загрузка `get` по выбранному id, черновик JSON, публикация, история ревизий, вкладка Entities/Upgrade; отмена запросов, мутации, телеметрия; при необходимости императивный API (`ref`) для сценариев, открываемых с хоста или из списка.

Публичный фасад и **`EntityTypesDataProvider`** остаются контрактом между UI и BFF; **Core не импортирует HTTP** — только интерфейс провайдера (уже задокументировано в [`entity-types-widget.md`](../../docs/widgets/profile/entity-types-widget.md); цель — **дотянуть код и доки** до явного разделения слоёв, как в чеклисте паттерна §11).

## Scope

### Входит

- Выделение **`EntityTypesWidgetDetailCore`** (или эквивалентное имя по конвенции пакета): вся логика правой колонки / «карточки семейства» (загрузка детали, draft, revisions, вкладки, мутации), с пропсами вида `familyId`, `summaryRow`, `provider`, `hostContext`, колбэки ревалидации каталога и `onAction` / `onError` / `onObservability`.
- Упрощение **`EntityTypesWidgetCore`** до роли **сборки списка + layout**: state списка, `loadList` с **abort + монотонный request id**, политика `selectedFamilyId`, встраивание DetailCore, опционально `ref` на деталь для сценариев с хоста (по аналогии с `ProfilesWidgetProfileDetailHandle`, если продуктово нужно).
- Сохранение **`EntityTypesApiWidget`** / **`EntityTypesWidget`**: wiring провайдера, **токен через ref + getter** в `providerContext`, без пересоздания фабрики провайдера при ротации токена (см. паттерн §8).
- Тесты: перенос/добавление тестов на **Core списка** и **DetailCore** с mock-`EntityTypesDataProvider` (без сети), сценарии гонок и смены выбора.
- Документация: обновить **`docs/widgets/profile/entity-types-widget.md`** и при необходимости поверхности (`entity-types-widget-catalog-list.md`, `entity-types-widget-schema-admin.md`) — явно описать **два публичных/логических виджета** (список + деталь) и ссылку на `MASTER_DETAIL_WIDGET_PATTERN.md`.

### Не входит (follow-up / отдельные задачи)

- Полная копия UX **grid + `AprilModal`** как у profiles-widget — только после стабилизации split; зафиксировать в `REPORT.md` или отдельной задаче.
- Изменения **OpenAPI / бэкенда** — не требуются, если контракт провайдера не меняется.
- Массовый рефакторинг **не связанных** виджетов пакета.

## AGENT_MASTER_PROMPT compliance

- [x] End-to-end: анализ → код → тесты → обновление доков в репо → `REPORT.md`.
- [x] DS-first: `CardListColumn`, `AprilModal`, `DensityProvider`, существующие примитивы `@april/ui`.
- [x] Границы scope; при расширении — обновить эту постановку или завести подзадачу.
- [x] Комментарии в коде — в стиле соседних файлов (RU/EN как уже принято).

## Acceptance criteria

1. В коде явно разделены **компонент списка (master)** и **компонент детальной карточки (detail)**; `EntityTypesWidgetCore` не содержит сотен строк низкоуровневой логики детали «вперемешку» со списком (допустим тонкий orchestration-слой).
2. Запросы списка и детали используют **`AbortSignal`** и защиту от гонок согласованно с [`MASTER_DETAIL_WIDGET_PATTERN.md`](../../docs/widgets/MASTER_DETAIL_WIDGET_PATTERN.md) §4–§6.
3. Публичные экспорты пакета не ломают embed без мажорного намерения: миграция сопровождается типами и заметкой в доке / `VERSIONING` при необходимости.
4. `npm run lint` / тесты затронутых файлов в `frontend/packages/profile-ui` — зелёные (команды ниже).

## Проверка

```bash
cd frontend/packages/profile-ui && npm run lint
cd frontend/packages/profile-ui && npm test -- --run EntityTypesWidgetCore
```

При изменении сборки пакета:

```bash
cd frontend/packages/profile-ui && npm run build
```

## Ожидаемый результат в `REPORT.md`

- Список новых/изменённых файлов и публичных API.
- Результаты команд проверки.
- Риски (например дублирование эффектов при первом сплите).
- **Follow-up:** grid+modal, доп. ref-API, выравнивание телеметрии с `WIDGET_CONTRACTS.md`.
