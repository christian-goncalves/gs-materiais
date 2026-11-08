# Diagnóstico da falha de envio do formulário GS Materiais

## Objeto da investigação

Falha ao enviar o formulário local em `http://localhost:3001`, exibida como “Não foi possível enviar os dados. Tente novamente.”

## Contexto

O usuário informou que CPF, telefone e CEP agora exibem validação ao perder o foco, mas o cadastro continua sem enviar. A captura de tela mostra o formulário preenchido e a mensagem genérica de falha junto ao botão. Dados pessoais da tela não foram reproduzidos neste registro.

## Evidências examinadas

- Captura de tela enviada nesta investigação: formulário em `localhost:3001` e mensagem genérica após a tentativa de envio.
- `js/app.js:135-170`: valida os campos antes do POST; envia para `/api/submissions`; apresenta erros de campo para HTTP 400 com `errors`, mensagem específica para HTTP 429 e mensagem genérica para outros status ou exceção de rede.
- `scripts/dev-server.js:25-28`: encaminha `/api/submissions` ao handler da API.
- `api/submissions.js:103-114`: requer `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SHEETS_TAB_NAME`, `GOOGLE_SERVICE_ACCOUNT_EMAIL` e `GOOGLE_PRIVATE_KEY` para criar o armazenamento do Google Sheets; se faltar algum, lança `storage-not-configured`.
- `api/submissions.js:192-212`: lê a planilha e acrescenta a linha; qualquer falha nessa etapa é convertida em `storage_error`, HTTP 500 e mensagem genérica.
- `package.json:9` e `.env.example:1-9`: o comando `npm run dev` tenta carregar `.env.local`; o exemplo lista as variáveis exigidas.
- Estado local observado nesta investigação: `.env` e `.env.local` ausentes; as variáveis de configuração do Google Sheets estavam ausentes do ambiente desta sessão.
- Leitura GET sem gravação a `http://127.0.0.1:3001/api/submissions`: respondeu HTTP 405 `method_not_allowed`, indicando que o endpoint estava respondendo e aceita outro método para envio.
- Registro de encerramento de uma execução local anterior: `submission_request_failed`, `code: storage_error`, `status: 500`. Esse registro demonstra uma falha anterior no armazenamento, mas não identifica por si só a tentativa exibida na captura atual.

## Estado observado

O front-end chega à mensagem genérica quando recebe uma resposta diferente de 200, 201, 400 com erros de campo ou 429, ou quando `fetch` lança uma exceção. O GET ao endpoint confirmou resposta do servidor, mas não revelou o resultado de um POST. Nenhum POST foi realizado durante esta investigação.

## Análise

A captura não contém o painel de rede nem o status da resposta, portanto não distingue HTTP 500 de uma falha de rede. No código, dados rejeitados pela validação do servidor chegam como HTTP 400 com `errors` e voltariam a destacar campos; a mensagem da captura é compatível com erro de armazenamento HTTP 500 ou com falha de rede.

O armazenamento depende das quatro variáveis de credencial e destino indicadas em `api/submissions.js`. Elas estavam ausentes no ambiente desta sessão e não havia `.env.local` no checkout. Se o processo que atende a página foi iniciado sem valores equivalentes, `createGoogleSheetsStorage()` falha antes de consultar ou gravar a planilha. Mesmo com as variáveis presentes, credencial inválida, ID/aba incorretos ou permissão insuficiente também cairiam no mesmo tratamento genérico `storage_error`.

O listener da porta 3001 respondeu, mas o processo não pôde ser associado a um PID por `lsof`, `fuser` ou `ps` neste ambiente. Assim, não foi possível inspecionar as variáveis herdadas pelo processo específico que atende a captura nem correlacionar o clique atual ao registro de erro anterior.

## Hipóteses avaliadas

- **Configuração de armazenamento ausente no servidor local — sustentada, provável.** `.env.local` não existe no checkout e as variáveis não estão no ambiente desta sessão; o handler lança erro se faltarem. Um evento anterior registrou `storage_error` 500.
- **Falha de autenticação ou acesso ao Google Sheets — possível.** O código transforma erros da API Google, credencial inválida, ID/aba inválidos ou permissão insuficiente no mesmo HTTP 500, mas não há log específico da tentativa atual para distingui-los.
- **Falha de rede ou indisponibilidade do endpoint no momento do clique — possível, menos sustentada.** O front-end também mostra a mesma mensagem quando `fetch` falha. A resposta GET demonstra que o endpoint respondia durante a investigação, mas não comprova o POST do usuário.
- **Rejeição dos campos pelo servidor — enfraquecida.** O handler envia HTTP 400 com erros de campo, que o front-end exibe de forma específica, diferente da mensagem mostrada. A captura não inclui a resposta HTTP que confirmaria o caminho.

## Diagnóstico

A causa mais provável é falha na conexão do servidor local com o armazenamento Google Sheets, especialmente configuração ausente no processo que executa a API. A mensagem mostrada não aponta erro de CPF, telefone ou CEP; ela corresponde ao tratamento de erro de armazenamento ou de rede. O checkout inspecionado não possui `.env.local` e não recebeu as variáveis necessárias nesta sessão, e uma execução anterior registrou `storage_error` 500.

## Grau de certeza

**Médio.** Código, configuração local ausente e um log anterior sustentam fortemente falha no armazenamento. Não é alto porque o status/log da tentativa mostrada e o ambiente do processo atual não puderam ser obtidos.

## Pontos ainda não comprovados

- Status HTTP e corpo da resposta do POST exibido na captura.
- Variáveis efetivamente carregadas pelo processo específico que atende `localhost:3001`.
- Se, nessa execução, a falha é por configuração ausente, autenticação, permissão, ID/aba da planilha ou rede.
- Resultado de uma gravação e leitura ponta a ponta na planilha com a credencial usada pelo servidor.
