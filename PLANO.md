# Plano Executivo de Implementação — Encompasso Unificado

## 1. Propósito, autoridade e regra de execução

Este plano transforma a `ESPECIFICAÇÃO.md` vigente em uma sequência executável de implementação, validação, versionamento e publicação. A autoridade funcional e técnica permanece sendo, nesta ordem, `ESPECIFICAÇÃO.md`, `README.md` e `.events/events.md`. Este plano não altera requisitos, não introduz framework frontend, banco de dados ou serviço externo adicional e não substitui os critérios da especificação.

O ponto de partida documentado é um projeto ainda sem aplicação implementada, dependências instaladas, configuração Vercel ou ambiente local preparado. Já existem materiais internos que não podem entrar no Git: `INFORMACAO.md` e a pasta local `google-api_drive-sheets-gmail-docs (Cópia)/`. `image.png` é a referência visual oficial. O diretório `.git` existente deverá ser validado antes do primeiro versionamento, pois não constitui, por si só, prova de um worktree utilizável.

A execução futura deverá seguir as fases na ordem. Em cada fase:

1. executar as tarefas;
2. executar as verificações e testes previstos;
3. comparar os resultados com os critérios objetivos;
4. guardar as evidências identificadas;
5. registrar em `.events/events.md` somente decisões, descobertas, riscos, validações ou checkpoints relevantes;
6. aprovar ou reprovar o checkpoint.

Uma fase reprovada não libera a seguinte. Em caso de falha, diagnosticar a causa, corrigir somente dentro da especificação, reexecutar os testes afetados e reavaliar o mesmo checkpoint. Se uma dependência externa não estiver acessível, não inventar credenciais, não usar a planilha de produção como substituta de um ambiente de teste e não declarar conclusão.

Todos os testes que escreverem na planilha deverão usar primeiro uma planilha de validação controlada, com a mesma aba `formulario-encompasso` e os mesmos cabeçalhos. A planilha de produção deve permanecer sem dados de teste durante desenvolvimento. Uma escrita de smoke test em produção somente poderá ocorrer quando fizer parte do procedimento de liberação autorizado no ambiente de execução; nesse caso, deve usar um `id_submissao` sintético, único e rastreável, sem misturá-lo às validações de desenvolvimento.

## 2. Fases de implementação

### Fase 1 — Preparação segura do ambiente e do primeiro versionamento

**Objetivo da fase**

Estabelecer um baseline executável e versionável sem expor credenciais, materiais internos ou dados pessoais, além de confirmar as condições externas necessárias para as fases seguintes.

**Estado esperado ao final da fase**

O repositório terá uma estrutura de controle de versão utilizável, regras de exclusão verificadas, um `.env.example` sem valores reais e uma lista operacional de pré-condições confirmadas ou explicitamente bloqueadas. Nenhum segredo será adicionado ao índice, ao histórico ou aos artefatos públicos.

**Dependências e pré-condições**

- `ESPECIFICAÇÃO.md`, `README.md` e `.events/events.md` permanecem inalterados.
- O executor possui acesso ao diretório do projeto, ao Node.js/npm e ao Git.
- Os acessos Google, GitHub e Vercel serão usados somente quando a fase correspondente exigir a escrita externa.
- A credencial geral de conta de serviço é a única credencial Google prevista para a aplicação; OAuth e credencial do n8n permanecem fora do escopo.

**Tarefas concretas a executar**

- Confirmar o estado real do diretório, dos arquivos existentes e do worktree, preservando qualquer mudança que não pertença à execução.
- Verificar se `.git` é um repositório utilizável. Se não for, preparar o repositório somente depois de definir e validar as exclusões; não remover documentos ou credenciais para resolver um problema de Git.
- Criar `.gitignore` com, no mínimo, `.env` real, arquivos `.env.*` exceto `.env.example`, `.vercel`, `node_modules`, artefatos de teste/coverage/logs, `INFORMACAO.md` e `google-api_drive-sheets-gmail-docs (Cópia)/`.
- Criar `.env.example` contendo somente os seis nomes definidos na especificação: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SHEETS_TAB_NAME`, `RATE_LIMIT_MAX_REQUESTS` e `RATE_LIMIT_WINDOW_SECONDS`. Usar placeholders; definir o nome seguro da aba como `formulario-encompasso` e indicar os valores iniciais de rate limiting de 5 requisições por 60 segundos sem incluir qualquer segredo.
- Não copiar, renomear, abrir para publicação ou inserir no projeto nenhum JSON de credencial real. Não inserir URL de planilha, e-mail, chave, token ou conteúdo de `INFORMACAO.md` em documentação pública, código ou exemplos.
- Confirmar que `image.png` continua sendo a referência visual original e que seu eventual uso futuro não arrasta materiais internos para o bundle.
- Executar uma varredura de arquivos, índice e histórico por chaves privadas, tokens, e-mails de credenciais, IDs reais e dados pessoais. Caso algo já esteja versionado, interromper o avanço, remover apenas do índice quando seguro, avaliar rotação da credencial exposta e registrar o risco; não apagar o arquivo local automaticamente.
- Criar o primeiro commit somente com os arquivos documentais e de configuração seguros, após a varredura. O push para GitHub ficará para a fase de publicação.
- Registrar em `.events/events.md` apenas o baseline, descobertas do estado do Git, riscos de exposição e checkpoint concluído; não registrar cada comando.

**Arquivos que deverão ser criados ou modificados**

- Criar: `.gitignore`, `.env.example` e, se necessário, metadados locais do Git.
- Versionar somente arquivos seguros já existentes e os novos arquivos de configuração aprovados.
- Não modificar: `ESPECIFICAÇÃO.md`, `README.md`, `INFORMACAO.md`, os JSONs de credenciais e a referência visual, salvo uma necessidade documentada e dentro do escopo.
- Modificar ao longo da fase: `.events/events.md`, somente para evento relevante.

**Requisitos da `ESPECIFICAÇÃO.md` atendidos naquela fase**

- Seções 1, 2, 3.2, 13.1, 13.2, 16 e 17: autoridade documental, separação de materiais internos, variáveis server-side e preparação segura do Git.
- Seção 4: preservação da referência visual.
- Seção 19: preparação dos checkpoints operacionais sem tratá-los como lacunas de requisito.

**Verificações e testes que deverão ser executados**

- Verificação do worktree com `git status`, `git rev-parse` e listagem dos arquivos rastreados.
- Verificação de exclusões com `git check-ignore` para `INFORMACAO.md`, a pasta de credenciais, `.env` real e `.vercel`.
- Verificação de conteúdo do `.env.example`: exatamente os seis nomes server-side, nenhum valor real e `GOOGLE_SHEETS_TAB_NAME=formulario-encompasso`.
- Varredura determinística dos arquivos rastreáveis e do índice por padrões de chave privada, JSON de credencial, token e material interno.
- Verificação do primeiro commit com `git show --stat` e inspeção dos nomes/arquivos efetivamente incluídos.

**Critérios objetivos de aprovação**

- `git rev-parse --is-inside-work-tree` retorna `true` no repositório correto.
- A pasta de credenciais e `INFORMACAO.md` não aparecem no índice nem no primeiro commit.
- Nenhum arquivo rastreado contém chave privada, segredo, payload ou dado pessoal.
- `.env.example` contém somente placeholders e os seis nomes definidos.
- A documentação de fonte de verdade e a especificação permanecem sem alteração.

**Evidências que deverão demonstrar que os critérios foram realmente atendidos**

- Saída registrada de `git status`, `git ls-files`, `git show --stat` e `git check-ignore` sem conteúdo secreto.
- Relatório da varredura com caminhos/nomes seguros e resultado sem ocorrências; nunca anexar o conteúdo das credenciais.
- Diff da fase mostrando somente as exclusões/configuração previstas e eventual evento relevante.

**Checkpoint de conclusão da fase**

`APROVADO` somente quando o primeiro baseline versionável estiver limpo, as exclusões estiverem demonstradas e nenhum segredo ou material interno estiver no índice/histórico. Caso contrário, `REPROVADO`.

**Condição explícita para permitir avanço à fase seguinte**

Somente avançar quando todos os critérios acima forem comprovados e o baseline puder ser reproduzido sem depender da leitura pública de qualquer credencial ou material interno.

**Procedimento em caso de falha**

Identificar o arquivo ou regra responsável, corrigir o `.gitignore` ou o índice sem apagar o material local, repetir a varredura e revisar o commit. Se houver segredo no histórico, interromper o fluxo de publicação, registrar o risco e exigir a rotação/revogação adequada antes de prosseguir.

### Fase 2 — Frontend estático, formulário e experiência mobile first

**Objetivo da fase**

Construir a interface HTML5/CSS3/JavaScript puro com os três cards, todos os campos na ordem definida, validação imediata, acessibilidade, máscaras de apresentação e estados de interação, ainda sem considerar a validação do frontend como autoridade de gravação.

**Estado esperado ao final da fase**

Uma página estática navegável por teclado e toque exibirá Identificação, Contato e Residência em uma coluna no mobile, com adaptação para telas maiores. Todos os erros serão associados aos campos, o formulário manterá os dados durante falhas simuladas e nenhum dado será enviado para uma credencial ou serviço Google no navegador.

**Dependências e pré-condições**

- Checkpoint da Fase 1 aprovado.
- Cores e símbolo provisório devem seguir a seção 4; não criar uma identidade alternativa.
- A ordem dos campos deve seguir as seções 6.1, 6.2 e 6.3.

**Tarefas concretas a executar**

- Criar `index.html`, `css/styles.css`, `js/app.js` e, se necessário para servir a referência, `assets/image.png` a partir da referência visual existente, preservando o original.
- Estruturar três cards independentes, nesta ordem: Identificação, Contato e Residência. Não criar etapas, páginas intermediárias, login, checkbox de consentimento ou aviso adicional fora da especificação.
- Renderizar os campos na ordem: `nome_completo`, `nome_social`, `data_nascimento`, `nacionalidade`, `tipo_documento`, `documento`, `telefone`, `email`, `pais`, `estado_provincia`, `municipio_cidade`, `logradouro_numero`, `complemento`, `bairro_distrito` e `cep_codigo_postal`. Manter `website` somente como honeypot técnico, fora da ordem normal de foco e fora da planilha.
- Marcar como opcionais exclusivamente Nome social e Complemento; os demais campos terão indicação visível de obrigatoriedade e validação correspondente.
- Aplicar rótulo visível, `name`, `id`, `autocomplete`, `inputmode`, tipo de entrada e associação semântica de erro/resumo a cada campo conforme o dado. Usar `type=date`, `type=email`, `type=tel` e seletor explícito quando aplicável.
- Implementar a troca explícita de Documento entre CPF e Passaporte: rótulo, orientação, máscara e regras devem mudar pela escolha, sem inferir o tipo pela nacionalidade.
- Implementar máscaras apenas para apresentação de CPF e telefone. A máscara nunca deverá ser o valor persistido.
- Implementar validação imediata e no envio para presença, limites, data não futura, CPF, passaporte, telefone, e-mail e textos normalizáveis. O frontend deverá usar as mesmas regras funcionais do backend, sem substituir a validação server-side.
- Para passaporte, respeitar letras/números, 5–30 caracteres depois do trim e a mensagem exata “Você digitou um número insuficiente de caracteres.” para quatro caracteres ou menos.
- Criar o UUID apenas quando uma tentativa de submissão começar, manter o mesmo UUID em novas tentativas após erro e descartá-lo somente após sucesso confirmado.
- Implementar os estados inicial, validação, envio, sucesso e falha recuperável. Durante o envio, desabilitar o botão e impedir múltiplos cliques; após sucesso, exibir exatamente “Dados enviados com sucesso.” e limpar os campos; após falha, manter campos e UUID e reabilitar a tentativa.
- Exibir erros junto aos controles, resumo geral quando houver múltiplos erros e foco no primeiro erro. Não comunicar sucesso/erro somente por cor.
- Usar o azul `#211E70`, o amarelo `#F9E423` e o branco `#FEFEFE` de forma compatível com contraste; reservar o amarelo para destaques/estados que mantenham contraste.
- Implementar o honeypot visualmente discreto, não focável na ordem normal e sem apresentá-lo como campo ao respondente.
- Registrar em `.events/events.md` somente decisões visuais/funcionais relevantes, descobertas de validação ou o checkpoint.

**Arquivos que deverão ser criados ou modificados**

- Criar: `index.html`, `css/styles.css`, `js/app.js` e, se necessário, `assets/image.png`.
- Modificar: `.events/events.md` apenas para eventos relevantes.
- Não criar nesta fase backend, integração Google ou variável pública contendo secret.

**Requisitos da `ESPECIFICAÇÃO.md` atendidos naquela fase**

- Seções 2, 3.1, 4, 5, 6, 9.1, 11 (etapas de navegador), 12, 14 e 15.
- Seção 10.1 apenas quanto à preparação do payload; a autoridade HTTP será validada na Fase 3.

**Verificações e testes que deverão ser executados**

- Inspeção estrutural do DOM para confirmar três cards, ordem dos campos, um rótulo visível por campo e ausência de elementos fora do escopo.
- Testes de validação no navegador para obrigatoriedade, campos opcionais vazios, limites de todos os textos, data futura, CPF válido/inválido, passaporte de 4/5/30/31 caracteres, telefone fixo/celular com DDD, telefone com `+55`, e-mail e CEP com símbolos internos preservados.
- Testes de máscara e valor enviado: CPF deve sair com 11 dígitos; telefone deve sair em E.164; passaporte deve permanecer sem máscara.
- Testes de normalização visual/antes do envio: trim nos textos, e-mail minúsculo, CEP sem espaços nas extremidades e opcionais vazios preservados como vazio.
- Teste de foco, teclado, `aria-invalid`, `aria-describedby`, resumo de erros e foco no primeiro inválido.
- Teste de envio simulado com resposta de erro: campos e UUID permanecem; novo clique reutiliza o UUID.
- Teste de sucesso simulado: mensagem exata aparece, campos são limpos, UUID é descartado e o botão deixa de permanecer bloqueado.
- Teste de múltiplos cliques: apenas uma tentativa é iniciada enquanto a requisição está pendente.
- Teste em viewport mobile representativo e em tablet/desktop: uma coluna no mobile, sem `scrollWidth` horizontal, sem sobreposição e com áreas de toque utilizáveis.
- Auditoria de bundle/arquivos estáticos para confirmar ausência de nomes, valores ou importações de credenciais Google.

**Critérios objetivos de aprovação**

- Os 15 campos visíveis estão nos três cards e na ordem especificada; somente dois são opcionais.
- Todas as mensagens e estados exigidos são observáveis no DOM e associados semanticamente aos campos.
- As regras de CPF, passaporte, telefone, e-mail, data e normalização produzem os valores previstos sem apagar dados em erro.
- O layout passa nos viewports mobile, tablet e desktop sem rolagem horizontal ou sobreposição.
- O frontend não contém credenciais, não autentica no Google e não depende de validação externa de endereço/documento.

**Evidências que deverão demonstrar que os critérios foram realmente atendidos**

- Relatório de teste estrutural e capturas/trace do navegador nos viewports definidos.
- Resultados dos fixtures sintéticos de cada regra de validação, incluindo casos limite e mensagens observadas.
- Evidência do fluxo de erro/sucesso com campos e UUID antes/depois, sem registrar dados pessoais reais.
- Resultado da busca de secrets nos arquivos públicos e no bundle gerado.

**Checkpoint de conclusão da fase**

`APROVADO` somente quando a página estática passar nos testes estruturais, de validação, estados, acessibilidade básica e responsividade, com todos os critérios demonstrados por evidência. Nenhum teste poderá usar a planilha de produção.

**Condição explícita para permitir avanço à fase seguinte**

O frontend deve estar apto a produzir um payload conforme o contrato, mas a fase só avança quando também estiver comprovado que seus erros não dependem de cor, que falhas preservam dados e que nenhum secret chega ao navegador.

**Procedimento em caso de falha**

Reproduzir o caso com fixture sintético, localizar a divergência no HTML/CSS/JavaScript, corrigir dentro das regras documentadas e reexecutar o teste específico mais a regressão estrutural, mobile e de secrets. Não alterar a especificação para acomodar o comportamento incorreto.

### Fase 3 — Backend server-side e contrato HTTP autoritativo

**Objetivo da fase**

Implementar a Vercel Function Node.js e a camada de validação autoritativa do endpoint `POST /api/submissions`, incluindo normalização, honeypot, rate limiting, respostas estáveis e tratamento seguro de falhas, sem ainda depender de uma gravação na planilha de produção.

**Estado esperado ao final da fase**

O endpoint local poderá receber requisições e rejeitar de forma determinística métodos, Content-Types, payloads inválidos, honeypot preenchido e excesso de requisições. Payloads válidos serão normalizados para uma estrutura de 17 colunas, e falhas internas produzirão somente resposta genérica. A integração de armazenamento será isolável para testes controlados.

**Dependências e pré-condições**

- Checkpoints das Fases 1 e 2 aprovados.
- Node.js/npm disponíveis.
- O cliente oficial `googleapis` será a dependência de integração; não adicionar framework frontend, banco ou serviço externo.
- A implementação deverá manter o caminho de produção server-side separado de doubles usados apenas em testes.

**Tarefas concretas a executar**

- Criar `package.json` com scripts determinísticos de execução, teste e build/checagem necessários, usando Node.js e `googleapis`.
- Criar `api/submissions.js` como função server-side para o mesmo domínio, sem habilitar CORS público curinga.
- Fazer a ordem de processamento respeitar: método, Content-Type e limite de tamanho; rate limiting; parsing seguro; validação do honeypot; validação de campos/UUID; normalização; consulta de idempotência; geração UTC; gravação.
- Aceitar somente `POST` no endpoint. Retornar 405 para outros métodos sem processar o corpo nem acessar o Google.
- Aceitar somente `application/json` e rejeitar os demais Content-Types com 415 antes da integração.
- Validar presença, tipo, limites e formato de cada campo do contrato, sem confiar no frontend. Rejeitar UUID inválido, campo obrigatório vazio, tipo de documento fora de `cpf`/`passaporte`, CPF inválido, passaporte fora de 5–30 ou com caracteres não alfanuméricos, telefone fora das formas previstas, e-mail inválido, data inválida/futura e textos acima dos limites.
- Manter os valores textuais após trim, preservar acentos/conteúdo e não aplicar consultas externas de CEP, endereço, cidade, estado, país ou passaporte.
- Normalizar CPF para 11 dígitos, passaporte sem espaços nas extremidades, telefone para E.164 com `+55`, e-mail para minúsculas sem espaços nas extremidades, data para `YYYY-MM-DD`, CEP sem espaços nas extremidades e opcionais vazios como texto vazio.
- Tratar `website` como honeypot obrigatório vazio; quando preenchido, rejeitar a submissão sem gravar e sem revelar regra interna além de um erro estável apropriado.
- Aplicar limitação configurável por origem/IP usando somente o mecanismo disponível na infraestrutura Vercel. Usar 5 requisições por 60 segundos como valores iniciais, configurados por ambiente. Se o mecanismo disponível não fornecer o comportamento necessário, interromper a aprovação em vez de adicionar um serviço não previsto.
- Definir respostas JSON sem dados sensíveis, com código estável e erros por campo para 400. Mapear 405, 415, 429 e 500 sem stack trace, mensagem bruta Google, nome de planilha, range, e-mail de conta de serviço ou secret.
- Manter a interface de armazenamento substituível em testes, sem transformar o double em banco ou caminho de produção. A resposta 201 será usada para registro criado e 200 para UUID já processado; os acessos reais ao Sheets serão concluídos na Fase 4.
- Garantir que logs contenham apenas evento técnico, status e código seguro; nunca payload completo, CPF, passaporte, telefone, endereço, e-mail, credencial ou secret.
- Registrar em `.events/events.md` somente decisões de contrato, descobertas de execução, riscos de rate limiting e checkpoint.

**Arquivos que deverão ser criados ou modificados**

- Criar: `package.json`, `api/submissions.js` e arquivos de teste/checagem que não contenham dados reais.
- Modificar: `.events/events.md` apenas para eventos relevantes.
- `vercel.json` não será criado nesta fase; só será incluído se uma verificação posterior demonstrar que a configuração padrão da Vercel não atende ao roteamento.

**Requisitos da `ESPECIFICAÇÃO.md` atendidos naquela fase**

- Seções 7, 9.2, 10, 11 (etapas server-side), 12 e 13.4.
- Seções 2 e 3.1 quanto à função server-side e validação autoritativa.

**Verificações e testes que deverão ser executados**

- Testes de contrato para `GET`/métodos não permitidos → 405, Content-Type ausente ou inválido → 415 e payloads inválidos → 400.
- Testes de todos os campos obrigatórios/opcionais, limites, UUID, `tipo_documento`, CPF, passaporte, telefone, e-mail, data, CEP e normalização.
- Testes do honeypot vazio e preenchido, confirmando que o segundo caso não alcança a camada de gravação.
- Teste de limite de tamanho antes de qualquer chamada ao Google.
- Teste de rate limiting com 5 requisições permitidas na janela configurada e a seguinte rejeitada com 429; repetir em ambiente que represente a infraestrutura Vercel e confirmar a chave por origem/IP sem registrar o endereço em log.
- Testes de mapeamento de erro interno do armazenamento para 500 com mensagem genérica e logs sanitizados.
- Testes de resposta 201 para criação simulada e 200 para UUID já processado, deixando a verificação de linha real para a Fase 4.
- Teste de que método inválido, Content-Type inválido, honeypot e payload rejeitado não disparam operação de armazenamento.
- Varredura do código, testes, artefatos e logs capturados por secrets e dados pessoais.

**Critérios objetivos de aprovação**

- O endpoint responde exatamente nos estados aplicáveis 400, 405, 415, 429 e 500 com contrato estável e sem detalhes internos.
- O mesmo conjunto de regras funcional está implementado no backend e cobre todos os campos; o backend rejeita um payload que o frontend não tenha validado.
- O honeypot, o limite de tamanho e o rate limiting bloqueiam a operação antes do Google.
- A normalização produz a representação dos 17 campos de dados sem `website`.
- Logs e respostas não contêm dados pessoais, credenciais, ranges, nomes de planilha ou stack trace.

**Evidências que deverão demonstrar que os critérios foram realmente atendidos**

- Relatório automatizado dos testes de contrato com método, Content-Type, entrada sintética, status e código, sem payload pessoal.
- Fixtures e asserções dos valores normalizados e da ordem lógica de saída.
- Contador do double de armazenamento comprovando zero chamadas para requisições bloqueadas.
- Saída sanitizada do teste de 500 e varredura sem secrets/dados pessoais.

**Checkpoint de conclusão da fase**

`APROVADO` somente quando o endpoint local passar no contrato negativo e positivo simulado, no rate limiting disponível, na sanitização e na validação autoritativa. Não avançar se qualquer caminho inválido alcançar a camada de armazenamento.

**Condição explícita para permitir avanço à fase seguinte**

Todos os estados HTTP previstos deverão estar testados no contexto correspondente, e o formato normalizado deverá estar pronto para ser comparado, sem ambiguidade, às 17 colunas da aba Google Sheets.

**Procedimento em caso de falha**

Reproduzir com a requisição mínima que falha, identificar se a causa é parsing, ordem de validação, normalização, resposta ou isolamento do armazenamento, corrigir dentro do contrato e reexecutar o teste específico mais toda a suíte de contrato. Se o rate limiting Vercel não estiver disponível, registrar bloqueio operacional e não substituir por serviço externo.

### Fase 4 — Google Sheets controlado, credenciais e idempotência real

**Objetivo da fase**

Conectar a função server-side ao Google Sheets por `googleapis`, preparar uma planilha de validação segura e provar autenticação, cabeçalhos, gravação literal, ordem de colunas, normalização persistida e idempotência sem tocar na planilha de produção durante o desenvolvimento.

**Estado esperado ao final da fase**

Uma submissão sintética válida em ambiente controlado cria exatamente uma linha nas 17 colunas. A repetição do mesmo `id_submissao` retorna 200 sem criar outra linha. A conta de serviço usada é a geral definida pela especificação, possui somente o acesso necessário à planilha de teste e nenhum segredo aparece no cliente, Git, resposta ou log.

**Dependências e pré-condições**

- Checkpoint da Fase 3 aprovado.
- Projeto Google identificável e acesso administrativo para habilitar a Google Sheets API.
- Planilha de validação separada da planilha de produção, ou um ambiente controlado explicitamente reservado para testes.
- Conta de serviço geral disponível; OAuth e credencial do n8n não podem ser usados.
- A aba real de gravação deve chamar-se exatamente `formulario-encompasso`, apesar da divergência histórica registrada nos eventos/documentos.

**Tarefas concretas a executar**

- Habilitar a Google Sheets API no projeto Google escolhido e registrar o resultado do checkpoint.
- Conceder à conta de serviço geral somente a permissão de edição necessária na planilha de validação; confirmar que a autenticação utilizada não é OAuth nem a credencial do n8n.
- Remover o acesso público da planilha de validação e confirmar que somente proprietário, conta de serviço e administradores necessários conseguem acessá-la.
- Criar/verificar a aba `formulario-encompasso` e a primeira linha com, exatamente nesta ordem, os 17 cabeçalhos:

  `id_submissao`, `data_hora_envio`, `nome_completo`, `nome_social`, `data_nascimento`, `nacionalidade`, `tipo_documento`, `documento`, `telefone`, `email`, `pais`, `estado_provincia`, `municipio_cidade`, `logradouro_numero`, `complemento`, `bairro_distrito`, `cep_codigo_postal`.

- Configurar localmente somente variáveis server-side, em arquivo ignorado e com permissão restrita. Validar `GOOGLE_PRIVATE_KEY` tanto no formato local quanto no formato de variável Vercel, convertendo sequências escapadas `\\n` em quebras de linha reais somente em memória.
- Construir a autenticação `GoogleAuth` com o cliente oficial `googleapis` e escopo mínimo de Sheets necessário à leitura e gravação. Nunca importar o JSON de credencial no frontend, no bundle, na documentação ou na Vercel como arquivo.
- Implementar a consulta de `id_submissao` antes do append. Se o ID existir, retornar 200 sem nova linha; se não existir, gerar `data_hora_envio` no backend em ISO 8601 UTC e inserir uma única linha.
- Enviar os valores com opção de entrada literal/raw, para que conteúdo informado que se pareça com fórmula não seja interpretado como fórmula. `website` não poderá ocupar coluna nem linha.
- Usar exclusivamente a aba e a ordem aprovadas; não renomear, apagar, sobrescrever ou migrar a aba histórica/legada fora do escopo.
- Criar fixtures sintéticos, inclusive opcionais vazios, acentos, formatos de CEP internacionais e um valor textual que permita demonstrar a gravação literal sem usar dado pessoal.
- Registrar em `.events/events.md` habilitação da API, permissão, restrição, cabeçalhos, tratamento da chave, descobertas de integração e checkpoint; não registrar valores de variáveis ou conteúdo da planilha.

**Arquivos que deverão ser criados ou modificados**

- Modificar: `api/submissions.js` e arquivos de teste/integração para usar a camada Sheets.
- Criar/modificar somente configurações seguras já previstas, como `.env.example`; o `.env` real permanecerá local e ignorado.
- Modificar: `.events/events.md` apenas com eventos sem secrets/dados pessoais.
- Não versionar planilhas exportadas, JSONs de credenciais, dumps ou registros de teste.

**Requisitos da `ESPECIFICAÇÃO.md` atendidos naquela fase**

- Seções 7, 8, 9.2, 10.2 (200/201), 11 e 13.1–13.3.
- Seção 19: habilitação da API, acesso da conta de serviço, cabeçalhos, restrição pública, variáveis e tratamento de `GOOGLE_PRIVATE_KEY`.

**Verificações e testes que deverão ser executados**

- Teste de autenticação real da conta de serviço na planilha de validação; confirmar que a API habilitada e a permissão de edição são suficientes.
- Leitura da primeira linha e comparação exata, posicional e sensível a nomes dos 17 cabeçalhos.
- Submissão sintética válida → 201, com leitura posterior da linha e confirmação dos 17 valores na ordem A–Q.
- Repetição do payload com o mesmo `id_submissao` → 200, mesma identificação e nenhuma linha adicional.
- Verificação de `data_hora_envio` gerada pelo backend, válida como ISO 8601 UTC, sem aceitar timestamp fornecido pelo cliente.
- Verificação de normalização persistida: CPF somente dígitos, telefone E.164, e-mail minúsculo, data `YYYY-MM-DD`, trim dos textos/CEP e opcionais vazios como células vazias/texto vazio sem deslocar colunas.
- Verificação de gravação literal com fixture sintético que contenha caracteres potencialmente interpretáveis; confirmar que não há fórmula criada.
- Verificação de que uma falha de autenticação ou API produz 500 genérico, não cria linha parcial e não revela detalhes.
- Teste de acesso público: usuário não autorizado não lê a planilha; a função autenticada continua conseguindo operar.
- Teste de bundle e de Git após a integração: nenhuma variável secreta, chave, JSON ou valor real chega ao navegador ou ao índice.

**Critérios objetivos de aprovação**

- A API Google está habilitada e a conta de serviço geral consegue ler/escrever somente no ambiente controlado necessário.
- A aba e as 17 colunas correspondem exatamente à especificação.
- Uma submissão válida cria uma única linha; a repetição do mesmo UUID não cria duplicidade.
- O valor armazenado é literal, a data/hora é server-side UTC e nenhum campo muda de coluna.
- A planilha não é pública e os erros de integração são genéricos e não deixam dados parciais.

**Evidências que deverão demonstrar que os critérios foram realmente atendidos**

- Resultado da verificação de API/permissão/restrição, sem expor e-mail de credencial ou identificadores sensíveis.
- Leitura controlada da linha de cabeçalho e da linha sintética, representada apenas pelos nomes das colunas, status e valores não pessoais.
- Contagem de linhas antes/depois do primeiro e segundo envio, demonstrando 1 linha nova e depois 0 linhas novas.
- Evidência de leitura como fórmula ausente e de resposta genérica no cenário de erro.

**Checkpoint de conclusão da fase**

`APROVADO` somente quando a autenticação, a estrutura da aba, a gravação literal, a ordem das 17 colunas e a idempotência real forem comprovadas em planilha não produtiva, com a planilha restrita.

**Condição explícita para permitir avanço à fase seguinte**

O fluxo server-side deve operar contra o ambiente de validação com todos os secrets somente no servidor e sem qualquer teste pendente que dependa da planilha de produção.

**Procedimento em caso de falha**

Parar novas escritas, identificar se a causa é API, permissão, aba, cabeçalho, chave, range, normalização ou concorrência, corrigir no ambiente de teste, limpar/reconciliar somente dados sintéticos identificados e repetir a validação. Nunca contornar uma falha escrevendo na produção ou imprimindo a credencial nos logs.

### Fase 5 — Integração ponta a ponta, segurança, qualidade e preview Vercel

**Objetivo da fase**

Conectar o frontend ao endpoint, validar o fluxo real no mesmo domínio e publicar um preview Vercel ligado somente ao ambiente de Sheets controlado, cobrindo segurança, rate limiting, acessibilidade, responsividade e comportamento de erro.

**Estado esperado ao final da fase**

O usuário consegue preencher os três cards, receber validação no navegador, enviar JSON, obter resposta server-side e ver sucesso/falha conforme o contrato. O preview funciona sem CORS curinga, sem secrets no navegador e sem escrita na planilha de produção.

**Dependências e pré-condições**

- Checkpoints das Fases 1–4 aprovados.
- Projeto Vercel e ambiente de preview disponíveis.
- Mecanismo de rate limiting compatível com os valores configuráveis 5/60 confirmado na infraestrutura disponível; não adicionar serviço externo.
- Variáveis de preview apontando para a planilha de validação, nunca para a de produção.

**Tarefas concretas a executar**

- Ligar o formulário a `POST /api/submissions` no mesmo domínio, usando `Content-Type: application/json` e tratamento explícito de 200, 201, 400, 405, 415, 429 e 500.
- Confirmar que o frontend bloqueia múltiplos cliques, mantém o UUID e os valores em falha, limpa somente após sucesso confirmado e mostra as mensagens especificadas.
- Usar a camada server-side real para validar novamente todos os dados; não remover validação do backend por a interface já validar.
- Configurar no Vercel apenas as Environment Variables server-side definidas: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SHEETS_TAB_NAME`, `RATE_LIMIT_MAX_REQUESTS` e `RATE_LIMIT_WINDOW_SECONDS`.
- Validar especificamente a conversão de `\\n` da `GOOGLE_PRIVATE_KEY` no ambiente Vercel, sem registrar seu conteúdo.
- Criar `vercel.json` somente se a execução demonstrar que o padrão não roteia corretamente o frontend e `/api`; se criado, mantê-lo mínimo e sem secrets.
- Fazer deploy de preview com a planilha de validação. Não promover para produção nesta fase.
- Executar a suíte integrada no preview com fixtures sintéticos e, quando houver escrita, limpar/reconciliar somente o registro sintético identificado na planilha de validação.
- Auditar HTML, JavaScript servido, source maps, respostas, headers e rede para confirmar que não há credenciais, identificadores de serviço, ranges, stack traces, payloads ou CORS curinga expostos.
- Testar keyboard-only, foco visível, leitores/árvore semântica quando disponíveis, associação de erros, mensagens não dependentes de cor, contraste e áreas de toque.
- Testar mobile first em viewport estreita, orientação relevante e tablet/desktop; confirmar ausência de rolagem horizontal e sobreposição durante inicial, validação, envio, sucesso e erro.
- Registrar em `.events/events.md` somente preview, riscos, resultados de integração e checkpoint.

**Arquivos que deverão ser criados ou modificados**

- Modificar: `js/app.js`, `css/styles.css`, `api/submissions.js` e scripts/testes de integração.
- Criar `vercel.json` somente se comprovadamente necessário.
- Configurar variáveis no projeto Vercel; não gravar valores reais no repositório.
- Modificar: `.events/events.md` somente para eventos relevantes.

**Requisitos da `ESPECIFICAÇÃO.md` atendidos naquela fase**

- Seções 5, 9, 10, 11, 12, 13.2, 13.4, 14 e 15 integralmente no fluxo real.
- Seções 2, 3.1 e 18 quanto ao produto integrado e ao ambiente de validação antes da produção.

**Verificações e testes que deverão ser executados**

- Fluxo E2E completo com um fixture válido: os três cards são preenchidos, a resposta é 201, uma linha é confirmada na planilha de validação, a mensagem exata aparece e o formulário é limpo.
- Repetição do envio com o mesmo UUID: resposta 200, sem segunda linha e com estado final de sucesso.
- Fluxo de validação: cada erro fica junto ao campo, resumo aparece para múltiplos erros e foco vai ao primeiro inválido.
- Fluxo de falha de rede/servidor: mensagem genérica, dados e UUID preservados, botão reabilitado e nova tentativa possível.
- Testes HTTP no preview para 405, 415, 400, 429 e 500, incluindo comprovação de que respostas não revelam detalhes internos.
- Teste do honeypot preenchido, confirmação de bloqueio e ausência de linha criada.
- Teste de rate limiting real no preview, com contagem controlada e sem registrar IP/identidade pessoal nos logs.
- Teste de credenciais: busca nos arquivos públicos, bundle, source map, responses e logs; confirmar ausência de `GOOGLE_PRIVATE_KEY`, JSON de serviço, e-mail de conta de serviço e valores reais.
- Teste de logs: somente eventos/códigos/status seguros; não aparecem CPF, passaporte, telefone, e-mail, endereço ou payload completo.
- Auditoria mobile/accessibility/contraste nos estados inicial, inválido, envio, sucesso e falha.
- Build/execução local e deploy de preview concluídos sem erro; página e endpoint acessíveis pelo domínio de preview.

**Critérios objetivos de aprovação**

- O fluxo real navegador → Vercel Function → Sheets de validação completa sem intervenção manual no meio e sem segunda linha para o mesmo UUID.
- Todos os estados HTTP aplicáveis são observáveis com o contrato seguro definido.
- O preview usa somente variáveis server-side e a planilha de teste; não há secret em código, bundle, Git, resposta ou log.
- A página permanece utilizável por teclado e toque, sem rolagem horizontal/sobreposição nos viewports testados.
- Falhas não destroem os dados e sucesso limpa o formulário somente após confirmação.

**Evidências que deverão demonstrar que os critérios foram realmente atendidos**

- URL/commit do preview, resultado de build e trace/capturas E2E sem dados pessoais.
- Tabela de requests com status 200/201/400/405/415/429/500, código seguro e efeito esperado na planilha.
- Contagem de linhas na planilha de validação antes/depois dos testes de criação e repetição.
- Relatório de busca de secrets no bundle/Git/logs e resultado da auditoria de acessibilidade/responsividade.

**Checkpoint de conclusão da fase**

`APROVADO` somente quando o preview reproduzir o fluxo ponta a ponta e todas as evidências de segurança, erros, idempotência, mobile e acessibilidade estiverem disponíveis. O preview não poderá apontar para a planilha de produção.

**Condição explícita para permitir avanço à fase seguinte**

Não existir falha crítica aberta de contrato, integração, segurança, exposição de secret, persistência, duplicidade, preservação de dados, mobile ou acessibilidade; o preview controlado deverá estar reproduzível pelo commit identificado.

**Procedimento em caso de falha**

Classificar a falha por camada, corrigir primeiro no ambiente local/teste, reexecutar testes unitários/contratuais e depois o E2E afetado. Se uma mudança alterar requisito, parar e registrar a divergência em eventos sem editar a especificação por preferência técnica.

### Fase 6 — Versionamento definitivo, migração segura e publicação

**Objetivo da fase**

Preparar o repositório definitivo, promover somente artefatos validados, configurar produção com segurança e disponibilizar o domínio Vercel após todos os gates de integração e proteção.

**Estado esperado ao final da fase**

O GitHub terá o repositório `formulario-encompasso` com branch principal contendo apenas o produto e documentação versionáveis. A Vercel terá frontend e `/api` no mesmo projeto, variáveis server-side configuradas e domínio acessível. A planilha de produção estará restrita e o acesso da conta de serviço será o mínimo necessário.

**Dependências e pré-condições**

- Checkpoints das Fases 1–5 aprovados.
- Repositório GitHub definitivo e projeto Vercel identificados.
- Planilha de produção confirmada com a aba exata `formulario-encompasso` e cabeçalhos A–Q; nenhuma migração ou renomeação de aba legada será feita.
- A gravação de produção deve seguir o procedimento de liberação autorizado; testes de desenvolvimento continuam proibidos na produção.

**Tarefas concretas a executar**

- Revisar o diff completo e o índice para excluir `INFORMACAO.md`, a pasta de credenciais, `.env` real, `.vercel`, dumps, logs, fixtures pessoais e qualquer secret.
- Confirmar que a branch principal representa somente a versão aprovada e que mudanças relevantes de requisito, se existirem, estão refletidas simultaneamente na especificação e em `.events/events.md`; não fazer mudanças de requisito nesta fase.
- Configurar o repositório remoto GitHub definido e publicar o histórico seguro somente após nova varredura.
- Habilitar/confirmar a Google Sheets API no projeto de produção, conceder à conta de serviço geral o acesso de edição necessário, restringir o compartilhamento público e verificar que OAuth/n8n continuam fora da aplicação.
- Criar/verificar os 17 cabeçalhos na aba de produção somente como preparação operacional, confirmando a ordem sem inserir dados de teste. Se a aba já contiver dados, parar e reconciliar antes de qualquer mudança.
- Configurar no Vercel as seis variáveis exclusivamente no escopo server-side de produção, com `GOOGLE_SHEETS_TAB_NAME=formulario-encompasso`, valores de rate limit 5/60 ou os valores aprovados no ambiente, e tratamento correto da chave privada com quebras de linha.
- Fazer deploy de produção somente após a configuração e a verificação das variáveis. Confirmar que frontend e Function pertencem ao mesmo projeto e ao mesmo domínio.
- Executar smoke checks não destrutivos no domínio publicado: carregamento da página, recursos estáticos, rota inválida, método não permitido, Content-Type inválido e resposta segura de erro.
- Se o procedimento de liberação incluir submissão real, usar somente um fixture sintético com UUID único e registrar/reconciliar o resultado de forma controlada; não usar dados pessoais nem executar limpeza destrutiva não autorizada.
- Somente depois de a migração para Environment Variables ser validada no preview e/ou produção, remover com segurança os arquivos locais de credenciais reais. Antes da remoção, confirmar que nenhum teste ou operação restante depende deles e registrar a remoção sem mencionar conteúdo.
- Registrar em `.events/events.md` publicação, permissões, migração validada, remoção segura e checkpoint. Não registrar URL privada de acesso, secrets ou dados de submissões.

**Arquivos que deverão ser criados ou modificados**

- Modificar somente o conjunto de arquivos já implementado e validado; `vercel.json` apenas se o preview tiver provado sua necessidade.
- Modificar: `.events/events.md` com eventos relevantes.
- Configurar externamente: GitHub, Vercel e planilha; não copiar configuração secreta para arquivos locais versionáveis.

**Requisitos da `ESPECIFICAÇÃO.md` atendidos naquela fase**

- Seções 8.1–8.3, 13.1–13.4, 17 e 18.
- Seção 19: todos os checkpoints operacionais restantes, incluindo restrição pública, rate limiting Vercel, variáveis, chave privada e remoção pós-validação.

**Verificações e testes que deverão ser executados**

- `git status`, diff, índice, histórico e varredura de secrets antes e depois do push.
- Verificação do repositório GitHub: branch principal, arquivos publicados e ausência dos materiais internos/credenciais.
- Verificação Vercel: deploy associado ao commit aprovado, domínio acessível, Function ativa e Environment Variables não expostas ao cliente.
- Verificação da planilha de produção: aba correta, 17 cabeçalhos na ordem e acesso público removido; não usar linha de teste para concluir a preparação.
- Smoke checks publicados para carregamento, 405, 415 e erro seguro; validar headers e ausência de CORS curinga.
- Se autorizado o smoke write, confirmar exatamente uma linha sintética e idempotência do mesmo UUID; caso contrário, preservar a produção e usar a evidência equivalente do preview/teste controlado.
- Confirmar que os arquivos locais de credenciais só foram removidos depois que as variáveis Vercel foram validadas e que o worktree continua sem cópias/artefatos derivados.

**Critérios objetivos de aprovação**

- GitHub e Vercel apontam para o mesmo produto validado, sem material interno ou secret.
- O domínio publicado carrega a aplicação e expõe o endpoint somente no contrato previsto.
- A planilha de produção está restrita, com cabeçalhos A–Q exatos e acesso mínimo da conta de serviço.
- As variáveis server-side funcionam, inclusive `GOOGLE_PRIVATE_KEY`, sem aparecer no bundle.
- A remoção local de credenciais ocorreu somente após migração e validação comprovadas.

**Evidências que deverão demonstrar que os critérios foram realmente atendidos**

- Hash/commit publicado, resultado do push, URL pública do deploy e resultado dos smoke checks.
- Relatórios sanitizados de Git/bundle/headers/logs, sem valores sensíveis.
- Evidência de permissão/restrição da planilha e de cabeçalho, sem expor identificadores privados.
- Registro de evento informando migração validada e remoção segura dos arquivos locais.

**Checkpoint de conclusão da fase**

`APROVADO` somente quando produção estiver acessível, segura e alinhada ao commit validado, os gates Google/Vercel/GitHub estiverem comprovados e nenhum segredo ou material interno puder ser encontrado no repositório, bundle, respostas ou logs.

**Condição explícita para permitir avanço à Validação Final**

O produto publicado deve passar nos smoke checks e não pode haver pendência crítica de segurança, integração, versionamento, planilha, domínio, rate limiting ou configuração server-side. Uma escrita real em produção não é pré-condição se o fluxo completo já tiver sido comprovado em ambiente controlado e a produção tiver sido preservada.

**Procedimento em caso de falha**

Não promover novamente nem apagar dados automaticamente. Isolar se a falha é de GitHub, Vercel, ambiente, permissão Sheets, cabeçalho, chave, rota ou domínio; corrigir no ambiente apropriado, redeployar apenas após repetir as verificações do preview e reavaliar o checkpoint. Se houver exposição de secret, interromper publicação, revogar/rotacionar a credencial e fazer nova varredura.

## 3. Validação Final

A Validação Final é uma etapa transversal e independente do checkpoint da Fase 6. Ela compara o produto completo com toda a `ESPECIFICAÇÃO.md` e só permite declarar o projeto concluído quando os requisitos e os critérios de aceitação da seção 18 estiverem demonstrados por evidência.

**Objetivo da etapa**

Confirmar requisito por requisito que o produto publicado, seu código, sua integração, sua operação e seu histórico de versionamento correspondem ao estado especificado, sem requisito esquecido ou gate operacional não comprovado.

**Estado esperado ao final da etapa**

Existe um relatório de validação rastreável, com cada requisito associado a uma fase, teste e evidência. O fluxo completo foi executado em ambiente seguro, o ambiente publicado foi verificado quando aplicável e a decisão final é `CONCLUÍDO` ou `NÃO CONCLUÍDO` com falhas objetivamente listadas.

**Dependências e pré-condições**

- Checkpoints das seis fases aprovados.
- Produto publicado e commit de release identificados.
- Planilha de validação e planilha de produção distinguíveis.
- Nenhuma evidência poderá conter credenciais, dados pessoais ou payloads completos.

**Tarefas concretas a executar**

- Revisar a especificação seção por seção, incluindo escopo incluído e fora do escopo, identidade visual, responsividade, todos os campos, normalização, 17 colunas, idempotência, arquitetura, contrato HTTP, fluxo, mensagens, segurança, estados, acessibilidade, arquivos, GitHub/Vercel, critérios de aceitação e checkpoints da seção 19.
- Reexecutar o fluxo completo navegador → endpoint → Sheets controlado: preenchimento, validação, UUID, honeypot vazio, rate limit dentro do limite, normalização, consulta, gravação, resposta 201, confirmação de uma linha, mensagem de sucesso e limpeza.
- Repetir o mesmo UUID e confirmar resposta 200 e ausência de duplicidade.
- Executar matriz de falhas: campos inválidos/400, método/405, Content-Type/415, excesso/429 e falha controlada/500; confirmar preservação dos dados nos erros recuperáveis e mensagens sem detalhes.
- Revalidar segurança: nenhum secret em HTML/JS/CSS/bundle/source map/Git/headers/respostas/logs; logs sem CPF, passaporte, telefone, e-mail, endereço ou payload; planilha restrita; conta de serviço com acesso mínimo; OAuth/n8n fora do produto.
- Revalidar mobile first, teclado, foco, associação semântica de erros, contraste, input mode/autocomplete, área de toque, ausência de rolagem horizontal e ausência de sobreposição nos estados da interface.
- Revalidar o ambiente publicado: domínio, recursos, `/api/submissions`, mesmo domínio, ausência de CORS curinga, Environment Variables server-side e rate limiting compatível.
- Comparar o commit publicado com o commit validado e confirmar que o GitHub não contém materiais internos, credenciais, `.env` real ou artefatos de teste.
- Conferir explicitamente cada item da seção 18 e anexar a evidência objetiva correspondente.
- Registrar em `.events/events.md` somente a conclusão, riscos residuais e decisão final; não registrar dados de submissões.

**Arquivos que deverão ser criados ou modificados**

- Criar apenas os relatórios/artefatos de evidência previstos pelo processo de validação, sem incluir dados pessoais ou secrets.
- Modificar `.events/events.md` somente com o evento final relevante.
- Não alterar `ESPECIFICAÇÃO.md` para fazer o produto passar.

**Requisitos da `ESPECIFICAÇÃO.md` atendidos naquela etapa**

- Seções 1–19 integralmente, com foco transversal nos critérios da seção 18 e nos checkpoints de execução da seção 19.

**Verificações e testes que deverão ser executados**

- Revisão requisito por requisito com rastreabilidade preenchida.
- Suíte unitária/estática e de contrato da Fase 3 reexecutada.
- Integração real da Fase 4 reexecutada em planilha controlada.
- E2E do preview ou publicação reexecutado conforme o ambiente seguro disponível.
- Auditorias de Git, bundle, logs, headers, planilha/permissões e variáveis server-side reexecutadas.
- Testes mobile/accessibility e comportamento dos sete estados HTTP aplicáveis reexecutados.

**Critérios objetivos de aprovação**

- Cada linha da matriz de rastreabilidade possui fase, teste e evidência.
- Todos os itens da seção 18 são marcados como atendidos com prova, não por inspeção subjetiva.
- O fluxo completo cria exatamente uma linha no ambiente controlado e o retry do mesmo UUID não duplica.
- Nenhum requisito de segurança, integração, erro, preservação/limpeza, mobile, acessibilidade, Git ou deploy está sem evidência.
- Não existem riscos críticos abertos nem credenciais locais remanescentes após a migração validada.

**Evidências que deverão demonstrar que os critérios foram realmente atendidos**

- Matriz de rastreabilidade preenchida e relatórios de teste vinculados por nome/commit/data.
- Resultado do E2E, tabela de status HTTP, verificação de uma linha/zero duplicidade e auditorias sanitizadas.
- URL/commit publicado e confirmação dos gates externos sem exposição de identificadores sensíveis.
- Evento final em `.events/events.md` com a decisão `concluída` ou, se houver falha, a decisão `não concluída` e a causa objetiva.

**Checkpoint de conclusão da etapa**

`CONCLUÍDO` somente se todos os critérios estiverem comprovados. Qualquer requisito sem teste/evidência, qualquer secret exposto, qualquer duplicidade, qualquer falha de preservação/limpeza, qualquer planilha pública ou qualquer gate externo não confirmado reprova a Validação Final.

**Condição explícita para declarar o projeto concluído**

A declaração de conclusão exige a matriz completa, a seção 18 integralmente atendida, fluxo E2E comprovado e ausência de bloqueios críticos. Se reprovada, a execução retorna à fase responsável; após a correção, reexecuta-se a Validação Final inteira ou o conjunto transversal impactado, sem apagar a evidência anterior.

**Procedimento em caso de falha**

Classificar a falha pela fase/requisito na matriz, preservar as evidências, corrigir dentro do escopo da especificação, executar a regressão da fase e repetir as verificações transversais afetadas. Se a falha exigir novo requisito ou mudança arquitetural, registrar como bloqueio e não alterar a especificação unilateralmente.

## 4. Matriz de rastreabilidade

| Requisito ou grupo da especificação | Onde será implementado/preparado | Teste ou evidência responsável |
|---|---|---|
| §§ 1–3 — autoridade, objetivo, escopo incluído e fora do escopo | Fase 1; estrutura das Fases 2–6 | Revisão final de escopo; inspeção de ausência de login, framework frontend, banco, busca externa, upload, CAPTCHA visível, painel e consentimento adicional |
| § 4 — cores, símbolo provisório e referência visual | Fase 2 | Inspeção visual de `image.png`, contraste e capturas dos estados da interface |
| § 5 — mobile first, três cards, ordem e fluxo único | Fase 2; integração na Fase 5 | Testes de viewport/scroll/overlap, teclado e E2E completo |
| § 6 — campos, obrigatoriedade e limites | Fase 2 e validação autoritativa na Fase 3 | DOM estrutural, fixtures de cada campo, casos limite e respostas 400 |
| § 6.1 — CPF e passaporte | Fases 2–3 | Máscara/valor persistido, dígitos verificadores, limites 5–30 e mensagem exata para ≤4 |
| § 6.2 — telefone e e-mail | Fases 2–3 | Fixtures nacionais/+55, máscara/E.164, trim/minúsculas e rejeições de formato |
| § 6.3 — residência e ausência de consultas externas | Fases 2–3 | Teste de preenchimento manual, bundle/rede sem serviço externo e persistência dos textos |
| § 7 — normalização e opcionais vazios | Fases 3–4 | Asserções do payload normalizado e leitura da linha A–Q na planilha controlada |
| § 8 — aba, 17 cabeçalhos, gravação literal e idempotência | Fase 4; produção na Fase 6 | Comparação posicional A–Q, fórmula ausente, contagem antes/depois e retry do mesmo UUID |
| § 9 — HTML/CSS/JS puro, Function Node.js e `googleapis` | Fases 2–4 | Inspeção de dependências/arquitetura, build/execução e integração real |
| § 10 — endpoint, método, Content-Type, CORS e respostas | Fases 3 e 5 | Matriz HTTP 200/201/400/405/415/429/500 e inspeção de headers/respostas |
| § 11 — fluxo de submissão e retry | Fases 2–5 | Trace E2E, UUID preservado, linha criada, retry sem duplicidade e limpeza após sucesso |
| § 12 — mensagens, resumo, foco e falhas genéricas | Fases 2–3 e 5 | Testes DOM/teclado, respostas sanitizadas e fluxo de rede/servidor |
| § 13.1–13.3 — credencial geral, variáveis, API, permissões e chave | Fases 1, 4–6 | Varredura Git/bundle/logs, teste Google, Environment Variables, quebra de linha e restrição da planilha |
| § 13.4 — honeypot, rate limit, tamanho, literalidade e logs | Fases 3–5 | Teste de honeypot, 5/60 e 429, payload grande, fórmula literal e auditoria de logs |
| § 14 — estados inicial, validação, envio, sucesso e falha | Fases 2 e 5 | Testes de estado no navegador com screenshots/trace e asserções de preservação/limpeza |
| § 15 — acessibilidade | Fases 2 e 5 | Auditoria semântica, teclado, foco, mensagens, contraste, autocomplete/inputmode e toque |
| § 16 — organização dos arquivos e materiais locais | Fases 1–3 | `git ls-files`, estrutura do projeto, ignore e revisão final de escopo |
| § 17 — GitHub, branch principal, Vercel e ambientes | Fases 1, 5 e 6 | Histórico/push, commit do deploy, domínio, variables server-side e smoke checks |
| § 18 — critérios de aceitação | Validação Final | Checklist requisito por requisito com teste/evidência vinculados |
| § 19 — gates operacionais | Fases 1, 4–6 | Registro de API, conta, cabeçalhos, restrição, rate limiting, variables, chave e remoção segura |

## 5. Estratégia de testes e evidências

Os níveis serão progressivos e complementares:

- **Estático/estrutural:** arquivos esperados, ordem dos campos, DOM semântico, dependências aprovadas, configuração, Git e busca de secrets.
- **Local unitário/funcional:** normalização, validadores, UUID, CPF, passaporte, telefone, e-mail, data, mensagens e máquina de estados.
- **Contrato HTTP:** métodos, Content-Type, tamanho, honeypot, rate limit, códigos estáveis e sanitização de respostas/logs.
- **Integração Google Sheets:** API habilitada, conta de serviço, aba, 17 cabeçalhos, valores literais, UTC, ordem e idempotência real.
- **Ponta a ponta:** navegador, Function e planilha de validação em um único fluxo, incluindo erro recuperável, retry, sucesso e limpeza.
- **Publicado:** preview/produção, domínio, headers, bundle, Environment Variables, rate limiting e smoke checks não destrutivos.

Teste unitário isolado não substitui integração quando o requisito depender de navegador, Function, Vercel ou Sheets. Toda evidência deverá ser sanitizada: usar fixtures sintéticos, não registrar payload completo, não expor dados pessoais e não anexar credenciais.

## 6. Revisão crítica do plano

- **Cobertura documental:** as seções 1–19 da especificação aparecem na matriz e nas fases responsáveis; a seção 18 tem uma validação transversal própria.
- **Dependências:** preparação segura precede código; frontend e contrato precedem integração Sheets; Sheets controlado precede preview; preview validado precede GitHub/produção; a Validação Final ocorre somente depois da publicação.
- **Checkpoints:** cada fase possui estado esperado, critérios objetivos, evidências, condição de avanço e caminho de correção/revalidação.
- **Segurança:** credenciais e materiais internos são excluídos antes do primeiro commit; a chave privada só é migrada para variáveis server-side; a remoção local ocorre somente depois da validação da migração.
- **Planilha de produção:** os testes de escrita usam ambiente controlado; a preparação produtiva verifica cabeçalhos/permissões sem dados de teste, salvo smoke write sintético dentro do procedimento autorizado de liberação.
- **Escopo técnico:** o plano mantém HTML5, CSS3, JavaScript puro, Node.js, Vercel Function, `googleapis`, Google Sheets, GitHub e Vercel. `vercel.json` é condicional apenas ao roteamento comprovadamente necessário.
- **Autonomia futura:** não há decisão arquitetural relevante pendente. A disponibilidade do mecanismo de rate limiting, os acessos Google/GitHub/Vercel e a migração de variáveis são gates operacionais verificáveis; se falharem, a execução corrige ou bloqueia sem inventar alternativa fora da especificação.
- **Conclusão:** o projeto só será declarado concluído com matriz preenchida, evidências objetivas, fluxo E2E, critérios da seção 18 e todos os gates de segurança/integridade aprovados.
