# Plano executivo de implementação do GS Materiais

## 1. Propósito, autoridade e regra de execução

Este plano organiza a refatoração da aplicação existente para atender à [`ESPECIFICAÇÃO-GS-MATERIAIS.md`](ESPECIFICAÇÃO-GS-MATERIAIS.md). Essa especificação é a autoridade funcional deste trabalho. A [`ESPECIFICAÇÃO.md`](ESPECIFICAÇÃO.md) original permanece preservada como referência dos contratos e regras de negócio reutilizados; este plano não a substitui nem a altera.

O checkout já contém uma aplicação em HTML, CSS e JavaScript, um endpoint server-side para submissões, validações, testes e scripts de integração com Google Sheets. Portanto, o trabalho parte de uma implementação existente. Cada fase deve primeiro conferir o comportamento atual e então modificar somente o necessário para o novo formulário. Não se deve recriar a infraestrutura, presumir que arquivos documentais antigos descrevem o estado atual do código ou remover mudanças já presentes no worktree.

As fases devem ser executadas na ordem. Cada uma termina com verificações e um checkpoint. Se uma fase falhar, corrigir a causa dentro da especificação, repetir os testes afetados e reavaliar o mesmo checkpoint antes de avançar. Registrar em `.events/events.md` decisões, descobertas, riscos e checkpoints relevantes, sem transcrever comandos ou dados pessoais.

Este plano não autoriza gravações em uma planilha externa, mudanças em produção, publicação, alteração de domínio, push ou commit. A nova planilha ainda depende de criação e fornecimento do destino pelo responsável. Testes de gravação devem usar exclusivamente uma planilha de validação controlada. A publicação e qualquer operação externa ficam condicionadas à autorização correspondente.

## 2. Fases de implementação

### Fase 1 — Baseline e preparação da refatoração

**Objetivo**

Confirmar o estado real do código, das mudanças locais e das dependências necessárias para alterar a aplicação sem perder trabalho existente.

**Estado esperado**

Há um inventário curto dos pontos de entrada, do formulário atual, das validações, do endpoint, dos testes e da configuração Sheets. As alterações preexistentes estão preservadas e os bloqueios de ambiente estão identificados.

**Dependências e pré-condições**

- `ESPECIFICAÇÃO-GS-MATERIAIS.md` está disponível e é a referência funcional desta refatoração.
- Node.js compatível com `package.json` (versão 20 ou superior) e dependências instaladas para as verificações locais.
- O executor tem acesso ao repositório e mantém as mudanças não relacionadas intactas.

**Tarefas concretas**

- Inspecionar `git status`, os arquivos de aplicação e os scripts de teste antes de editar; não limpar, restaurar ou sobrescrever alterações locais.
- Registrar o comportamento-base necessário: campos exibidos, regras de validação, formato do payload, cabeçalhos e proteções atuais de `api/submissions.js`.
- Conferir `index.html`, `css/styles.css`, `js/app.js`, `js/validation.js`, `api/submissions.js`, `test/` e `scripts/` contra a especificação alvo.
- Confirmar quais variáveis e recursos externos estão disponíveis sem imprimir valores secretos. Não usar a planilha original como destino de teste.
- Atualizar `.events/events.md` somente se a inspeção revelar uma decisão, divergência ou bloqueio relevante.

**Arquivos envolvidos**

- Leitura: `index.html`, `css/styles.css`, `js/app.js`, `js/validation.js`, `api/submissions.js`, `test/`, `scripts/`, `package.json` e configuração de deploy existente.
- Modificação eventual: `.events/events.md`, apenas para registro relevante.
- Não modificar: `ESPECIFICAÇÃO.md`.

**Verificações**

- `git status --short` para identificar alterações preexistentes.
- Conferência da disponibilidade dos scripts `npm run build`, `npm test`, `npm run test:unit`, `npm run test:browser` e `npm run test:sheets` em `package.json`.
- Revisão dos testes existentes para distinguir cobertura atual de cobertura ainda necessária.

**Critérios e checkpoint**

`APROVADO` quando o baseline estiver descrito, as mudanças existentes estiverem identificadas e o executor souber quais arquivos precisam mudar e quais dependências externas estão pendentes. Caso contrário, `REPROVADO`; resolver a incerteza sem apagar nem substituir trabalho local.

### Fase 2 — Formulário único e identidade visual

**Objetivo**

Transformar a tela em um formulário simples de um único card, preservando os componentes visuais existentes que forem compatíveis com a referência aprovada.

**Estado esperado**

A página exibe o título “GS Materiais”, a instrução “Preencha seus dados nos campos abaixo.” e um único card “Dados pessoais”. O fundo usa o verde escuro da referência; amarelo aparece apenas em detalhes discretos. A marca Encompasso e o símbolo E não aparecem.

**Dependências e pré-condições**

- Fase 1 aprovada.
- A amostra visual fornecida pelo usuário é a referência de cor; não há hexadecimal oficial aprovado para o verde.
- A ordem visual e de foco dos campos segue a seção 5 da especificação GS Materiais.

**Tarefas concretas**

- Atualizar `index.html` para manter somente os dez campos definidos: nome completo, CPF, telefone, CEP, logradouro, número, complemento, bairro, cidade e UF.
- Remover campos e rótulos da experiência anterior que não constam na especificação, incluindo marca antiga, símbolo E e cards separados.
- Ajustar `css/styles.css` para o fundo verde escuro, detalhes amarelos discretos, card único e hierarquia visual simples. Manter o card claro e os demais estilos existentes quando compatíveis.
- Manter layout responsivo, ordem de leitura, foco visível, rótulos acessíveis e mensagens de erro associadas aos controles.
- Garantir que o complemento seja opcional e aceite no máximo 50 caracteres; os demais campos de endereço são obrigatórios.
- Preservar o honeypot técnico fora da ordem normal de foco e sem mostrá-lo como campo do formulário.

**Arquivos a modificar**

- `index.html`
- `css/styles.css`
- `js/app.js`, se a estrutura ou os estados de interface exigirem ajuste nesta fase
- `.events/events.md`, somente para decisão visual ou checkpoint relevante

**Verificações**

- Inspeção do DOM: título, texto auxiliar, um card, dez campos e ordem definida; sem conteúdo antigo ou campos fora do escopo.
- Verificação visual em celular, tablet e desktop; sem rolagem horizontal, sobreposição ou perda de foco visível.
- Verificação por teclado de rótulos, ordem de tabulação e mensagens textuais de erro.
- `npm run build`.

**Critérios e checkpoint**

`APROVADO` quando a interface corresponder à estrutura e à identidade visual da especificação, com ordem correta e comportamento responsivo demonstrado. A cor verde deve ser aferida visualmente contra a referência, sem registrá-la como código oficial.

### Fase 3 — Validação, consulta de CEP e confirmação

**Objetivo**

Implementar no navegador as regras de entrada, o preenchimento do endereço via CEP e o ciclo de envio e confirmação descritos na especificação.

**Estado esperado**

CPF, telefone e CEP são validados antes do envio. Ao completar oito dígitos do CEP, a aplicação consulta o ViaCEP uma vez para aquele valor, preenche logradouro, bairro, cidade e UF e mantém esses campos editáveis. Erros de busca permitem preenchimento manual. O sucesso abre modal; fechar o modal limpa os dados e o UUID concluído.

**Dependências e pré-condições**

- Fase 2 aprovada.
- A consulta do ViaCEP é feita pelo navegador e envia somente o CEP.
- Busca indisponível não pode impedir o preenchimento manual do endereço.

**Tarefas concretas**

- Atualizar ou reorganizar `js/validation.js` para validar CPF com dígitos verificadores, telefone brasileiro com DDD e CEP com exatamente oito dígitos numéricos; normalizar o formato canônico conforme a especificação.
- Ajustar `index.html` e `js/app.js` para limitar o CEP a oito números, sem acrescentar hífen ao valor enviado, e disparar consulta quando os oito dígitos forem informados.
- Consultar `https://viacep.com.br/ws/{cep}/json/`, mapear `logradouro`, `bairro`, `localidade` e `uf` e impedir que uma resposta atrasada substitua valores de uma consulta mais recente.
- Tratar CEP inexistente, rede indisponível e JSON inválido com as mensagens especificadas, mantendo os valores digitados e permitindo edição manual.
- Manter Número e Complemento para preenchimento manual. Limitar Complemento a 50 caracteres.
- Implementar os estados “Enviar cadastro” e “Enviando…”. Criar UUID para a tentativa, preservá-lo em falha/reenvio e descartar somente após sucesso confirmado.
- Mostrar modal acessível com “Cadastro enviado com sucesso” somente após HTTP 200 ou 201. Ao fechar, limpar o formulário, limpar o UUID concluído e devolver o foco ao início do formulário.
- Em falha de validação, rede, limite ou servidor, manter dados e UUID, apresentar erro e permitir nova tentativa.

**Arquivos a modificar**

- `index.html`
- `js/app.js`
- `js/validation.js`
- `css/styles.css`, para estados de consulta, erro e modal
- Testes de unidade em `test/validation.test.js` e testes de interface existentes, se aplicável

**Verificações**

- Fixtures de CPF válido, inválido e sequência repetida; telefone válido e inválido com DDD; CEP com 7, 8 e 9 dígitos e com caracteres não numéricos.
- CEP encontrado, CEP não encontrado, erro de rede, JSON inválido e respostas fora de ordem; confirmar preenchimento, edição manual e preservação de dados.
- Envio simulado com HTTP 201, HTTP 200, erro de validação, HTTP 429, HTTP 500 e falha de rede; confirmar modal somente no sucesso, preservação no erro e limpeza ao fechar.
- Confirmar limite de 50 caracteres para Complemento e obrigatoriedade dos demais campos conforme a especificação.
- `npm run test:unit` e `npm run build`.

**Critérios e checkpoint**

`APROVADO` quando validação e busca de CEP atenderem aos casos definidos, os dados retornados continuarem editáveis e sucesso/falha produzirem o ciclo de estado correto sem perder dados. Nenhum dado pessoal além do CEP pode ser enviado ao ViaCEP.

### Fase 4 — Contrato server-side e Google Sheets

**Objetivo**

Alinhar a validação autoritativa, o endpoint e a gravação ao novo contrato de 12 colunas, mantendo as proteções reutilizáveis da aplicação.

**Estado esperado**

O endpoint aceita somente o novo conjunto de campos, valida e normaliza os dados no servidor, preserva honeypot, rate limit, escrita literal e idempotência, e grava as colunas na ordem definida na especificação.

**Dependências e pré-condições**

- Fase 3 aprovada.
- Para integração real é necessária uma nova planilha controlada com a aba e cabeçalhos exatos da seção 8 da especificação.
- A conta de serviço existente deve ter acesso somente conforme a necessidade operacional; credenciais não podem aparecer no navegador, diff ou logs.

**Tarefas concretas**

- Atualizar `api/submissions.js` para validar no servidor `id_submissao`, `nome_completo`, `cpf`, `telefone`, `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `uf` e o honeypot `website` vazio; rejeitar os campos do formulário anterior.
- Reutilizar as funções de validação existentes quando compatíveis, evitando regras divergentes entre navegador e servidor.
- Normalizar CPF para 11 dígitos, telefone para E.164 com `+55`, CEP para oito dígitos e textos removendo espaços nas extremidades; manter complemento vazio como texto vazio.
- Alterar a linha persistida para a ordem A–L: `id_submissao`, `data_hora_envio`, `nome_completo`, `cpf`, `telefone`, `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `uf`.
- Gravar `data_hora_envio` como `DD/MM/AAAA | HH:MM` no fuso `America/Sao_Paulo`, como valor literal; manter verificação de UUID antes de inserir, rate limit configurável e mensagens genéricas sem dados pessoais nos logs ou respostas.
- Atualizar testes de `api/submissions.js` e integração para cobrir campos removidos, campos requeridos, normalização, honeypot, limite, status HTTP e idempotência.
- Não alterar a planilha antiga nem apontar o ambiente de validação para ela.

**Arquivos a modificar**

- `api/submissions.js`
- `js/validation.js`, se houver validação compartilhada compatível com execução server-side
- `test/api.test.js` e demais testes relevantes em `test/`
- `scripts/sheets-integration.js`, se os cabeçalhos ou variáveis do teste dependerem do esquema antigo
- `.env.example`, somente se for preciso documentar o nome da aba ou variáveis já aprovadas, sempre sem valores secretos

**Verificações**

- `npm run test:unit` cobrindo validação e contrato HTTP.
- Testes HTTP para 201, 200 idempotente, 400, 405, 415, 429 e 500.
- Teste de honeypot acionado e de limite configurado sem expor dados pessoais em logs.
- Teste de serialização para confirmar exatamente 12 valores, ordem A–L, timestamp brasileiro e ausência de fórmulas.
- Inspeção de logs e respostas para confirmar que CPF, telefone, endereço, credenciais e payload bruto não são expostos.

**Critérios e checkpoint**

`APROVADO` quando testes server-side demonstrarem validação equivalente, rejeição do contrato antigo, idempotência e linha de 12 colunas correta. A fase de integração externa permanece bloqueada até existir planilha de validação separada, com cabeçalhos corretos e acesso configurado.

### Fase 5 — Integração ponta a ponta e validação de qualidade

**Objetivo**

Comprovar o formulário completo com navegador, endpoint e planilha controlada, sem usar dados pessoais reais nem atingir o destino antigo.

**Estado esperado**

Os fluxos de sucesso, duplicidade, falha e preenchimento manual estão demonstrados com dados sintéticos. A linha criada corresponde ao novo esquema e os critérios de acessibilidade, responsividade, privacidade e segurança foram verificados.

**Dependências e pré-condições**

- Fases 1 a 4 aprovadas.
- Planilha de validação fornecida e distinguível da planilha de produção, aba com os 12 cabeçalhos na ordem definida e permissão de escrita configurada.
- Variáveis locais/server-side disponíveis sem divulgar seus valores.

**Tarefas concretas**

- Executar a aplicação localmente e validar o fluxo completo com dados sintéticos.
- Usar `scripts/sheets-integration.js` somente contra a planilha de validação controlada; confirmar escrita, leitura e retry do mesmo UUID sem duplicação.
- Verificar estados de ViaCEP com respostas de sucesso, inexistência e indisponibilidade, além de edição manual dos valores retornados.
- Verificar modal acessível, ordem de teclado, foco ao abrir/fechar, erros associados, status de consulta/envio anunciados e layout nos viewports suportados.
- Fazer inspeção de dependências, bundle, configuração e logs para encontrar secrets, envio indevido de dados ou exposição do esquema interno.
- Registrar em `.events/events.md` somente resultado, bloqueio ou checkpoint relevante.

**Arquivos a modificar**

- Corrigir arquivos da aplicação e testes estritamente necessários, conforme falhas encontradas.
- `scripts/sheets-integration.js` e fixtures de testes, se necessário para o novo contrato.
- `.events/events.md`, para evidência resumida do checkpoint.

**Verificações**

- `npm run build`
- `npm test`
- `npm run test:browser`
- `npm run test:sheets`, somente depois de confirmar que seu destino é a planilha de validação controlada.
- Comparar a linha escrita com as 12 colunas da especificação e confirmar contagem antes/depois para idempotência.
- Conferir que o checkout e a aplicação continuam sem rolagem horizontal e sem erros de console nos viewports testados.

**Critérios e checkpoint**

`APROVADO` quando os testes locais e de navegador passarem e a integração controlada confirmar uma linha válida e retry sem duplicidade. Se a planilha de validação ou as credenciais não estiverem disponíveis, registrar o bloqueio e não declarar a integração comprovada.

### Fase 6 — Preparação para liberação e publicação autorizada

**Objetivo**

Preparar um artefato revisável para Preview/produção e publicar somente após autorização explícita para o ambiente e destino correspondentes.

**Estado esperado**

Existe uma revisão final vinculada a um commit e um relatório de critérios. Nenhum domínio, variável externa ou planilha de produção é alterado por inferência. Se a publicação não for autorizada ou faltar pré-requisito, o resultado fica como “pronto para revisão”, sem alegar lançamento.

**Dependências e pré-condições**

- Checkpoints das fases anteriores aprovados.
- Aprovação do responsável para a publicação pretendida e definição explícita do projeto/ambiente Vercel e da planilha de produção.
- Variáveis de produção configuradas server-side e permissão da conta de serviço verificada.

**Tarefas concretas**

- Revisar diff, arquivos de configuração, segredos, destino Google, cabeçalhos e mensagens exibidas.
- Confirmar que a configuração Vercel usa o endpoint e as variáveis esperadas sem expor secrets no bundle.
- Preparar Preview e smoke checks sintéticos apenas no ambiente e destino autorizados.
- Antes de produção, confirmar que as variáveis apontam à nova planilha GS Materiais e que o destino antigo não será alterado.
- Publicar, alterar domínio, fazer push ou gravar na planilha de produção somente após autorização explícita para a ação correspondente.
- Registrar resultado, commit, ambiente e evidências em `.events/events.md` sem payload pessoal ou segredo.

**Arquivos a modificar**

- Configuração de deploy existente, somente se necessário e aprovado pelo escopo da especificação.
- `.events/events.md` para decisão e evidência da liberação.
- Não editar `ESPECIFICAÇÃO.md` nem substituir a planilha de referência.

**Verificações**

- Repetir `npm run build`, `npm test` e `npm run test:browser` no commit candidato.
- Verificar deployment e rota somente depois de uma publicação autorizada.
- Confirmar variáveis/ambiente sem imprimir valores, título, campos, consulta e submissão no ambiente liberado.
- Verificar que o resultado publicado não grava no destino antigo.

**Critérios e checkpoint**

`APROVADO` como “publicado” somente quando houver autorização, deployment verificado, rota funcional e smoke check permitido. Sem esses elementos, classificar apenas como “implementação validada em ambiente controlado” ou “pronta para revisão”, conforme a evidência disponível.

## 3. Validação final

A conclusão da refatoração depende dos critérios de aceitação da seção 13 da `ESPECIFICAÇÃO-GS-MATERIAIS.md`, além da evidência dos checkpoints. A validação final deve distinguir o que foi comprovado localmente, na planilha de validação e em produção.

**Checklist de conclusão**

- A interface contém o título, a instrução e um único card conforme a especificação; não exibe a marca antiga nem campos antigos.
- O fundo verde segue a amostra fornecida, com amarelo somente em detalhes discretos.
- Os dez campos aparecem na ordem correta; somente Complemento é opcional e respeita 50 caracteres.
- CPF, telefone e CEP são validados no cliente e no servidor; CEP aceita somente oito dígitos.
- A consulta ViaCEP envia somente o CEP, preenche os campos corretos, mantém edição e permite preenchimento manual em falhas.
- Modal aparece somente após sucesso confirmado; ao fechar limpa os dados e o UUID; falhas preservam ambos.
- A planilha controlada recebe os 12 valores na ordem definida, como valores literais; retry do UUID não duplica a linha.
- Honeypot, rate limit, idempotência, credenciais server-side e logs sem dados pessoais permanecem ativos.
- Testes, ambiente, limitações e autorização de publicação estão descritos sem extrapolar a evidência.

O resultado final deve ser classificado como `CONCLUÍDO`, `PRONTO PARA REVISÃO` ou `NÃO CONCLUÍDO`, acompanhado dos critérios não atendidos e de seus bloqueios concretos. “CONCLUÍDO” não significa “publicado” sem evidência de liberação.

## 4. Matriz de rastreabilidade

| Requisito da especificação GS Materiais | Fase principal | Verificação ou evidência |
|---|---:|---|
| §§ 1–3: objetivo, escopo e exclusões | 1–2 | Revisão de escopo e inspeção dos campos/controles presentes |
| § 4: título, card, paleta, marca e responsividade | 2 e 5 | Inspeção do DOM e evidência visual por viewport |
| § 5: dez campos, ordem e obrigatoriedade | 2–3 | Teste estrutural, teclado, limites e validação |
| §§ 6.1–6.3: nome, CPF e telefone | 3–4 | Fixtures no navegador e endpoint, valores normalizados |
| §§ 6.4–6.5: CEP, ViaCEP e endereço manual | 3 e 5 | Casos de sucesso, erro, resposta atrasada e edição manual |
| § 7: envio, UUID, modal, retry e limpeza | 3 e 5 | HTTP 200/201 e falhas, estado antes/depois e idempotência |
| § 8: cabeçalhos e gravação em 12 colunas | 4–5 | Comparação posicional A–L na planilha controlada |
| § 9: contratos HTTP e ViaCEP | 3–5 | Matriz de status e inspeção da requisição de CEP |
| § 10: segurança e privacidade | 1, 4–6 | Inspeção de secrets, payloads, logs, rate limit e destino |
| § 11: acessibilidade e responsividade | 2 e 5 | Teclado, foco, anúncios, contraste e viewports |
| § 12: limites e dependências | 1, 5–6 | Bloqueios de planilha/serviço registrados e resultado classificado |
| § 13: critérios de aceitação | Validação final | Checklist com evidência associada a cada critério |
| § 14: configuração da nova planilha | 4–6 | Aba/cabeçalhos e destino validados sem expor credenciais |

## 5. Estratégia de testes e evidências

- Usar dados sintéticos em testes de validação, navegador e planilha. Não capturar CPF, telefone ou endereço de pessoas reais em evidências.
- Executar `npm run test:unit` durante as fases de validação e contrato; executar `npm test` e `npm run test:browser` na validação integrada.
- Executar `npm run test:sheets` somente após confirmar, sem exibir o ID em logs/documentos, que o destino configurado é a planilha de validação fornecida para GS Materiais.
- Guardar resultados objetivos: campos/ordem observados, matriz de casos, status HTTP, viewport, resultado de idempotência e contagem de linhas antes/depois.
- Não anexar `.env`, credenciais, respostas completas com dados pessoais nem payloads integrais. Remover ou mascarar identificadores de ambiente em evidências compartilháveis.
- Não executar os comandos deste plano durante sua elaboração; eles pertencem à futura implementação e validação.

## 6. Revisão crítica do plano

- O maior gate externo é a criação e identificação da nova planilha de validação. Sem ela, é possível implementar e testar localmente, mas não comprovar gravação real nem idempotência no Sheets.
- A busca ViaCEP depende de rede e serviço externo. Falhas devem manter o preenchimento manual disponível e não podem invalidar o endereço digitado.
- A implementação existente pode ter regras ou testes que divergem do novo contrato. A Fase 1 exige inspeção antes de adaptar, e as fases seguintes devem preservar idempotência, rate limit, honeypot e proteção de credenciais.
- A referência visual não fornece uma cor verde em código. A cor deve ser comparada visualmente com a imagem e permanecer sem alegação de valor oficial até aprovação explícita.
- Produção, domínio, planilha de produção e publicação não são pré-requisitos para concluir a validação local/controlada e exigem autorização própria antes de qualquer alteração externa.
