# Prompt único de execução do GS Materiais

Copie o bloco abaixo para iniciar a implementação. Ele orienta o agente a executar todas as fases em sequência, verificar cada gate e continuar sem pedir aprovação entre fases. O agente deve parar quando uma dependência externa ou autorização realmente necessária impedir a conclusão segura da fase atual.

```text
Você é o agente responsável por implementar e validar a refatoração GS Materiais neste repositório. Execute o trabalho de forma contínua, fase a fase, sem pedir aprovação entre fases. Não encerre uma fase até que seu código esteja construído, testado e validado contra os critérios correspondentes. Só então avance.

## Objetivo

Refatore a aplicação existente para cumprir integralmente `ESPECIFICAÇÃO-GS-MATERIAIS.md`, seguindo as fases, dependências, verificações e critérios de `PLANO-GS-MATERIAIS.md`.

## Fontes de verdade

1. `ESPECIFICAÇÃO-GS-MATERIAIS.md` define o resultado funcional e visual.
2. `ESPECIFICAÇÃO.md` permanece preservada e fornece regras reutilizáveis quando a especificação GS Materiais as referencia.
3. `PLANO-GS-MATERIAIS.md` define a sequência de implementação e os gates.
4. O código e os testes atuais determinam o baseline técnico. Confirme seu estado antes de alterar arquivos; documentos antigos não provam o estado atual do código.

Se houver conflito, não invente uma regra nem altere silenciosamente uma especificação. Registre a divergência e pare no gate afetado, informando o trecho e a decisão necessária.

## Regras de execução

- Comece lendo as duas especificações, o plano, `README.md`, `.events/events.md`, `package.json` e `git status --short`.
- Preserve todo trabalho preexistente. Não use `git reset`, `git checkout`, `git clean` ou comandos equivalentes para descartar mudanças.
- Não altere nem apague `ESPECIFICAÇÃO.md`. Não recrie arquivos ou infraestrutura que já existam sem justificar a necessidade com evidência do repositório.
- Implemente o formulário único com o título “GS Materiais”, a instrução “Preencha seus dados nos campos abaixo.” e um único card “Dados pessoais”. Use o verde escuro da referência fornecida e deixe o amarelo em detalhes discretos. Remova a marca Encompasso, o símbolo E e os campos que não constam na especificação.
- Mantenha os dez campos e sua ordem definida na especificação: nome completo, CPF, telefone, CEP, logradouro, número, complemento, bairro, cidade e UF. Somente complemento é opcional e aceita até 50 caracteres.
- Valide CPF, telefone e CEP no navegador e no servidor. O CEP aceita exatamente oito números. Ao completar oito dígitos, consulte o ViaCEP, preencha logradouro, bairro, cidade e UF, mantenha os campos editáveis e permita preenchimento manual quando a consulta falhar. Envie ao ViaCEP somente o CEP.
- Preserve UUID, idempotência, honeypot, rate limit, escrita literal no Sheets, validação server-side e logs sem dados pessoais. Alinhe o endpoint ao esquema de 12 colunas da especificação e rejeite o contrato antigo.
- Exiba o modal “Cadastro enviado com sucesso” somente após HTTP 200 ou 201. Fechar o modal limpa o formulário e o UUID concluído. Falhas preservam dados e UUID e permitem nova tentativa.
- Use dados sintéticos. Não coloque dados pessoais ou credenciais em testes, logs, documentação ou evidências.
- Não mostre segredos ao terminal, não os copie para arquivos rastreáveis e não os inclua em evidências.
- Não grave na planilha original ou em qualquer planilha sem confirmar que é a nova planilha de validação autorizada para este trabalho. Não publique, altere domínio, faça push, commit ou escreva na planilha de produção sem autorização explícita para a ação correspondente.
- Não pare para perguntar se pode iniciar a próxima fase. Se faltar informação ou acesso necessário a uma operação externa, conclua o trabalho local independente dentro da fase atual e pare no gate que depende desse recurso. Faça uma pergunta específica somente quando a resposta permitir retomar a fase bloqueada.
- Não marque como testado ou validado o que não executou e observou. Registre comandos, resultados, escopo e limites das verificações.

## Protocolo obrigatório de fases

Execute as seis fases de `PLANO-GS-MATERIAIS.md` na ordem. Para cada fase:

1. Leia seus critérios, dependências e arquivos alvo.
2. Faça as alterações previstas e atualize os testes necessários.
3. Execute as verificações da fase e os testes de regressão afetados.
4. Inspecione os resultados reais, corrija falhas e repita os testes pertinentes.
5. Confira o diff e confirme que não introduziu dados, segredos ou mudanças fora do escopo.
6. Registre `APROVADO` somente quando cada critério tiver evidência observada. Registre o bloqueio exato quando algum critério depender de acesso ou autorização externa.
7. Só inicie a fase seguinte depois de aprovar o gate da fase atual.

Não pule gates, não substitua integração real por um mock e não declare a tarefa concluída se uma fase estiver bloqueada ou reprovada. Quando um teste não existir, crie a cobertura necessária no padrão já usado pelo repositório, sem remover os testes anteriores que ainda sejam úteis.

## Sequência de trabalho

### Fase 1: baseline

Inspecione o worktree, o formulário atual, validações, endpoint, esquema da planilha, scripts e testes. Identifique alterações preexistentes e bloqueios externos sem imprimir valores secretos. Não avance até saber como a aplicação funciona hoje e quais arquivos precisam mudar.

### Fase 2: formulário e identidade visual

Implemente o card único, os dez campos na ordem especificada, identidade visual verde com amarelo discreto, acessibilidade básica e layout responsivo. Verifique DOM, ordem de foco, conteúdo antigo removido e viewports mobile, tablet e desktop. Execute `npm run build`.

### Fase 3: regras do navegador e fluxo de envio

Implemente validações, consulta de CEP com respostas fora de ordem tratadas, preenchimento editável, fallback manual, UUID, estados de envio, modal e preservação em falhas. Cubra CPF válido/inválido, telefone com DDD válido/inválido, CEP com comprimentos e caracteres inválidos, ViaCEP encontrado/inexistente/indisponível, respostas atrasadas, HTTP 200/201/400/429/500 e falha de rede. Execute `npm run test:unit` e `npm run build`.

### Fase 4: servidor e contrato Sheets

Implemente validação server-side, rejeição do contrato antigo, normalização, respostas HTTP, honeypot, rate limit, idempotência e linha literal com 12 colunas na ordem das colunas A a L. Teste esses comportamentos com dependências controladas. Execute testes unitários e confirme que logs e respostas não expõem dados pessoais, credenciais ou detalhes internos. Não use a planilha antiga.

### Fase 5: integração ponta a ponta

Execute a aplicação localmente e os testes de navegador. Faça a integração real somente com a nova planilha de validação GS Materiais, com os cabeçalhos e permissões exigidos. Confirme escrita de uma linha sintética, leitura e retry do mesmo UUID sem duplicidade. Execute `npm test`, `npm run test:browser` e `npm run test:sheets` quando as pré-condições do plano estiverem atendidas.

Se a nova planilha, as credenciais necessárias ou a permissão não estiverem disponíveis, não improvise nem use outro destino. Finalize as validações locais seguras, marque a Fase 5 como `BLOQUEADA`, informe exatamente o recurso necessário e pare sem avançar para a Fase 6.

### Fase 6: preparação para liberação

Revise o diff, a configuração, os destinos e os critérios de aceitação. Repita `npm run build`, `npm test` e `npm run test:browser` no estado candidato. Prepare um resumo verificável. Faça deploy, smoke test externo, mudança de domínio, push, commit ou escrita de produção apenas se houver autorização explícita e se os gates anteriores estiverem aprovados. Sem autorização, encerre como `PRONTO PARA REVISÃO`, sem dizer que foi publicado.

## Conclusão e relatório

Antes de encerrar, confira cada critério da seção 13 da especificação GS Materiais e a matriz de rastreabilidade do plano. Atualize `README.md` somente se o índice documental ou uma descrição afetada pela implementação precisar de correção. Registre em `.events/events.md` decisões, bloqueios e checkpoints relevantes, sem histórico de comandos nem dados pessoais.

Entregue um relatório final com:

- status de cada uma das seis fases: `APROVADA`, `REPROVADA` ou `BLOQUEADA`;
- arquivos alterados e resumo objetivo do comportamento implementado;
- comandos de teste executados e resultado observado;
- evidências funcionais, visuais, de acessibilidade e de integração realmente coletadas;
- critérios não atendidos, motivo, risco e dado/acesso necessário para continuar;
- estado final classificado como `CONCLUÍDO`, `PRONTO PARA REVISÃO` ou `NÃO CONCLUÍDO`;
- confirmação explícita de que nenhuma publicação ou escrita externa não autorizada ocorreu.

Comece agora pela Fase 1. Continue automaticamente pelos gates aprovados até concluir todas as fases ou atingir um bloqueio externo real.
```
