import React, { useState, useEffect } from 'react';
import {
  X,
  FileCode,
  Layers,
  Fingerprint,
  RotateCcw,
  Check,
  Copy,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Edit3,
} from 'lucide-react';
import {
  ReferenceSceneAnalysis,
  ClientIdentityAnalysis,
  buildMasterPromptFromAnalyses,
  getDefaultAnalyses,
} from '../services/promptSynthesisService';

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  gender: 'male' | 'female';
  // Configuração atual
  customScene: ReferenceSceneAnalysis | null;
  customClient: ClientIdentityAnalysis | null;
  customMasterText: string | null;
  isCustomPromptActive: boolean;
  onSavePromptConfig: (config: {
    scene: ReferenceSceneAnalysis;
    client: ClientIdentityAnalysis;
    masterText: string;
    isActive: boolean;
  }) => void;
}

export const PromptEditorModal: React.FC<PromptEditorModalProps> = ({
  isOpen,
  onClose,
  gender,
  customScene,
  customClient,
  customMasterText,
  isCustomPromptActive,
  onSavePromptConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'scene' | 'client' | 'master'>('master');
  const [copied, setCopied] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Defaults
  const defaults = getDefaultAnalyses(gender);

  // Estados locais dos campos
  const [sceneState, setSceneState] = useState<ReferenceSceneAnalysis>(() => {
    return customScene || { ...defaults.referenceSceneJson };
  });

  const [clientState, setClientState] = useState<ClientIdentityAnalysis>(() => {
    return customClient || { ...defaults.clientIdentityJson };
  });

  const [masterTextState, setMasterTextState] = useState<string>(() => {
    if (customMasterText) return customMasterText;
    return buildMasterPromptFromAnalyses(
      customScene || defaults.referenceSceneJson,
      customClient || defaults.clientIdentityJson
    );
  });

  const [isCustomActive, setIsCustomActive] = useState<boolean>(isCustomPromptActive);
  const [isManualOverride, setIsManualOverride] = useState<boolean>(Boolean(customMasterText));

  // Quando o gênero muda ou modal reabre, sincroniza se não houver edição personalizada ativa
  useEffect(() => {
    if (isOpen) {
      const def = getDefaultAnalyses(gender);
      if (customScene) {
        setSceneState(customScene);
      } else {
        setSceneState({ ...def.referenceSceneJson });
      }

      if (customClient) {
        setClientState(customClient);
      } else {
        setClientState({ ...def.clientIdentityJson });
      }

      if (customMasterText) {
        setMasterTextState(customMasterText);
        setIsManualOverride(true);
      } else {
        const computed = buildMasterPromptFromAnalyses(
          customScene || def.referenceSceneJson,
          customClient || def.clientIdentityJson
        );
        setMasterTextState(computed);
      }

      setIsCustomActive(isCustomPromptActive);
    }
  }, [isOpen, gender]);

  // Se os campos estruturados mudarem e não estiver em override direto do texto, atualiza o prompt mestre
  const handleSceneFieldChange = (field: keyof ReferenceSceneAnalysis, value: string) => {
    const updated = { ...sceneState, [field]: value };
    setSceneState(updated);
    if (!isManualOverride) {
      setMasterTextState(buildMasterPromptFromAnalyses(updated, clientState));
    }
    setIsCustomActive(true);
  };

  const handleClientFieldChange = (field: keyof ClientIdentityAnalysis, value: string) => {
    const updated = { ...clientState, [field]: value };
    setClientState(updated);
    if (!isManualOverride) {
      setMasterTextState(buildMasterPromptFromAnalyses(sceneState, updated));
    }
    setIsCustomActive(true);
  };

  const handleMasterTextDirectChange = (value: string) => {
    setMasterTextState(value);
    setIsManualOverride(true);
    setIsCustomActive(true);
  };

  const handleSyncFromFields = () => {
    const compiled = buildMasterPromptFromAnalyses(sceneState, clientState);
    setMasterTextState(compiled);
    setIsManualOverride(false);
  };

  const handleResetToSystemDefaults = () => {
    const def = getDefaultAnalyses(gender);
    setSceneState({ ...def.referenceSceneJson });
    setClientState({ ...def.clientIdentityJson });
    const compiled = buildMasterPromptFromAnalyses(def.referenceSceneJson, def.clientIdentityJson);
    setMasterTextState(compiled);
    setIsManualOverride(false);
    setIsCustomActive(false);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(masterTextState);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSave = () => {
    onSavePromptConfig({
      scene: sceneState,
      client: clientState,
      masterText: masterTextState,
      isActive: isCustomActive,
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0c0d14] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Editor de Prompts Mestre & Diretivas
                </h2>
                {isCustomActive ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Modo Customizado Ativo
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Padrão Oficial Calibrado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualize os prompts decompostos em partes e edite as diretivas da IA manualmente
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex items-center border-b border-slate-800/80 bg-[#08090d] px-4 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('master')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer border-b-2 ${
              activeTab === 'master'
                ? 'bg-slate-900/90 text-amber-400 border-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
            }`}
          >
            <FileCode className="w-4 h-4 text-amber-400" />
            <span>Prompt Mestre Consolidado</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 font-mono">
              Final
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scene')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer border-b-2 ${
              activeTab === 'scene'
                ? 'bg-slate-900/90 text-emerald-400 border-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>1. Cena & Referência (Img #1)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('client')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer border-b-2 ${
              activeTab === 'client'
                ? 'bg-slate-900/90 text-violet-400 border-violet-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
            }`}
          >
            <Fingerprint className="w-4 h-4 text-violet-400" />
            <span>2. Identidade do Cliente (Img #2+)</span>
          </button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* ===================== ABA 1: PROMPT MESTRE CONSOLIDADO ===================== */}
          {activeTab === 'master' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-300 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="text-amber-300 block mb-0.5">
                    Como funciona o Prompt Mestre:
                  </strong>
                  Este é o texto exato enviado ao motor de IA (Nano Banana). Ele reúne as regras
                  estritas de preservação facial e descarte de barba da referência em 4 blocos
                  mandatórios. Você pode editar este texto livremente no campo abaixo ou ajustá-lo
                  através dos campos separados nas abas 1 e 2.
                </div>
              </div>

              {/* BARRA DE AÇÕES DO PROMPT */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Status da edição:</span>
                  {isManualOverride ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                      <Edit3 className="w-3 h-3" /> Edição direta de texto ativa
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      Sincronizado com os campos das abas
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isManualOverride && (
                    <button
                      type="button"
                      onClick={handleSyncFromFields}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
                      title="Recalcular texto mestre a partir dos campos das abas 1 e 2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Ressincronizar dos campos
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* TEXTAREA DO PROMPT MESTRE */}
              <div className="relative">
                <textarea
                  rows={14}
                  value={masterTextState}
                  onChange={(e) => handleMasterTextDirectChange(e.target.value)}
                  className="w-full p-4 rounded-xl bg-black/70 border border-slate-800 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 text-amber-100/90 font-mono text-[11.5px] leading-relaxed resize-y transition-colors selection:bg-amber-500/30"
                  placeholder="Insira ou edite o prompt mestre consolidado..."
                />
                <div className="absolute right-3 bottom-3 text-[10px] font-mono text-slate-500 bg-black/80 px-2 py-0.5 rounded border border-slate-800">
                  {masterTextState.length} caracteres • {masterTextState.split(/\s+/).filter(Boolean).length} palavras
                </div>
              </div>
            </div>
          )}

          {/* ===================== ABA 2: CENA & REFERÊNCIA (IMAGEM #1) ===================== */}
          {activeTab === 'scene' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-slate-300 flex items-start gap-3">
                <Layers className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="text-emerald-300 block mb-0.5">
                    1. Diretivas da Imagem de Referência (Img #1):
                  </strong>
                  Extrai exclusivamente as roupas, postura, iluminação, cenário e equipamento ótico.
                  <strong> 100% dos traços físicos e a barba da referência são descartados</strong> para que a pessoa gerada não se pareça com o modelo da foto de exemplo.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Enquadramento & Distância */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>📏 Distância & Enquadramento da Câmera</span>
                    <span className="text-[10px] text-slate-500 font-mono">(enquadramento_distancia)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={sceneState.enquadramento_distancia || sceneState.angulo}
                    onChange={(e) => handleSceneFieldChange('enquadramento_distancia', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-800 focus:border-emerald-500 text-slate-200 text-xs font-mono"
                    placeholder="Ex: Medium close-up, enquadrado do tórax para cima, distância idêntica à referência..."
                  />
                </div>

                {/* Ação Facial & Emoção Dinâmica */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>🎭 Ação Facial, Olhar & Boca (Substitui Pose da Selfie)</span>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">(expressao_acao_facial)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={sceneState.expressao_acao_facial || ''}
                    onChange={(e) => handleSceneFieldChange('expressao_acao_facial', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-black/50 border border-amber-500/40 focus:border-amber-400 text-amber-200 text-xs font-mono"
                    placeholder="Ex: Olhos gentilmente fechados/olhar sereno para baixo, cabeça inclinada para a frente em direção ao bolo, lábios em biquinho assoprando a vela sparkler..."
                  />
                </div>

                {/* Adereços & Interação Física */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>🎂 Adereços & Interação Física (Bolo, Velas, Taças)</span>
                    <span className="text-[10px] text-slate-500 font-mono">(aderecos_interacao)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={sceneState.aderecos_interacao || ''}
                    onChange={(e) => handleSceneFieldChange('aderecos_interacao', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-800 focus:border-emerald-500 text-slate-200 text-xs font-mono"
                    placeholder="Ex: Segurando com as duas mãos na altura do peito um bolo dourado metálico com esferas douradas, placa e vela faísca acesa soltando faíscas brilhantes..."
                  />
                </div>

                {/* Roupa */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>🧥 Roupa & Figurino</span>
                    <span className="text-[10px] text-slate-500 font-mono">(roupa)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={sceneState.roupa}
                    onChange={(e) => handleSceneFieldChange('roupa', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-800 focus:border-emerald-500 text-slate-200 text-xs font-mono"
                  />
                </div>

                {/* Pose */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>🧍 Pose & Postura Corporal</span>
                    <span className="text-[10px] text-slate-500 font-mono">(pose)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={sceneState.pose}
                    onChange={(e) => handleSceneFieldChange('pose', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-800 focus:border-emerald-500 text-slate-200 text-xs font-mono"
                  />
                </div>

                {/* Iluminação */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>💡 Iluminação & Sombra</span>
                    <span className="text-[10px] text-slate-500 font-mono">(iluminacao)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={sceneState.iluminacao}
                    onChange={(e) => handleSceneFieldChange('iluminacao', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-800 focus:border-emerald-500 text-slate-200 text-xs font-mono"
                  />
                </div>

                {/* Cenário */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>🏙️ Cenário & Fundo</span>
                    <span className="text-[10px] text-slate-500 font-mono">(cenario)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={sceneState.cenario}
                    onChange={(e) => handleSceneFieldChange('cenario', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-800 focus:border-emerald-500 text-slate-200 text-xs font-mono"
                  />
                </div>

                {/* Ângulo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>📐 Ângulo & Enquadramento</span>
                    <span className="text-[10px] text-slate-500 font-mono">(angulo)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={sceneState.angulo}
                    onChange={(e) => handleSceneFieldChange('angulo', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-800 focus:border-emerald-500 text-slate-200 text-xs font-mono"
                  />
                </div>

                {/* Lente e Câmera */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>📷 Câmera & Óptica</span>
                    <span className="text-[10px] text-slate-500 font-mono">(lente_e_camera)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={sceneState.lente_e_camera}
                    onChange={(e) => handleSceneFieldChange('lente_e_camera', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-800 focus:border-emerald-500 text-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Regra de Barba da Referência (Destaque) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>✂️ Regra de Barba da Referência (Descarte Total)</span>
                  <span className="text-[10px] text-slate-500 font-mono">(regra_barba)</span>
                </label>
                <textarea
                  rows={2}
                  value={sceneState.regra_barba}
                  onChange={(e) => handleSceneFieldChange('regra_barba', e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-black/50 border border-amber-500/40 focus:border-amber-500 text-amber-200 text-xs font-mono"
                />
              </div>

              {/* Regras Estritas da Referência */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span>🚫 Regra Negativa da Referência (Descarte Fisionômico)</span>
                  <span className="text-[10px] text-slate-500 font-mono">(regras_estritas)</span>
                </label>
                <textarea
                  rows={2}
                  value={sceneState.regras_estritas}
                  onChange={(e) => handleSceneFieldChange('regras_estritas', e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-800 focus:border-emerald-500 text-slate-200 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* ===================== ABA 3: IDENTIDADE DO CLIENTE (IMAGENS #2+) ===================== */}
          {activeTab === 'client' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-slate-300 flex items-start gap-3">
                <Fingerprint className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="text-violet-300 block mb-0.5">
                    2. Diretivas de Identidade do Cliente (Imagens #2+):
                  </strong>
                  Extrai com precisão cirúrgica a fisionomia do cliente real capturado pela câmera ao vivo
                  ou upload manual. <strong>Todas as roupas casuais e fundos das fotos do cliente são ignorados</strong>,
                  vestindo a pessoa no traje da referência.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rosto */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>🗿 Geometria Facial, Maxilar e Queixo</span>
                    <span className="text-[10px] text-slate-500 font-mono">(rosto)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={clientState.rosto}
                    onChange={(e) => handleClientFieldChange('rosto', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-800 focus:border-violet-500 text-slate-200 text-xs font-mono"
                  />
                </div>

                {/* Olhos e Sobrancelhas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>👁️ Olhos & Sobrancelhas</span>
                    <span className="text-[10px] text-slate-500 font-mono">(olhos_e_sobrancelhas)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={clientState.olhos_e_sobrancelhas}
                    onChange={(e) => handleClientFieldChange('olhos_e_sobrancelhas', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-800 focus:border-violet-500 text-slate-200 text-xs font-mono"
                  />
                </div>

                {/* Nariz e Lábios */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>👃 Nariz, Lábios & Boca</span>
                    <span className="text-[10px] text-slate-500 font-mono">(nariz_e_labios)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={clientState.nariz_e_labios}
                    onChange={(e) => handleClientFieldChange('nariz_e_labios', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-800 focus:border-violet-500 text-slate-200 text-xs font-mono"
                  />
                </div>

                {/* Tom e Textura de Pele */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>🎨 Tom de Pele, Poros & Textura Real</span>
                    <span className="text-[10px] text-slate-500 font-mono">(tom_e_textura_pele)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={clientState.tom_e_textura_pele}
                    onChange={(e) => handleClientFieldChange('tom_e_textura_pele', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-800 focus:border-violet-500 text-slate-200 text-xs font-mono"
                  />
                </div>

                {/* Cabelo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>💇 Cabelo (Cor, Corte, Textura Natural)</span>
                    <span className="text-[10px] text-slate-500 font-mono">(cabelo_cor_tamanho_textura)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={clientState.cabelo_cor_tamanho_textura}
                    onChange={(e) => handleClientFieldChange('cabelo_cor_tamanho_textura', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-800 focus:border-violet-500 text-slate-200 text-xs font-mono"
                  />
                </div>

                {/* Idade e Traços Únicos */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>⏳ Idade Aparente & Traços Únicos</span>
                    <span className="text-[10px] text-slate-500 font-mono">(idade_e_caracteristicas_distintas)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={clientState.idade_e_caracteristicas_distintas}
                    onChange={(e) => handleClientFieldChange('idade_e_caracteristicas_distintas', e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-800 focus:border-violet-500 text-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Barba Real do Cliente (Destaque Especial) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>🧔 Barba & Pelos Faciais do Cliente (Fidelidade Absoluta)</span>
                  <span className="text-[10px] text-slate-500 font-mono">(barba_e_pelos_faciais)</span>
                </label>
                <textarea
                  rows={3}
                  value={clientState.barba_e_pelos_faciais}
                  onChange={(e) => handleClientFieldChange('barba_e_pelos_faciais', e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-black/50 border border-amber-500/40 focus:border-amber-500 text-amber-200 text-xs font-mono"
                />
              </div>

              {/* Regra de Descarte de Roupas */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span>🛡️ Descarte de Roupas & Fundos Casuais do Cliente</span>
                  <span className="text-[10px] text-slate-500 font-mono">(regras_estritas)</span>
                </label>
                <textarea
                  rows={2}
                  value={clientState.regras_estritas}
                  onChange={(e) => handleClientFieldChange('regras_estritas', e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-black/50 border border-slate-800 focus:border-violet-500 text-slate-200 text-xs font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ COM CONTROLES */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Toggle de ativação do modo manual */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isCustomActive}
              onChange={(e) => setIsCustomActive(e.target.checked)}
              className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-slate-700 bg-slate-950 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-200">
                Usar estes prompts editados na geração
              </span>
              <span className="block text-[11px] text-slate-400">
                {isCustomActive
                  ? 'A IA usará fielmente o texto editado acima'
                  : 'Desativado (usará o prompt padrão calculado pelo sistema)'}
              </span>
            </div>
          </label>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleResetToSystemDefaults}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700"
              title="Restaurar prompts padrão do sistema"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-600/30'
              }`}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Salvar e Aplicar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
