import { useState } from 'react';
import { Check, X, Edit2, Trash2, Save, XCircle, Film, Images, Image } from 'lucide-react';
import { PILARES_BY_ID, FUNIL_STAGES, OBJETIVOS, FORMATOS } from '../utils/constants.js';

const FORMAT_ICONS = {
  reel: Film,
  carrossel: Images,
  estatico: Image,
};

export default function IdeaCard({ idea, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(idea);

  const pilar = PILARES_BY_ID[idea.pillar];
  const funil = FUNIL_STAGES.find((f) => f.id === idea.funnel_stage);
  const objetivo = OBJETIVOS.find((o) => o.id === idea.objective);
  const FormatIcon = FORMAT_ICONS[idea.format] || Film;

  const handleSave = () => {
    onUpdate(idea.id, {
      title: draft.title,
      pillar: draft.pillar,
      format: draft.format,
      funnel_stage: draft.funnel_stage,
      objective: draft.objective,
      rationale: draft.rationale,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(idea);
    setEditing(false);
  };

  const setStatus = (status) => onUpdate(idea.id, { status });

  if (editing) {
    return (
      <div className={`idea-card idea-editing`}>
        <div className="form-group">
          <label>Título</label>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </div>
        <div className="idea-edit-row">
          <div className="form-group">
            <label>Pilar</label>
            <select
              value={draft.pillar || ''}
              onChange={(e) => setDraft({ ...draft, pillar: e.target.value })}
            >
              <option value="">Selecione</option>
              {Object.values(PILARES_BY_ID).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Formato</label>
            <select
              value={draft.format || ''}
              onChange={(e) => setDraft({ ...draft, format: e.target.value })}
            >
              <option value="">Selecione</option>
              {FORMATOS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="idea-edit-row">
          <div className="form-group">
            <label>Funil</label>
            <select
              value={draft.funnel_stage || ''}
              onChange={(e) => setDraft({ ...draft, funnel_stage: e.target.value })}
            >
              <option value="">Selecione</option>
              {FUNIL_STAGES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Objetivo</label>
            <select
              value={draft.objective || ''}
              onChange={(e) => setDraft({ ...draft, objective: e.target.value })}
            >
              <option value="">Selecione</option>
              {OBJETIVOS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Racional (opcional)</label>
          <textarea
            rows={2}
            value={draft.rationale || ''}
            onChange={(e) => setDraft({ ...draft, rationale: e.target.value })}
          />
        </div>
        <div className="idea-actions">
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            <Save size={14} /> Salvar
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleCancel}>
            <XCircle size={14} /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`idea-card idea-${idea.status}`}>
      <div className="idea-header">
        <FormatIcon size={16} />
        <h4 className="idea-title">{idea.title}</h4>
      </div>

      <div className="idea-badges">
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

      {idea.rationale && <p className="idea-rationale">{idea.rationale}</p>}

      <div className="idea-actions">
        {idea.status !== 'approved' && (
          <button
            className="btn btn-approve btn-sm"
            onClick={() => setStatus('approved')}
            title="Aprovar"
          >
            <Check size={14} /> Aprovar
          </button>
        )}
        {idea.status !== 'rejected' && (
          <button
            className="btn btn-reject btn-sm"
            onClick={() => setStatus('rejected')}
            title="Rejeitar"
          >
            <X size={14} /> Rejeitar
          </button>
        )}
        {idea.status !== 'pending' && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setStatus('pending')}
            title="Voltar para pendente"
          >
            ↺ Pendente
          </button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
          <Edit2 size={14} /> Editar
        </button>
        <button className="btn btn-ghost btn-sm btn-danger" onClick={() => onDelete(idea.id)}>
          <Trash2 size={14} /> Excluir
        </button>
      </div>
    </div>
  );
}
