/**
 * Serviço de integração com o Supabase Edge Functions para geração com Nano Banana
 * Comunicação direta com https://<PROJETO>.supabase.co/functions/v1/nano
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const FUNCTION_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/nano` : '/api/generate';

export type NanoBananaModel =
  | 'nano-banana-2.1'
  | 'nanobanana-2.1'
  | 'nanobanana-2'
  | 'nanobanana-pro'
  | 'gpt-image-2.5-flare'
  | 'gpt-image-2.5-sunburst';

export type AIProvider = 'nanobanana' | 'wavespeed';
export type NanoBananaResolution = '1K' | '2K' | '4K';

export type RenderingTechnique = 'organic_fusion' | 'client_first' | 'prompt_only';

export interface GenerateNanoBananaRequest {
  referenceImage: string; // Data URI base64
  userImages: string[];   // Array de data URIs
  accessCode: string;     // Código de acesso (ou Chave WaveSpeedAI)
  model?: NanoBananaModel;
  provider?: AIProvider;
  resolution?: NanoBananaResolution;
  prompt?: string;        // Prompt mestre customizado gerado pela análise
  renderingTechnique?: RenderingTechnique; // Técnica de montagem e referência visual
  skipReferenceImageInGenerator?: boolean; // Compatibilidade legado: se true, equivale a prompt_only
  onProgress?: (message: string) => void;
  onTaskIdCreated?: (taskId: string, provider?: AIProvider) => void;
}

export interface NanoBananaCustomError extends Error {
  technicalDetails?: string;
  code?: number;
  taskId?: string;
}

const POLLING_INTERVAL_FAST_MS = 1500; // 1.5 segundos para WaveSpeedAI (tempo total ~15-25s)
const POLLING_INTERVAL_MS = 3000;
const TIMEOUT_WAVESPEED_MS = 75000; // Máximo 75 segundos (meta do cliente: menos de 1 minuto)
const TIMEOUT_MS = 360000;

/**
 * Função utilitária para higienizar mensagens e evitar vazamento de credenciais nos logs/telas
 */
function sanitizeSecret(text: string, rawSecret: string): string {
  if (!text) return '';
  const clean = (rawSecret || '').trim();
  if (clean && clean.length >= 2) {
    return text.split(clean).join('[REDACTADO]');
  }
  return text;
}

/**
 * Consulta direta ao status de uma tarefa já criada (pelo backend ou pela Edge Function)
 * Permite recuperar fotos concluídas mesmo se a tela tiver recarregado ou dado timeout.
 */
export async function checkTaskStatus(
  taskId: string,
  accessCode = '',
  files: any[] = []
): Promise<string> {
  const cleanTaskId = (taskId || '').trim();
  const cleanAccessCode = (accessCode || '').trim();

  if (!cleanTaskId) {
    throw new Error('ID da tarefa (taskId) inválido ou vazio.');
  }

  // 1. Tentar primeiro via rota rápida do backend local (/api/status) com provider wavespeed
  try {
    const backendRes = await fetch(
      `/api/status?taskId=${encodeURIComponent(cleanTaskId)}&provider=wavespeed`,
      {
        method: 'GET',
        headers: cleanAccessCode ? { 'x-api-key': cleanAccessCode } : {},
      }
    );

    const backendData = await backendRes.json().catch(() => null);

    if (!backendRes.ok) {
      throw new Error(
        backendData?.error ||
        backendData?.message ||
        `Erro ao consultar WaveSpeedAI (HTTP ${backendRes.status}). Verifique sua chave da WaveSpeed em Configurações.`
      );
    }

    const record = backendData?.data || backendData;

    if (record?.successFlag === 1 || backendData?.isFinished) {
      const resultUrl =
        backendData?.resultImageUrl ||
        record?.response?.resultImageUrl ||
        record?.response?.originImageUrl ||
        record?.resultImageUrl ||
        record?.originImageUrl ||
        record?.response?.imageUrl;

      if (resultUrl) {
        return resultUrl;
      }
    }

    if (record?.successFlag === 2 || record?.successFlag === 3) {
      throw new Error(
        record?.errorMessage || backendData?.error || 'Falha no processamento pelo modelo no WaveSpeedAI.'
      );
    }

    if (record?.successFlag === 0) {
      const stateInfo = record?.state ? ` (${record.state})` : '';
      throw new Error(
        `A foto ainda está sendo gerada na GPU da WaveSpeedAI${stateInfo}. A renderização de alta fidelidade continua em andamento. Aguarde mais alguns instantes e clique em "Recuperar Foto" novamente.`
      );
    }
  } catch (backendErr: any) {
    throw backendErr;
  }

  throw new Error(
    'Não foi possível obter o resultado da foto para esta tarefa no momento. Verifique se sua chave da WaveSpeedAI está correta.'
  );
}

/**
 * Cria a tarefa na Edge Function do Supabase (action: 'create')
 * e faz polling do status (action: 'status') a cada 4 segundos.
 */
export async function generatePhotoWithNanoBanana(
  params: GenerateNanoBananaRequest
): Promise<string> {
  const cleanAccessCode = (params.accessCode || '').trim();
  const selectedModel = params.model || 'gpt-image-2.5-flare';
  const selectedResolution = params.resolution || '1K';

  if (!cleanAccessCode) {
    const err = new Error(
      'Nenhum código ou chave de API foi fornecido. Insira sua chave em "⚙️ Configurações".'
    ) as NanoBananaCustomError;
    err.technicalDetails = 'Missing API key: accessCode string is empty.';
    throw err;
  }

  // Configuração Inteligente de Imagens para o Gerador:
  // - organic_fusion (PADRÃO): Referência (Image #1) + Fotos do Cliente (Images #2+)
  //   Garante 100% de consistência de distância, enquadramento, cenário, iluminação e roupa com re-síntese total anti-colagem.
  // - client_first: Fotos do Cliente (Image #1..K) + Referência (última imagem)
  //   Prioriza a ancoragem facial do cliente como sujeito número 1 no gerador.
  // - prompt_only: Apenas Fotos do Cliente (sem foto de referência visual)
  const clientImages = (params.userImages || []).slice(0, 15);
  const technique = params.renderingTechnique || (params.skipReferenceImageInGenerator ? 'prompt_only' : 'organic_fusion');

  let images: string[] = [];
  if (technique === 'prompt_only') {
    images = clientImages.slice(0, 16);
    console.log('[FotoFlow] -> TÉCNICA SÍNTESE PURA: Enviando apenas fotos do cliente (sem referência visual).');
  } else if (technique === 'client_first') {
    images = [...clientImages, params.referenceImage].slice(0, 16);
    console.log('[FotoFlow] -> TÉCNICA CLIENTE PRIORITÁRIO: Imagem #1 é o cliente (máxima fixação facial), Imagem #2 é a referência.');
  } else {
    // Padrão: Fusão Orgânica com Referência (Image #1 = Referência, Images #2..N = Cliente)
    images = [params.referenceImage, ...clientImages].slice(0, 16);
    console.log('[FotoFlow] -> TÉCNICA FUSÃO ORGÂNICA (PADRÃO): Enviando Referência (Img #1) + Fotos do Cliente (Img #2+) com prompt de re-síntese total sem head-swap.');
  }

  const isWaveSpeed = true; // WaveSpeedAI é o motor exclusivo e prioritário solicitado pelo usuário

  // Headers obrigatórios para requisições
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    apikey: SUPABASE_ANON_KEY,
    'x-access-code': cleanAccessCode,
  };

  let taskId: string = '';
  let files: any[] = [];
  let isCreatedLocally = false;

  // 1) CRIAR A TAREFA: Enviar diretamente para WaveSpeedAI via servidor local (/api/generate)
  try {
    const isNanoBanana =
      selectedModel === 'nano-banana-2.1' ||
      selectedModel === 'nanobanana-2.1' ||
      selectedModel === 'nanobanana-2' ||
      selectedModel === 'nanobanana-pro';
    const isSunburstModel = selectedModel === 'gpt-image-2.5-sunburst';

    const modelDisplay = isNanoBanana
      ? 'Google Nano Banana 2.1'
      : isSunburstModel
      ? 'OpenAI GPT Image 2.5 Sunburst'
      : 'OpenAI GPT Image 2.5 Flare';

    params.onProgress?.(
      `Conectando ao WaveSpeedAI e iniciando modelo ${modelDisplay} [${selectedResolution}]...`
    );

    const localRes = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cleanAccessCode,
      },
      body: JSON.stringify({
        apiKey: cleanAccessCode,
        model: selectedModel,
        provider: 'wavespeed',
        resolution: selectedResolution,
        images,
        prompt: params.prompt,
        aspectRatio: '3:4',
        clientOrigin: window.location.origin,
      }),
    });

    const localData = await localRes.json();

    if (localRes.ok && localData?.success && (localData?.data?.taskId || localData?.taskId)) {
      taskId = localData?.data?.taskId || localData?.taskId;
      isCreatedLocally = true;
    } else {
      // Erro retornado pela API WaveSpeedAI
      const err = new Error(
        localData?.error || 'Erro retornado pela API WaveSpeed ao iniciar GPT Image 2.5.'
      ) as NanoBananaCustomError;
      err.code = localData?.code || localRes.status;
      err.technicalDetails = localData?.technicalDetails;
      throw err;
    }
  } catch (localErr: any) {
    // Sempre repassar o erro exato do WaveSpeed sem fallback silencioso
    throw localErr;
  }

  // Notificar criação do taskId e salvar para recuperação em caso de timeout
  try {
    if (taskId) {
      sessionStorage.setItem('fotoflow_last_task_id', taskId);
      params.onTaskIdCreated?.(taskId, isWaveSpeed ? 'wavespeed' : 'nanobanana');
    }
  } catch {
    // sessionStorage opcional
  }

  // 2) CONSULTAR O RESULTADO EM INTERVALO RÁPIDO COM TIMEOUT ADAPTATIVO
  const isSunburst = selectedModel === 'gpt-image-2.5-sunburst';
  const is4K = selectedResolution === '4K';
  const is2K = selectedResolution === '2K';

  // Configuração inteligente, generosa e 100% funcional do tempo limite:
  // - Flare 1K: 300s (5 min) - meta normal de 20-45s
  // - Flare 2K: 480s (8 min)
  // - Flare 4K: 720s (12 min)
  // - Sunburst 1K / 2K: 900s (15 min) - modelo de ultra-fidelidade profunda
  // - Sunburst 4K: 1200s (20 min) - modelo de máxima resolução e fidelidade (demora mais na GPU mas entrega qualidade sem interrupção)
  let activeTimeout = 300000;
  if (isWaveSpeed) {
    if (isSunburst && is4K) {
      activeTimeout = 1200000; // 20 minutos completos
    } else if (isSunburst) {
      activeTimeout = 900000; // 15 minutos
    } else if (is4K) {
      activeTimeout = 720000; // 12 minutos
    } else if (is2K) {
      activeTimeout = 480000; // 8 minutos
    } else {
      activeTimeout = 300000; // 5 minutos
    }
  } else {
    activeTimeout = TIMEOUT_MS;
  }

  const activeInterval = is4K ? 2500 : isWaveSpeed ? 2000 : POLLING_INTERVAL_MS;
  const startTime = Date.now();

  const isNanoBanana =
    selectedModel === 'nano-banana-2.1' ||
    selectedModel === 'nanobanana-2.1' ||
    selectedModel === 'nanobanana-2' ||
    selectedModel === 'nanobanana-pro';
  const modelNameClean = isNanoBanana
    ? 'Nano Banana 2.1'
    : isSunburst
    ? 'GPT 2.5 Sunburst'
    : 'GPT 2.5 Flare';
  const qualityBadge = isNanoBanana
    ? '🍌 Google AI'
    : isSunburst
    ? '✨ Ultra-fidelidade'
    : '⚡ Ultrarrápido';

  while (Date.now() - startTime < activeTimeout) {
    // Calcular tempo decorrido e informar progresso dinâmico
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    const timeFormatted = mins > 0 ? `${mins}m ${secs < 10 ? '0' : ''}${secs}s` : `${secs}s`;

    const statusContext =
      isSunburst && is4K
        ? `Renderizando em 4K de máxima densidade — aguarde, o motor Sunburst 4K gasta mais tempo na GPU para garantir perfeição nos detalhes...`
        : isSunburst
        ? `Renderizando em ultra-fidelidade na GPU (traços, poros e iluminação)...`
        : is4K
        ? `Renderizando em 4K na GPU...`
        : `Renderizando ensaio fotográfico...`;

    params.onProgress?.(
      isWaveSpeed
        ? `🚀 WaveSpeedAI: ${modelNameClean} ${qualityBadge} [${selectedResolution}] (${timeFormatted}) — ${statusContext}`
        : `⚡ Etapa 3/3: Processando na GPU (${timeFormatted}) — Renderizando ensaio ultrarrealista...`
    );

    // Aguardar intervalo rápido
    await new Promise((resolve) => setTimeout(resolve, activeInterval));

    // Se a tarefa foi criada pelo servidor local ou for WaveSpeed, consultar direto /api/status com provider
    if (isCreatedLocally || isWaveSpeed) {
      try {
        const localStatusRes = await fetch(
          `/api/status?taskId=${encodeURIComponent(taskId)}&provider=${isWaveSpeed ? 'wavespeed' : 'nanobanana'}`,
          {
            headers: cleanAccessCode ? { 'x-api-key': cleanAccessCode } : {},
          }
        );

        if (localStatusRes.ok) {
          const statusJson = await localStatusRes.json();
          const rec = statusJson?.data || statusJson;

          if (rec?.successFlag === 1) {
            const finishedUrl =
              statusJson?.resultImageUrl ||
              rec?.response?.resultImageUrl ||
              rec?.response?.originImageUrl ||
              rec?.resultImageUrl ||
              rec?.originImageUrl;
            if (finishedUrl) {
              return finishedUrl;
            }
          }

          if (rec?.successFlag === 2 || rec?.successFlag === 3 || statusJson?.success === false) {
            const err = new Error(
              statusJson?.error || rec?.errorMessage || 'Falha no processamento da imagem pela GPU.'
            ) as NanoBananaCustomError;
            err.taskId = taskId;
            err.code = statusJson?.code || 500;
            err.technicalDetails = statusJson?.technicalDetails;
            throw err;
          }

          // successFlag === 0 (em processamento), continua no loop
          continue;
        }
      } catch (pollErr: any) {
        if (pollErr?.code || pollErr?.message?.includes('Falha')) {
          throw pollErr;
        }
      }
      continue;
    }

    let queryRes: Response;
    let queryText = '';

    try {
      queryRes = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'status',
          taskId,
          files,
          accessCode: cleanAccessCode,
          code: cleanAccessCode,
        }),
      });
    } catch (netErr: any) {
      const err = new Error(
        'Falha de rede ao consultar status na Edge Function.'
      ) as NanoBananaCustomError;
      err.taskId = taskId;
      err.technicalDetails = sanitizeSecret(
        `Erro de rede em ${FUNCTION_URL} para taskId ${taskId}: ${netErr?.message || 'Falha na conexão'}`,
        cleanAccessCode
      );
      throw err;
    }

    try {
      queryText = await queryRes.text();
    } catch {
      queryText = '';
    }

    let queryData: any = null;
    try {
      queryData = JSON.parse(queryText);
    } catch {
      queryData = null;
    }

    const rawDebugJson = sanitizeSecret(
      queryData ? JSON.stringify(queryData, null, 2) : queryText,
      cleanAccessCode
    );

    const queryTechDetails = sanitizeSecret(
      `HTTP ${queryRes.status} ${queryRes.statusText}\n${queryText}`,
      cleanAccessCode
    );

    if (!queryRes.ok || !queryData) {
      const err = new Error(
        `Erro ao consultar status da tarefa (HTTP ${queryRes.status}).`
      ) as NanoBananaCustomError;
      err.taskId = taskId;
      err.code = queryRes.status;
      err.technicalDetails = queryTechDetails;
      throw err;
    }

    // Obter o registro dos dados (pode estar em queryData.data ou direto em queryData)
    const record = queryData?.data || queryData;

    // Se houver mensagem de erro ou código de erro na resposta
    if (queryData.success === false || (queryData.code !== undefined && queryData.code !== 200 && queryData.code !== 0)) {
      const err = new Error(
        queryData?.error || queryData?.message || `A Edge Function retornou erro (code ${queryData.code}).`
      ) as NanoBananaCustomError;
      err.taskId = taskId;
      err.code = queryData.code;
      err.technicalDetails = rawDebugJson;
      throw err;
    }

    // Se o formato retornado não tiver o successFlag
    if (!record || typeof record !== 'object' || record.successFlag === undefined) {
      const err = new Error(
        'A resposta de status da tarefa veio em formato diferente do esperado.'
      ) as NanoBananaCustomError;
      err.taskId = taskId;
      err.technicalDetails = `JSON bruto retornado:\n${rawDebugJson}`;
      throw err;
    }

    const successFlag = record.successFlag;

    // successFlag: 0 = gerando (continuar polling)
    if (successFlag === 0) {
      continue;
    }

    // successFlag: 1 = sucesso
    if (successFlag === 1) {
      const resultUrl =
        record?.response?.resultImageUrl ||
        record?.response?.originImageUrl ||
        record?.resultImageUrl ||
        record?.originImageUrl ||
        record?.response?.imageUrl ||
        (typeof record?.response === 'string' && record.response.startsWith('http') ? record.response : null);

      if (!resultUrl) {
        const err = new Error(
          'A tarefa foi concluída, mas a URL final da imagem não foi encontrada no campo esperado.'
        ) as NanoBananaCustomError;
        err.taskId = taskId;
        err.technicalDetails = `JSON bruto retornado:\n${rawDebugJson}`;
        throw err;
      }

      return resultUrl;
    }

    // successFlag: 2 = falha ao criar tarefa
    if (successFlag === 2) {
      const errMsg =
        record?.errorMessage || 'Falha ao criar tarefa reportada pelo provedor.';
      const err = new Error(
        `Falha ao processar tarefa na API (código 2): ${errMsg}`
      ) as NanoBananaCustomError;
      err.taskId = taskId;
      err.technicalDetails = `JSON bruto retornado:\n${rawDebugJson}`;
      throw err;
    }

    // successFlag: 3 = falha na geração
    if (successFlag === 3) {
      const errMsg =
        record?.errorMessage || 'Falha na geração reportada pelo provedor.';
      const err = new Error(
        `Falha na geração da foto na API (código 3): ${errMsg}`
      ) as NanoBananaCustomError;
      err.taskId = taskId;
      err.technicalDetails = `JSON bruto retornado:\n${rawDebugJson}`;
      throw err;
    }

    // Se successFlag for outro valor inesperado
    const unexpectedErr = new Error(
      `Status desconhecido retornado pela API (successFlag: ${successFlag}).`
    ) as NanoBananaCustomError;
    unexpectedErr.taskId = taskId;
    unexpectedErr.technicalDetails = `JSON bruto retornado:\n${rawDebugJson}`;
    throw unexpectedErr;
  }

  // Timeout adaptativo atingido
  const timeoutMins = Math.round(activeTimeout / 60000);
  const timeoutErr = new Error(
    `Tempo limite de ${timeoutMins} minutos atingido para ${modelNameClean} em ${selectedResolution}. Como se trata de um modelo de altíssima qualidade/resolução, o processamento pode demorar um pouco mais na GPU. Você pode clicar em "Verificar se a foto já terminou (Recuperar Foto)" para obter a imagem assim que concluir.`
  ) as NanoBananaCustomError;
  timeoutErr.taskId = taskId;
  timeoutErr.technicalDetails = `Timeout de ${Math.round(activeTimeout / 1000)}s atingido ao consultar taskId: ${taskId}`;
  throw timeoutErr;
}
