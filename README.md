# Guia de estudo — Plataformas, Microsserviços, DevOps e APIs

Material de estudo para a prova final, escrito em português, combinando:

- as aulas de **2026.2** do curso *Platforms, Microservices, DevOps and APIs* (Insper);
- a documentação do projeto **Microsserv52** (`microsserv52.github.io/platform`), usada como caso real.

O site é gerado com **Zensical** (o mesmo gerador da documentação do projeto) e inclui componentes interativos em JavaScript puro: quizzes com correção e explicação, ordenação por arrastar/setas, respostas numéricas e flashcards. Tudo funciona offline no bundle gerado.

Além da teoria e do caso do projeto, o capítulo **18 — O que não foi implementado** cobre cada lacuna (Kafka, cache/Cart, Multi-AZ, mTLS/NetworkPolicy, WAF, GitOps, idempotência, DR etc.) com **o que é, o benefício, por que não foi usado, o que seria necessário e como medir**.

---

## Como servir

### Opção 1 — recomendada: build processado + servidor estático

```bash
./serve.sh              # build + http.server em http://localhost:8000/
PORT=8080 ./serve.sh    # outra porta
```

O `serve.sh` roda o `build.sh`, que:

1. gera o site com Zensical;
2. troca os blocos Mermaid por **SVGs locais claro/escuro**;
3. serve o bundle final.

Sem live reload: edite e rode de novo. O resultado fica em `site/`.

### Opção 2 — desenvolvimento com live reload

```bash
./serve.sh --dev
```

Usa `zensical serve`. Nesse modo os diagramas ainda são renderizados pelo Mermaid no cliente (carrega ~5,4 MB do unpkg), então é mais lento que o bundle processado. Use apenas enquanto edita texto; para medir/entregar, use a opção 1.

### Opção 3 — manual

```bash
uv sync                     # cria .venv e instala o Zensical (uma vez)
./build.sh                  # Zensical + postprocessamento dos diagramas
python3 -m http.server 8080 --directory site
```

> **Não rode só `zensical build`.**
> O comando puro deixa `<pre class="mermaid">` no HTML; o bundle então baixa o Mermaid do CDN e renderiza todos os diagramas no navegador. O `build.sh` faz o postprocessamento que usa os SVGs versionados e elimina esse download.

O bundle em `site/` é autocontido (exceto links externos) e pode ser publicado em GitHub Pages, S3, Nginx ou qualquer host estático.

---

## Publicar no GitHub Pages

O workflow está em `.github/workflows/pages.yml`. Ele:

1. instala o Zensical;
2. calcula a URL do Pages a partir do repositório;
3. roda `./build.sh` (inclui os SVGs estáticos);
4. publica `site/` como artifact do Pages.

### Passos

1. Crie um repositório **contendo o conteúdo desta pasta** (o `zensical.toml` e `docs/` na raiz do repo — não a pasta pai `Plataformas_Microservicos`).
2. Faça push da branch `main` (ou `master`).
3. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Acompanhe em **Actions → Publish study material to GitHub Pages**. Também pode rodar manualmente por **Run workflow**.

A URL fica:

- `https://<owner>.github.io/<repo>/` para um repositório de projeto;
- `https://<owner>.github.io/` se o repositório for `<owner>.github.io`.

O workflow ajusta `site_url` automaticamente para essa URL. Se você usar um **domínio customizado**, troque o `SITE_URL` no step “Configure site URL” por `https://seu-dominio/` (e configure o domínio em Settings → Pages).

> **Não é necessário Node/Chromium no CI.** Os SVGs dos diagramas estão versionados em `docs/assets/diagrams/`; o `build.sh` só troca os blocos Mermaid pelas imagens.
>
> O workflow fixa `zensical==0.0.74` para builds reproduzíveis. Ao atualizar o Zensical localmente, atualize também essa linha.

---

## Diagramas: por que são SVGs estáticos

O Zensical carrega o Mermaid sob demanda de `unpkg.com` quando encontra um diagrama: **~5,4 MB** de JavaScript, além de renderizar todos os diagramas da página no carregamento. Em um teste local isso colocava o carregamento em 1,5–3 s e baixava 6,3 MB por página.

A solução adotada:

| Etapa | O que faz |
| --- | --- |
| `python3 scripts/render_diagrams.py` | renderiza cada bloco Mermaid em `<hash>-light.svg` e `<hash>-dark.svg` |
| `docs/assets/diagrams/` | guarda os SVGs versionados + `manifest.json` |
| `python3 scripts/postprocess_diagrams.py` | troca cada `<pre class="mermaid">` do HTML gerado por `<figure><img></figure>` |
| CSS | mostra a variante clara ou escura conforme `data-md-color-scheme` |

Resultado medido no Chromium (cache frio): **~800 KB e 0,2–0,8 s** por página, sem requests ao unpkg e sem Google Fonts.

### Editar um diagrama

1. Altere o bloco ` ```mermaid ` no Markdown.
2. Regenere os SVGs (só os novos; use `--force` para todos):

```bash
MMDC=/caminho/para/mmdc \
PUPPETEER_CONFIG=/caminho/para/puppeteer.json \
python3 scripts/render_diagrams.py
```

3. Rode `./build.sh`. Se esquecer o passo 2, o postprocessamento avisa que faltam SVGs e deixa aquele diagrama no modo Mermaid (fallback).

O `mmdc` vem de `@mermaid-js/mermaid-cli` (Node). Exemplo de `puppeteer.json` para usar o Chromium do sistema:

```json
{
  "executablePath": "/usr/bin/chromium",
  "args": ["--no-sandbox", "--disable-dev-shm-usage"]
}
```

Os SVGs são versionados justamente para que **quem só quer servir o site não precise de Node/Chromium**.

---

## Estrutura

```text
study-material/
├── zensical.toml              # navegação, tema, extensões Markdown
├── pyproject.toml             # dependência do Zensical
├── build.sh                   # Zensical + postprocessamento dos diagramas
├── serve.sh                   # build + http.server (ou --dev)
├── scripts/
│   ├── render_diagrams.py     # Mermaid → SVG claro/escuro (opcional, requer mmdc)
│   └── postprocess_diagrams.py# troca <pre class="mermaid"> por <img>
├── docs/
│   ├── index.md               # apresentação + diagnóstico + checklist
│   ├── 00-mapa.md             # aulas ↔ capítulos ↔ projeto, plano de 7 sessões
│   ├── 01-projeto.md          # arquitetura, submodules, workflow, limitações
│   ├── 02-distribuidos.md     # falácias, CAP/PACELC, consenso, disponibilidade
│   ├── 03-containers.md       # namespaces/cgroups, Dockerfile, Compose
│   ├── 04-apis.md             # REST, status, idempotência, OpenAPI, contratos
│   ├── 05-microsservicos-ddd.md
│   ├── 06-arquiteturas.md     # SOLID, Clean, Hexagonal, CQRS
│   ├── 07-seguranca.md        # OAuth2/OIDC, JWT, Zero Trust, mTLS, segredos
│   ├── 08-eventos.md          # Kafka, outbox, saga, DLQ, idempotência
│   ├── 09-confiabilidade.md   # SLI/SLO/SLA, budget, burn rate, padrões, caos
│   ├── 10-kubernetes-ha.md    # K8s, probes, HPA/CA, PDB, HA, falhas
│   ├── 11-observabilidade.md  # PromQL, logs, traces, OTel, stack LGTM
│   ├── 12-nuvem-custos.md     # IaaS→SaaS, EKS×ECS, Terraform, custos
│   ├── 13-performance-gargalos.md
│   ├── 14-frontend.md         # static export, CDN, sessão, PWA, Faro
│   ├── 15-estudo-de-caso.md   # narrativa, decisões, falhas, defesa oral
│   ├── 16-simulado.md         # 30 MCQ, cálculos, abertas, exercício
│   ├── 17-glossario-cheatsheet.md
│   ├── 18-lacunas-e-evolucao.md # o que não existe, benefício, por quê, adoção
│   ├── javascripts/study.js   # widgets (quiz, ordem, cálculo, flash, progresso)
│   ├── stylesheets/extra.css  # estilos dos widgets + diagramas claro/escuro
│   └── assets/
│       ├── logo.svg
│       └── diagrams/          # SVGs gerados + manifest.json
└── site/                      # gerado; não versionar
```

---

## Componentes interativos

### Quiz

```html
<div class="study-quiz" data-answer="b">
  <p class="q">Pergunta…</p>
  <ul class="options">
    <li data-key="a">Alternativa A</li>
    <li data-key="b">Alternativa B</li>
    <li data-key="c">Alternativa C</li>
  </ul>
  <p class="explain">Explicação exibida após a resposta.</p>
</div>
```

### Ordenação (drag-and-drop + setas para acessibilidade)

```html
<div class="study-order"
     data-items="Primeiro|Segundo|Terceiro"
     data-prompt="Ordene:"></div>
```

A ordem correta é a ordem declarada em `data-items`; o widget embaralha ao carregar.

### Resposta numérica

```html
<div class="study-calc" data-answer="40.32" data-tolerance="0.2" data-unit="minutos">
  <p class="q">Pergunta…</p>
  <input type="number" step="0.1" inputmode="decimal" placeholder="resposta">
  <button type="button">Conferir</button>
  <p class="explain">Conta e explicação.</p>
</div>
```

### Flashcards

```html
<div class="study-flash">
  <div class="flash-card">
    <div class="flash-front">Pergunta</div>
    <div class="flash-back">Resposta</div>
  </div>
</div>
```

### Checklist com progresso

```html
<div data-study-progress></div>
<label class="study-check">
  <input type="checkbox" data-key="identificador-unico"> Item revisado
</label>
```

O progresso e as respostas ficam em `localStorage` (chave `pm-study:*`). Recarregar a página zera apenas os quizzes; os checkboxes persistem.

---

## Fidelidade do conteúdo

- Números de carga, custo, SLO, topologia e configuração vêm da documentação do projeto e valem para a fotografia documentada (novembro/2026).
- O material distingue explicitamente **meta**, **medição** e **lacuna**. Exemplos: SLO de 99,5% é meta; 300 req/s a p95 1,25 s é medição; falha do provedor de câmbio é lacuna.
- O projeto **não** tem Kafka, Cart service, cache ativo, domínio customizado nem deploy contínuo. Isso é tratado como escopo declarado, não como sucesso inventado.
- As aulas têm versões em inglês e português; este guia usa a terminologia em português e mantém os termos técnicos consagrados.

---

## Publicar

O bundle em `site/` é autocontido. Exemplos:

```bash
# GitHub Pages (branch gh-pages, via ação ou manual)
# S3 + CloudFront
aws s3 sync site/ s3://<bucket>/ --delete
aws cloudfront create-invalidation --distribution-id <id> --paths '/*'
```

Não há backend, banco ou variável de ambiente em runtime. Os únicos recursos externos são os links para a documentação do projeto e para o site do curso.
