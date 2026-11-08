# Diagnóstico do aviso de validação sem campo destacado

## Objeto da investigação

Aviso “Revise os campos destacados antes de enviar” e falha no envio do cadastro local em `http://localhost:3002`, embora os campos obrigatórios estejam preenchidos e a autorização esteja marcada.

## Contexto

A captura enviada mostra o formulário local preenchido, o checkbox de autorização marcado, o resumo de validação no topo e o estado “Revise os campos informados.” abaixo do botão. Os dados pessoais visíveis na captura não são reproduzidos neste documento.

## Evidências examinadas

- Captura de tela enviada nesta investigação: formulário em `localhost:3002`, campos preenchidos e checkbox marcado; não mostra DevTools, corpo da requisição ou resposta do endpoint.
- `js/app.js:43-60`: o resumo aparece para `errors.form` ou `errors.website`; erros individuais só destacam os nomes reconhecidos em `DATA_FIELDS` e o checkbox de autorização.
- `js/app.js:145-178`: a submissão valida os campos, exige autorização, envia o valor booleano e mostra “Revise os campos informados.” quando recebe HTTP 400 com `errors`.
- `js/validation.js:7-10,96-107`: define os campos obrigatórios; a validação atual permite `autorizacao_dados_ficha_branca` e rejeita a submissão se ela não for `true`.
- `api/submissions.js:199-203`: retorna HTTP 400 com a mensagem exibida quando a validação do contrato falha.
- `scripts/dev-server.js:6`: o processo importa o handler da API uma única vez ao iniciar. Os arquivos estáticos, por outro lado, são lidos do disco a cada requisição.
- Leitura GET de `http://localhost:3002/js/app.js`: resposta HTTP 200 com a implementação atual, incluindo o envio da autorização.
- Validação local, sem requisição HTTP: os valores representados na captura foram avaliados pela validação atual do servidor; resultado `ok`, sem erros de campo ou de autorização. Os valores não foram gravados nem incluídos no relatório.
- Nenhum POST foi realizado durante esta investigação.

## Estado observado

A captura não mostra um campo vazio. O checkbox aparece marcado. O aviso de topo e a mensagem abaixo do botão são compatíveis com uma resposta HTTP 400 do endpoint, não com a validação local de campo vazio, que não define a mensagem inferior “Revise os campos informados.”.

Na implementação atual, um erro de contrato geral (`errors.form`) pode mostrar o resumo sem associar erro visual a um campo específico. O frontend também apresenta a mensagem inferior para esse retorno.

## Análise

Os valores exibidos passam pela validação local do contrato atual quando a autorização é enviada como `true`. Portanto, a evidência examinada enfraquece a hipótese de que o aviso decorra de um campo obrigatório vazio ou de autorização não marcada.

Um HTTP 400 com `errors.form` explicaria o resumo sem campo destacado. Uma incompatibilidade entre o payload enviado e a versão do handler atendendo a porta 3002 é compatível com esse comportamento: o servidor de desenvolvimento carrega o handler uma vez no início, então um processo que permaneceu aberto desde antes da inclusão do campo de autorização pode continuar executando a validação antiga enquanto serve o HTML e o JavaScript atuais.

Essa explicação é provável, mas não confirmada. A captura não identifica o corpo enviado nem o objeto `errors` retornado. Também não foi possível associar com segurança o listener da porta 3002 ao instante em que o handler foi carregado.

## Hipóteses avaliadas

- **Processo local com handler desatualizado — provável.** O servidor importa a API apenas na inicialização, enquanto serve arquivos estáticos atualizados. Isso pode produzir uma interface que envia o novo campo e um handler antigo que o rejeita como erro de contrato.
- **Outro erro geral no contrato do POST — possível.** Um campo extra, valor inesperado no honeypot ou outro valor de controle poderia gerar HTTP 400 e resumo sem marcação de um campo visível. A captura não revela o payload nem os erros da resposta.
- **Campo obrigatório vazio ou autorização desmarcada — enfraquecida.** A captura mostra os campos preenchidos e a autorização marcada; a validação local dos valores representados na captura passou.
- **Falha de armazenamento ou de rede — enfraquecida.** O texto inferior exibido é associado no frontend a HTTP 400 com erros; falhas genéricas de armazenamento ou rede seguem outro ramo de mensagem.

## Diagnóstico

O aviso não está sendo provocado por um campo obrigatório vazio nos dados visíveis. O fluxo atual chegou ao tratamento de uma resposta HTTP 400 do servidor. A causa mais provável é incompatibilidade de versão entre o frontend atualizado e o handler carregado pelo processo local de `localhost:3002`, que pode ter sido iniciado antes de o contrato de autorização ser alterado. A causa exata permanece inconclusiva sem o payload e os erros retornados pelo POST que aparece na captura.

## Grau de certeza

**Médio.** O ramo de código que produz as mensagens e a validade dos dados representados foram verificados. A hipótese de handler antigo é sustentada pelo carregamento único em inicialização, mas a resposta efetiva e a idade do processo não foram comprovadas.

## Pontos ainda não comprovados

- Status, corpo da resposta e chaves em `errors` para a tentativa mostrada.
- Payload efetivamente enviado pelo navegador naquela tentativa.
- Momento em que o processo que atende a porta 3002 carregou `api/submissions.js`.
