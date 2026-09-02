# Encompasso Unificado

Formulário web mobile first para coleta de dados de identificação, contato e residência, com gravação segura em Google Sheets.

## Estado do projeto

O projeto está na fase de especificação. Ainda não há aplicação implementada, dependências instaladas, configuração da Vercel ou ambiente local preparado.

A próxima etapa deverá analisar a especificação consolidada e produzir um plano executivo de implementação. Esse plano será realizado separadamente e deverá conter fases, tarefas, dependências, checkpoints, validações e critérios de conclusão.

## Objetivo

Disponibilizar um formulário público chamado **Encompasso Unificado**, acessível pela URL da Vercel, que:

- organize os campos em Identificação, Contato e Residência;
- priorize a experiência em dispositivos móveis;
- valide os dados no navegador e novamente no servidor;
- não exponha credenciais ou detalhes internos ao navegador;
- grave cada submissão válida em uma aba específica do Google Sheets;
- evite duplicação da mesma tentativa de envio;
- apresente respostas claras de sucesso e erro.

## Arquitetura geral

```text
Navegador
HTML + CSS + JavaScript
        |
        | HTTPS / JSON
        | POST /api/submissions
        v
Vercel Function
Node.js + validação server-side
        |
        | Conta de serviço
        | Google Sheets API
        v
Google Sheets
Aba formulario-encompasso
```

O frontend será estático e não terá acesso às credenciais Google. Somente a função server-side poderá autenticar-se e gravar na planilha.

## Stack definida

- HTML5 sem framework de interface.
- CSS3 com abordagem mobile first.
- JavaScript puro no navegador.
- Node.js em uma Vercel Function.
- Cliente oficial `googleapis` para autenticação e Google Sheets API.
- Google Sheets como destino dos registros.
- GitHub para versionamento.
- Vercel para hospedagem e processamento server-side.

Nenhum framework frontend, banco de dados ou serviço adicional faz parte do escopo atual.

## Estrutura prevista

Esta estrutura descreve a implementação futura e não significa que os arquivos já existam:

```text
.
|-- README.md
|-- ESPECIFICAÇÃO.md
|-- .events/
|   `-- events.md
|-- index.html
|-- assets/
|   `-- image.png
|-- css/
|   `-- styles.css
|-- js/
|   `-- app.js
|-- api/
|   `-- submissions.js
|-- package.json
|-- .env.example
|-- .gitignore
`-- vercel.json                 # somente se a configuração padrão não for suficiente
```

## Configuração necessária

A implementação utilizará variáveis server-side. Os nomes definidos são:

```text
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_SHEETS_SPREADSHEET_ID
GOOGLE_SHEETS_TAB_NAME
RATE_LIMIT_MAX_REQUESTS
RATE_LIMIT_WINDOW_SECONDS
```

`GOOGLE_SHEETS_TAB_NAME` deverá receber `formulario-encompasso`.

Os valores reais deverão existir somente no ambiente local ignorado pelo Git e nas Environment Variables da Vercel. O futuro `.env.example` terá apenas placeholders.

Antes da produção será necessário:

1. habilitar a Google Sheets API no projeto Google utilizado;
2. conceder à conta de serviço escolhida permissão de edição na planilha;
3. restringir a planilha, removendo o acesso público;
4. configurar as variáveis na Vercel;
5. validar a gravação em ambiente controlado;
6. remover com segurança os arquivos locais de credenciais quando não forem mais necessários.

## Segurança

- Credenciais Google nunca poderão ser enviadas ao navegador ou incluídas no Git.
- A pasta local de credenciais e `INFORMACAO.md` são materiais internos e não devem ser versionados.
- O backend não deverá registrar CPF, passaporte, telefone, endereço, payloads completos ou secrets em logs.
- A planilha deverá permanecer restrita à conta proprietária, à conta de serviço e às pessoas administradoras necessárias.
- A API aceitará somente requisições esperadas, validará novamente todos os campos e aplicará proteção contra automação e excesso de requisições.

## Documentação interna

- [ESPECIFICAÇÃO.md](ESPECIFICAÇÃO.md): fonte principal de verdade funcional e técnica.
- [.events/events.md](.events/events.md): histórico cronológico de decisões e mudanças relevantes.

Mudanças de requisito devem primeiro ser registradas em `.events/events.md` e refletidas na especificação vigente. A especificação não deve acumular histórico ou versões antigas no corpo principal.
