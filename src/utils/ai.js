import { MONTH_NAMES, PILARES } from './constants.js';
import { KNN_MANUAL_VOICE, KNN_MANUAL_VOICE_COMPACT } from './knnManual.js';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

async function callClaude(apiKey, prompt, maxTokens = 4096) {
  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erro da API Anthropic (${response.status}): ${err}`);
  }

  const result = await response.json();
  return result.content[0].text;
}

function extractJSON(text) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Resposta da IA não contém JSON válido.');
  return JSON.parse(match[0]);
}

function buildBrandContext(brand) {
  return `MARCA: KNN Saguaçu — Escola de Idiomas (unidade local da rede nacional KNN Idiomas)
- Tom de voz local: ${brand.tone}
- Público-alvo: ${brand.audience}
- Diferenciais: ${brand.differentials}
- Evitar (regra local): ${brand.avoid}`;
}

// ============================================================================
// FASE 1: Gerar ideias (só temas, sem roteiros)
// ============================================================================

export async function generateIdeas(brand, monthInfo, year, month) {
  if (!brand.apiKey) {
    throw new Error('Configure sua chave de API Anthropic nas configurações da marca.');
  }

  const monthName = MONTH_NAMES[month];
  const pilaresAtivos = (monthInfo.pilares || [])
    .map((id) => PILARES.find((p) => p.id === id)?.label)
    .filter(Boolean);

  const pilaresDisponiveis = PILARES.map((p) => `  - ${p.id}: ${p.label}`).join('\n');

  const prompt = `Você é um especialista em marketing digital para Instagram de escolas de idiomas, seguindo OBRIGATORIAMENTE o Manual Oficial da marca KNN Idiomas reproduzido abaixo.

${KNN_MANUAL_VOICE_COMPACT}

${buildBrandContext(brand)}

CONTEXTO DO MÊS (${monthName} ${year}):
- Inegociáveis (campanhas, eventos, datas): ${monthInfo.inegociaveis || 'Nenhum'}
- Promoções ativas: ${monthInfo.promotions || 'Nenhuma'}
- Pilares editoriais priorizados este mês: ${pilaresAtivos.length ? pilaresAtivos.join(', ') : 'Todos os pilares'}

PILARES EDITORIAIS DISPONÍVEIS (use os IDs):
${pilaresDisponiveis}

TAREFA: Crie 12 ideias de conteúdo para o Instagram da KNN Saguaçu.

IMPORTANTE: todas as ideias devem respeitar o tom de voz e as regras de linguagem do Manual Oficial KNN acima. Não sugerir preços, promoções agressivas, comparações com concorrentes, promessas irreais ou gírias exageradas.

REGRAS DO MANUAL KNN (obrigatórias):
1. Distribuição de formatos: aproximadamente 55% reel, 30% carrossel, 15% estatico
2. Distribuição do funil: ~40% topo (atração), ~40% meio (relação), ~20% fundo (conversão)
3. Distribuição de objetivos: balanceado entre branding, engajamento, captacao e aquecimento
4. Priorize os pilares selecionados pelo usuário; se a lista estiver vazia, varie entre todos
5. Cada ideia deve ser ESPECÍFICA para a KNN Saguaçu — nada genérico
6. Títulos curtos e direto ao ponto (máximo 80 caracteres)

Responda APENAS com um JSON válido (sem markdown, sem \`\`\`), no formato:
[
  {
    "title": "título curto da ideia",
    "pillar": "id do pilar (um dos listados acima)",
    "format": "reel" ou "carrossel" ou "estatico",
    "funnel_stage": "topo" ou "meio" ou "fundo",
    "objective": "branding" ou "engajamento" ou "captacao" ou "aquecimento",
    "rationale": "breve explicação (1-2 frases) do porquê dessa ideia"
  }
]`;

  const text = await callClaude(brand.apiKey, prompt, 4096);
  const ideas = extractJSON(text);

  return ideas.map((idea) => ({
    year,
    month,
    title: idea.title,
    pillar: idea.pillar,
    format: idea.format,
    funnel_stage: idea.funnel_stage,
    objective: idea.objective,
    rationale: idea.rationale,
    status: 'pending',
    manual: false,
  }));
}

// ============================================================================
// FASE 2: Gerar roteiros completos para ideias aprovadas
// ============================================================================

export async function generateScripts(brand, approvedIdeas, monthInfo, year, month) {
  if (!brand.apiKey) {
    throw new Error('Configure sua chave de API Anthropic nas configurações da marca.');
  }
  if (!approvedIdeas.length) {
    throw new Error('Nenhuma ideia aprovada para gerar roteiro.');
  }

  const monthName = MONTH_NAMES[month];

  const ideasList = approvedIdeas
    .map((idea, i) => {
      const pilar = PILARES.find((p) => p.id === idea.pillar)?.label || idea.pillar;
      return `${i + 1}. [${idea.format} | ${pilar} | funil: ${idea.funnel_stage} | obj: ${idea.objective}] ${idea.title}
   Racional: ${idea.rationale || '-'}`;
    })
    .join('\n');

  const prompt = `Você é um redator especialista em Instagram para escolas de idiomas, seguindo OBRIGATORIAMENTE o Manual Oficial KNN Idiomas reproduzido abaixo.

${KNN_MANUAL_VOICE}

${buildBrandContext(brand)}

CONTEXTO DO MÊS (${monthName} ${year}):
- Inegociáveis: ${monthInfo.inegociaveis || 'Nenhum'}
- Promoções ativas: ${monthInfo.promotions || 'Nenhuma'}

IDEIAS APROVADAS (${approvedIdeas.length} ideias):
${ideasList}

TAREFA: Para CADA ideia acima (mantenha a mesma ordem e quantidade), gere um roteiro completo contendo:
- Um roteiro detalhado (para Reel: cenas/falas/ritmo; para Carrossel: slide por slide; para Estático: descrição visual e copy principal)
- Uma legenda pronta para o Instagram com CTA claro (WhatsApp ou link na bio)
- Hashtags (mix de local + temáticas, 8-15 hashtags)
- Data sugerida de publicação dentro do mês (formato YYYY-MM-DD)

REGRAS OBRIGATÓRIAS (do manual acima):
- Siga RIGOROSAMENTE os 7 princípios do tom de voz KNN
- Use as palavras do universo verbal KNN (transformação, evolução, conquista, etc.)
- NUNCA use palavras proibidas (perfeito, milagre, fluência garantida, "barato", "promoção", gírias exageradas)
- Reels: gancho nos primeiros 3 segundos (direto, emocional, impossível de ignorar)
- Carrosséis: capa com headline curta + promessa clara; 1 conceito por slide; CTA no final
- Estáticos: branding, frases inspiradoras ou comunicados institucionais
- CTAs permitidos: comentar, salvar, enviar DM, chamar no WhatsApp, visitar a unidade — SEM mencionar preços/valores
- Legendas: começar acolhedoras, mostrar benefício real, terminar com CTA claro mas respeitoso
- Nunca compare com concorrentes, nunca prometa resultado garantido, nunca exponha alunos

Responda APENAS com JSON válido (sem markdown, sem \`\`\`), na MESMA ORDEM das ideias:
[
  {
    "scheduled_date": "YYYY-MM-DD",
    "theme": "tema/título do post",
    "script": "roteiro detalhado completo",
    "caption": "legenda pronta com CTA",
    "hashtags": "#hashtag1 #hashtag2 ..."
  }
]

IMPORTANTE: retorne EXATAMENTE ${approvedIdeas.length} itens, um por ideia, na mesma ordem.`;

  const text = await callClaude(brand.apiKey, prompt, 8192);
  const scripts = extractJSON(text);

  if (scripts.length !== approvedIdeas.length) {
    throw new Error(
      `IA retornou ${scripts.length} roteiros, mas eram esperados ${approvedIdeas.length}.`
    );
  }

  return approvedIdeas.map((idea, i) => ({
    idea_id: idea.id,
    year,
    month,
    scheduled_date: scripts[i].scheduled_date,
    format: idea.format,
    pillar: idea.pillar,
    funnel_stage: idea.funnel_stage,
    objective: idea.objective,
    theme: scripts[i].theme || idea.title,
    script: scripts[i].script,
    caption: scripts[i].caption,
    hashtags: scripts[i].hashtags,
    status: 'planned',
  }));
}
