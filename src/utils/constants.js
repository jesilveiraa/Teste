// Pilares editoriais do manual KNN (cap. 16)
export const PILARES = [
  { id: 'institucional', label: 'Institucional / Prova Social', color: '#7c3aed' },
  { id: 'mindset', label: 'Mindset Bilíngue', color: '#ec4899' },
  { id: 'cultura_digital', label: 'Cultura Digital / Pop', color: '#f59e0b' },
  { id: 'lifestyle', label: 'Lifestyle Global', color: '#10b981' },
  { id: 'cotidiano', label: 'Cotidiano KNN', color: '#3b82f6' },
  { id: 'atualidades', label: 'Atualidades & Curiosidades', color: '#06b6d4' },
  { id: 'educacional', label: 'Conteúdo Educacional', color: '#8b5cf6' },
];

export const PILARES_BY_ID = Object.fromEntries(PILARES.map((p) => [p.id, p]));

// Formatos de post (com proporções recomendadas do manual)
export const FORMATOS = [
  { id: 'reel', label: 'Reel', proporcao: '50-60%' },
  { id: 'carrossel', label: 'Carrossel', proporcao: '25-30%' },
  { id: 'estatico', label: 'Feed Estático', proporcao: '10-15%' },
];

// Estágios do funil (cap. 5 do manual)
export const FUNIL_STAGES = [
  { id: 'topo', label: 'Topo (Atração)', color: '#3b82f6' },
  { id: 'meio', label: 'Meio (Relação)', color: '#8b5cf6' },
  { id: 'fundo', label: 'Fundo (Conversão)', color: '#10b981' },
];

// Objetivos do post (decisão do usuário: 4 opções)
export const OBJETIVOS = [
  { id: 'branding', label: 'Branding', color: '#7c3aed' },
  { id: 'engajamento', label: 'Engajamento', color: '#ec4899' },
  { id: 'captacao', label: 'Captação', color: '#10b981' },
  { id: 'aquecimento', label: 'Aquecimento', color: '#f59e0b' },
];

// Status do workflow do post
export const POST_STATUS = {
  planned: 'Planejado',
  creating: 'Em criação',
  approved: 'Aprovado',
  published: 'Publicado',
};

export const POST_STATUS_COLORS = {
  planned: '#6b7280',
  creating: '#f59e0b',
  approved: '#3b82f6',
  published: '#10b981',
};

export const POST_STATUS_FLOW = ['planned', 'creating', 'approved', 'published'];

// Status das ideias
export const IDEA_STATUS = {
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
};

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
