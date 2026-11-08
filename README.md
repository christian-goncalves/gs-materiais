# GS Materiais

Formulário público mobile first para cadastro de dados pessoais e endereço. O frontend usa HTML, CSS e JavaScript sem framework; a função `api/submissions.js` valida e grava os cadastros no Google Sheets.

## Desenvolvimento local

Use Node.js 20 ou superior e instale as dependências com `npm install`. Inicie a aplicação com:

```sh
npm run dev
```

Abra `http://localhost:3000` no navegador. O formulário pode ser explorado sem credenciais; o envio real requer configurar as variáveis server-side a partir de `.env.example` e usar uma planilha GS Materiais de validação autorizada.

## Contrato e proteção

O formulário apresenta nome completo, CPF, telefone, CEP, logradouro, número, complemento, bairro, cidade e UF, nessa ordem. Antes do envio, a pessoa precisa autorizar o tratamento dos dados para a Ficha Branca. O ViaCEP recebe somente o CEP. O servidor valida os campos e a autorização, aplica honeypot, limite de requisições e idempotência e grava valores literais nas 13 colunas A–M descritas em `ESPECIFICAÇÃO-GS-MATERIAIS.md`; a coluna M registra `TRUE` para cada submissão aceita.

Credenciais Google permanecem no ambiente server-side: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEETS_SPREADSHEET_ID` e `GOOGLE_SHEETS_TAB_NAME`. Não configure o destino de validação com a planilha anterior.

## Verificações locais

```sh
npm run build
npm run test:unit
npm test
npm run test:browser
```

O teste de integração Sheets requer `GS_MATERIAIS_VALIDATION_SPREADSHEET_ID`, `GOOGLE_SHEETS_TAB_NAME`, credenciais server-side e `GS_MATERIAIS_VALIDATION_SHEET=confirmed`. Como desenvolvimento e produção podem usar a mesma planilha, execute-o apenas depois de confirmar o destino: ele confere os cabeçalhos existentes, grava uma linha sintética com UUID, repete o envio para verificar idempotência, lê os dados e remove a linha criada. Não cria abas nem altera cabeçalhos. A configuração está detalhada no plano.

## Documentação do projeto

- [ESPECIFICAÇÃO-GS-MATERIAIS.md](ESPECIFICAÇÃO-GS-MATERIAIS.md): comportamento funcional e visual vigente.
- [ESPECIFICAÇÃO.md](ESPECIFICAÇÃO.md): especificação original preservada e contratos reutilizados.
- [PLANO-GS-MATERIAIS.md](PLANO-GS-MATERIAIS.md): fases, gates e validação.
- [PROMPT-EXECUCAO-GS-MATERIAIS.md](PROMPT-EXECUCAO-GS-MATERIAIS.md): protocolo de execução contínua.
- [.events/events.md](.events/events.md): decisões, descobertas e checkpoints.
