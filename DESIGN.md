---
name: Licensing Pro
description: Painel operacional para licenças, renovações e evidências regulatórias.
colors:
  primary: "#2859d6"
  primary-hover: "#3868e5"
  focus: "#73a0ff"
  canvas: "#07162d"
  navigation: "#08182f"
  surface: "#091a33"
  surface-raised: "#0b1d39"
  border: "#17345d"
  login-panel: "#302bcc"
  ink: "#ffffff"
  muted: "#9eb3d5"
  success: "#35bc7d"
  warning: "#f5b821"
  danger: "#fb4b63"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.4
rounded:
  control: "8px"
  component: "12px"
  compact: "6px"
spacing:
  compact: "8px"
  field: "12px"
  component: "16px"
  panel: "20px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.component}"
    padding: "20px"
---

# Design System: Licensing Pro

## Overview

**Creative North Star: "A Sala de Controle Regulatória"**

Licensing Pro é uma área de trabalho para decisão operacional: o administrador abre o sistema para localizar um vencimento, recuperar uma evidência ou iniciar uma renovação sem procurar em telas decorativas. A interface é escura porque o trabalho acontece com atenção sustentada, em listas e datas que precisam permanecer legíveis por longos períodos.

O produto usa uma base azul-marinho densa, painéis opacos em camadas e luz azul exclusivamente como orientação de navegação e ação. A tela de login preserva um contraste intencional entre o painel institucional azul-violeta e a face operacional azul-marinho. O sistema rejeita estética de template de IA, efeitos decorativos excessivos, gradientes chamativos, vidro translúcido como padrão e interfaces promocionais.

**Key Characteristics:**

- Hierarquia centrada em vencimento, risco e próxima ação, nunca em decoração.
- Superfícies escuras opacas organizadas por bordas estruturais, não por sombras difusas.
- Logos institucionais são informação de contexto e aparecem pequenos, autênticos e proporcionais.
- Dados verificáveis usam contraste alto e datas/identificadores em JetBrains Mono.

## Colors

A paleta é um espectro operacional de azul profundo. O azul de ação orienta foco e navegação; cores de status só comunicam situação regulatória.

### Primary

- **Azul de comando**: usado em botões de ação, item ativo e links operacionais.
- **Azul de resposta**: usado apenas no hover da ação primária e em feedbacks de interação.
- **Azul de foco**: anel de teclado, foco de campo e destaque de navegação ativa.

### Secondary

- **Violeta institucional**: exclusivo do painel de marca na tela de login; não migra para tabelas ou chips internos.

### Tertiary

- **Verde de conformidade**: estado vigente, concluído ou baixo risco.
- **Âmbar de atenção**: janela de renovação e prazo próximo.
- **Vermelho de bloqueio**: licença vencida, risco crítico ou falha relevante.

### Neutral

- **Canvas noturno**: plano contínuo das áreas autenticadas e da face direita do login.
- **Navegação profunda**: barra lateral e cabeçalho; separa orientação de conteúdo sem recorrer a preto puro.
- **Superfície operacional**: painéis, tabelas e blocos de leitura.
- **Superfície elevada**: campos, ações rápidas e controles dentro de um painel.
- **Borda estrutural**: separa grupos, linhas de tabela e áreas de contexto.
- **Tinta verificada**: branco para informação primária e azul claro dessaturado para contexto secundário.

**The Semantic State Rule.** Verde, âmbar e vermelho são proibidos como ornamento. Cada ocorrência precisa corresponder a um estado, prazo, risco ou resultado compreensível sem depender apenas da cor.

**The Blue Field Rule.** O azul de comando ocupa ações e seleção; nunca preenche todos os cartões. A maior parte de uma tela é canvas, superfície ou tinta verificada.

## Typography

**Display Font:** Outfit (com fallback sans-serif)
**Body Font:** system-ui
**Label/Mono Font:** JetBrains Mono para datas, CNPJ, protocolos e identificadores verificáveis.

**Character:** títulos são firmes e compactos; rótulos são discretos e dados críticos não disputam atenção com frases promocionais. A leitura deve parecer uma operação segura, não uma campanha.

### Hierarchy

- **Display** (700, 36px, 1.0): título da tela e nome do produto no login.
- **Headline** (700, 20–24px, 1.15): título de painel, fila ou área de decisão.
- **Title** (600–700, 14–16px, 1.25): nome de licença, empresa e agrupamento.
- **Body** (400–500, 12–14px, 1.5): contexto, instruções e detalhes de listas.
- **Label** (600, 10–12px, tracking normal): metadados e rótulos persistentes; nunca exceder o conteúdo principal.

**The Verification Rule.** Datas, CNPJ e identificadores usam JetBrains Mono e contraste alto. Dados regulatórios nunca dependem de tamanho reduzido, baixa opacidade ou somente cor.

## Elevation

O sistema é plano por padrão. Profundidade vem de três superfícies azul-marinho e de bordas de 1px; sombras são reservadas para o menu de notificações e sobreposições reais. Cartões em repouso não flutuam.

**The Boundary Rule.** Uma borda estrutural separa conteúdo; sombra difusa não substitui hierarquia. Se uma superfície precisa de ambos, a composição está excessiva e deve ser simplificada.

## Components

### Buttons

- **Shape:** cantos firmes e suavemente arredondados (8px).
- **Primary:** azul de comando, tinta branca e padding de 10px por 16px; usado para iniciar ou avançar uma ação operacional.
- **Hover / Focus:** hover em azul de resposta; foco de teclado em anel azul claro de 2px com offset no canvas.
- **Secondary:** superfície elevada, borda estrutural e tinta branca; usado para ações de apoio sem competir com a ação principal.

### Chips

- **Style:** pequenos, com borda tonal e fundo de baixa intensidade; texto sempre nomeia o estado.
- **State:** verde para vigente, âmbar para atenção e vermelho para crítico/vencido; azul é reservado para renovação em andamento ou seleção.

### Cards / Containers

- **Corner Style:** painel (12px) e bloco compacto (6px); raios acima de 16px são proibidos em novas superfícies.
- **Background:** superfície operacional para tabelas e painéis; superfície elevada para grupos internos.
- **Shadow Strategy:** nenhuma sombra em repouso; borda estrutural define o agrupamento.
- **Internal Padding:** 20px em painéis e 16px em blocos compactos.

### Inputs / Fields

- **Style:** superfície elevada, borda estrutural e tinta branca; rótulo sempre permanece visível acima do campo.
- **Focus:** anel azul claro de 2px e offset no canvas.
- **Error / Disabled:** erro usa vermelho acompanhado de texto; desabilitado mantém contraste suficiente para leitura.

### Navigation

- **Style:** barra lateral azul profunda, ícone e rótulo alinhados; item ativo em azul de comando com linha interna azul clara.
- **Hover:** fundo azul elevado, sem sombras e sem escalonamento.
- **Mobile:** a marca continua identificável e os controles continuam acessíveis sem depender de hover.

### Painel de Conformidade

- **Tabela de renovações:** o principal bloco de decisão; colunas de licença, empresa, data, renovação e risco devem permanecer comparáveis.
- **Linha do tempo:** visualização breve dos marcos próximos, usando pontos de status e legenda textual.
- **Órgãos e entidades:** logos reais em pequena escala, preservando transparência e proporção; nunca substituir por símbolos genéricos.

## Do's and Don'ts

### Do:

- **Do** usar o azul de comando para ação, seleção e foco — não como preenchimento decorativo de toda a tela.
- **Do** manter canvas noturno, superfície operacional e borda estrutural como a base de todas as áreas autenticadas.
- **Do** preservar logos institucionais transparentes e proporcionais junto às licenças e aos agrupamentos de órgãos.
- **Do** apresentar prazos, risco e próxima ação antes de análises secundárias.
- **Do** respeitar transições de 150–250ms e desativá-las com `prefers-reduced-motion`.

### Don't:

- **Don't** usar estética de template de IA, efeitos decorativos excessivos, gradientes chamativos, vidro translúcido como padrão ou interfaces promocionais.
- **Don't** usar raios acima de 16px em cartões, formulários ou painéis operacionais.
- **Don't** combinar borda fina e sombra ampla para decorar superfícies.
- **Don't** esconder editar, imprimir, baixar ou renovar exclusivamente em hover.
- **Don't** usar verde, âmbar ou vermelho fora de estados semânticos.
