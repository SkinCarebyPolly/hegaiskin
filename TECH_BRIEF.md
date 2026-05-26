# Hegai Skin — Technical Brief para Desenvolvedor
**Versão:** Junho 2026 · **Branch prod:** `main` (GitHub Pages)

---

## 1. TOKENS DE AFILIADO

Os links de afiliado são construídos dinamicamente em `app/protocolo.html` (linhas ~687–712).
Os placeholders abaixo precisam ser substituídos pelos tokens reais:

### Brasil (BR)
| Plataforma | Parâmetro | Placeholder actual | Onde substituir |
|---|---|---|---|
| Amazon Brasil | `tag=` | `COLOQUE_TAG_BR` | `protocolo.html` → objeto `afiliados.BR.amazon.tag` |
| Mercado Livre | _(sem tag)_ | — | Verificar programa de afiliados ML |
| Droga Raia | _(sem tag)_ | — | Sem programa de afiliados activo |

### Portugal (PT)
| Plataforma | Parâmetro | Placeholder actual | Onde substituir |
|---|---|---|---|
| Amazon.es | `tag=` | `COLOQUE_TAG_ES` | `protocolo.html` → objeto `afiliados.PT.amazon.tag` |
| YesStyle | `ref=` | `COLOQUE_TAG_YESSTYLE` | `protocolo.html` → objeto `afiliados.PT.yesstyle.tag` |
| Notino | _(sem tag)_ | — | Sem programa de afiliados activo |

### Commission Factory
Meta tag de verificação já presente em todos os ficheiros HTML:
```html
<meta name="commission-factory-verification" content="1048aee387af4b789643c519e906e669" />
```

### Como os links são gerados
```javascript
// Exemplo: Amazon BR → "La Roche-Posay Effaclar"
// → https://www.amazon.com.br/s?k=La+Roche-Posay+Effaclar&i=beauty&s=review-rank&tag=TAG_AFILIADO
function linkAfiliado(plataforma, query) {
  var p = afiliados[pais][plataforma];
  var base = p.url + encodeURIComponent(query);
  return p.tag ? base + '&tag=' + p.tag : base;
}
```

---

## 2. MOTORES DE IA

| Motor | Modelo | Uso |
|---|---|---|
| **Claude API** | `claude-sonnet-4-6` | Geração da rotina completa (Call 1 do onboarding) |
| **Gemini** | `gemini-2.5-flash` | Protocolos especiais (Call 2), face scan, OCR, chat, evolução, capilar |

### Endpoints
```
Claude:  https://api.anthropic.com/v1/messages
Gemini:  https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
```

### Regra de Thinking Tokens (Gemini 2.5 Flash)
- **Face scan apenas**: `thinkingBudget: 8192` — raciocínio profundo para análise de pele
- **Todas as outras calls**: `thinkingBudget: 0` — desactivado para velocidade e custo
- **Filtro obrigatório**: partes com `thought: true` devem ser filtradas antes de parsear JSON

---

## 3. FLUXOS E PROMPTS

---

### FLUXO A — Onboarding (16 passos → geração da rotina)

**Ficheiro:** `app/onboarding.html`

O onboarding faz **2 chamadas de IA em sequência** após o utilizador submeter o formulário:
- **Call 1** → Claude (rotina principal, 16k tokens)
- **Call 2** → Gemini (protocolos especiais: espinha, praia, maquiagem)

---

#### A1 · OCR de Produtos (foto da prateleira)
- **Motor:** Gemini 2.5 Flash (Vision)
- **Função:** `geminiVision(b64, prompt, maxTokens)`
- **Trigger:** Utilizadora faz upload de foto dos seus produtos
- **thinkingBudget:** 0 · **maxTokens:** 800

**System prompt:**
```
Você é especialista em identificar produtos e aparelhos de skincare. Retorne APENAS JSON válido.
```

**User prompt:**
```
Leia TODOS os rótulos visíveis nesta foto com precisão absoluta. Use o nome EXATO da embalagem.
NÃO invente. NÃO substitua por similares. Retorne APENAS JSON válido sem markdown:
{"produtos":[{"nome":"nome exato do produto","categoria":"limpeza/tônico/sérum/hidratante/protetor/aparelho/outro","ativo":"ativo principal ou vazio"}]}
```

**Resposta usada para:** Construir `S.prodTxt` — lista de produtos reais enviada ao Claude na Call 1.

---

#### A2 · Identificação de Aparelhos (foto do aparelho)
- **Motor:** Gemini 2.5 Flash (Vision)
- **Trigger:** Utilizadora faz upload de foto de aparelho de skincare
- **thinkingBudget:** 0 · **maxTokens:** 400

**User prompt:**
```
Identifique o aparelho de skincare/beleza nesta foto. Use nome e modelo EXATOS visíveis.
Retorne APENAS JSON: {"aparelho":"nome e modelo exato","tipo":"radiofrequência/LED/microcorrente/limpeza sônica/gua sha/outro","encontrado":true}.
Se não for aparelho de skincare: {"encontrado":false}.
```

**Resposta usada para:** Adicionar aparelhos à lista de produtos; Claude incluirá como passos dedicados na rotina com frequência semanal e modo de uso.

---

#### A3 · Face Scan (análise da selfie)
- **Motor:** Gemini 2.5 Flash (Vision)
- **Função:** `analisarFotoGemini(b64)`
- **Trigger:** Utilizadora tira ou faz upload de selfie durante o onboarding
- **thinkingBudget:** 8192 (único ponto com thinking activo) · **maxTokens:** 2048

**System prompt:**
```
Você é especialista sênior em cosmetologia e dermatologia estética. Analise fotos de pele com
máxima precisão. Retorne APENAS JSON válido sem markdown.
```

**User prompt:**
```
Analise esta foto do rosto com o olhar de uma especialista em cosmetologia.
PRIMEIRO avalie a qualidade da foto. Depois analise a pele com atenção a cada detalhe visível.
Retorne APENAS JSON válido sem markdown:
{
  "qualidade_ok": true,
  "problema": "ok/maquiagem/reflexo/escuro/rosto_nao_detectado/borrada",
  "problema_titulo": "título curto amoroso",
  "problema_msg": "1 frase sobre o problema",
  "problema_dica": "1 dica de como corrigir",
  "oleosidade": "baixa/média/alta/muito alta",
  "zona_t": "sim/não",
  "textura": "lisa/levemente irregular/irregular/muito irregular",
  "poros": "imperceptíveis/levemente visíveis/visíveis/muito visíveis",
  "manchas": "nenhuma/poucas/moderadas/muitas",
  "tipo_manchas": "melasma/sardas/pós-acne/tom irregular/nenhuma",
  "rugas": "nenhuma/linhas finas/moderadas/profundas",
  "areas_rugas": "testa/olhos/nasolabial/boca/nenhuma",
  "vermelhidao": "nenhuma/leve/moderada/intensa",
  "hidratacao": "muito desidratada/desidratada/normal/bem hidratada",
  "sensibilidade": "baixa/média/alta",
  "acne_ativa": "nenhuma/leve/moderada/intensa",
  "obs": "observação detalhada e amorosa do que você vê nesta foto"
}
```

**Resposta usada para:** Pré-preencher campos do questionário e enriquecer o perfil enviado ao Claude.

---

#### A4 · Call 1 — Rotina Completa (Claude)
- **Motor:** Claude API (`claude-sonnet-4-6`)
- **Função:** `gerarProtocolo()` — fetch directo à API Anthropic
- **Trigger:** Utilizadora submete o formulário após os 16 passos
- **maxTokens:** 16384

**System prompt:**
```
Você é uma especialista sênior em cosmetologia, formulação cosmética e K-Beauty com domínio
profundo de ingredientes ativos, combinações de produtos, tipos de pele e rotinas de cuidado.
Conhece extensamente: ativos como ácido hialurônico, niacinamida, retinol, AHA/BHA, vitamina C,
ceramidas, peptídeos e SPF; marcas brasileiras, europeias e coreanas; interações entre ingredientes
que podem irritar ou potencializar resultados; e a ordem correta de aplicação de cada tipo de produto.
Tem capacidade EXCEPCIONAL de leitura de rótulos e embalagens — reconhece marcas internacionais
e brasileiras e NUNCA substitui um produto por outro similar. Cria rotinas ultra detalhadas e
personalizadas com os produtos REAIS da cliente. Responde SEMPRE em português brasileiro.
Responde EXCLUSIVAMENTE em JSON válido, sem texto fora do JSON.
```

**User prompt (construído dinamicamente):**
```
Especialista sênior em cosmetologia e K-Beauty. Crie uma rotina ULTRA PERSONALIZADA.

PERFIL:
- Nome: [nome] | País/Moeda: [BR/PT] | Orçamento: [valor]
- Tipo de pele: [tipo] | Incômodos: [lista]
- Tempo de rotina: [minutos]
- Sol: [exposição] | Sono: [horas] | Estresse: [nível]
- Água: [consumo] | Sensibilidade: [nível]
- Gestante: [status] | Filhos <6 anos: [Sim/Não] | Exercício: [frequência]
- Ativos: [experiência] | Maquiagem: [uso]
- Objetivo: [objetivos] | Textura preferida: [textura]
- Ciclo menstrual: [status] | Alimentação: [padrão]

PRODUTOS IDENTIFICADOS (USE NOMES EXATOS NA ROTINA):
[lista de produtos do OCR — máx 20 produtos]

REGRAS:
1. [Se sem produtos: gerar rotina com categorias + ativos ideais, nunca inventar marca]
   [Se com produtos: usar APENAS os produtos listados pelos nomes exatos]
2. Aparelhos como passos dedicados: modo de uso, tempo por zona, movimentos, frequência semanal.
3. Adaptação: semana 1 suave → semana 4 completa.
4. Tom caloroso e encorajador — como amiga especialista.
5. Score 0-100: 0-40=Início da jornada, 41-70=Em Evolução, 71-90=Pele em dia, 91-100=Pele radiante.
[Se gestante: NUNCA Retinol, AHA/BHA>5%, Ácido Salicílico, Vitamina A]

Retorne APENAS JSON válido:
{
  "nome_cliente": "...",
  "diagnostico": "3-4 frases motivadoras sobre a pele",
  "tipo_pele": "...",
  "tags": ["anti-manchas","hidratação",...],
  "fase_adaptacao": "semana a semana detalhada",
  "sem_produto": true/false,
  "rotina_manha": [{"passo":1,"produto":"nome ou null","categoria":"tipo","ativo_ideal":"ativo","como":"instrução","icone":"emoji","tempo":"X min"}],
  "rotina_noite": [...],
  "rotina_express_manha": [máx 3 passos: limpeza + protetor obrigatórios],
  "rotina_express_noite": [máx 3 passos: limpeza + hidratante/ativo],
  "semana": {"seg_qui":"...","ter_sex":"...","qua_sab":"...","dom":"..."},
  "score_pele": 72,
  "produtos_identificados": [],
  "sugestoes": [{"falta":"CATEGORIA","icone":"emoji","motivo":"...","economica":{produto,marca,preco,descricao},"intermediaria":{...},"premium":{...}}],
  "sugestoes_substituicoes": [produtos incompatíveis com objetivos → [] se todos ok],
  "sugestoes_upgrade": [exatamente 2 upgrades que elevam a rotina sem passos extras],
  "alertas_validade": [produtos sensíveis a luz/calor → [] se sem produtos próprios],
  "aviso_filhos": [produtos com ativos de risco para crianças → [] se sem filhos]
}

INSTRUÇÕES:
• tags: máx 6, minúsculas, COM HÍFEN (ex: "anti-manchas", "anti-idade")
• sugestoes: TODAS as categorias ausentes; priorizar marcas que a cliente já usa
• rotina_express: limpeza + protetor (manhã); limpeza + hidratante (noite); sem aparelhos/máscaras
• sugestoes_upgrade: produtos que cabem no tempo disponível ou substituem um passo existente
• sugestoes_substituicoes: só produtos que a cliente TEM e contradizem seus objetivos; [] se compatíveis
• alertas_validade: retinol, vitamina C, AHA/BHA, protetor solar — [] se sem produtos próprios
• aviso_filhos: retinol→30min, AHA/BHA→20min, vitamina C→10min, óleos essenciais→30min
```

**Resposta usada para:** Protocolo base (rotina, sugestões, score, tags). Guardado em Firestore + localStorage antes da Call 2.

---

#### A5 · Call 2 — Protocolos Especiais (Gemini)
- **Motor:** Gemini 2.5 Flash (Text)
- **Função:** `geminiChat()` com `prompt2_base`
- **Trigger:** Executado automaticamente logo após a Call 1 (Claude)
- **thinkingBudget:** 0 · **maxTokens:** 6000

**System prompt:**
```
Especialista em skincare e cosmetologia. Responde EXCLUSIVAMENTE em JSON válido sem texto fora do JSON.
```

**User prompt:**
```
Especialista em cosmetologia. Com base neste perfil, gere apenas os protocolos especiais.

PERFIL:
- Tipo de pele: [tipo] | Incômodos: [lista]
- Gestante: [status]

PRODUTOS DISPONÍVEIS:
[lista de produtos do OCR]

[Se gestante: GESTANTE: NUNCA Retinol, AHA/BHA>5%, Ácido Salicílico, Vitamina A.]

Retorne APENAS JSON válido:
{
  "protocolo_espinha": "resumo em 1-2 frases",
  "protocolo_espinha_detalhado": {
    "regra_ouro": "regra principal",
    "sos_tratamento": "cuidado pontual para espinha isolada",
    "manha": [{"produto":"nome","como":"instrução","tempo":"X min","atencao":"aviso se houver"}],
    "noite": [{"produto":"nome","como":"instrução","tempo":"X min","atencao":""}],
    "proibidos": ["produto ou ingrediente a evitar"]
  },
  "protocolo_praia": "resumo em 1-2 frases",
  "protocolo_praia_detalhado": {
    "regra_ouro": "regra principal",
    "vespera": [{"produto":"nome","como":"instrução","tempo":"X min"}],
    "manha": [{"produto":"nome","como":"instrução","tempo":"X min"}],
    "na_praia": [{"produto":"nome","como":"instrução","tempo":"quando reaplicar"}],
    "pos_praia": [{"produto":"nome","como":"instrução","tempo":"X min"}]
  },
  "dicas_maquiagem": "resumo em 1-2 frases",
  "dicas_maquiagem_detalhado": {
    "preparo": [{"produto":"nome","como":"instrução","tempo":"X min","dica":"dica extra"}],
    "aplicacao": [{"produto":"nome do make","como":"técnica","dica":"dica extra"}],
    "remocao": [{"produto":"nome","como":"instrução","tempo":"X min"}],
    "dicas_extras": ["dica 1", "dica 2"]
  }
}
```

**Resposta usada para:** Alimentar as abas de Protocolos Especiais em `protocolo.html` (Espinha, Praia, Maquiagem). Os dados são merged no objecto `S.protocolo` e guardados junto com a Call 1.

---

### FLUXO B — Protocolo / Aba Sugestões

**Ficheiro:** `app/protocolo.html`

A aba Sugestões tem **3 subtabs**, cada uma com lógica e fonte de dados próprias:

---

#### Subtab "Da rotina" — Produtos que faltam na rotina
- **Fonte:** `protocolo.sugestoes` (gerado na Call 1 pelo Claude)
- **Motor:** Sem chamada de IA (renderização directa do JSON guardado)
- **Conteúdo:** Categorias essenciais ausentes (limpador, protetor, sérum, etc.) com 3 opções de produto (Econômica / Intermediária / Premium) e links de afiliado
- **Botões de acção:**
  - "✓ Já tenho — adicionar à rotina" → dispara `adicionarSugestaoRotina()` (ver B3)
  - "📦 Encomendei — a caminho" → mesmo flow, marca passo como `pendente: true`

**Upgrades (renderizados ao fundo da subtab "Da rotina"):**
- **Fonte:** `protocolo.sugestoes_upgrade` (exatamente 2, gerados pelo Claude na Call 1)
- Produtos que elevariam a rotina sem adicionar passos desnecessários
- Mesmo layout de cards com 3 tiers e links de afiliado

---

#### Subtab "Boosters" — Produtos complementares
- **Fonte:** `protocolo.sugestoes` (mesma lista, filtrada por contexto)
- **Motor:** Sem chamada de IA (ou `converterListaParaSugestoes()` se formato legado)
- **Legacy fallback:** Se `protocolo.lista_compras` existir no formato antigo (texto), chama Gemini para converter:

**Motor:** Gemini 2.5 Flash (Text) · **thinkingBudget:** 0 · **maxTokens:** 2000

**Prompt de conversão legacy (`converterListaParaSugestoes`):**
```
Converta esta lista de cuidados em sugestões estruturadas.
LISTA: [itens em texto simples]
PERFIL: tipo de pele=[tipo], investimento=[orçamento], país=[país]

Para cada item, crie uma entrada com 3 opções de produto REAL disponível em [mercado] com preços em [moeda]:
[{
  "falta": "NOME CATEGORIA",
  "icone": "emoji",
  "motivo": "1-2 frases personalizadas",
  "economica": {"produto":"nome comercial exato","marca":"nome exato","preco":"~X","descricao":"1 frase"},
  "intermediaria": {...},
  "premium": {...}
}]
```

---

#### Subtab "Trocas" — Substituições de produtos incompatíveis
- **Fonte:** `protocolo.sugestoes_substituicoes` (gerado na Call 1 pelo Claude)
- **Motor:** Sem chamada de IA (renderização directa)
- **Visibilidade:** Tab só aparece se `sugestoes_substituicoes.length > 0`
- **Conteúdo:** Produtos que a cliente tem mas contradizem os seus objectivos, com sugestão de troca em 3 tiers e links de afiliado
- **Banner de entrada:** Abre automaticamente o modal "Análise da sua prateleira" ao carregar (1× por sessão), com alertas de validade e botão para ver as trocas

---

### FLUXO C — Adicionar Produto à Rotina

**Ficheiro:** `app/protocolo.html` · **Função:** `adicionarSugestaoRotina(produto, pendente)`

- **Motor:** Gemini 2.5 Flash (Text)
- **Trigger:** Utilizadora clica "✓ Já tenho" ou "📦 Encomendei" num card de sugestão
- **thinkingBudget:** 0 · **maxTokens:** 4000

**System prompt:**
```
Especialista em cosmetologia. Responde APENAS em JSON válido sem markdown.
```

**User prompt:**
```
Você é especialista em cosmetologia com profundo conhecimento de ingredientes e ordem de aplicação
de produtos. Adicione o produto abaixo na rotina, no passo mais adequado.

PRODUTO NOVO: [nome] ([marca])
DESCRIÇÃO: [descrição do produto]

ROTINA ATUAL:
{"rotina_manha":[...passos actuais...],"rotina_noite":[...passos actuais...]}

Retorne APENAS JSON:
{"rotina_manha":[{"passo":1,"produto":"nome","como":"instrução","icone":"emoji","tempo":"X min"}],"rotina_noite":[...]}
```

**Resposta usada para:** Substituir a rotina actual, guardar em localStorage + Firestore, re-renderizar os passos. Se `pendente=true`, o passo fica marcado com "⏳ A caminho" até a utilizadora confirmar chegada.

---

### FLUXO D — Adicionar Produto por Foto

**Ficheiro:** `app/protocolo.html`

- **Motor:** Gemini 2.5 Flash (Vision → Text)
- **Trigger:** Utilizadora faz upload de foto de produto novo na aba Rotina
- **thinkingBudget:** 0

**Passo 1 — Identificação (Vision) · maxTokens: 600:**
```
Identifique este produto de skincare. Perfil: pele [tipo], preocupações: [lista].
Retorne JSON:
{"nome":"nome exato","categoria":"limpeza/tônico/sérum/hidratante/protetor/maquiagem/outro","ativo":"ativo principal","como_usar":"instrução curta de uso","compativel":true}
```

**Passo 2 — Integração na rotina:** mesmo flow que FLUXO C (`adicionarSugestaoRotina`), usando o nome identificado.

---

### FLUXO E — Evolução de Fotos (aba Evolução)

**Ficheiro:** `app/protocolo.html`

- **Motor:** Gemini 2.5 Flash (Vision)
- **Trigger:** Utilizadora faz upload de selfie na aba Evolução
- **thinkingBudget:** 0 · **maxTokens:** 200

**Prompt:**
```
Especialista em cosmetologia. Analise brevemente esta foto da pele.
Em 1-2 frases, descreva o que observa (hidratação, uniformidade, brilho, textura).
Seja encorajadora e específica.
```

**Resposta usada para:** Legenda automática da foto na timeline de evolução. Fotos guardadas em localStorage com data e legenda.

---

### FLUXO F — Protocolo Capilar K-Beauty (aba Cabelo)

**Ficheiro:** `app/protocolo.html` · **Função:** `initHaircare()`

- **Motor:** Gemini 2.5 Flash (Vision + JSON mode)
- **Trigger:** Utilizadora acede à aba Cabelo e faz upload de foto do cabelo
- **thinkingBudget:** 0 · **maxTokens:** 2000 · **responseMimeType:** `application/json`

**Prompt:**
```
Você é especialista em K-Beauty e cuidados capilares. Analise o cabelo nesta foto e crie uma
rotina K-Beauty personalizada. Perfil: [perfil completo em JSON].
Retorne APENAS JSON:
{
  "diagnostico": "análise do cabelo em 2-3 frases",
  "tipo_cabelo": "tipo identificado na foto",
  "rotina_lavagem": [{"passo":1,"produto":"nome","como":"instrução detalhada","icone":"emoji","tempo":"X min"}],
  "tratamentos_semanais": [{"dia":"Seg/Qui","tratamento":"nome","como":"instrução"}],
  "produtos_kbeauty": ["produto coreano — benefício e como usar"]
}
```

**Resposta usada para:** Renderizar o protocolo capilar K-Beauty na aba Cabelo. Guardado em `localStorage` → `sbp_cabelo`.

---

### FLUXO G — Protocolos Especiais (abas Espinha / Praia / Maquiagem)

**Ficheiro:** `app/protocolo.html`

- **Motor:** Sem chamada de IA — renderização directa do JSON guardado
- **Fonte:** `protocolo.protocolo_espinha_detalhado`, `protocolo.protocolo_praia_detalhado`, `protocolo.dicas_maquiagem_detalhado`
- **Gerados na Call 2 do onboarding** (ver A5 — Gemini)

**Aba Espinha renderiza:**
- Regra de ouro
- SOS tratamento pontual
- Rotina manhã e noite com campos `atencao` (avisos em vermelho)
- Lista de ingredientes/produtos proibidos

**Aba Praia renderiza:**
- Regra de ouro
- Rotina véspera / manhã antes / na praia (reaplicação) / pós-praia

**Aba Maquiagem renderiza:**
- Preparação da pele (base para o make)
- Aplicação (técnicas de make com os produtos da cliente)
- Remoção (dupla limpeza)
- Dicas extras personalizadas

---

### FLUXO H — Chat Rápido (aba Rotina)

**Ficheiro:** `app/protocolo.html`

- **Motor:** Gemini 2.5 Flash (Text)
- **Trigger:** Utilizadora faz uma pergunta na caixa de texto da aba Rotina
- **Limite:** 1 pergunta por semana (partilhado com chat.html)
- **thinkingBudget:** 0 · **maxTokens:** 2000

**System prompt:**
```
Você é uma especialista sênior em cosmetologia e skincare da equipa Hegai Skin.
Responde sempre em português europeu (Portugal) de forma calorosa, clara e acessível.
Nunca usa as palavras diagnóstico, tratamento, prescrição, medicamento ou patologia.
Não faça listas longas — prefira texto fluido com 2 a 4 parágrafos curtos.
Sempre lembre no final que dúvidas clínicas ou dermatológicas devem ser levadas a um profissional de saúde.
Contexto da cliente: [perfil completo + lista de produtos do localStorage]
```

**User prompt:** Pergunta literal da utilizadora.

---

### FLUXO I — Chat Polly (página dedicada)

**Ficheiro:** `app/chat.html` · **Função:** `callGemini(q)`

- **Motor:** Gemini 2.5 Flash (Text)
- **Trigger:** Utilizadora envia mensagem no chat
- **Limite:** 1 pergunta por semana (partilhado com Fluxo H)
- **thinkingBudget:** 0 · **maxTokens:** 2048 · **temperature:** 0.5

**System prompt:** (idêntico ao Fluxo H)

**User prompt:** Mensagem literal da utilizadora.

**Resposta usada para:** Exibir no chat; guardado em `sbp_chat_meta` (localStorage + Firestore) com campos `lastQuestion`, `lastQ`, `lastA`.

---

### FLUXO J — Aviso Filhos Pequenos + Timer (pós-rotina)

**Ficheiro:** `app/protocolo.html` · **Função:** `mostrarAvisoFilhos()` / `iniciarTimerBebe()`

- **Motor:** Sem chamada de IA — dados gerados na Call 1 (Claude)
- **Fonte:** `protocolo.aviso_filhos` (array com produto, ativo, tempo_antes)
- **Trigger:** Automático ao carregar protocolo, se `filhos_pequenos: true` no perfil

**Comportamento:**
1. Banner aparece com lista de produtos e tempos de espera por ativo
2. Botão "⏱ Iniciar temporizador (X min)" usa o maior tempo de espera de todos os produtos
3. Ao clicar: pede permissão de notificação → countdown visível → notificação push via Service Worker
4. Fallback iOS (permissão negada): TTS fala "Já podes pegar no teu bebé com segurança!"

**Tempos de referência usados no prompt:**
| Ativo | Tempo seguro |
|---|---|
| Retinol / Vitamina A | 30 min |
| AHA/BHA (ácidos) | 20 min |
| Vitamina C estabilizada | 10 min |
| Óleos essenciais concentrados | 30 min |
| Álcool em alta concentração | 15 min |

---

### FLUXO K — Conteúdo Diário (Dica + Frase do dia)

**Ficheiro:** `app/protocolo.html` · **Funções:** `iniciarConteudoDiario()` / `gerarConteudoDiario()`

- **Motor:** Gemini 2.5 Flash (Text)
- **Trigger:** Automático ao carregar protocolo — gerado **uma única vez**, depois servido do cache
- **thinkingBudget:** 0 · **maxTokens:** 4000
- **Regeneração:** Automática se conteúdo guardado tiver menos de 25 itens (versão antiga)

**System prompt:**
```
Especialista sênior em skincare e bem-estar feminino. Responde EXCLUSIVAMENTE em JSON válido.
```

**User prompt:**
```
Cria conteúdo diário personalizado para uma app de skincare.

PERFIL DA UTILIZADORA:
- Tipo de pele: [tipo]
- Objetivos: [lista de incômodos]
- Exercício: [frequência]
- Maquiagem: [uso]

Gera EXATAMENTE 30 "dicas" e 30 "frases".

REGRAS OBRIGATÓRIAS PARA AS DICAS:
• Linguagem simples de amiga próxima. NUNCA uses termos técnicos como comedogénico,
  queratolítico, emoliente, oclusivo, humectante, seborreico, etc.
• Curtas — 1 a 2 frases. Todas diferentes entre si.
• Inclui sempre: fronha de cetim (evita marcas de rugas E cabelo não embaraça),
  protetor solar, hidratação, sono, exercício, maquilhagem, stress, alimentação, etc.
• Personalizadas para o perfil acima.

REGRAS PARA AS FRASES:
• Autoestima e motivação para a jornada de skincare.
• Calorosas, curtas, inspiradoras. Em português europeu. Todas diferentes.

Retorne APENAS JSON: {"dicas":["...30 dicas..."],"frases":["...30 frases..."]}
```

**Resposta usada para:** Guardar em `localStorage` (`sbp_daily_content`) + Firestore (`daily_content`).
Rotação por `dia_do_ano % 30`. Cada card descartável por dia com ×.

**Visual:** Frase (fundo escuro) + Dica (fundo dourado), ambas abaixo das abas.

---

## 4. MAPA COMPLETO DE CHAMADAS DE IA

| # | Ficheiro | Motor | Modelo | Trigger | Função | maxTokens | Thinking |
|---|---|---|---|---|---|---|---|
| A1 | onboarding | Gemini | 2.5-flash | Foto prateleira | `geminiVision()` | 800 | 0 |
| A2 | onboarding | Gemini | 2.5-flash | Foto aparelho | `geminiVision()` | 400 | 0 |
| A3 | onboarding | Gemini | 2.5-flash | Selfie rosto | `analisarFotoGemini()` | 2048 | **8192** |
| A4 | onboarding | **Claude** | sonnet-4-6 | Submit form | `gerarProtocolo()` | 16384 | N/A |
| A5 | onboarding | Gemini | 2.5-flash | Após A4 | `geminiChat()` | 6000 | 0 |
| B1 | protocolo | Gemini | 2.5-flash | "Já tenho" / "Encomendei" | `adicionarSugestaoRotina()` | 4000 | 0 |
| B2 | protocolo | Gemini | 2.5-flash | Legacy load | `converterListaParaSugestoes()` | 2000 | 0 |
| C | protocolo | Gemini | 2.5-flash | Upload foto produto | `geminiVisionChat()` | 600 | 0 |
| D | protocolo | Gemini | 2.5-flash | Upload selfie evolução | `geminiVision()` | 200 | 0 |
| E | protocolo | Gemini | 2.5-flash | Upload foto cabelo | fetch inline | 2000 | 0 |
| F | protocolo | Gemini | 2.5-flash | Pergunta aba Rotina | `geminiChat()` | 2000 | 0 |
| G | chat | Gemini | 2.5-flash | Mensagem chat | `callGemini()` | 2048 | 0 |
| K | protocolo | Gemini | 2.5-flash | 1ª abertura (sem cache) | `gerarConteudoDiario()` | 4000 | 0 |

---

## 5. ARQUITECTURA DE DADOS

```
ONBOARDING
  │
  ├─ [Opcional] A1: Foto prateleira → Gemini Vision → lista de produtos (S.prodTxt)
  ├─ [Opcional] A2: Foto aparelho   → Gemini Vision → adiciona à lista
  ├─ [Opcional] A3: Selfie rosto    → Gemini Vision (thinking 8192) → pré-preenche perfil
  ├─ Questionário 16 passos         → objecto S completo
  └─ Submit
       ├─ A4: Claude (16k) → rotina + sugestões + score + tags + upgrades + alertas
       └─ A5: Gemini (6k)  → espinha + praia + maquiagem (merged no S.protocolo)
              └─ Guardar → Firestore (protocolos/{uid}) + localStorage (sbp_protocolo)
                         → Redirecionar para protocolo.html

PROTOCOLO (pós-onboarding)
  │
  ├─ Carregar → localStorage / Firestore → renderizar abas
  │
  ├─ Aba Rotina
  │   ├─ Passos da rotina (manhã/noite/express) — dados locais
  │   ├─ Timer por passo + TTS
  │   ├─ Pergunta rápida (F) → Gemini (1×/semana)
  │   ├─ Upload foto produto (C) → Gemini Vision → identificar → integrar (B1)
  │   └─ Aviso filhos (J) → timer + notificação push
  │
  ├─ Aba Sugestões
  │   ├─ "Da rotina" → sugestoes[] + sugestoes_upgrade[] — dados locais
  │   ├─ "Boosters"  → sugestoes[] (legacy: B2 Gemini)
  │   └─ "Trocas"    → sugestoes_substituicoes[] — dados locais
  │
  ├─ Aba Adaptação → fase_adaptacao + semana — dados locais
  │
  ├─ Aba Evolução  → fotos + legenda automática (D: Gemini Vision)
  │
  ├─ Aba Cabelo    → protocolo K-Beauty (E: Gemini Vision, 1× por sessão)
  │
  └─ Protocolos Especiais (dados locais gerados na Call 2)
      ├─ Espinha    → protocolo_espinha_detalhado
      ├─ Praia      → protocolo_praia_detalhado
      └─ Maquiagem  → dicas_maquiagem_detalhado

CHAT POLLY (chat.html)
  └─ Mensagem → G: Gemini (1×/semana partilhada) → resposta conversacional
```

---

## 6. CONFIGURAÇÕES TÉCNICAS

| Parâmetro | Valor |
|---|---|
| Claude model | `claude-sonnet-4-6` |
| Gemini model | `gemini-2.5-flash` |
| Claude max tokens (Call 1) | 16384 |
| Gemini max tokens (Call 2 — protocolos especiais) | 6000 |
| Gemini thinking (face scan) | 8192 |
| Gemini thinking (todas as outras) | 0 (desactivado) |
| Chat / pergunta rápida limite | 1 por semana por utilizadora |
| PWA cache versão | `hegai-v9` (Service Worker) |
| Auth | Firebase Auth (email + Google OAuth) |
| Database | Firestore → colecção `protocolos` → doc `{uid}` |
| Dados locais | `localStorage` → `sbp_protocolo`, `sbp_perfil`, `sbp_ativo`, `sbp_cabelo`, `sbp_chat_meta`, `sbp_daily_content`, `sbp_frase_dispensada`, `sbp_dica_dispensada` |

---

## 7. FICHEIROS PRINCIPAIS

| Ficheiro | Responsabilidade |
|---|---|
| `app/onboarding.html` | Questionário 16 passos, face scan, OCR produtos/aparelhos, Call 1 (Claude) + Call 2 (Gemini) |
| `app/protocolo.html` | Todas as abas da rotina, sugestões, protocolos especiais, evolução, chat inline, timer, aviso filhos |
| `app/chat.html` | Chat dedicado com a Polly (Gemini 2.5 Flash) |
| `app/sw.js` | Service Worker — cache PWA (`hegai-v9`), notificações push |
| `app/manifest.json` | Configuração PWA (nome, ícones, cores de tema) |

---

*Documento gerado a 26 de Maio de 2026 — branch `main` · Hegai Skin / SkinCare by Polly*
