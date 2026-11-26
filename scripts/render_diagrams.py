#!/usr/bin/env python3
"""Renderiza os blocos ```mermaid dos docs em SVGs claro/escuro.

Uso:
    python3 scripts/render_diagrams.py            # só o que falta
    python3 scripts/render_diagrams.py --force    # tudo de novo

Requer o Mermaid CLI (`mmdc`) no PATH ou em MMDC=/caminho/para/mmdc.
Para usar o Chromium do sistema, aponte PUPPETEER_CONFIG para um JSON:
    {"executablePath": "/usr/bin/chromium", "args": ["--no-sandbox"]}

Os SVGs são versionados em docs/assets/diagrams para que o build normal
(`zensical build`) não precise de Node/Chromium. Rode este script apenas
quando editar um diagrama.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "assets" / "diagrams"
MANIFEST = OUT / "manifest.json"
MMD_CONFIG = ROOT / "scripts" / "mmd-config.json"
BLOCK_RE = re.compile(r"```mermaid[ \t]*\n(.*?)```", re.S)


def normalize(code: str) -> str:
    return "\n".join(line.rstrip() for line in code.strip().splitlines())


def digest(code: str) -> str:
    return hashlib.sha1(normalize(code).encode("utf-8")).hexdigest()[:12]


def alt_text(code: str) -> str:
    first = normalize(code).splitlines()[0].strip().lower()
    if first.startswith("sequencediagram"):
        return "Diagrama de sequência"
    if first.startswith("statediagram"):
        return "Diagrama de estados"
    if first.startswith("timeline"):
        return "Linha do tempo"
    if first.startswith(("flowchart", "graph")):
        return "Fluxograma"
    return "Diagrama"


def find_mmdc() -> str:
    candidate = os.environ.get("MMDC") or shutil.which("mmdc")
    if not candidate:
        sys.exit(
            "mmdc não encontrado. Instale @mermaid-js/mermaid-cli ou defina MMDC."
        )
    return candidate


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="re-renderiza tudo")
    args = parser.parse_args()

    mmdc = find_mmdc()
    puppeteer = os.environ.get("PUPPETEER_CONFIG")
    OUT.mkdir(parents=True, exist_ok=True)

    manifest: dict[str, dict] = {}
    if MANIFEST.exists():
        try:
            manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            manifest = {}

    seen: dict[str, str] = {}
    for md in sorted(DOCS.glob("*.md")):
        text = md.read_text(encoding="utf-8")
        for index, match in enumerate(BLOCK_RE.finditer(text), start=1):
            code = normalize(match.group(1))
            key = digest(code)
            if key in seen:
                continue
            seen[key] = md.name
            light = OUT / f"{key}-light.svg"
            dark = OUT / f"{key}-dark.svg"
            if not args.force and light.exists() and dark.exists():
                manifest.setdefault(
                    key, {"alt": alt_text(code), "source": md.name, "index": index}
                )
                continue

            with tempfile.NamedTemporaryFile(
                "w", suffix=".mmd", delete=False, encoding="utf-8"
            ) as handle:
                handle.write(code)
                temp = Path(handle.name)
            try:
                for theme, target in (("default", light), ("dark", dark)):
                    command = [
                        mmdc,
                        "-i",
                        str(temp),
                        "-o",
                        str(target),
                        "-t",
                        theme,
                        "-b",
                        "transparent",
                    ]
                    if MMD_CONFIG.exists():
                        command += ["-c", str(MMD_CONFIG)]
                    if puppeteer:
                        command += ["-p", puppeteer]
                    subprocess.run(
                        command,
                        cwd=ROOT,
                        check=True,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.PIPE,
                        text=True,
                    )
                manifest[key] = {
                    "alt": alt_text(code),
                    "source": md.name,
                    "index": index,
                }
                print(f"ok  {md.name}#{index}  {key}  {light.stat().st_size // 1024} KB")
            except subprocess.CalledProcessError as error:
                print(
                    f"ERRO {md.name}#{index} ({key}): {error.stderr.strip()[:300]}",
                    file=sys.stderr,
                )
            finally:
                temp.unlink(missing_ok=True)

    # remove SVGs/metadados de diagramas que não existem mais
    for svg in OUT.glob("*.svg"):
        key = svg.name.split("-")[0]
        if key not in seen:
            svg.unlink(missing_ok=True)
    manifest = {
        key: value
        for key, value in manifest.items()
        if key in seen and (OUT / f"{key}-light.svg").exists()
    }
    MANIFEST.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"\n{len(manifest)} diagramas em {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
