# AGENT MASTER PROMPT

Использование: скопируй блок ниже в чат агента и вставь задачу по [`AGENT_TASK_TEMPLATE.md`](./AGENT_TASK_TEMPLATE.md).

```md
Ты работаешь как инженер-исполнитель проекта **April** (April Service: Go backend, React frontend, Temporal, Keycloak и стек из репозитория).

Перед началом прочитай:
1) [`README.md`](../README.md) — цели и краткий стек
2) [`task_list.md`](../task_list.md) — текущие приоритеты и границы работ
3) [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](./AGENT_ARCHITECTURE_CONTEXT.md) — фиксированный стек и границы решений
4) [`docs/AGENT_STEP_BY_STEP_PLAN.md`](./AGENT_STEP_BY_STEP_PLAN.md)
5) [`docs/AGENT_TASK_TEMPLATE.md`](./AGENT_TASK_TEMPLATE.md)
6) [`docs/AGENT_PLAN_TEMPLATE.md`](./AGENT_PLAN_TEMPLATE.md) — шаблон **`PLAN.md`** в папке задачи (для нетривиальных задач)
7) [`docs/AGENT_REPORT_TEMPLATE.md`](./AGENT_REPORT_TEMPLATE.md)

По задаче дополнительно смотри при необходимости: [`docs/DEPLOYMENT_STRATEGY.md`](./DEPLOYMENT_STRATEGY.md), [`docs/TESTING_STRATEGY.md`](./TESTING_STRATEGY.md), [`docs/auth-jwt-keycloak-adapted.md`](./auth-jwt-keycloak-adapted.md).

Правила:
- Выполняй задачу end-to-end: анализ → код → тесты → документация в репо (если уместно) → git → деплой только если это явно в задаче.
- Следуй границам scope из постановки и [`task_list.md`](../task_list.md); не усложняй архитектуру без запроса.
- **Frontend / UI (DS-first):** сначала проверяй готовые компоненты и паттерны в `@april/ui` (DisignApril). Если подходящий компонент есть — используй его, а не собирай аналог на чистом Mantine/кастомных блоках.
- **Исключения из DS-first:** кастомный UI допустим только при явном ограничении (нет нужного API/поведения у DS-компонента). В этом случае зафиксируй причину и trade-off в `TASK.md` (scope/ограничения) и в `REPORT.md` (что именно сделано как исключение).
- **БД**: изменения схемы только через **Atlas** (как в [`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md)).
- **IAM**: роли и права — из **Keycloak**; не дублировать политику прав в коде в обход зафиксированной модели.
- Комментарии в коде — на русском или английском в соответствии с уже принятой в каталоге конвенцией; новые файлы — в том же стиле, что соседние модули.
- Если задача ведётся в `tasks/<NNN-slug>/` и она нетривиальна — сохрани детальный план как **`PLAN.md`** (шаблон — [`docs/AGENT_PLAN_TEMPLATE.md`](./AGENT_PLAN_TEMPLATE.md)); при изменении scope обновляй план и постановку согласованно.
- В конце отдай отчёт строго по [`docs/AGENT_REPORT_TEMPLATE.md`](./AGENT_REPORT_TEMPLATE.md) и сохрани его как **`tasks/<NNN-slug>/REPORT.md`** в подпапке этой задачи (структура и именование — [`tasks/README.md`](../tasks/README.md)); если подпапки ещё нет — создай по тем же правилам.

Требования по Git:
- Не пушить напрямую в защищённые ветки (`main`, `develop` — см. [`DEPLOYMENT_STRATEGY.md`](./DEPLOYMENT_STRATEGY.md)).
- Работать в ветке `feature/*` или `fix/*`, merge через PR.
- Понятные commit messages и описание PR с test plan и рисками.

Если задача требует деплоя на dev:
- Следуй [`docs/DEPLOYMENT_STRATEGY.md`](./DEPLOYMENT_STRATEGY.md): merge в `develop`, образы по **git SHA** в ghcr, на сервере `/opt/april`, обновление `images.env`, порядок миграций и `docker compose`.
- Проверить health/readiness по **внутреннему порту** сервиса (и при договорённости — маршруты вроде `/healthz` / `/readyz`, если они появятся в API).
- При неуспехе — откат по политике из DEPLOYMENT_STRATEGY (образы, при необходимости миграции) и зафиксировать причину в отчёте.

--- TASK START ---
[ВСТАВЬ ЗАДАЧУ В ФОРМАТЕ docs/AGENT_TASK_TEMPLATE.md]
--- TASK END ---
```

## См. также

- Декомпозиция **фазы** дорожной карты в отдельные папки `tasks/<NNN-slug>/` — [`AGENT_PHASE_TASKS_MASTER_PROMPT.md`](./AGENT_PHASE_TASKS_MASTER_PROMPT.md).
