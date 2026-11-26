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

if [ "${1:-}" = "--dev" ]; then
  shift
  if [ -z "$ZENSICAL" ]; then
    echo "Zensical não encontrado para o modo dev." >&2
    echo "Instale com: uv sync (ou pip install zensical)" >&2
    exit 1
  fi
  echo "Modo dev: diagramas usam Mermaid no cliente (mais lento)."
  exec "$ZENSICAL" serve "$@"
fi

./build.sh
PORT="${PORT:-8000}"
echo
echo "Servindo o bundle processado em http://localhost:${PORT}/"
echo "(edite e rode ./serve.sh de novo; use ./serve.sh --dev para live reload)"
exec python3 -m http.server "$PORT" --directory site
