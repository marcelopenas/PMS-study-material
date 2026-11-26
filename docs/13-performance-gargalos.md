# Performance e gargalos

<span class="study-tag prova">prova</span><span class="study-tag projeto">projeto</span>

O projeto não supõe que escala: ele mede, erra, corrige e mede de novo. A história do pool de conexões é o exemplo mais claro, porque mostra o gargalo saindo do banco e reaparecendo em outro ponto.

!!! quote "Princípio"
    Um componente pode continuar sendo o gargalo e ainda assim passar: o objetivo não é remover todo gargalo, é manter cada um **abaixo do requisito** ou tornar sua falha segura e observável.

---

## 1. Método antes de ferramenta

| Etapa | Pergunta | Artefato |
| --- | --- | --- |
| Objetivo | Qual carga preciso suportar? | taxa alvo, latência, erro |
| Cenário | Qual fluxo representa o usuário? | catálogo, login, pedido, conversão |
| Modelo de carga | VUs ou taxa de chegada? | k6 com `RATE` (aberto) |
| Ambiente | Onde e com qual versão? | SHA, nós, réplicas, região |
| Métricas | O que medir? | p50/p95/p99, erros, CPU, pool, HPA |
| Interpretação | O que limita? | gargalo, headroom, próximo passo |
| Repetição | É estável? | múltiplas execuções |

### Modelo aberto × fechado

| Modelo | Como | Efeito |
| --- | --- | --- |
| **Fechado** (VUs) | N usuários em loop | Se o servidor fica lento, a taxa cai — esconde saturação |
| **Aberto** (taxa) | Chegadas por segundo fixas | Mantém pressão; expõe fila e descarte |

k6 com `RATE` é modelo aberto: ele tenta 400 req/s mesmo que o servidor não acompanhe. Por isso o relatório mostra **iterações descartadas** — e por isso a taxa medida (299,6/s) é um **limite inferior**, não a capacidade real.

### As métricas que contam a história

| Métrica | Por quê |
| --- | --- |
| p50 / p95 / p99 | Média esconde cauda; p95 é o SLO do projeto |
| Taxa de erro por status | 5xx real × 4xx de cliente |
| Throughput efetivo | req/s concluídas, não tentadas |
| CPU/memória por pod | Saturação e throttling |
| Réplicas e HPA | A escala reagiu? Atingiu o teto? |
| Conexões do banco | O limite silencioso |
| Pool (active/idle/waiting) | Onde a thread espera |
| Nós e pods Pending | O cluster acompanhou? |
| Drop do gerador | O teste ou o servidor é o limite? |

!!! warning "Aquecimento e JIT"
    A primeira execução do fluxo autenticado teve p95 de 1,13 s e p99 de 4,16 s por causa de cold start/JIT. As execuções aquecidas caíram para 634 ms e, numa repetição limpa, 48 ms. **Sempre descarte o warm-up ou reporte-o separadamente.**

---

## 2. Capacidade: a conta antes do teste

Planejamento do projeto (não medição):

- 1 usuário ativo ≈ 0,2 req/s (uma chamada a cada 5 s).
- 1 requisição ≈ 10 ms de CPU (5 ms leitura, 25–50 ms escrita).
- HPA: 70% de 250m = 175m por pod; 6 serviços × 2 réplicas = 2,1 vCPU de gatilho.
- `t3.medium` alocável ≈ 1,93 vCPU; sistema ≈ 0,8 vCPU nos nós de base.
- RDS `db.t4g.micro`: 112 conexões.

| Checkpoint | CPU da app | Réplicas/serviço | req/s @10 ms | Usuários |
| --- | ---: | ---: | ---: | ---: |
| HPA começa a escalar | 2,1 cores | 2 → 3 | ~210 | ~1.050 |
| Baseline de 2 nós | 2,1 cores | 2 | ~210 | ~1.050 |
| Teto de conexões (pool 10) | — | ~3,7 | ~370 | ~1.850 |
| Máximo do HPA, 6 nós | 6,3 cores | 6 | ~630 | ~3.150 |

$$req/s = \frac{cpu\_cores}{cpu\_segundos\_por\_requisição}$$

!!! tip "Por que 70% e não 100%?"
    A utilização de fila cresce de forma não linear perto de 100% (lei de Little/teoria de filas). Um alvo de 70% deixa headroom para picos e para o tempo de subida de novos pods. A 95% de utilização, pequenas variações explodem a latência.

---

## 3. A experiência de 21/11

**Ambiente:** AWS `730335608828`, `us-east-1`, EKS `platform`, Git `b8fe3c3`, imagens `b8fe3c3`, 3 × `t3.medium`, 6 Deployments com 2 réplicas. Gateway acessado por `kubectl port-forward svc/gateway 18080:8080`. Fluxo **somente leitura** de catálogo (`GET /api/products`), não é checkout autenticado.

### Os quatro runs

| Run | Pool/pod | Alvo | Requisições | Throughput | Erros | p95 | p50 | Drop |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Baseline | 10 | 50 req/s | 5.984 | 49,8/s | 0% | 313 ms | 192 ms | 17 |
| Alto, original | 10 | 400 req/s | 91.951 | 382,7/s | 0% | 602 ms | 155 ms | 4.049 |
| Alto, pool 5 | 5 | 400 req/s | 25.282 | 209,8/s | **0,42%** (107) | 2,21 s | 588 ms | 22.719 |
| Alto, pool 8 | 8 | 400 req/s | 36.071 | 299,6/s | 0% | 1,25 s | 299 ms | 11.930 |

### O que aconteceu, em narrativa

1. **Baseline (50 req/s).** Tudo confortável: p95 313 ms, zero erro. O HPA nem sai do mínimo. É o retrato do dia a dia, não uma medida de capacidade.
2. **Pool 10 a 400 req/s.** O Product escala para 6 réplicas e o throughput chega a 382,7/s **sem erro HTTP**. Parece sucesso. Mas o RDS registra 70–71 conexões e, depois do teste, **dois pods de Product entram em crash-loop** com `remaining connection slots are reserved`. O "zero erro" era sorte temporal: a falha apareceu no startup seguinte.
3. **Pool 5.** A conexão com o banco deixa de estourar, mas o gargalo vai **para dentro do pod**: Hikari com `total=5, active=5, idle=0, waiting=62` e timeouts de 3 s. Resultado: 107 respostas 5xx reais (0,42%), p95 2,21 s e throughput de apenas 209,8/s. Corrigir um limite piorou o outro.
4. **Pool 8.** O equilíbrio: 299,6/s, **zero erro**, p95 1,25 s, Product 6/6 sem restart, RDS em 52/112 conexões. O banco tem folga; a latência, não.

!!! danger "O que o teste mostrou"
    "Zero erros" não prova estabilidade. O pool 10 teve zero erros **durante** o teste e derrubou pods **depois**. Um teste precisa observar o **pós-condição** (restarts, conexões residuais, pods prontos), não só o relatório do k6.

### HPA e nós

| Hora (UTC) | Nós | Gateway | Product |
| --- | ---: | ---: | ---: |
| 02:54:44 | 3 | 2 | 4 |
| 02:55:00 | 3 | 2 | 5 |
| 02:55:45 | 3 | 3 | 6 |
| 02:57:30 | 3 | 3 | 6 |
| 03:16:00 | 3 | 3 | 6 |

Product bate `maxReplicas: 6`; Gateway chega a 3; Account, Auth, Order e Exchange ficam em 2. O número de nós **não muda**: o terceiro nó já existia desde o rollout, então o Cluster Autoscaler não teve o que fazer.

### O gargalo final

| Recurso | Medição | Leitura |
| --- | --- | --- |
| Product | 6/6 réplicas, p95 1,25 s a ~300 req/s | Teto do HPA |
| Gateway | 3 réplicas, ~100% da request | CPU sob pressão |
| RDS | 52/112 conexões, CPU ~15% | **Não é o gargalo** |
| Nós | 3, sem evento do CA | CPU dos nós é o teto físico |
| k6 | 11.930 drops com `MAX_VUS=200` | Servidor saturou antes do gerador? Ambíguo |

**Conclusão documentada:** o teto é o `maxReplicas` do Product + CPU dos nós. O banco tem headroom. Próximos passos: subir o máximo do HPA e do node group, ou reduzir o custo de CPU por requisição. Ainda assim, p95 > 1 s viola a meta de 300 ms — capacidade sem latência não é SLO.

---

## 4. A matemática do pool

$$conexões_{pior\ caso} = réplicas \times pool \times serviços_{BD}$$

| Pool | 2 réplicas × 3 serviços | 6 réplicas × 3 serviços | Limite 112 |
| ---: | ---: | ---: | --- |
| 5 | 30 | 90 | cabe |
| 8 | 48 | **144** | estoura no pior caso |
| 10 | 60 | 180 | estoura muito |

Mas o Hikari abre conexões **sob demanda**; por isso a medição com pool 8 ficou em 52, não 144. O risco aparece quando todos os serviços escalam ao mesmo tempo — exatamente o cenário de um pico.

!!! example "Dimensionamento correto"
    Se o RDS permite 112 e há 3 serviços de banco com HPA máximo 6:
    $$pool \le \frac{112}{3 \times 6} \approx 6{,}2$$
    Um pool de 6 seria o máximo seguro. O projeto reteve 8 e limitou o HPA a 6 — uma escolha que funciona no cenário medido, mas não no pior caso simultâneo. Vale dizer isso: é maturidade, não fraqueza.

### Pool pequeno × grande

| Pool pequeno | Pool grande |
| --- | --- |
| Protege o banco | Arrisca slots do RDS |
| Filas e timeouts no pod | Mais paralelismo por pod |
| p95 sobe rápido | p95 melhor até saturar o banco |
| Bom para muitos pods | Bom para poucos pods |

O ponto ótimo é uma função de `max_connections`, número de serviços, réplicas e tempo de transação. Não existe "pool 10 é bom".

---

## 5. Fluxo autenticado (escrita)

Executado no Compose local, não em AWS:

| Run | Carga | Pedidos | Erros | p95 | p99 |
| --- | --- | ---: | ---: | ---: | ---: |
| Warm-up | 5 pedidos/s, 1 min | 296 | 0 | 1,13 s | 4,16 s |
| Warm | 5 pedidos/s, 2 min | 601 | 0 | 634 ms | 1,05 s |
| Rerun limpo | 5 pedidos/s, 1 min | 300 | 0 | **48 ms** | 378 ms |

O caminho de escrita é **mais pesado** (transação, chamada ao Product, validação), mas a 5/s fica bem abaixo do SLO de 800 ms depois de aquecido. O p99 alto no warm-up é cold start/JIT e agente OTel.

!!! warning "O que esse teste não prova"
    Não prova capacidade de escrita em AWS, nem concorrência alta, nem falha do Exchange, nem idempotência sob retry. A documentação lista essas lacunas, e listá-las com honestidade conta a favor.

---

## 6. Testes que faltam (e como fazer)

| Cenário | Como | O que observaria |
| --- | --- | --- |
| **Stress** | Subir taxa até o erro | Ponto de saturação real |
| **Spike** | 50 → 400 em 10 s | Tempo de reação do HPA/CA |
| **Soak** | 100 req/s por 4 h | Vazamento, GC, conexões |
| **Breakpoint** | Degraus de 50 em 50 | Curva latência × carga |
| **Falha do provedor** | Toxiproxy/latência no mock | Breaker, fallback, 5xx |
| **Falha de pod** | `kubectl delete pod` | Readiness, MTTR |
| **Drain de nó** | `kubectl drain` | PDB, realocação |
| **Failover RDS** | Multi-AZ (quando houver) | RTO/RPO reais |

```bash
k6 run --env BASE_URL=http://localhost:8080 \
  --env RATE=50 --env DURATION=2m tests/k6/platform.js

k6 run --env BASE_URL=http://localhost:18080 \
  --env PATHS=/products --env RATE=400 --env DURATION=4m \
  tests/k6/platform.js
```

!!! tip "Registre o contexto"
    SHA, tags de imagem, nós, réplicas, região, `RATE`, `DURATION`, JSON do k6, `kubectl top pods`, timeline de HPA/nós, conexões do RDS. Sem isso, o número não é reproduzível — e não vale como evidência.

---

## 7. Lei de Little e a intuição de fila

$$L = \lambda W$$

Requisições em andamento = taxa × tempo no sistema. Com 60 req/s e 3 s por chamada, 180 threads estão presas. Se o pool tem 200, sobram 20 para todo o resto — a falha em cascata do capítulo 9.

A latência de fila cresce com a utilização $\rho$:

$$W \approx \frac{S}{1-\rho}$$

Com serviço de 100 ms: a 50% de utilização, ~200 ms; a 80%, ~500 ms; a 90%, ~1 s; a 95%, ~2 s. É por isso que o HPA mira 70% e por que "CPU em 70%" já é um sinal de atenção, não de folga.

---

## 8. Como responder

**"Qual é o gargalo do sistema?"**
> Na leitura de catálogo, o teto medido é o `maxReplicas: 6` do Product e a CPU dos nós, não o banco: 299,6 req/s, p95 1,25 s, RDS em 52/112 e ~15% de CPU. Antes do tuning, o gargalo era o pool de conexões: pool 10 estourou slots e derrubou pods; pool 5 estourou o Hikari; pool 8 estabilizou.

**"Por que não aumentar o pool para 20?"**
> Porque 3 serviços × 6 réplicas × 20 = 360 conexões, muito acima de 112. O pool precisa ser dimensionado pelo banco, não pela vontade de paralelismo. A alternativa é RDS maior ou PgBouncer.

**"O teste prova que aguentam 300 req/s?"**
> Prova que o servidor sustentou ~300 req/s de leitura com zero erro naquela configuração. Não prova escrita em AWS, nem picos, nem falha de dependência, e o gerador descartou 11.930 iterações — então é um limite inferior. A meta de p95 300 ms não foi cumprida.

**"O que faria primeiro?"**
> Um teste de breakpoint para achar a curva real, depois elevar HPA/node group e reduzir CPU por requisição. Em paralelo, pool ≤ 6 e um teste de falha do provedor de câmbio, que é a dependência externa não exercitada.

---

## Ordem de uma campanha

<div class="study-order" data-items="Definir objetivo, SLO e taxa alvo|Escolher o fluxo representativo|Registrar SHA, imagens, nós e réplicas|Rodar baseline e warm-up|Subir a carga em degraus|Observar p95, erros, pool, HPA e nós|Interpretar o gargalo e registrar evidência|Repetir após a correção" data-prompt="Ordene uma campanha de load test:"></div>

<div class="study-calc" data-answer="6" data-tolerance="0.5" data-unit="conexões por pod (máx.)">
  <p class="q">Com RDS de 112 conexões, 3 serviços de banco e HPA máximo de 6 réplicas, qual é o pool máximo seguro por pod?</p>
  <input type="number" step="0.1" inputmode="decimal" placeholder="pool">
  <button type="button">Conferir</button>
  <p class="explain">112 ÷ (3 × 6) = 6,22. Um pool de 6 cabe no pior caso; 8 só funciona porque o Hikari abre conexões sob demanda e todos os serviços não maximizam ao mesmo tempo.</p>
</div>

---

## Checkpoint

<div data-study-score></div>

<div class="study-quiz" data-answer="b">
  <p class="q">1. Por que o run com pool 10 foi considerado instável mesmo com 0% de erro HTTP?</p>
  <ul class="options">
    <li data-key="a">Porque o p95 foi maior que 1 s.</li>
    <li data-key="b">Porque ele consumiu os slots do RDS e dois pods de Product entraram em crash-loop depois do teste.</li>
    <li data-key="c">Porque o Gateway não escalou.</li>
    <li data-key="d">Porque o k6 descartou iterações.</li>
  </ul>
  <p class="explain">O erro apareceu na pós-condição: sem conexões para iniciar, pods falharam. Um teste precisa verificar restarts e conexões residuais, não só o relatório.</p>
</div>

<div class="study-quiz" data-answer="c">
  <p class="q">2. O que o pool 5 demonstrou?</p>
  <ul class="options">
    <li data-key="a">Que menos conexões sempre melhora a latência.</li>
    <li data-key="b">Que o banco era o gargalo.</li>
    <li data-key="c">Que o gargalo migrou para o Hikari dentro do pod: fila, timeouts e 107 erros 5xx.</li>
    <li data-key="d">Que o HPA não funciona com pool pequeno.</li>
  </ul>
  <p class="explain">Hikari com active=5, idle=0, waiting=62 e timeout de 3 s. O throughput caiu para 209,8/s e o p95 subiu a 2,21 s. Reduzir demais só move a fila.</p>
</div>

<div class="study-quiz" data-answer="d">
  <p class="q">3. Qual afirmação sobre o resultado final é correta?</p>
  <ul class="options">
    <li data-key="a">O RDS estava saturado com 52/112 conexões.</li>
    <li data-key="b">O Cluster Autoscaler adicionou nós durante o pico.</li>
    <li data-key="c">O sistema atingiu o SLO de p95 300 ms.</li>
    <li data-key="d">Product ficou em 6/6, p95 1,25 s, zero erros; o teto é HPA/nós, e o SLO de latência não foi cumprido.</li>
  </ul>
  <p class="explain">RDS tinha folga; o CA não adicionou nó (já havia 3); p95 1,25 s > 300 ms. Capacidade sem latência não é conformidade com SLO.</p>
</div>

<div class="study-quiz" data-answer="a">
  <p class="q">4. O que significa o k6 ter descartado 11.930 iterações?</p>
  <ul class="options">
    <li data-key="a">Que o gerador não conseguiu manter a taxa alvo; o throughput medido é um limite inferior, não a capacidade máxima do servidor.</li>
    <li data-key="b">Que o servidor respondeu 11.930 erros 5xx.</li>
    <li data-key="c">Que o banco recusou 11.930 conexões.</li>
    <li data-key="d">Que o HPA não escalou.</li>
  </ul>
  <p class="explain">Modelo aberto com VUs limitados: se o servidor segura, as iterações não iniciam. O número medido subestima a capacidade; para medi-la, aumente VUs/máquina geradora.</p>
</div>

## Checklist

<div data-study-progress></div>

<label class="study-check"><input type="checkbox" data-key="p-method"> Distingo teste aberto de fechado e sei o que o drop significa.</label>
<label class="study-check"><input type="checkbox" data-key="p-story"> Conto os quatro runs com números e a lição de cada um.</label>
<label class="study-check"><input type="checkbox" data-key="p-pool"> Calculo o pool máximo por `max_connections ÷ (serviços × réplicas)`.</label>
<label class="study-check"><input type="checkbox" data-key="p-gargalo"> Explico por que o gargalo final não é o banco.</label>
<label class="study-check"><input type="checkbox" data-key="p-limits"> Listo os testes que faltam e o primeiro que faria.</label>

!!! info "Continue"
    A experiência do usuário não termina na API: [Frontend e entrega](14-frontend.md). Os testes que faltam (write AWS, falha do provedor, soak, restore) estão em [O que não foi implementado](18-lacunas-e-evolucao.md).
