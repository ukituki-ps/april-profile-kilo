#!/bin/sh
# Пересобирает tarball’ы в vendor/ds-packs из submodule design-system/DisignApril:
# версии имён архивов и вложенной зависимости ui→tokens совпадают с package.json пакетов.
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

TOK_VER="$(node -e "console.log(require('${TOK_SRC}/package.json').version)")"
UI_VER="$(node -e "console.log(require('${UI_SRC}/package.json').version)")"

corepack enable 2>/dev/null || true
CI=true pnpm --dir "${DS}" install --frozen-lockfile
pnpm --dir "${DS}" build

mkdir -p "${OUT}"
TOK_REL="$(cd "${TOK_SRC}" && npm pack)"
mv "${TOK_SRC}/${TOK_REL}" "${OUT}/april-tokens-${TOK_VER}.tgz"

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT
UI_REL="$(cd "${UI_SRC}" && npm pack)"
cp "${UI_SRC}/${UI_REL}" "${TMP}/in.tgz"
(cd "${TMP}" && tar xzf in.tgz)
sed -i "s/\"@april\\/tokens\": \"workspace:\\*\"/\"@april\\/tokens\": \"${TOK_VER}\"/" "${TMP}/package/package.json"
sed -i "s/\"@ukituki-ps\\/april-tokens\": \"workspace:\\*\"/\"@ukituki-ps\\/april-tokens\": \"${TOK_VER}\"/" "${TMP}/package/package.json"
(cd "${TMP}" && tar czf out.tgz package)
mv "${TMP}/out.tgz" "${OUT}/april-ui-${UI_VER}.tgz"
echo "repack-ds-vendor: wrote ${OUT}/april-tokens-${TOK_VER}.tgz and ${OUT}/april-ui-${UI_VER}.tgz"
