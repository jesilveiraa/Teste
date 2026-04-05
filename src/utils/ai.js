export async function generatePlan(brand, monthInfo, year, month) {
  if (!brand.apiKey) {
    throw new Error('Configure sua chave de API nas configurações da marca.');
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const monthName = monthNames[month];

  const prompt = `Você é um especialista em marketing digital para Instagram de escolas de idiomas.

MARCA: KNN Saguaçu — Escola de Idiomas
- Tom de voz: ${brand.tone}
- Público-alvo: ${brand.audience}
- Diferenciais: ${brand.differentials}
- Evitar: ${brand.avoid}

CONTEXTO DO MÊS (${monthName} ${year}):
- Foco do mês: ${monthInfo.focus || 'Não definido'}
- Promoções ativas: ${monthInfo.promotions || 'Nenhuma'}
- Datas comemorativas relevantes: ${monthInfo.dates || 'Nenhuma específica'}

TAREFA: Crie um planejamento de 8 posts para o Instagram, distribuídos ao longo das 4 semanas do mês. Devem ser exatamente 4 Reels e 4 Carrosséis.

Responda APENAS com um JSON válido (sem markdown, sem \`\`\`), no seguinte formato:
[
  {
    "date": "YYYY-MM-DD",
    "format": "reel" ou "carrossel",
    "theme": "tema do post",
    "script": "roteiro detalhado",
    "caption": "legenda completa para o Instagram",
    "hashtags": "#hashtag1 #hashtag2 ..."
  }
]

Distribua os posts nas semanas. Alterne entre reel e carrossel. Seja criativo e específico para a KNN Saguaçu — evite conteúdo genérico.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': brand.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erro da API: ${response.status} — ${err}`);
  }

  const result = await response.json();
  const text = result.content[0].text;

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Resposta da IA não contém JSON válido.');

  const posts = JSON.parse(jsonMatch[0]);
  return posts.map((p, i) => ({
    id: `${year}-${month}-${Date.now()}-${i}`,
    ...p,
    status: 'planned',
    metrics: null,
  }));
}
