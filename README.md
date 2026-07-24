# App Licensing Pro

Sistema web para controle de licenças, alvarás, vencimentos, renovações, impressão e download de documentos.

## Executar Localmente

1. Instale as dependências:

```bash
npm install
```

2. Configure as variáveis locais em `.env.local` quando necessário:

```bash
GEMINI_API_KEY=sua_chave_gemini
ADMIN_DEFAULT_PASSWORD=senha_inicial_segura
```

3. Inicie o servidor:

```bash
npm run dev
```

4. Acesse:

```text
http://127.0.0.1:3000/
```

## Scripts

```bash
npm run lint
npm run build
npm run preview
```

## Segurança E Operação

- A chave Gemini deve ficar somente no servidor. O frontend chama `/api/ai/license-audit`.
- O endpoint `/api/health` valida a disponibilidade do app e do SQLite.
- O acesso `clientes@arbtechinfo.net` é dedicado para visualização, impressão e download.
- Em produção, defina `ADMIN_DEFAULT_PASSWORD` antes da primeira inicialização se ainda não existir usuário admin.
- Antes de publicar, rode `npm audit --omit=dev`, `npm run lint` e `npm run build`.

## Produção

O app já possui script de deploy em `deploy.sh`. Revise as variáveis de ambiente, faça backup do banco em `data/database.db` e valide `/api/health` depois de atualizar.
