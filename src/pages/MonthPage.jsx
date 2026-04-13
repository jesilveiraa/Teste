import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Loader2, FileText, Plus } from 'lucide-react';
import {
  loadMonthData,
  saveMonthData,
  loadPosts,
  loadIdeas,
  insertIdeas,
  updateIdea,
  deleteIdea,
  insertPosts,
  updatePost as persistPost,
  loadBrandConfig,
} from '../utils/storage.js';
import { generateIdeas, generateScripts } from '../utils/ai.js';
import { PILARES, MONTH_NAMES } from '../utils/constants.js';
import PostCard from '../components/PostCard.jsx';
import IdeaCard from '../components/IdeaCard.jsx';

const EMPTY_MONTH = { promotions: '', inegociaveis: '', pilares: [] };

export default function MonthPage() {
  const { year, month } = useParams();
  const y = parseInt(year);
  const m = parseInt(month);

  const [monthData, setMonthData] = useState(EMPTY_MONTH);
  const [ideas, setIdeas] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [generatingScripts, setGeneratingScripts] = useState(false);
  const [error, setError] = useState('');
  const [ideaFilter, setIdeaFilter] = useState('all');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualIdea, setManualIdea] = useState({
    title: '',
    pillar: '',
    format: 'reel',
    funnel_stage: 'topo',
    objective: 'branding',
    rationale: '',
  });

  // Carregar tudo ao entrar no mês
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingInitial(true);
      setError('');
      try {
        const [md, ids, ps] = await Promise.all([
          loadMonthData(y, m),
          loadIdeas(y, m),
          loadPosts(y, m),
        ]);
        if (!active) return;
        setMonthData(md);
        setIdeas(ids);
        setPosts(ps);
      } catch (err) {
        if (active) setError(err.message || 'Erro ao carregar dados.');
      } finally {
        if (active) setLoadingInitial(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [y, m]);

  const updateMonthField = useCallback(
    async (field, value) => {
      const next = { ...monthData, [field]: value };
      setMonthData(next);
      try {
        await saveMonthData(y, m, next);
      } catch (err) {
        setError('Erro ao salvar: ' + err.message);
      }
    },
    [monthData, y, m]
  );

  const togglePilar = (id) => {
    const current = monthData.pilares || [];
    const next = current.includes(id) ? current.filter((p) => p !== id) : [...current, id];
    updateMonthField('pilares', next);
  };

  const handleGenerateIdeas = async () => {
    setError('');
    setGeneratingIdeas(true);
    try {
      const brand = await loadBrandConfig();
      const newIdeas = await generateIdeas(brand, monthData, y, m);
      const saved = await insertIdeas(newIdeas);
      setIdeas((prev) => [...prev, ...saved]);
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingIdeas(false);
    }
  };

  const handleUpdateIdea = async (id, updates) => {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    try {
      await updateIdea(id, updates);
    } catch (err) {
      setError('Erro ao atualizar ideia: ' + err.message);
    }
  };

  const handleDeleteIdea = async (id) => {
    if (!confirm('Excluir esta ideia?')) return;
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteIdea(id);
    } catch (err) {
      setError('Erro ao excluir ideia: ' + err.message);
    }
  };

  const handleAddManualIdea = async () => {
    if (!manualIdea.title.trim()) return;
    try {
      const saved = await insertIdeas([
        { ...manualIdea, year: y, month: m, manual: true, status: 'approved' },
      ]);
      setIdeas((prev) => [...prev, ...saved]);
      setManualIdea({
        title: '',
        pillar: '',
        format: 'reel',
        funnel_stage: 'topo',
        objective: 'branding',
        rationale: '',
      });
      setShowManualForm(false);
    } catch (err) {
      setError('Erro ao adicionar ideia: ' + err.message);
    }
  };

  const handleGenerateScripts = async () => {
    setError('');
    const approved = ideas.filter((i) => i.status === 'approved');
    if (!approved.length) {
      setError('Nenhuma ideia aprovada.');
      return;
    }

    // Filtra as que ainda não viraram post
    const alreadyHasPost = new Set(posts.map((p) => p.idea_id).filter(Boolean));
    const pending = approved.filter((i) => !alreadyHasPost.has(i.id));

    if (!pending.length) {
      setError('Todas as ideias aprovadas já possuem roteiro.');
      return;
    }

    setGeneratingScripts(true);
    try {
      const brand = await loadBrandConfig();
      const newPosts = await generateScripts(brand, pending, monthData, y, m);
      const saved = await insertPosts(newPosts);
      setPosts((prev) => [...prev, ...saved]);
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingScripts(false);
    }
  };

  const handleUpdatePost = async (id, updates) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    try {
      await persistPost(id, updates);
    } catch (err) {
      setError('Erro ao atualizar post: ' + err.message);
    }
  };

  const filteredIdeas = ideas.filter((i) => {
    if (ideaFilter === 'all') return true;
    return i.status === ideaFilter;
  });

  const approvedCount = ideas.filter((i) => i.status === 'approved').length;
  const pendingCount = ideas.filter((i) => i.status === 'pending').length;
  const rejectedCount = ideas.filter((i) => i.status === 'rejected').length;

  const reels = posts.filter((p) => p.format === 'reel');
  const carrosseis = posts.filter((p) => p.format === 'carrossel');
  const estaticos = posts.filter((p) => p.format === 'estatico');

  if (loadingInitial) {
    return (
      <div className="loading-screen">
        <Loader2 size={32} className="spin" />
        <p>Carregando mês...</p>
      </div>
    );
  }

  return (
    <div className="month-page">
      <h1>
        {MONTH_NAMES[m]} {y}
      </h1>

      {/* ===== FORMULÁRIO DO MÊS ===== */}
      <section className="month-form">
        <h2>Planejamento do mês</h2>
        <div className="form-group">
          <label>Inegociáveis do mês</label>
          <textarea
            rows={2}
            value={monthData.inegociaveis}
            onChange={(e) => updateMonthField('inegociaveis', e.target.value)}
            placeholder="Datas oficiais KNN, eventos internos, datas comemorativas... Ex: Semana do aluno 5-10/05, Dia das Mães 12/05"
          />
        </div>
        <div className="form-group">
          <label>Promoções ativas</label>
          <input
            value={monthData.promotions}
            onChange={(e) => updateMonthField('promotions', e.target.value)}
            placeholder="Ex: 20% na primeira mensalidade, indique um amigo..."
          />
        </div>
        <div className="form-group">
          <label>Pilares editoriais do mês (marque 4-7)</label>
          <div className="pilares-grid">
            {PILARES.map((p) => {
              const active = (monthData.pilares || []).includes(p.id);
              return (
                <label
                  key={p.id}
                  className={`pilar-chip ${active ? 'active' : ''}`}
                  style={active ? { borderColor: p.color, background: p.color + '22' } : {}}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => togglePilar(p.id)}
                  />
                  <span style={{ color: active ? p.color : undefined }}>{p.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <button
          className="btn btn-primary btn-generate"
          onClick={handleGenerateIdeas}
          disabled={generatingIdeas}
        >
          {generatingIdeas ? (
            <>
              <Loader2 size={18} className="spin" /> Gerando ideias...
            </>
          ) : (
            <>
              <Sparkles size={18} /> Gerar ideias com IA
            </>
          )}
        </button>

        {error && <div className="error-msg">{error}</div>}
      </section>

      {/* ===== FASE DE IDEIAS ===== */}
      {ideas.length > 0 && (
        <section className="ideas-section">
          <div className="ideas-header">
            <h2>Ideias do mês</h2>
            <div className="ideas-stats">
              <span>Total: {ideas.length}</span>
              <span className="stat-approved">✓ {approvedCount}</span>
              <span className="stat-pending">● {pendingCount}</span>
              <span className="stat-rejected">✗ {rejectedCount}</span>
            </div>
          </div>

          <div className="ideas-toolbar">
            <div className="idea-filters">
              <button
                className={`filter-btn ${ideaFilter === 'all' ? 'active' : ''}`}
                onClick={() => setIdeaFilter('all')}
              >
                Todas
              </button>
              <button
                className={`filter-btn ${ideaFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setIdeaFilter('pending')}
              >
                Pendentes
              </button>
              <button
                className={`filter-btn ${ideaFilter === 'approved' ? 'active' : ''}`}
                onClick={() => setIdeaFilter('approved')}
              >
                Aprovadas
              </button>
              <button
                className={`filter-btn ${ideaFilter === 'rejected' ? 'active' : ''}`}
                onClick={() => setIdeaFilter('rejected')}
              >
                Rejeitadas
              </button>
            </div>

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowManualForm(!showManualForm)}
            >
              <Plus size={14} /> Adicionar ideia
            </button>
          </div>

          {showManualForm && (
            <div className="manual-idea-form">
              <h4>Nova ideia manual</h4>
              <div className="form-group">
                <label>Título</label>
                <input
                  value={manualIdea.title}
                  onChange={(e) => setManualIdea({ ...manualIdea, title: e.target.value })}
                  placeholder="Ex: Bastidores do primeiro dia de aula"
                />
              </div>
              <div className="manual-row">
                <select
                  value={manualIdea.pillar}
                  onChange={(e) => setManualIdea({ ...manualIdea, pillar: e.target.value })}
                >
                  <option value="">Pilar...</option>
                  {PILARES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <select
                  value={manualIdea.format}
                  onChange={(e) => setManualIdea({ ...manualIdea, format: e.target.value })}
                >
                  <option value="reel">Reel</option>
                  <option value="carrossel">Carrossel</option>
                  <option value="estatico">Estático</option>
                </select>
                <select
                  value={manualIdea.funnel_stage}
                  onChange={(e) => setManualIdea({ ...manualIdea, funnel_stage: e.target.value })}
                >
                  <option value="topo">Topo</option>
                  <option value="meio">Meio</option>
                  <option value="fundo">Fundo</option>
                </select>
                <select
                  value={manualIdea.objective}
                  onChange={(e) => setManualIdea({ ...manualIdea, objective: e.target.value })}
                >
                  <option value="branding">Branding</option>
                  <option value="engajamento">Engajamento</option>
                  <option value="captacao">Captação</option>
                  <option value="aquecimento">Aquecimento</option>
                </select>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleAddManualIdea}>
                Adicionar
              </button>
            </div>
          )}

          <div className="ideas-grid">
            {filteredIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onUpdate={handleUpdateIdea}
                onDelete={handleDeleteIdea}
              />
            ))}
          </div>

          {approvedCount > 0 && (
            <button
              className="btn btn-primary btn-generate"
              onClick={handleGenerateScripts}
              disabled={generatingScripts}
            >
              {generatingScripts ? (
                <>
                  <Loader2 size={18} className="spin" /> Gerando roteiros...
                </>
              ) : (
                <>
                  <FileText size={18} /> Gerar roteiros das {approvedCount} aprovadas
                </>
              )}
            </button>
          )}
        </section>
      )}

      {/* ===== POSTS (ROTEIROS COMPLETOS) ===== */}
      {posts.length > 0 && (
        <section className="posts-section">
          <h2>Roteiros ({posts.length})</h2>
          {reels.length > 0 && (
            <>
              <h3 className="section-subtitle">Reels ({reels.length})</h3>
              <div className="posts-grid">
                {reels.map((p) => (
                  <PostCard key={p.id} post={p} onUpdate={handleUpdatePost} />
                ))}
              </div>
            </>
          )}
          {carrosseis.length > 0 && (
            <>
              <h3 className="section-subtitle">Carrosséis ({carrosseis.length})</h3>
              <div className="posts-grid">
                {carrosseis.map((p) => (
                  <PostCard key={p.id} post={p} onUpdate={handleUpdatePost} />
                ))}
              </div>
            </>
          )}
          {estaticos.length > 0 && (
            <>
              <h3 className="section-subtitle">Estáticos ({estaticos.length})</h3>
              <div className="posts-grid">
                {estaticos.map((p) => (
                  <PostCard key={p.id} post={p} onUpdate={handleUpdatePost} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
