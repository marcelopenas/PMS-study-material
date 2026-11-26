#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

ZENSICAL=""
for candidate in \
  ".venv/bin/zensical" \
  "../platform/.venv/bin/zensical" \
  "$(command -v zensical 2>/dev/null || true)"; do
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    ZENSICAL="$candidate"
    break
  fi
done

if [ -z "$ZENSICAL" ]; then
  echo "Zensical não encontrado. Instale com: uv sync (ou pip install zensical)" >&2
  exit 1
fi

"$ZENSICAL" build --clean "$@"
python3 scripts/postprocess_diagrams.py
echo "Bundle pronto em site/ (diagramas como SVG locais)."
