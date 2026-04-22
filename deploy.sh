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
  COMPOSE_PROFILES     в серверном .env рядом с compose: например db — поднять postgres/redis/worker
                       (см. .env.example и docs/DEPLOYMENT_STRATEGY.md §5)
  SKIP_GIT_PULL=1      не выполнять git pull
  SKIP_OPENAPI_LINT=1  не выполнять make openapi-lint
  SKIP_DOCS_BUILD=1    не выполнять сборку docs-site
  SKIP_DB_BACKUP=1     не вызывать scripts/db-backup.sh (если есть)
  SKIP_MIGRATIONS=1    не вызывать scripts/run-migrations.sh (если есть)
  SKIP_COMPOSE_PULL=1  не выполнять docker compose pull
  SKIP_PORT_CHECK=1    не проверять занятость проброшенных портов перед compose up
  COMPOSE_FORCE_RECREATE=0  не пересоздавать контейнеры принудительно
  COMPOSE_REMOVE_ORPHANS=0  не удалять orphan-контейнеры

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

# У Docker Compose подстановка ${VAR} в yaml берёт значение из окружения процесса
# с приоритетом над --env-file. На self-hosted runner часто задан DOCS_HTTP_PORT (иногда readonly) —
# unset не всегда снимает; все вызовы compose идут через compose_exec с env -u.
unset DOCS_HTTP_PORT STRUCTURIZR_HTTP_PORT BACKEND_HTTP_PORT POSTGRES_PORT REDIS_PORT 2>/dev/null || true

compose_exec() {
	env -u DOCS_HTTP_PORT -u STRUCTURIZR_HTTP_PORT -u BACKEND_HTTP_PORT -u POSTGRES_PORT -u REDIS_PORT \
		"${compose_files[@]}" "$@"
}

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

  if command -v make >/dev/null 2>&1 && command -v npx >/dev/null 2>&1; then
    log "make openapi-lint"
    make openapi-lint
    return
  fi

  if command -v docker >/dev/null 2>&1; then
    log "fallback openapi-lint через node:22-bookworm-slim (npx @redocly/cli)"
    docker run --rm \
      --name "april-profile-openapi-lint-$$" \
      -v "${ROOT}:/repo" \
      -w /repo \
      node:22-bookworm-slim \
      sh -c "npx --yes @redocly/cli@1.25.0 lint openapi/openapi.yaml openapi/mail-gateway-openapi.yaml --config redocly.yaml"
    return
  fi

  log "ошибка: для openapi-lint нужен make+npx или docker"
  exit 1
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
  if [[ "${SKIP_DOCS_BUILD:-}" == "1" ]]; then
    log "пропуск docs-build (SKIP_DOCS_BUILD=1)"
    return 0
  fi

  if command -v make >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
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
      --name "april-profile-docs-build-$$" \
      -v "${ROOT}:/repo" \
      -w /repo/docs-site \
      node:22-bookworm-slim \
      sh -c "npm ci && npm run build"
    return
  fi
  log "ошибка: нужны make, npm или docker для docs-build"
  exit 1
}

# Поднять postgres (и redis) до миграций: Atlas подключается к 127.0.0.1:POSTGRES_PORT на хосте,
# контейнер должен уже слушать проброшенный порт до полного compose up.
ensure_db_for_migrations() {
	if [[ "${SKIP_MIGRATIONS:-}" == "1" ]]; then
		return 0
	fi
	if ! command -v docker >/dev/null 2>&1; then
		return 0
	fi
	if [[ ! -f docker-compose.yml ]]; then
		return 0
	fi
	log "docker compose up -d postgres redis (подготовка к миграциям)"
	if compose_exec up -d postgres redis; then
		return 0
	fi
	log "замечание: compose up postgres/redis не выполнен (нет профиля db, внешняя БД или ошибка compose) — миграции идут как настроено в DATABASE_URL"
	return 0
}

# Перед compose up: убедиться, что проброшенные на хост порты свободны или уже заняты
# контейнерами этого же compose-проекта (повторный деплой). Иначе — выход с подсказкой.
check_compose_host_ports() {
	if [[ "${SKIP_PORT_CHECK:-}" == "1" ]]; then
		log "пропуск проверки портов (SKIP_PORT_CHECK=1)"
		return 0
	fi
	if ! command -v docker >/dev/null 2>&1; then
		return 0
	fi
	if ! command -v python3 >/dev/null 2>&1; then
		log "замечание: python3 не найден — пропуск проверки портов (или установите python3 / задайте SKIP_PORT_CHECK=1)"
		return 0
	fi
	local cfg_json
	if ! cfg_json="$(compose_exec config --format json 2>/dev/null)"; then
		log "замечание: docker compose config --format json недоступен — пропуск проверки портов"
		return 0
	fi
	mapfile -t compose_cids < <(compose_exec ps -q 2>/dev/null || true)
	export APRIL_COMPOSE_CONFIG_JSON="${cfg_json}"
	export APRIL_COMPOSE_CONTAINER_IDS="${compose_cids[*]}"
	if ! python3 - <<'PY'
import json, os, re, socket, subprocess, sys

def parse_published(pub):
    if pub is None:
        return None
    s = str(pub).strip()
    if s.isdigit():
        return int(s)
    m = re.search(r":(\d+)\s*$", s)
    return int(m.group(1)) if m else None

def want_ports(cfg):
    out = set()
    for spec in (cfg.get("services") or {}).values():
        for p in spec.get("ports") or []:
            n = parse_published(p.get("published"))
            if n is not None:
                out.add(n)
    return out

def owned_host_ports(container_ids):
    owned = set()
    for cid in container_ids:
        cid = cid.strip()
        if not cid:
            continue
        r = subprocess.run(
            ["docker", "port", cid],
            capture_output=True,
            text=True,
        )
        if r.returncode != 0:
            continue
        for line in r.stdout.splitlines():
            m = re.search(r"->\s*.+:(\d+)\s*$", line)
            if m:
                owned.add(int(m.group(1)))
    return owned

def port_bindable(port: int) -> bool:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(("0.0.0.0", port))
        return True
    except OSError:
        return False
    finally:
        s.close()

cfg = json.loads(os.environ.get("APRIL_COMPOSE_CONFIG_JSON", "{}"))
ids = os.environ.get("APRIL_COMPOSE_CONTAINER_IDS", "").split()
want = want_ports(cfg)
owned = owned_host_ports(ids)
conflicts = []
for p in sorted(want):
    if port_bindable(p):
        continue
    if p in owned:
        continue
    conflicts.append(p)
if conflicts:
    print(
        "[deploy] порты уже заняты другим процессом (не этим compose): "
        + ", ".join(str(x) for x in conflicts),
        file=sys.stderr,
    )
    print(
        "[deploy] задайте в .env свободные DOCS_HTTP_PORT / BACKEND_HTTP_PORT / "
        "POSTGRES_PORT / REDIS_PORT / STRUCTURIZR_HTTP_PORT или освободите порты.",
        file=sys.stderr,
    )
    sys.exit(1)
PY
	then
		unset APRIL_COMPOSE_CONFIG_JSON APRIL_COMPOSE_CONTAINER_IDS
		return 1
	fi
	unset APRIL_COMPOSE_CONFIG_JSON APRIL_COMPOSE_CONTAINER_IDS
}

run_compose() {
  local compose_up_flags=(-d)
  if [[ "${COMPOSE_FORCE_RECREATE:-1}" == "1" ]]; then
    compose_up_flags+=(--force-recreate)
  fi
  if [[ "${COMPOSE_REMOVE_ORPHANS:-1}" == "1" ]]; then
    compose_up_flags+=(--remove-orphans)
  fi

  log "docker compose config (проверка)"
  compose_exec config >/dev/null
	check_compose_host_ports
  if [[ "${SKIP_COMPOSE_PULL:-}" == "1" ]]; then
    log "пропуск docker compose pull (SKIP_COMPOSE_PULL=1)"
  else
    log "docker compose pull"
    compose_exec pull
  fi
  log "docker compose up ${compose_up_flags[*]}"
  compose_exec up "${compose_up_flags[@]}"
  log "docker compose ps"
  compose_exec ps
}

main() {
  log "каталог: $ROOT"
  run_git_pull
  run_openapi_lint
	run_hook "scripts/db-backup.sh" "SKIP_DB_BACKUP" "db-backup"
	ensure_db_for_migrations
	run_hook "scripts/run-migrations.sh" "SKIP_MIGRATIONS" "миграции"
  run_docs_build
  run_compose
  log "готово"
}

main "$@"
