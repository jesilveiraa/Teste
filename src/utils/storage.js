const STORAGE_KEYS = {
  BRAND: 'knn_brand_config',
  MONTHS: 'knn_months_data',
  POSTS: 'knn_posts_data',
};

export function loadBrandConfig() {
  const data = localStorage.getItem(STORAGE_KEYS.BRAND);
  if (data) return JSON.parse(data);
  return {
    tone: 'Descontraído, acessível, próximo',
    audience: 'Faixa etária ampla — crianças a partir de 4 anos até adultos',
    differentials: 'Van exclusiva que busca alunos em casa, foco em conversação',
    avoid: 'Linguagem muito formal ou técnica',
    apiKey: '',
  };
}

export function saveBrandConfig(config) {
  localStorage.setItem(STORAGE_KEYS.BRAND, JSON.stringify(config));
}

export function loadMonthData(year, month) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.MONTHS) || '{}');
  const key = `${year}-${month}`;
  return all[key] || { focus: '', promotions: '', dates: '' };
}

export function saveMonthData(year, month, data) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.MONTHS) || '{}');
  all[`${year}-${month}`] = data;
  localStorage.setItem(STORAGE_KEYS.MONTHS, JSON.stringify(all));
}

export function loadPosts(year, month) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '{}');
  return all[`${year}-${month}`] || [];
}

export function savePosts(year, month, posts) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '{}');
  all[`${year}-${month}`] = posts;
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(all));
}
