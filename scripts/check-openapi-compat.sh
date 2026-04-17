#!/usr/bin/env bash
# Сравнивает текущий OpenAPI со спецификацией в базовой ветке (без breaking changes по oasdiff).
# Переменные: BASE_REF (по умолчанию origin/develop), SPEC_PATH (по умолчанию openapi/openapi.yaml).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BASE_REF="${BASE_REF:-origin/develop}"
SPEC_PATH="${SPEC_PATH:-openapi/openapi.yaml}"
BRANCH="${BASE_REF#origin/}"
BASE_SPEC="/tmp/base-openapi-spec.yaml"

if ! command -v oasdiff >/dev/null 2>&1; then
  echo "[openapi-compat] oasdiff is required but not installed"
  exit 1
fi

echo "[openapi-compat] fetch base branch: ${BRANCH}"
if ! git fetch --no-tags origin "${BRANCH}" 2>/dev/null; then
  echo "[openapi-compat] skip: cannot fetch origin/${BRANCH} (ветка отсутствует на remote — настройте CI или создайте ветку)"
  exit 0
fi

if ! git cat-file -e "${BASE_REF}:${SPEC_PATH}" 2>/dev/null; then
  echo "[openapi-compat] ${SPEC_PATH} is absent in ${BASE_REF}; skipping breaking-change check"
  exit 0
fi

git show "${BASE_REF}:${SPEC_PATH}" > "$BASE_SPEC"

echo "[openapi-compat] running breaking-change check against ${BASE_REF}"
oasdiff breaking --fail-on ERR "$BASE_SPEC" "$SPEC_PATH"

echo "[openapi-compat] no breaking changes detected"
