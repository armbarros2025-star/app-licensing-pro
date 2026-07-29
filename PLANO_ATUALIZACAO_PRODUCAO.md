# Plano de atualização segura — Licensing Pro

Status: pronto para execução assistida, sem publicação automática.

## Objetivo

Atualizar a aplicação em produção preservando todos os registros de empresas, licenças, documentos, usuários, configurações e histórico de auditoria já existentes.

## Escopo da próxima publicação

- Interface revisada: login, dashboard, empresas, licenças, renovações, usuários e relatórios.
- Sem alteração intencional de dados cadastrais.
- Sem migração manual de banco prevista: o servidor mantém migrações aditivas na inicialização.

## Premissas confirmadas no código

- Produção utiliza SQLite em `data/database.db`.
- SQLite opera em modo WAL; o estado consistente inclui `database.db`, `database.db-wal` e `database.db-shm` quando presentes.
- O `deploy.sh` já exclui `data/`, `.env` e `.env.production` da sincronização, evitando sobrescrever dados e segredos.
- A saúde do serviço pode ser verificada em `/api/health`.

## Sequência obrigatória

### 1. Preparação local

1. Registrar a revisão exata que será publicada (commit Git e data/hora).
2. Executar `npm run lint` e `npm run build`.
3. Executar `npm audit --omit=dev --audit-level=high` e tratar qualquer achado bloqueante antes da publicação.
4. Conferir que `data/`, `.env`, arquivos de anexos e dados locais não entram no envio.
5. Separar uma janela de monitoramento de pelo menos 15 minutos após a ativação.

Critério de saída: build aprovado e lista de arquivos do envio revisada.

### 2. Verificação do alvo de produção

1. Confirmar a pasta ativa do Licensing Pro na VPS e o processo que o executa no PM2.
2. Confirmar espaço em disco e acesso de leitura/escrita ao diretório `data/`.
3. Confirmar as variáveis de produção sem exibir segredos: `NODE_ENV`, origem CORS, configuração de IA quando aplicável e senha inicial apenas se ainda não houver administrador.
4. Chamar `GET /api/health` antes da alteração e registrar a resposta.

Critério de saída: serviço saudável e caminho de rollback conhecido.

### 3. Backup consistente dos dados

1. Criar uma pasta de backup datada fora da pasta de release, com permissões restritas.
2. Gerar backup consistente do SQLite. Preferir o comando nativo `.backup` do SQLite; se ele não estiver disponível, pausar brevemente o processo, copiar `database.db`, `database.db-wal` e `database.db-shm` quando existirem, e reiniciar antes de seguir.
3. Copiar também os anexos persistidos fora do banco, caso o ambiente os mantenha em diretório próprio.
4. Calcular hash e tamanho do backup; validar que ele pode ser aberto por SQLite e que contém as tabelas `users`, `companies`, `licenses`, `settings`, `sessions` e `audit_logs`.
5. Registrar local, horário, hash e responsável pelo backup.

Critério de saída: backup testado e restaurável antes de qualquer sincronização.

### 4. Publicação reversível

1. Sincronizar somente código, build e ativos do projeto; manter as exclusões de `data/`, `.env`, `.env.production`, `.git` e dependências locais.
2. Instalar dependências de produção no destino.
3. Reiniciar somente o processo `licensing-pro` no PM2.
4. Manter a revisão anterior disponível ou registrar o commit anterior antes da reinicialização.
5. Não executar comandos de limpeza de banco, recriação de `data/` ou exclusão de anexos.

Critério de saída: processo ativo e endpoint de saúde respondendo com sucesso.

### 5. Verificação pós-publicação

1. Confirmar `GET /api/health` e checar logs do PM2 por erros novos.
2. Validar os fluxos críticos sem alterar registros reais:
   - login administrativo;
   - carregamento de empresas e licenças existentes;
   - lista de renovações;
   - abertura de documento e relatório de licenças;
   - acesso de clientes para imprimir/baixar, quando habilitado.
3. Confirmar que a contagem de empresas, licenças e usuários no banco é igual à anotada antes da publicação.
4. Monitorar por 15 minutos; revisar novamente após 1 hora.

## Gatilhos de rollback

Fazer rollback imediato se ocorrer qualquer uma destas condições:

- `/api/health` falhar após reinicialização;
- erro de banco, perda de login ou ausência de registros existentes;
- erro crítico recorrente nos logs;
- falha em abrir, imprimir ou baixar documentos existentes.

### Procedimento de rollback

1. Parar a tentativa de correção incremental.
2. Retornar o código à revisão anterior.
3. Reiniciar o processo pelo PM2.
4. Restaurar o banco somente se houver evidência de alteração/corrupção dos dados; usar o backup validado e incluir os arquivos WAL/SHM correspondentes quando aplicável.
5. Revalidar `/api/health`, login e contagens de registros antes de encerrar o incidente.

## Registro de execução

Preencher no dia da atualização:

| Item | Registro |
|---|---|
| Data e horário | |
| Commit publicado | |
| Revisão anterior | |
| Local do backup | |
| Hash do backup | |
| Resultado do health check | |
| Contagem pré/pós: empresas | |
| Contagem pré/pós: licenças | |
| Contagem pré/pós: usuários | |
| Responsável | |
| Observações / rollback | |
