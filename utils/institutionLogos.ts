export interface InstitutionLogo {
  name: string;
  file: string;
  aliases: string[];
}

export const institutionLogos: InstitutionLogo[] = [
  { name: 'Polícia Federal', file: 'policia-federal.webp', aliases: ['policia federal', 'pf'] },
  { name: 'Polícia Civil de São Paulo', file: 'policia-civil-sp.webp', aliases: ['policia civil', 'pc sp'] },
  { name: 'CETESB', file: 'cetesb.webp', aliases: ['cetesb'] },
  { name: 'IBAMA', file: 'ibama.webp', aliases: ['ibama'] },
  { name: 'Exército Brasileiro', file: 'exercito-brasileiro.webp', aliases: ['exercito', 'exercito brasileiro'] },
  { name: 'Vigilância Sanitária de São Paulo', file: 'vigilancia-sanitaria-sp.webp', aliases: ['vigilancia sanitaria', 'visa sp'] },
  { name: 'Anatel', file: 'anatel.webp', aliases: ['anatel'] },
  { name: 'Ministério do Turismo', file: 'ministerio-turismo.webp', aliases: ['ministerio do turismo'] },
  { name: 'Corpo de Bombeiros de São Paulo', file: 'bombeiros-sp.webp', aliases: ['corpo de bombeiros', 'bombeiros sp', 'bombeiro sp', 'bombeiro'] },
  { name: 'Prefeitura de São José do Rio Preto', file: 'prefeitura-sjrp.webp', aliases: ['sao jose do rio preto', 'prefeitura sjrp', 'prefeitura'] },
  { name: 'Registro.br', file: 'registro-br.webp', aliases: ['registro br', 'registrobr'] },
  { name: 'Secretaria de Infraestrutura e Meio Ambiente — DAE', file: 'secretaria-meio-ambiente-dae.webp', aliases: ['secretaria de infraestrutura', 'meio ambiente', 'dae'] }
];

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const getInstitutionLogo = (...values: Array<string | undefined>) => {
  const searchableText = values
    .filter((value): value is string => Boolean(value))
    .map(normalize)
    .join(' ');

  return institutionLogos.find((logo) => logo.aliases.some((alias) => searchableText.includes(normalize(alias))));
};
