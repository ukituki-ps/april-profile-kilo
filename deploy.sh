#!/usr/bin/env bash
# Развёртывание на dev/stage: см. docs/DEPLOYMENT_STRATEGY.md
# Запуск из корня клона (на сервере обычно /opt/april): ./deploy.sh
set -euo pipefail

ROOT="${DEPLOY_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
cd "$ROOT"

log() { echo "[deploy] $*" >&2; }

usage() {
  cat <<'EOF'
deploy.sh — выкладка на dev/stage: git pull, make openapi-lint, опциональные хуки БД/миграций,
make docs-build, docker compose pull && up -d. Подробности: docs/DEPLOYMENT_STRATEGY.md

Использование: ./deploy.sh

EOF
  cat <<'EOF'

Переменные окружения:
  DEPLOY_ROOT          каталог репозитория (по умолчанию — каталог deploy.sh)
  SKIP_GIT_PULL=1      не выполнять git pull
  SKIP_OPENAPI_LINT=1  не выполнять make openapi-lint
  SKIP_DB_BACKUP=1     не вызывать scripts/db-backup.sh (если есть)
  SKIP_MIGRATIONS=1    не вызывать scripts/run-migrations.sh (если есть)

Опциональные хуки (если исполняемы):
  scripts/db-backup.sh      дамп БД до миграций/up (см. DEPLOYMENT_STRATEGY.md)
  scripts/run-migrations.sh миграции до docker compose up
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

compose_files=(docker compose)
if [[ -f .env ]]; then
  compose_files+=(--env-file .env)
fi
if [[ -f images.env ]]; then
  compose_files+=(--env-file images.env)
fi

run_git_pull() {
  if [[ "${SKIP_GIT_PULL:-}" == "1" ]]; then
    log "пропуск git pull (SKIP_GIT_PULL=1)"
    return 0
  fi
  if ! git rev-parse --git-dir >/dev/null 2>&1; then
    log "не git-репозиторий — пропуск git pull"
    return 0
  fi
  log "git pull --ff-only"
  git pull --ff-only
}

run_openapi_lint() {
  if [[ "${SKIP_OPENAPI_LINT:-}" == "1" ]]; then
    log "пропуск openapi-lint (SKIP_OPENAPI_LINT=1)"
    return 0
  fi
  if ! command -v make >/dev/null 2>&1; then
    log "make не найден — пропуск openapi-lint"
    return 0
  fi
  log "make openapi-lint"
  make openapi-lint
}

run_hook() {
  local path="$1"
  local skip_var="$2"
  local name="$3"
  if [[ "${!skip_var:-}" == "1" ]]; then
    log "пропуск ${name} (${skip_var}=1)"
    return 0
  fi
  if [[ ! -f "$path" ]]; then
    log "нет ${path} — пропуск ${name}"
    return 0
  fi
  if [[ ! -x "$path" ]]; then
    log "ошибка: ${path} существует, но не исполняемый (chmod +x)"
    exit 1
  fi
  log "запуск ${path}"
  "$path"
}

run_docs_build() {
  if command -v make >/dev/null 2>&1; then
    log "make docs-build"
    make docs-build
    return
  fi
  if command -v npm >/dev/null 2>&1; then
    log "make не найден — сборка как в Makefile: docs-site (npm ci && npm run build)"
    (cd docs-site && npm ci && npm run build)
    return
  fi
  if command -v docker >/dev/null 2>&1; then
    log "make и npm не найдены — сборка docs-site через образ node:22-bookworm-slim (как на минимальном сервере без Node в PATH)"
    docker run --rm \
      -v "${ROOT}:/repo" \
      -w /repo/docs-site \
      node:22-bookworm-slim \
      sh -c "npm ci && npm run build"
    return
  fi
  log "ошибка: нужны make, npm или docker для docs-build"
  exit 1
}

run_compose() {
  log "docker compose config (проверка)"
  "${compose_files[@]}" config >/dev/null
  log "docker compose pull"
  "${compose_files[@]}" pull
  log "docker compose up -d"
  "${compose_files[@]}" up -d
  log "docker compose ps"
  "${compose_files[@]}" ps
}

main() {
  log "каталог: $ROOT"
  run_git_pull
  run_openapi_lint
  run_hook "scripts/db-backup.sh" "SKIP_DB_BACKUP" "db-backup"
  run_hook "scripts/run-migrations.sh" "SKIP_MIGRATIONS" "миграции"
  run_docs_build
  run_compose
  log "готово"
}

main "$@"
