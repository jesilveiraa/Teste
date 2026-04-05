import { useState } from 'react';
import { Save, CheckCircle, Key } from 'lucide-react';
import { loadBrandConfig, saveBrandConfig } from '../utils/storage.js';

export default function BrandConfigPage() {
  const [config, setConfig] = useState(loadBrandConfig);
  const [saved, setSaved] = useState(false);

  const update = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveBrandConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="config-page">
      <h1>Configurações da Marca</h1>
      <p className="page-subtitle">
        Essas informações são usadas pela IA para gerar conteúdo personalizado para a KNN Saguaçu.
      </p>

      <div className="form-group">
        <label>Tom de voz</label>
        <textarea
          value={config.tone}
          onChange={e => update('tone', e.target.value)}
          rows={2}
          placeholder="Ex: descontraído, acessível, próximo"
        />
      </div>

      <div className="form-group">
        <label>Público-alvo</label>
        <textarea
          value={config.audience}
          onChange={e => update('audience', e.target.value)}
          rows={2}
          placeholder="Ex: crianças a partir de 4 anos até adultos"
        />
      </div>

      <div className="form-group">
        <label>Diferenciais</label>
        <textarea
          value={config.differentials}
          onChange={e => update('differentials', e.target.value)}
          rows={2}
          placeholder="Ex: van exclusiva, foco em conversação"
        />
      </div>

      <div className="form-group">
        <label>O que evitar</label>
        <textarea
          value={config.avoid}
          onChange={e => update('avoid', e.target.value)}
          rows={2}
          placeholder="Ex: linguagem muito formal ou técnica"
        />
      </div>

      <div className="form-group">
        <label><Key size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Chave de API (Anthropic Claude)</label>
        <input
          type="password"
          value={config.apiKey}
          onChange={e => update('apiKey', e.target.value)}
          placeholder="sk-ant-..."
        />
        <span className="field-hint">
          Necessária para gerar planejamentos com IA. Obtenha em console.anthropic.com
        </span>
      </div>

      <button className="btn btn-primary" onClick={handleSave}>
        {saved ? <><CheckCircle size={18} /> Salvo!</> : <><Save size={18} /> Salvar configurações</>}
      </button>
    </div>
  );
}
