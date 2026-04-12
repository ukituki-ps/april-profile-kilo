---
sidebar_position: 1
---

# Проектные значения (шаблон)

Заполните таблицу для **вашего** репозитория после копирования `april_template`. В примерах ниже — нейтральные плейсхолдеры; в репозитории **april_template** значения по умолчанию заданы под этот шаблон.

| Имя | Пример для заполнения | Назначение |
| --- | --------------------- | ---------- |
| `DEV_HOST` | `dev.example.com` | Публичный хост dev-стенда |
| `DEPLOY_ROOT` | `/opt/<repo>` | Каталог git-клона на сервере (например `/opt/april_template`) |
| `DEPLOY_USER` | `deploy` | Пользователь ОС для SSH и runner |
| `GITHUB_REPO_SLUG` | `<org>/<repo>` | Репозиторий в `git@github.com:` |
| `RUNNER_LABEL_EXTRA` | `template` | Доп. label self-hosted runner (вместе с `dev`) |
| `APRIL_DEPLOY_ROOT` | как `DEPLOY_ROOT` | Имя **repository variable** в GitHub Actions (при необходимости переименуйте) |

Workflow ожидает runner с `runs-on: [self-hosted, dev, <RUNNER_LABEL_EXTRA>]`.
