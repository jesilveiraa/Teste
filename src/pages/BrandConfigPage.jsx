import { useState, useEffect } from 'react';
import { Save, CheckCircle, Key, Loader2 } from 'lucide-react';
import { loadBrandConfig, saveBrandConfig } from '../utils/storage.js';

const EMPTY_CONFIG = {
  tone: '',
  audience: '',
  differentials: '',
  avoid: '',
  apiKey: '',
};

export default function BrandConfigPage() {
  const [config, setConfig] = useState(EMPTY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await loadBrandConfig();
        if (active) setConfig(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const update = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await saveBrandConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 size={32} className="spin" />
        <p>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="config-page">
      <h1>Configurações da Marca</h1>
      <p className="page-subtitle">
        Essas informações são usadas pela IA para gerar conteúdo personalizado para a KNN Saguaçu.
        São compartilhadas com toda a equipe.
      </p>

      <div className="form-group">
        <label>Tom de voz</label>
        <textarea
          value={config.tone}
          onChange={(e) => update('tone', e.target.value)}
          rows={2}
          placeholder="Ex: descontraído, acessível, próximo"
        />
      </div>

      <div className="form-group">
        <label>Público-alvo</label>
        <textarea
          value={config.audience}
          onChange={(e) => update('audience', e.target.value)}
          rows={2}
          placeholder="Ex: crianças a partir de 4 anos até adultos"
        />
      </div>

      <div className="form-group">
        <label>Diferenciais</label>
        <textarea
          value={config.differentials}
          onChange={(e) => update('differentials', e.target.value)}
          rows={2}
          placeholder="Ex: van exclusiva, foco em conversação"
        />
      </div>

      <div className="form-group">
        <label>O que evitar</label>
        <textarea
          value={config.avoid}
          onChange={(e) => update('avoid', e.target.value)}
          rows={2}
          placeholder="Ex: linguagem muito formal ou técnica"
        />
      </div>

      <div className="form-group">
        <label>
          <Key size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Chave de API (Anthropic Claude)
        </label>
        <input
          type="password"
          value={config.apiKey}
          onChange={(e) => update('apiKey', e.target.value)}
          placeholder="sk-ant-..."
        />
        <span className="field-hint">
          Necessária para gerar planejamentos com IA. Obtenha em console.anthropic.com
        </span>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 size={18} className="spin" /> Salvando...
          </>
        ) : saved ? (
          <>
            <CheckCircle size={18} /> Salvo!
          </>
        ) : (
          <>
            <Save size={18} /> Salvar configurações
          </>
        )}
      </button>
    </div>
  );
}
