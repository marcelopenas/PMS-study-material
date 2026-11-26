# Respostas

!!! warning "Contém spoilers"
    Esta página reúne as respostas dos quizzes, cálculos, ordenações e flashcards. Tente responder antes de consultar; usar a resposta como ponto de partida costuma render mais do que a leitura passiva.

As questões dissertativas continuam nos capítulos, na seção **Como responder**, porque a resposta depende do contexto. Para deixar o gabarito completo, as respostas de arguição também foram copiadas para o fim desta página, junto com as abertas do simulado e o roteiro do exercício de desenho.

## Índice

| Capítulo | Quizzes | Cálculos | Ordenações | Flashcards |
| --- | ---: | ---: | ---: | ---: |
| [Início](index.md) | 5 | 0 | 0 | 0 |
| [00 — Mapa da matéria](00-mapa.md) | 1 | 0 | 1 | 0 |
| [01 — O projeto por dentro](01-projeto.md) | 3 | 0 | 1 | 0 |
| [02 — Sistemas distribuídos](02-distribuidos.md) | 6 | 1 | 0 | 0 |
| [03 — Containers e Compose](03-containers.md) | 3 | 0 | 1 | 0 |
| [04 — APIs e contratos](04-apis.md) | 3 | 0 | 1 | 0 |
| [05 — Microsserviços e DDD](05-microsservicos-ddd.md) | 3 | 0 | 0 | 0 |
| [06 — Arquiteturas de software](06-arquiteturas.md) | 3 | 0 | 1 | 0 |
| [07 — Segurança e identidade](07-seguranca.md) | 3 | 0 | 0 | 0 |
| [08 — Eventos e mensageria](08-eventos.md) | 3 | 0 | 1 | 0 |
| [09 — Confiabilidade e SLOs](09-confiabilidade.md) | 3 | 1 | 0 | 0 |
| [10 — Kubernetes e alta disponibilidade](10-kubernetes-ha.md) | 4 | 1 | 1 | 0 |
| [11 — Observabilidade](11-observabilidade.md) | 4 | 0 | 1 | 0 |
| [12 — Nuvem, deploy e custos](12-nuvem-custos.md) | 4 | 1 | 1 | 0 |
| [13 — Performance e gargalos](13-performance-gargalos.md) | 4 | 1 | 1 | 0 |
| [14 — Frontend e entrega](14-frontend.md) | 3 | 0 | 0 | 0 |
| [15 — Estudo de caso ponta a ponta](15-estudo-de-caso.md) | 3 | 0 | 0 | 0 |
| [16 — Simulado e banco de questões](16-simulado.md) | 30 | 5 | 0 | 0 |
| [17 — Glossário e cheatsheet](17-glossario-cheatsheet.md) | 0 | 0 | 0 | 8 |
| [18 — O que não foi implementado](18-lacunas-e-evolucao.md) | 5 | 0 | 0 | 0 |

Total: **93 quizzes**, **10 cálculos**, **10 ordenações** e **8 flashcards**.

---

## Início

[Voltar ao capítulo](index.md)

**Quizzes**

**Quiz 1.** Um serviço A chama B, que chama C. Cada um tem disponibilidade de 99,9%. Qual é a disponibilidade máxima do caminho, desprezando retries e cache?

**Resposta.** `b` — ≈ 99,7%, porque em série as disponibilidades se multiplicam.

**Comentário.** 0,999³ ≈ 0,99702. Em série, o sistema só funciona se todos funcionarem. Cerca de 26 h/ano de indisponibilidade, contra 8,8 h de um único serviço. Réplicas em paralelo é que somam: 1 − (1 − a)ⁿ.

**Quiz 2.** O projeto mediu 300 req/s com p95 de 1,25 s, Product em 6/6 réplicas e RDS com 52/112 conexões. Qual é o gargalo correto?

**Resposta.** `c` — O teto do HPA do Product somado à CPU dos nós — o banco ainda tem folga.

**Comentário.** Product fica preso em `maxReplicas: 6`, o p95 passa de 1 s e a CPU do nó satura. O RDS usa 52 de 112 conexões e ~15% de CPU. O k6 descartar iterações significa que 299,6 req/s é um limite inferior, não que o servidor esteja ocioso.

**Quiz 3.** Por que a liveness probe não deve consultar o banco de dados?

**Resposta.** `a` — Porque uma oscilação do banco faria o Kubernetes reiniciar todas as réplicas ao mesmo tempo.

**Comentário.** Liveness responde "o processo está travado?". Se ela depende do banco, uma falha externa vira um reinício em massa — exatamente a indisponibilidade que se queria evitar. Dependência externa pertence, com cautela, à readiness.

**Quiz 4.** O que o padrão *transactional outbox* resolve?

**Resposta.** `d` — A escrita dupla: gravar no banco e publicar no broker de forma atômica, usando a transação local.

**Comentário.** O evento é gravado na tabela `outbox` na mesma transação do estado de negócio; um relay publica depois. Isso não elimina duplicatas (o relay pode republicar), então o consumidor continua precisando ser idempotente.

**Quiz 5.** Qual afirmação sobre o projeto é **verdadeira**?

**Resposta.** `b` — O cache Redis está provisionado, mas `CACHE_ENABLED=false` e não há lógica de cache por serviço.

**Comentário.** Não há Kafka nem Cart service; o carrinho vive no `localStorage` (`ms52-cart-v1`). A sessão é um cookie HttpOnly emitido pelo Gateway, com CSRF, e o frontend nunca lê o token.

---

## 00 — Mapa da matéria

[Voltar ao capítulo](00-mapa.md)

**Quizzes**

**Quiz 1.** Qual sequência representa corretamente a direção das dependências na Clean Architecture?

**Resposta.** `c` — Adaptadores externos → casos de uso → entidades; o núcleo nunca importa o adaptador.

**Comentário.** A Regra de Dependência aponta sempre para dentro. O caso de uso declara a interface (porta) e o adaptador a implementa; em tempo de execução a chamada vai para fora, mas o código-fonte depende para dentro.

**Ordens corretas**

**Ordenação 1.** Ordene o caminho de um POST /orders autenticado:

1. Cliente envia HTTPS para o CloudFront
2. CloudFront reescreve /api e encaminha ao NLB
3. Gateway valida o token com o Auth
4. Gateway encaminha a identidade ao Order
5. Order consulta o preço atual no Product
6. Order persiste o pedido em USD no PostgreSQL
7. Resposta volta por Gateway, NLB e CloudFront

---

## 01 — O projeto por dentro

[Voltar ao capítulo](01-projeto.md)

**Quizzes**

**Quiz 1.** Por que o Gateway precisa **sobrescrever** o header de identidade enviado pelo cliente?

**Resposta.** `b` — Porque, se ele apenas repassasse, qualquer cliente poderia se passar por outro usuário.

**Comentário.** Os serviços internos confiam no header porque só o Gateway os alcança. Se o cliente puder injetar `id-account` e o Gateway não sobrescrever, a confiança vira uma vulnerabilidade (BOLA).

**Quiz 2.** Qual é a consequência correta de o projeto usar Git submodules?

**Resposta.** `c` — O repositório raiz registra um SHA por serviço; atualizar exige commit no serviço e no ponteiro.

**Comentário.** Submodule é um ponteiro para um commit. Isso preserva releases independentes, mas exige o duplo commit e um clone com `--recursive`.

**Quiz 3.** Onde o preço de um item de pedido é decidido?

**Resposta.** `d` — No Product, consultado pelo Order via API no momento do checkout; o cliente não pode sobrescrever.

**Comentário.** O Order lê o preço atual pela API do Product e persiste o total em USD. Aceitar o preço do cliente permitiria manipulação de preço; ler a tabela alheia quebraria a propriedade de dados.

**Ordens corretas**

**Ordenação 1.** Ordene os ambientes do mais local/barato para o mais próximo de produção:

1. Compose: integração local diária
2. MicroK8s: validação de manifests e HPA
3. LocalStack: rehearsal de Terraform e serviços AWS
4. EKS: deploy real com NLB, RDS e CloudFront
5. Staging: aceitação privada, uma réplica por serviço

---

## 02 — Sistemas distribuídos

[Voltar ao capítulo](02-distribuidos.md)

**Quizzes**

**Quiz 1.** O que CAP realmente permite escolher?

**Resposta.** `a` — Entre consistência e disponibilidade **durante uma partição**; tolerância a partições não é opcional.

**Comentário.** Partições são um fato. A escolha é C ou A enquanto elas duram. Latência × consistência fora da partição é PACELC.

**Quiz 2.** Por que um cluster de consenso costuma ter 3 ou 5 nós?

**Resposta.** `d` — Porque a maioria precisa ser clara: 3 tolera 1 falha, 5 tolera 2; com 2 ou 4, uma falha pode empatar.

**Comentário.** Quórum = ⌊n/2⌋ + 1. Com n=2, sobra 1 de 2 (não é maioria); com n=4, 2 de 4 também não é maioria estrita. Por isso 3 e 5.

**Quiz 3.** O Gateway valida o JWT localmente, sem consultar o Auth a cada requisição. Qual é o trade-off?

**Resposta.** `b` — Ganha latência e disponibilidade, mas um token revogado continua válido até expirar.

**Comentário.** Validação local usa a chave pública/segredo e evita um salto de rede. O custo é a janela de revogação: com token de 900 s, um token roubado vale por até 15 min.

**Quiz 4.** No cache-aside, qual é a corrida clássica que deixa dados velhos?

**Resposta.** `c` — Um leitor lê o valor antigo do banco e o grava no cache depois de um escritor atualizar o banco e invalidar a chave.

**Comentário.** É a ordem leitura→update→população que ressuscita o valor antigo. Mitigações: invalidar após o commit, usar versão na chave ou double delete. Não há solução perfeita; há trade-off.

**Quiz 5.** Qual é a diferença entre Multi-AZ e uma réplica de leitura?

**Resposta.** `b` — Multi-AZ é standby para failover (RPO ~0, não escala leitura); réplica de leitura recebe SELECT e pode ter lag.

**Comentário.** Multi-AZ troca custo por disponibilidade com baixo RPO; read replica troca frescor por escala de leitura. Nenhuma substitui backup/PITR.

**Quiz 6.** Um NLB opera em qual camada e o que ele enxerga?

**Resposta.** `a` — L4 (TCP); decide por IP/porta e não roteia por path ou header.

**Comentário.** NLB é L4; o CloudFront e o Nginx fazem L7. No projeto, o CloudFront reescreve `/api` e o NLB só encaminha TCP para o NodePort.

**Cálculos**

**Cálculo 1.** Quanto error budget (em minutos) um SLO de 99,9% permite em uma janela de 28 dias?

**Resposta.** 40,32 minutos

**Conta.** 0,1% × 28 dias × 24 h × 60 min = 40,32 min. Sempre cite a janela: em um mês de 30,44 dias, o mesmo SLO dá 43,8 min.

---

## 03 — Containers e Compose

[Voltar ao capítulo](03-containers.md)

**Quizzes**

**Quiz 1.** O que um container compartilha com o host?

**Resposta.** `b` — O kernel; namespaces isolam a visão e cgroups limitam o consumo.

**Comentário.** Container é processo isolado por namespaces (PID, net, mount, user…) e limitado por cgroups. Não há kernel próprio — daí o boot rápido e a fronteira de segurança diferente da VM.

**Quiz 2.** No Kubernetes, `requests.cpu: 250m` e `limits.cpu: 500m`. O HPA a 70% usa qual referência?

**Resposta.** `c` — 70% da request de 250m, ou seja, 175m por pod.

**Comentário.** A utilização de CPU do HPA é calculada sobre a request. O limite é o teto do cgroup (throttling), não a base do percentual. Por isso o dimensionamento de request muda o gatilho de escala.

**Quiz 3.** Qual afirmação sobre `depends_on` no Compose é correta?

**Resposta.** `d` — Ele apenas ordena a inicialização; readiness exige healthcheck ou probe.

**Comentário.** Sem `condition: service_healthy`, `depends_on` só espera o container iniciar. É por isso que serviços precisam de health/readiness reais.

**Ordens corretas**

**Ordenação 1.** Ordene as etapas de um Dockerfile multi-stage eficiente:

1. FROM base AS build
2. COPY pom.xml e baixar dependências
3. COPY src e compilar
4. FROM runtime enxuto
5. COPY --from=build o artefato
6. USER não-root
7. ENTRYPOINT do processo

---

## 04 — APIs e contratos

[Voltar ao capítulo](04-apis.md)

**Quizzes**

**Quiz 1.** Um cliente repete um `POST /orders` após timeout. Sem chave de idempotência, o risco é:

**Resposta.** `c` — Dois pedidos serem criados, porque POST não é idempotente por definição.

**Comentário.** POST não é idempotente. A solução é uma chave de idempotência persistida com o resultado, ou uma operação naturalmente idempotente (PUT/upsert). O projeto mitiga com UX, mas não promete exactly-once.

**Quiz 2.** `GET /orders/{id}` de um pedido que existe, mas pertence a outro usuário. Qual resposta é mais defensável?

**Resposta.** `b` — 404, para não revelar a existência do recurso; 403 também é aceitável se a política for explícita.

**Comentário.** O projeto usa 404. A escolha entre 403 e 404 é de política: 404 evita enumeração; 403 é mais transparente. O importante é aplicar a checagem de propriedade no serviço dono.

**Quiz 3.** Por que o contrato inclui os códigos de erro, e não só o payload de sucesso?

**Resposta.** `d` — Porque o consumidor precisa saber o que tratar e o que repetir; status e código definem retry, fallback e UX.

**Comentário.** Um 503 transitório pede retry com backoff; um 400 não. Sem contrato de erro, o consumidor adivinha — e retries cegos amplificam incidentes.

**Ordens corretas**

**Ordenação 1.** Ordene o fluxo de uma escrita autenticada por cookie:

1. Obter token CSRF em /session/csrf
2. Enviar POST com cookie e header CSRF
3. Gateway valida JWT, CSRF e papel
4. Serviço valida payload e propriedade
5. Serviço persiste a transação local
6. Resposta 201 com o recurso criado

---

## 05 — Microsserviços e DDD

[Voltar ao capítulo](05-microsservicos-ddd.md)

**Quizzes**

**Quiz 1.** Qual é a melhor justificativa para separar Order de Product?

**Resposta.** `c` — Porque têm capacidades, ciclos de mudança e perfis de escala diferentes, e o pedido precisa congelar o preço praticado.

**Comentário.** A fronteira é de negócio e de evolução. O preço atual vem do Product por API; o preço praticado fica no item do pedido. Um serviço por tabela seria um antipadrão.

**Quiz 2.** O Exchange traduz o JSON do provedor para o modelo da plataforma. Esse padrão é:

**Resposta.** `a` — Anti-Corruption Layer, porque impede o modelo externo de vazar para o domínio.

**Comentário.** ACL é uma camada de tradução na fronteira. Conformist seria adotar o modelo do upstream sem tradução; Shared Kernel seria compartilhar código/modelo por acordo.

**Quiz 3.** Por que o item do pedido guarda `productId` e `total`, mas não o objeto `Product` completo?

**Resposta.** `d` — Porque agregados se referenciam por id e o pedido precisa preservar o preço praticado, não o preço mutável do catálogo.

**Comentário.** É a regra de agregados + bounded context: catálogo e pedido têm modelos diferentes para "produto". Copiar o objeto acoplaria os dois e reescreveria o histórico quando o preço mudasse.

---

## 06 — Arquiteturas de software

[Voltar ao capítulo](06-arquiteturas.md)

**Quizzes**

**Quiz 1.** O que a Regra de Dependência proíbe?

**Resposta.** `b` — Que uma camada interna importe um tipo de uma camada externa.

**Comentário.** As dependências de código-fonte apontam para dentro. O adaptador pode (e deve) importar a interface do domínio; o contrário é a violação.

**Quiz 2.** Qual é uma porta **secundária** (driven) no estilo hexagonal?

**Resposta.** `d` — `ExchangeProvider`, implementada por um adapter HTTP do provedor.

**Comentário.** Portas secundárias são o que a aplicação precisa do mundo externo (persistência, API externa, broker). O núcleo define a interface; a infraestrutura implementa.

**Quiz 3.** Por que o projeto não aplica CQRS no catálogo?

**Resposta.** `a` — Porque o volume e a assimetria leitura/escrita não justificam a consistência eventual e a infraestrutura extra.

**Comentário.** CQRS não exige broker (pode ser no mesmo banco), mas adiciona complexidade. A decisão é econômica: o ganho não paga o custo no volume atual.

**Ordens corretas**

**Ordenação 1.** Ordene da camada mais externa para o núcleo (Clean Architecture):

1. Frameworks & Drivers (HTTP, JPA, SDK)
2. Interface Adapters (controller, presenter, mapper)
3. Use Cases (serviço de aplicação)
4. Entities (domínio e interfaces de repositório)

---

## 07 — Segurança e identidade

[Voltar ao capítulo](07-seguranca.md)

**Quizzes**

**Quiz 1.** Um usuário autenticado tenta ler o pedido de outro. Qual é o controle que falta se a API devolve 200?

**Resposta.** `c` — Autorização no nível do objeto (ownership), que só o serviço dono pode verificar.

**Comentário.** O usuário está autenticado; falta verificar se o objeto pertence a ele. É BOLA/IDOR — OWASP API #1. O Gateway não tem como saber o dono sem consultar o serviço.

**Quiz 2.** Qual é a principal vantagem de chaves assimétricas (RS256/ES256) sobre HMAC em uma malha de serviços?

**Resposta.** `b` — Cada serviço valida com a chave pública, sem compartilhar o segredo de assinatura.

**Comentário.** Com HMAC, todos que validam precisam do mesmo segredo — e podem assinar. Com RSA/ECDSA + JWKS, só o emissor tem a privada; os demais validam com a pública.

**Quiz 3.** O que um Kubernetes Secret oferece por padrão?

**Resposta.** `d` — Apenas base64; proteção real exige encryption at rest, RBAC e um gerenciador externo.

**Comentário.** Base64 é codificação reversível. Quem pode `get secrets` ou criar pods que os montem consegue ler. O projeto usa Secret + IRSA para o que é AWS, e reconhece que a rotação é manual.

---

## 08 — Eventos e mensageria

[Voltar ao capítulo](08-eventos.md)

**Quizzes**

**Quiz 1.** Por que at-least-once é o padrão em vez de exactly-once?

**Resposta.** `c` — Porque exactly-once cobre só Kafka→Kafka; efeitos externos exigem idempotência no consumidor.

**Comentário.** O commit do offset depois do processamento pode duplicar. Transações do Kafka não desfazem e-mail, S3 ou Postgres. A solução prática é entrega at-least-once + consumidor idempotente.

**Quiz 2.** O que o transactional outbox garante?

**Resposta.** `a` — Que o estado de negócio e o registro do evento sejam commitados atomicamente na mesma transação local.

**Comentário.** O outbox elimina a escrita dupla. O relay pode republicar após falha, então duplicatas continuam possíveis; ordem é por partição/chave, não global.

**Quiz 3.** Qual é a crítica correta à ausência de eventos no projeto?

**Resposta.** `d` — Efeitos pós-pedido ficam no request path e uma falha após o commit não é reprocessada; a correção é outbox + consumidor idempotente.

**Comentário.** O fluxo principal funciona. O que falta é desacoplar efeitos futuros (notificação, analytics) e garantir que o evento acompanhe o commit. É uma lacuna de escopo, não um bug do caminho atual.

**Ordens corretas**

**Ordenação 1.** Ordene o fluxo de transactional outbox:

1. BEGIN no banco do serviço
2. INSERT do estado de negócio
3. INSERT do evento na tabela outbox
4. COMMIT da transação local
5. Relay lê linhas não publicadas
6. Relay publica no tópico com chave
7. Relay marca a linha como enviada

---

## 09 — Confiabilidade e SLOs

[Voltar ao capítulo](09-confiabilidade.md)

**Quizzes**

**Quiz 1.** Qual é a diferença central entre SLO e SLA?

**Resposta.** `b` — SLO é meta interna; SLA é contrato com consequência jurídica/financeira.

**Comentário.** O SLO orienta a engenharia; o SLA define compensação. A boa prática é SLO mais estrito que SLA, para que o incidente consuma orçamento antes de virar crédito.

**Quiz 2.** Um alerta de burn rate de 14,4× em 1 h + 5 min significa aproximadamente:

**Resposta.** `c` — Que 2% do orçamento de 28 dias foi consumido em 1 h; é hora de acionar alguém.

**Comentário.** 14,4 × 1 h / (28 × 24 h) ≈ 2,1%. A janela curta confirma que a queima continua. É o par recomendado pelo SRE Workbook.

**Quiz 3.** Por que colocar o banco na liveness probe é perigoso?

**Resposta.** `a` — Uma oscilação do banco reinicia todas as réplicas simultaneamente, ampliando a indisponibilidade.

**Comentário.** Liveness é "o processo está travado?". Dependência externa pertence à readiness (com cuidado) — e readiness falhando remove o pod do balanceador, sem reiniciar.

**Cálculos**

**Cálculo 1.** Um serviço com SLO de 99,5% observa 5% de erro. Qual é o burn rate?

**Resposta.** 10 ×

**Conta.** 5% ÷ 0,5% = 10×. O orçamento de 28 dias seria consumido em 28/10 = 2,8 dias se a taxa se mantivesse.

---

## 10 — Kubernetes e alta disponibilidade

[Voltar ao capítulo](10-kubernetes-ha.md)

**Quizzes**

**Quiz 1.** Duas réplicas de um Deployment rodam no mesmo nó. O que acontece se o nó falhar?

**Resposta.** `c` — As duas réplicas caem; o ReplicaSet recria em outro nó, mas há indisponibilidade até isso ocorrer.

**Comentário.** Réplica no mesmo nó é redundância de processo, não de infraestrutura. A recuperação depende de capacidade e do scheduler; até lá, o serviço fica fora. Anti-affinity/topology spread evita o cenário.

**Quiz 2.** Por que `minAvailable: 2` com 2 réplicas é um problema?

**Resposta.** `b` — Porque qualquer drain voluntário violaria o orçamento e ficaria bloqueado para sempre.

**Comentário.** O PDB protege contra interrupção voluntária. Exigir todos os pods disponíveis torna drain/upgrade impossível. Com 2 réplicas, use `minAvailable: 1`.

**Quiz 3.** Qual é a ordem correta de resposta a um pico de tráfego?

**Resposta.** `d` — HPA aumenta pods → se ficarem Pending, o Cluster Autoscaler adiciona nó → pods agendam e ficam Ready.

**Comentário.** O HPA reage à métrica do pod; o CA reage a pods Pending. Sem CA, o pod extra fica pendurado. A capacidade efetiva só chega quando o nó sobe e o pod fica Ready.

**Quiz 4.** O que o EKS gerencia e o que continua sendo responsabilidade do time?

**Resposta.** `a` — Gerencia o control plane (API, etcd, scheduler); nós, add-ons, workloads, RDS e rede são do time.

**Comentário.** EKS é CaaS/K8s gerenciado: o control plane tem SLA da AWS, mas node groups, add-ons (metrics-server, CA, ingress), manifests, banco e custos são seus.

**Cálculos**

**Cálculo 1.** Com 3 serviços que usam o banco, pool de 8 por pod e RDS com 112 conexões, quantas réplicas por serviço cabem antes de estourar o limite?

**Resposta.** 5 réplicas (aprox.)

**Conta.** 112 ÷ (3 × 8) = 4,67. Na quinta réplica por serviço, o pior caso é 120 conexões e o RDS recusa. Com pool 10, o teto cai para 3,7.

**Ordens corretas**

**Ordenação 1.** Ordene um rolling update com 2 réplicas:

1. Novo ReplicaSet é criado com a imagem nova
2. Um pod novo sobe (maxSurge=1)
3. Readiness do pod novo responde 200
4. Service adiciona o pod novo aos endpoints
5. Um pod antigo é removido (maxUnavailable=1)
6. Rollout continua até todas as réplicas novas
7. Se readiness falhar, o rollout para e o antigo atende

---

## 11 — Observabilidade

[Voltar ao capítulo](11-observabilidade.md)

**Quizzes**

**Quiz 1.** Por que `userId` não pode ser label de métrica?

**Resposta.** `b` — Porque cada valor distinto cria uma série e a cardinalidade explode, derrubando o Prometheus.

**Comentário.** Cardinalidade = produto dos valores dos labels. 100 mil usuários × endpoints × status = milhões de séries. IDs pertencem a logs e traces, onde a busca é por campo.

**Quiz 2.** O que o cabeçalho `traceparent` carrega entre serviços?

**Resposta.** `c` — Versão, traceId, parentSpanId e flags de amostragem.

**Comentário.** Cada serviço cria seu span e substitui o parentSpanId; o traceId e as flags viajam. Nenhum serviço precisa conhecer o trace inteiro.

**Quiz 3.** Qual combinação descreve corretamente o projeto?

**Resposta.** `a` — Java: agente OTel só para traces, métricas no Micrometer; Exchange: métricas/logs sem traces.

**Comentário.** O agente Java exporta traces para o Alloy; métricas ficam no Actuator. Exchange não tem instrumentação OTel. Faro vai ao receiver do Alloy.

**Quiz 4.** Um alerta de `up == 0` para o Product significa:

**Resposta.** `d` — Que o Prometheus não conseguiu raspar o alvo; pode ser pod down, rede ou endpoint errado.

**Comentário.** `up` mede a coleta, não a qualidade do serviço. É um sinal de disponibilidade do alvo, que exige investigar pod, Service, rede e endpoint.

**Ordens corretas**

**Ordenação 1.** Ordene o runbook de investigação:

1. Alerta de disponibilidade dispara
2. Abrir Platform overview e identificar o serviço
3. Conferir Service RED (rate, erro, p95)
4. Checar Dependencies (Hikari, provider, cache)
5. Abrir trace lento/errado no Tempo
6. Buscar logs com o trace_id no Loki
7. Registrar incidente com o intervalo do dashboard

---

## 12 — Nuvem, deploy e custos

[Voltar ao capítulo](12-nuvem-custos.md)

**Quizzes**

**Quiz 1.** No CaaS, quem é responsável por aplicar patch no JDK?

**Resposta.** `b` — Você, porque o JDK está dentro da sua imagem; o provedor cuida do SO dos hosts.

**Comentário.** CaaS e PaaS diferem no middleware. No CaaS (EKS/ECS), a imagem inclui runtime e bibliotecas; patches dela são seus. O provedor gerencia host/OS.

**Quiz 2.** Por que autoscaling não zera a conta do projeto?

**Resposta.** `d` — Porque EKS, NAT, NLB, RDS e Redis cobram por hora mesmo sem tráfego; zero exige destroy.

**Comentário.** HPA/CA ajustam pods e nós, mas o piso fixo (~US$ 175) permanece. EKS não tem stop; RDS/ElastiCache não têm stop persistente.

**Quiz 3.** Quando o FaaS deixa de ser mais barato que containers sempre ligados?

**Resposta.** `a` — Em tráfego alto e constante, porque ele cobra por invocação e por GB-segundo, enquanto o container tem custo fixo.

**Comentário.** A aula calcula o cruzamento em ~34,9 M req/mês para 100 ms/512 MB. Acima disso, a unidade fixa (container/VM) dilui o custo; abaixo, o FaaS vence.

**Quiz 4.** O que o Terraform do projeto não faz?

**Resposta.** `c` — Aplica Deployments, HPAs e add-ons no cluster.

**Comentário.** A fronteira é explícita: infraestrutura no Terraform; workloads, HPA, metrics-server, CA e Secrets via kubectl/script. Isso não é GitOps.

**Cálculos**

**Cálculo 1.** Qual é o custo fixo mensal aproximado de EKS + 2 nós + NAT + NLB + RDS + Redis (sem tráfego)?

**Resposta.** 210 US$/mês

**Conta.** 73 + 61 + 39 + 28 + 14 + 12 = 227; com volumes/armazenamento chega-se a ≈ 240. O número de referência do projeto é ≈ US$ 240/mês, ≈ US$ 7,90/dia.

**Ordens corretas**

**Ordenação 1.** Ordene o roteiro de decisão de plataforma:

1. Quantos serviços e quantos devs?
2. Precisa de AWS por compliance/créditos?
3. Há time dedicado de plataforma?
4. Carga é constante ou esporádica?
5. Qual o custo fixo mensal aceitável?
6. Escolher o menor modelo que atende
7. Migrar quando o problema for real

---

## 13 — Performance e gargalos

[Voltar ao capítulo](13-performance-gargalos.md)

**Quizzes**

**Quiz 1.** Por que o run com pool 10 foi considerado instável mesmo com 0% de erro HTTP?

**Resposta.** `b` — Porque ele consumiu os slots do RDS e dois pods de Product entraram em crash-loop depois do teste.

**Comentário.** O erro apareceu na pós-condição: sem conexões para iniciar, pods falharam. Um teste precisa verificar restarts e conexões residuais, não só o relatório.

**Quiz 2.** O que o pool 5 demonstrou?

**Resposta.** `c` — Que o gargalo migrou para o Hikari dentro do pod: fila, timeouts e 107 erros 5xx.

**Comentário.** Hikari com active=5, idle=0, waiting=62 e timeout de 3 s. O throughput caiu para 209,8/s e o p95 subiu a 2,21 s. Reduzir demais só move a fila.

**Quiz 3.** Qual afirmação sobre o resultado final é correta?

**Resposta.** `d` — Product ficou em 6/6, p95 1,25 s, zero erros; o teto é HPA/nós, e o SLO de latência não foi cumprido.

**Comentário.** RDS tinha folga; o CA não adicionou nó (já havia 3); p95 1,25 s > 300 ms. Capacidade sem latência não é conformidade com SLO.

**Quiz 4.** O que significa o k6 ter descartado 11.930 iterações?

**Resposta.** `a` — Que o gerador não conseguiu manter a taxa alvo; o throughput medido é um limite inferior, não a capacidade máxima do servidor.

**Comentário.** Modelo aberto com VUs limitados: se o servidor segura, as iterações não iniciam. O número medido subestima a capacidade; para medi-la, aumente VUs/máquina geradora.

**Cálculos**

**Cálculo 1.** Com RDS de 112 conexões, 3 serviços de banco e HPA máximo de 6 réplicas, qual é o pool máximo seguro por pod?

**Resposta.** 6 conexões por pod (máx.)

**Conta.** 112 ÷ (3 × 6) = 6,22. Um pool de 6 cabe no pior caso; 8 só funciona porque o Hikari abre conexões sob demanda e todos os serviços não maximizam ao mesmo tempo.

**Ordens corretas**

**Ordenação 1.** Ordene uma campanha de load test:

1. Definir objetivo, SLO e taxa alvo
2. Escolher o fluxo representativo
3. Registrar SHA, imagens, nós e réplicas
4. Rodar baseline e warm-up
5. Subir a carga em degraus
6. Observar p95, erros, pool, HPA e nós
7. Interpretar o gargalo e registrar evidência
8. Repetir após a correção

---

## 14 — Frontend e entrega

[Voltar ao capítulo](14-frontend.md)

**Quizzes**

**Quiz 1.** Qual é o papel do header `x-site` na borda?

**Resposta.** `c` — Distinguir landing/store/admin na cache key, evitando que o rewrite para `/index.html` compartilhe a mesma entrada.

**Comentário.** Sem um discriminador na cache key, os três sites disputam a mesma entrada e o primeiro cacheado vence para todos.

**Quiz 2.** Por que o token não fica no `localStorage`?

**Resposta.** `b` — Porque qualquer XSS pode lê-lo; cookie HttpOnly não é acessível por JS.

**Comentário.** O cookie HttpOnly troca o risco de XSS-token pelo de CSRF, mitigado com token CSRF e SameSite. É um trade-off controlável.

**Quiz 3.** O route guard do `/admin` é suficiente para autorizar?

**Resposta.** `d` — Não: é UX. A autorização real é no Gateway e no serviço dono.

**Comentário.** Qualquer cliente pode chamar a API diretamente. O guard apenas evita renderizar uma tela que a API negaria; a policy precisa existir no backend.

---

## 15 — Estudo de caso ponta a ponta

[Voltar ao capítulo](15-estudo-de-caso.md)

**Quizzes**

**Quiz 1.** Qual é a resposta mais completa para "o que acontece se o RDS cair"?

**Resposta.** `b` — Catálogo, pedidos, contas e login falham; o Gateway responde erro; Single-AZ exige restore (RTO 1 h, RPO 5 min); Multi-AZ é a correção.

**Comentário.** O banco é ponto único de dados; Auth depende de Account para credenciais. RDS Single-AZ não tem failover automático de baixa latência. O SLO absorve parte, mas não tudo.

**Quiz 2.** Qual é a afirmação **mais defensável** sobre capacidade?

**Resposta.** `c` — Sustentou ~300 req/s de leitura com zero erro e p95 1,25 s; o teto é HPA/nós e o SLO de latência não foi cumprido.

**Comentário.** O alvo de 400 não foi atingido; 52/112 é folga; não houve evento do CA. Capacidade sem latência não é conformidade.

**Quiz 3.** O que mais falta para a arquitetura desacoplar o pós-pedido?

**Resposta.** `a` — Outbox transacional + consumidor idempotente (e DLQ), não apenas um broker.

**Comentário.** Sem outbox, o evento pode se perder ou nascer sem o pedido; sem idempotência, duplicatas. Kafka sozinho não resolve.

---

## 16 — Simulado e banco de questões

[Voltar ao capítulo](16-simulado.md)

**Quizzes**

**Quiz 1.** Um time de 4 pessoas tem 6 serviços e sofre com deploys coordenados. Qual é a leitura mais correta?

**Resposta.** `b` — Provavelmente há um monólito distribuído; consolidar fronteiras ou voltar a um monólito modular pode ser melhor.

**Comentário.** Deploy coordenado é sintoma de fronteira errada ou contrato instável. Microserviços sem autonomia real só somam custo operacional.

**Quiz 2.** A Lei de Conway prevê que:

**Resposta.** `c` — A arquitetura tende a espelhar a estrutura de comunicação da organização.

**Comentário.** A manobra inversa de Conway organiza os times por capacidade de negócio para induzir a arquitetura desejada.

**Quiz 3.** Qual é a melhor fronteira para separar Order de Product?

**Resposta.** `d` — Capacidades de negócio com ciclos de mudança e escala diferentes, com dados próprios.

**Comentário.** DDD estratégico: bounded contexts e subdomínios. O pedido congela o preço praticado; o catálogo mantém o preço atual.

**Quiz 4.** "Database-per-service" com um único servidor PostgreSQL significa:

**Resposta.** `a` — Cada serviço é dono das suas tabelas e só as acessa pelo próprio código; os outros dados vêm por API (idealmente com schema/base e role dedicados).

**Comentário.** A propriedade é lógica. O projeto usa uma base `platform` com tabelas separadas — isolamento por convenção, não físico; por isso nada no banco impede uma query cruzada. O servidor compartilhado cobra o preço no limite de conexões.

**Quiz 5.** Três serviços em série com 99,9% cada. A disponibilidade do caminho é:

**Resposta.** `c` — ≈ 99,7%

**Comentário.** 0,999³ ≈ 0,99702. Retry não melhora disponibilidade de um serviço fora; ele só trata falha transitória.

**Quiz 6.** Durante uma partição, um sistema CP:

**Resposta.** `b` — Recusa ou espera para não servir dado inconsistente.

**Comentário.** CP escolhe consistência; AP escolhe disponibilidade e converge depois. P não é opcional.

**Quiz 7.** PACELC acrescenta ao CAP a escolha entre:

**Resposta.** `d` — Latência e consistência quando não há partição.

**Comentário.** Else (E): na operação normal, replicar de forma síncrona aumenta consistência e latência; assíncrona faz o contrário. Uma réplica de leitura é EL.

**Quiz 8.** No Kafka, a ordem é garantida:

**Resposta.** `a` — Dentro de uma partição; a chave decide a partição.

**Comentário.** Mesma chave → mesma partição → ordem. Sem chave, não há ordem entre eventos relacionados. Adicionar partições pode quebrar a ordem temporariamente.

**Quiz 9.** Por que todo consumidor precisa ser idempotente?

**Resposta.** `c` — Porque a entrega é normalmente at-least-once e efeitos externos não são transacionais com o offset.

**Comentário.** Exactly-once cobre Kafka→Kafka. E-mail, S3 e Postgres exigem deduplicação: tabela de mensagens, upsert ou restrição única.

**Quiz 10.** O transactional outbox:

**Resposta.** `b` — Grava estado e evento na mesma transação local; um relay publica depois.

**Comentário.** Elimina a escrita dupla, mas o relay pode republicar — daí idempotência. Não garante ordem global nem exactly-once fora do banco.

**Quiz 11.** Em uma saga, uma compensação é:

**Resposta.** `d` — Uma ação de negócio que desfaz semanticamente um passo anterior (ex.: liberar estoque, estornar).

**Comentário.** Saga perde isolamento; estados intermediários são visíveis. Compensações precisam ser idempotentes.

**Quiz 12.** Um bom SLI de disponibilidade é:

**Resposta.** `a` — Requisições não-5xx / requisições válidas.

**Comentário.** SLI mede a experiência do usuário como razão de eventos bons por válidos. CPU/heap são causas, não sintomas.

**Quiz 13.** SLO de 99,5% em 28 dias. O error budget é aproximadamente:

**Resposta.** `c` — 3 h 22 min

**Comentário.** 0,5% × 40.320 min = 201,6 min ≈ 3 h 22 min. Sempre cite a janela.

**Quiz 14.** Burn rate de 14,4× significa:

**Resposta.** `b` — O orçamento será consumido em ~1/14,4 da janela; em 1 h, ~2% do budget de 28 dias.

**Comentário.** burn = erro observado / (1−SLO). 14,4× com janela de 28 dias esgota em ~1,9 dia. O par 1 h + 5 min é um alerta precoce.

**Quiz 15.** No circuit breaker, o estado half-open serve para:

**Resposta.** `d` — Liberar poucas chamadas de teste para decidir se fecha ou reabre.

**Comentário.** Closed → Open (falha rápido) → Half-open (testa) → Closed/Open. O fallback fica na camada externa ao retry.

**Quiz 16.** Por que a liveness não deve incluir o banco?

**Resposta.** `a` — Uma oscilação do banco reiniciaria todas as réplicas, ampliando a indisponibilidade.

**Comentário.** Liveness responde "processo travado?". Dependência externa pertence à readiness, com cautela.

**Quiz 17.** HPA com request de 250m e alvo de 70% escala quando o pod usa:

**Resposta.** `c` — 175m, 70% da request.

**Comentário.** A utilização é sobre a request. O limite só define throttling. Request mal dimensionada distorce o gatilho.

**Quiz 18.** Um PDB com `minAvailable: 1` e 2 réplicas:

**Resposta.** `b` — Garante que uma réplica continue disponível durante drain/upgrade voluntário.

**Comentário.** PDB só limita interrupções voluntárias. Falha de nó, OOM e deploy não são cobertos por ele.

**Quiz 19.** Qual é a fronteira correta entre Terraform e Kubernetes no projeto?

**Resposta.** `d` — Terraform cria VPC, EKS, RDS, ECR, S3, CloudFront; kubectl/scripts aplicam workloads, HPA e add-ons.

**Comentário.** IaC de infraestrutura ≠ GitOps de aplicação. O deploy é shell-first.

**Quiz 20.** No EKS, o que continua sendo responsabilidade do time?

**Resposta.** `a` — Node groups, add-ons, workloads, rede, RDS e custos.

**Comentário.** O control plane é gerenciado; nós, add-ons, manifests, banco e FinOps são seus.

**Quiz 21.** PKCE no Authorization Code serve para:

**Resposta.** `c` — Impedir que um código interceptado seja trocado por token sem o verifier.

**Comentário.** O cliente envia o hash (challenge) na autorização e prova o segredo (verifier) na troca. Essencial em SPA/mobile.

**Quiz 22.** Por que a sessão do projeto usa cookie HttpOnly em vez de localStorage?

**Resposta.** `b` — Porque XSS não lê cookie HttpOnly; o custo é CSRF, mitigado com token e SameSite.

**Comentário.** Trade-off controlável: XSS-token é catastrófico e silencioso; CSRF é mitigável no backend.

**Quiz 23.** Um endpoint autenticado devolve o pedido de outro usuário. O controle ausente é:

**Resposta.** `d` — Autorização no nível do objeto (ownership), no serviço dono.

**Comentário.** OWASP API #1: BOLA/IDOR. O Gateway não sabe o dono; o Order precisa verificar e retornar 404/403.

**Quiz 24.** Qual método combina com qual alvo?

**Resposta.** `a` — RED para serviços; USE para recursos.

**Comentário.** RED (rate, errors, duration) descreve a experiência do serviço; USE (utilization, saturation, errors) descreve recursos.

**Quiz 25.** Qual label é seguro para uma métrica Prometheus?

**Resposta.** `c` — `route="/orders/{id}"` e `status="500"`

**Comentário.** Alta cardinalidade derruba o Prometheus. Use template de rota, status, método; IDs vão para logs/traces.

**Quiz 26.** O `traceparent` NÃO carrega:

**Resposta.** `b` — O corpo da requisição ou o JWT

**Comentário.** Ele carrega versão, trace-id, parent-span-id e flags. Cada serviço cria seu span e propaga o contexto.

**Quiz 27.** Por que os três frontends não compartilham a mesma entrada de cache no CloudFront?

**Resposta.** `d` — Porque a função de borda adiciona `x-site` e ele entra na cache key.

**Comentário.** Sem o discriminador, o rewrite para `/index.html` faz todos os paths compartilharem a primeira entrada cacheada.

**Quiz 28.** Quem decide o preço de um item de pedido?

**Resposta.** `a` — O Product, consultado pelo Order; o preço praticado é congelado no item.

**Comentário.** O cliente não pode sobrescrever preço. O Order lê o preço atual via API e persiste o total em USD; a conversão é só na resposta.

**Quiz 29.** Qual é uma limitação real do LocalStack no projeto?

**Resposta.** `c` — O EKS é k3s; rede/zonas/HA não são reais e o CloudFront é emulado.

**Comentário.** É rehearsal: valida Terraform e manifests, não comportamento de rede, multi-AZ ou durabilidade.

**Quiz 30.** Em que ponto o FaaS deixa de ser a opção mais barata?

**Resposta.** `b` — Em tráfego alto e constante, porque cobra por invocação/GB-s contra um custo fixo de container.

**Comentário.** A aula estima o cruzamento em ~34,9 M req/mês para 100 ms/512 MB. Escala alta e constante favorece unidade fixa.

**Cálculos**

**Cálculo 1.** 1. Um serviço com SLO de 99,5% em 28 dias observa 5% de erro. Em quantos dias o budget esgota, se a taxa se mantiver?

**Resposta.** 2,8 dias

**Conta.** burn = 5/0,5 = 10×. 28/10 = 2,8 dias. O alerta de 1 h + 5 min pegaria bem antes.

**Cálculo 2.** 2. Disponibilidade de um caminho com 3 serviços em série a 99,9% (em %).

**Resposta.** 99,7 %

**Conta.** 0,999³ = 0,997029… → 99,7%. Cerca de 26 h/ano.

**Cálculo 3.** 3. Se o HPA começa a escalar com 2,1 vCPU agregados e cada requisição custa 10 ms de CPU, qual a taxa aproximada?

**Resposta.** 210 req/s

**Conta.** 2,1 / 0,010 = 210 req/s. Com 5 ms, 420; com 25 ms, 84; com 50 ms, 42.

**Cálculo 4.** 4. RDS com 112 conexões, 3 serviços de banco e pool 8. Quantas réplicas por serviço cabem?

**Resposta.** 4,7 réplicas/serviço

**Conta.** 112 / (3 × 8) = 4,67. Com HPA max 6, o pior caso simultâneo estoura — o pool seguro seria ≤ 6.

**Cálculo 5.** 5. Quantos minutos de indisponibilidade um SLO de 99,9% permite em uma semana (7 dias)?

**Resposta.** 10,08 min

**Conta.** 0,1% × 7 × 24 × 60 = 10,08 min. O mesmo SLO em 28 dias permite 40,3 min; em um mês de 30,44 dias, 43,8 min. **Sempre recalcule a janela** — este é o erro mais comum.

**Respostas abertas e roteiro**

**1. Explique por que o Gateway é o único ponto público e o que isso protege.**

Ele concentra autenticação, CSRF, CORS, autorização de papel e roteamento. Serviços internos confiam no header de identidade, então precisam ser inalcançáveis de fora; caso contrário, qualquer cliente forjaria `id-account`. O Gateway também reduz a superfície de ataque e permite trocar a topologia interna sem mudar clientes. O custo é ser ponto crítico e potencial gargalo — mitigado com réplicas, HPA e PDB.

**2. Descreva o caminho de um pedido com conversão e aponte dois riscos.**

CloudFront → NLB → Gateway (JWT/CSRF) → Order → Product (preço) → transação no Postgres → resposta. A conversão via Exchange está prevista no contrato, mas hoje o Order responde 422 para não-USD e não chama o serviço. Riscos quando ativada: (a) a conversão síncrona alonga a cadeia e pode falhar depois do commit, sem compensação; (b) não há idempotência, então um retry pode duplicar o pedido. Mitigações: converter antes do commit ou tornar a conversão opcional; chave de idempotência.

**3. Compare notificação por REST síncrono e por evento.**

REST síncrono: o pedido espera o e-mail; falha do serviço de e-mail falha o pedido ou obriga fallback; simples de rastrear. Evento: o pedido publica `OrderCreated` e responde; o consumidor envia depois, com retry/DLQ; ganha disponibilidade e latência, mas exige outbox (para não perder o evento), idempotência (duplicatas), DLQ e observabilidade de lag. Para e-mail, evento é a escolha natural.

**4. Como você levaria o sistema a 99,9%? Ordene por custo-benefício.**

1) RDS Multi-AZ (maior ganho; remove o maior SPOF); 2) spread por zona (anti-affinity/topologySpread) para as réplicas; 3) breaker/timeout/fallback no Exchange e no Product; 4) PDB e probes corretas; 5) HPA/CA com pool dimensionado; 6) multi-região/DR se o requisito exigir. Antes de prometer, medir RTO/RPO e rodar GameDay.

**5. Por que o pool 10 falhou e o 8 funcionou? O que isso ensina?**

Pool 10 × 6 réplicas × 3 serviços = 180 conexões possíveis, acima de 112; durante o teste o RDS chegou a 70–71 e recusou novas conexões, derrubando pods no startup. Pool 5 protegeu o banco mas criou fila no Hikari (`waiting=62`, timeout 3 s, 107 5xx). Pool 8 equilibrou: 52/112, zero erro, 6/6 pods. Ensina que o pool é uma decisão **de sistema** (banco × pods × tempo de transação) e que a pós-condição importa.

**6. Quais são as três lacunas mais graves e por quê?**

(a) RDS Single-AZ: ponto único de dados, sem failover automático; (b) ausência de outbox/eventos: falha após commit não é reprocessada e o pós-pedido fica no request path; (c) ausência de breaker/fallback completo no Exchange e de teste de falha do provedor: dependência externa não exercitada. Depois: NetworkPolicy/mTLS, spread por zona e GitOps.

**Roteiro de resposta**

- **E-mail e miniatura:** assíncronos. `OrderCreated` e `ProductImageAttached`. Checkout não espera. Histórico/analytics: projeção assíncrona (CQRS leve).
- **Outbox:** `orders` + `outbox` na mesma transação; relay publica `order-events`; imagens idem nas tabelas do Product. Chave = `orderId` / `productId` para ordenar por agregado; partições dimensionadas desde o início.
- **Idempotência:** tabela `processed_messages(event_id, consumer)` na mesma transação do efeito; e-mail com chave única `orderId+template`; miniatura com upsert por `assetId`; analytics com `event_id` único.
- **Falhas:** retry com backoff para transitórias; DLQ para inválidas; alarme de DLQ e lag; replay documentado.
- **Métricas:** lag por grupo, taxa de retry, tamanho da DLQ, latência de projeção, idade do último evento; alerta se lag > X ou DLQ > 0 por 10 min. Trace: propagar `traceparent` no header do evento.
- **SLO:** checkout continua com p95 800 ms; novos SLOs para “e-mail em até 1 min” e “miniatura em até 30 s”, com error budget separado.

---

## 17 — Glossário e cheatsheet

[Voltar ao capítulo](17-glossario-cheatsheet.md)

**Flashcards**

**Cartão 1.** SLI × SLO × SLA

**Verso.** SLI = medida (bons/válidos); SLO = meta interna com janela; SLA = contrato com consequência.

**Cartão 2.** Error budget de 99,5% em 28 dias

**Verso.** 0,5% × 40.320 min = 201,6 min ≈ 3 h 22 min.

**Cartão 3.** Liveness × readiness

**Verso.** Liveness reinicia o processo travado; readiness remove do balanceador sem reiniciar.

**Cartão 4.** Por que a liveness não olha o banco?

**Verso.** Uma oscilação do banco reiniciaria todas as réplicas juntas, ampliando a indisponibilidade.

**Cartão 5.** Pool máximo por pod

**Verso.** max_connections ÷ (serviços de banco × réplicas). 112 ÷ (3 × 6) ≈ 6.

**Cartão 6.** Transactional outbox

**Verso.** Estado + evento na mesma transação local; relay publica; consumidor idempotente.

**Cartão 7.** CAP em uma frase

**Verso.** Partição é inevitável; durante ela, escolha consistência (CP) ou disponibilidade (AP).

**Cartão 8.** Gargalo final do projeto

**Verso.** maxReplicas 6 do Product + CPU dos nós; RDS em 52/112 conexões não é o limite.

---

## 18 — O que não foi implementado

[Voltar ao capítulo](18-lacunas-e-evolucao.md)

**Quizzes**

**Quiz 1.** Qual é a melhor justificativa para não ter Kafka no projeto?

**Resposta.** `c` — Não há consumidor real e o custo operacional (broker, schema, lag, DLQ, idempotência) não se pagava; outbox + um consumidor seria o primeiro passo.

**Comentário.** Eventos são uma decisão de acoplamento, não de modernidade. Sem consumidor e sem requisito, o custo supera o benefício; a fundação correta é outbox + idempotência.

**Quiz 2.** Qual é o maior benefício de RDS Multi-AZ para este projeto?

**Resposta.** `b` — Reduzir o RTO/RPO de uma falha de banco/zona com failover automático.

**Comentário.** Multi-AZ é HA/standby, não leitura. Read replica escala leitura; backup/PITR protege contra erro humano. O ganho aqui é disponibilidade de dados.

**Quiz 3.** O que o mTLS não resolve sozinho?

**Resposta.** `d` — Autorização: quem pode chamar qual rota/método.

**Comentário.** mTLS autentica os dois lados; a política (AuthorizationPolicy/RBAC) decide o que cada identidade pode fazer. Sem política, o certificado só criptografa.

**Quiz 4.** Por que o cache do catálogo está desligado?

**Resposta.** `a` — Porque cache de preço exige invalidação correta e não havia requisito; ligar sem isso arrisca preço velho.

**Comentário.** Cache é AP: o valor pode ficar velho. Sem invalidação/versionamento e sem requisito de escala, o risco supera o ganho. O primeiro passo seria cache-aside com TTL curto e invalidação no write.

**Quiz 5.** Qual é a forma correta de responder “vocês têm Zero Trust?”

**Resposta.** `c` — “Na borda sim (TLS, JWT, CSRF, autorização por objeto); no leste-oeste não (sem mTLS, NetworkPolicy parcial). O próximo passo é default-deny e, depois, mesh/Cilium.”

**Comentário.** Zero Trust é verificação contínua, não “rede privada”. Uma boa resposta separa camadas e aponta o próximo passo mensurável.

---

## Perguntas de arguição

As respostas abaixo vêm das seções **Como responder**, **Defesa oral** e **Como falar de lacunas** de cada capítulo. Foram copiadas para cá para deixar o gabarito completo; o contexto original continua no capítulo.

### 01 — O projeto por dentro

[Voltar ao capítulo](01-projeto.md)

**Por que não um monólito?**

Porque o objetivo era aprender autonomia de deploy e escala por serviço, e o domínio já tinha fronteiras claras (catálogo, pedido, câmbio, identidade). O custo foi operacional: seis pipelines, service discovery, observabilidade e um banco com limites de conexão. Para um time de 2–3 pessoas e um produto real, eu começaria com um monólito modular.

**Por que o banco é compartilhado se vocês dizem database-per-service?**

A propriedade é **lógica e por convenção**: cada serviço só consulta as suas tabelas (`accounts`, `products`, `orders`, `order_items`) e obtém dados dos outros por API. Não há isolamento físico — Compose e EKS apontam todos para a mesma base `platform`, no mesmo schema; Product usa Flyway, Account e Order usam JPA. É uma simplificação de custo e uma limitação real: nada no banco impede uma query cruzada, só a disciplina e a revisão. O limite de 112 conexões mostra que o compartilhamento cobra preço.

**Qual foi o gargalo real?**

Na leitura de catálogo a 400 req/s, o pool de 10 estourou os slots do RDS e dois pods de Product entraram em crash-loop. Com pool 5, o gargalo virou Hikari dentro do pod (107 erros 5xx). Com pool 8, zero erros, 299,6 req/s, p95 1,25 s, RDS em 52/112. O teto passou a ser o `maxReplicas: 6` do Product e a CPU dos nós — não o banco.

**O que você faria diferente?**

Multi-AZ no RDS e um pool calculado a partir de `max_connections ÷ (serviços × réplicas)`; outbox para o pós-pedido; Argo CD em vez de deploy manual; e um teste de falha do provedor de câmbio, que ficou pendente.

### 04 — APIs e contratos

[Voltar ao capítulo](04-apis.md)

**Como vocês evitam quebra de contrato?**

Contrato em OpenAPI versionado no repositório do serviço; teste de contrato no CI; mudanças aditivas primeiro; a imagem é imutável por SHA, então o consumidor pode fixar a versão que testou. A lacuna é não haver um schema registry para eventos — não há eventos.

**Por que não GraphQL?**

O domínio é simples e orientado a recursos; o custo de um gateway GraphQL (N+1, autorização por campo, cache) não se pagaria. REST + OpenAPI dá cache HTTP, status claros e ferramentas prontas. Para agregação de múltiplas telas, um BFF seria a alternativa antes de GraphQL.

**Qual a diferença entre 400 e 422 aqui?**

400 é requisição malformada/inválida (JSON, UUID, quantidade). 422 é semanticamente inprocessável: a requisição está bem formada, mas a moeda não é suportada. O projeto usa 422 para moeda desconhecida no Order/Exchange — e, hoje, para qualquer moeda ≠ USD no Order, porque a integração de conversão está pendente.

### 05 — Microsserviços e DDD

[Voltar ao capítulo](05-microsservicos-ddd.md)

**Como vocês decidiram os serviços?**

Por capacidade de negócio e contexto: catálogo, pedido, câmbio, identidade, contas e borda. A evidência de que a fronteira está certa é que cada um tem tabelas próprias e pode ser implantado sozinho. O contraexemplo seria um serviço por tabela (`order_item`), que não teria comportamento nem deploy independente.

**Por que não juntar Product e Order?**

Porque têm ciclos de mudança e escalas diferentes: catálogo é leitura intensiva e pública; pedido é escrita autenticada e depende de preço. Juntar reduziria uma chamada de rede, mas acoplaria o deploy e a escala dos dois — e o preço praticado no pedido precisa ser congelado de qualquer forma.

**O que é monolito distribuído e o projeto é um?**

É um sistema com muitos processos, mas acoplamento de monólito: deploy conjunto, tabelas compartilhadas, cadeia síncrona longa. O projeto tem uma cadeia curta (Order → Product; Exchange previsto) e contratos, então não é; mas o risco de a cadeia crescer é real, e o caminho é evento/outbox.

### 06 — Arquiteturas de software

[Voltar ao capítulo](06-arquiteturas.md)

**Vocês usam Clean Architecture?**

Nos serviços CRUD, ficamos em camadas pragmáticas com DTOs e repositórios separados. No Exchange, usamos a ideia hexagonal no ponto que importa: uma porta `ExchangeProvider` e um adaptador que traduz o provedor. A escolha é proporcional ao risco: cerimônia em um CRUD de produto não pagaria o custo.

**Qual o benefício real de inverter a dependência?**

Testar a regra de negócio sem banco/rede e poder trocar o mecanismo de persistência ou entrega sem tocar no caso de uso. No projeto, isso aparece no adapter do provedor de câmbio: trocar o provedor não muda o modelo `Rate` nem o serviço.

**Por que não CQRS/Event Sourcing?**

O volume e a assimetria não justificavam. CQRS traria consistência eventual e mais infraestrutura; Event Sourcing exigiria versionar eventos para sempre. O catálogo é CRUD com leitura simples. Se o catálogo crescesse para milhões de leituras, um read model seria o próximo passo.

### 07 — Segurança e identidade

[Voltar ao capítulo](07-seguranca.md)

**JWT é seguro?**

JWT é um formato, não uma garantia. A segurança depende de algoritmo fixo, segredo protegido, expiração curta, validação de `iss`/`aud` e de não guardar o token onde JS alcança. Um JWT no `localStorage` com 24 h é uma vulnerabilidade, mesmo assinado.

**Por que o Gateway valida o token e os serviços validam de novo?**

Defesa em profundidade: o Gateway rejeita cedo e aplica a política de borda; o serviço rejeita mesmo que seja alcançado por dentro e aplica a política fina (dono do objeto). O custo é distribuir o segredo HMAC para todos, o que significa que um serviço comprometido pode forjar tokens. A evolução é chave assimétrica + JWKS: cada serviço valida com a pública e só o Auth assina.

**Por que cookie e não Bearer no frontend?**

Porque o frontend é estático e não há BFF. Cookie `HttpOnly` impede leitura por XSS; o custo é CSRF, mitigado com token e `SameSite`. Bearer continua aceito para clientes de API.

**O que é Zero Trust na prática?**

Não confiar no endereço de rede. Cada chamada carrega identidade verificável (token/mTLS) e é autorizada por política. O projeto faz isso na borda (JWT + papéis) e tem a lacuna no leste-oeste (serviço a serviço), onde a rede ainda é o perímetro.

### 09 — Confiabilidade e SLOs

[Voltar ao capítulo](09-confiabilidade.md)

**Qual o SLO e o que acontece se violar?**

99,5% em 28 dias para disponibilidade, com error budget de 3 h 22 min. Burn rate alto paga plantão; queima lenta abre ticket. O projeto não tem SLA jurídico; se tivesse, o SLO seria mais estrito que o SLA para dar margem.

**Como vocês evitam falha em cascata?**

Timeout em toda chamada, retry só idempotente e em uma camada, breaker com limiar de lentidão abaixo do timeout, bulkhead por dependência e fallback seguro. Na prática, o projeto tem timeout e réplicas; o breaker é a evolução necessária para o Exchange.

**Vocês fazem chaos engineering?**

Ainda não. Sabemos qual seria o primeiro experimento: latência no provedor de câmbio, porque é a dependência externa e o fluxo de conversão não foi testado sob falha. Sem métrica/trace, não faria sentido.

### 10 — Kubernetes e alta disponibilidade

[Voltar ao capítulo](10-kubernetes-ha.md)

**O que garante alta disponibilidade no projeto?**

Três camadas: duas réplicas por serviço com readiness, PDB preservando uma durante drain e node group em duas AZs. Mas HA real é limitada por RDS Single-AZ, ausência de anti-affinity explícita e um único NAT/NLB. É HA de processo e de nó, não de zona/região completa.

**Como vocês escalam?**

HPA de 2 a 6 a 70% da request de CPU, com metrics-server; Cluster Autoscaler de 2 a 6 nós quando há pod Pending. A latência de resposta é 15 s do HPA + 20–40 s do pod + 60–90 s do nó, então um pico leva 1,5–3 min para ser absorvido. E o banco limita antes da CPU: 112 conexões.

**Rolling update derruba?**

Com `maxUnavailable: 1` e `maxSurge: 1`, há sempre uma réplica atendendo; o rollout para se a nova não ficar Ready. O risco residual é o endpoint demorar a remover o pod antigo; um `preStop` com sleep e um grace period maior fecham essa janela.

**O que você mudaria primeiro?**

Probes separadas (`/actuator/health/liveness` e `/readiness`), `topologySpreadConstraints`, RDS Multi-AZ e um pool calculado por `max_connections / (serviços × réplicas)`. Depois, NetworkPolicy default-deny e breaker no cliente do Exchange.

### 11 — Observabilidade

[Voltar ao capítulo](11-observabilidade.md)

**Qual a diferença entre monitoramento e observabilidade?**

Monitoramento verifica hipóteses conhecidas; observabilidade permite investigar o desconhecido a partir de sinais correlacionados. Na prática: um alerta de dashboard é monitoramento; entrar do erro para o trace e daí para o log com o mesmo `trace_id` é observabilidade.

**Como vocês encontram a causa de um checkout lento?**

O trace mostra os spans por salto (Gateway, Order, Product, Exchange). O span mais longo aponta o serviço; o p95 do RED confirma se é sistêmico; o dashboard de dependências mostra Hikari/provider; o log com `trace_id` dá o detalhe. Se o p95 sobe em todos os pods, o problema é downstream ou banco.

**Por que 20% de amostragem?**

Custo de armazenamento e overhead. Head sampling de 20% é suficiente para tendências; erros raros podem escapar. A evolução é head alto + tail sampling no Collector para manter 100% dos traces com erro.

**O que falta?**

Traces no Exchange, Pyroscope com agentes, verificação do stack no EKS (os manifests estão preparados, não aplicados) e métricas de negócio (pedidos/min, conversão). Também não há SLO dashboard com dados de produção AWS.

### 12 — Nuvem, deploy e custos

[Voltar ao capítulo](12-nuvem-custos.md)

**Por que EKS e não ECS/Railway?**

Porque o objetivo era aprender Kubernetes e operar a stack completa (HPA, PDB, probes, add-ons, IRSA). Para um produto real de 2–3 pessoas, ECS Fargate ou Railway seria mais barato e simples: o piso do EKS é ~US$ 73 + nós + NAT + NLB. A escolha é didática, e o custo está documentado.

**Por que a conta é US$ 240 se o tráfego é mínimo?**

Porque 60% é custo fixo: control plane (73), NAT (39), NLB (28), RDS (14), Redis (12) e nós (61). Requisição quase não pesa; horas ligadas pesam. Por isso o budget de 150 exige agendar ou destruir.

**O que é IRSA e por que importa?**

IAM Roles for Service Accounts: o pod assume uma role via token OIDC da service account, sem access key no container. O Product acessa o bucket de mídia com least privilege. É a versão Kubernetes de "credencial de workload", alinhada a Zero Trust.

**Vocês usam GitOps?**

Não. O deploy é shell-first com Terraform + kubectl; os workflows manuais chamam o mesmo script via OIDC. GitOps (Argo CD) é o próximo passo para reconciliação contínua e auditoria, mas adicionaria um componente e um modelo operacional.

### 13 — Performance e gargalos

[Voltar ao capítulo](13-performance-gargalos.md)

**Qual é o gargalo do sistema?**

Na leitura de catálogo, o teto medido é o `maxReplicas: 6` do Product e a CPU dos nós, não o banco: 299,6 req/s, p95 1,25 s, RDS em 52/112 e ~15% de CPU. Antes do tuning, o gargalo era o pool de conexões: pool 10 estourou slots e derrubou pods; pool 5 estourou o Hikari; pool 8 estabilizou.

**Por que não aumentar o pool para 20?**

Porque 3 serviços × 6 réplicas × 20 = 360 conexões, muito acima de 112. O pool precisa ser dimensionado pelo banco, não pela vontade de paralelismo. A alternativa é RDS maior ou PgBouncer.

**O teste prova que aguentam 300 req/s?**

Prova que o servidor sustentou ~300 req/s de leitura com zero erro naquela configuração. Não prova escrita em AWS, nem picos, nem falha de dependência, e o gerador descartou 11.930 iterações — então é um limite inferior. A meta de p95 300 ms não foi cumprida.

**O que faria primeiro?**

Um teste de breakpoint para achar a curva real, depois elevar HPA/node group e reduzir CPU por requisição. Em paralelo, pool ≤ 6 e um teste de falha do provedor de câmbio, que é a dependência externa não exercitada.

### 14 — Frontend e entrega

[Voltar ao capítulo](14-frontend.md)

**Por que static export e não SSR?**

Porque o conteúdo é catálogo público e o estado privado vem de API autenticada. Static + CDN elimina servidor de frontend, reduz custo e superfície de ataque, e simplifica o deploy. O custo é não ter SSR/SEO dinâmico nem BFF; para uma loja demo, não se paga.

**Onde fica a sessão?**

Em um cookie HttpOnly emitido pelo Gateway, com CSRF e `SameSite=Lax`. O frontend não lê o token; o Gateway o traduz para Bearer. Isso evita XSS de token e mantém clientes de API funcionando.

**Como os três apps não se misturam no cache?**

Cada um tem base path e buckets separados; uma função de borda adiciona `x-site` e o header entra na cache key. Sem isso, o rewrite para `/index.html` fazia os três compartilharem a mesma entrada.

**O PWA funciona offline?**

Não. É um manifest instalável, sem service worker. Cachear respostas privadas e reenviar escritas offline seria um risco; o escopo é online-only, e a documentação diz isso.

### 15 — Estudo de caso ponta a ponta

[Voltar ao capítulo](15-estudo-de-caso.md)

**1. Por que microsserviços e não um monólito?**

Objetivo didático e fronteiras de domínio claras. O custo é operacional: seis pipelines, service discovery, observabilidade, banco com limite. Para um produto real com 2–3 pessoas, o monólito modular seria a escolha inicial.

**2. O que é database-per-service se há um só servidor?**

Propriedade lógica por convenção: cada serviço só consulta as suas tabelas e os outros dados vêm por API. Não há isolamento físico — todos usam a base `platform` —, então nada no banco impede uma query cruzada; a garantia é revisão e contrato. O limite de 112 conexões é a evidência do trade-off de compartilhar o servidor.

**3. Por que o Gateway valida o token e os serviços validam de novo?**

Defesa em profundidade: a borda rejeita cedo; o serviço rejeita mesmo se for alcançado por dentro e checa o dono do objeto. O custo é o mesmo segredo HMAC em todos, então um serviço comprometido pode assinar tokens. A correção é RS256/ES256 + JWKS, com só o Auth tendo a chave privada.

**4. Como garantem que um usuário não lê o pedido de outro?**

O Order verifica a propriedade e retorna 404. Autenticação no Gateway não basta; é o OWASP API #1 (BOLA). O admin também é validado no serviço, não só na UI.

**5. Qual o SLO e como ele vira alerta?**

99,5% em 28 dias, error budget de 3 h 22 min. Alertas de disponibilidade e burn rate; o stack local usa < 99% por 5 min (page) e < 99,5% por 30 min (ticket). O p95 de produto é 300 ms e o de pedido, 800 ms.

**6. O que acontece se o Exchange ficar lento?**

Hoje o Order não chama o Exchange para moeda ≠ USD: retorna 422, então o caminho de conversão não está exposto. Com a integração ativa, o Order precisa de timeout e erro explícito — nunca inventar taxa. O Exchange já tem timeout no provedor e cache curto; faltam breaker/fallback e o teste de falha do provedor.

**7. Por que não há Kafka?**

Escopo e custo. O fluxo principal é síncrono e funciona; o que falta é desacoplar efeitos pós-pedido. A evolução correta é outbox + consumidor idempotente, não "colocar Kafka" por si só.

**8. Como o HPA e o banco interagem?**

HPA escala pods por CPU, mas cada pod abre conexões. Com 3 serviços × 6 réplicas × 8 = 144, acima de 112. O pool precisa ser ≤ 6 no pior caso, ou o RDS precisa ser maior/PgBouncer. Na medição, o Hikari abriu 52 porque nem tudo estava no pico.

**9. Por que o teste com pool 10 parecia bom e era ruim?**

Zero erros durante o teste, mas os slots do RDS foram consumidos e dois pods não subiram depois. A pós-condição é parte do teste. Pool 5 mostrou o outro extremo: fila no Hikari e 107 5xx.

**10. Como vocês observam um pedido específico?**

Pelo `trace_id`: o trace no Tempo mostra os spans por serviço; o log estruturado no Loki tem o mesmo ID; as métricas RED mostram se é sistêmico. O traceparent W3C propaga; o agente Java injeta.

**11. Qual o maior risco arquitetural hoje?**

RDS Single-AZ + cadeia síncrona + ausência de outbox. O banco é ponto único de dados; a cadeia acopla disponibilidade; e uma falha após o commit não é reprocessada. A ordem de correção: Multi-AZ, breaker no Exchange, outbox.

**12. O que você faria com mais tempo/dinheiro?**

Multi-AZ, pool dimensionado/PgBouncer, GitOps com Argo CD, spread por zona, NetworkPolicy default-deny, traces no Exchange, teste de caos do provedor e um domínio customizado com ACM. Cada item com o custo e o SLI que melhora.

### 18 — O que não foi implementado

[Voltar ao capítulo](18-lacunas-e-evolucao.md)

**Por que não há Kafka?**

Não há evento porque o MVP não tem consumidor real e o custo operacional (broker, schema, lag, DLQ, idempotência) não se pagava. O ganho seria desacoplar notificação/analytics e absorver picos. O primeiro passo seria outbox + `OrderCreated` + um consumidor idempotente, medindo lag e DLQ. Kafka sozinho não resolveria: sem outbox, o evento pode se perder.

**Por que o RDS é Single-AZ?**

Custo: Multi-AZ dobra a linha do banco e o orçamento é US$ 150. O risco é um SPOF de dados com RTO de restore (~1 h) e RPO de 5 min. O primeiro passo é ligar Multi-AZ e rodar um failover drill; mediria RTO/RPO.

**Vocês têm Zero Trust?**

Na borda sim: TLS, JWT, CSRF, autorização por objeto. No leste-oeste, não: sem mTLS e com NetworkPolicy parcial. O ganho seria limitar movimento lateral. O primeiro passo barato é default-deny + allow por fluxo; depois mesh/Cilium. Mediria fluxos negados e rotação de certificado.

**Por que não há cache se o Redis está lá?**

Porque cache de preço exige invalidação correta e o carrinho é local; ligar sem isso seria pior. O ganho seria p95 menor e menos QPS no RDS. O primeiro passo é cache-aside por `productId` com TTL curto e invalidação no write, medindo hit ratio e preço divergente.

**O deploy é contínuo?**

É CI completo + deploy manual reproduzível. O ganho do GitOps/canary seria auditabilidade e menos risco por release; não usamos por tamanho de time e por querer o operador vendo o plano. O primeiro passo é Argo CD com o overlay atual; mediria DORA.

---
