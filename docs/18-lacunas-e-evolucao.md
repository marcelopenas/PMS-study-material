# O que não foi implementado (e por quê)

<span class="study-tag prova">prova</span><span class="study-tag projeto">projeto</span>

Um projeto maduro não é definido só pelo que tem, mas pelo que **decidiu não ter** — e por saber o preço dessa decisão. A documentação da Microsserv52 é incomum porque lista as lacunas sem maquiar. Este capítulo pega cada lacuna, explica o conceito, mostra o benefício que ela traria, o motivo de não estar lá e o caminho de adoção.

!!! quote "A regra deste capítulo"
    **Ausente não significa esquecido.** Toda lacuna tem um motivo (escopo, custo, tempo ou risco) e um custo associado. Na prova, a resposta boa não é "não temos", é **"não temos porque X; ganharíamos Y; o primeiro passo seria Z; mediríamos W"**.

---

## 1. Como classificar uma lacuna

| Tipo | Exemplos no projeto | Como tratar |
| --- | --- | --- |
| **Fora de escopo** | Kafka, Cart service, SSR/BFF | Explicar o conceito e por que o MVP não precisa |
| **Custo** | RDS Multi-AZ, MSK, WAF contínuo, DR multi-região | Quantificar e comparar com o orçamento |
| **Tempo/risco** | Teste de falha do provedor, caos, write em AWS, upload AWS | Priorizar por impacto no SLO |
| **Parcial** | NetworkPolicy, staging, contract tests, observabilidade no EKS | Dizer o que cobre e o que falta |
| **Decisão consciente** | Síncrono, HMAC, deploy manual, static export | Defender com trade-off, não com desculpa |

### Matriz de prioridade (impacto × esforço)

| Item | Impacto no SLO/negócio | Esforço | Risco de não ter | Prioridade |
| --- | --- | --- | --- | --- |
| RDS Multi-AZ | Alto (SPOF de dados) | Baixo/Médio (custo) | Alto | **P0** |
| Breaker + revisão de timeouts (Product/Exchange) | Alto (cascata) | Baixo | Alto | **P0** |
| Idempotência do `POST /orders` | Médio (duplicata) | Baixo | Médio | **P0** |
| Teste de restore RDS | Alto (RTO/RPO) | Baixo | Alto | **P0** |
| EKS observability aplicada | Alto (MTTR) | Médio | Médio | P1 |
| Traces no Exchange | Médio | Baixo | Médio | P1 |
| WAF/rate limit na borda | Médio (abuso) | Baixo/Médio | Médio | P1 |
| NetworkPolicy default-deny | Médio (lateral) | Médio | Médio | P1 |
| Pool/PgBouncer | Médio (capacidade) | Médio | Médio | P1 |
| Outbox + notificação | Médio (desacoplamento) | Alto | Médio | P2 |
| Cache/Cart service | Médio (latência/produto) | Alto | Baixo/Médio | P2 |
| GitOps + canary | Médio (entrega) | Médio/Alto | Baixo | P2 |
| mTLS/service mesh | Médio (zero trust) | Alto | Médio | P3 |
| Multi-região/DR | Baixo no demo | Muito alto | Baixo | P3 |

### Onde está a teoria de cada lacuna

| Lacuna | Capítulo com a teoria |
| --- | --- |
| Kafka, outbox, saga, DLQ | [Eventos e mensageria](08-eventos.md) |
| Cache, réplicas, failover, PgBouncer | [Sistemas distribuídos §6–7](02-distribuidos.md) |
| Isolamento de dados/DDD | [Microsserviços e DDD](05-microsservicos-ddd.md) |
| mTLS, SPIFFE, NetworkPolicy, segredos | [Segurança](07-seguranca.md) |
| Multi-AZ, HPA, PDB, probes, HA | [Kubernetes e HA](10-kubernetes-ha.md) |
| WAF, custos, modelos de nuvem | [Nuvem, deploy e custos](12-nuvem-custos.md) |
| SLO, error budget, resiliência, caos | [Confiabilidade](09-confiabilidade.md) |
| EKS observability, traces, profiling | [Observabilidade](11-observabilidade.md) |
| Testes de carga e gargalos | [Performance](13-performance-gargalos.md) |
| Cart, SSR/BFF, admin | [Frontend](14-frontend.md) |

!!! tip "A ordem não é a mesma para todo mundo"
    Em um produto real, P0/P1 mudam com receita, contrato e risco regulatório. Em uma loja demo, Multi-AZ e restore drill ainda vêm antes de Kafka — porque protegem o **caminho que já existe**, enquanto Kafka habilitaria um caminho novo.

---

## 2. As lacunas que mais importam

### 1. Kafka, outbox, saga e DLQ

**O que é.** Um log distribuído de eventos (Kafka) permite que um serviço publique um fato (`OrderCreated`) e outros reajam sem acoplamento temporal. Para não perder o evento entre o commit do banco e a publicação, usa-se **transactional outbox**; para coordenar vários serviços sem ACID distribuído, **saga** com compensações; para mensagens que falham sempre, **DLQ**; e todo consumidor precisa ser **idempotente**.

**O que o projeto ganharia.**
- Checkout responde sem esperar e-mail, analytics ou faturamento.
- Picos absorvidos pela fila em vez de virar 503.
- Retry automático e DLQ para falhas pós-pedido.
- Base para notificação, histórico analítico e projeções (CQRS).
- Menos uma chamada síncrona na cadeia de disponibilidade.

**Por que não foi usado.** Não há requisito de notificação ou analytics no MVP; o time é pequeno; operar Kafka (MSK ou Strimzi) adiciona broker, schema, consumer lag, DLQ, idempotência e mais um modelo de consistência. O projeto preferiu **fechar o caminho principal** (pedido, catálogo, auth) e documentar a ausência em vez de meio-implementar eventos. Também não havia um serviço consumidor real — criar Kafka só para "ter Kafka" seria arquitetura de vitrine.

**O que seria necessário.** Outbox na mesma transação do pedido; relay/publicador (polling ou CDC); tópico com chave `orderId`; consumidor idempotente (tabela de mensagens processadas na mesma transação); retry com backoff; DLQ; métricas de lag/DLQ; versão de schema. Comece por **um** evento (`OrderCreated`) e um consumidor (notificação), não por uma plataforma inteira.

**Como mediria.** Latência do checkout (p95), lag por grupo, taxa de duplicatas, tamanho da DLQ, idade do evento mais antigo, cobertura de trace ponta a ponta.

!!! note "No projeto"
    Não há broker, tópico, produtor, consumidor, tabela outbox, relay ou dependência de cliente. O Redis existe, mas com `CACHE_ENABLED=false`; não é transporte. Ver [Eventos e mensageria](08-eventos.md).

---

### 2. Cache distribuído e Cart service

**O que é.** Cache é uma cópia de leitura em memória (Redis) para evitar idas repetidas ao banco. **Cache-aside** é o padrão mais comum: lê o cache, no miss lê o banco e popula. O Cart service seria um serviço dono do carrinho, com Redis como armazenamento compartilhado e TTL, permitindo carrinho entre dispositivos e merge no login.

**O que o projeto ganharia.**
- Catálogo com p95 menor e menos QPS no RDS.
- Menos pressão sobre as 112 conexões (o cache absorve leituras).
- Carrinho server-side, consistente entre abas/dispositivos e base para checkout.
- Base para rate limiting distribuído e sessão, se necessário.

**Por que não foi usado.** O carrinho no `localStorage` resolve o caso demo sem servidor. Cache de **preço** é perigoso: invalidar corretamente é difícil e um preço velho pode gerar pedido errado. O Redis está provisionado como endpoint compartilhado, mas `CACHE_ENABLED=false` e não há lógica por serviço; ligar cache sem invalidação seria pior que não ter. Também não há requisito de carrinho multi-dispositivo.

**O que seria necessário.** Cache-aside por `productId` com TTL curto (60 s), invalidação no update/delete, chave versionada, single-flight contra stampede, métricas de hit/miss/erro; para o Cart, serviço com Redis, TTL e merge idempotente. Cuidado: cache é AP — catálogo tolera, autorização/saldo não.

**Como mediria.** Hit ratio, p95 do catálogo, QPS/connections no RDS, erros de cache, pedidos com preço divergente (deveria ser zero).

!!! note "No projeto"
    Redis 7.4 provisionado; `CACHE_ENABLED=false`; alerta de erro de cache e dashboard de dependências existem, mas o cache não está ativo. Ver [Sistemas distribuídos §6](02-distribuidos.md#6-cache-o-atalho-que-cria-consistencia-eventual).

---

### 3. RDS Multi-AZ, réplica de leitura e PgBouncer

**O que é.** **Multi-AZ** mantém uma instância standby em outra zona, com failover automático; **réplica de leitura** é uma cópia assíncrona que recebe `SELECT`; **PgBouncer** multiplexa conexões de muitos pods em poucas conexões reais ao banco.

**O que o projeto ganharia.**
- Multi-AZ: reduz o RTO de horas (restore) para segundos/minutos e o RPO para ~0.
- Réplica: escala leitura (catálogo) sem sobrecarregar o primário, ao custo de lag.
- PgBouncer: permite mais réplicas/pods sem estourar 112 conexões; adia o resize do RDS.

**Por que não foi usado.** Multi-AZ aproximadamente dobra o custo da linha do banco (≈ US$ 14 → ≈ US$ 28/mês) e o orçamento é de US$ 150; o demo roda pouco tempo. Réplica não era necessária: o RDS ficou em 52/112 e ~15% de CPU no teste. PgBouncer adiciona um componente e um modo de pooling que pode quebrar recursos de sessão; o pool 8 resolveu o cenário medido.

**O que seria necessário.** Ligar `multi_az = true`, testar failover e medir RTO/RPO; para leitura, rotear `GET` para a réplica e tratar lag/read-your-writes; para pool, subir PgBouncer (transaction pooling), ajustar `pool_size` e monitorar.

**Como mediria.** RTO/RPO em drill, conexões/CPU do RDS, lag de réplica, p95 de leitura, erros de conexão.

!!! note "No projeto"
    RDS `db.t4g.micro` Single-AZ, 112 conexões, pool 8; RTO 1 h / RPO ≤ 5 min via PITR. Ver [Confiabilidade](09-confiabilidade.md) e [Performance](13-performance-gargalos.md).

---

### 4. Isolamento de dados: schema e role por serviço

**O que é.** O polo forte de *database-per-service*: cada serviço tem schema/base e credenciais próprias, com permissões restritas. O polo fraco (atual) é uma base compartilhada com tabelas por serviço e disciplina de código.

**O que o projeto ganharia.**
- Impossibilita (por grant) que um serviço leia a tabela do outro.
- Migrações e backup/restore independentes.
- Menor raio de dano se um serviço for comprometido.
- Contratos realmente explícitos, não só por revisão.

**Por que não foi usado.** Um RDS `db.t4g.micro` e um schema simplificam o demo, o seed e o Compose; criar roles/schemas por serviço exige mudar strings de conexão, migrações e permissões. O time optou por **convenção + contrato** e documentou a limitação.

**O que seria necessário.** Schema (ou database) por serviço, role com `GRANT` só no próprio schema, remover grants cruzados, padronizar migrações (Flyway em todos), testes que falham se um serviço consultar tabela alheia.

**Como mediria.** Auditoria de grants, tentativas de acesso cruzado (devem falhar), independência de migração, tempo de restore por serviço.

!!! note "No projeto"
    Todos usam a base `platform`; Product usa Flyway, Account/Order usam JPA `ddl-auto=update`. Nada no banco impede uma query cruzada. Ver [Microsserviços e DDD §4](05-microsservicos-ddd.md#4-dono-dos-dados-database-per-service-como-disciplina).

---

### 5. mTLS, service mesh, SPIFFE e NetworkPolicy completa

**O que é.** **mTLS** faz cliente e servidor provarem identidade com certificados; **SPIFFE/SPIRE** padroniza a identidade de workload e emite SVIDs curtos; um **service mesh** (Istio/Linkerd) injeta sidecars que fazem mTLS e aplicam políticas sem mudar o código. **NetworkPolicy** é firewall L3/L4 por pod.

**O que o projeto ganharia.**
- Zero Trust leste-oeste: um pod comprometido não forja identidade nem alcança qualquer serviço.
- Criptografia interna (hoje CloudFront → NLB é HTTP).
- Política explícita por fluxo (Gateway → Order, Order → Product) e auditoria.
- Rotação automática de certificados.

**Por que não foi usado.** O cluster não tem mesh; instalar Istio/Linkerd adiciona sidecars, CPU/memória, CRDs e complexidade operacional. O CNI precisa aplicar NetworkPolicy (Calico/Cilium); a rede padrão pode ignorar. O projeto tem políticas **parciais** (scrape de observabilidade) e confia na rede do cluster + header do Gateway. É uma simplificação consciente, não uma afirmação de segurança completa.

**O que seria necessário.** Primeiro o barato: `default-deny` + allow por fluxo no CNI que aplica política. Depois, mesh ou Cilium com mTLS; SPIFFE se multi-cluster. Medir bloqueios e falsos positivos antes de bloquear.

**Como mediria.** Cobertura de políticas (pods cobertos), fluxos negados, rotação de certificado, latência adicional do sidecar, falhas de handshake.

!!! note "No projeto"
    Sem mTLS; NetworkPolicy parcial. O Gateway é o único público e sobrescreve identidade, o que reduz o risco, mas não elimina movimento lateral. Ver [Segurança §5](07-seguranca.md).

---

### 6. WAF, rate limiting e logs de borda

**O que é.** **AWS WAF** inspeciona HTTP na borda e aplica regras gerenciadas (OWASP, bad inputs), rate-based rules e limites por rota. **Rate limiting** no Gateway/Nginx protege login e escritas. Logs de CloudFront/WAF dão visibilidade de ataque e de tráfego bloqueado.

**O que o projeto ganharia.**
- Bloqueio de scanners, bots e credential stuffing no login.
- Mitigação L7 de picos e abuso (não só DDoS L3/L4 do Shield).
- Evidência de segurança e tuning com dados reais.
- Proteção antes de o request custar CPU no cluster.

**Por que não foi usado.** O Terraform prepara WAF atrás de `enable_waf=false`,mas não anexa. O custo é real: ~US$ 9,60/mês a 1 M requests e ~US$ 15/mês a 10 M; 300 req/s contínuos custariam ~US$ 476/mês só de request fees. Sem domínio customizado e com tráfego de demo, o risco não justificava o custo e o tuning. O projeto também não tem logs de borda habilitados.

**O que seria necessário.** Anexar o web ACL em modo **count** primeiro, revisar amostras, ativar rate rule em `/auth/login` e escritas, habilitar logs com retenção, depois bloquear. Evitar regras que quebrem uploads e websockets.

**Como mediria.** Requisições bloqueadas, 429, falsos positivos, latência de borda, custo por milhão, incidentes de abuso.

!!! note "No projeto"
    Shield Standard, CloudFront, SG do NLB restrito ao prefixo do CloudFront; WAF preparado, não anexado; logs de borda não habilitados. Ver [Nuvem e custos §6](12-nuvem-custos.md).

---

### 7. Domínio customizado e TLS interno

**O que é.** Route 53 + certificado ACM + alias no CloudFront dão um hostname estável (`app.exemplo.com`) e TLS gerenciado. TLS interno protegeria CloudFront → NLB e serviço → serviço.

**O que o projeto ganharia.**
- URL profissional e estável, independente do hostname do CloudFront.
- Cookies, CORS, Cognito, Faro e links de documentação com origem estável.
- TLS ponta a ponta (hoje o NLB recebe HTTP).
- Base para WAF com hostname, HSTS e política de cookies mais forte.

**Por que não foi usado.** O domínio é externo ao repositório e exige aprovação de quem o possui; sem ele não há certificado ACM nem alias. O CloudFront hostname funciona para o demo. TLS interno exigiria certificados/ACME ou mesh, com rotação e mais complexidade.

**O que seria necessário.** Registrar/transferir domínio, hosted zone, certificado em `us-east-1`, alias no CloudFront, atualizar CORS/cookies/Cognito/Faro, e TLS no NLB/ingress (ACM no NLB ou cert interno).

**Como mediria.** Erros de TLS, cookies rejeitados, origem CORS, tempo de emissão/renovação, cobertura HTTPS interna.

!!! note "No projeto"
    Sem domínio; URL é `d15ogksm4jp6sl.cloudfront.net`; CloudFront → NLB é HTTP. Ver [Segurança](07-seguranca.md) e [Nuvem](12-nuvem-custos.md).

---

### 8. GitOps, canary/blue-green e métricas DORA

**O que é.** **GitOps** (Argo CD/Flux) faz o cluster reconciliar o estado declarado no Git, detectando drift e auditando mudanças. **Canary** libera a nova versão para uma fração do tráfego e promove se as métricas ficarem boas; **blue-green** troca o ambiente inteiro. **DORA** mede frequência de deploy, lead time, change failure rate e tempo de recuperação.

**O que o projeto ganharia.**
- Deploy reproduzível, auditável e sem drift.
- Rollback e promoção automáticos com base em SLO.
- Menos risco em cada release (canary com 5% do tráfego).
- Dados para melhorar a entrega, não só a operação.

**Por que não foi usado.** O deploy é **shell-first por decisão**: menos segredos no CI, operador vê o `terraform plan` e o rollout, o mesmo script serve para recuperação. Argo CD adicionaria um controlador, RBAC, repositório de manifests e um novo modelo mental; canary exige métricas confiáveis e automação de análise. Para um time de 2–3 pessoas e um demo, o custo não se pagava.

**O que seria necessário.** Argo CD + ApplicationSets, imagens imutáveis, Kustomize por ambiente; Argo Rollouts com AnalysisTemplate ligado a Prometheus; DORA a partir de eventos de CI/deploy e incidentes.

**Como mediria.** Deploy frequency, lead time, change failure rate, MTTR, tempo de rollback, drift detectado.

!!! note "No projeto"
    CI completo, deploy manual via `scripts/deploy-aws.sh` e workflow OIDC; sem Argo, sem canary, sem DORA formal. Ver [CI/CD em O projeto por dentro §6](01-projeto.md).

---

### 9. Circuit breaker, retry, bulkhead e chaos engineering

**O que é.** **Timeout** limita a espera; **retry** com backoff/jitter trata falha transitória; **breaker** falha rápido quando a dependência está fora; **bulkhead** isola recursos; **chaos engineering** injeta falhas controladas para validar hipóteses.

**O que o projeto ganharia.**
- Falha do Product/Exchange contida, sem esgotar threads do Order.
- Recuperação automática de falhas transitórias.
- Evidência de que os timeouts e fallbacks funcionam sob falha real.
- Menor MTTR e menos error budget queimado.

**Por que não foi usado.** A cadeia síncrona é curta (Order → Product; Exchange previsto), o mock do provedor é determinístico e o tempo foi para o caminho feliz, carga e observabilidade. Não há Resilience4j configurado, e o teste de falha do provedor ficou pendente. Sem breaker, um Product lento pode prender threads; é a lacuna de resiliência mais relevante.

**O que seria necessário.** Timeouts explícitos no Feign/HTTP, breaker com limiar de lentidão abaixo do timeout, retry só em idempotentes, bulkhead por dependência, fallback seguro; teste com Toxiproxy/Chaos Mesh e um GameDay.

**Como mediria.** 5xx e p95 durante a falha, threads/pool presos, tempo de abertura do breaker, recuperação após normalizar, error budget consumido.

!!! note "No projeto"
    Timeout existe; breaker/retry/bulkhead completos e caos não. Ver [Confiabilidade §5](09-confiabilidade.md) e [Performance](13-performance-gargalos.md).

---

### 10. Idempotência do `POST /orders`

**O que é.** Uma operação é idempotente quando repetir tem o mesmo efeito de executar uma vez. Para `POST`, usa-se uma **chave de idempotência**: o cliente envia um UUID por operação lógica; o servidor guarda a chave e o resultado e devolve o mesmo resultado em uma repetição.

**O que o projeto ganharia.**
- Retry seguro em timeout/queda de rede, sem pedido duplicado.
- Melhor UX em checkout instável.
- Base para consumidores idempotentes se eventos forem adotados.

**Por que não foi usado.** A UI desabilita o botão e não faz retry automático; o escopo não previa checkout real. Implementar exige tabela de chaves, hash do request, resposta armazenada, TTL/limpeza e tratamento de conflito (mesma chave, payload diferente). O Product já tem `idempotency_keys`; o Order não.

**O que seria necessário.** Header `Idempotency-Key`, tabela única `(account_id, key)`, transação que grava pedido + chave + resposta, replay da resposta, `409` para payload divergente, expiração.

**Como mediria.** Pedidos duplicados por retry (deveria ser zero), taxa de replay, latência adicional, colisões de chave.

!!! note "No projeto"
    Sem chave no Order; o frontend mitiga com UX e orienta consultar o histórico em caso de resposta incerta. Ver [APIs §2](04-apis.md).

---

### 11. Observabilidade completa: EKS aplicado, traces no Exchange, profiling e Faro de produção

**O que é.** A stack LGTM local está completa; no EKS os manifests estão **preparados, não aplicados**. O Exchange exporta métricas/logs, mas **não traces**; o Pyroscope não tem agente; o Faro não tem URL de produção; não há métricas de negócio (pedidos/min, conversão).

**O que o projeto ganharia.**
- Evidência de SLO em produção AWS (não só local).
- Trace ponta a ponta incluindo o Python.
- Profiling para achar CPU/quente sem adivinhação.
- Faro real para Web Vitals e erros de browser.
- Alertas baseados em negócio, não só infraestrutura.

**Por que não foi usado.** Aplicar a stack no EKS exige credencial, autorização do owner e ~70 GiB de EBS + provável terceiro nó (≈ +US$ 40/mês). O Exchange precisaria de pacotes OTel e `opentelemetry-instrument`; o Pyroscope exige decidir overhead; o Faro de produção depende de domínio/HTTPS. Tudo estava fora do tempo/orçamento do demo.

**O que seria necessário.** `scripts/install-observability.sh` no EKS, verificação de targets/dashboards/probes, OTel no Exchange, agentes de profiling com amostragem, path Faro no CloudFront, métricas de negócio no Order/Product.

**Como mediria.** Cobertura de traces por serviço, targets up, alertas avaliados, MTTR, overhead de profiling, Web Vitals.

!!! note "No projeto"
    Local verificado (12 alvos, 5 probes, 8 dashboards); EKS pendente; Exchange sem traces; sem agente de perfil. Ver [Observabilidade](11-observabilidade.md).

---

### 12. Testes de carga e recuperação pendentes

**O que é.** Além do teste de leitura e do fluxo autenticado local, faltam: escrita autenticada **em AWS**, falha do provedor de câmbio, spike/stress/soak, trigger real do Cluster Autoscaler, scale-down, restore do RDS e GameDay.

**O que o projeto ganharia.**
- Curva real de saturação e headroom (não só um ponto).
- Prova de que o breaker/fallback funciona.
- RTO/RPO medidos, não só documentados.
- Confiança para prometer capacidade.

**Por que não foi usado.** Cada teste consome tempo, credencial e dinheiro; o provedor é mock e o caminho de escrita em AWS ainda não estava pronto. O projeto priorizou medir o gargalo de leitura, que era o risco mais concreto, e documentou o resto.

**O que seria necessário.** k6 com cenários e thresholds; janela autorizada; Toxiproxy/Chaos Mesh; restore em ambiente isolado; critérios de parada e orçamento.

**Como mediria.** p50/p95/p99, erros, saturação, réplicas/nós, RTO/RPO, tempo de recuperação, custo do teste.

!!! note "No projeto"
    Baseline 50 req/s e picos de 300–383 req/s; escrita só local. Ver [Performance §6](13-performance-gargalos.md).

---

## 3. Catálogo compacto das demais lacunas

Itens menores ou de segunda ordem, com o mesmo formato mental: **o que é → ganho → por que não → esforço**.

| Lacuna | O que é | Ganho para o projeto | Por que não foi usada | Esforço |
| --- | --- | --- | --- | --- |
| **DR multi-região** | Réplica/backup em outra região + failover de DNS | Sobreviver à perda de região; RTO/RPO globais | Custo e complexidade muito acima do demo; uma região basta | Muito alto |
| **EKS Auto Mode / Karpenter** | Provisionamento de nós por perfil de pod | Menos desperdício, nós certos para cada carga | Cluster Autoscaler já atendia 2–6 nós; Karpenter adiciona CRDs/operação | Médio |
| **External Secrets / Vault** | Sincronização/rotação de segredos | Rotação auditável; menos segredo em env | Secret nativo + IRSA bastava; rotação manual é limitação | Médio |
| **Assinatura de imagem / SBOM** | cosign, Trivy/Grype, proveniência | Cadeia de suprimentos verificável | CI já tem CodeQL/Dependabot; assinatura não era requisito | Médio |
| **Canary / blue-green** | Liberação progressiva com análise | Menos risco por release; rollback automático | Deploy manual + rolling update já evita queda total | Alto |
| **Feature flags** | Liga/desliga funcionalidade sem deploy | Experimentos e rollback de produto | Escopo pequeno; poucas features | Baixo/Médio |
| **SSR / BFF** | Render no servidor / backend-for-frontend | SEO dinâmico, sessão no servidor, agregação | Static export + CDN é mais barato e seguro para catálogo público | Alto |
| **Admin completo** | Editar produto/conta, todos os pedidos, estoque | Operação real da loja | Escopo declarado como mock; UI read-only | Médio |
| **Busca/paginação no backend** | `?q=&page=&size=` | Escala de catálogo; menos dados no browser | Catálogo pequeno; busca local basta | Médio |
| **Notificação** | E-mail/push de pedido | Fecha o ciclo de compra | Depende de evento/outbox e provedor | Médio |
| **Staging em execução** | Ambiente privado rodando | Aceitação antes de produção | Configuração pronta, mas custo/manual; sem CI/CD de staging | Médio |
| **Shutdown agendado / budget automation** | Desligar fora do horário; ação ao estourar budget | Economia real (~US$ 80/mês) | Operação manual; budget só alerta | Baixo |
| **DORA automatizado** | Coletar as 4 métricas | Melhorar entrega com dados | Sem GitOps/telemetria de deploy; medição manual | Médio |
| **Testes de contrato no CI** | Validar OpenAPI entre consumidor/provedor | Evita quebra silenciosa | Há contratos e testes; a cobertura de todos os pares não está documentada | Médio |
| **E2E de browser em produção** | Playwright contra o ambiente real | Confiança no fluxo completo | Fixtures e testes locais; AWS exige credencial/dados | Médio |
| **Grafana Cloud** | Cópia gerenciada dos sinais | Sinais sobrevivem ao cluster; alertas externos | Stack self-hosted já cobre; custo/credenciais | Baixo |
| **MSK / schema registry** | Kafka gerenciado + contratos de evento | Operação de eventos sem broker próprio | Sem eventos; custo fixo alto | Alto |
| **Multi-cluster** | Cluster por ambiente/time | Isolamento e blast radius | Um cluster + overlays bastava | Alto |
| **Cache HA (Redis replica)** | Réplica/failover do ElastiCache | Cache não vira SPOF | Cache desligado; single node é barato | Médio |
| **Backup do S3 de mídia** | Versionamento/replicação | Recuperar imagens | Versionamento/lifecycle existem; DR não testado | Baixo |

!!! warning "Cuidado com a lista"
    Não transforme toda lacuna em dívida. Várias são **decisões de escopo** com custo maior que o benefício no contexto do demo. O erro de prova é listar 30 itens sem dizer qual deles protege o SLO e qual é só "nice to have".

---

## 4. O que eu faria primeiro (30/60/90 dias)

### 30 dias — proteger o que já existe

| Ação | Por quê | Métrica |
| --- | --- | --- |
| RDS Multi-AZ + teste de failover | Remove o maior SPOF | RTO/RPO medidos |
| Breaker + revisão de timeouts no Product/Exchange | Evita cascata | 5xx/p95 sob falha |
| Idempotência no `POST /orders` | Evita duplicata | pedidos duplicados = 0 |
| Restore drill do RDS | Prova o RTO/RPO documentado | tempo de restore |
| Shutdown agendado + budget action | Contém custo | US$/mês |

### 60 dias — enxergar e fechar a borda

| Ação | Por quê | Métrica |
| --- | --- | --- |
| Aplicar observabilidade no EKS | SLO de produção | targets up, alertas |
| Traces no Exchange | Trace ponta a ponta | cobertura |
| WAF em count + rate limit no login | Abuso/credential stuffing | bloqueios/falsos positivos |
| NetworkPolicy default-deny + allow | Movimento lateral | fluxos negados |
| Pool/PgBouncer | Capacidade sem estourar 112 | conexões/p95 |

### 90 dias — desacoplar e entregar melhor

| Ação | Por quê | Métrica |
| --- | --- | --- |
| Outbox + `OrderCreated` + notificação | Fecha o ciclo sem acoplar | lag, DLQ, p95 checkout |
| Cache-aside do catálogo / Cart service | Latência e produto | hit ratio, p95, QPS no RDS |
| GitOps + canary | Entrega segura | DORA, change failure |
| mTLS/mesh ou Cilium | Zero Trust | cobertura/rotação |
| Schema/role por serviço | Isolamento real | grants, acessos negados |

!!! tip "A ordem se justifica por risco, não por moda"
    Multi-AZ e breaker protegem o **caminho que já existe**; Kafka e Cart habilitam caminhos **novos**. Em um demo com prazo, primeiro se protege o que está no ar.

---

## 5. Quanto custaria habilitar (ordem de grandeza)

| Item | Custo/impacto aproximado | Observação |
| --- | --- | --- |
| RDS Multi-AZ | ≈ dobra a linha do banco (≈ +US$ 14/mês) | Storage/backup à parte |
| Terceiro nó para observabilidade | ≈ +US$ 30/mês + EBS | Já previsto no orçamento de ≈ US$ 280 |
| WAF | ≈ US$ 9,60/mês a 1 M req; ≈ US$ 15 a 10 M | 300 req/s contínuos ≈ US$ 476/mês |
| PgBouncer | “grátis” em licença; +1 pod/operação | Reduz conexões, adiciona componente |
| Kafka (MSK/Strimzi) | Broker + storage + operação | MSK tem custo fixo; Strimzi consome time |
| Argo CD | Sem licença; +1 controlador/RBAC | Custo é operacional |
| Service mesh | CPU/memória dos sidecars + complexidade | Latência adicional |
| Domínio + ACM | Domínio anual + hosting zone (~US$ 1/mês) | Burocracia de posse |
| DR multi-região | Duplica infraestrutura | Só com requisito real |

!!! warning "Números são ordem de grandeza"
    Reconfira preços na data da prova; a região, o tráfego e o tipo de instância mudam a conta. O que não muda é o método: **custo fixo + variável + operação**.

---

## 6. Como falar de lacunas na prova

Use o template:

> **“Não temos X. O ganho seria Y. Não usamos por Z (escopo/custo/risco). O primeiro passo seria W. Mediríamos M.”**

Exemplos:

**“Por que não há Kafka?”**
> Não há evento porque o MVP não tem consumidor real e o custo operacional (broker, schema, lag, DLQ, idempotência) não se pagava. O ganho seria desacoplar notificação/analytics e absorver picos. O primeiro passo seria outbox + `OrderCreated` + um consumidor idempotente, medindo lag e DLQ. Kafka sozinho não resolveria: sem outbox, o evento pode se perder.

**“Por que o RDS é Single-AZ?”**
> Custo: Multi-AZ dobra a linha do banco e o orçamento é US$ 150. O risco é um SPOF de dados com RTO de restore (~1 h) e RPO de 5 min. O primeiro passo é ligar Multi-AZ e rodar um failover drill; mediria RTO/RPO.

**“Vocês têm Zero Trust?”**
> Na borda sim: TLS, JWT, CSRF, autorização por objeto. No leste-oeste, não: sem mTLS e com NetworkPolicy parcial. O ganho seria limitar movimento lateral. O primeiro passo barato é default-deny + allow por fluxo; depois mesh/Cilium. Mediria fluxos negados e rotação de certificado.

**“Por que não há cache se o Redis está lá?”**
> Porque cache de preço exige invalidação correta e o carrinho é local; ligar sem isso seria pior. O ganho seria p95 menor e menos QPS no RDS. O primeiro passo é cache-aside por `productId` com TTL curto e invalidação no write, medindo hit ratio e preço divergente.

**“O deploy é contínuo?”**
> É CI completo + deploy manual reproduzível. O ganho do GitOps/canary seria auditabilidade e menos risco por release; não usamos por tamanho de time e por querer o operador vendo o plano. O primeiro passo é Argo CD com o overlay atual; mediria DORA.

---

## 7. O que **não** é lacuna (para não errar)

| Item | Por que não é lacuna |
| --- | --- |
| 2 réplicas + PDB | Já implementa HA de processo e interrupção voluntária |
| RollingUpdate | Já evita queda total no deploy |
| Probes | Existem; a melhoria é separar os endpoints |
| HPA + Cluster Autoscaler | Existem e foram observados |
| Backup/PITR | Existe; falta o drill |
| OpenAPI/contratos | Existem; falta cobertura total de teste |
| Logs/métricas/traces locais | Existem e foram verificados |
| IRSA/OIDC | Existem; evitam chave de longa duração |
| CodeQL/Dependabot/secret scanning | Existem |
| Static export + CDN | Decisão, não ausência |

!!! quote "A frase final"
    **Uma lacuna sem custo é só uma opinião.** A resposta forte nomeia o benefício, o preço e a métrica — e reconhece que, no contexto do projeto, não ter pode ser a decisão certa.

---

## Checkpoint

<div data-study-score></div>

<div class="study-quiz" data-answer="c">
  <p class="q">1. Qual é a melhor justificativa para **não** ter Kafka no projeto?</p>
  <ul class="options">
    <li data-key="a">Kafka não serve para microsserviços.</li>
    <li data-key="b">Kafka é incompatível com Kubernetes.</li>
    <li data-key="c">Não há consumidor real e o custo operacional (broker, schema, lag, DLQ, idempotência) não se pagava; outbox + um consumidor seria o primeiro passo.</li>
    <li data-key="d">Kafka impede consistência eventual.</li>
  </ul>
  <p class="explain">Eventos são uma decisão de acoplamento, não de modernidade. Sem consumidor e sem requisito, o custo supera o benefício; a fundação correta é outbox + idempotência.</p>
</div>

<div class="study-quiz" data-answer="b">
  <p class="q">2. Qual é o maior benefício de RDS Multi-AZ para este projeto?</p>
  <ul class="options">
    <li data-key="a">Escalar leitura do catálogo.</li>
    <li data-key="b">Reduzir o RTO/RPO de uma falha de banco/zona com failover automático.</li>
    <li data-key="c">Eliminar a necessidade de pool de conexões.</li>
    <li data-key="d">Substituir backup/PITR.</li>
  </ul>
  <p class="explain">Multi-AZ é HA/standby, não leitura. Read replica escala leitura; backup/PITR protege contra erro humano. O ganho aqui é disponibilidade de dados.</p>
</div>

<div class="study-quiz" data-answer="d">
  <p class="q">3. O que o mTLS **não** resolve sozinho?</p>
  <ul class="options">
    <li data-key="a">Criptografia em trânsito entre serviços.</li>
    <li data-key="b">Prova de identidade do workload.</li>
    <li data-key="c">Rotação de certificados com SPIFFE/SPIRE.</li>
    <li data-key="d">Autorização: quem pode chamar qual rota/método.</li>
  </ul>
  <p class="explain">mTLS autentica os dois lados; a política (AuthorizationPolicy/RBAC) decide o que cada identidade pode fazer. Sem política, o certificado só criptografa.</p>
</div>

<div class="study-quiz" data-answer="a">
  <p class="q">4. Por que o cache do catálogo está desligado?</p>
  <ul class="options">
    <li data-key="a">Porque cache de preço exige invalidação correta e não havia requisito; ligar sem isso arrisca preço velho.</li>
    <li data-key="b">Porque o Redis não suporta TTL.</li>
    <li data-key="c">Porque o Prometheus não coleta cache.</li>
    <li data-key="d">Porque o Kubernetes proíbe cache.</li>
  </ul>
  <p class="explain">Cache é AP: o valor pode ficar velho. Sem invalidação/versionamento e sem requisito de escala, o risco supera o ganho. O primeiro passo seria cache-aside com TTL curto e invalidação no write.</p>
</div>

<div class="study-quiz" data-answer="c">
  <p class="q">5. Qual é a forma correta de responder “vocês têm Zero Trust?”</p>
  <ul class="options">
    <li data-key="a">“Sim, porque usamos JWT.”</li>
    <li data-key="b">“Não, e isso não importa.”</li>
    <li data-key="c">“Na borda sim (TLS, JWT, CSRF, autorização por objeto); no leste-oeste não (sem mTLS, NetworkPolicy parcial). O próximo passo é default-deny e, depois, mesh/Cilium.”</li>
    <li data-key="d">“Sim, porque o cluster é privado.”</li>
  </ul>
  <p class="explain">Zero Trust é verificação contínua, não “rede privada”. A resposta madura separa camadas e aponta o próximo passo mensurável.</p>
</div>

## Checklist

<div data-study-progress></div>

<label class="study-check"><input type="checkbox" data-key="g-matrix"> Sei priorizar lacunas por impacto no SLO, não por moda.</label>
<label class="study-check"><input type="checkbox" data-key="g-kafka"> Explico o que Kafka/outbox dariam e por que não estão lá.</label>
<label class="study-check"><input type="checkbox" data-key="g-cache"> Explico cache/Cart, invalidação e o Redis desligado.</label>
<label class="study-check"><input type="checkbox" data-key="g-ha"> Distingo Multi-AZ, read replica, PgBouncer e backup.</label>
<label class="study-check"><input type="checkbox" data-key="g-zt"> Explico mTLS, NetworkPolicy, WAF e domínio/TLS interno.</label>
<label class="study-check"><input type="checkbox" data-key="g-ops"> Explico GitOps, canary, DORA, caos e idempotência.</label>
<label class="study-check"><input type="checkbox" data-key="g-talk"> Uso o template “não temos X; ganho Y; por Z; primeiro passo W; métrica M”.</label>

!!! info "Volte ao começo"
    Para revisar a teoria de cada lacuna, use o [mapa da matéria](00-mapa.md). Para treinar a defesa oral, o [estudo de caso](15-estudo-de-caso.md).
