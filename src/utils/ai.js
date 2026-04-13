import { MONTH_NAMES, PILARES } from './constants.js';

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
  return `MARCA: KNN Saguaçu — Escola de Idiomas
- Tom de voz: ${brand.tone}
- Público-alvo: ${brand.audience}
- Diferenciais: ${brand.differentials}
- Evitar: ${brand.avoid}`;
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

  const prompt = `Você é um especialista em marketing digital para Instagram de escolas de idiomas, seguindo o Manual Oficial da marca KNN Idiomas.

${buildBrandContext(brand)}

CONTEXTO DO MÊS (${monthName} ${year}):
- Inegociáveis (campanhas, eventos, datas): ${monthInfo.inegociaveis || 'Nenhum'}
- Promoções ativas: ${monthInfo.promotions || 'Nenhuma'}
- Pilares editoriais priorizados este mês: ${pilaresAtivos.length ? pilaresAtivos.join(', ') : 'Todos os pilares'}

PILARES EDITORIAIS DISPONÍVEIS (use os IDs):
${pilaresDisponiveis}

TAREFA: Crie 12 ideias de conteúdo para o Instagram da KNN Saguaçu.

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

  const prompt = `Você é um redator especialista em Instagram para escolas de idiomas, seguindo o Manual Oficial KNN.

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

REGRAS:
- Reels: ter gancho nos primeiros 3 segundos (manual cap. 6)
- Carrosséis: capa com headline forte e promessa clara (manual cap. 7)
- Evite linguagem formal/técnica e promessas irreais
- CTA direto mas respeitoso

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
