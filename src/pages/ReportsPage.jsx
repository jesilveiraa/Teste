import { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Award, Heart, Bookmark, Eye, MessageCircle,
  Film, Images, Image as ImageIcon, ExternalLink, Loader2,
} from 'lucide-react';
import { loadPosts } from '../utils/storage.js';
import {
  MONTH_NAMES, PILARES, PILARES_BY_ID, FUNIL_STAGES, OBJETIVOS,
  POST_STATUS,
} from '../utils/constants.js';

const FORMAT_ICONS = { reel: Film, carrossel: Images, estatico: ImageIcon };

// Proporções recomendadas pelo manual KNN
const FORMAT_TARGETS = {
  reel: { min: 50, max: 60, label: 'Reel' },
  carrossel: { min: 25, max: 30, label: 'Carrossel' },
  estatico: { min: 10, max: 15, label: 'Estático' },
};

function percent(part, total) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

function sum(arr, key) {
  return arr.reduce((acc, item) => acc + (Number(item?.metrics?.[key]) || 0), 0);
}

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const ps = await loadPosts(year, month);
        if (active) setPosts(ps);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [year, month]);

  const total = posts.length;
  const byStatus = {
    planned: posts.filter((p) => p.status === 'planned').length,
    creating: posts.filter((p) => p.status === 'creating').length,
    approved: posts.filter((p) => p.status === 'approved').length,
    published: posts.filter((p) => p.status === 'published').length,
  };
  const published = posts.filter((p) => p.status === 'published');

  // Mix de formatos
  const formatCounts = {
    reel: posts.filter((p) => p.format === 'reel').length,
    carrossel: posts.filter((p) => p.format === 'carrossel').length,
    estatico: posts.filter((p) => p.format === 'estatico').length,
  };

  // Mix do funil
  const funnelCounts = FUNIL_STAGES.map((f) => ({
    ...f,
    count: posts.filter((p) => p.funnel_stage === f.id).length,
  }));

  // Mix de objetivos
  const objCounts = OBJETIVOS.map((o) => ({
    ...o,
    count: posts.filter((p) => p.objective === o.id).length,
  }));

  // Mix de pilares
  const pilarCounts = PILARES.map((p) => ({
    ...p,
    count: posts.filter((post) => post.pillar === p.id).length,
  })).filter((p) => p.count > 0);

  // Agregados de métricas (só publicados)
  const totals = {
    likes: sum(published, 'likes'),
    saves: sum(published, 'saves'),
    reach: sum(published, 'reach'),
    comments: sum(published, 'comments'),
  };

  // Top post por alcance
  const topPost = [...published]
    .filter((p) => Number(p.metrics?.reach) > 0)
    .sort((a, b) => (Number(b.metrics?.reach) || 0) - (Number(a.metrics?.reach) || 0))[0];

  // Tabela ordenável
  const [sortBy, setSortBy] = useState('reach');
  const sortedPublished = [...published].sort(
    (a, b) => (Number(b.metrics?.[sortBy]) || 0) - (Number(a.metrics?.[sortBy]) || 0)
  );

  const currentYear = now.getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>
          <BarChart3 size={24} /> Relatórios
        </h1>
        <div className="reports-selector">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i}>
                {name}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="loading-screen">
          <Loader2 size={24} className="spin" /> Carregando...
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      {!loading && total === 0 && (
        <div className="empty-state">
          <p>Nenhum post encontrado para {MONTH_NAMES[month]} {year}.</p>
          <p>Vá em um mês e gere ideias + roteiros primeiro.</p>
        </div>
      )}

      {!loading && total > 0 && (
        <>
          {/* Cards de status */}
          <section className="reports-section">
            <h2>Status dos posts do mês</h2>
            <div className="status-cards">
              <div className="status-card">
                <div className="status-card-num">{total}</div>
                <div className="status-card-label">Total</div>
              </div>
              {Object.entries(byStatus).map(([s, count]) => (
                <div key={s} className="status-card">
                  <div className="status-card-num">{count}</div>
                  <div className="status-card-label">{POST_STATUS[s]}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Mix de formatos */}
          <section className="reports-section">
            <h2>Mix de formatos (vs recomendação do manual)</h2>
            <div className="mix-bars">
              {Object.entries(FORMAT_TARGETS).map(([format, target]) => {
                const count = formatCounts[format] || 0;
                const pct = percent(count, total);
                const withinRange = pct >= target.min && pct <= target.max;
                const Icon = FORMAT_ICONS[format];
                return (
                  <div key={format} className="mix-bar">
                    <div className="mix-bar-label">
                      <Icon size={14} /> {target.label}
                    </div>
                    <div className="mix-bar-track">
                      <div
                        className="mix-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: withinRange ? '#10b981' : '#f59e0b',
                        }}
                      />
                    </div>
                    <div className="mix-bar-num">
                      {count} ({pct}%){' '}
                      <span className="mix-target">
                        meta: {target.min}-{target.max}%
                      </span>
                      {withinRange ? ' ✓' : ' ⚠️'}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Mix de funil */}
          <section className="reports-section">
            <h2>Mix do funil</h2>
            <div className="mix-bars">
              {funnelCounts.map((f) => (
                <div key={f.id} className="mix-bar">
                  <div className="mix-bar-label">{f.label}</div>
                  <div className="mix-bar-track">
                    <div
                      className="mix-bar-fill"
                      style={{
                        width: `${percent(f.count, total)}%`,
                        background: f.color,
                      }}
                    />
                  </div>
                  <div className="mix-bar-num">
                    {f.count} ({percent(f.count, total)}%)
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Mix de objetivos */}
          <section className="reports-section">
            <h2>Mix de objetivos</h2>
            <div className="mix-bars">
              {objCounts.map((o) => (
                <div key={o.id} className="mix-bar">
                  <div className="mix-bar-label">{o.label}</div>
                  <div className="mix-bar-track">
                    <div
                      className="mix-bar-fill"
                      style={{ width: `${percent(o.count, total)}%`, background: o.color }}
                    />
                  </div>
                  <div className="mix-bar-num">
                    {o.count} ({percent(o.count, total)}%)
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Mix de pilares */}
          {pilarCounts.length > 0 && (
            <section className="reports-section">
              <h2>Pilares trabalhados</h2>
              <div className="mix-bars">
                {pilarCounts.map((p) => (
                  <div key={p.id} className="mix-bar">
                    <div className="mix-bar-label">{p.label}</div>
                    <div className="mix-bar-track">
                      <div
                        className="mix-bar-fill"
                        style={{ width: `${percent(p.count, total)}%`, background: p.color }}
                      />
                    </div>
                    <div className="mix-bar-num">
                      {p.count} ({percent(p.count, total)}%)
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Agregados de métricas */}
          {published.length > 0 && (
            <section className="reports-section">
              <h2>Totais do mês ({published.length} publicados)</h2>
              <div className="totals-grid">
                <div className="totals-card">
                  <Heart size={20} />
                  <div className="totals-num">{totals.likes.toLocaleString('pt-BR')}</div>
                  <div className="totals-label">Curtidas</div>
                </div>
                <div className="totals-card">
                  <Bookmark size={20} />
                  <div className="totals-num">{totals.saves.toLocaleString('pt-BR')}</div>
                  <div className="totals-label">Salvamentos</div>
                </div>
                <div className="totals-card">
                  <Eye size={20} />
                  <div className="totals-num">{totals.reach.toLocaleString('pt-BR')}</div>
                  <div className="totals-label">Alcance</div>
                </div>
                <div className="totals-card">
                  <MessageCircle size={20} />
                  <div className="totals-num">{totals.comments.toLocaleString('pt-BR')}</div>
                  <div className="totals-label">Comentários</div>
                </div>
              </div>
            </section>
          )}

          {/* Top post */}
          {topPost && (
            <section className="reports-section">
              <h2>
                <Award size={18} /> Top post do mês
              </h2>
              <div className="top-post-card">
                <div>
                  <h3>{topPost.theme}</h3>
                  {PILARES_BY_ID[topPost.pillar] && (
                    <span
                      className="badge"
                      style={{
                        background: PILARES_BY_ID[topPost.pillar].color + '22',
                        color: PILARES_BY_ID[topPost.pillar].color,
                      }}
                    >
                      {PILARES_BY_ID[topPost.pillar].label}
                    </span>
                  )}
                  <div className="top-post-stats">
                    <span>
                      <Eye size={14} /> {Number(topPost.metrics?.reach || 0).toLocaleString('pt-BR')}
                    </span>
                    <span>
                      <Heart size={14} /> {Number(topPost.metrics?.likes || 0).toLocaleString('pt-BR')}
                    </span>
                    <span>
                      <Bookmark size={14} /> {Number(topPost.metrics?.saves || 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
                {topPost.instagram_url && (
                  <a
                    href={topPost.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                  >
                    <ExternalLink size={14} /> Ver no IG
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Tabela de publicados */}
          {published.length > 0 && (
            <section className="reports-section">
              <h2>
                <TrendingUp size={18} /> Posts publicados
              </h2>
              <div className="table-wrapper">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Tema</th>
                      <th>Formato</th>
                      <th
                        className={`sortable ${sortBy === 'reach' ? 'active' : ''}`}
                        onClick={() => setSortBy('reach')}
                      >
                        Alcance
                      </th>
                      <th
                        className={`sortable ${sortBy === 'likes' ? 'active' : ''}`}
                        onClick={() => setSortBy('likes')}
                      >
                        Curtidas
                      </th>
                      <th
                        className={`sortable ${sortBy === 'saves' ? 'active' : ''}`}
                        onClick={() => setSortBy('saves')}
                      >
                        Salvos
                      </th>
                      <th
                        className={`sortable ${sortBy === 'comments' ? 'active' : ''}`}
                        onClick={() => setSortBy('comments')}
                      >
                        Coment.
                      </th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPublished.map((p) => (
                      <tr key={p.id}>
                        <td>{p.theme}</td>
                        <td>{FORMAT_TARGETS[p.format]?.label || p.format}</td>
                        <td>{Number(p.metrics?.reach || 0).toLocaleString('pt-BR')}</td>
                        <td>{Number(p.metrics?.likes || 0).toLocaleString('pt-BR')}</td>
                        <td>{Number(p.metrics?.saves || 0).toLocaleString('pt-BR')}</td>
                        <td>{Number(p.metrics?.comments || 0).toLocaleString('pt-BR')}</td>
                        <td>
                          {p.instagram_url && (
                            <a
                              href={p.instagram_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="table-link"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
