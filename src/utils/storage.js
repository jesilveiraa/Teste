import { supabase } from './supabase.js';

const DEFAULT_BRAND = {
  tone: 'Descontraído, acessível, próximo',
  audience: 'Faixa etária ampla — crianças a partir de 4 anos até adultos',
  differentials: 'Van exclusiva que busca alunos em casa, foco em conversação',
  avoid: 'Linguagem muito formal ou técnica',
  apiKey: '',
};

// ============================================================================
// Brand config (linha única compartilhada)
// ============================================================================

export async function loadBrandConfig() {
  const { data, error } = await supabase.from('brand_config').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  if (!data) return { ...DEFAULT_BRAND };
  return {
    tone: data.tone || DEFAULT_BRAND.tone,
    audience: data.audience || DEFAULT_BRAND.audience,
    differentials: data.differentials || DEFAULT_BRAND.differentials,
    avoid: data.avoid || DEFAULT_BRAND.avoid,
    apiKey: data.api_key || '',
  };
}

export async function saveBrandConfig(config) {
  const { error } = await supabase.from('brand_config').upsert(
    {
      id: 1,
      tone: config.tone,
      audience: config.audience,
      differentials: config.differentials,
      avoid: config.avoid,
      api_key: config.apiKey,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (error) throw error;
}

// ============================================================================
// Month data (inegociáveis, promoções, pilares selecionados)
// ============================================================================

const DEFAULT_MONTH = { promotions: '', inegociaveis: '', pilares: [] };

export async function loadMonthData(year, month) {
  const { data, error } = await supabase
    .from('months')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ...DEFAULT_MONTH };
  return {
    promotions: data.promotions || '',
    inegociaveis: data.inegociaveis || '',
    pilares: data.pilares || [],
  };
}

export async function saveMonthData(year, month, monthData) {
  const { error } = await supabase.from('months').upsert(
    {
      year,
      month,
      promotions: monthData.promotions || '',
      inegociaveis: monthData.inegociaveis || '',
      pilares: monthData.pilares || [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'year,month' }
  );
  if (error) throw error;
}

// ============================================================================
// Ideas (fase de aprovação antes do roteiro)
// ============================================================================

export async function loadIdeas(year, month) {
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function insertIdeas(ideas) {
  if (!ideas.length) return [];
  const { data, error } = await supabase.from('ideas').insert(ideas).select();
  if (error) throw error;
  return data || [];
}

export async function updateIdea(id, updates) {
  const { error } = await supabase.from('ideas').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteIdea(id) {
  const { error } = await supabase.from('ideas').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================================
// Posts (roteiros completos com workflow)
// ============================================================================

export async function loadPosts(year, month) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .order('scheduled_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

export async function loadAllPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function insertPosts(posts) {
  if (!posts.length) return [];
  const { data, error } = await supabase.from('posts').insert(posts).select();
  if (error) throw error;
  return data || [];
}

export async function updatePost(id, updates) {
  const { error } = await supabase.from('posts').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deletePost(id) {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}
