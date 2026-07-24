---
name: licensing-pro-institutional-logos
description: Mantém os logos institucionais transparentes associados às licenças do Licensing Pro, com correspondência segura por órgão e validação visual.
type: code
version: 1.0.0
category: product-ui
last_updated: 2026-07-20
triggers:
  - adicionar logo de órgão a uma licença
  - alterar logos institucionais do Licensing Pro
  - associar licença a Polícia Federal, CETESB, IBAMA ou outro órgão
  - exibir logo antes do nome da licença
---

# Logos institucionais do Licensing Pro

Use esta skill ao incluir, substituir ou corrigir logos de órgãos reguladores nas licenças, na tela de login ou no Centro de Renovações do Licensing Pro.

## Objetivo

Manter uma única fonte de verdade para os logos institucionais e exibi-los de forma compacta antes do nome da licença. A associação deve ser feita pelo nome ou pelo tipo da licença, sem alterar os dados já cadastrados.

## Fonte de verdade

- Catálogo e aliases: `utils/institutionLogos.ts`.
- Componente de exibição: `components/InstitutionLogo.tsx`.
- Arquivos derivados com transparência: `public/institution-logos-transparent/`.
- Originais recebidos do usuário: `logos/` ou `Logos/`. Nunca sobrescrever os originais.

## Procedimento

1. Confirme qual órgão é responsável pela licença. Não associe logos por suposição quando o tipo for genérico, por exemplo, `Alvará`.
2. Inclua o novo órgão em `institutionLogos` com nome oficial, arquivo WebP e aliases que cubram o nome usado pelo cadastro.
3. Preserve a normalização existente (acentos, maiúsculas e pontuação não podem impedir a correspondência).
4. Se o arquivo fornecido tiver fundo, gere um novo derivado transparente em `public/institution-logos-transparent/`; nunca substitua o original.
5. Use `<InstitutionLogo licenseName={license.name} licenseType={license.type} />` imediatamente antes do nome em toda lista ou cartão que apresente licenças.
6. Mantenha o logo pequeno, com `object-contain`, texto alternativo significativo e sem reduzir a legibilidade do nome.

## Regras de segurança e precisão

- Exiba logo somente quando houver uma correspondência inequívoca pelo nome ou tipo.
- Uma licença sem órgão identificável não recebe logo.
- Não associe um logo de órgão estadual, federal ou municipal a uma licença genérica.
- Não use logos em e-mails, exportações ou impressões HTML sem confirmar se o recurso suportará corretamente as URLs de imagem.

## Pontos de integração atuais

- `components/Login.tsx`: mural de órgãos atendidos.
- `components/LicenseList.tsx`: nome da licença nos cartões.
- `components/RenewalCenter.tsx`: nome da licença nas visualizações agrupada e plana.

## Validação obrigatória

Execute, a partir da raiz do projeto:

```bash
npx tsx -e "import { getInstitutionLogo } from './utils/institutionLogos.ts'; console.log(getInstitutionLogo('Licença Polícia Federal', 'Polícia Federal'));"
npm run lint
npm run build
```

Confira no preview local se o logo mantém a proporção, aparece antes do nome e não é apresentado em licença genérica. Antes de concluir, execute `git diff --check` e não inclua arquivos de terceiros, instaladores ou artefatos não relacionados no commit.
