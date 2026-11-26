#!/usr/bin/env python3
"""Gera docs/19-respostas.md a partir dos quizzes/atividades dos capítulos.

Rode depois de editar perguntas, alternativas ou explicações:
    python3 scripts/build_answers.py

O arquivo gerado é estático e versionado; o build do site não depende deste
script.
"""

from __future__ import annotations

import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "19-respostas.md"

ORDER = [
    ("index.md", "Início"),
    ("00-mapa.md", "00 — Mapa da matéria"),
    ("01-projeto.md", "01 — O projeto por dentro"),
    ("02-distribuidos.md", "02 — Sistemas distribuídos"),
    ("03-containers.md", "03 — Containers e Compose"),
    ("04-apis.md", "04 — APIs e contratos"),
    ("05-microsservicos-ddd.md", "05 — Microsserviços e DDD"),
    ("06-arquiteturas.md", "06 — Arquiteturas de software"),
    ("07-seguranca.md", "07 — Segurança e identidade"),
    ("08-eventos.md", "08 — Eventos e mensageria"),
    ("09-confiabilidade.md", "09 — Confiabilidade e SLOs"),
    ("10-kubernetes-ha.md", "10 — Kubernetes e alta disponibilidade"),
    ("11-observabilidade.md", "11 — Observabilidade"),
    ("12-nuvem-custos.md", "12 — Nuvem, deploy e custos"),
    ("13-performance-gargalos.md", "13 — Performance e gargalos"),
    ("14-frontend.md", "14 — Frontend e entrega"),
    ("15-estudo-de-caso.md", "15 — Estudo de caso ponta a ponta"),
    ("16-simulado.md", "16 — Simulado e banco de questões"),
    ("17-glossario-cheatsheet.md", "17 — Glossário e cheatsheet"),
    ("18-lacunas-e-evolucao.md", "18 — O que não foi implementado"),
]

QUIZ_RE = re.compile(r'<div class="study-quiz" data-answer="([^"]+)">(.*?)</div>', re.S)
CALC_RE = re.compile(r'<div class="study-calc"([^>]*)>(.*?)</div>', re.S)
ORDER_RE = re.compile(r'<div class="study-order"([^>]*)></div>', re.S)
FLASH_RE = re.compile(
    r'<div class="flash-card">\s*<div class="flash-front">(.*?)</div>\s*<div class="flash-back">(.*?)</div>\s*</div>',
    re.S,
)
DETAIL_RE = re.compile(r'^\?\?\? note "([^"]+)"\n((?:[ \t]{4}.*\n|\n)+)', re.M)
QA_SECTION_RE = re.compile(r'^## .*(?:Como responder|Defesa oral|Como falar de lacunas).*$', re.M)
QA_RE = re.compile(r'^\*\*(".*?"|“.*?”|\d+\..*?)\*\*\s*\n((?:>.*(?:\n|$))+)', re.M)


def clean(text: str) -> str:
    text = html.unescape(text)
    text = re.sub(r"<br\s*/?>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"[ \t]+", " ", text).strip()


def attrs(raw: str) -> dict[str, str]:
    return {k: html.unescape(v) for k, v in re.findall(r'data-([a-z-]+)="([^"]*)"', raw)}


def extract(path: Path):
    text = path.read_text(encoding="utf-8")
    quizzes = []
    for answer, body in QUIZ_RE.findall(text):
        question = re.search(r'<p class="q">(.*?)</p>', body, re.S)
        options = re.findall(r'<li data-key="([^"]+)">(.*?)</li>', body, re.S)
        explain = re.search(r'<p class="explain">(.*?)</p>', body, re.S)
        if not question or not options:
            continue
        quizzes.append(
            {
                "answer": answer,
                "question": re.sub(r"^\d+\.\s*", "", clean(question.group(1))),
                "options": [(key, clean(value)) for key, value in options],
                "explain": clean(explain.group(1)) if explain else "",
            }
        )

    calcs = []
    for raw_attrs, body in CALC_RE.findall(text):
        meta = attrs(raw_attrs)
        question = re.search(r'<p class="q">(.*?)</p>', body, re.S)
        explain = re.search(r'<p class="explain">(.*?)</p>', body, re.S)
        calcs.append(
            {
                "answer": meta.get("answer", ""),
                "unit": meta.get("unit", ""),
                "question": clean(question.group(1)) if question else "",
                "explain": clean(explain.group(1)) if explain else "",
            }
        )

    orders = []
    for raw_attrs in ORDER_RE.findall(text):
        meta = attrs(raw_attrs)
        items = [item.strip() for item in meta.get("items", "").split("|") if item.strip()]
        if items:
            orders.append({"prompt": meta.get("prompt", ""), "items": items})

    flashcards = [
        {"front": clean(front), "back": clean(back)}
        for front, back in FLASH_RE.findall(text)
    ]

    details = []
    for title, body in DETAIL_RE.findall(text):
        lines = []
        for line in body.splitlines():
            lines.append(line[4:] if line.startswith("    ") else line)
        content = "\n".join(lines).strip()
        if content:
            details.append({"title": html.unescape(title), "content": content})

    qa = []
    for section in QA_SECTION_RE.finditer(text):
        start = section.end()
        following = re.search(r"^## ", text[start:], re.M)
        block = text[start : start + following.start()] if following else text[start:]
        for question, answer in QA_RE.findall(block):
            answer_lines = []
            for line in answer.splitlines():
                if line.startswith(">"):
                    answer_lines.append(line[1:].strip())
            answer_text = "\n".join(answer_lines).strip()
            if answer_text:
                qa.append(
                    {
                        "question": clean(question.strip().strip('"“”')),
                        "answer": answer_text,
                    }
                )

    return quizzes, calcs, orders, flashcards, details, qa


def main() -> int:
    sections = []
    counts = {"quiz": 0, "calc": 0, "order": 0, "flash": 0, "detail": 0}

    for filename, label in ORDER:
        path = DOCS / filename
        if not path.exists():
            continue
        quizzes, calcs, orders, flashcards, details, qa = extract(path)
        if not any([quizzes, calcs, orders, flashcards, details, qa]):
            continue
        sections.append((filename, label, quizzes, calcs, orders, flashcards, details, qa))
        counts["quiz"] += len(quizzes)
        counts["calc"] += len(calcs)
        counts["order"] += len(orders)
        counts["flash"] += len(flashcards)
        counts["detail"] += len(details)

    out = [
        "# Respostas",
        "",
        '!!! warning "Contém spoilers"',
        "    Esta página reúne as respostas dos quizzes, cálculos, ordenações e flashcards. "
        "Tente responder antes de consultar; usar a resposta como ponto de partida costuma render mais do que a leitura passiva.",
        "",
        "As questões dissertativas continuam nos capítulos, na seção **Como responder**, porque a resposta depende do contexto. "
        "Para deixar o gabarito completo, as respostas de arguição também foram copiadas para o fim desta página, "
        "junto com as abertas do simulado e o roteiro do exercício de desenho.",
        "",
        "## Índice",
        "",
        "| Capítulo | Quizzes | Cálculos | Ordenações | Flashcards |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]
    for filename, label, quizzes, calcs, orders, flashcards, _, _ in sections:
        out.append(
            f"| [{label}]({filename}) | {len(quizzes)} | {len(calcs)} | {len(orders)} | {len(flashcards)} |"
        )
    out += [
        "",
        f"Total: **{counts['quiz']} quizzes**, **{counts['calc']} cálculos**, "
        f"**{counts['order']} ordenações** e **{counts['flash']} flashcards**.",
        "",
        "---",
        "",
    ]

    for filename, label, quizzes, calcs, orders, flashcards, details, _qa in sections:
        out += [f"## {label}", "", f"[Voltar ao capítulo]({filename})", ""]

        if quizzes:
            out += ["**Quizzes**", ""]
            for index, quiz in enumerate(quizzes, start=1):
                correct = dict(quiz["options"]).get(quiz["answer"], "")
                out += [
                    f"**Quiz {index}.** {quiz['question']}",
                    "",
                    f"**Resposta.** `{quiz['answer']}` — {correct}",
                    "",
                ]
                if quiz["explain"]:
                    out += [f"**Comentário.** {quiz['explain']}", ""]

        if calcs:
            out += ["**Cálculos**", ""]
            for index, calc in enumerate(calcs, start=1):
                value = calc["answer"].replace(".", ",")
                unit = f" {calc['unit']}" if calc["unit"] else ""
                out += [
                    f"**Cálculo {index}.** {calc['question']}",
                    "",
                    f"**Resposta.** {value}{unit}",
                    "",
                ]
                if calc["explain"]:
                    out += [f"**Conta.** {calc['explain']}", ""]

        if orders:
            out += ["**Ordens corretas**", ""]
            for index, order in enumerate(orders, start=1):
                if order["prompt"]:
                    out += [f"**Ordenação {index}.** {order['prompt']}", ""]
                else:
                    out += [f"**Ordenação {index}.**", ""]
                out += [f"{i}. {item}" for i, item in enumerate(order["items"], start=1)]
                out += [""]

        if flashcards:
            out += ["**Flashcards**", ""]
            for index, card in enumerate(flashcards, start=1):
                out += [
                    f"**Cartão {index}.** {card['front']}",
                    "",
                    f"**Verso.** {card['back']}",
                    "",
                ]

        if details:
            out += ["**Respostas abertas e roteiro**", ""]
            for detail in details:
                out += [f"**{detail['title']}**", "", detail["content"], ""]

        out += ["---", ""]

    out += [
        "## Perguntas de arguição",
        "",
        "As respostas abaixo vêm das seções **Como responder**, **Defesa oral** e **Como falar de lacunas** de cada capítulo. "
        "Foram copiadas para cá para deixar o gabarito completo; o contexto original continua no capítulo.",
        "",
    ]
    for filename, label, _, _, _, _, _, qa in sections:
        if not qa:
            continue
        out += [f"### {label}", "", f"[Voltar ao capítulo]({filename})", ""]
        for pair in qa:
            out += [f"**{pair['question']}**", "", pair["answer"], ""]
    out += ["---", ""]

    OUT.write_text("\n".join(out).rstrip() + "\n", encoding="utf-8")
    print(f"gerado {OUT.relative_to(ROOT)} com {counts}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
