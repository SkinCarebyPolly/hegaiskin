# Hegai Skin — Technical Brief para Desenvolvedor
**Versão:** Junho 2026 · **Branch prod:** `main` (GitHub Pages)

---

## 1. TOKENS DE AFILIADO

Os links de afiliado são construídos dinamicamente em `app/protocolo.html` (linhas ~687–712).
Os placeholders abaixo precisam ser substituídos pelos tokens reais:

### Brasil (BR)
| Plataforma | Parâmetro | Placeholder atual | Onde substitituir |
|---|---|---|---|
| Amazon Brasil | `tag=` | `COLOQUE_TAG_BR` | `protocolo.html` → objeto `afiliados.BR.amazon.tag` |
| Mercado Livre | _(sem tag)_ | — | Verificar programa de afiliados ML |
| Droga Raia | _(sem tag)_ | — | Sem programa de afiliados ativo |

### Portugal (PT)
| Plataforma | Parâmetro | Placeholder atual | Onde substituir |
|---|---|---|---|
| Amazon.es | `tag=` | `COLOQUE_TAG_ES` | `protocolo.html` → objeto `afiliados.PT.amazon.tag` |
| YesStyle | `ref=` | `COLOQUE_TAG_YESSTYLE` | `protocolo.html` → objeto `afiliados.PT.yesstyle.tag` |
| Notino | _(sem tag)_ | — | Sem programa de afiliados ativo |

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
| **Gemini** | `gemini-2.5-flash` | Face scan, OCR de produtos, aparelhos, chat, protocolos especiais, evolução de fotos |

### Endpoints
```
Claude:  https://api.anthropic.com/v1/messages
Gemini:  https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
```

### Regra de Thinking Tokens (Gemini 2.5 Flash)
- **Face scan**: `thinkingBudget: 8192` — pensamento ativo para análise de pele
- **Todas as outras calls**: `thinkingBudget: 0` — desativado para velocidade e economia de tokens
- **Filtro obrigatório**: partes com `thought: true` devem ser filtradas da resposta antes de parsear

---

## 3. FLUXOS E PROMPTS

---

### FLUXO A — Onboarding (16 passos → geração da rotina)

**Ficheiro:** `app/onboarding.html`

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

**Resposta usada para:** Construir `S.prodTxt` — lista de produtos reais que alimenta a Call 1 (Claude).

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

**Resposta usada para:** Adicionar aparelhos à lista de produtos; Claude incluirá como passos dedicados na rotina.

---

#### A3 · Face Scan (análise da foto do rosto)
- **Motor:** Gemini 2.5 Flash (Vision)
- **Função:** `analisarFotoGemini(b64)`
- **Trigger:** Utilizadora tira ou faz upload de selfie durante o onboarding
- **thinkingBudget:** 8192 (único ponto com thinking ativo) · **maxTokens:** 2048

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

**Resposta usada para:** Pré-preencher campos do questionário (tipo de pele, oleosidade, etc.) e enriquecer o perfil enviado ao Claude.

---

#### A4 · Geração da Rotina Completa (Call Principal)
- **Motor:** Claude API (`claude-sonnet-4-6`)
- **Função:** `gerarProtocolo()` → fetch direto à API Anthropic
- **Trigger:** Utilizadora submete o formulário após completar os 16 passos
- **maxTokens:** 16384

**System prompt (Claude):**
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

**User prompt (construído dinamicamente com perfil completo):**
```
Especialista sênior em cosmetologia e K-Beauty. Crie uma rotina ULTRA PERSONALIZADA.

PERFIL:
- Nome: [nome]
- País/Moeda: [BR/PT] · Orçamento: [valor]
- Tipo de pele: [tipo] | Incômodos: [lista]
- Tempo de rotina: [minutos]
- Sol: [exposição] | Sono: [horas] | Estresse: [nível]
- Água: [consumo] | Sensibilidade: [nível]
- Gestante: [status] | Filhos <6 anos: [Sim/Não] | Exercício: [frequência]
- Ativos: [experiência] | Maquiagem: [uso]
- Objetivo: [objetivos] | Textura preferida: [textura]
- Ciclo menstrual: [status] | Alimentação: [padrão]

PRODUTOS IDENTIFICADOS (USE NOMES EXATOS NA ROTINA):
[lista de produtos do OCR]

REGRAS:
1. [Se sem produtos: gerar rotina com categorias + ativos ideais sem marcas reais]
   [Se com produtos: usar APENAS produtos listados pelos nomes exatos]
2. Aparelhos DEVEM aparecer como passos dedicados com modo de uso, tempo por zona,
   movimentos e frequência semanal.
3. Adaptação: semana 1 suave → semana 4 completa.
4. Tom caloroso e encorajador — como amiga especialista.
5. Score 0-100: 0-40=Início, 41-70=Em Evolução, 71-90=Pele em dia, 91-100=Pele radiante.
[Se gestante: NUNCA Retinol, AHA/BHA>5%, Ácido Salicílico, Vitamina A]

Retorne APENAS JSON válido:
{
  "nome_cliente": "...",
  "diagnostico": "3-4 frases motivadoras sobre a pele",
  "tipo_pele": "...",
  "tags": ["anti-manchas","hidratação",...],
  "fase_adaptacao": "semana a semana detalhada",
  "sem_produto": true/false,
  "rotina_manha": [{"passo":1,"produto":"...","categoria":"...","ativo_ideal":"...","como":"...","icone":"emoji","tempo":"X min"}],
  "rotina_noite": [...],
  "rotina_express_manha": [max 3 passos essenciais],
  "rotina_express_noite": [max 3 passos essenciais],
  "semana": {"seg_qui":"...","ter_sex":"...","qua_sab":"...","dom":"..."},
  "score_pele": 72,
  "produtos_identificados": [],
  "sugestoes": [{"falta":"CATEGORIA","icone":"emoji","motivo":"...","economica":{...},"intermediaria":{...},"premium":{...}}],
  "sugestoes_substituicoes": [produtos incompatíveis com os objetivos → [] se todos ok],
  "sugestoes_upgrade": [exatamente 2 upgrades que elevam a rotina],
  "alertas_validade": [produtos sensíveis a luz/calor → [] se sem produtos],
  "aviso_filhos": [produtos com ativos de risco para crianças com tempo de espera → [] se sem filhos]
}

INSTRUÇÕES ADICIONAIS:
• tags: máx 6, minúsculas, COM HÍFEN ("anti-manchas", "anti-idade")
• sugestoes: TODAS as categorias ausentes; priorizar marcas que a cliente já usa
• rotina_express: limpeza + protetor (manhã); limpeza + hidratante (noite); sem aparelhos
• sugestoes_upgrade: produtos que cabem no tempo disponível ou substituem um passo
• alertas_validade: só produtos que a cliente TEM; [] se sem produtos próprios
• aviso_filhos: retinol→30min, AHA/BHA→20min, vitamina C→10min, óleos essenciais→30min
```

**Resposta usada para:** Gerar e guardar o protocolo completo no Firestore + localStorage, redirecionar para `protocolo.html`.

---

### FLUXO B — Protocolo (gestão da rotina em curso)

**Ficheiro:** `app/protocolo.html`

#### B1 · Adicionar Produto Novo (foto)
- **Motor:** Gemini 2.5 Flash (Vision + Text)
- **Funções:** `geminiVisionChat()` → identifica produto; `geminiChat()` → integra na rotina
- **Trigger:** Utilizadora faz upload de foto de produto novo
- **thinkingBudget:** 0

**Prompt de identificação (Vision):**
```
Identifique este produto de skincare. Nome exato, marca exata.
Retorne JSON: {"nome":"nome exato","marca":"marca exata","categoria":"tipo","ativo":"ativo principal","descricao":"1 frase"}
```

**Prompt de integração (Text — `adicionarSugestaoRotina`):**
```
Especialista em cosmetologia. Adicione o produto na rotina no passo mais adequado.

PRODUTO NOVO: [nome]
DESCRIÇÃO: [descrição]
OBJETIVOS: [objetivos da cliente]

ROTINA ATUAL:
[JSON da rotina completa]

Retorne APENAS JSON:
{"rotina_manha":[{"passo":1,"produto":"nome","como":"instrução","icone":"emoji","tempo":"X min"}],"rotina_noite":[...]}
```

**maxTokens:** 4000 (para evitar truncagem da rotina completa)

---

#### B2 · Conversão de Lista de Sugestões (legacy)
- **Motor:** Gemini 2.5 Flash (Text)
- **Função:** `converterListaParaSugestoes()`
- **Trigger:** Automático ao carregar protocolo com sugestões no formato antigo (texto simples)
- **thinkingBudget:** 0 · **maxTokens:** 2000

**Prompt:**
```
Converta esta lista de cuidados em sugestões estruturadas.
LISTA: [itens em texto simples]
PERFIL: tipo=[tipo pele], investimento=[orçamento], país=[país]

Para cada item, crie uma entrada com 3 opções de produto REAL disponível em [mercado]:
[{"falta":"NOME CATEGORIA","icone":"emoji","motivo":"1-2 frases","economica":{produto,marca,preco,descricao},"intermediaria":{...},"premium":{...}}]
```

---

#### B3 · Análise de Foto de Evolução
- **Motor:** Gemini 2.5 Flash (Vision)
- **Função:** `geminiVision()` após resize da imagem
- **Trigger:** Utilizadora faz upload de selfie na aba Evolução
- **thinkingBudget:** 0 · **maxTokens:** 200

**Prompt:**
```
Especialista em cosmetologia. Analise brevemente esta foto da pele.
Em 1-2 frases, descreva o que observa (hidratação, uniformidade, brilho, textura).
Seja encorajadora e específica.
```

**Resposta usada para:** Legenda automática da foto na timeline de evolução.

---

#### B4 · Protocolo Capilar K-Beauty (aba especial)
- **Motor:** Gemini 2.5 Flash (Vision + JSON mode)
- **Trigger:** Utilizadora acede à aba de protocolo capilar e faz upload de foto do cabelo
- **thinkingBudget:** 0 · **maxTokens:** 2000 · **responseMimeType:** `application/json`

**Prompt (inline no fetch):**
```
Especialista em K-Beauty e cuidado capilar. Analise o tipo e condição do cabelo nesta foto.
Crie um protocolo capilar personalizado.
Retorne JSON com rotina de lavagem, hidratação, tratamento e frequência semanal.
```

---

#### B5 · Pergunta Rápida (aba Rotina — Chat inline)
- **Motor:** Gemini 2.5 Flash (Text)
- **Função:** `geminiChat()` com contexto do perfil
- **Trigger:** Utilizadora faz pergunta na caixa da aba Rotina
- **Limite:** 1 pergunta por semana (guardado em `sbp_chat_meta`)
- **thinkingBudget:** 0 · **maxTokens:** 2000

**System prompt:**
```
Você é uma especialista sênior em cosmetologia e skincare da equipa Hegai Skin. Responde sempre
em português europeu (Portugal) de forma calorosa, clara e acessível. Nunca usa as palavras
diagnóstico, tratamento, prescrição, medicamento ou patologia. Não faça listas longas — prefira
texto fluido com 2 a 4 parágrafos curtos. Sempre lembre no final que dúvidas clínicas ou
dermatológicas devem ser levadas a um profissional de saúde.
Contexto da cliente: [perfil completo + lista de produtos do localStorage]
```

**User prompt:** Pergunta literal da utilizadora (texto livre).

---

### FLUXO C — Chat Polly (página dedicada)

**Ficheiro:** `app/chat.html`

#### C1 · Chat com a Polly
- **Motor:** Gemini 2.5 Flash (Text)
- **Função:** `callGemini(q)`
- **Trigger:** Utilizadora envia mensagem no chat
- **Limite:** 1 pergunta por semana (partilhado com B5)
- **thinkingBudget:** 0 · **maxTokens:** 2048 · **temperature:** 0.5

**System prompt:** (idêntico ao B5, acima)

**User prompt:** Mensagem da utilizadora.

**Resposta usada para:** Exibir resposta formatada no chat; guardar em `sbp_chat_meta` (localStorage + Firestore).

---

## 4. RESUMO GERAL DOS FLUXOS

```
ONBOARDING
  │
  ├─ [Opcional] Foto prateleira → Gemini Vision (OCR produtos) → lista de produtos
  ├─ [Opcional] Foto aparelho  → Gemini Vision (identificação) → adiciona à lista
  ├─ [Opcional] Selfie rosto   → Gemini Vision thinking=8192  → pré-preenche perfil
  ├─ Questionário 16 passos    → dados do perfil (S object)
  └─ Submit → Claude claude-sonnet-4-6 (16k tokens) → protocolo JSON completo
                                                      → Firestore + localStorage

PROTOCOLO (pós-onboarding)
  │
  ├─ Carregar rotina    → localStorage / Firestore → renderizar
  ├─ Foto novo produto  → Gemini Vision → identifica → Gemini Text → integra na rotina
  ├─ Foto evolução      → Gemini Vision → legenda automática
  ├─ Protocolo capilar  → Gemini Vision (JSON mode) → protocolo K-Beauty
  └─ Pergunta rápida    → Gemini Text (1×/semana) → resposta contextualizada

CHAT POLLY
  └─ Mensagem → Gemini Text (1×/semana partilhada) → resposta conversacional
```

---

## 5. CONFIGURAÇÕES TÉCNICAS

| Parâmetro | Valor |
|---|---|
| Claude model | `claude-sonnet-4-6` |
| Gemini model | `gemini-2.5-flash` |
| Claude max tokens | 16384 |
| Gemini thinking (face scan) | 8192 |
| Gemini thinking (restante) | 0 (desativado) |
| Chat limit | 1 pergunta / semana / utilizadora |
| PWA cache | `hegai-v9` (Service Worker) |
| Auth | Firebase Auth (email + Google) |
| Database | Firestore → coleção `protocolos` → doc `uid` |
| Dados locais | `localStorage` → `sbp_protocolo`, `sbp_perfil`, `sbp_ativo` |

---

## 6. FICHEIROS PRINCIPAIS

| Ficheiro | Responsabilidade |
|---|---|
| `app/onboarding.html` | Questionário, face scan, OCR, geração da rotina (Claude) |
| `app/protocolo.html` | Exibição da rotina, sugestões, timer, evolução, chat inline |
| `app/chat.html` | Chat dedicado com a Polly (Gemini) |
| `app/sw.js` | Service Worker — cache PWA (`hegai-v9`) |
| `app/manifest.json` | Configuração PWA (nome, ícones, cores) |

---

*Documento gerado a 26 de Maio de 2026 — branch `main` · Hegai Skin / SkinCare by Polly*
