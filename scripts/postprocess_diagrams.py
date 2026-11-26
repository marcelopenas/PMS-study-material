#!/usr/bin/env python3
"""Substitui os <pre class="mermaid"> do site gerado por <img> estáticas.

O bundle do Zensical carrega ~5,4 MB de Mermaid do unpkg quando encontra um
<pre class="mermaid">. Os SVGs são gerados por scripts/render_diagrams.py e
versionados em docs/assets/diagrams; aqui só trocamos o bloco pela imagem
clara/escura correspondente (hash do código-fonte).
"""

from __future__ import annotations

import hashlib
import html
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
DIAGRAMS = ROOT / "docs" / "assets" / "diagrams"
MANIFEST = DIAGRAMS / "manifest.json"
BLOCK_RE = re.compile(r'<pre class="mermaid">\s*<code[^>]*>(.*?)</code>\s*</pre>', re.S)


def normalize(code: str) -> str:
    return "\n".join(line.rstrip() for line in code.strip().splitlines())


def digest(code: str) -> str:
    return hashlib.sha1(normalize(code).encode("utf-8")).hexdigest()[:12]


def svg_width(path: Path) -> float:
    match = re.search(
        r'viewBox="[-\d.]+ [-\d.]+ ([-\d.]+) [-\d.]+"',
        path.read_text(encoding="utf-8", errors="ignore"),
    )
    return float(match.group(1)) if match else 0.0


def main() -> int:
    if not MANIFEST.exists():
        print("manifest.json ausente; rode scripts/render_diagrams.py", file=sys.stderr)
        return 1
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    site_diagrams = SITE / "assets" / "diagrams"
    pages = list(SITE.glob("**/*.html"))
    replaced = 0
    missing: set[str] = set()

    for page in pages:
        text = page.read_text(encoding="utf-8")
        if 'class="mermaid"' not in text:
            continue
        base = page.parent

        def swap(match: re.Match) -> str:
            nonlocal replaced
            code = html.unescape(match.group(1))
            key = digest(code)
            entry = manifest.get(key)
            light = DIAGRAMS / f"{key}-light.svg"
            dark = DIAGRAMS / f"{key}-dark.svg"
            if not entry or not light.exists() or not dark.exists():
                missing.add(f"{page.relative_to(SITE)}:{key}")
                return match.group(0)
            # relativo à raiz servida (site/), não à pasta docs/ de origem
            light_rel = Path(os.path.relpath(site_diagrams / light.name, base)).as_posix()
            dark_rel = Path(os.path.relpath(site_diagrams / dark.name, base)).as_posix()
            alt = html.escape(entry.get("alt", "Diagrama"), quote=True)
            width = svg_width(light)
            wide = width > 760
            images = (
                f'<img class="mmd-light" src="{light_rel}" alt="{alt}" loading="lazy" decoding="async">'
                f'<img class="mmd-dark" src="{dark_rel}" alt="{alt}" loading="lazy" decoding="async">'
            )
            replaced += 1
            if wide:
                # mantém o texto legível no tamanho natural e deixa o contêiner rolar
                images = (
                    f'<img class="mmd-light" src="{light_rel}" alt="{alt}" style="width:{int(width)}px" loading="lazy" decoding="async">'
                    f'<img class="mmd-dark" src="{dark_rel}" alt="{alt}" style="width:{int(width)}px" loading="lazy" decoding="async">'
                )
                return (
                    '<figure class="mmd-diagram mmd-wide">'
                    f'<div class="mmd-scroll" tabindex="0" role="region" aria-label="{alt} com rolagem horizontal">{images}</div>'
                    '<span class="mmd-hint">Role para o lado para ver o diagrama completo.</span>'
                    f'<a class="mmd-open" href="{light_rel}" target="_blank" rel="noopener">Abrir diagrama em tamanho real</a>'
                    "</figure>"
                )
            return f'<figure class="mmd-diagram">{images}</figure>'

        new = BLOCK_RE.sub(swap, text)
        if new != text:
            page.write_text(new, encoding="utf-8")

    # O template do 404 usa caminhos absolutos (/assets/...). Em GitHub Pages
    # de projeto o site vive em /<repo>/, então tornamos os caminhos relativos.
    not_found = SITE / "404.html"
    if not_found.exists():
        text = not_found.read_text(encoding="utf-8")
        text = re.sub(r'(href|src)="/(?!/)', r'\1="', text)
        text = text.replace('href=""', 'href="./"')
        not_found.write_text(text, encoding="utf-8")

    print(f"{replaced} diagramas substituídos em {len(pages)} páginas")
    if missing:
        print("Sem SVG (ficaram como Mermaid no cliente):", file=sys.stderr)
        for item in sorted(missing):
            print("  " + item, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
