# Glossário e cheatsheet

<span class="study-tag prova">prova</span>

Revisão de véspera: definições curtas, fórmulas, números do projeto, comandos e frases úteis. Se algo aqui não estiver claro, volte ao capítulo correspondente.

---

## Fórmulas

| Fórmula | Uso |
| --- | --- |
| $A = MTTF/(MTTF+MTTR)$ | Disponibilidade |
| $A_{série} = \prod a_i$ | Componentes em série |
| $A_{paralelo} = 1-(1-a)^n$ | Réplicas independentes |
| $SLI = bons/válidos$ | Indicador |
| $Budget = 1-SLO$ | Orçamento de erro |
| $Burn = erro_{obs}/(1-SLO)$ | Taxa de consumo |
| $L = \lambda W$ | Lei de Little |
| $W \approx S/(1-\rho)$ | Latência de fila (aprox.) |
| $tentativas \times timeout + esperas \le prazo$ | Orçamento de timeout |
| $pool \le max\_conn/(serviços \times réplicas)$ | Dimensionamento de pool |
| $req/s = cores / cpu\_s\_por\_req$ | Capacidade por CPU |
| $wait_n = random(0, \min(c\,2^n, max))$ | Full jitter |

### Números que você deve saber de cor

| Item | Valor |
| --- | --- |
| 99,9% em 28 dias | 40,3 min |
| 99,5% em 28 dias | 3 h 22 min (201,6 min) |
| 99,9% em 1 ano | 8,77 h |
| 99,99% em 1 ano | 52,6 min |
| Quórum | ⌊n/2⌋+1 |
| 3 réplicas em série a 99,9% | ≈ 99,7% |
| HPA do projeto | 2–6, 70% de 250m = 175m |
| Gatilho agregado | 6 × 2 × 175m = 2,1 vCPU |
| Capacidade a 10 ms/req | 210 req/s |
| Usuários por req/s | ×5 (0,2 req/s por usuário) |
| RDS `db.t4g.micro` | 112 conexões |
| Pool retido | 8 por pod |
| Pior caso pool 8 × 3 × 6 | 144 conexões (acima de 112) |
| Baseline AWS | ≈ US$ 240/mês |
| Observabilidade | +1 nó, ≈ US$ 280/mês |
| Budget | US$ 150/mês |

---

## Glossário A–Z

| Termo | Definição em uma linha |
| --- | --- |
| **ACID** | Atomicidade, consistência, isolamento, durabilidade; transação local. |
| **ACL (anti-corruption layer)** | Tradução que impede o modelo externo de vazar para o domínio. |
| **Agregado** | Grupo de entidades com uma raiz que protege invariantes; unidade de persistência. |
| **Alertmanager/Grafana Alerting** | Roteia alertas para e-mail/Slack/pager. |
| **Alloy** | Coletor Grafana (OTLP, logs, Faro). |
| **At-least-once** | Entrega possível de duplicar; exige consumidor idempotente. |
| **Backoff exponencial** | Espera crescente entre retries; com jitter evita manada. |
| **BOLA/IDOR** | Autorização ausente no nível do objeto; OWASP API #1. |
| **Bounded context** | Fronteira onde um modelo é válido; candidato a serviço. |
| **Bulkhead** | Isolamento de recursos por dependência. |
| **Burn rate** | Velocidade de consumo do error budget. |
| **CaaS** | Containers como serviço (ECS, EKS, Cloud Run). |
| **CAP** | Em partição, escolha C ou A; P não é opcional. |
| **Cardinalidade** | Número de séries distintas; explosão derruba o Prometheus. |
| **CDN** | Cache geográfico na borda (CloudFront). |
| **Chaos engineering** | Experimentação controlada de falhas. |
| **Circuit breaker** | Closed/Open/Half-open; falha rápido. |
| **Clean Architecture** | Camadas concêntricas + Regra de Dependência. |
| **CLOB/BLOB** | Dados grandes; no projeto, imagem vai ao S3, não ao banco. |
| **Conformist** | Downstream adota o modelo upstream sem traduzir. |
| **Consistência eventual** | Réplicas convergem depois; janela de dados velhos. |
| **Conway (Lei de)** | Arquitetura espelha a comunicação da organização. |
| **CQRS** | Separação entre comandos (escrita) e consultas (leitura). |
| **CSRF** | Requisição forjada usando o cookie automático; mitigado com token + SameSite. |
| **Dead letter queue** | Tópico para mensagens que falharam definitivamente. |
| **Deployment** | Objeto K8s que versiona pods e faz rollout. |
| **DORA** | 4 métricas de entrega: frequência, lead time, falha, recuperação. |
| **Downstream/Upstream** | Quem depende / quem fornece o modelo. |
| **Error budget** | 1 − SLO; licença para arriscar. |
| **Event sourcing** | Estado como replay de eventos imutáveis. |
| **FaaS** | Função como serviço; cold start e cobrança por invocação. |
| **Flyway** | Migrações versionadas no banco. |
| **Faro** | Telemetria de browser (Grafana). |
| **Golden signals** | Latência, tráfego, erros, saturação. |
| **Half-open** | Estado do breaker que testa a recuperação. |
| **HikariCP** | Pool de conexões JDBC; `active/idle/waiting`. |
| **HPA** | Escala pods por métrica; usa request de CPU. |
| **Idempotência** | Repetir a operação tem o mesmo efeito que uma vez. |
| **IRSA** | IAM Roles for Service Accounts; credencial AWS por pod. |
| **JWT** | Token assinado e autocontido (`header.payload.signature`). |
| **Kustomize** | Overlays declarativos sobre um base, sem templates. |
| **Liveness** | “Processo travado?”; falha → restart. |
| **Little (Lei de)** | L = λW. |
| **Loki** | Logs indexados por labels. |
| **Mimir** | Métricas de longo prazo compatíveis com Prometheus. |
| **mTLS** | TLS mútuo; cliente e servidor provam identidade. |
| **NAT gateway** | Saída para internet em subnets privadas; custo fixo. |
| **NetworkPolicy** | Firewall L3/L4 entre pods; depende do CNI. |
| **Nível de Richardson** | 0 a 3; o projeto está no 2 (verbos/status). |
| **OIDC** | Identidade sobre OAuth; ID Token + UserInfo. |
| **Open Host Service** | API publicada e documentada para muitos consumidores. |
| **Outbox** | Tabela de eventos na mesma transação do negócio. |
| **PACELC** | Partição → A/C; else → latência/consistência. |
| **PaaS** | Código como serviço; plataforma cuida do runtime. |
| **PDB** | Limita interrupção voluntária (drain/upgrade). |
| **Playwright** | Testes de browser (frontends). |
| **PromQL** | Linguagem de consulta do Prometheus. |
| **Probe** | Startup/liveness/readiness. |
| **Quórum** | Maioria necessária para consenso. |
| **Raft** | Consenso com líder eleito e log replicado. |
| **Readiness** | “Pode receber tráfego?”; falha → sai dos endpoints. |
| **RED** | Rate, Errors, Duration. |
| **RPO/RTO** | Perda máxima de dados / tempo máximo de recuperação. |
| **Saga** | Transações locais + compensações. |
| **SLA** | Contrato com consequência (créditos). |
| **SLI** | Medida (razão de bons/válidos). |
| **SLO** | Meta interna em uma janela. |
| **SLO burn** | Consumo acelerado do budget. |
| **SPIFFE/SPIRE** | Identidade de workload e emissão de SVIDs. |
| **Submodule** | Ponteiro Git para um commit de outro repositório. |
| **Tail sampling** | Decisão de amostragem após o trace completo. |
| **Tempo** | Backend de traces (Grafana). |
| **Timeout** | Prazo por chamada; connect + read. |
| **Traceparent** | Header W3C com trace/span/flags. |
| **USE** | Utilization, Saturation, Errors. |
| **VPC** | Rede virtual isolada na AWS. |
| **Zero Trust** | Nunca confie na rede; verifique identidade e política sempre. |

---

## O projeto em variáveis

| Variável | Papel |
| --- | --- |
| `AUTH_URL`, `ACCOUNT_URL`, `PRODUCT_URL`, `ORDER_URL`, `EXCHANGE_URL` | URLs internas do cluster |
| `JWT_SECRET` | Assinatura HMAC; igual em quem valida |
| `INTERNAL_SERVICE_SECRET` | Chamadas internas protegidas |
| `SPRING_DATASOURCE_*` | Conexão JDBC |
| `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=8` | Pool |
| `SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT=5000` | Timeout do pool |
| `CACHE_ENABLED=false` | Cache desligado |
| `CACHE_REDIS_URL` | Endpoint Redis (não usado) |
| `ACCESS_TOKEN_EXPIRATION_SECONDS=900` | Vida do token |
| `SESSION_COOKIE_SECURE` / `SESSION_COOKIE_PATH=/api` | Cookie |
| `PRODUCT_IMAGE_MODE=s3` | Backend de imagem |
| `PRODUCT_IMAGE_S3_*` | Bucket, região, origem |
| `EXCHANGE_PROVIDER_URL` | Provedor de câmbio |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Alloy 4317 |
| `OTEL_TRACES_SAMPLER_ARG=0.2` | 20% head sampling |
| `NEXT_PUBLIC_API_BASE_URL=/api` | Frontend |
| `NEXT_PUBLIC_ENABLE_TELEMETRY` | Faro/Umami |

---

## Comandos

```bash
# documentação
uv sync && uv run zensical serve
uv run zensical build --clean

# stack local
cp .env.example .env
docker compose up --build -d
docker compose ps
docker compose logs -f gateway

# observabilidade local
scripts/observability-up.sh
curl -fsS http://localhost:9090/-/ready
curl -fsS http://localhost:3000/api/health

# kubernetes
kubectl apply -k k8s/overlays/aws
kubectl -n platform get deploy,hpa,pdb,pods -o wide
kubectl -n platform rollout status deploy/product
kubectl -n platform rollout undo deploy/product
kubectl -n platform logs deploy/gateway --tail=100
kubectl -n platform top pods
kubectl get nodes -L topology.kubernetes.io/zone

# carga
k6 run --env BASE_URL=http://localhost:8080 --env RATE=50 --env DURATION=2m tests/k6/platform.js

# AWS
aws sso login --profile platform
export AWS_PROFILE=platform
scripts/deploy-aws.sh --frontends
terraform -chdir=terraform/environments/aws plan

# rollback de imagem
kubectl -n platform set image deploy/order order=<registry>/order:<sha-anterior>
```

---

## Tabelas de decisão rápidas

### Consistência por dado

| Dado | Classe | Motivo |
| --- | --- | --- |
| Catálogo | AP | preço velho por segundos é aceitável |
| Pedido | CP local | não perder/duplicar item |
| Sessão | CP | revogação importa |
| Câmbio | AP com TTL | cotação pode atrasar |
| Carrinho | AP | converge no checkout |

### Síncrono × assíncrono

| Precisa da resposta para continuar? | Escolha |
| --- | --- |
| Sim (login, preço, conversão pedida) | REST |
| Não (e-mail, analytics, miniatura) | Evento |
| Sim, mas pode compensar | Saga |

### Padrões de resiliência

| Sintoma | Padrão |
| --- | --- |
| Chamada trava | Timeout |
| Falha transitória | Retry + backoff + jitter |
| Dependência fora | Circuit breaker |
| Função pode degradar | Fallback |
| Uma dependência consome tudo | Bulkhead |
| Abuso/pico | Rate limit |
| Instância quebrada | Health check |

### Onde cada garantia está no projeto

| Garantia | Mecanismo |
| --- | --- |
| Processo saudável | probes |
| Uma réplica sempre | PDB |
| Rollout seguro | RollingUpdate + readiness |
| Capacidade elástica | HPA + CA |
| Dados recuperáveis | backup/PITR (RTO 1 h, RPO 5 min) |
| Borda protegida | CloudFront + SG + Shield; WAF preparado |
| Identidade | JWT + cookie + CSRF + papéis |
| Diagnóstico | métricas + logs + traces + alertas |

---

## Flashcards de véspera

Clique (ou use Enter/Espaço) para virar.

<div class="study-flash">
  <div class="flash-card">
    <div class="flash-front">SLI × SLO × SLA</div>
    <div class="flash-back">SLI = medida (bons/válidos); SLO = meta interna com janela; SLA = contrato com consequência.</div>
  </div>
  <div class="flash-card">
    <div class="flash-front">Error budget de 99,5% em 28 dias</div>
    <div class="flash-back">0,5% × 40.320 min = 201,6 min ≈ 3 h 22 min.</div>
  </div>
  <div class="flash-card">
    <div class="flash-front">Liveness × readiness</div>
    <div class="flash-back">Liveness reinicia o processo travado; readiness remove do balanceador sem reiniciar.</div>
  </div>
  <div class="flash-card">
    <div class="flash-front">Por que a liveness não olha o banco?</div>
    <div class="flash-back">Uma oscilação do banco reiniciaria todas as réplicas juntas, ampliando a indisponibilidade.</div>
  </div>
  <div class="flash-card">
    <div class="flash-front">Pool máximo por pod</div>
    <div class="flash-back">max_connections ÷ (serviços de banco × réplicas). 112 ÷ (3 × 6) ≈ 6.</div>
  </div>
  <div class="flash-card">
    <div class="flash-front">Transactional outbox</div>
    <div class="flash-back">Estado + evento na mesma transação local; relay publica; consumidor idempotente.</div>
  </div>
  <div class="flash-card">
    <div class="flash-front">CAP em uma frase</div>
    <div class="flash-back">Partição é inevitável; durante ela, escolha consistência (CP) ou disponibilidade (AP).</div>
  </div>
  <div class="flash-card">
    <div class="flash-front">Gargalo final do projeto</div>
    <div class="flash-back">maxReplicas 6 do Product + CPU dos nós; RDS em 52/112 conexões não é o limite.</div>
  </div>
</div>

---

## Frases que valem ponto

1. **"Microsserviços trocam complexidade operacional por autonomia de deploy e escala."**
2. **"A fronteira é o domínio; o banco é consequência."**
3. **"Disponibilidade em série se multiplica; em paralelo, se complementa."**
4. **"Um timeout converte travamento em erro tratável; um retry sem breaker pode piorar."**
5. **"O pool é uma decisão de sistema, não um número mágico."**
6. **"Kubernetes reconcilia estado; disponibilidade é composição de camadas."**
7. **"Observabilidade é a capacidade de responder perguntas que você não previu."**
8. **"Evento desacopla disponibilidade e cobra consistência eventual."**
9. **"Segurança é em camadas; o gateway autentica, mas o serviço autoriza o objeto."**
10. **"Nuvem é custo por hora; em demo, o idle domina a conta."**
11. **"Zero erro durante o teste não prova estabilidade: verifique a pós-condição."**
12. **"O gargalo não é removido; ele se move — e agora você sabe para onde."**

---

## Erros que zeram credibilidade

| Não diga | Diga |
| --- | --- |
| "Usamos CAP: escolhemos CA" | "P não é opcional; escolhemos C durante a partição" |
| "SLA é a meta interna" | "SLO é interno; SLA é contrato" |
| "Temos HA porque temos 2 réplicas" | "HA de processo; dados em Single-AZ" |
| "Kafka resolve a consistência" | "Kafka desacopla; consistência exige outbox/idempotência" |
| "O banco é o gargalo" (sem medir) | "RDS em 52/112; o teto é HPA/nós" |
| "JWT é seguro" | "JWT é formato; segurança vem de algoritmo, TTL e armazenamento" |
| "NetworkPolicy protege" (sem CNI) | "Só se o CNI aplicar; o projeto tem cobertura parcial" |
| "Deploy é automático" | "CI completo; deploy manual reproduzível via script" |
| "O sistema aguenta 400 req/s" | "~300 req/s medidos, p95 1,25 s, não é o SLO" |
| "O cache está ativo" | "Redis provisionado, `CACHE_ENABLED=false`" |

---

## Mapa de capítulos

| Se a dúvida é… | Vá para |
| --- | --- |
| O que é o projeto e como foi feito | [01](01-projeto.md) |
| Rede, CAP, consenso | [02](02-distribuidos.md) |
| Docker/Compose | [03](03-containers.md) |
| REST/OpenAPI | [04](04-apis.md) |
| DDD/fronteiras | [05](05-microsservicos-ddd.md) |
| Clean/Hexagonal/CQRS | [06](06-arquiteturas.md) |
| JWT/OAuth/Zero Trust | [07](07-seguranca.md) |
| Kafka/outbox/saga | [08](08-eventos.md) |
| SLO/resiliência/caos | [09](09-confiabilidade.md) |
| K8s/HPA/PDB/probes/HA | [10](10-kubernetes-ha.md) |
| Métricas/logs/traces | [11](11-observabilidade.md) |
| AWS/Terraform/custos/modelos | [12](12-nuvem-custos.md) |
| Load test/gargalos | [13](13-performance-gargalos.md) |
| Frontend/CDN/sessão | [14](14-frontend.md) |
| Defesa oral | [15](15-estudo-de-caso.md) |
| Questões | [16](16-simulado.md) |
| Lacunas e evolução | [18](18-lacunas-e-evolucao.md) |
| Respostas | [19](19-respostas.md) |

!!! quote "Em resumo"
    Se você só puder levar uma ideia: **arquitetura é o conjunto de decisões caras de desfazer — e o que importa é saber por que você as tomou, quanto custaram e como mediu o resultado.**
