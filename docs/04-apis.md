# APIs e contratos

<span class="study-tag prova">prova</span><span class="study-tag projeto">projeto</span>

Em um monólito, uma chamada de função é verificada pelo compilador. Em microsserviços, a chamada atravessa a rede e o "compilador" é um **contrato**. API é a fronteira que permite que dois times mudem de tecnologia sem quebrar o vizinho — desde que o contrato seja explícito, versionado e testado.

!!! quote "Definição útil"
    Contrato = método + caminho + autenticação + payload + códigos de status + comportamento de falha. Documentar só o payload é documentar metade.

---

## 1. REST: as restrições que importam

| Restrição | O que significa | No projeto |
| --- | --- | --- |
| Cliente–servidor | UI separada do armazenamento | Next.js estático ↔ API |
| Stateless | Cada requisição carrega tudo que precisa | JWT/cookie em toda chamada |
| Cacheable | Respostas declaram cacheabilidade | `no-store` em respostas autenticadas |
| Interface uniforme | Recursos, métodos, representações | `/products`, `/orders`, JSON |
| Sistema em camadas | Cliente não sabe quantos proxies existem | CloudFront → NLB → Gateway → serviço |
| Código sob demanda (opcional) | Cliente baixa lógica | Não usado |

### Maturidade de Richardson

| Nível | Descrição | Exemplo |
| --- | --- | --- |
| 0 | Um único endpoint, um verbo | `POST /api` com `{action:"createOrder"}` |
| 1 | Recursos | `POST /orders` |
| 2 | Verbos HTTP + status | `GET /orders/{id}` → 200/404 |
| 3 | HATEOAS (hipermídia) | Resposta inclui links de próximas ações |

O projeto está no **nível 2**: recursos, verbos e status corretos, sem HATEOAS. Não é um defeito; HATEOAS raramente compensa em APIs internas.

---

## 2. Métodos, status e semântica

| Método | Seguro? | Idempotente? | Uso |
| --- | --- | --- | --- |
| GET | Sim | Sim | Ler recurso |
| POST | Não | **Não** | Criar; exige cuidado com retry |
| PUT | Não | Sim | Substituir/definir estado completo |
| PATCH | Não | Não necessariamente | Alteração parcial |
| DELETE | Não | Sim | Remover (repetir dá 204/404) |

| Faixa | Significado | Exemplos do projeto |
| --- | --- | --- |
| 2xx | Sucesso | 200 leitura, 201 criação, 204 sem corpo |
| 4xx | Erro do cliente | 400 payload inválido, 401 sem token, 403 sem papel, 404 não encontrado, 409 conflito, 413 grande, 422 moeda não suportada |
| 5xx | Erro do servidor | 500 bug, 502/503 dependência indisponível, 504 timeout |

!!! tip "401 × 403 × 404"
    **401** = não autenticado (quem é você?). **403** = autenticado, mas sem permissão (o que pode fazer?). **404** para recurso de outro dono é uma escolha de segurança: não confirma que o pedido existe. O projeto usa 404 em `GET /orders/{id}` de outro usuário.

### Idempotência: o problema do POST

Um `POST /orders` repetido pode criar dois pedidos. A solução padrão é a **chave de idempotência**:

```http
POST /orders
Idempotency-Key: 3f1c9a2e-...
```

O servidor guarda a chave e o resultado; uma repetição devolve o mesmo resultado em vez de criar outro recurso. **O projeto não implementa essa chave** — o frontend evita duplo clique e não faz retry automático, mas não promete exactly-once. Essa é uma limitação declarada, e uma excelente resposta de "o que você faria diferente".

### Paginação, filtragem e versão

| Tema | Boa prática | Estado no projeto |
| --- | --- | --- |
| Paginação | `?page=&size=` ou cursor | Catálogo retorna a lista completa; frontend pagina localmente |
| Filtro | Query params validados | Busca local no catálogo |
| Versionamento | `/v1/` ou header `Accept` | Não versionado; contrato interno estável |
| Erros | Código estável + mensagem segura | Código/mensagem; sem stack trace |
| IDs | UUID, não sequencial | UUIDs em produtos/pedidos/contas |

!!! warning "Versionar não é copiar a API"
    A regra prática: mudanças **aditivas** (novo campo opcional) não exigem versão; mudanças **quebrantes** (remover/renomear campo, mudar tipo, mudar status) exigem coexistência de versões ou migração coordenada. O projeto opta por manter compatibilidade e documentar o contrato, porque todos os consumidores são internos.

---

## 3. OpenAPI: contrato executável

OpenAPI descreve rotas, schemas, segurança e respostas. Ele serve para gerar cliente, servidor, mocks, testes de contrato e documentação — a mesma fonte para todos.

| Abordagem | Como funciona | Prós | Contras |
| --- | --- | --- | --- |
| **Code-first** | Anotações geram o OpenAPI | Menos duplicação; rápido | Contrato pode virar reflexo do código |
| **Contract-first** | Escreve o YAML, gera código | Consumidores participam; compatibilidade explícita | Mais cerimônia; código gerado |

O projeto mantém contratos reutilizáveis em `api/product-interface`, `api/order` e `api/exchange-interface`, com `openapi/*.yaml` e schemas JSON. Testes de contrato validam que Product e Exchange continuam compatíveis com o que o Order espera.

```yaml
paths:
  /products/{id}:
    get:
      summary: Consulta um produto
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: Produto encontrado
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Product" }
        "404": { description: Produto inexistente }
```

!!! tip "OpenAPI como ferramenta de prova"
    Se a questão pede "como garantir compatibilidade entre serviços?", a resposta tem três camadas: **contrato versionado** (OpenAPI), **teste de contrato** no CI e **estratégia de mudança** (aditiva primeiro, quebrante com versão). Só o primeiro não basta.

---

## 4. Os contratos do projeto

### Product

| Método e rota | Auth | Sucesso | Erros relevantes |
| --- | --- | --- | --- |
| `POST /products` | ROLE_ADMIN | 201 + produto | 400 inválido, 403 sem papel |
| `GET /products` | público | 200 + lista | — |
| `GET /products/{id}` | público | 200 + produto | 404 |
| `DELETE /products/{id}` | ROLE_ADMIN | 204 | 403, 404 |
| `POST /products/{id}/image/uploads` | ROLE_ADMIN | 201 ticket | 400, 403, 413, 429 |
| `POST /products/{id}/image` | ROLE_ADMIN | 200 produto | 409 ticket consumido, 422 inválido |
| `PATCH /products/{id}/image` | ROLE_ADMIN | 200 produto | 400, 404 |
| `DELETE /products/{id}/image` | ROLE_ADMIN | 200 produto | 403, 404 |

O fluxo de imagem é em duas etapas: o serviço emite uma **URL pré-assinada** de curta duração para `PUT` direto no S3, depois valida o objeto e o anexa ao produto. O navegador nunca recebe credencial AWS; a URL é uma *capability* temporária.

### Order

| Método e rota | Auth | Regra |
| --- | --- | --- |
| `POST /orders` | usuário | Preços vêm do Product; não aceita preço do cliente |
| `GET /orders` | usuário | Só pedidos do próprio usuário |
| `GET /orders/{id}` | usuário | 404 se não for dono; `?currency` é previsto no contrato, mas a implementação atual responde 422 para não-USD |

```json
{
  "id": "0195ac33-73e5-7cb3-90ca-7b5e7e549569",
  "date": "2025-09-01T12:30:00",
  "items": [
    {
      "id": "01961b9a-bca2-78c4-9be1-7092b261f217",
      "product": { "id": "0195abfb-7074-73a9-9d26-b4b9fbaab0a8" },
      "quantity": 2,
      "total": 20.24
    }
  ],
  "total": 20.86
}
```

Repare: `product` traz **apenas o id**. O nome e o preço atual não são copiados para o pedido; o total praticado é. É DDD aplicado ao payload.

!!! warning "Duas divergências entre contrato e implementação"
    O exemplo acima segue o **contrato** do exercício (`product: { id }`). A implementação checada devolve `productId` no item, e não o objeto aninhado. E a conversão `?currency=BRL` está prevista, mas responde **422** hoje. A UI usa USD e lê `productId`. São exatamente os casos em que um **teste de contrato** teria valor: o documento descreve a intenção, o código descreve o estado.

### Exchange e Gateway

| Chamada | Papel |
| --- | --- |
| `GET /exchanges/{from}/{to}` | Retorna `sell`, `buy` e `date`; 422 para moeda inválida; 502/503 se o provedor falhar |
| `GET /session/csrf` | Emite token CSRF e cookie |
| `POST /session/login` | Autentica e seta cookie HttpOnly; retorna 204 |
| `GET /session` | Valida token e devolve perfil |
| `DELETE /session` | Limpa cookie (não promete revogação) |

!!! warning "Uma divergência real de contrato"
    A página do exercício descreve `GET /exchanges/{from}/{to}`, enquanto o Gateway/frontend têm nomes de rota ligeiramente diferentes. A UI atual usa USD e adia a conversão; a documentação registra a divergência em vez de escondê-la. Em prova, cite isso como exemplo de por que **contrato versionado + teste de contrato** importam.

!!! note "Por que `/session` além de `/auth/login`?"
    A API continua aceitando `Authorization: Bearer` para clientes antigos, mas o navegador recebe um cookie `HttpOnly`. O Gateway traduz cookie → Bearer internamente. Isso permite que o Next.js estático use sessão sem nunca tocar no token.

---

## 5. Erros: o que a banca quer ver

Um bom erro tem **status correto**, **código estável** e **mensagem segura**:

```json
{
  "code": "PRODUCT_NOT_FOUND",
  "message": "Product was not found",
  "timestamp": "2026-11-21T12:00:00Z",
  "path": "/products/0195..."
}
```

| Anti-padrão | Problema |
| --- | --- |
| 200 com `{ "error": ... }` | Quebra clientes, métricas e cache |
| 500 para erro de validação | Esconde bug do cliente; polui alerta |
| Stack trace na resposta | Vaza estrutura interna e caminhos |
| Mensagem com SQL/credencial | Vazamento de segurança |
| `404` para falta de permissão **e** inexistência | Pode ser intencional (não revelar), mas documente |

No projeto, exceções de dependência viram `503` com mensagem clara quando o circuito está aberto — nunca um "sucesso" fabricado. A regra de engenharia é explícita: **falhe explicitamente**.

---

## 6. Contrato e segurança andam juntos

| Requisito | Onde é aplicado |
| --- | --- |
| Autenticação | Gateway (token) e serviços (identidade) |
| Autorização por papel | Gateway (`ROLE_ADMIN`) + serviço dono |
| Autorização por objeto | Order (dono do pedido), Account (self/admin) |
| CSRF | Gateway, para escrita autenticada por cookie |
| Validação de entrada | Borda do serviço (Bean Validation / Pydantic) |
| Limite de payload | Ingress 10 MB, imagem 5 MiB |
| Rate limit | Nginx/WAF preparado; não ativo por padrão |

!!! warning "Autorização no Gateway não basta"
    O Gateway pode dizer "é admin". Só o Order sabe se o pedido pertence àquele usuário. OWASP API Security #1 é **Broken Object Level Authorization**: um endpoint autenticado que devolve o objeto de outra pessoa. O projeto trata isso com 404.

---

## 7. Como responder

**"Como vocês evitam quebra de contrato?"**
> Contrato em OpenAPI versionado no repositório do serviço; teste de contrato no CI; mudanças aditivas primeiro; a imagem é imutável por SHA, então o consumidor pode fixar a versão que testou. A lacuna é não haver um schema registry para eventos — não há eventos.

**"Por que não GraphQL?"**
> O domínio é simples e orientado a recursos; o custo de um gateway GraphQL (N+1, autorização por campo, cache) não se pagaria. REST + OpenAPI dá cache HTTP, status claros e ferramentas prontas. Para agregação de múltiplas telas, um BFF seria a alternativa antes de GraphQL.

**"Qual a diferença entre 400 e 422 aqui?"**
> 400 é requisição malformada/inválida (JSON, UUID, quantidade). 422 é semanticamente inprocessável: a requisição está bem formada, mas a moeda não é suportada. O projeto usa 422 para moeda desconhecida no Order/Exchange — e, hoje, para **qualquer** moeda ≠ USD no Order, porque a integração de conversão está pendente.

---

## Ordem de uma requisição de escrita

<div class="study-order" data-items="Obter token CSRF em /session/csrf|Enviar POST com cookie e header CSRF|Gateway valida JWT, CSRF e papel|Serviço valida payload e propriedade|Serviço persiste a transação local|Resposta 201 com o recurso criado" data-prompt="Ordene o fluxo de uma escrita autenticada por cookie:"></div>

---

## Checkpoint

<div data-study-score></div>

<div class="study-quiz" data-answer="c">
  <p class="q">1. Um cliente repete um `POST /orders` após timeout. Sem chave de idempotência, o risco é:</p>
  <ul class="options">
    <li data-key="a">O servidor rejeitar automaticamente a segunda chamada com 409.</li>
    <li data-key="b">O pedido ser atualizado em vez de criado.</li>
    <li data-key="c">Dois pedidos serem criados, porque POST não é idempotente por definição.</li>
    <li data-key="d">O JWT expirar antes da segunda chamada.</li>
  </ul>
  <p class="explain">POST não é idempotente. A solução é uma chave de idempotência persistida com o resultado, ou uma operação naturalmente idempotente (PUT/upsert). O projeto mitiga com UX, mas não promete exactly-once.</p>
</div>

<div class="study-quiz" data-answer="b">
  <p class="q">2. `GET /orders/{id}` de um pedido que existe, mas pertence a outro usuário. Qual resposta é mais defensável?</p>
  <ul class="options">
    <li data-key="a">200 com o pedido, já que o usuário está autenticado.</li>
    <li data-key="b">404, para não revelar a existência do recurso; 403 também é aceitável se a política for explícita.</li>
    <li data-key="c">500, porque é um erro inesperado.</li>
    <li data-key="d">302 redirecionando para o login.</li>
  </ul>
  <p class="explain">O projeto usa 404. A escolha entre 403 e 404 é de política: 404 evita enumeração; 403 é mais transparente. O importante é aplicar a checagem de propriedade no serviço dono.</p>
</div>

<div class="study-quiz" data-answer="d">
  <p class="q">3. Por que o contrato inclui os códigos de erro, e não só o payload de sucesso?</p>
  <ul class="options">
    <li data-key="a">Porque o OpenAPI exige pelo menos um erro para validar.</li>
    <li data-key="b">Para que o Gateway possa gerar o erro sozinho.</li>
    <li data-key="c">Porque erros não fazem parte do contrato.</li>
    <li data-key="d">Porque o consumidor precisa saber o que tratar e o que repetir; status e código definem retry, fallback e UX.</li>
  </ul>
  <p class="explain">Um 503 transitório pede retry com backoff; um 400 não. Sem contrato de erro, o consumidor adivinha — e retries cegos amplificam incidentes.</p>
</div>

## Checklist

<div data-study-progress></div>

<label class="study-check"><input type="checkbox" data-key="a-rest"> Explico os níveis de Richardson e onde o projeto está.</label>
<label class="study-check"><input type="checkbox" data-key="a-status"> Escolho entre 400/401/403/404/409/422 sem hesitar.</label>
<label class="study-check"><input type="checkbox" data-key="a-idem"> Explico idempotência e por que POST precisa de chave.</label>
<label class="study-check"><input type="checkbox" data-key="a-openapi"> Justifico OpenAPI + teste de contrato + estratégia de versão.</label>

!!! info "Continue"
    Contratos só fazem sentido se as fronteiras estiverem certas. É o próximo capítulo: [Microsserviços e DDD](05-microsservicos-ddd.md).
