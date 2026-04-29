#!/bin/sh
# Пересобирает tarball’ы в vendor/ds-packs из submodule design-system/DisignApril (tokens + ui с @april/tokens 0.1.0 внутри ui).
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DS="${ROOT}/../design-system/DisignApril"
OUT="${ROOT}/vendor/ds-packs"
UI_SRC="${DS}/packages/ui"
TOK_SRC="${DS}/packages/tokens"

if [ ! -d "${DS}" ]; then
  echo "repack-ds-vendor: submodule ${DS} not found" >&2
  exit 1
fi

corepack enable 2>/dev/null || true
CI=true pnpm --dir "${DS}" install --frozen-lockfile
pnpm --dir "${DS}" build

mkdir -p "${OUT}"
(cd "${TOK_SRC}" && npm pack >/dev/null)
mv "${TOK_SRC}/april-tokens-0.1.0.tgz" "${OUT}/"

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT
(cd "${UI_SRC}" && npm pack >/dev/null)
cp "${UI_SRC}/april-ui-0.1.0.tgz" "${TMP}/in.tgz"
(cd "${TMP}" && tar xzf in.tgz)
sed -i 's/"@april\/tokens": "workspace:\*"/"@april\/tokens": "0.1.0"/' package/package.json
(cd "${TMP}" && tar czf out.tgz package)
mv "${TMP}/out.tgz" "${OUT}/april-ui-0.1.0.tgz"
echo "repack-ds-vendor: wrote ${OUT}/april-tokens-0.1.0.tgz and ${OUT}/april-ui-0.1.0.tgz"
