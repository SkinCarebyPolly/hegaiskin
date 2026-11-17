# Rotinas personalizadas da loja — escopo revisado

## Objetivo

Adaptar a base web do Hegai beta para que uma loja de skincare entregue a cada cliente uma rotina organizada a partir do perfil informado e dos produtos comprados na loja.

## Decisão de produto

A entrega principal será uma página web responsiva, com aparência de miniapp e acesso pelo navegador do celular. A cliente alterna entre manhã completa, manhã expressa, noite completa e noite expressa. Um PDF bonito e imprimível pode existir como opção de backup, mas não será a experiência principal: a página é mais agradável para navegar e permite corrigir e atualizar uma rotina sem gerar outro arquivo.

O fluxo recomendado:

1. No caixa, a loja associa os produtos comprados à cliente pelo SKU/código do catálogo e envia um QR impresso ou link por WhatsApp/e-mail. O QR abre o questionário inicial.
2. A cliente preenche nome e e-mail, responde sobre objetivos e comportamento da pele após a lavagem e ao longo do dia, informa sensibilidade percebida e restrições relevantes. O resultado será apresentado como **perfil cosmético provável**, nunca como certeza ou diagnóstico.
3. A selfie é opcional, com consentimento separado. A cliente confirma os produtos identificados a partir da compra; se não houver integração com o caixa, pode fotografar a embalagem, escanear código de barras ou colar um link. Qualquer leitura automática precisa de confirmação humana.
4. A rotina é preparada e revisada. A cliente recebe um e-mail com botão direto para abrir a página pessoal. Um QR do link pode ser incluído no cartão impresso da loja ou no próprio painel; para quem já está no celular, o botão do e-mail é mais fácil que escanear um QR na mesma tela.
5. A página permite adicionar à tela inicial do celular e oferece “Salvar/Imprimir como PDF” como alternativa portátil.

Não será gerado um HTML independente por cliente. A aplicação hospedada apresenta a rotina de cada cliente em um endereço individual aleatório, sem nome ou e-mail na URL. O link deve ser revogável e protegido por token; política de validade, armazenamento e exclusão será definida antes de usar dados reais.

## Fluxo do piloto

1. A loja associa os produtos à venda por SKU/código de barras. Sem integração ao caixa, a cliente informa ou fotografa os produtos e confirma o nome reconhecido.
2. A cliente abre o QR/link, responde ao questionário e dá consentimentos separados para respostas e selfie opcional.
3. As respostas estimam um perfil provável por regras transparentes. Se respostas conflitarem ou faltarem, o perfil fica “inconclusivo” e a rotina usa orientações conservadoras.
4. A loja revisa a rotina e as informações dos produtos antes de liberá-la.
5. A página oferece quatro abas (manhã completa, manhã expressa, noite completa e noite expressa); nomes reais e instruções aprovadas para os itens comprados; etapas genéricas para o que não foi comprado.
6. A cliente recebe e-mail com link direto e pode guardar o acesso nos favoritos/tela inicial. PDF é opcional.

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

- Apresentar aviso claro e consentimento para respostas e, separadamente, para cada tipo de imagem antes da coleta.
- Coletar somente os dados necessários. Selfie opcional; não guardar imagens por padrão depois da revisão.
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

## Recomendação de entrega

Página web/PWA como produto principal, com link individual enviado por e-mail e QR impresso como atalho de entrada/retorno. PDF gerado da mesma página pode ser disponibilizado para imprimir ou guardar. Essa combinação mantém o conteúdo bonito e navegável, sem exigir um arquivo HTML baixável por cliente nem depender do leitor de PDF do celular.

## Pontos a decidir antes de abrir para clientes

- Nome e identidade visual da loja.
- Loja/plataforma de vendas e como identificar os SKUs comprados.
- Quantos atendimentos serão feitos no piloto e por quais funcionárias.
- Prazo de validade do link, retenção e canal para pedidos de exclusão.
- Quais categorias e produtos entram no primeiro catálogo.
- Confirmar aviso de privacidade e base legal com orientação apropriada antes do piloto.
