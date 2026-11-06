import { QuizProvider, useQuiz } from "@/context/QuizContext";
import { QuizFlow } from "@/components/quiz/QuizFlow";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  UploadCloud,
  Check,
  CheckCircle2,
  XCircle,
  Trash2,
  Download,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Camera,
  User,
  RotateCcw,
  Zap,
  Info,
  ChevronRight,
  Maximize2,
  X,
  Eye,
  EyeOff,
  Key,
  ChevronDown,
  ChevronUp,
  Lock,
  FileCode,
  Layers,
  Fingerprint,
  Sliders,
  Edit3
} from 'lucide-react';
import {
  generatePhotoWithNanoBanana,
  checkTaskStatus,
  NanoBananaModel,
  NanoBananaResolution,
  AIProvider,
} from '@/services/nanoBananaService';
import {
  synthesizeMasterPrompt,
  PromptSynthesisResult,
  ReferenceSceneAnalysis,
  ClientIdentityAnalysis,
  getDefaultAnalyses,
  buildMasterPromptFromAnalyses,
} from '@/services/promptSynthesisService';
import {
  validateImageFile,
  resizeImageToMax1024,
  downloadImage,
  createMannequinReferenceImage,
} from '@/utils/imageUtils';
import { GuidedCameraModal, CapturedPhoto } from '@/components/GuidedCameraModal';
import { PromptEditorModal } from '@/components/PromptEditorModal';

// ==========================================
// REFERÊNCIAS EDITÁVEIS (conforme especificado)
// ==========================================
export const REFERENCES = {
  male: [
    { id: 'm1', label: 'Referência 1', src: '' },
    { id: 'm2', label: 'Referência 2', src: '' },
    { id: 'm3', label: 'Referência 3', src: '' },
    { id: 'm4', label: 'Referência 4', src: '' },
    { id: 'm5', label: 'Referência 5', src: '' },
  ],
  female: [
    { id: 'f1', label: 'Referência 1', src: '' },
    { id: 'f2', label: 'Referência 2', src: '' },
    { id: 'f3', label: 'Referência 3', src: '' },
    { id: 'f4', label: 'Referência 4', src: '' },
    { id: 'f5', label: 'Referência 5', src: '' },
  ],
};

// Mensagens rotativas durante a geração
const LOADING_MESSAGES = [
  'Analisando seu rosto...',
  'Recriando a cena...',
  'Finalizando os detalhes...',
];

interface ReferenceItem {
  id: string;
  label: string;
  src: string;
}

interface UploadedUserPhoto {
  id: string;
  name: string;
  dataUrl: string; // Já redimensionada para até 1024px JPEG
  originalSize: string;
}

export function HomePageInner() {
  // Gênero selecionado na Etapa 1

  const { quizData, setGender } = useQuiz();
  const gender = quizData.gender === 'female' ? 'female' : 'male';

  // Estado das referências (permite subir referências manualmente em memória)
  const [referencesState, setReferencesState] = useState<{
    male: ReferenceItem[];
    female: ReferenceItem[];
  }>(REFERENCES);

  // ID da referência selecionada
  const [selectedReferenceId, setSelectedReferenceId] = useState<string>('m1');

  // Código de acesso mantido EXCLUSIVAMENTE em memória (useState)
  const [accessCode, setAccessCode] = useState<string>('');
  const [showCodePassword, setShowCodePassword] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(true);

  // Provedor de IA selecionado (WaveSpeedAI / GPT Image 2.5 Flare padrão de alta velocidade)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(() => {
    try {
      localStorage.setItem('fotoflow_provider', 'wavespeed');
      return 'wavespeed';
    } catch {
      return 'wavespeed';
    }
  });

  // Chave de API da WaveSpeedAI para GPT Image 2.5 (salva no localStorage para conveniência)
  const [waveSpeedApiKey, setWaveSpeedApiKey] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('fotoflow_wavespeed_key') ||
        localStorage.getItem('fotoflow_access_code') ||
        ''
      );
    } catch {
      return '';
    }
  });
  const [showWaveSpeedKey, setShowWaveSpeedKey] = useState<boolean>(false);

  // Seletores de Modelo e Resolução (Nano Banana 2.1, GPT 2.5 Flare, GPT 2.5 Sunburst via WaveSpeedAI)
  const [selectedModel, setSelectedModel] = useState<NanoBananaModel>(() => {
    try {
      const saved = localStorage.getItem('fotoflow_model');
      if (saved === 'nano-banana-2.1' || saved === 'nanobanana-2.1') return 'nano-banana-2.1';
      if (saved === 'gpt-image-2.5-sunburst') return 'gpt-image-2.5-sunburst';
      if (saved === 'gpt-image-2.5-flare') return 'gpt-image-2.5-flare';
      return 'nano-banana-2.1';
    } catch {
      return 'nano-banana-2.1';
    }
  });
  const [selectedResolution, setSelectedResolution] = useState<NanoBananaResolution>(() => {
    try {
      const saved = localStorage.getItem('fotoflow_resolution');
      if (saved === '4K' || saved === '2K' || saved === '1K') return saved;
      return '1K';
    } catch {
      return '1K';
    }
  });

  const handleResolutionChange = (res: NanoBananaResolution) => {
    setSelectedResolution(res);
    try {
      localStorage.setItem('fotoflow_resolution', res);
    } catch {
      // safe
    }
  };

  const handleProviderChange = (prov: AIProvider) => {
    setSelectedProvider(prov);
    try {
      localStorage.setItem('fotoflow_provider', prov);
    } catch {
      // safe
    }
    if (prov === 'wavespeed') {
      const newModel: NanoBananaModel =
        selectedModel === 'gpt-image-2.5-sunburst' ? 'gpt-image-2.5-sunburst' : 'gpt-image-2.5-flare';
      setSelectedModel(newModel);
      try {
        localStorage.setItem('fotoflow_model', newModel);
      } catch {
        // safe
      }
    } else {
      const newModel: NanoBananaModel =
        selectedModel === 'nanobanana-pro' ? 'nanobanana-pro' : 'nanobanana-2';
      setSelectedModel(newModel);
      try {
        localStorage.setItem('fotoflow_model', newModel);
      } catch {
        // safe
      }
    }
  };

  const handleModelChange = (model: NanoBananaModel) => {
    setSelectedModel(model);
    try {
      localStorage.setItem('fotoflow_model', model);
    } catch {
      // safe
    }
  };

  const handleWaveSpeedKeyChange = (val: string) => {
    setWaveSpeedApiKey(val);
    setAccessCode(val);
    try {
      localStorage.setItem('fotoflow_wavespeed_key', val);
      localStorage.setItem('fotoflow_access_code', val);
    } catch {
      // safe
    }
  };

  // Fotos do usuário (Etapa 2)
  const [userPhotos, setUserPhotos] = useState<UploadedUserPhoto[]>([]);
  const [authConfirmed, setAuthConfirmed] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Modal de captura guiada pela câmera e controle de upload manual
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [showManualUpload, setShowManualUpload] = useState<boolean>(false);
  const [cameraNotice, setCameraNotice] = useState<string | null>(null);

  const handleCameraComplete = (photos: CapturedPhoto[]) => {
    setIsCameraModalOpen(false);
    if (!photos || photos.length === 0) return;
    const newPhotos: UploadedUserPhoto[] = photos.map((p, idx) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: `Câmera ${idx + 1} (${p.poseTitle || 'Ao vivo'})`,
      dataUrl: p.dataUrl,
      originalSize: '768x1024 HD',
    }));
    // Prioridade máxima: as fotos capturadas na câmera ao vivo substituem fotos anteriores
    setUserPhotos(newPhotos.slice(0, 5));
    setAuthConfirmed(true);
    setUploadError(null);
    setCameraNotice(`📸 ${photos.length} fotos capturadas pela câmera ao vivo registradas com sucesso para o ensaio!`);
    setTimeout(() => setCameraNotice(null), 8000);
  };

  // Estados de geração (Etapa 3)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [loadingMsgIndex, setLoadingMsgIndex] = useState<number>(0);
  const [dynamicLoadingMsg, setDynamicLoadingMsg] = useState<string>('');
  const [synthesisResult, setSynthesisResult] = useState<PromptSynthesisResult | null>(null);
  const [showPromptDetails, setShowPromptDetails] = useState<boolean>(false);
  const [generatedPhotoUrl, setGeneratedPhotoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [technicalErrorMessage, setTechnicalErrorMessage] = useState<string | null>(null);
  const [isSafetyBlocked, setIsSafetyBlocked] = useState<boolean>(false);

  // Estados de Personalização e Edição Manual de Prompts Mestre
  const [isPromptModalOpen, setIsPromptModalOpen] = useState<boolean>(false);
  const [customScene, setCustomScene] = useState<ReferenceSceneAnalysis | null>(() => {
    try {
      const saved = localStorage.getItem('fotoflow_custom_scene');
      if (saved && (saved.includes('Tailored premium suit') || saved.includes('suit jacket'))) {
        localStorage.removeItem('fotoflow_custom_scene');
        return null;
      }
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [customClient, setCustomClient] = useState<ClientIdentityAnalysis | null>(() => {
    try {
      const saved = localStorage.getItem('fotoflow_custom_client');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [customMasterText, setCustomMasterText] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('fotoflow_custom_master_prompt');
      if (
        saved &&
        (saved.includes('BMW') ||
          saved.includes('Refine this image') ||
          saved.includes('CRITICAL HIGH-FIDELITY IDENTITY MATCH') ||
          saved.includes('Tailored premium suit jacket') ||
          saved.includes('suit jacket'))
      ) {
        localStorage.removeItem('fotoflow_custom_master_prompt');
        localStorage.removeItem('fotoflow_custom_prompt_active');
        localStorage.removeItem('fotoflow_custom_scene');
        localStorage.removeItem('fotoflow_custom_client');
        return null;
      }
      return saved || null;
    } catch {
      return null;
    }
  });
  const [isCustomPromptActive, setIsCustomPromptActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fotoflow_custom_prompt_active') === 'true';
    } catch {
      return false;
    }
  });

  // Modo Manequim Seguro: desativado por padrão no WaveSpeed para manter 100% da foto de referência (roupa, halo de luz e corte) limpos
  const [useMannequinMode, setUseMannequinMode] = useState<boolean>(false);

  // Técnica de Renderização e Referência Visual:
  // - 'organic_fusion' (PADRÃO RECOMENDADO): Referência Visual (Img #1) + Fotos do Cliente (Img #2+)
  //   Garante 100% de fidelidade de distância, enquadramento, cenário, iluminação e roupa com re-síntese total anti-colagem.
  // - 'client_first': Fotos do Cliente (Img #1) + Referência Visual (Img #2). Prioriza a ancoragem biométrica facial no gerador.
  // - 'prompt_only': Apenas Fotos do Cliente (sem foto de referência visual), usando a descrição textual da cena.
  const [renderingTechnique, setRenderingTechnique] = useState<'organic_fusion' | 'client_first' | 'prompt_only'>(() => {
    try {
      const stored = localStorage.getItem('fotoflow_rendering_technique');
      if (stored === 'organic_fusion' || stored === 'client_first' || stored === 'prompt_only') {
        return stored;
      }
      return 'organic_fusion';
    } catch {
      return 'organic_fusion';
    }
  });

  const handleSelectTechnique = (tech: 'organic_fusion' | 'client_first' | 'prompt_only') => {
    setRenderingTechnique(tech);
    try {
      localStorage.setItem('fotoflow_rendering_technique', tech);
    } catch {
      // safe
    }
  };

  // Retoque Executivo & Leve Maquiagem de Estúdio (Sem pele plástica, foco em perfil profissional)
  const [useExecutiveRetouch, setUseExecutiveRetouch] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('fotoflow_executive_retouch');
      return saved !== null ? saved === 'true' : true; // Padrão: ativado a pedido do usuário
    } catch {
      return true;
    }
  });

  const handleToggleExecutiveRetouch = (val: boolean) => {
    setUseExecutiveRetouch(val);
    try {
      localStorage.setItem('fotoflow_executive_retouch', val ? 'true' : 'false');
    } catch {
      // safe
    }
  };

  const handleSavePromptConfig = (config: {
    scene: ReferenceSceneAnalysis;
    client: ClientIdentityAnalysis;
    masterText: string;
    isActive: boolean;
  }) => {
    setCustomScene(config.scene);
    setCustomClient(config.client);
    setCustomMasterText(config.masterText);
    setIsCustomPromptActive(config.isActive);
    try {
      localStorage.setItem('fotoflow_custom_scene', JSON.stringify(config.scene));
      localStorage.setItem('fotoflow_custom_client', JSON.stringify(config.client));
      localStorage.setItem('fotoflow_custom_master_prompt', config.masterText);
      localStorage.setItem('fotoflow_custom_prompt_active', config.isActive ? 'true' : 'false');
    } catch {
      // safe
    }
  };

  const handleResetPromptToDefault = () => {
    setIsCustomPromptActive(false);
    setCustomMasterText(null);
    setCustomScene(null);
    setCustomClient(null);
    try {
      localStorage.removeItem('fotoflow_custom_scene');
      localStorage.removeItem('fotoflow_custom_client');
      localStorage.removeItem('fotoflow_custom_master_prompt');
      localStorage.removeItem('fotoflow_custom_prompt_active');
    } catch {
      // safe
    }
  };

  // Armazenamento do último taskId gerado para recuperação em caso de timeout
  const [currentTaskId, setCurrentTaskId] = useState<string>(() => {
    try {
      return sessionStorage.getItem('fotoflow_last_task_id') || 'a8962dc215aef693bae599b169e7350d';
    } catch {
      return 'a8962dc215aef693bae599b169e7350d';
    }
  });
  const [isCheckingTask, setIsCheckingTask] = useState<boolean>(false);
  const [checkTaskMessage, setCheckTaskMessage] = useState<string | null>(null);

  // Métricas da sessão
  const [generationsCount, setGenerationsCount] = useState<number>(0);

  // Modal de visualização ampliada
  const [previewZoomUrl, setPreviewZoomUrl] = useState<string | null>(null);

  // Refs para inputs de arquivo
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraDirectInputRef = useRef<HTMLInputElement | null>(null);
  const refFileInputRef = useRef<HTMLInputElement | null>(null);
  const targetRefUploadId = useRef<string | null>(null);
  const step3SectionRef = useRef<HTMLDivElement | null>(null);

  // Rotação de mensagens no loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'loading') {
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2400);
    } else {
      setLoadingMsgIndex(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Obter lista atual de referências conforme gênero
  const currentReferences = referencesState[gender];
  const activeReference = currentReferences.find((r) => r.id === selectedReferenceId);
  const hasValidReferenceImage = Boolean(activeReference && activeReference.src);

  // Validação de requisitos
  const hasMinPhotos = userPhotos.length >= 1;
  const hasMaxPhotos = userPhotos.length <= 5;
  const activeApiKey = (
    selectedProvider === 'wavespeed'
      ? (waveSpeedApiKey || accessCode)
      : (accessCode || waveSpeedApiKey)
  ).trim();
  const hasAccessCode = Boolean(activeApiKey && activeApiKey.trim());
  const canGenerate =
    hasValidReferenceImage &&
    hasMinPhotos &&
    hasMaxPhotos &&
    authConfirmed &&
    hasAccessCode &&
    status !== 'loading';

  // Calcular progresso para a barra superior
  const getProgressPercentage = () => {
    let score = 0;
    if (hasValidReferenceImage) score += 33.3;
    if (hasMinPhotos && authConfirmed) score += 33.3;
    if (status === 'success') score += 33.4;
    return Math.min(100, Math.round(score));
  };

  // Upload manual de referência para o card
  const handleReferenceUploadTrigger = (refId: string) => {
    targetRefUploadId.current = refId;
    refFileInputRef.current?.click();
  };

  const handleReferenceFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetRefUploadId.current) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Arquivo de referência inválido.');
      return;
    }

    try {
      const resized = await resizeImageToMax1024(file, 1024, 0.85);
      const targetId = targetRefUploadId.current;

      setReferencesState((prev) => ({
        ...prev,
        [gender]: prev[gender].map((item) =>
          item.id === targetId ? { ...item, src: resized } : item
        ),
      }));

      // Seleciona automaticamente o card onde a foto foi inserida
      setSelectedReferenceId(targetId);
      setUploadError(null);
    } catch (err: any) {
      setUploadError('Erro ao carregar a imagem de referência.');
    } finally {
      if (refFileInputRef.current) {
        refFileInputRef.current.value = '';
      }
    }
  };

  // Upload das fotos da pessoa (Etapa 2)
  const handleUserFiles = async (files: FileList | File[]) => {
    setUploadError(null);
    const fileList = Array.from(files);

    if (userPhotos.length + fileList.length > 5) {
      setUploadError(`Você pode enviar no máximo 5 fotos. Limite de ${5 - userPhotos.length} foto(s) restantes.`);
      return;
    }

    const newPhotos: UploadedUserPhoto[] = [];

    for (const file of fileList) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setUploadError(validation.error || 'Erro na validação do arquivo.');
        return;
      }

      try {
        const resized = await resizeImageToMax1024(file, 1024, 0.85);
        newPhotos.push({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          dataUrl: resized,
          originalSize: `${(file.size / 1024).toFixed(0)} KB`,
        });
      } catch (err) {
        setUploadError(`Erro ao processar imagem ${file.name}.`);
        return;
      }
    }

    setUserPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
  };

  const handleRemovePhoto = (id: string) => {
    setUserPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Executar a Geração (Etapa 3)
  const handleGenerate = async () => {
    if (!canGenerate || !activeReference?.src) return;

    setStatus('loading');
    setErrorMessage(null);
    setTechnicalErrorMessage(null);
    setIsSafetyBlocked(false);
    setDynamicLoadingMsg('🔍 Etapa 1/3: Analisando roupa, pose, iluminação e cenário da referência...');

    // Rola suavemente até a área de resultado
    setTimeout(() => {
      step3SectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const userImagesBase64 = userPhotos.map((p) => p.dataUrl);

      let effectivePrompt = '';
      if (isCustomPromptActive && customMasterText && customMasterText.trim()) {
        effectivePrompt = customMasterText.trim();
        setDynamicLoadingMsg('⚡ Usando seu Prompt Mestre personalizado e editado manualmente...');
        const def = getDefaultAnalyses(gender);
        setSynthesisResult({
          referenceSceneJson: customScene || def.referenceSceneJson,
          clientIdentityJson: customClient || def.clientIdentityJson,
          masterPrompt: effectivePrompt,
        });
      } else {
        // FLUXO DE ANÁLISE E SÍNTESE INTELIGENTE:
        // Analisa via Gemini para capturar enquadramento, distância, restaurante/skyline, iluminação e biometria do cliente
        const synthesis = await synthesizeMasterPrompt({
          referenceImage: activeReference.src,
          userImages: userImagesBase64,
          gender,
          fastMode: false,
          renderingTechnique,
          onProgress: (msg) => setDynamicLoadingMsg(msg),
        });

        effectivePrompt = synthesis.masterPrompt;
        setSynthesisResult(synthesis);
      }

      // Aplica diretiva reforçada de retoque executivo & leve maquiagem de estúdio se ativado
      if (useExecutiveRetouch && effectivePrompt && !effectivePrompt.includes('EXECUTIVE GROOMING')) {
        effectivePrompt += `\n\n### MANDATORY EXECUTIVE GROOMING & HIGH-END COMMERCIAL RETOUCHING:
- COMMERCIAL HEADSHOT STANDARD: Apply subtle high-end studio grooming for an executive professional profile (LinkedIn / Forbes editorial headshot).
- FLAWLESS YET REALISTIC COMPLEXION: Smooth out and conceal minor skin blemishes, redness, pimples, forehead marks, and undereye dark circles with light, sheer studio makeup/grooming.
- ABSOLUTELY ZERO PLASTIC SKIN: Keep authentic micro-pores, crisp hair details, and genuine facial anatomy. The skin must look impeccably clean, healthy, and rested — NEVER blurry, waxy, or artificial.`;
      }

      // Se o Modo Manequim estiver ativo e estiver no modo fusão, desidentifica a referência
      let finalReferenceImage = activeReference.src;
      if (useMannequinMode && renderingTechnique === 'organic_fusion') {
        setDynamicLoadingMsg('🛡️ Modo Manequim: Desidentificando rosto da referência para focar 100% no seu rosto...');
        try {
          finalReferenceImage = await createMannequinReferenceImage(activeReference.src);
        } catch {
          finalReferenceImage = activeReference.src;
        }
      }

      const activeKeyToUse = (
        selectedProvider === 'wavespeed'
          ? (waveSpeedApiKey || accessCode)
          : (accessCode || waveSpeedApiKey)
      ).trim();

      const techniqueLabel =
        renderingTechnique === 'organic_fusion'
          ? 'Fusão Orgânica com Referência'
          : renderingTechnique === 'client_first'
          ? 'Identidade Prioritária #1'
          : 'Síntese Pura sem Imagem';

      const modelDisplayName =
        selectedModel === 'nano-banana-2.1' || selectedModel === 'nanobanana-2.1'
          ? 'Google Nano Banana 2.1'
          : selectedModel === 'gpt-image-2.5-sunburst'
          ? 'OpenAI GPT Image 2.5 Sunburst'
          : 'OpenAI GPT Image 2.5 Flare';

      setDynamicLoadingMsg(
        `🚀 WaveSpeedAI: Iniciando ${modelDisplayName} [${selectedResolution}] (${techniqueLabel})...`
      );

      // Usando chave/código ativo com modelo, resolução e o prompt mestre sintetizado
      const generatedUrl = await generatePhotoWithNanoBanana({
        referenceImage: finalReferenceImage,
        userImages: userImagesBase64,
        renderingTechnique,
        skipReferenceImageInGenerator: renderingTechnique === 'prompt_only',
        accessCode: activeKeyToUse,
        provider: selectedProvider,
        model: selectedModel,
        resolution: selectedResolution,
        prompt: effectivePrompt,
        onProgress: (msg) => setDynamicLoadingMsg(msg),
        onTaskIdCreated: (tId) => setCurrentTaskId(tId),
      });

      setGeneratedPhotoUrl(generatedUrl);
      setStatus('success');
      setGenerationsCount((prev) => prev + 1);
    } catch (err: any) {
      if (err?.taskId) {
        setCurrentTaskId(err.taskId);
      }
      // Nunca imprimir o código de acesso no log
      const safeLogMsg = (err?.message || 'Erro').replace(accessCode.trim(), '[REDACTADO]');
      console.error('Falha na geração:', safeLogMsg);
      setStatus('error');
      setErrorMessage(
        err.message || 'Ocorreu uma falha ao gerar a foto. Por favor, tente novamente.'
      );
      setTechnicalErrorMessage(err.technicalDetails || null);
      setIsSafetyBlocked(Boolean(err.safetyBlocked));
    }
  };

  // Recuperar resultado de uma tarefa existente (como após timeout ou reload)
  const handleCheckExistingTask = async () => {
    if (!currentTaskId) return;
    setIsCheckingTask(true);
    setCheckTaskMessage(null);
    try {
      const activeKeyToUse = (
        selectedProvider === 'wavespeed'
          ? (waveSpeedApiKey || accessCode)
          : (accessCode || waveSpeedApiKey)
      ).trim();

      const url = await checkTaskStatus(currentTaskId, activeKeyToUse);
      if (url) {
        setGeneratedPhotoUrl(url);
        setStatus('success');
        setGenerationsCount((prev) => prev + 1);
        setErrorMessage(null);
        setTechnicalErrorMessage(null);
      }
    } catch (err: any) {
      setCheckTaskMessage(err?.message || 'A foto ainda não está pronta ou não foi encontrada.');
    } finally {
      setIsCheckingTask(false);
    }
  };

  // Recomeçar fluxo
  const handleReset = () => {
    setStatus('idle');
    setGeneratedPhotoUrl(null);
    setSynthesisResult(null);
    setShowPromptDetails(false);
    setErrorMessage(null);
    setTechnicalErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Baixar foto gerada
  const handleDownload = () => {
    if (!generatedPhotoUrl) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadImage(generatedPhotoUrl, `fotoflow-${timestamp}.png`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex flex-col font-sans">
      {/* Input oculto para upload de referência */}
      <input
        type="file"
        ref={refFileInputRef}
        onChange={handleReferenceFileSelected}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* Input oculto para captura direta da câmera do dispositivo (garante foto 100% nítida) */}
      <input
        type="file"
        ref={cameraDirectInputRef}
        accept="image/*"
        capture="user"
        multiple
        onChange={(e) => {
          if (e.target.files) handleUserFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* HEADER PRINCIPAL */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-purple-900/20 px-4 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B5CF6] via-purple-600 to-[#F59E0B] p-[1px] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/20">
              <div className="w-full h-full bg-[#0a0a0f] rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#F59E0B]" />
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                FotoFlow <span className="text-xs px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40 font-semibold uppercase tracking-wider">Teste</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Gerador de fotos ultra-realistas com IA
              </p>
            </div>
          </div>

          {/* Controles de Prompt, Tag da API e Download */}
          <div className="flex items-center gap-2">
            {/* Botão de Download do Projeto Completo (.md) */}
            <a
              href="/download"
              download="FOTOFLOW_COMPLETO.md"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/20 cursor-pointer"
              title="Baixar arquivo único (.md) com 100% da arquitetura, prompts e códigos para agentes"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Baixar Projeto (.md)</span>
              <span className="sm:hidden">Baixar .md</span>
            </a>

            <button
              type="button"
              onClick={() => setIsPromptModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                isCustomPromptActive
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-violet-500/50 hover:text-white'
              }`}
              title="Visualizar e editar os prompts mestre da IA em seções separadas"
            >
              <Sliders className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Prompts Mestre</span>
              <span className="sm:hidden">Prompts</span>
              {isCustomPromptActive ? (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  Editado
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">
                  (Padrão)
                </span>
              )}
            </button>

            {/* Tag com API e Resolução selecionadas */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
              <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>
                API:{' '}
                <strong className="text-slate-300 font-mono">
                  {selectedModel === 'nano-banana-2.1' || selectedModel === 'nanobanana-2'
                    ? 'Nano Banana 2.1'
                    : selectedModel === 'gpt-image-2.5-sunburst'
                    ? 'GPT 2.5 Sunburst'
                    : 'GPT 2.5 Flare'}{' '}
                  ({selectedResolution})
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* BARRA DE PROGRESSO DO FLUXO */}
        <div className="max-w-4xl mx-auto mt-3">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1.5 px-0.5">
            <span className={hasValidReferenceImage ? 'text-[#A78BFA] flex items-center gap-1' : ''}>
              {hasValidReferenceImage && <Check className="w-3 h-3 text-[#8B5CF6]" />}
              1. Referência
            </span>
            <span className={hasMinPhotos && authConfirmed ? 'text-[#A78BFA] flex items-center gap-1' : ''}>
              {hasMinPhotos && authConfirmed && <Check className="w-3 h-3 text-[#8B5CF6]" />}
              2. Suas Fotos ({userPhotos.length}/5)
            </span>
            <span className={status === 'success' ? 'text-[#F59E0B] font-semibold' : ''}>
              3. Resultado
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className="h-full bg-gradient-to-r from-[#8B5CF6] via-purple-500 to-[#F59E0B] transition-all duration-500 ease-out shadow-sm shadow-[#8B5CF6]/50"
              style={{ width: `${Math.max(8, getProgressPercentage())}%` }}
            />
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL (3 ETAPAS EM UM ÚNICO FLUXO) */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* ============================================================ */}
        {/* CARD RECOLHÍVEL: ⚙️ CONFIGURAÇÕES (CHAVE EM MEMÓRIA)         */}
        {/* ============================================================ */}
        <section className="bg-[#12121a] rounded-2xl border border-purple-900/30 shadow-xl overflow-hidden transition-all">
          {/* Cabeçalho do Card (Clicável para expandir/recolher) */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            className="w-full px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between text-left hover:bg-slate-900/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base sm:text-lg">⚙️</span>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                  Configurações
                  <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Modo Teste
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  {hasAccessCode ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />{' '}
                      {selectedProvider === 'wavespeed'
                        ? 'Chave WaveSpeedAI (GPT Image 2.5) ativa'
                        : 'Código de acesso Nano Banana ativo'}
                    </span>
                  ) : (
                    <span className="text-amber-400">
                      Obrigatório: insira{' '}
                      {selectedProvider === 'wavespeed'
                        ? 'sua chave da API WaveSpeedAI'
                        : 'o código de acesso'}{' '}
                      para habilitar a geração
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasAccessCode ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                  <Check className="w-3 h-3" /> Ativo
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                  Pendente
                </span>
              )}
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                {isSettingsOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-300" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-300" />
                )}
              </div>
            </div>
          </button>

          {/* Conteúdo Recolhível */}
          {isSettingsOpen && (
            <div className="px-4 sm:px-6 pb-5 pt-1 border-t border-slate-800/80 space-y-4">
              {/* SELETOR DE PROVEDOR DE IA */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Plataforma & Motor de IA</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    WaveSpeed AI (Google & OpenAI)
                  </span>
                </label>
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-purple-950/30 border border-emerald-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">WaveSpeed AI Hub Unificado</p>
                      <p className="text-[10px] text-slate-400">Roda Google Nano Banana 2.1 e OpenAI GPT 2.5 com a mesma chave</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Ativo
                  </span>
                </div>
              </div>

              {/* SELETORES: MODELO E RESOLUÇÃO CONFORME PROVEDOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Seletor de Modelo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Modelo de IA</span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {selectedModel === 'nano-banana-2.1' || selectedModel === 'nanobanana-2'
                        ? 'Google Nano Banana 2.1'
                        : selectedModel === 'gpt-image-2.5-sunburst'
                        ? 'OpenAI Sunburst'
                        : 'OpenAI Flare'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0a0a0f] rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleModelChange('nano-banana-2.1')}
                      className={`py-2 px-1.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        selectedModel === 'nano-banana-2.1' || selectedModel === 'nanobanana-2'
                          ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">Nano Banana 2.1</span>
                      <span className="text-[8.5px] opacity-90 font-normal">🍌 Google</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModelChange('gpt-image-2.5-flare')}
                      className={`py-2 px-1.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        selectedModel === 'gpt-image-2.5-flare'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">GPT 2.5 Flare</span>
                      <span className="text-[8.5px] opacity-80 font-normal">⚡ Rápido</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModelChange('gpt-image-2.5-sunburst')}
                      className={`py-2 px-1.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        selectedModel === 'gpt-image-2.5-sunburst'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">Sunburst</span>
                      <span className="text-[8.5px] opacity-80 font-normal">✨ Ultra 4K</span>
                    </button>
                  </div>
                </div>

                {/* Seletor de Resolução */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Resolução</span>
                    <span className="text-[10px] text-purple-400 font-mono">
                      {selectedResolution === '4K'
                        ? '4K Ultra'
                        : selectedResolution === '2K'
                        ? '2K QHD'
                        : '1K HD'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0a0a0f] rounded-xl border border-slate-800">
                    {(['1K', '2K', '4K'] as const).map((res) => (
                      <button
                        key={res}
                        type="button"
                        onClick={() => handleResolutionChange(res)}
                        className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                          selectedResolution === res
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dica de Performance e Decisão do Usuário */}
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-emerald-300">Modelos WaveSpeed:</strong>{' '}
                  <span className="text-amber-300 font-semibold">Nano Banana 2.1 (Google)</span> oferece alta fidelidade anatômica para edição com referências;{' '}
                  <span className="text-emerald-300 font-semibold">GPT 2.5 Flare (OpenAI)</span> entrega ensaios ultrarrápidos (15–45s); e{' '}
                  <span className="text-emerald-300 font-semibold">GPT 2.5 Sunburst</span> entrega máxima definição 4K na GPU.
                </p>
              </div>

              {/* CAMPO DE AUTENTICAÇÃO: WAVESPEED AI (CHAVE ÚNICA) */}
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
                <div>
                  <label className="block text-xs font-semibold text-emerald-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-emerald-400" />
                      Chave de API do WaveSpeedAI (para Nano Banana 2.1 & GPT 2.5)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">WAVESPEED_KEY</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showWaveSpeedKey ? 'text' : 'password'}
                      value={waveSpeedApiKey || accessCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleWaveSpeedKeyChange(val);
                        setAccessCode(val);
                      }}
                      placeholder="Cole sua API Key da WaveSpeedAI (ex: ws_...)"
                      autoComplete="off"
                      spellCheck="false"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#0a0a0f] border border-emerald-500/40 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 font-mono transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWaveSpeedKey((prev) => !prev)}
                      title={showWaveSpeedKey ? 'Ocultar chave' : 'Mostrar chave'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                    >
                      {showWaveSpeedKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Guia Passo a Passo da Implementação WaveSpeed */}
                <div className="p-3 rounded-lg bg-[#0a0a0f]/80 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                  <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    Como funciona a WaveSpeed no FotoFlow:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                    <li>
                      Acesse{' '}
                      <a
                        href="https://wavespeed.ai"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-300 underline hover:text-emerald-200"
                      >
                        wavespeed.ai
                      </a>{' '}
                      e gere sua API Key (começa com <code className="text-emerald-300 font-mono">ws_...</code>).
                    </li>
                    <li>Cole sua chave no campo acima (fica salva no navegador de forma persistente).</li>
                    <li>
                      Endpoint ativo:{' '}
                      <code className="text-emerald-300 bg-black/40 px-1 py-0.5 rounded font-mono">
                        {selectedModel === 'nano-banana-2.1' || selectedModel === 'nanobanana-2'
                          ? '/api/v3/google/nano-banana-2.1/edit'
                          : `/api/v3/openai/${selectedModel}/edit`}
                      </code>
                    </li>
                  </ol>
                </div>
              </div>

              {/* Bloco de Exportação e Download Direto do Arquivo Mestre */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      FOTOFLOW_COMPLETO.md
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        Arquivo Único para Agentes
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Exportação de 100% da arquitetura, prompts anti-colagem, schemas SQL e backend para Lovable, Jules ou Cursor.
                    </p>
                  </div>
                </div>
                <a
                  href="/download"
                  download="FOTOFLOW_COMPLETO.md"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 hover:scale-[1.02] shadow-md shadow-emerald-500/20 transition-all shrink-0 cursor-pointer text-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo Completo</span>
                </a>
              </div>

              {/* Status e Aviso Discreto Obrigatório */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-400">
                    Modo seguro: as credenciais ficam salvas na memória ou armazenamento local do seu navegador.
                  </span>
                </div>
                {hasAccessCode && (
                  <span className="text-emerald-400 font-mono text-[10px]">
                    Status: {selectedProvider === 'wavespeed' ? 'chave WaveSpeed configurada' : 'código configurado'} ({selectedProvider === 'wavespeed' ? waveSpeedApiKey.trim().length : accessCode.trim().length} chars)
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* ETAPA 1 — ESCOLHA A REFERÊNCIA                               */}
        {/* ============================================================ */}
        <section className="bg-[#12121a] rounded-2xl border border-slate-800/80 p-4 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40 flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Escolha a Referência de Estilo
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 pl-8">
                Selecione o cenário e a pose desejada para a sua foto final.
              </p>
            </div>

            {/* Seletor no topo: Masculino | Feminino */}
            <div className="inline-flex p-1 bg-[#0a0a0f] rounded-xl border border-slate-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setGender('male');
                  setSelectedReferenceId('m1');
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  gender === 'male'
                    ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Masculino
              </button>
              <button
                type="button"
                onClick={() => {
                  setGender('female');
                  setSelectedReferenceId('f1');
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  gender === 'female'
                    ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Feminino
              </button>
            </div>
          </div>

          {/* Grid com 5 imagens de referência (2 colunas mobile, 5 desktop) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {currentReferences.map((refItem) => {
              const isSelected = selectedReferenceId === refItem.id;
              const hasSrc = Boolean(refItem.src);

              return (
                <div
                  key={refItem.id}
                  onClick={() => {
                    setSelectedReferenceId(refItem.id);
                  }}
                  className={`group relative rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between overflow-hidden bg-[#0a0a0f] aspect-[3/4] ${
                    isSelected
                      ? 'border-[#8B5CF6] ring-4 ring-[#8B5CF6]/20 shadow-lg shadow-[#8B5CF6]/25'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Badge de Selecionado */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Conteúdo do Card: Se tem imagem mostra preview; se vazio mostra botão "Enviar imagem" */}
                  {hasSrc ? (
                    <div className="relative w-full h-full">
                      <img
                        src={refItem.src}
                        alt={refItem.label}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                        <span className="text-xs font-medium text-white truncate drop-shadow">
                          {refItem.label}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReferenceUploadTrigger(refItem.id);
                          }}
                          className="mt-1 text-[10px] text-[#A78BFA] hover:text-white underline self-start"
                        >
                          Trocar foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center border border-dashed border-slate-700/60 rounded-xl hover:border-purple-500/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center mb-2 text-slate-400 group-hover:text-[#8B5CF6] transition-colors">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-300 mb-1">
                        {refItem.label}
                      </span>
                      <p className="text-[10px] text-slate-500 mb-3">
                        Sem imagem definida
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReferenceUploadTrigger(refItem.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#8B5CF6]/20 hover:bg-[#8B5CF6] text-[#A78BFA] hover:text-white text-xs font-medium border border-[#8B5CF6]/40 transition-all flex items-center gap-1 shadow-sm"
                      >
                        <UploadCloud className="w-3 h-3" />
                        Enviar imagem
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Aviso se a referência ativa ainda não tiver imagem */}
          {!hasValidReferenceImage && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                O card selecionado (<strong>{activeReference?.label}</strong>) ainda não possui imagem. Clique em <strong>"Enviar imagem"</strong> no card para carregar a referência desejada para o teste.
              </span>
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* ETAPA 2 — ENVIE SUAS FOTOS                                    */}
        {/* ============================================================ */}
        <section className="bg-[#12121a] rounded-2xl border border-slate-800/80 p-4 sm:p-6 shadow-xl relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40 flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Envie Suas Fotos
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 pl-8">
                Envie fotos reais da pessoa para a IA aprender os traços faciais.
              </p>
            </div>

            {/* Contador de fotos */}
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                hasMinPhotos
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              {userPhotos.length}/5 fotos
            </div>
          </div>

          {/* ======================================================== */}
          {/* FORMA PRINCIPAL: BOTÃO GRANDE DE CAPTURA GUIADA POR CÂMERA */}
          {/* ======================================================== */}
          <div className="mb-5 p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#161622] to-indigo-950/30 border border-[#8B5CF6]/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA] shrink-0">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  Captura Guiada por Câmera
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold uppercase tracking-wider">
                    Recomendado
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  4 poses automáticas com IA facial em tempo real para o melhor resultado.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsCameraModalOpen(true)}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-purple-600 hover:from-[#7C3AED] hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#8B5CF6]/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <span>📸 Câmera ao Vivo com IA</span>
              </button>

              <button
                type="button"
                onClick={() => cameraDirectInputRef.current?.click()}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="Abre a câmera do celular/computador diretamente"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Câmera do Dispositivo</span>
              </button>

              <button
                type="button"
                onClick={() => setShowManualUpload((prev) => !prev)}
                className="text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-center"
              >
                {showManualUpload ? 'Ocultar galeria' : 'Prefiro da galeria'}
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* ALTERNATIVA: UPLOAD MANUAL DA GALERIA                    */}
          {/* ======================================================== */}
          {(showManualUpload || userPhotos.length === 0) && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Upload alternativo de arquivos:</span>
                <span className="text-[11px] text-slate-500">Mínimo 3 fotos (máx 5)</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files) handleUserFiles(e.target.files);
                  e.target.value = '';
                }}
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files) {
                    handleUserFiles(e.dataTransfer.files);
                  }
                }}
                onClick={() => {
                  if (userPhotos.length < 5) {
                    fileInputRef.current?.click();
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-5 sm:p-7 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 scale-[1.01]'
                    : userPhotos.length >= 5
                    ? 'border-slate-800 bg-[#0a0a0f]/50 cursor-not-allowed opacity-60'
                    : 'border-slate-700/80 bg-[#0a0a0f] hover:border-[#8B5CF6]/70 hover:bg-[#8B5CF6]/5'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8B5CF6]/20 to-purple-600/10 border border-[#8B5CF6]/30 flex items-center justify-center mb-2.5 text-[#A78BFA]">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <h3 className="text-xs sm:text-sm font-semibold text-white mb-1">
                  {userPhotos.length >= 5
                    ? 'Limite máximo atingido (5 fotos)'
                    : 'Escolha fotos da galeria ou arraste aqui'}
                </h3>
                <p className="text-[11px] text-slate-400 max-w-sm mb-1">
                  Formatos aceitos: JPG, PNG, WEBP (até 10 MB cada foto).
                </p>
              </div>
            </div>
          )}

          {/* Mensagem de Sucesso da Câmera */}
          {cameraNotice && (
            <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between gap-2 text-xs text-emerald-300 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="font-medium">{cameraNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setCameraNotice(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mensagem de Erro de Upload */}
          {uploadError && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Miniaturas das fotos enviadas com botão de remover */}
          {userPhotos.length > 0 && (
            <div className="mt-5">
              <div className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  Fotos ativas para o ensaio ({userPhotos.length}/5)
                  {userPhotos.some((p) => p.name.includes('Câmera')) && (
                    <span className="px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#A78BFA] text-[10px] font-mono border border-[#8B5CF6]/40">
                      📸 Câmera ao vivo
                    </span>
                  )}
                </span>
                <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Pronta(s) para o ensaio
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {userPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    onClick={() => setPreviewZoomUrl(photo.dataUrl)}
                    className="relative group rounded-xl border border-slate-800 bg-[#0a0a0f] overflow-hidden aspect-[3/4] cursor-pointer hover:border-[#8B5CF6]/60 transition-colors"
                    title="Clique para ampliar e ver nitidez"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={`Foto da pessoa ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-slate-200">
                      #{index + 1}
                    </div>
                    {/* Botão de remover miniatura */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(photo.id);
                      }}
                      title="Remover foto"
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-md z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1.5 right-1.5 p-1 rounded bg-black/50 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dicas visuais (boas práticas e o que evitar) */}
          <div className="mt-6 p-4 rounded-xl bg-[#0a0a0f] border border-slate-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#8B5CF6]" />
              Dicas para o melhor resultado:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Rosto nítido e em close</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Boa iluminação frontal natural</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Ângulos variados (frente e perfil leve)</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-rose-400">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Evite óculos escuros ou chapéus</span>
                </div>
                <div className="flex items-center gap-2 text-rose-400">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Evite fotos desfocadas ou tremidas</span>
                </div>
                <div className="flex items-center gap-2 text-rose-400">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Evite fotos com várias pessoas juntas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkbox Obrigatório de Autorização */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={authConfirmed}
                onChange={(e) => setAuthConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 text-[#8B5CF6] focus:ring-[#8B5CF6] focus:ring-offset-0 bg-slate-900 cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-slate-300 group-hover:text-white transition-colors leading-relaxed select-none">
                Confirmo que tenho autorização para usar estas fotos.
              </span>
            </label>
          </div>
        </section>

        {/* ============================================================ */}
        {/* ETAPA 3 — GERAR E RESULTADO                                   */}
        {/* ============================================================ */}
        <section ref={step3SectionRef} className="space-y-4 sm:space-y-6">

          {/* CARD DE VISUALIZAÇÃO E AJUSTE DO PROMPT MESTRE (SEPARADO EM DIRETIVAS) */}
          <div className="bg-[#11121c] rounded-2xl border border-purple-900/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 mt-0.5 sm:mt-0">
                <FileCode className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    Prompt Mestre Configurado
                  </h3>
                  {isCustomPromptActive ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Personalizado Ativo
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Padrão Otimizado (4 Blocos)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  {isCustomPromptActive
                    ? 'A geração usará fielmente seu prompt editado manualmente.'
                    : '100% Fidelidade Facial e Barba Real • Descarte de traços e barba da referência • Roupa e Cenário da referência'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-end">
              {isCustomPromptActive && (
                <button
                  type="button"
                  onClick={handleResetPromptToDefault}
                  className="px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer underline"
                >
                  Restaurar padrão
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsPromptModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-violet-500/60 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-violet-400" />
                <span>Ver Prompts Separados / Editar</span>
              </button>
            </div>
          </div>

          {/* SELETOR DE TÉCNICA: FUSÃO ORGÂNICA vs IDENTIDADE PRIORITÁRIA vs SÍNTESE PURA */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-[#13141f] to-violet-950/30 border border-amber-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <span>Técnica de Renderização & Referência Visual</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Otimizado Anti-Colagem
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Escolha como o motor de IA utiliza a foto de referência e suas selfies para gerar o ensaio
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
              {/* Opção 1: Fusão Orgânica com Referência (Padrão e Recomendado) */}
              <button
                type="button"
                onClick={() => handleSelectTechnique('organic_fusion')}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  renderingTechnique === 'organic_fusion'
                    ? 'bg-amber-500/15 border-amber-500/70 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>✨ Fusão Orgânica</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    <strong className="text-amber-300">Envia Referência + Rosto:</strong> Re-sintetiza o corpo inteiro organicamente com a luz, restaurante e pose da referência, eliminando cortes de pescoço e mantendo enquadramento 100% fiel.
                  </p>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Img #1: Referência • Img #2: Seu Rosto</span>
                  <span className={`w-2 h-2 rounded-full ${renderingTechnique === 'organic_fusion' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`}></span>
                </div>
              </button>

              {/* Opção 2: Identidade Prioritária */}
              <button
                type="button"
                onClick={() => handleSelectTechnique('client_first')}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  renderingTechnique === 'client_first'
                    ? 'bg-violet-500/15 border-violet-500/70 shadow-lg shadow-violet-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>👤 Identidade #1 Prioritária</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      Hiper-Fidelidade
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    <strong className="text-violet-300">Seu Rosto em 1º Lugar:</strong> Ancla a biometria facial e barba como imagem primária absoluta e usa a referência em 2º lugar como guia de cenário e pose.
                  </p>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Img #1: Seu Rosto • Img #2: Referência</span>
                  <span className={`w-2 h-2 rounded-full ${renderingTechnique === 'client_first' ? 'bg-violet-400 animate-pulse' : 'bg-slate-600'}`}></span>
                </div>
              </button>

              {/* Opção 3: Síntese Pura por Descrição Textual */}
              <button
                type="button"
                onClick={() => handleSelectTechnique('prompt_only')}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  renderingTechnique === 'prompt_only'
                    ? 'bg-blue-500/15 border-blue-500/70 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>📝 Síntese Somente por Texto</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Experimental
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    <strong className="text-blue-300">Sem Foto de Referência:</strong> Envia apenas suas fotos ao gerador e descreve a cena por texto (maior variação criativa de enquadramento).
                  </p>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Apenas Fotos do Cliente</span>
                  <span className={`w-2 h-2 rounded-full ${renderingTechnique === 'prompt_only' ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`}></span>
                </div>
              </button>
            </div>
          </div>

          {/* RETOQUE EXECUTIVO & LEVE MAQUIAGEM DE ESTÚDIO (PERFIL PROFISSIONAL) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/25 via-[#13141f] to-teal-950/25 border border-emerald-500/40 shadow-lg flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs sm:text-sm">
                    Retoque Executivo & Leve Maquiagem de Estúdio
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {useExecutiveRetouch ? 'Ativado' : 'Desativado'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  {useExecutiveRetouch ? (
                    <>
                      <strong className="text-emerald-300">Padrão Perfil Profissional / LinkedIn:</strong> Suaviza manchas na testa, espinhas, vermelhidão e olheiras com acabamento de foto editorial executiva, mantendo microporos reais <strong className="text-white">sem efeito de pele plástica ou filtro artificial</strong>.
                    </>
                  ) : (
                    <>
                      <strong className="text-slate-400">Modo Sem Retoque:</strong> Mantém todas as marcas, manchas e imperfeições brutas exatamente como nas fotos da câmera.
                    </>
                  )}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 sm:mt-0">
              <input
                type="checkbox"
                checked={useExecutiveRetouch}
                onChange={(e) => handleToggleExecutiveRetouch(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Botão de Ação Principal (Dourado) */}
          <div className="bg-[#12121a] rounded-2xl border border-slate-800/80 p-5 sm:p-7 text-center shadow-xl">
            <button
              type="button"
              disabled={!canGenerate}
              onClick={handleGenerate}
              className={`w-full py-4 px-6 rounded-2xl text-base sm:text-lg font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-3 shadow-xl ${
                canGenerate
                  ? 'bg-gradient-to-r from-[#F59E0B] via-amber-400 to-[#F59E0B] text-slate-950 shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                  : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/40'
              }`}
            >
              {status === 'loading' ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                  <span>{LOADING_MESSAGES[loadingMsgIndex]}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-slate-950" />
                  <span>Gerar minha foto</span>
                </>
              )}
            </button>

            {/* Mensagens de validação enquanto desabilitado */}
            {!canGenerate && status !== 'loading' && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400">
                {!hasAccessCode && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    • {selectedProvider === 'wavespeed' ? 'Insira a chave da WaveSpeedAI' : 'Digite o código de acesso'} em ⚙️ Configurações
                  </button>
                )}
                {!hasValidReferenceImage && (
                  <span className="text-amber-400 flex items-center gap-1">
                    • Escolha ou suba uma foto de referência
                  </span>
                )}
                {!hasMinPhotos && (
                  <span className="text-amber-400 flex items-center gap-1">
                    • Tire fotos pela câmera ou envie da galeria ({userPhotos.length}/1)
                  </span>
                )}
                {!authConfirmed && (
                  <span className="text-amber-400 flex items-center gap-1">
                    • Marque o termo de autorização
                  </span>
                )}
              </div>
            )}

            {/* Acesso rápido para recuperar última foto gerada se houver tarefa prévia */}
            {status === 'idle' && currentTaskId && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleCheckExistingTask}
                  disabled={isCheckingTask}
                  className="text-xs text-[#A78BFA] hover:text-white flex items-center gap-2 transition-all cursor-pointer py-1.5 px-3 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 font-medium"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingTask ? 'animate-spin' : ''} text-[#F59E0B]`} />
                  <span>{isCheckingTask ? 'Consultando status...' : `Verificar resultado da última geração (${currentTaskId.slice(0, 8)}...)`}</span>
                </button>
              </div>
            )}
          </div>

          {/* ESTADO: CARREGANDO (Mensagens Rotativas e Feedback) */}
          {status === 'loading' && (
            <div className="bg-[#12121a] rounded-2xl border border-[#8B5CF6]/40 p-6 sm:p-8 text-center shadow-2xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#F59E0B] p-[2px]">
                <div className="w-full h-full bg-[#0a0a0f] rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#F59E0B] animate-spin" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Criando sua foto com IA
              </h3>
              <p className="text-base text-[#F59E0B] font-semibold transition-all duration-300">
                {dynamicLoadingMsg || LOADING_MESSAGES[loadingMsgIndex]}
              </p>
              
              {/* Indicador de 3 Etapas do Fluxo */}
              <div className="mt-5 max-w-md mx-auto grid grid-cols-3 gap-2 text-[10px] text-left">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[#8B5CF6] font-bold block mb-0.5">1. Referência</span>
                  <span className="text-slate-400">Roupa, pose e cena (ignora rosto)</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[#8B5CF6] font-bold block mb-0.5">2. Cliente</span>
                  <span className="text-slate-400">Rosto, traços e pele (ignora roupa)</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-amber-400 font-bold block mb-0.5">3. Match IA</span>
                  <span className="text-slate-400">Ensaio 100% fiel e ultrarrealista</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-4 max-w-md mx-auto">
                {dynamicLoadingMsg || 'O processamento em alta resolução na GPU leva entre 2 a 3.5 minutos enquanto a IA preserva suas feições faciais e recria a iluminação da cena.'}
              </p>
            </div>
          )}

          {/* ESTADO: ERRO */}
          {status === 'error' && (
            <div className="bg-red-950/30 border border-red-500/40 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-200">
                  {isSafetyBlocked ? 'Filtro de Segurança Acionado' : 'Não foi possível gerar a foto'}
                </h3>
                <p className="text-xs sm:text-sm text-red-300/90 mt-1.5 max-w-lg mx-auto leading-relaxed">
                  {errorMessage}
                </p>

                {/* Mensagem técnica do erro em texto pequeno abaixo da mensagem amigável */}
                {technicalErrorMessage && (
                  <div className="mt-3 p-3 rounded-xl bg-black/60 border border-red-500/25 max-w-lg mx-auto text-left">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-1">
                      Detalhes técnicos do erro:
                    </span>
                    <pre className="text-[11px] font-mono text-red-300/80 whitespace-pre-wrap break-all select-all">
                      {technicalErrorMessage}
                    </pre>
                  </div>
                )}

                {/* CARD DE RECUPERAÇÃO DA TAREFA / FOTO CONCLUÍDA */}
                {currentTaskId && (
                  <div className="mt-4 p-4 rounded-xl bg-purple-950/50 border border-[#8B5CF6]/50 max-w-lg mx-auto text-center space-y-2.5 shadow-lg">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-purple-300 font-medium">
                      <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                      <span>A tarefa (<code className="text-white font-mono text-[11px] bg-black/50 px-1.5 py-0.5 rounded border border-purple-500/30">{currentTaskId.slice(0, 10)}...</code>) pode já ter sido concluída nos servidores da IA.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckExistingTask}
                      disabled={isCheckingTask}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] via-purple-600 to-[#F59E0B] hover:brightness-110 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 cursor-pointer disabled:opacity-50 mx-auto"
                    >
                      {isCheckingTask ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      )}
                      {isCheckingTask ? 'Consultando status...' : '✨ Verificar se a foto já terminou (Recuperar Foto)'}
                    </button>
                    {checkTaskMessage && (
                      <p className="text-xs text-amber-300 font-mono mt-1">{checkTaskMessage}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Tentar novamente
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-[#A78BFA] hover:text-white border border-[#8B5CF6]/50 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  Abrir Configurações para alterar o código
                </button>
              </div>
            </div>
          )}

          {/* ESTADO: SUCESSO — EXIBIR RESULTADO EM TAMANHO GRANDE */}
          {status === 'success' && generatedPhotoUrl && (
            <div className="bg-[#12121a] rounded-2xl border-2 border-[#8B5CF6]/50 p-4 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    Foto Gerada com Sucesso!
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Formato: 3:4 ({selectedResolution})
                </span>
              </div>

              {/* Badge de Confirmação do Motor e Modelo da IA */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="font-semibold">
                    Motor: WaveSpeedAI •{' '}
                    {selectedModel === 'nano-banana-2.1' || selectedModel === 'nanobanana-2'
                      ? 'Google Nano Banana 2.1'
                      : selectedModel === 'gpt-image-2.5-sunburst'
                      ? 'OpenAI GPT Image 2.5 Sunburst'
                      : 'OpenAI GPT Image 2.5 Flare'}
                  </span>
                </div>
                {currentTaskId && (
                  <div className="text-[11px] font-mono text-emerald-300/80 bg-black/40 px-2 py-0.5 rounded border border-emerald-500/20">
                    ID WaveSpeed: {currentTaskId}
                  </div>
                )}
              </div>

              {/* Imagem do Resultado */}
              <div className="relative max-w-md mx-auto aspect-[3/4] rounded-2xl overflow-hidden border border-slate-700 bg-black shadow-2xl group">
                <img
                  src={generatedPhotoUrl}
                  alt="Resultado FotoFlow"
                  className="w-full h-full object-cover"
                />

                {/* Botão de Ampliar / Zoom */}
                <button
                  type="button"
                  onClick={() => setPreviewZoomUrl(generatedPhotoUrl)}
                  title="Ver em tela cheia"
                  className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-black/70 hover:bg-black text-white backdrop-blur-md transition-all shadow-lg cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Botões de Ação do Resultado */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-lg mx-auto">
                {/* 1) Baixar foto (PNG) */}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  ⬇ Baixar foto (PNG)
                </button>

                {/* 2) Gerar outra variação (mesma referência e fotos) */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#8B5CF6]/20 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Gerar outra variação
                </button>

                {/* 3) Recomeçar */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Recomeçar
                </button>
              </div>

              {/* PAINEL RECOLHÍVEL: ANÁLISE DOS PROMPTS E MATCH DE IDENTIDADE */}
              {synthesisResult && (
                <div className="mt-4 pt-4 border-t border-slate-800 text-left">
                  <button
                    type="button"
                    onClick={() => setShowPromptDetails((prev) => !prev)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-colors text-xs text-slate-300 font-semibold cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-[#8B5CF6]" />
                      Ver Análise em 3 Etapas e Prompt Mestre de Identidade
                    </span>
                    {showPromptDetails ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showPromptDetails && (
                    <div className="mt-3 space-y-3 p-4 rounded-xl bg-[#0a0a0f] border border-slate-800 text-xs">
                      {/* Etapa 1: JSON da Referência */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-emerald-400 flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />
                            1. JSON Mestre da Referência (Traços Físicos 100% Descartados)
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Roupa, Pose, Iluminação, Cenário & Lente
                          </span>
                        </div>
                        <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(synthesisResult.referenceSceneJson, null, 2)}
                        </pre>
                      </div>

                      {/* Etapa 2: JSON do Cliente */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-[#8B5CF6] flex items-center gap-1">
                            <Fingerprint className="w-3.5 h-3.5" />
                            2. Scan Físico do Cliente (Roupas 100% Descartadas)
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Rosto, Olhos, Cabelo, Pele & Fisionomia
                          </span>
                        </div>
                        <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(synthesisResult.clientIdentityJson, null, 2)}
                        </pre>
                      </div>

                      {/* Etapa 3: Prompt Mestre Final */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-amber-400 flex items-center gap-1">
                            <FileCode className="w-3.5 h-3.5" />
                            3. Prompt Mestre de Match e Síntese Ultrarrealista
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                              Enviado ao Motor de Geração
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (synthesisResult) {
                                  setCustomScene(synthesisResult.referenceSceneJson);
                                  setCustomClient(synthesisResult.clientIdentityJson);
                                  setCustomMasterText(synthesisResult.masterPrompt);
                                }
                                setIsPromptModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Editar no Editor</span>
                            </button>
                          </div>
                        </div>
                        <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 text-[11px] font-mono text-amber-300/90 whitespace-pre-wrap overflow-x-auto">
                          {synthesisResult.masterPrompt}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* MODAL DE ZOOM / TELA CHEIA */}
      {previewZoomUrl && (
        <div
          onClick={() => setPreviewZoomUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setPreviewZoomUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewZoomUrl}
              alt="Visualização ampliada"
              className="w-auto h-auto max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* MODAL DE CAPTURA GUIADA POR CÂMERA COM MEDIAPIPE */}
      <GuidedCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onComplete={handleCameraComplete}
        onFallbackToGallery={() => {
          setIsCameraModalOpen(false);
          setShowManualUpload(true);
        }}
      />

      {/* MODAL DE VISUALIZAÇÃO E EDIÇÃO MANUAL DE PROMPTS MESTRE */}
      <PromptEditorModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        gender={gender}
        customScene={customScene}
        customClient={customClient}
        customMasterText={customMasterText}
        isCustomPromptActive={isCustomPromptActive}
        onSavePromptConfig={handleSavePromptConfig}
      />

      {/* RODAPÉ DISCRETO COM MÉTRICAS */}
      <footer className="mt-auto border-t border-slate-900 bg-[#07070b] py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
            <span>Processamento via API nanobananaapi.ai</span>
          </div>

          {/* Sessão e créditos */}
          <div className="flex items-center gap-3">
            <span>
              Gerações nesta sessão: <strong className="text-slate-300 font-mono">{generationsCount}</strong>
            </span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-400">
              Créditos gerenciados no painel do provedor
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;

export function HomePage() {
  return (
    <QuizProvider>
      <HomePageContainer />
    </QuizProvider>
  );
}

function HomePageContainer() {
  const { quizData, completeQuiz } = useQuiz();

  if (!quizData.completed) {
    return <QuizFlow onComplete={completeQuiz} />;
  }

  return <HomePageInner />;
}
