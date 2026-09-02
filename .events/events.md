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
