# Especificação do projeto Encompasso Unificado

## 1. Status e autoridade do documento

Este documento é a fonte principal de verdade funcional e técnica do projeto **Encompasso Unificado**.

Ele consolida os requisitos definidos nos materiais iniciais, nas respostas registradas em `INFORMACAO.md`, na identidade visual `image.png` e nas decisões confirmadas. Em caso de divergência com textos conversacionais ou documentos anteriores, prevalece esta especificação.

O histórico das decisões não deve ser acumulado neste arquivo. Alterações relevantes devem ser registradas em `.events/events.md`, mantendo aqui somente o estado vigente.

## 2. Objetivo do produto

Criar um formulário web público para coleta de informações de identificação, contato e residência. A aplicação será publicada na Vercel e gravará submissões válidas em uma planilha Google Sheets por meio de processamento server-side.

O produto será simples, mobile first, sem autenticação do respondente e sem frameworks frontend. Nenhuma credencial Google poderá ser exposta no navegador.

## 3. Escopo

### 3.1 Incluído

- Formulário público chamado **Encompasso Unificado**.
- Interface organizada em três cards sequenciais.
- Validação no frontend para resposta imediata ao usuário.
- Validação integral e autoritativa no backend.
- Endpoint server-side hospedado na Vercel.
- Autenticação Google com uma única conta de serviço.
- Gravação idempotente no Google Sheets.
- Mensagens de validação, sucesso e falha.
- Proteção discreta contra automação e excesso de requisições.
- Layout mobile first adaptável a tablet e desktop.

### 3.2 Fora do escopo

- Framework frontend.
- Autenticação ou conta para o respondente.
- Banco de dados além do Google Sheets.
- Busca automática de CEP ou endereço.
- Preenchimento automático de cidade, estado ou país.
- Validação externa de passaporte.
- Listas geográficas obtidas de serviços externos.
- Painel administrativo.
- Edição ou exclusão de registros pelo formulário.
- Upload de arquivos.
- CAPTCHA visível.
- Aviso adicional de finalidade, termo de ciência ou checkbox de consentimento no formulário.

## 4. Identidade visual

A referência oficial é `image.png`.

| Uso | Cor | Referência adicional |
|---|---|---|
| Fundo principal | `#211E70` | RGB 33, 30, 112; Pantone 2756 C |
| Destaques | `#F9E423` | RGB 249, 228, 35; Pantone 3945 C |
| Logotipo e textos claros | `#FEFEFE` | RGB 254, 254, 254; Trans. White |

O símbolo provisório será um círculo azul `#211E70` com a letra **E** em branco `#FEFEFE`. O amarelo `#F9E423` será reservado para destaques e estados que mantenham contraste adequado.

## 5. Experiência e responsividade

### 5.1 Mobile first

O celular é a experiência principal. A interface deverá partir de uma coluna e adaptar-se progressivamente a telas maiores.

No mobile:

- os cards serão exibidos em uma única coluna;
- os campos e o botão principal utilizarão a largura disponível;
- os controles terão área adequada para interação por toque;
- não haverá rolagem horizontal;
- títulos, rótulos, ajuda e erros não poderão se sobrepor;
- o teclado virtual deverá corresponder ao tipo de entrada sempre que possível;
- a exibição de erros não poderá ocultar o campo relacionado.

Tablet e desktop poderão utilizar mais espaço horizontal, desde que preservem a ordem, o agrupamento e o fluxo do formulário.

### 5.2 Organização visual

Os três cards serão independentes e apresentados nesta ordem:

1. Identificação.
2. Contato.
3. Residência.

Não haverá etapas separadas ou navegação entre páginas. O envio será realizado ao final do terceiro card.

## 6. Campos do formulário

Somente **Nome social** e **Complemento** são opcionais. Todos os demais campos são obrigatórios.

### 6.1 Identificação

| Campo | Tipo de entrada | Obrigatório | Limite | Regra principal |
|---|---|---:|---:|---|
| Nome completo | Texto | Sim | 150 | Remover espaços nas extremidades |
| Nome social | Texto | Não | 150 | Remover espaços nas extremidades |
| Data de nascimento | Data | Sim | Formato da data | Não permitir data futura |
| Nacionalidade | Texto livre | Sim | 80 | Sem consulta ou lista externa |
| Tipo de documento | Seletor | Sim | Enumeração | Valores `cpf` ou `passaporte` |
| Documento | Entrada dinâmica | Sim | Conforme o tipo | Aplicar regras de CPF ou Passaporte |

O seletor de documento será explícito. A escolha modificará rótulo, orientação de entrada, máscara e validação do campo Documento. Nacionalidade não escolherá automaticamente o tipo de documento.

#### CPF

- Aplicar máscara brasileira durante a digitação.
- Aceitar exatamente 11 dígitos após remover a máscara.
- Validar os dígitos verificadores.
- Armazenar somente os 11 dígitos.

#### Passaporte

- Aceitar letras e números.
- Não aplicar máscara.
- Não realizar validação de formato internacional.
- Exigir no mínimo 5 e no máximo 30 caracteres.
- Remover espaços nas extremidades antes da validação e do armazenamento.
- Para 4 caracteres ou menos, exibir exatamente: **“Você digitou um número insuficiente de caracteres.”**

### 6.2 Contato

| Campo | Tipo de entrada | Obrigatório | Limite | Regra principal |
|---|---|---:|---:|---|
| Telefone | Telefone | Sim | 20 antes da normalização | Telefone brasileiro fixo ou celular com DDD |
| E-mail | E-mail | Sim | 254 | Validar estrutura básica de e-mail |

O telefone deverá aceitar 10 ou 11 dígitos nacionais e entrada iniciada por `+55`, apresentar máscara brasileira compatível com telefone fixo ou celular e ser armazenado no padrão E.164, começando com `+55`.

O e-mail será armazenado sem espaços nas extremidades e em letras minúsculas.

### 6.3 Residência

| Campo | Tipo de entrada | Obrigatório | Limite | Regra principal |
|---|---|---:|---:|---|
| País | Texto livre | Sim | 80 | Preenchimento manual |
| Estado/Província | Texto livre | Sim | 100 | Preenchimento manual |
| Município/Cidade | Texto livre | Sim | 120 | Preenchimento manual |
| Logradouro e número | Texto livre | Sim | 200 | Preenchimento manual |
| Complemento | Texto livre | Não | 150 | Preenchimento manual |
| Bairro/Distrito | Texto livre | Sim | 120 | Preenchimento manual |
| CEP/Código postal | Texto livre | Sim | 20 | Preservar formatos internacionais |

Não haverá integração para busca de CEP, endereço, cidade, estado, país ou qualquer outro componente da residência.

## 7. Normalização e armazenamento

O backend normalizará os dados antes da gravação.

| Dado | Formato armazenado |
|---|---|
| `id_submissao` | UUID recebido do frontend e validado pelo backend |
| `data_hora_envio` | ISO 8601 em UTC, gerado pelo backend |
| `data_nascimento` | `YYYY-MM-DD` |
| `tipo_documento` | `cpf` ou `passaporte` |
| CPF | Somente 11 dígitos |
| Passaporte | Alfanumérico, sem espaços nas extremidades |
| Telefone | E.164 com código `+55` |
| E-mail | Letras minúsculas e sem espaços nas extremidades |
| CEP/Código postal | Texto sem espaços nas extremidades, preservando letras e símbolos internos |
| Outros textos | Sem espaços nas extremidades, preservando acentos e conteúdo informado |

Campos opcionais não preenchidos serão gravados como texto vazio para preservar a posição das colunas.

## 8. Planilha Google Sheets

### 8.1 Identificação da aba

O nome exato da aba de gravação é `formulario-encompasso`.

Foi identificada uma divergência nas fontes: o arquivo da planilha e a resposta original utilizavam `formulario-encomapsso`, enquanto a aba existente utiliza `formulario-encompasso`. A integração deverá utilizar o nome real da aba, e a divergência permanece registrada em `.events/events.md`.

### 8.2 Cabeçalhos e ordem

A primeira linha da aba será reservada para os cabeçalhos abaixo, nesta ordem:

| Coluna | Cabeçalho |
|---:|---|
| A | `id_submissao` |
| B | `data_hora_envio` |
| C | `nome_completo` |
| D | `nome_social` |
| E | `data_nascimento` |
| F | `nacionalidade` |
| G | `tipo_documento` |
| H | `documento` |
| I | `telefone` |
| J | `email` |
| K | `pais` |
| L | `estado_provincia` |
| M | `municipio_cidade` |
| N | `logradouro_numero` |
| O | `complemento` |
| P | `bairro_distrito` |
| Q | `cep_codigo_postal` |

Cada submissão aceita ocupará exatamente uma nova linha. A API deverá enviar os valores como dados literais, sem interpretação de fórmulas.

### 8.3 Idempotência

O frontend criará um UUID quando uma tentativa de submissão começar e reutilizará o mesmo valor em novas tentativas daquele envio.

Antes de inserir a linha, o backend consultará `id_submissao`: se não existir, gravará a nova linha; se já existir, não gravará outra linha e responderá como submissão já processada com sucesso.

## 9. Arquitetura técnica

### 9.1 Frontend

Tecnologias: HTML5, CSS3 e JavaScript puro.

Responsabilidades:

- renderizar o formulário e seus estados;
- aplicar abordagem mobile first;
- aplicar máscaras de apresentação;
- executar validação para resposta imediata;
- criar e manter o `id_submissao` da tentativa;
- enviar JSON ao endpoint server-side;
- impedir múltiplos cliques enquanto houver envio em andamento;
- manter os campos preenchidos em caso de falha;
- limpar os campos somente após sucesso confirmado;
- nunca conter ou solicitar credenciais Google.

A validação do frontend melhora a experiência, mas nunca será considerada suficiente para autorizar uma gravação.

### 9.2 Backend

Tecnologias: Vercel Function, runtime Node.js, cliente oficial `googleapis` e Google Sheets API.

Responsabilidades:

- aceitar somente o contrato HTTP especificado;
- validar tipo, presença, tamanho e formato de todos os campos;
- normalizar os valores;
- rejeitar automação detectada pelo honeypot;
- aplicar limitação de requisições;
- validar o UUID e garantir idempotência;
- autenticar-se com a conta de serviço;
- gravar os dados na ordem exata das colunas;
- retornar respostas sem detalhes sensíveis;
- evitar logs com dados pessoais ou secrets.

## 10. Contrato HTTP

### 10.1 Endpoint

```text
POST /api/submissions
Content-Type: application/json
```

A API será destinada ao mesmo domínio da aplicação e não deverá habilitar CORS público com origem curinga.

O corpo terá os campos:

```text
id_submissao
nome_completo
nome_social
data_nascimento
nacionalidade
tipo_documento
documento
telefone
email
pais
estado_provincia
municipio_cidade
logradouro_numero
complemento
bairro_distrito
cep_codigo_postal
website
```

`website` será o honeypot e deverá permanecer vazio. Ele não será gravado na planilha.

### 10.2 Respostas

| HTTP | Significado | Comportamento esperado |
|---:|---|---|
| 201 | Registro criado | Informar sucesso e devolver `id_submissao` |
| 200 | UUID já processado | Informar sucesso sem criar nova linha |
| 400 | Dados inválidos | Retornar código estável e erros por campo |
| 405 | Método não permitido | Não processar a requisição |
| 415 | Tipo de conteúdo inválido | Aceitar somente JSON |
| 429 | Limite excedido | Solicitar nova tentativa posterior |
| 500 | Falha interna | Retornar mensagem genérica e não expor detalhes |

Respostas não poderão incluir nomes de planilha, ranges, e-mail da conta de serviço, stack trace, secrets ou mensagens brutas da API Google.

## 11. Fluxo completo de submissão

1. O usuário preenche os três cards.
2. O frontend valida os campos e apresenta erros junto às entradas correspondentes.
3. Ao primeiro envio, o frontend cria o `id_submissao`.
4. O frontend confirma que o honeypot está vazio, bloqueia o botão e envia JSON ao backend.
5. O backend valida método, conteúdo, limite de requisições e honeypot.
6. O backend valida e normaliza todos os dados.
7. O backend procura o `id_submissao` na planilha.
8. Se já existir, responde com sucesso sem inserir outra linha.
9. Se não existir, gera `data_hora_envio` em UTC e grava a linha completa.
10. Após confirmação, o frontend exibe **“Dados enviados com sucesso.”**, limpa o formulário e encerra a tentativa atual.
11. Em caso de erro, o frontend mantém os valores e permite nova tentativa com o mesmo `id_submissao`.

## 12. Validação e mensagens

Frontend e backend aplicarão as mesmas regras funcionais. O backend será a autoridade final.

Mensagens deverão ser objetivas, próximas ao campo e associadas semanticamente à entrada. Exemplos aprovados:

- “Este campo é obrigatório.”
- “Informe um e-mail válido.”
- “Informe um CPF válido.”
- “Você digitou um número insuficiente de caracteres.”

Quando houver múltiplos erros, a interface também apresentará um resumo geral e direcionará o foco ao primeiro campo inválido.

Falhas de rede ou servidor utilizarão mensagem genérica, preservarão os dados e permitirão nova tentativa. Nenhuma mensagem poderá revelar detalhes internos.

## 13. Proteção e segurança

### 13.1 Credenciais

Será utilizada uma única conta de serviço, originada do arquivo local identificado como credencial geral de conta de serviço. A credencial nomeada para n8n e o cliente OAuth não serão usados pela aplicação.

O OAuth existente aponta para callback de uma instalação n8n e não corresponde à arquitetura definida para a Vercel.

Arquivos JSON reais não serão importados pelo frontend, incluídos no repositório, copiados para documentação ou enviados à Vercel como arquivos. Eles deverão ser removidos com segurança do ambiente local depois da validação das variáveis.

### 13.2 Variáveis de ambiente

| Variável | Finalidade | Exposição ao frontend |
|---|---|---:|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Identidade da conta de serviço | Não |
| `GOOGLE_PRIVATE_KEY` | Chave privada da conta de serviço | Não |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Identificador da planilha | Não |
| `GOOGLE_SHEETS_TAB_NAME` | Aba `formulario-encompasso` | Não |
| `RATE_LIMIT_MAX_REQUESTS` | Máximo configurado por janela | Não |
| `RATE_LIMIT_WINDOW_SECONDS` | Duração da janela | Não |

A implementação deverá interpretar corretamente quebras de linha da chave privada armazenada na Vercel. Nenhuma variável server-side receberá prefixo que a torne pública.

### 13.3 Planilha e permissões

Antes da produção, a Google Sheets API deverá estar habilitada, a conta de serviço deverá possuir acesso de edição e o acesso público da planilha deverá ser removido. Somente a conta proprietária, a conta de serviço e administradores necessários manterão acesso.

### 13.4 Proteção do endpoint

- Honeypot invisível e fora da ordem normal de foco.
- Limitação de requisições por origem ou IP na infraestrutura disponível.
- Valores iniciais de 5 tentativas por 60 segundos por origem, configuráveis por ambiente.
- Validação de tamanho antes de operações no Google Sheets.
- Aceitação somente de JSON e do método POST.
- Dados enviados à planilha como valores literais.
- Logs sem payloads completos ou dados pessoais.

## 14. Tratamento de estados da interface

### 14.1 Inicial

Formulário vazio, campos habilitados e botão disponível.

### 14.2 Validação

Campos inválidos são destacados sem apagar informações. O foco é direcionado ao primeiro erro.

### 14.3 Envio

Botão desabilitado, indicação de processamento e prevenção de múltiplos envios simultâneos. A estrutura não poderá mudar de tamanho de forma incoerente.

### 14.4 Sucesso

Exibir **“Dados enviados com sucesso.”**, limpar os campos e descartar o UUID concluído.

### 14.5 Falha recuperável

Manter campos e UUID, reabilitar o envio e apresentar mensagem adequada.

## 15. Acessibilidade

- Utilizar HTML semântico e rótulo visível para cada campo.
- Associar erros aos respectivos controles.
- Permitir preenchimento e envio por teclado.
- Manter foco visível.
- Não comunicar erro ou sucesso exclusivamente por cor.
- Respeitar contraste entre texto, fundo, bordas e estados.
- Utilizar atributos de autocomplete compatíveis com dados pessoais e endereço.
- Utilizar `inputmode` adequado para CPF, telefone, e-mail e CEP quando aplicável.
- Manter áreas interativas adequadas ao toque.

## 16. Organização prevista dos arquivos

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
`-- vercel.json                 # apenas se necessário
```

`INFORMACAO.md`, arquivos `.env` reais e a pasta de credenciais serão materiais locais e deverão ficar fora do Git.

## 17. Versionamento e deploy

### 17.1 GitHub

- O repositório definitivo é `formulario-encompasso` na organização ou conta já definida.
- A branch principal representará a versão destinada à produção.
- Credenciais, variáveis reais e materiais internos serão excluídos antes do primeiro commit.
- Mudanças relevantes de requisito deverão atualizar a especificação e `.events/events.md` no mesmo conjunto de alterações.

### 17.2 Vercel

- A aplicação utilizará o domínio fornecido pela própria Vercel.
- O frontend estático e a função em `/api` pertencerão ao mesmo projeto.
- Secrets serão configurados como Environment Variables server-side.
- Deploys de validação não poderão utilizar a planilha de produção sem autorização e controle explícitos.
- A produção somente será liberada depois dos checkpoints de segurança e integração.

## 18. Critérios de aceitação da futura implementação

A implementação somente poderá ser considerada concluída quando:

- os três cards e todos os campos estiverem presentes na ordem definida;
- somente Nome social e Complemento forem opcionais;
- CPF, Passaporte, telefone, e-mail e data respeitarem as regras definidas;
- o layout funcionar primeiro em mobile e adaptar-se sem sobreposição ou rolagem horizontal;
- nenhuma credencial estiver presente no navegador, Git ou bundle público;
- frontend e backend validarem os dados;
- uma submissão válida criar exatamente uma linha na ordem correta;
- a repetição do mesmo `id_submissao` não criar duplicidade;
- erros preservarem os dados preenchidos;
- o sucesso limpar o formulário e apresentar a mensagem aprovada;
- a planilha estiver restrita e a conta de serviço possuir somente o acesso necessário;
- logs e respostas não revelarem dados pessoais ou detalhes internos;
- o fluxo completo for validado em ambiente de teste antes da produção.

## 19. Pendências de especificação

Não há pendências funcionais ou técnicas abertas para a criação do plano executivo.

Os itens abaixo são checkpoints de execução, não lacunas desta especificação:

- confirmar a habilitação da Google Sheets API;
- confirmar o acesso da conta de serviço escolhida;
- criar os cabeçalhos da planilha conforme a ordem especificada;
- restringir o acesso público da planilha;
- verificar o mecanismo de limitação disponível no ambiente Vercel contratado;
- configurar e validar as variáveis server-side;
- remover com segurança os arquivos locais de credenciais após a migração validada.
