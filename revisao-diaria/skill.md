# Revisão Diária

Este skill executa a rotina de revisão diária de Jéssica, processando e-mails, WhatsApp, tarefas e agenda do dia. É composta por 5 etapas executadas em sequência, e finaliza com um resumo consolidado no Notion.

## Contexto de vida de Jéssica

Use este contexto para categorizar tarefas, priorizar o dia e conectar ações a objetivos ativos:

**Áreas de foco pessoais:** Relacionamentos · Lazer & Hobbies · Casa · Finanças · Carreira · Saúde & Espiritualidade

**Frentes profissionais:**

- **LÍNIA** (sempre maiúsculo) — consultoria própria, foco principal. Objetivos ativos: faturar R$30k em 2026, estruturar metodologia, aprender IA aplicada a pequenos negócios, implementar metodologia Raízes, atingir 8 clientes a R$2k/mês
- **KNN Saguaçu** — escola de inglês. Objetivos ativos: atingir 400 alunos (2026), automatizar processos, não pegar empréstimo até Dez/26. Plano de venda em ~3 anos
- **Doquia** — consultora contratada de processos, papel temporário

**Objetivos pessoais de 0-2 anos em aberto:** R$270k investidos (Dez/26), networking com empresários, rotina de estudos diária, ler 10 livros, viagem com família de origem, date mensal com Paulo, manter terapia em dia, exercícios 3-4x/semana, campeonato de tênis (Dez/27)

## Antes de começar

- WhatsApp Web já estará logado — pode usar diretamente
- Se encontrar qualquer problema de acesso em Gmail, WhatsApp ou outros serviços, avise imediatamente antes de tentar prosseguir

---

## Etapa 1: Revisar E-mail (Gmail)

> **Nota técnica:** As ferramentas MCP do Gmail permitem apenas leitura e criação de rascunhos. Para aplicar labels, arquivar ou excluir e-mails, use o Gmail via navegador (Chrome).

### Limpeza

- Identifique e-mails de lojas e promoções — apenas reconheça quais são, Jéssica os excluirá.
- Na dúvida se algo é propaganda, prefira manter — errar pelo lado conservador.

### Classificação e ações

Para cada e-mail restante, identifique a natureza e aja conforme abaixo. Jéssica cuida das labels e do arquivamento — foque nas ações que você pode executar:

- **É um evento ou compromisso com data/hora** (ex: assembleia, reunião agendada, prazo fixo com presença necessária)
  → Crie um evento no Google Calendar com título, data, hora e descrição relevante. Não crie tarefa no Notion para esses casos.
  → Se o evento for de natureza familiar ou de condomínio (ex: assembleia de condomínio, evento social), inclua o marido como convidado: paulo.brandalise@gmail.com
- **Demanda uma ação ou tarefa** (ex: renovar algo, verificar documento, responder)
  → Crie uma tarefa no Notion (Ações - Master, status: Inbox) com título e contexto relevante.
- **Aguardando resposta de alguém** → Apenas registre no resumo para Jéssica aplicar a label "2. Aguardando".
- **Importante mas sem ação** → Apenas registre no resumo para Jéssica arquivar.
- **Já tem label adequada** → Ignore, não precisa fazer nada.

### Rascunhos de resposta

- Para e-mails que demandam resposta de Jéssica, crie um rascunho no Gmail via MCP (não envie).
- Escreva a resposta mais provável com base no contexto, sinalizando os trechos que Jéssica precisará confirmar ou personalizar antes de enviar.

---

## Etapa 2: Revisar WhatsApp

Acesse o WhatsApp Web no navegador (já deve estar logado).

> **Nota técnica:** O WhatsApp Web não responde a cliques programáticos via JavaScript. Use sempre a ferramenta computer com left_click para interagir — cliques reais funcionam corretamente com o React do WhatsApp Web.
>
> **Fluxo:** navigate para https://web.whatsapp.com/ → screenshot para ver a tela → left_click na conversa desejada na lista lateral.

### Conversa "Caixa de Entrada"

- Abra a conversa chamada "Caixa de Entrada" — use computer + left_click diretamente na conversa visível na lista (ela costuma aparecer fixada no topo)
- Encontre a última mensagem **OK** na conversa
- Processe apenas o que está **abaixo** do último OK — o que está acima já foi processado
- Para cada item abaixo do OK:
  - Se for um item de ação → crie uma tarefa no Notion (Ações - Master, status: Inbox)
  - Se não for uma tarefa → guarde para encaminhar após o OK
- Ao terminar: use computer + left_click no campo de texto da conversa, type o texto `OK` e pressione key Enter para enviar
- Após o OK: encaminhe na mesma conversa os itens que não são tarefas (usando o mesmo método: click no campo → type → Enter), para que Jéssica os veja e decida o que fazer com eles

### Demais conversas não arquivadas

- Tire um screenshot para ver a lista completa de conversas não arquivadas.
- Identifique quais tiveram atualização desde a última revisão. (Jéssica já arquiva conversas resolvidas — só as não arquivadas são relevantes.)
- Para abrir cada conversa: use computer + left_click na conversa da lista.
- Para cada conversa com atualização: identifique itens com ação definida → crie tarefa no Notion (Ações - Master, status: Inbox)

---

## Etapa 3: Processar Tarefas no Notion

Após criar todas as tarefas nas etapas anteriores:

- Acesse a página **Ações - Master** no Notion
- Para cada tarefa recém-criada com status **Inbox**, identifique e preencha (quando possível):
  - **Contexto:** área de vida ou trabalho à qual a tarefa pertence — use as áreas de foco do contexto acima (ex: LÍNIA, KNN, Relacionamentos, Finanças, Saúde etc.)
  - **Projeto relacionado:** se a tarefa faz parte de um projeto existente, vincule

---

## Etapa 4: Montar o Planejamento Real do Dia

O objetivo desta etapa é construir um planejamento que Jéssica possa realmente usar — não apenas listar o que chegou hoje, mas cruzar todas as fontes do sistema dela em ordem de prioridade.

**Ordem de prioridade fixa:**

1. Agenda (compromissos fixos no Calendar)
2. Tarefas recorrentes do dia
3. Tarefas com prazo para hoje (ou atrasadas)
4. (Só se sobrar tempo) Sugestões do backlog alinhadas a objetivos

### 4.1 — Compromissos fixos (Google Calendar)

- Liste todos os eventos agendados para hoje com horário.
- Estime o tempo bloqueado e quanto tempo livre sobra no dia.

### 4.2 — Tarefas recorrentes do dia (Notion)

- Acesse: https://www.notion.so/jesilveira/9ff396fca7504e948ebf9a00bf27f905
- Identifique quais recorrentes se aplicam a hoje (por dia da semana ou frequência).
- Estas entram no planejamento com **segunda prioridade**, logo após os compromissos.

### 4.3 — Tarefas com prazo para hoje ou em andamento (Notion)

- Acesse o banco **Ações - Master**: https://www.notion.so/jesilveira/7f15aad5243d4192951ff8495748a53d
- Filtre: tarefas com prazo = hoje, tarefas atrasadas (prazo passado), e tarefas com status "In Progress" — independentemente do prazo.
- Estas entram com **terceira prioridade**.

### 4.4 — Avaliar se o dia está cheio ou tranquilo

Com base no que foi levantado nas etapas 4.1, 4.2 e 4.3, estime o volume do dia:

- **Dia cheio:** os compromissos fixos + recorrentes + tarefas com prazo já preenchem o tempo disponível.
  → Não consulte o backlog. Se necessário, sugira o que pode ser movido para outro dia.
- **Dia tranquilo:** sobra tempo útil após cobrir as prioridades fixas.
  → Consulte o backlog e sugira até 3 tarefas para antecipar (ver 4.5).

### 4.5 — Sugestões do backlog (somente em dias tranquilos)

- No banco **Ações - Master**, olhe tarefas com status "Inbox" ou sem prazo definido.
- Priorize: (1) alinhamento com objetivos ativos — especialmente **LÍNIA**, que é o foco principal do ano; (2) contexto compatível com o dia; (3) esforço viável no tempo disponível.
- Apresente como sugestões, não obrigações. Se nenhuma fizer sentido para hoje, diga isso.

### Sugestão de distribuição por turno

Com base em tudo levantado, monte o planejamento:

- **Manhã:** tarefas de maior foco/energia (priorize LÍNIA e tarefas cognitivas pesadas)
- **Tarde:** reuniões, recorrentes operacionais, tarefas mais simples

O objetivo não é rigidez de horário — é dar a Jéssica uma visão clara do dia antes de começar.

Se o dia não tiver nenhuma ação avançando os objetivos mais importantes (especialmente **LÍNIA**), sinalize isso brevemente.

### Aviso de sobrecarga

Se o dia estiver com mais tarefas do que o tempo comporta, inclua um aviso claro sugerindo quais itens podem ser movidos para outro dia.

---

## Etapa 5: Lembrete SEBRAE

Crie uma tarefa no Notion para que Jéssica verifique o portal SEBRAE por conta própria:

- **Página:** Ações - Master
- **Título:** Verificar SEBRAE — aceite de proposta
- **Status:** Inbox
- **Contexto:** 💻 Computador
- **Prazo:** hoje
- **Conteúdo:** Acessar https://sgf.sebrae.com.br/Home/ e verificar se há novas demandas de consultoria na seção "Aceite de proposta".

> Não acesse o portal diretamente — o portal não salva sessão e requer login manual de Jéssica.

---

## Resumo Final

Ao concluir todas as etapas, crie uma tarefa no Notion:

- **Página:** Ações - Master
- **Status:** Inbox
- **Título:** Resumo do dia de hoje — [data de hoje no formato DD/MM/AAAA]
- **Corpo da tarefa:**
  - **E-mail:** lista dos e-mails que precisam de ação manual de Jéssica (labels "2. Aguardando" e arquivamento) + rascunhos criados
  - **WhatsApp:** tarefas criadas a partir da "Caixa de Entrada" e das demais conversas
  - **Agenda:** sugestão de distribuição do dia por turno (manhã / tarde)
  - **Aviso de sobrecarga** (se houver)

> Não inclua no resumo a lista de tarefas criadas no Notion nem os eventos criados no Calendar — esses já estão visíveis diretamente nas ferramentas. Foque no que Jéssica precisa fazer manualmente.
