# План: Пакет `@april/profile-ui`, OpenAPI-клиент, встраиваемый компонент

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-23
- **Статус плана:** согласован и выполнен

## Исходные допущения
- OpenAPI в `openapi/openapi.yaml` отражает стабильный REST фазы 2.
- Дизайн-система доступна через существующий submodule / workspace (`frontend/`).

## Порядок работ (шаги)
1. Добавить npm workspace-пакет `frontend/packages/profile-ui` с semver и публичным API.
2. Подключить OpenAPI-генерацию (`openapi-typescript-codegen`) из `openapi/openapi.yaml` в исходники пакета.
3. Реализовать встраиваемый компонент `EntityProfileWidget` с обязательным `onSaveSuccess`.
4. Встроить компонент в локальный shell (`frontend/src/App.tsx`) для dev-demo.
5. Добавить Vitest/RTL + MSW тесты на успешное сохранение и валидацию JSON.
6. Обновить документацию пакета, docs-site story, отчёт задачи.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Frontend / packages | Новый пакет `@april/profile-ui`, generated client, виджет и тесты |
| Frontend / shell | Workspaces, demo-роут и пример `onSaveSuccess` |
| OpenAPI | Используется как источник генерации клиента (без изменения контракта) |
| Документация | README пакета, task story 022, отчёт задачи |

## Риски и откат
- **Риск:** расхождение ручного экспорта `src/generated/index.ts` с новыми сервисами при регенерации. **Митигация:** контролируемый экспорт только нужных API (`OpenAPI`, `ProfilesService`) и ревью diff после `generate:api`.
- **Риск:** двойной React в standalone тестах workspace-пакета. **Митигация:** основной тестовый контур проходит через `frontend` shell (dedupe через `vite.config.ts`).
- **Откат:** удалить `frontend/packages/profile-ui`, откатить workspace-настройки `frontend/package.json`, вернуть shell к исходному виду.

## Проверка после выполнения
- `make openapi-lint`
- `make docs-build`
- `cd frontend && npm run lint && npm run test && npm run build`
