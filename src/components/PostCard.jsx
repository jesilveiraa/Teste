import { useState } from 'react';
import {
  Film, Images, CalendarDays, ChevronDown, ChevronUp,
  Heart, Bookmark, Eye, MessageCircle,
} from 'lucide-react';

const STATUS_LABELS = {
  planned: 'Planejado',
  creating: 'Arte em criação',
  approved: 'Aprovado',
  published: 'Publicado',
};

const STATUS_COLORS = {
  planned: '#6b7280',
  creating: '#f59e0b',
  approved: '#3b82f6',
  published: '#10b981',
};

const STATUS_FLOW = ['planned', 'creating', 'approved', 'published'];

export default function PostCard({ post, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  const statusIndex = STATUS_FLOW.indexOf(post.status);

  const handleStatusChange = (newStatus) => {
    onUpdate(post.id, { status: newStatus });
  };

  const handleMetric = (field, value) => {
    const metrics = { ...(post.metrics || {}), [field]: value };
    onUpdate(post.id, { metrics });
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-format">
          {post.format === 'reel' ? <Film size={16} /> : <Images size={16} />}
          <span>{post.format === 'reel' ? 'Reel' : 'Carrossel'}</span>
        </div>
        <div className="post-date">
          <CalendarDays size={14} />
          <span>{new Date(post.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      <h3 className="post-theme">{post.theme}</h3>

      <div className="status-bar">
        {STATUS_FLOW.map((s, i) => (
          <button
            key={s}
            className={`status-step ${post.status === s ? 'active' : ''} ${i <= statusIndex ? 'done' : ''}`}
            style={{ '--status-color': STATUS_COLORS[s] }}
            onClick={() => handleStatusChange(s)}
            title={STATUS_LABELS[s]}
          >
            <span className="status-dot" />
            <span className="status-label">{STATUS_LABELS[s]}</span>
          </button>
        ))}
      </div>

      <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {expanded ? 'Menos detalhes' : 'Mais detalhes'}
      </button>

      {expanded && (
        <div className="post-details">
          <div className="detail-block">
            <strong>Roteiro</strong>
            <p>{post.script}</p>
          </div>
          <div className="detail-block">
            <strong>Legenda</strong>
            <p>{post.caption}</p>
          </div>
          <div className="detail-block">
            <strong>Hashtags</strong>
            <p className="hashtags">{post.hashtags}</p>
          </div>
        </div>
      )}

      {post.status === 'published' && (
        <>
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
                  onChange={e => handleMetric('likes', e.target.value)}
                />
              </div>
              <div className="metric-field">
                <Bookmark size={14} />
                <label>Salvamentos</label>
                <input
                  type="number"
                  min="0"
                  value={post.metrics?.saves ?? ''}
                  onChange={e => handleMetric('saves', e.target.value)}
                />
              </div>
              <div className="metric-field">
                <Eye size={14} />
                <label>Alcance</label>
                <input
                  type="number"
                  min="0"
                  value={post.metrics?.reach ?? ''}
                  onChange={e => handleMetric('reach', e.target.value)}
                />
              </div>
              <div className="metric-field">
                <MessageCircle size={14} />
                <label>Comentários</label>
                <input
                  type="number"
                  min="0"
                  value={post.metrics?.comments ?? ''}
                  onChange={e => handleMetric('comments', e.target.value)}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
