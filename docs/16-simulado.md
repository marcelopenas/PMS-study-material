# Simulado e banco de questões

<span class="study-tag prova">prova</span>

Feche as outras abas. Responda primeiro, confira depois. As questões de múltipla escolha corrigem na hora; as abertas têm um roteiro de resposta — compare com o seu, não decore.

**Tempo sugerido:** 90 minutos (30 MCQ + 4 cálculos + 6 abertas + 1 exercício de desenho).

---

## Parte A — Múltipla escolha (30)

<div data-study-score></div>

<div class="study-quiz" data-answer="b">
  <p class="q">1. Um time de 4 pessoas tem 6 serviços e sofre com deploys coordenados. Qual é a leitura mais correta?</p>
  <ul class="options">
    <li data-key="a">Precisa de mais serviços para desacoplar.</li>
    <li data-key="b">Provavelmente há um monólito distribuído; consolidar fronteiras ou voltar a um monólito modular pode ser melhor.</li>
    <li data-key="c">O problema é só falta de Kubernetes.</li>
    <li data-key="d">Deve adotar Kafka imediatamente.</li>
  </ul>
  <p class="explain">Deploy coordenado é sintoma de fronteira errada ou contrato instável. Microserviços sem autonomia real só somam custo operacional.</p>
</div>

<div class="study-quiz" data-answer="c">
  <p class="q">2. A Lei de Conway prevê que:</p>
  <ul class="options">
    <li data-key="a">Serviços pequenos são sempre mais rápidos.</li>
    <li data-key="b">O número de serviços deve ser igual ao de tabelas.</li>
    <li data-key="c">A arquitetura tende a espelhar a estrutura de comunicação da organização.</li>
    <li data-key="d">Times remotos produzem menos bugs.</li>
  </ul>
  <p class="explain">A manobra inversa de Conway organiza os times por capacidade de negócio para induzir a arquitetura desejada.</p>
</div>

<div class="study-quiz" data-answer="d">
  <p class="q">3. Qual é a melhor fronteira para separar Order de Product?</p>
  <ul class="options">
    <li data-key="a">Uma tabela, um serviço.</li>
    <li data-key="b">Uma camada (controller, service, repository) por serviço.</li>
    <li data-key="c">O que o time estiver desenvolvendo neste mês.</li>
    <li data-key="d">Capacidades de negócio com ciclos de mudança e escala diferentes, com dados próprios.</li>
  </ul>
  <p class="explain">DDD estratégico: bounded contexts e subdomínios. O pedido congela o preço praticado; o catálogo mantém o preço atual.</p>
</div>

<div class="study-quiz" data-answer="a">
  <p class="q">4. "Database-per-service" com um único servidor PostgreSQL significa:</p>
  <ul class="options">
    <li data-key="a">Cada serviço é dono das suas tabelas e só as acessa pelo próprio código; os outros dados vêm por API (idealmente com schema/base e role dedicados).</li>
    <li data-key="b">Todos podem ler as tabelas, desde que usem views.</li>
    <li data-key="c">É proibido por definição.</li>
    <li data-key="d">Cada serviço precisa de um cluster separado.</li>
  </ul>
  <p class="explain">A propriedade é lógica. O projeto usa uma base `platform` com tabelas separadas — isolamento por convenção, não físico; por isso nada no banco impede uma query cruzada. O servidor compartilhado cobra o preço no limite de conexões.</p>
</div>

<div class="study-quiz" data-answer="c">
  <p class="q">5. Três serviços em série com 99,9% cada. A disponibilidade do caminho é:</p>
  <ul class="options">
    <li data-key="a">99,9%</li>
    <li data-key="b">99,99%</li>
    <li data-key="c">≈ 99,7%</li>
    <li data-key="d">100% com retries</li>
  </ul>
  <p class="explain">0,999³ ≈ 0,99702. Retry não melhora disponibilidade de um serviço fora; ele só trata falha transitória.</p>
</div>

<div class="study-quiz" data-answer="b">
  <p class="q">6. Durante uma partição, um sistema CP:</p>
  <ul class="options">
    <li data-key="a">Responde com dados possivelmente desatualizados.</li>
    <li data-key="b">Recusa ou espera para não servir dado inconsistente.</li>
    <li data-key="c">Ignora a partição.</li>
    <li data-key="d">Sempre fica indisponível para sempre.</li>
  </ul>
  <p class="explain">CP escolhe consistência; AP escolhe disponibilidade e converge depois. P não é opcional.</p>
</div>

<div class="study-quiz" data-answer="d">
  <p class="q">7. PACELC acrescenta ao CAP a escolha entre:</p>
  <ul class="options">
    <li data-key="a">Custo e performance.</li>
    <li data-key="b">Segurança e usabilidade.</li>
    <li data-key="c">Consistência ACID e BASE.</li>
    <li data-key="d">Latência e consistência quando não há partição.</li>
  </ul>
  <p class="explain">Else (E): na operação normal, replicar de forma síncrona aumenta consistência e latência; assíncrona faz o contrário. Uma réplica de leitura é EL.</p>
</div>

<div class="study-quiz" data-answer="a">
  <p class="q">8. No Kafka, a ordem é garantida:</p>
  <ul class="options">
    <li data-key="a">Dentro de uma partição; a chave decide a partição.</li>
    <li data-key="b">Globalmente, em todos os tópicos.</li>
    <li data-key="c">Por timestamp do produtor.</li>
    <li data-key="d">Pelo grupo de consumidores.</li>
  </ul>
  <p class="explain">Mesma chave → mesma partição → ordem. Sem chave, não há ordem entre eventos relacionados. Adicionar partições pode quebrar a ordem temporariamente.</p>
</div>

<div class="study-quiz" data-answer="c">
  <p class="q">9. Por que todo consumidor precisa ser idempotente?</p>
  <ul class="options">
    <li data-key="a">Porque o Kafka não tem offset.</li>
    <li data-key="b">Porque a rede é síncrona.</li>
    <li data-key="c">Porque a entrega é normalmente at-least-once e efeitos externos não são transacionais com o offset.</li>
    <li data-key="d">Porque o produtor nunca repete.</li>
  </ul>
  <p class="explain">Exactly-once cobre Kafka→Kafka. E-mail, S3 e Postgres exigem deduplicação: tabela de mensagens, upsert ou restrição única.</p>
</div>

<div class="study-quiz" data-answer="b">
  <p class="q">10. O transactional outbox:</p>
  <ul class="options">
    <li data-key="a">Garante exactly-once ponta a ponta.</li>
    <li data-key="b">Grava estado e evento na mesma transação local; um relay publica depois.</li>
    <li data-key="c">Substitui a necessidade de DLQ.</li>
    <li data-key="d">Elimina a consistência eventual.</li>
  </ul>
  <p class="explain">Elimina a escrita dupla, mas o relay pode republicar — daí idempotência. Não garante ordem global nem exactly-once fora do banco.</p>
</div>

<div class="study-quiz" data-answer="d">
  <p class="q">11. Em uma saga, uma compensação é:</p>
  <ul class="options">
    <li data-key="a">Um rollback de banco distribuído.</li>
    <li data-key="b">Um retry infinito.</li>
    <li data-key="c">Uma transação ACID entre serviços.</li>
    <li data-key="d">Uma ação de negócio que desfaz semanticamente um passo anterior (ex.: liberar estoque, estornar).</li>
  </ul>
  <p class="explain">Saga perde isolamento; estados intermediários são visíveis. Compensações precisam ser idempotentes.</p>
</div>

<div class="study-quiz" data-answer="a">
  <p class="q">12. Um bom SLI de disponibilidade é:</p>
  <ul class="options">
    <li data-key="a">Requisições não-5xx / requisições válidas.</li>
    <li data-key="b">CPU média do serviço.</li>
    <li data-key="c">Número de pods rodando.</li>
    <li data-key="d">Heap da JVM.</li>
  </ul>
  <p class="explain">SLI mede a experiência do usuário como razão de eventos bons por válidos. CPU/heap são causas, não sintomas.</p>
</div>

<div class="study-quiz" data-answer="c">
  <p class="q">13. SLO de 99,5% em 28 dias. O error budget é aproximadamente:</p>
  <ul class="options">
    <li data-key="a">40 minutos</li>
    <li data-key="b">1 hora</li>
    <li data-key="c">3 h 22 min</li>
    <li data-key="d">7 h 12 min</li>
  </ul>
  <p class="explain">0,5% × 40.320 min = 201,6 min ≈ 3 h 22 min. Sempre cite a janela.</p>
</div>

<div class="study-quiz" data-answer="b">
  <p class="q">14. Burn rate de 14,4× significa:</p>
  <ul class="options">
    <li data-key="a">14,4% de erro.</li>
    <li data-key="b">O orçamento será consumido em ~1/14,4 da janela; em 1 h, ~2% do budget de 28 dias.</li>
    <li data-key="c">O SLO foi violado.</li>
    <li data-key="d">O serviço está 14,4% mais rápido.</li>
  </ul>
  <p class="explain">burn = erro observado / (1−SLO). 14,4× com janela de 28 dias esgota em ~1,9 dia. O par 1 h + 5 min é um alerta precoce.</p>
</div>

<div class="study-quiz" data-answer="d">
  <p class="q">15. No circuit breaker, o estado half-open serve para:</p>
  <ul class="options">
    <li data-key="a">Rejeitar todas as chamadas.</li>
    <li data-key="b">Aumentar o timeout.</li>
    <li data-key="c">Desligar o serviço.</li>
    <li data-key="d">Liberar poucas chamadas de teste para decidir se fecha ou reabre.</li>
  </ul>
  <p class="explain">Closed → Open (falha rápido) → Half-open (testa) → Closed/Open. O fallback fica na camada externa ao retry.</p>
</div>

<div class="study-quiz" data-answer="a">
  <p class="q">16. Por que a liveness não deve incluir o banco?</p>
  <ul class="options">
    <li data-key="a">Uma oscilação do banco reiniciaria todas as réplicas, ampliando a indisponibilidade.</li>
    <li data-key="b">Porque o banco não tem HTTP.</li>
    <li data-key="c">Porque liveness é opcional.</li>
    <li data-key="d">Porque o Kubernetes não reinicia pods.</li>
  </ul>
  <p class="explain">Liveness responde "processo travado?". Dependência externa pertence à readiness, com cautela.</p>
</div>

<div class="study-quiz" data-answer="c">
  <p class="q">17. HPA com request de 250m e alvo de 70% escala quando o pod usa:</p>
  <ul class="options">
    <li data-key="a">350m, 70% do limite de 500m.</li>
    <li data-key="b">500m.</li>
    <li data-key="c">175m, 70% da request.</li>
    <li data-key="d">70m.</li>
  </ul>
  <p class="explain">A utilização é sobre a request. O limite só define throttling. Request mal dimensionada distorce o gatilho.</p>
</div>

<div class="study-quiz" data-answer="b">
  <p class="q">18. Um PDB com `minAvailable: 1` e 2 réplicas:</p>
  <ul class="options">
    <li data-key="a">Impede qualquer falha de pod.</li>
    <li data-key="b">Garante que uma réplica continue disponível durante drain/upgrade voluntário.</li>
    <li data-key="c">Substitui a readiness.</li>
    <li data-key="d">Aumenta o número de réplicas.</li>
  </ul>
  <p class="explain">PDB só limita interrupções voluntárias. Falha de nó, OOM e deploy não são cobertos por ele.</p>
</div>

<div class="study-quiz" data-answer="d">
  <p class="q">19. Qual é a fronteira correta entre Terraform e Kubernetes no projeto?</p>
  <ul class="options">
    <li data-key="a">Terraform aplica Deployments e HPAs.</li>
    <li data-key="b">Kubernetes cria VPC e RDS.</li>
    <li data-key="c">Terraform e kubectl aplicam as mesmas coisas, tanto faz.</li>
    <li data-key="d">Terraform cria VPC, EKS, RDS, ECR, S3, CloudFront; kubectl/scripts aplicam workloads, HPA e add-ons.</li>
  </ul>
  <p class="explain">IaC de infraestrutura ≠ GitOps de aplicação. O deploy é shell-first.</p>
</div>

<div class="study-quiz" data-answer="a">
  <p class="q">20. No EKS, o que continua sendo responsabilidade do time?</p>
  <ul class="options">
    <li data-key="a">Node groups, add-ons, workloads, rede, RDS e custos.</li>
    <li data-key="b">Somente o código da aplicação.</li>
    <li data-key="c">O etcd e o API server.</li>
    <li data-key="d">Nada: EKS é totalmente gerenciado.</li>
  </ul>
  <p class="explain">O control plane é gerenciado; nós, add-ons, manifests, banco e FinOps são seus.</p>
</div>

<div class="study-quiz" data-answer="c">
  <p class="q">21. PKCE no Authorization Code serve para:</p>
  <ul class="options">
    <li data-key="a">Criptografar o token de acesso.</li>
    <li data-key="b">Dispensar o client secret em APIs públicas.</li>
    <li data-key="c">Impedir que um código interceptado seja trocado por token sem o verifier.</li>
    <li data-key="d">Renovar o token automaticamente.</li>
  </ul>
  <p class="explain">O cliente envia o hash (challenge) na autorização e prova o segredo (verifier) na troca. Essencial em SPA/mobile.</p>
</div>

<div class="study-quiz" data-answer="b">
  <p class="q">22. Por que a sessão do projeto usa cookie HttpOnly em vez de localStorage?</p>
  <ul class="options">
    <li data-key="a">Porque cookie é mais rápido.</li>
    <li data-key="b">Porque XSS não lê cookie HttpOnly; o custo é CSRF, mitigado com token e SameSite.</li>
    <li data-key="c">Porque o Next.js exige cookie.</li>
    <li data-key="d">Porque o JWT não pode ser assinado.</li>
  </ul>
  <p class="explain">Trade-off controlável: XSS-token é catastrófico e silencioso; CSRF é mitigável no backend.</p>
</div>

<div class="study-quiz" data-answer="d">
  <p class="q">23. Um endpoint autenticado devolve o pedido de outro usuário. O controle ausente é:</p>
  <ul class="options">
    <li data-key="a">Rate limiting.</li>
    <li data-key="b">Criptografia em repouso.</li>
    <li data-key="c">MFA.</li>
    <li data-key="d">Autorização no nível do objeto (ownership), no serviço dono.</li>
  </ul>
  <p class="explain">OWASP API #1: BOLA/IDOR. O Gateway não sabe o dono; o Order precisa verificar e retornar 404/403.</p>
</div>

<div class="study-quiz" data-answer="a">
  <p class="q">24. Qual método combina com qual alvo?</p>
  <ul class="options">
    <li data-key="a">RED para serviços; USE para recursos.</li>
    <li data-key="b">USE para serviços; RED para redes.</li>
    <li data-key="c">RED para banco; USE para frontend.</li>
    <li data-key="d">Ambos são sinônimos dos Golden Signals.</li>
  </ul>
  <p class="explain">RED (rate, errors, duration) descreve a experiência do serviço; USE (utilization, saturation, errors) descreve recursos.</p>
</div>

<div class="study-quiz" data-answer="c">
  <p class="q">25. Qual label é seguro para uma métrica Prometheus?</p>
  <ul class="options">
    <li data-key="a">`order_id`</li>
    <li data-key="b">`user_email`</li>
    <li data-key="c">`route="/orders/{id}"` e `status="500"`</li>
    <li data-key="d">URL completa com UUID</li>
  </ul>
  <p class="explain">Alta cardinalidade derruba o Prometheus. Use template de rota, status, método; IDs vão para logs/traces.</p>
</div>

<div class="study-quiz" data-answer="b">
  <p class="q">26. O `traceparent` NÃO carrega:</p>
  <ul class="options">
    <li data-key="a">traceId</li>
    <li data-key="b">O corpo da requisição ou o JWT</li>
    <li data-key="c">parentSpanId</li>
    <li data-key="d">flags de amostragem</li>
  </ul>
  <p class="explain">Ele carrega versão, trace-id, parent-span-id e flags. Cada serviço cria seu span e propaga o contexto.</p>
</div>

<div class="study-quiz" data-answer="d">
  <p class="q">27. Por que os três frontends não compartilham a mesma entrada de cache no CloudFront?</p>
  <ul class="options">
    <li data-key="a">Porque usam portas diferentes.</li>
    <li data-key="b">Porque o S3 impede cache.</li>
    <li data-key="c">Porque cada app tem um certificado TLS.</li>
    <li data-key="d">Porque a função de borda adiciona `x-site` e ele entra na cache key.</li>
  </ul>
  <p class="explain">Sem o discriminador, o rewrite para `/index.html` faz todos os paths compartilharem a primeira entrada cacheada.</p>
</div>

<div class="study-quiz" data-answer="a">
  <p class="q">28. Quem decide o preço de um item de pedido?</p>
  <ul class="options">
    <li data-key="a">O Product, consultado pelo Order; o preço praticado é congelado no item.</li>
    <li data-key="b">O navegador, que envia o preço.</li>
    <li data-key="c">O Gateway, que valida o total.</li>
    <li data-key="d">O Exchange, sempre.</li>
  </ul>
  <p class="explain">O cliente não pode sobrescrever preço. O Order lê o preço atual via API e persiste o total em USD; a conversão é só na resposta.</p>
</div>

<div class="study-quiz" data-answer="c">
  <p class="q">29. Qual é uma limitação real do LocalStack no projeto?</p>
  <ul class="options">
    <li data-key="a">Não emula ECR.</li>
    <li data-key="b">Não suporta Terraform.</li>
    <li data-key="c">O EKS é k3s; rede/zonas/HA não são reais e o CloudFront é emulado.</li>
    <li data-key="d">Não permite kubectl.</li>
  </ul>
  <p class="explain">É rehearsal: valida Terraform e manifests, não comportamento de rede, multi-AZ ou durabilidade.</p>
</div>

<div class="study-quiz" data-answer="b">
  <p class="q">30. Em que ponto o FaaS deixa de ser a opção mais barata?</p>
  <ul class="options">
    <li data-key="a">Com mais de 10 funções.</li>
    <li data-key="b">Em tráfego alto e constante, porque cobra por invocação/GB-s contra um custo fixo de container.</li>
    <li data-key="c">Quando se usa Postgres.</li>
    <li data-key="d">Nunca.</li>
  </ul>
  <p class="explain">A aula estima o cruzamento em ~34,9 M req/mês para 100 ms/512 MB. Escala alta e constante favorece unidade fixa.</p>
</div>

---

## Parte B — Cálculos (mostre a conta)

<div class="study-calc" data-answer="2.8" data-tolerance="0.1" data-unit="dias">
  <p class="q">1. Um serviço com SLO de 99,5% em 28 dias observa 5% de erro. Em quantos dias o budget esgota, se a taxa se mantiver?</p>
  <input type="number" step="0.1" inputmode="decimal" placeholder="dias">
  <button type="button">Conferir</button>
  <p class="explain">burn = 5/0,5 = 10×. 28/10 = 2,8 dias. O alerta de 1 h + 5 min pegaria bem antes.</p>
</div>

<div class="study-calc" data-answer="99.7" data-tolerance="0.1" data-unit="%">
  <p class="q">2. Disponibilidade de um caminho com 3 serviços em série a 99,9% (em %).</p>
  <input type="number" step="0.01" inputmode="decimal" placeholder="%">
  <button type="button">Conferir</button>
  <p class="explain">0,999³ = 0,997029… → 99,7%. Cerca de 26 h/ano.</p>
</div>

<div class="study-calc" data-answer="210" data-tolerance="5" data-unit="req/s">
  <p class="q">3. Se o HPA começa a escalar com 2,1 vCPU agregados e cada requisição custa 10 ms de CPU, qual a taxa aproximada?</p>
  <input type="number" step="1" inputmode="decimal" placeholder="req/s">
  <button type="button">Conferir</button>
  <p class="explain">2,1 / 0,010 = 210 req/s. Com 5 ms, 420; com 25 ms, 84; com 50 ms, 42.</p>
</div>

<div class="study-calc" data-answer="4.7" data-tolerance="0.3" data-unit="réplicas/serviço">
  <p class="q">4. RDS com 112 conexões, 3 serviços de banco e pool 8. Quantas réplicas por serviço cabem?</p>
  <input type="number" step="0.1" inputmode="decimal" placeholder="réplicas">
  <button type="button">Conferir</button>
  <p class="explain">112 / (3 × 8) = 4,67. Com HPA max 6, o pior caso simultâneo estoura — o pool seguro seria ≤ 6.</p>
</div>

<div class="study-calc" data-answer="10.08" data-tolerance="0.5" data-unit="min">
  <p class="q">5. Quantos minutos de indisponibilidade um SLO de 99,9% permite em uma semana (7 dias)?</p>
  <input type="number" step="0.1" inputmode="decimal" placeholder="min">
  <button type="button">Conferir</button>
  <p class="explain">0,1% × 7 × 24 × 60 = 10,08 min. O mesmo SLO em 28 dias permite 40,3 min; em um mês de 30,44 dias, 43,8 min. **Sempre recalcule a janela** — este é o erro mais comum.</p>
</div>

---

## Parte C — Respostas curtas

??? note "1. Explique por que o Gateway é o único ponto público e o que isso protege."
    Ele concentra autenticação, CSRF, CORS, autorização de papel e roteamento. Serviços internos confiam no header de identidade, então precisam ser inalcançáveis de fora; caso contrário, qualquer cliente forjaria `id-account`. O Gateway também reduz a superfície de ataque e permite trocar a topologia interna sem mudar clientes. O custo é ser ponto crítico e potencial gargalo — mitigado com réplicas, HPA e PDB.

??? note "2. Descreva o caminho de um pedido com conversão e aponte dois riscos."
    CloudFront → NLB → Gateway (JWT/CSRF) → Order → Product (preço) → transação no Postgres → resposta. A conversão via Exchange está prevista no contrato, mas hoje o Order responde 422 para não-USD e não chama o serviço. Riscos quando ativada: (a) a conversão síncrona alonga a cadeia e pode falhar depois do commit, sem compensação; (b) não há idempotência, então um retry pode duplicar o pedido. Mitigações: converter antes do commit ou tornar a conversão opcional; chave de idempotência.

??? note "3. Compare notificação por REST síncrono e por evento."
    REST síncrono: o pedido espera o e-mail; falha do serviço de e-mail falha o pedido ou obriga fallback; simples de rastrear. Evento: o pedido publica `OrderCreated` e responde; o consumidor envia depois, com retry/DLQ; ganha disponibilidade e latência, mas exige outbox (para não perder o evento), idempotência (duplicatas), DLQ e observabilidade de lag. Para e-mail, evento é a escolha natural.

??? note "4. Como você levaria o sistema a 99,9%? Ordene por custo-benefício."
    1) RDS Multi-AZ (maior ganho; remove o maior SPOF); 2) spread por zona (anti-affinity/topologySpread) para as réplicas; 3) breaker/timeout/fallback no Exchange e no Product; 4) PDB e probes corretas; 5) HPA/CA com pool dimensionado; 6) multi-região/DR se o requisito exigir. Antes de prometer, medir RTO/RPO e rodar GameDay.

??? note "5. Por que o pool 10 falhou e o 8 funcionou? O que isso ensina?"
    Pool 10 × 6 réplicas × 3 serviços = 180 conexões possíveis, acima de 112; durante o teste o RDS chegou a 70–71 e recusou novas conexões, derrubando pods no startup. Pool 5 protegeu o banco mas criou fila no Hikari (`waiting=62`, timeout 3 s, 107 5xx). Pool 8 equilibrou: 52/112, zero erro, 6/6 pods. Ensina que o pool é uma decisão **de sistema** (banco × pods × tempo de transação) e que a pós-condição importa.

??? note "6. Quais são as três lacunas mais graves e por quê?"
    (a) RDS Single-AZ: ponto único de dados, sem failover automático; (b) ausência de outbox/eventos: falha após commit não é reprocessada e o pós-pedido fica no request path; (c) ausência de breaker/fallback completo no Exchange e de teste de falha do provedor: dependência externa não exercitada. Depois: NetworkPolicy/mTLS, spread por zona e GitOps.

---

## Parte D — Exercício de desenho

**Cenário:** o time quer (1) enviar e-mail de confirmação, (2) gerar uma miniatura da imagem do produto após o upload e (3) expor um histórico de pedidos para analytics. O SLA de checkout não pode piorar.

Desenhe e justifique:

1. Quais fluxos viram eventos e quais continuam síncronos.
2. Onde entra o outbox e qual é a chave de partição.
3. Como garantir idempotência em cada consumidor.
4. O que fazer com mensagens inválidas.
5. Quais métricas e alertas novos.

??? note "Roteiro de resposta"
    - **E-mail e miniatura:** assíncronos. `OrderCreated` e `ProductImageAttached`. Checkout não espera. Histórico/analytics: projeção assíncrona (CQRS leve).
    - **Outbox:** `orders` + `outbox` na mesma transação; relay publica `order-events`; imagens idem nas tabelas do Product. Chave = `orderId` / `productId` para ordenar por agregado; partições dimensionadas desde o início.
    - **Idempotência:** tabela `processed_messages(event_id, consumer)` na mesma transação do efeito; e-mail com chave única `orderId+template`; miniatura com upsert por `assetId`; analytics com `event_id` único.
    - **Falhas:** retry com backoff para transitórias; DLQ para inválidas; alarme de DLQ e lag; replay documentado.
    - **Métricas:** lag por grupo, taxa de retry, tamanho da DLQ, latência de projeção, idade do último evento; alerta se lag > X ou DLQ > 0 por 10 min. Trace: propagar `traceparent` no header do evento.
    - **SLO:** checkout continua com p95 800 ms; novos SLOs para “e-mail em até 1 min” e “miniatura em até 30 s”, com error budget separado.

---

## Parte E — Autoavaliação

| Faixa | Leitura |
| --- | --- |
| 27–30 MCQ + cálculos corretos | Pronto; revise só as lacunas e o oral |
| 22–26 | Sólido; releia capítulos dos erros |
| 16–21 | Base existe; refaça o mapa e os capítulos 5, 9, 10 |
| < 16 | Comece pelo [mapa](00-mapa.md) e pelo [projeto](01-projeto.md); não pule a teoria |

!!! tip "O que fazer com os erros"
    Para cada erro, escreva: **conceito confundido**, **exemplo do projeto**, **frase de 1 linha**. Errar e corrigir com evidência vale mais que acertar por sorte.

---

## Última revisão

<div data-study-progress></div>

<label class="study-check"><input type="checkbox" data-key="sim-1"> Fiz os 30 MCQ sem consultar.</label>
<label class="study-check"><input type="checkbox" data-key="sim-2"> Recalculei error budget, burn rate, série e pool.</label>
<label class="study-check"><input type="checkbox" data-key="sim-3"> Respondi as 6 abertas em voz alta, cronometrado.</label>
<label class="study-check"><input type="checkbox" data-key="sim-4"> Desenhei o cenário de eventos com outbox e idempotência.</label>
<label class="study-check"><input type="checkbox" data-key="sim-5"> Sei dizer três lacunas e o próximo passo de cada uma.</label>

!!! info "Continue"
    [Glossário e cheatsheet](17-glossario-cheatsheet.md) para a revisão de véspera.
