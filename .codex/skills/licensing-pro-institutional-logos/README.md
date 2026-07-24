# Skill: logos institucionais do Licensing Pro

Esta skill preserva o padrão visual que conecta cada licença ao logo do órgão responsável. Ela deve ser usada quando um novo órgão for adicionado, quando os arquivos de logo forem trocados ou quando uma tela nova passar a listar licenças.

## Uso

Peça uma alteração como:

- “Adicione o logo da Anatel às licenças.”
- “Inclua o logo antes do nome no relatório de renovações.”
- “Troque o logo da CETESB por uma versão transparente.”

O catálogo em `utils/institutionLogos.ts` contém o nome oficial, o arquivo e as variações que o sistema reconhece. O componente `InstitutionLogo` consulta esse catálogo para que lista de licenças, renovações e telas futuras tenham o mesmo resultado.

## Manutenção

Os originais fornecidos pelo usuário ficam preservados. A aplicação utiliza cópias WebP transparentes em `public/institution-logos-transparent/`, por melhor desempenho e integração visual. Para um novo órgão, cadastre aliases suficientes para abranger os nomes usados no campo de tipo e no nome da licença.

Não associe logos a tipos genéricos. Por exemplo, `Alvará` só recebe uma identificação visual se o cadastro também informar o órgão emissor.

## Verificação

Depois de alterar o catálogo ou os componentes, execute `npm run lint`, `npm run build` e confira o preview local. A revisão deve confirmar tanto a correspondência correta quanto a ausência de logos em registros ambíguos.
