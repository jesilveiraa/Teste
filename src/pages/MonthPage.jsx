import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';
import { loadMonthData, saveMonthData, loadPosts, savePosts, loadBrandConfig } from '../utils/storage.js';
import { generatePlan } from '../utils/ai.js';
import PostCard from '../components/PostCard.jsx';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function MonthPage() {
  const { year, month } = useParams();
  const y = parseInt(year);
  const m = parseInt(month);

  const [monthData, setMonthData] = useState(() => loadMonthData(y, m));
  const [posts, setPosts] = useState(() => loadPosts(y, m));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    saveMonthData(y, m, monthData);
  }, [monthData, y, m]);

  useEffect(() => {
    savePosts(y, m, posts);
  }, [posts, y, m]);

  const updateMonth = (field, value) => {
    setMonthData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const brand = loadBrandConfig();
      const newPosts = await generatePlan(brand, monthData, y, m);
      setPosts(newPosts);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const updatePost = (id, updates) => {
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const reels = posts.filter(p => p.format === 'reel');
  const carousels = posts.filter(p => p.format === 'carrossel');

  return (
    <div className="month-page">
      <h1>{MONTH_NAMES[m]} {y}</h1>

      <section className="month-form">
        <h2>Planejamento do mês</h2>
        <div className="form-group">
          <label>Foco do mês</label>
          <input
            value={monthData.focus}
            onChange={e => updateMonth('focus', e.target.value)}
            placeholder="Ex: Matrículas abertas, volta às aulas..."
          />
        </div>
        <div className="form-group">
          <label>Promoções ativas</label>
          <input
            value={monthData.promotions}
            onChange={e => updateMonth('promotions', e.target.value)}
            placeholder="Ex: 20% na primeira mensalidade, indique um amigo..."
          />
        </div>
        <div className="form-group">
          <label>Datas comemorativas relevantes</label>
          <input
            value={monthData.dates}
            onChange={e => updateMonth('dates', e.target.value)}
            placeholder="Ex: Dia das Crianças, Halloween..."
          />
        </div>

        <button
          className="btn btn-primary btn-generate"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <><Loader2 size={18} className="spin" /> Gerando com IA...</>
          ) : (
            <><Sparkles size={18} /> Gerar planejamento</>
          )}
        </button>

        {error && <div className="error-msg">{error}</div>}
      </section>

      {posts.length > 0 && (
        <section className="posts-section">
          {reels.length > 0 && (
            <>
              <h2 className="section-title">Reels ({reels.length})</h2>
              <div className="posts-grid">
                {reels.map(post => (
                  <PostCard key={post.id} post={post} onUpdate={updatePost} />
                ))}
              </div>
            </>
          )}

          {carousels.length > 0 && (
            <>
              <h2 className="section-title">Carrosséis ({carousels.length})</h2>
              <div className="posts-grid">
                {carousels.map(post => (
                  <PostCard key={post.id} post={post} onUpdate={updatePost} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
