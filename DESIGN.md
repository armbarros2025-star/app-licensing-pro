---
name: Licensing Pro
description: Sistema confiável para controlar licenças, vencimentos e renovações.
colors:
  primary: "#163b78"
  primary-hover: "#102e63"
  success: "#059669"
  warning: "#d97706"
  danger: "#dc2626"
  surface: "#ffffff"
  neutral-bg: "#f5f7fc"
  neutral-ink: "#102451"
  dark-bg: "#07152e"
  border: "#dce7f5"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.04em"
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontWeight: 700
rounded:
  control: "8px"
  component: "12px"
  legacy-surface: "40px"
spacing:
  compact: "8px"
  field: "12px"
  component: "16px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  input:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.component}"
    padding: "16px"
---

# Design System: Licensing Pro

## Overview

**Creative North Star: "O Registro Confiável"**

Licensing Pro é uma ferramenta operacional de confiança: informações regulatórias devem parecer verificáveis, organizadas e imediatamente acionáveis. A interface privilegia leitura rápida, estados explícitos e comportamento previsível em vez de espetáculo visual.

O sistema usa uma superfície clara, tipografia direta e uma única cor de ação. Superfícies translúcidas e raios grandes existem em áreas legadas, mas não definem o rumo do produto. Novos fluxos devem seguir a linguagem compacta, opaca e sóbria da lista de licenças.

**Key Characteristics:**

- Hierarquia orientada a vencimento, status e próxima ação.
- Controles sempre rotulados, acessíveis por teclado e com foco visível.
- Movimento curto para mudanças de estado; nunca coreografia decorativa.
- Densidade produtiva sem sacrificar legibilidade.

## Colors

O azul institucional identifica a ação primária; verde, âmbar e vermelho comunicam estados regulatórios, nunca decoração.

### Primary

- **Azul institucional de ação** (`#163b78`): botões primários, foco, seleção e navegação ativa.
- **Azul institucional de resposta** (`#102e63`): hover de ações primárias, usado apenas como variação do primário.

### Secondary

- **Verde de conformidade** (`#059669`): licença vigente e confirmação de sucesso.
- **Âmbar de atenção** (`#d97706`): vencimento próximo e renovação em curso.
- **Vermelho de bloqueio** (`#dc2626`): licença vencida, exclusões e falhas críticas.

### Neutral

- **Superfície operacional** (`#ffffff`): cartões, painéis e controles em tema claro.
- **Fundo frio** (`#f5f7fc`): plano de fundo e campos secundários.
- **Tinta principal** (`#102451`): títulos, datas e dados que precisam ser verificados.
- **Borda estrutural** (`#dce7f5`): separação discreta entre grupos.
- **Base escura** (`#07152e`): fundo do tema escuro.

**The Semantic State Rule.** Verde, âmbar e vermelho só podem comunicar estado, risco ou resultado. Não são cores de enfeite.

## Typography

**Display Font:** Outfit (com fallback sans-serif)
**Body Font:** system-ui
**Label/Mono Font:** JetBrains Mono para datas, identificadores e números verificáveis.

**Character:** títulos são firmes e compactos; o corpo é direto e legível. Etiquetas são auxiliares, não devem competir com conteúdo ou ações.

### Hierarchy

- **Display** (900, 36–48px, 1.0): títulos de telas e áreas operacionais principais.
- **Headline** (900, 24–32px, 1.15): títulos de seções e agrupamentos.
- **Title** (700–900, 16–18px, 1.25): nomes de licenças e cartões.
- **Body** (400–600, 14–16px, 1.5): explicações, mensagens e contexto.
- **Label** (700–900, 10–12px, tracking moderado): rótulos de filtros, estado e metadados.

**The Verification Rule.** Datas, CNPJ e identificadores usam `JetBrains Mono` e contraste alto; dados regulatórios nunca dependem só de cor.

## Elevation

O produto é plano por padrão. Bordas sutis e camadas de superfície definem agrupamento; sombras pequenas indicam apenas interação ou sobreposição. O `glass-card` legado não deve ser usado em novos fluxos operacionais.

### Shadow Vocabulary

- **Base** (`0 1px 2px rgba(15, 23, 42, 0.06)`): cartões e painéis em repouso.
- **Interação** (`0 4px 12px rgba(15, 23, 42, 0.10)`): hover de cartões acionáveis.
- **Sobreposição** (`0 35px 60px -15px rgba(0, 0, 0, 0.3)`): somente diálogos e menus que precisam se separar do plano.

**The Flat-By-Default Rule.** Não combinar borda fina e sombra ampla como decoração. Escolha uma separação estrutural clara.

## Components

### Buttons

- **Shape:** cantos suavemente arredondados (8px).
- **Primary:** índigo de ação, texto branco, padding `12px 20px`.
- **Hover / Focus:** hover de cor, foco índigo de 2px com offset; transições entre 150–250ms.
- **Secondary:** superfície branca, borda estrutural e texto escuro.

### Chips

- **Style:** chips de estado usam fundo tonal claro e texto semântico escuro.
- **State:** filtros selecionados usam o índigo; filtros inativos usam neutros de alto contraste.

### Cards / Containers

- **Corner Style:** 12px em novos cartões; 40px é legado e não deve ser ampliado.
- **Background:** branco opaco ou `#020617` no modo escuro.
- **Shadow Strategy:** sombra mínima em repouso e elevação curta no hover.
- **Border:** `#e2e8f0` no tema claro e equivalente escuro no tema noturno.
- **Internal Padding:** 16px para cartões, 20px para painéis de filtro.

### Inputs / Fields

- **Style:** fundo frio, texto escuro e cantos de 8px.
- **Focus:** anel índigo visível de 2px; rótulo persistente acima do campo.
- **Error / Disabled:** erro usa vermelho e explicação textual; estados desabilitados mantêm legibilidade.

### Navigation

- Navegação lateral compacta, com item ativo em índigo e rótulo acessível.
- Tooltips são complemento; a ação não pode depender de hover para ser descoberta.

### Renewal Center

- Busca com resposta adiada para manter a interface fluida.
- Filtros mostram o recorte atual e mudanças de renovação anunciam o estado para tecnologias assistivas.

## Do's and Don'ts

### Do:

- **Do** usar o azul institucional `#163b78` para a ação primária e o foco ativo.
- **Do** manter ações de operação visíveis sem depender de hover.
- **Do** usar transições entre 150–250ms e desligá-las com `prefers-reduced-motion`.
- **Do** usar rótulos persistentes, contagens de resultados e texto para explicar estados.
- **Do** manter cartões novos em 12px de raio e superfícies opacas.

### Don't:

- **Don't** adicionar glassmorphism, orbes borrados ou gradientes como decoração a telas operacionais.
- **Don't** usar raios acima de 16px em novos cartões, formulários ou painéis.
- **Don't** esconder editar, imprimir, baixar ou remover exclusivamente em hover.
- **Don't** usar vermelho, âmbar ou verde fora de estados semânticos.
- **Don't** criar animações longas de entrada; a ferramenta deve abrir diretamente no trabalho.
