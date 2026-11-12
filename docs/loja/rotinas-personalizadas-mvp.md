# Rotinas personalizadas da loja — escopo inicial

## Objetivo

Adaptar a base web do Hegai beta para que uma loja de skincare entregue a cada cliente uma rotina organizada a partir do perfil informado e dos produtos comprados na loja.

## Decisão de produto

- A cliente acessa a experiência por um QR code que abre uma página privada e personalizada no navegador.
- A rotina é montada uma vez a partir de regras e modelos aprovados. A interface permite alternar entre manhã/noite e rotina completa/expressa.
- Um PDF pode ser baixado ou impresso como cópia portátil.
- Não será gerado um HTML independente para cada cliente. A aplicação hospedada apresenta os dados daquela cliente por um link individual.
- O uso do scanner e da identificação por foto deve ser opcional e acompanhado de confirmação humana.

## Fluxo do MVP

1. A loja cria o atendimento, informa o nome da cliente e associa os produtos comprados a partir do catálogo.
2. A cliente abre o QR/link e responde perguntas curtas sobre tipo de pele percebido, sensibilidade, objetivos e restrições relevantes.
3. A cliente pode fazer uma captura orientada da pele e fotografar os produtos. A identificação sugerida por foto/OCR deve ser confirmada antes de usar o produto na rotina.
4. A aplicação apresenta um resumo cosmético do perfil, sem linguagem de diagnóstico.
5. O gerador aplica regras de segurança e encaixa os produtos confirmados em quatro rotinas: manhã completa, manhã expressa, noite completa e noite expressa.
6. Os produtos comprados aparecem com nome real, modo de uso e benefícios aprovados do fabricante. Etapas sem produto comprado usam rótulos genéricos (por exemplo, limpeza, hidratante ou protetor solar).
7. A cliente recebe um link individual e pode salvar/baixar o PDF.

## Catálogo de produtos

Cada item deve guardar:

- nome exato, marca, categoria e SKU/código de barras quando disponível;
- instruções de uso e benefícios conforme material oficial do fabricante;
- fonte e data de conferência dessas informações;
- restrições e regras de encaixe revisadas pela loja;
- imagem autorizada do produto, quando disponível.

A loja confirma manualmente um produto novo antes que ele passe a integrar o catálogo.

## Painel da loja

Para o piloto, o painel deve permitir:

- criar e localizar atendimentos;
- registrar produtos comprados e corrigir uma identificação;
- conferir a rotina antes de liberar o link;
- regenerar/revogar o link e solicitar exclusão dos dados;
- manter o catálogo e as fontes dos produtos.

## Privacidade e segurança

- Mostrar consentimento claro e finalidade antes de coletar respostas ou imagens.
- Coletar somente os dados necessários; não guardar fotos por padrão após a análise.
- Usar identificador aleatório no link, sem nome, e-mail ou descrição da pele na URL.
- Limitar o acesso à cliente e à equipe autorizada, com opção de revogar o link.
- Definir retenção e exclusão antes do piloto.
- Tratar informações inferidas sobre a pele com cautela e não apresentar a experiência como avaliação médica.

## Reuso da base existente

O repositório contém páginas beta em `app/index.html`, `app/onboarding.html` e `app/protocolo.html`, além de configuração Firebase e manifesto PWA. A nova experiência deve ser isolada em uma rota/módulo próprio até a auditoria de autenticação, regras de banco, armazenamento e chaves do beta. Não alterar a jornada atual do Hegai durante o piloto.

## Fases

### Fase 1 — piloto funcional
Painel mínimo, cadastro de cliente/compra, questionário, catálogo manual, regras para quatro rotinas, página individual e PDF.

### Fase 2 — identificação assistida
Captura de fotos e OCR com confirmação da cliente/equipe; fila para produtos que ainda não existem no catálogo.

### Fase 3 — automação da loja
Integração com vendas/estoque, emissão automática do QR e métricas de uso.

## Pontos a decidir antes de abrir para clientes

- Nome e identidade visual da loja.
- Quantos atendimentos serão feitos no piloto e por quais funcionárias.
- Se o QR será iniciado pela loja ou enviado depois que a cliente responder ao questionário.
- Prazo de retenção e canal de atendimento para pedidos de exclusão.
- Quais categorias e produtos entram no primeiro catálogo.
