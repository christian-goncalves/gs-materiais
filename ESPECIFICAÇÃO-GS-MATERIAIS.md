# Especificação do formulário GS Materiais

**Esta especificação define o comportamento alvo do formulário simplificado e preserva os contratos reutilizáveis da aplicação existente.**

| | |
|---|---|
| **Status** | Aprovada para implementação local |
| **Público** | Pessoa responsável por implementar e revisar a aplicação |
| **Escopo** | Interface, validação, consulta de CEP e gravação das submissões |
| **Relacionado** | [Especificação original do Encompasso](ESPECIFICAÇÃO.md), [registro de eventos](.events/events.md) |

## 1. Objetivo

O formulário GS Materiais coleta nome completo, CPF, telefone e endereço em um único card. A aplicação valida os dados no navegador e no servidor e grava cada envio válido no Google Sheets por uma Vercel Function.

A experiência mantém a arquitetura, as proteções e o fluxo de gravação da aplicação existente. O formulário usa apenas os campos definidos nesta especificação.

## 2. Requisitos reaproveitados

O repositório já contém HTML, CSS, JavaScript no navegador e uma função server-side em `api/submissions.js`. O formulário atual organiza dados em três cards, e a especificação original define validação no servidor, autenticação Google, idempotência, honeypot, limite de requisições e tratamento de falhas. O comportamento atual e seus arquivos de referência estão em [`index.html`](index.html), [`js/app.js`](js/app.js), [`js/validation.js`](js/validation.js) e [`api/submissions.js`](api/submissions.js).

| Área | Regra que permanece | Ajuste para GS Materiais |
|---|---|---|
| Interface | HTML, CSS e JavaScript sem framework; layout mobile first; rótulos visíveis e erros acessíveis | Um card com menos campos e a identidade visual aprovada |
| Validação | Validação imediata no navegador e validação autoritativa no servidor | Aplicar regras apenas a nome completo, CPF, telefone, CEP e endereço |
| Persistência | Vercel Function, Google Sheets API, conta de serviço server-side e valores literais | Escrever o novo esquema de 13 colunas definido na seção 8 |
| Reenvio | UUID por submissão e verificação de idempotência | Manter o mesmo UUID em uma nova tentativa após falha |
| Proteção | Honeypot, limite de requisições no envio e logs sem dados pessoais | Manter essas proteções no envio e consultar CEP somente sob demanda |
| Falhas | Mensagem genérica, preservação dos dados e nova tentativa | Usar modal somente após confirmação de sucesso |

As regras antigas sobre nome social, nascimento, nacionalidade, tipo de documento, passaporte, e-mail, país e residência internacional não se aplicam ao formulário GS Materiais.

## 3. Escopo

### 3.1 Incluído

- Formulário público com o título **GS Materiais**.
- Instrução **“Preencha seus dados nos campos abaixo.”**
- Um card com o título **“Dados pessoais”**.
- Campos obrigatórios de nome completo, CPF, telefone, CEP e endereço.
- Consulta de CEP e preenchimento dos campos de endereço retornados pelo serviço.
- Checkbox obrigatório de autorização para o tratamento dos dados com finalidade restrita à Ficha Branca, registrado no Sheets.
- Edição manual dos campos de endereço preenchidos automaticamente.
- Confirmação de sucesso em modal, seguida da limpeza do formulário quando o modal for fechado.
- Gravação server-side em uma planilha Google Sheets configurada por variáveis de ambiente.

### 3.2 Fora do escopo

- Cards separados ou etapas de formulário.
- Nome social, data de nascimento, nacionalidade, passaporte, e-mail e país.
- Login, painel administrativo, edição ou exclusão de registros.
- Upload ou CAPTCHA visível.
- Consulta em massa de CEPs ou preenchimento de dados que o serviço de CEP não retorna.
- Criação da nova planilha Google Sheets nesta refatoração.
- Publicação ou alteração de domínio da aplicação.

## 4. Identidade visual e layout

O fundo principal usa o verde escuro da imagem de referência fornecida pelo usuário. O checkout não contém um valor hexadecimal aprovado para esse verde, portanto a implementação deve reproduzir visualmente a referência, sem declarar um código de cor como oficial.

O amarelo permanece somente em detalhes discretos. A interface não usa blocos amarelos grandes, a marca “Encompasso” nem o símbolo “E”. O card conserva fundo claro, controles, tipografia, espaçamento e comportamento responsivo existentes sempre que forem compatíveis com o formulário único.

O cabeçalho usa **GS Materiais** como título principal. O texto auxiliar permanece exatamente como definido na seção 3.1. O card mostra somente o título maior **“Dados pessoais”**, sem um kicker redundante.

No celular, o formulário usa uma coluna, ocupa a largura disponível e não causa rolagem horizontal. Em telas maiores, a grade pode usar mais de uma coluna sem alterar a ordem de leitura ou a ordem do teclado.

## 5. Campos e ordem

Todos os campos abaixo são obrigatórios, exceto **Complemento**. A ordem da lista é a ordem visual e de navegação do formulário.

| Ordem | Campo | Regra |
|---:|---|---|
| 1 | Nome completo | Texto obrigatório, até 150 caracteres |
| 2 | CPF | Obrigatório, 11 dígitos e dígitos verificadores válidos |
| 3 | Telefone | Obrigatório, telefone brasileiro válido com DDD |
| 4 | CEP | Obrigatório, exatamente 8 dígitos numéricos |
| 5 | Logradouro | Obrigatório, preenchido pela consulta ou manualmente |
| 6 | Número | Obrigatório, preenchido manualmente |
| 7 | Complemento | Opcional, até 50 caracteres |
| 8 | Bairro | Obrigatório, preenchido pela consulta ou manualmente |
| 9 | Cidade | Obrigatória, preenchida pela consulta ou manualmente |
| 10 | UF | Obrigatória, preenchida pela consulta ou manualmente |

O campo CEP vem antes dos campos de endereço. Ao completar os oito dígitos, a interface inicia a consulta. Os campos Logradouro, Bairro, Cidade e UF recebem os valores retornados e continuam editáveis. Número e Complemento permanecem para preenchimento manual.

O usuário pode digitar CEP somente com números. O campo não aceita letras, espaços ou pontuação e limita a entrada a oito dígitos. A interface não acrescenta hífen ao valor armazenado.

### 5.1 Autorização para tratamento de dados

Antes do botão de envio, a interface apresenta um checkbox desmarcado por padrão com o texto: **“Autorizo o tratamento dos dados pessoais que informei para viabilizar o envio e o processamento da Ficha Branca. Esta autorização se limita a essa finalidade; outros usos dependerão de outra base legal prevista na LGPD e de informação prévia.”** e informa: **“Para enviar este formulário, é necessário autorizar esse tratamento.”**. A submissão só pode ser enviada quando marcado. O servidor também exige a autorização e grava `TRUE` na coluna M. Tentativas sem autorização não são enviadas nem armazenadas.

## 6. Validação e consulta de CEP

O navegador e o servidor aplicam as mesmas regras para os campos enviados. O servidor continua sendo a autoridade final para aceitar uma submissão.

### 6.1 Nome completo

O nome é obrigatório. A validação remove espaços no início e no fim e limita o valor a 150 caracteres.

### 6.2 CPF

O CPF aceita 11 dígitos após remover a máscara de apresentação. A validação confere os dois dígitos verificadores e rejeita sequências repetidas. O armazenamento contém somente os 11 dígitos.

A interface pode apresentar a máscara brasileira durante a digitação. A máscara não altera o formato canônico enviado ao servidor.

### 6.3 Telefone

O telefone aceita números brasileiros fixos ou celulares com DDD. A interface pode aplicar a máscara brasileira existente. O servidor normaliza o valor para E.164 com o prefixo `+55` antes da gravação.

### 6.4 CEP

O CEP deve corresponder a `/^[0-9]{8}$/`. A validação ocorre no navegador e novamente no servidor. O valor gravado contém oito dígitos, sem hífen.

O serviço de consulta é o [ViaCEP](https://viacep.com.br/). A consulta usa o endpoint documentado `https://viacep.com.br/ws/{cep}/json/` e envia somente o CEP. A documentação do ViaCEP define o formato de oito dígitos, o retorno JSON e o indicador `erro: true` para CEP não encontrado.

Quando a consulta retorna sucesso, a interface mapeia `logradouro`, `bairro`, `localidade` e `uf` para os campos Logradouro, Bairro, Cidade e UF. Ela não preenche Número nem Complemento.

Uma consulta começa apenas depois da entrada dos oito dígitos. Enquanto aguarda, a interface informa **“Consultando CEP…”** e impede consultas duplicadas para o mesmo valor. Uma resposta atrasada de um CEP anterior não pode sobrescrever os campos de uma consulta mais recente.

Se o serviço indicar que o CEP não existe, a interface informa **“CEP não encontrado. Preencha o endereço manualmente.”**. Se houver falha de rede ou resposta inválida, a interface informa **“Não foi possível consultar o CEP. Preencha o endereço manualmente.”**. Em ambos os casos, o formulário permite preencher ou editar os campos de endereço, sem descartar valores digitados.

A consulta acontece individualmente a partir do campo CEP do formulário. A aplicação não realiza buscas em lote.

### 6.5 Endereço

Logradouro, Número, Bairro, Cidade e UF são obrigatórios. Os campos retornados pelo ViaCEP aceitam correção manual. Número é sempre digitado pela pessoa usuária. Complemento é opcional e limitado a 50 caracteres.

O backend remove espaços nas extremidades dos valores textuais e rejeita campos obrigatórios vazios. O complemento vazio é armazenado como texto vazio.

## 7. Envio e confirmação

O botão de envio mostra **“Enviar cadastro”** em estado normal e **“Enviando…”** durante a requisição. Ele fica desabilitado enquanto o servidor processa a submissão.

Quando o servidor confirmar um registro novo com HTTP 201 ou confirmar uma submissão previamente processada com HTTP 200, a interface exibe um modal com o texto **“Cadastro enviado com sucesso”**. O modal é acessível por teclado e leitor de tela e possui um controle identificado como **“Fechar”**.

Fechar o modal limpa os campos, descarta o UUID concluído e devolve o foco ao início do formulário. O formulário não limpa os campos antes da confirmação do servidor.

Em erro de validação, limite de requisições, rede ou servidor, a interface não mostra o modal de sucesso. Ela preserva todos os valores, mantém o UUID da tentativa e apresenta a mensagem correspondente junto ao formulário ou ao campo afetado.

## 8. Contrato de gravação no Google Sheets

O backend continua usando a conta de serviço e as variáveis server-side existentes. Nenhuma credencial é entregue ao navegador. O usuário fornecerá o destino da nova planilha antes da configuração desse ambiente; a especificação não aponta a nova aplicação para a planilha de referência anterior.

A aba de destino deverá ter a primeira linha com os cabeçalhos abaixo, nesta ordem:

| Coluna | Cabeçalho |
|---:|---|
| A | `id_submissao` |
| B | `data_hora_envio` |
| C | `nome_completo` |
| D | `cpf` |
| E | `telefone` |
| F | `cep` |
| G | `logradouro` |
| H | `numero` |
| I | `complemento` |
| J | `bairro` |
| K | `cidade` |
| L | `uf` |
| M | `autorizacao_dados_ficha_branca` |

O backend gera `data_hora_envio` no fuso `America/Sao_Paulo`, no formato `DD/MM/AAAA | HH:MM` (por exemplo, `08/11/2026 | 09:34`). A coluna M registra `TRUE` nas submissões aceitas. Como a autorização é obrigatória, uma submissão com valor `FALSE` não é gravada. A linha é gravada como valores literais. O honeypot não integra o esquema da planilha.

O navegador cria um UUID para cada tentativa de submissão. Em uma nova tentativa do mesmo envio, reutiliza o UUID. Antes de inserir uma linha, o backend procura esse identificador. Uma tentativa já registrada retorna sucesso sem inserir uma segunda linha.

## 9. Contrato HTTP

### 9.1 Envio de cadastro

```text
POST /api/submissions
Content-Type: application/json
```

O JSON contém `id_submissao`, `nome_completo`, `cpf`, `telefone`, `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `uf` e `website`. `website` é o honeypot e deve permanecer vazio. O endpoint não aceita campos do formulário antigo.

| HTTP | Resultado | Comportamento da interface |
|---:|---|---|
| 201 | Cadastro criado | Exibir confirmação de sucesso |
| 200 | UUID já processado | Exibir confirmação sem duplicar a linha |
| 400 | JSON ou campos inválidos | Mostrar erros e preservar valores |
| 405 | Método não permitido | Não processar o pedido |
| 415 | Tipo de conteúdo não suportado | Aceitar apenas JSON |
| 429 | Limite excedido | Pedir nova tentativa posterior |
| 500 | Falha de armazenamento | Mostrar mensagem genérica e preservar valores |

### 9.2 Consulta do CEP

O navegador envia ao ViaCEP somente o CEP de oito dígitos no endpoint definido na seção 6.4. Nenhum nome, CPF, telefone ou dado de endereço acompanha essa consulta.

## 10. Segurança e privacidade

- A função server-side valida todos os campos antes de gravar.
- As credenciais Google permanecem somente no ambiente server-side.
- A aplicação mantém o honeypot e o limite de 5 submissões por 60 segundos e origem, configuráveis por ambiente.
- O backend não registra CPF, telefone, endereço, payload integral ou credenciais nos logs.
- As respostas do endpoint não revelam planilha, intervalo, conta de serviço, stack trace ou conteúdo bruto da API Google.
- A planilha de destino permanece restrita ao proprietário, à conta de serviço e às pessoas administradoras necessárias.
- A consulta de CEP envia somente o CEP ao ViaCEP. O formulário não envia outros dados pessoais ao serviço.
- O formulário não adiciona caixa de consentimento ou aviso de finalidade que não tenha sido solicitado.

## 11. Acessibilidade e comportamento responsivo

- Cada campo tem rótulo visível e associação programática com sua mensagem de erro.
- Erros são comunicados por texto e não dependem somente de cor.
- O primeiro campo inválido recebe foco após a validação do envio.
- Estados de consulta e envio são anunciados para tecnologia assistiva.
- O modal de sucesso recebe foco ao abrir e devolve o foco ao formulário ao fechar.
- Todos os controles funcionam por teclado e mostram foco visível.
- O layout funciona em celular, tablet e desktop sem sobreposição nem rolagem horizontal.

## 12. Benefícios, custos e limites

O formulário reduz a coleta ao nome, CPF, telefone e endereço. A consulta de CEP preenche parte do endereço e evita digitação repetida.

O serviço externo pode não localizar um CEP ou ficar indisponível. A pessoa usuária pode continuar com o preenchimento manual. A gravação depende da criação da nova planilha e da configuração das variáveis do ambiente.

## 13. Critérios de aceitação

A implementação atende a esta especificação quando:

- a tela mostra o título, a instrução e um único card definidos nas seções 3 e 4;
- a interface usa fundo verde conforme a referência e mantém amarelo somente em detalhes discretos;
- o formulário não exibe “Encompasso”, o símbolo “E” ou campos antigos;
- somente os dez campos da seção 5 são apresentados, com complemento opcional;
- o CEP rejeita caracteres não numéricos e não permite mais de oito dígitos;
- ao completar oito dígitos, a aplicação consulta o ViaCEP uma vez para aquele valor;
- a consulta preenche logradouro, bairro, cidade e UF sem sobrescrever uma resposta mais recente;
- CEP inexistente e falha de rede permitem preenchimento manual do endereço e preservam os valores já digitados;
- CPF inválido, telefone inválido ou campos obrigatórios vazios impedem a gravação no navegador e no servidor;
- uma submissão sem autorização é recusada pelo navegador e pelo servidor;
- uma submissão aceita grava os 13 valores na ordem da seção 8, com `TRUE` na coluna M;
- repetir o mesmo UUID não cria outra linha;
- o modal de sucesso aparece somente após resposta HTTP 200 ou 201;
- fechar o modal limpa os campos, enquanto falhas preservam os dados e o UUID;
- nenhuma credencial ou dado pessoal, além do CEP necessário à consulta, é enviado ao ViaCEP ou exposto em logs;
- o honeypot, o limite de requisições, a idempotência e as restrições de acesso da planilha permanecem ativos.

## 14. Pré-requisitos de configuração

Antes de validar gravações, o responsável deve criar a nova planilha, configurar a aba com os cabeçalhos da seção 8 e fornecer o identificador para `GOOGLE_SHEETS_SPREADSHEET_ID`. `GOOGLE_SHEETS_TAB_NAME` deve receber o nome exato da aba criada.

As variáveis de conta de serviço e de limite de requisições permanecem server-side. O ambiente de validação deve usar uma planilha separada da produção.

## 15. Referências e base documental

- [`ESPECIFICAÇÃO.md`](ESPECIFICAÇÃO.md) permanece como especificação original do Encompasso Unificado. Seus contratos de Sheets, segurança, idempotência, responsividade e acessibilidade servem de base onde esta especificação os reutiliza.
- [`index.html`](index.html), [`js/app.js`](js/app.js), [`js/validation.js`](js/validation.js) e [`api/submissions.js`](api/submissions.js) identificam a implementação existente usada como base técnica.
- A documentação oficial do [ViaCEP](https://viacep.com.br/) define a consulta JSON por CEP, os campos retornados e o indicador de CEP inexistente. A referência foi consultada em 2026-11-08.
