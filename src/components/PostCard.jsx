import { useState } from 'react';
import {
  Film, Images, Image as ImageIcon, CalendarDays, ChevronDown, ChevronUp,
  Heart, Bookmark, Eye, MessageCircle, ExternalLink, Save, Edit2,
} from 'lucide-react';
import {
  POST_STATUS, POST_STATUS_COLORS, POST_STATUS_FLOW,
  PILARES_BY_ID, FUNIL_STAGES, OBJETIVOS,
} from '../utils/constants.js';

const FORMAT_ICONS = { reel: Film, carrossel: Images, estatico: ImageIcon };
const FORMAT_LABELS = { reel: 'Reel', carrossel: 'Carrossel', estatico: 'Estático' };

export default function PostCard({ post, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    theme: post.theme || '',
    script: post.script || '',
    caption: post.caption || '',
    hashtags: post.hashtags || '',
    scheduled_date: post.scheduled_date || '',
    instagram_url: post.instagram_url || '',
  });

  const FormatIcon = FORMAT_ICONS[post.format] || Film;
  const statusIndex = POST_STATUS_FLOW.indexOf(post.status);

  const pilar = PILARES_BY_ID[post.pillar];
  const funil = FUNIL_STAGES.find((f) => f.id === post.funnel_stage);
  const objetivo = OBJETIVOS.find((o) => o.id === post.objective);

  const handleStatusChange = (newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'published' && !post.published_at) {
      updates.published_at = new Date().toISOString();
    }
    onUpdate(post.id, updates);
  };

  const handleMetric = (field, value) => {
    const metrics = { ...(post.metrics || {}), [field]: value === '' ? null : Number(value) };
    onUpdate(post.id, { metrics });
  };

  const handleSaveEdit = () => {
    onUpdate(post.id, {
      theme: draft.theme,
      script: draft.script,
      caption: draft.caption,
      hashtags: draft.hashtags,
      scheduled_date: draft.scheduled_date || null,
      instagram_url: draft.instagram_url || null,
    });
    setEditing(false);
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-format">
          <FormatIcon size={16} />
          <span>{FORMAT_LABELS[post.format] || post.format}</span>
        </div>
        {post.scheduled_date && (
          <div className="post-date">
            <CalendarDays size={14} />
            <span>{new Date(post.scheduled_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
          </div>
        )}
      </div>

      <h3 className="post-theme">{post.theme}</h3>

      <div className="post-badges">
        {pilar && (
          <span className="badge" style={{ background: pilar.color + '22', color: pilar.color }}>
            {pilar.label}
          </span>
        )}
        {funil && (
          <span className="badge" style={{ background: funil.color + '22', color: funil.color }}>
            {funil.label}
          </span>
        )}
        {objetivo && (
          <span
            className="badge"
            style={{ background: objetivo.color + '22', color: objetivo.color }}
          >
            {objetivo.label}
          </span>
        )}
      </div>

      <div className="status-bar">
        {POST_STATUS_FLOW.map((s, i) => (
          <button
            key={s}
            className={`status-step ${post.status === s ? 'active' : ''} ${i <= statusIndex ? 'done' : ''}`}
            style={{ '--status-color': POST_STATUS_COLORS[s] }}
            onClick={() => handleStatusChange(s)}
            title={POST_STATUS[s]}
          >
            <span className="status-dot" />
            <span className="status-label">{POST_STATUS[s]}</span>
          </button>
        ))}
      </div>

      <div className="post-card-actions">
        <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? 'Menos' : 'Detalhes'}
        </button>
        {expanded && !editing && (
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
            <Edit2 size={14} /> Editar
          </button>
        )}
      </div>

      {expanded && (
        <div className="post-details">
          {editing ? (
            <>
              <div className="form-group">
                <label>Tema</label>
                <input
                  value={draft.theme}
                  onChange={(e) => setDraft({ ...draft, theme: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Data agendada</label>
                <input
                  type="date"
                  value={draft.scheduled_date}
                  onChange={(e) => setDraft({ ...draft, scheduled_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Roteiro</label>
                <textarea
                  rows={6}
                  value={draft.script}
                  onChange={(e) => setDraft({ ...draft, script: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Legenda</label>
                <textarea
                  rows={4}
                  value={draft.caption}
                  onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Hashtags</label>
                <textarea
                  rows={2}
                  value={draft.hashtags}
                  onChange={(e) => setDraft({ ...draft, hashtags: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>URL no Instagram (após publicar)</label>
                <input
                  type="url"
                  value={draft.instagram_url}
                  onChange={(e) => setDraft({ ...draft, instagram_url: e.target.value })}
                  placeholder="https://www.instagram.com/p/..."
                />
              </div>
              <div className="idea-actions">
                <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}>
                  <Save size={14} /> Salvar
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="detail-block">
                <strong>Roteiro</strong>
                <p>{post.script || '—'}</p>
              </div>
              <div className="detail-block">
                <strong>Legenda</strong>
                <p>{post.caption || '—'}</p>
              </div>
              <div className="detail-block">
                <strong>Hashtags</strong>
                <p className="hashtags">{post.hashtags || '—'}</p>
              </div>
            </>
          )}
        </div>
      )}

      {post.status === 'published' && (
        <>
          {post.instagram_url && (
            <a
              href={post.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm btn-ig-link"
            >
              <ExternalLink size={14} /> Abrir no Instagram
            </a>
          )}
          <button
            className="expand-btn metrics-toggle"
            onClick={() => setShowMetrics(!showMetrics)}
          >
            {showMetrics ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Métricas
          </button>
          {showMetrics && (
            <div className="metrics-grid">
              <div className="metric-field">
                <Heart size={14} />
                <label>Curtidas</label>
                <input
                  type="number"
                  min="0"
                  value={post.metrics?.likes ?? ''}
                  onChange={(e) => handleMetric('likes', e.target.value)}
                />
              </div>
              <div className="metric-field">
                <Bookmark size={14} />
                <label>Salvamentos</label>
                <input
                  type="number"
                  min="0"
                  value={post.metrics?.saves ?? ''}
                  onChange={(e) => handleMetric('saves', e.target.value)}
                />
              </div>
              <div className="metric-field">
                <Eye size={14} />
                <label>Alcance</label>
                <input
                  type="number"
                  min="0"
                  value={post.metrics?.reach ?? ''}
                  onChange={(e) => handleMetric('reach', e.target.value)}
                />
              </div>
              <div className="metric-field">
                <MessageCircle size={14} />
                <label>Comentários</label>
                <input
                  type="number"
                  min="0"
                  value={post.metrics?.comments ?? ''}
                  onChange={(e) => handleMetric('comments', e.target.value)}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
