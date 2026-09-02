# Registro de eventos do projeto

Este arquivo mantém o histórico cronológico de decisões, mudanças relevantes, definições e evolução do **Encompasso Unificado**.

## Regras de uso

- Adicionar novos eventos ao final do arquivo.
- Não reescrever eventos antigos para adequá-los ao estado atual.
- Registrar apenas decisões, mudanças ou descobertas com impacto no projeto.
- Atualizar `ESPECIFICAÇÃO.md` quando um evento modificar o requisito vigente.
- Não registrar secrets, chaves, tokens, conteúdo de credenciais ou dados pessoais.
- Usar datas no formato `YYYY-MM-DD`.
- Referenciar arquivos e seções afetadas sempre que possível.

## Modelo

```markdown
## YYYY-MM-DD - Título objetivo

- Tipo: decisão | mudança | descoberta | validação | risco
- Status: proposta | aprovada | substituída | concluída
- Contexto: motivo ou condição que originou o evento.
- Definição: decisão ou descoberta registrada.
- Impacto: arquivos, contratos ou etapas afetadas.
```

## 2026-09-01 - Consolidação da base documental

- Tipo: decisão
- Status: aprovada
- Contexto: o projeto possuía requisitos distribuídos entre uma especificação conversacional, respostas complementares, uma referência visual e arquivos de credenciais.
- Definição: `ESPECIFICAÇÃO.md` passa a ser a fonte principal de verdade; `README.md` apresenta o projeto; este arquivo concentra o histórico.
- Impacto: futuras mudanças não deverão transformar a especificação principal em um histórico de versões.

## 2026-09-01 - Escopo funcional do formulário

- Tipo: decisão
- Status: aprovada
- Contexto: consolidação dos campos e das confirmações do projeto.
- Definição: o formulário terá os cards Identificação, Contato e Residência. Somente Nome social e Complemento serão opcionais.
- Impacto: contrato de interface, validação e planilha.

## 2026-09-01 - Stack sem framework frontend

- Tipo: decisão
- Status: aprovada
- Contexto: o projeto necessita de uma solução pequena, pública e compatível com a Vercel.
- Definição: frontend em HTML, CSS e JavaScript puro; backend em Node.js por Vercel Function; integração pelo cliente oficial `googleapis`.
- Impacto: arquitetura, estrutura futura e dependências.

## 2026-09-01 - Arquitetura mobile first

- Tipo: decisão
- Status: aprovada
- Contexto: a experiência principal deve atender dispositivos móveis.
- Definição: o layout partirá de uma coluna e será adaptado progressivamente a tablet e desktop.
- Impacto: interface, acessibilidade e critérios de aceitação.

## 2026-09-01 - Identidade visual consolidada

- Tipo: decisão
- Status: aprovada
- Contexto: uso do manual `image.png` e definição do símbolo provisório.
- Definição: azul `#211E70`, amarelo `#F9E423` e branco `#FEFEFE`; círculo azul com letra E branca; amarelo reservado para destaques.
- Impacto: especificação visual da implementação futura.

## 2026-09-01 - Divergência entre arquivo e aba da planilha

- Tipo: descoberta
- Status: concluída
- Contexto: `INFORMACAO.md` registrava `formulario-encomapsso` como nome exato da aba.
- Definição: a planilha tem título `formulario-encomapsso`, mas a aba existente se chama `formulario-encompasso`. A integração usará o nome real da aba.
- Impacto: variável `GOOGLE_SHEETS_TAB_NAME` e contrato de integração.

## 2026-09-01 - Esquema inicial da planilha

- Tipo: decisão
- Status: aprovada
- Contexto: a aba estava vazia e sem cabeçalhos.
- Definição: foram aprovadas 17 colunas, de `id_submissao` a `cep_codigo_postal`, na ordem documentada em `ESPECIFICAÇÃO.md`.
- Impacto: cabeçalhos, payload, normalização e operação de gravação.

## 2026-09-01 - Idempotência de submissões

- Tipo: decisão
- Status: aprovada
- Contexto: repetições após resposta de rede incerta poderiam criar linhas duplicadas.
- Definição: o navegador criará um UUID por tentativa e o backend verificará esse valor antes da inserção.
- Impacto: frontend, endpoint e consulta à planilha.

## 2026-09-01 - Conta de serviço como autenticação

- Tipo: decisão
- Status: aprovada
- Contexto: foram encontrados um cliente OAuth ligado ao n8n e duas contas de serviço distintas.
- Definição: a aplicação utilizará somente a credencial geral de conta de serviço. OAuth e credencial de n8n ficam fora da arquitetura.
- Impacto: variáveis server-side, permissões da planilha e segurança.

## 2026-09-01 - Materiais internos fora do Git

- Tipo: risco
- Status: aprovada
- Contexto: `INFORMACAO.md` contém referências internas e a pasta de credenciais contém chaves privadas reais.
- Definição: esses materiais permanecerão locais e serão excluídos do versionamento. A documentação pública utilizará apenas nomes de variáveis e placeholders.
- Impacto: preparação do repositório, `.gitignore` futuro e migração de secrets.

## 2026-09-01 - Formulário público sem consentimento adicional

- Tipo: decisão
- Status: aprovada
- Contexto: definição do acesso e dos elementos obrigatórios da interface.
- Definição: o formulário será acessível por URL, sem login, e não incluirá aviso adicional de finalidade, termo de ciência ou checkbox de consentimento.
- Impacto: interface e escopo funcional. As restrições técnicas da planilha e das credenciais continuam obrigatórias.

## 2026-09-01 - Proteção discreta contra automação

- Tipo: decisão
- Status: aprovada
- Contexto: um endpoint público de gravação precisa limitar abuso sem introduzir CAPTCHA visível.
- Definição: usar honeypot invisível e limitação de requisições na infraestrutura disponível.
- Impacto: frontend, backend, Vercel e critérios de validação.

## 2026-09-01 - Baseline seguro e worktree preparado

- Tipo: descoberta
- Status: concluída
- Contexto: a pasta `.git` existente não era um worktree utilizável e os materiais internos permaneciam locais.
- Definição: o worktree local foi inicializado na branch principal, com exclusões para secrets, credenciais, `INFORMACAO.md` e artefatos gerados; nenhum conteúdo interno foi copiado para arquivos públicos.
- Impacto: Fase 1, versionamento e validações de segurança subsequentes.

## 2026-09-01 - Frontend e contrato local validados

- Tipo: validação
- Status: concluída
- Contexto: a implementação da interface e da função server-side precisava de prova estrutural, funcional e de estados antes da integração Google.
- Definição: build, suíte de validação/contrato, Chrome headless e responsividade passaram com fixtures sintéticos; o honeypot e o armazenamento foram mantidos isoláveis nos testes locais.
- Impacto: checkpoints das Fases 2 e 3 aprovados; Fase 4 liberada.

## 2026-09-01 - Fase 4 bloqueada por ambiente Google controlado

- Tipo: risco
- Status: bloqueada
- Contexto: a conta de serviço geral lê a planilha informada e encontra a aba `formulario-encompasso`, mas a criação de uma planilha de validação foi recusada por falta de permissão; a tentativa alternativa de criação isolada foi recusada por quota de armazenamento do Drive.
- Definição: nenhuma escrita foi feita na planilha de produção. OAuth e a credencial do n8n permanecem proibidos, e o checkpoint da Fase 4 não pode ser aprovado sem uma planilha controlada separada e disponível para leitura/escrita.
- Impacto: Fases 5, 6 e Validação Final não foram iniciadas, conforme a condição de avanço do `PLANO.md`.

## 2026-09-01 - Planilha controlada liberada e idempotência comprovada

- Tipo: validação
- Status: concluída
- Contexto: uma nova planilha foi disponibilizada para substituir o ambiente de validação indisponível.
- Definição: a conta de serviço geral configurou a aba `formulario-encompasso` com 17 cabeçalhos; fixture sintético criou uma linha, a repetição do UUID retornou 200 sem nova linha, a gravação literal/UTC foi validada, o acesso anônimo não retornou os dados e o registro sintético foi reconciliado.
- Impacto: checkpoint da Fase 4 aprovado; Fase 5 liberada usando exclusivamente a planilha controlada.

## 2026-09-01 - Roteamento Vercel exige diretório explícito

- Tipo: descoberta
- Status: concluída
- Contexto: o primeiro preview executou o build, mas a configuração do projeto procurou um diretório `public` inexistente.
- Definição: `vercel.json` foi criado com somente `outputDirectory: "."`, mantendo o frontend estático na raiz e a Function em `/api`.
- Impacto: Fase 5, novo deploy de preview e validação de roteamento.

## 2026-09-01 - Preview controlado validado e proteção pública pendente

- Tipo: validação
- Status: bloqueada
- Contexto: o preview foi construído no commit validado, recebeu as seis variáveis server-side persistentes e operou com a planilha de validação; o endpoint real retornou 201/200 para o mesmo UUID, a linha sintética foi reconciliada e os smoke checks 405/415/400/429 foram observados sem CORS curinga no endpoint.
- Definição: a URL de preview continua protegida por SSO automático e redireciona acesso anônimo para login. A desativação dessa proteção foi recusada pelo controle de segurança por ampliar exposição pública; não haverá workaround nem promoção para produção enquanto esse gate permanecer sem autorização específica.
- Impacto: Fase 5 validada quanto ao código, integração controlada e contrato, mas checkpoint público bloqueado; Fases 6 e Validação Final permanecem não iniciadas.

## 2026-09-01 - Produção preparada sem dados de teste

- Tipo: validação
- Status: concluída
- Contexto: a planilha original foi confirmada como destino de produção e a branch `main` foi publicada no repositório GitHub vazio.
- Definição: as seis variáveis server-side de produção foram cadastradas, a aba `formulario-encompasso` vazia recebeu somente os 17 cabeçalhos A–Q e nenhuma submissão de teste foi escrita na produção.
- Impacto: gate de planilha, variáveis e GitHub da Fase 6 atendido; o acesso público continua condicionado à proteção SSO do projeto Vercel.

## 2026-09-01 - Produção publicada com bloqueio de privacidade da planilha

- Tipo: risco
- Status: bloqueada
- Contexto: a aplicação está publicada no alias de produção e a interface/endpoint foram verificados; a planilha correta ainda possui uma permissão `anyone` com papel de editor, confirmada por metadados do Drive, e sua exportação anônima responde com HTTP 200.
- Definição: nenhum dado de teste foi escrito na produção. O conector disponível permite leitura e concessão de acesso, mas não revogação; não será feita tentativa indireta nem recriação de credenciais. A permissão pública precisa ser removida pelo proprietário ou por um conector com operação explícita de revogação.
- Impacto: Fases 1–5 e a publicação técnica da Fase 6 estão comprovadas; a validação final e a aprovação de produção permanecem bloqueadas até a planilha ficar restrita.

## 2026-09-01 - Rechecagem da permissão pública após ajuste

- Tipo: validação
- Status: bloqueada
- Contexto: após o ajuste informado, os metadados do Drive mostram que a permissão `anyone` mudou de editor para leitor, mas continua existente; a exportação anônima ainda retorna HTTP 200 e os cabeçalhos do contrato.
- Definição: a planilha ainda não atende ao requisito de acesso restrito. É necessário remover o acesso geral, mantendo apenas o proprietário e a conta de serviço autorizada para a aplicação.
- Impacto: a validação final e a aprovação da Fase 6 continuam bloqueadas; nenhuma escrita de teste foi feita na produção.

## 2026-09-01 - Restrição da planilha de produção confirmada

- Tipo: validação
- Status: concluída
- Contexto: após a alteração feita pelo proprietário, os metadados do Drive não exibem mais permissão `anyone`; permanece somente o proprietário, e a planilha deixa de ser compartilhada publicamente.
- Definição: a exportação anônima foi revalidada e retornou HTTP 401, sem os cabeçalhos do contrato. Nenhuma escrita de teste foi feita na produção.
- Impacto: o gate de privacidade da Fase 6 foi aprovado e a validação final pode ser encerrada.
