# SkinCare by Polly — Regras de Desenvolvimento

## Deployment
- O site ao vivo é servido pela branch `main` via GitHub Pages
- A branch de desenvolvimento é `claude/gemini-face-scan-validation-LQcw1`
- **SEMPRE que fizer alterações**, commitar e fazer push para AMBAS as branches:
  1. Push para a feature branch (`claude/gemini-face-scan-validation-LQcw1`)
  2. Merge fast-forward para `main` e push
  3. Voltar para a feature branch
- Nunca deixar `main` desatualizado em relação à feature branch

## Arquitetura de APIs
- **Claude API** (`claude-sonnet-4-6`): geração de rotina + sugestões/substituições/alertas (Call 1)
- **Gemini 2.5 Flash**: face scan (thinking budget 8192), OCR produtos, protocolos especiais (espinha/praia/make), chat, identificação de produtos novos
- Gemini calls que NÃO precisam de thinking: usar `thinkingConfig: { thinkingBudget: 0 }` no `generationConfig`
- Parsing de resposta Gemini: sempre filtrar partes com `thought: true` — usar `_geminiText()` em `protocolo.html` ou lógica equivalente

## Arquivos principais
- `app/onboarding.html` — fluxo de onboarding, geração de rotina, face scan
- `app/protocolo.html` — exibição da rotina, todas as abas, timer, evolução
- `app/chat.html` — chat com IA Polly (Gemini)
- `app/sw.js` — Service Worker (cache)
