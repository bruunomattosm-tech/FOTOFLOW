import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Eye,
  Info,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { resizeImageToMax1024 } from '../utils/imageUtils';

export interface CapturedPhoto {
  id: string;
  poseId: number;
  poseTitle: string;
  dataUrl: string;
}

interface GuidedCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (photos: CapturedPhoto[]) => void;
  onFallbackToGallery: () => void;
}

interface PoseStep {
  id: number;
  title: string;
  instruction: string;
  targetYawMin: number;
  targetYawMax: number;
  requireSmile?: boolean;
  isOptional?: boolean;
}

const POSES: PoseStep[] = [
  {
    id: 1,
    title: 'De frente',
    instruction: 'Olhe de frente para a câmera',
    targetYawMin: -10,
    targetYawMax: 10,
  },
  {
    id: 2,
    title: 'Esquerda',
    instruction: 'Vire o rosto levemente para a ESQUERDA',
    targetYawMin: 18,
    targetYawMax: 40,
  },
  {
    id: 3,
    title: 'Direita',
    instruction: 'Vire o rosto levemente para a DIREITA',
    targetYawMin: -40,
    targetYawMax: -18,
  },
  {
    id: 4,
    title: 'Sorriso',
    instruction: 'Dê um leve sorriso olhando de frente',
    targetYawMin: -12,
    targetYawMax: 12,
    requireSmile: true,
    isOptional: true,
  },
];

// Helper para tocar som suave de sucesso usando Web Audio API
function playSuccessBeep(audioCtxRef: React.MutableRefObject<AudioContext | null>) {
  try {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Silencioso em caso de restrição do navegador
  }
}

// Helper para calcular brilho médio (luminância) em uma região do canvas
function computeFaceLuminance(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): number {
  try {
    const rx = Math.max(0, Math.floor(x));
    const ry = Math.max(0, Math.floor(y));
    const rw = Math.max(1, Math.min(ctx.canvas.width - rx, Math.floor(width)));
    const rh = Math.max(1, Math.min(ctx.canvas.height - ry, Math.floor(height)));
    
    // Amostrar com passo para performance
    const imgData = ctx.getImageData(rx, ry, rw, rh);
    const data = imgData.data;
    let sum = 0;
    let count = 0;
    const step = 4 * 4; // a cada 4 pixels

    for (let i = 0; i < data.length; i += step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      sum += 0.299 * r + 0.587 * g + 0.114 * b;
      count++;
    }
    return count > 0 ? sum / count : 128;
  } catch {
    return 128;
  }
}

// Helper para medir nitidez (variância aproximada de gradiente/Laplaciano)
function computeSharpness(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  boxSize = 64
): number {
  try {
    const startX = Math.max(1, Math.floor(cx - boxSize / 2));
    const startY = Math.max(1, Math.floor(cy - boxSize / 2));
    const w = Math.min(boxSize, ctx.canvas.width - startX - 1);
    const h = Math.min(boxSize, ctx.canvas.height - startY - 1);
    if (w <= 4 || h <= 4) return 100;

    const imgData = ctx.getImageData(startX, startY, w, h);
    const data = imgData.data;

    let lapSum = 0;
    let lapSqSum = 0;
    let count = 0;

    // Convolução 3x3 rápida do Laplaciano em escala de cinza
    for (let y = 1; y < h - 1; y += 2) {
      for (let x = 1; x < w - 1; x += 2) {
        const idx = (y * w + x) * 4;
        const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const up = (data[((y - 1) * w + x) * 4] + data[((y - 1) * w + x) * 4 + 1] + data[((y - 1) * w + x) * 4 + 2]) / 3;
        const down = (data[((y + 1) * w + x) * 4] + data[((y + 1) * w + x) * 4 + 1] + data[((y + 1) * w + x) * 4 + 2]) / 3;
        const left = (data[(y * w + (x - 1)) * 4] + data[(y * w + (x - 1)) * 4 + 1] + data[(y * w + (x - 1)) * 4 + 2]) / 3;
        const right = (data[(y * w + (x + 1)) * 4] + data[(y * w + (x + 1)) * 4 + 1] + data[(y * w + (x + 1)) * 4 + 2]) / 3;

        const val = Math.abs(4 * center - up - down - left - right);
        lapSum += val;
        lapSqSum += val * val;
        count++;
      }
    }

    if (count === 0) return 100;
    const mean = lapSum / count;
    const variance = lapSqSum / count - mean * mean;
    return variance;
  } catch {
    return 100;
  }
}

export const GuidedCameraModal: React.FC<GuidedCameraModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  onFallbackToGallery,
}) => {
  // Estado geral
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('Posicione seu rosto no oval');
  const [isCheckSuccess, setIsCheckSuccess] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [showTips, setShowTips] = useState<boolean>(true);

  // Refs de controle
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestAnimRef = useRef<number | null>(null);
  const okSinceRef = useRef<number | null>(null);
  const isCapturingRef = useRef<boolean>(false);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastDetectedFaceRef = useRef<{
    centerX: number;
    centerY: number;
    width: number;
    height: number;
  } | null>(null);
  const lastDetectTimeRef = useRef<number>(0);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const currentPose = POSES[stepIndex];

  // 1. Iniciar câmera frontal fluida a 30 FPS estável (sem travamento)
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError(
        'Acesso à câmera não é suportado pelo seu navegador ou ambiente. Utilize a opção "Prefiro enviar da galeria".'
      );
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      let stream: MediaStream;
      try {
        // 720p a 30 FPS: padrão que garante fluidez máxima e zero travamento em qualquer celular/computador
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280, max: 1280 },
            height: { ideal: 720, max: 720 },
            frameRate: { ideal: 30, max: 30 },
          },
          audio: false,
        });
      } catch (firstErr: any) {
        // Fallback caso facingMode ou dimensões exatas falhem
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
    } catch (err: any) {
      console.error('[FotoFlow Câmera] Erro ao acessar câmera:', err);
      let msg = 'Não foi possível acessar a câmera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Permissão de câmera negada ou bloqueada pelo iframe. Se estiver no preview, recarregue a página após a liberação de permissão ou envie fotos pela galeria.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Nenhuma câmera encontrada neste dispositivo.';
      }
      setCameraError(msg);
    }
  }, []);

  // 2. Carregar modelo MediaPipe Face Landmarker
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadLandmarker() {
      setModelLoading(true);
      setModelError(null);
      try {
        const fileset = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isMounted) return;

        const landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          outputFaceBlendshapes: true,
          runningMode: 'VIDEO',
          numFaces: 1, // 1 rosto é 2x mais rápido e evita travamentos de GPU
        });

        if (!isMounted) return;
        landmarkerRef.current = landmarker;
        setModelLoading(false);
      } catch (err: any) {
        console.error('[FotoFlow MediaPipe] Erro ao carregar modelo:', err);
        if (isMounted) {
          setModelError(
            'Falha ao carregar o assistente de visão do rosto. Você pode enviar suas fotos pela galeria.'
          );
          setModelLoading(false);
        }
      }
    }

    loadLandmarker();
    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (requestAnimRef.current) {
        cancelAnimationFrame(requestAnimRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [isOpen, startCamera]);

  // Função para capturar a foto do frame atual em alta resolução com recorte 3:4 exato e centralizado no rosto
  const captureCurrentFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.readyState < 2) {
      video.play().catch(() => {});
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw === 0 || vh === 0) {
      console.warn('[Câmera] Dimensões do vídeo ainda zeradas');
      return;
    }

    // 1. Extrair o frame puro do sensor da câmera em canvas auxiliar
    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = vw;
    rawCanvas.height = vh;
    const rawCtx = rawCanvas.getContext('2d', { willReadFrequently: true });
    if (!rawCtx) return;

    rawCtx.drawImage(video, 0, 0, vw, vh);

    // 2. Verificar se o sensor enviou imagem válida (evita capturas pretas ou transparentes)
    try {
      const sample = rawCtx.getImageData(
        Math.floor(vw * 0.25),
        Math.floor(vh * 0.25),
        Math.floor(vw * 0.5),
        Math.floor(vh * 0.5)
      ).data;

      let sumLuma = 0;
      let count = 0;
      const step = 16 * 4;
      for (let i = 0; i < sample.length; i += step) {
        sumLuma += 0.299 * sample[i] + 0.587 * sample[i + 1] + 0.114 * sample[i + 2];
        count++;
      }
      const avg = count > 0 ? sumLuma / count : 0;
      if (avg < 5) {
        console.warn('[Câmera] Frame escuro detectado (luma:', avg, '), aguardando frame válido');
        setFeedbackMessage('Aguardando câmera focar a imagem...');
        return;
      }
    } catch {
      // Ignora erro de leitura
    }

    // 3. Recorte centrado no rosto com alta proporção de preenchimento facial (Headshot 3:4)
    const targetAspect = 3 / 4;
    let cropX = 0;
    let cropY = 0;
    let cropW = vw;
    let cropH = vh;

    const face = lastDetectedFaceRef.current;
    if (face && face.height > 0.15) {
      // O rosto foi detectado pelo MediaPipe! Fazer o enquadramento em close-up facial
      // Garantir que a cabeça/rosto ocupe ~62% a 68% da altura para máxima riqueza de poros e traços
      const idealH = Math.min(vh, Math.max(360, (face.height * vh) / 0.65));
      const idealW = idealH * targetAspect;

      if (idealW <= vw) {
        cropH = Math.round(idealH);
        cropW = Math.round(idealW);
        const facePixX = face.centerX * vw;
        const facePixY = face.centerY * vh;
        cropX = Math.max(0, Math.min(vw - cropW, Math.round(facePixX - cropW / 2)));
        // Posicionar olhos/nariz um pouco acima do centro geométrico
        cropY = Math.max(0, Math.min(vh - cropH, Math.round(facePixY - cropH * 0.42)));
      } else {
        cropW = Math.round(vh * targetAspect);
        cropX = Math.round((vw - cropW) / 2);
      }
    } else {
      if (vw / vh > targetAspect) {
        cropW = Math.round(vh * targetAspect);
        cropX = Math.round((vw - cropW) / 2);
      } else {
        cropH = Math.round(vw / targetAspect);
        cropY = Math.round((vh - cropH) / 2);
      }
    }

    // 4. Canvas final de alta fidelidade 768x1024 HD (proporção 3:4 vertical idêntica ao upload manual)
    const outW = 768;
    const outH = 1024;

    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = outW;
    snapCanvas.height = outH;
    const snapCtx = snapCanvas.getContext('2d');
    if (!snapCtx) return;

    snapCtx.imageSmoothingEnabled = true;
    snapCtx.imageSmoothingQuality = 'high';

    // Espelhar horizontalmente para respeitar a visualização de espelho que o usuário viu na tela
    snapCtx.translate(outW, 0);
    snapCtx.scale(-1, 1);

    // Desenhar diretamente do elemento de vídeo (ultra-rápido, sem intermediate canvas)
    snapCtx.drawImage(
      video,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      outW,
      outH
    );

    // Exportar com qualidade 0.95 (ultra-nítido para IA ler contornos da barba, olhos e nariz)
    const dataUrl = snapCanvas.toDataURL('image/jpeg', 0.95);

    // Feedback sonoro e vibração
    playSuccessBeep(audioCtxRef);
    if (navigator.vibrate) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {}
    }

    // Flash visual
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 250);

    const newPhoto: CapturedPhoto = {
      id: Math.random().toString(36).substring(2, 9),
      poseId: currentPose.id,
      poseTitle: currentPose.title,
      dataUrl,
    };

    setCapturedPhotos((prev) => {
      // Se já existia foto dessa pose, substitui
      const filtered = prev.filter((p) => p.poseId !== currentPose.id);
      return [...filtered, newPhoto];
    });

    setIsCheckSuccess(true);

    setTimeout(() => {
      setIsCheckSuccess(false);
      isCapturingRef.current = false;
      okSinceRef.current = null;
      setCountdown(null);

      // Avançar para a próxima pose ou abrir tela de confirmação/revisão se for a última pose
      if (stepIndex < POSES.length - 1) {
        setStepIndex((prev) => prev + 1);
      } else {
        setIsReviewOpen(true);
      }
    }, 900);
  }, [currentPose, stepIndex]);

  // Captura direta utilizando aplicativo nativo de câmera do dispositivo (12MP nítido sem perda)
  const handleNativeCameraSnap = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImageToMax1024(file);
      const newPhoto: CapturedPhoto = {
        id: Math.random().toString(36).substring(2, 9),
        poseId: currentPose.id,
        poseTitle: currentPose.title,
        dataUrl: resized,
      };
      setCapturedPhotos((prev) => {
        const filtered = prev.filter((p) => p.poseId !== currentPose.id);
        return [...filtered, newPhoto];
      });
      playSuccessBeep(audioCtxRef);
      setIsCheckSuccess(true);
      setTimeout(() => {
        setIsCheckSuccess(false);
        if (stepIndex < POSES.length - 1) {
          setStepIndex((prev) => prev + 1);
        } else {
          setIsReviewOpen(true);
        }
      }, 700);
    } catch (err) {
      console.error('[Câmera Nativa] Erro ao processar foto:', err);
    } finally {
      e.target.value = '';
    }
  };

  // Loop de processamento em tempo real com MediaPipe FaceLandmarker
  useEffect(() => {
    if (!isOpen || modelLoading || !landmarkerRef.current) return;

    let isActive = true;

    const processFrame = () => {
      if (!isActive) return;

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (
        !video ||
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        !landmarker ||
        isCapturingRef.current
      ) {
        requestAnimRef.current = requestAnimationFrame(processFrame);
        return;
      }

      try {
        const now = performance.now();
        // Limitar a inferência facial a cada 85ms (~12 FPS) para manter o vídeo a 60 FPS ultra-fluido e sem travamento
        if (now - lastDetectTimeRef.current < 85) {
          requestAnimRef.current = requestAnimationFrame(processFrame);
          return;
        }
        lastDetectTimeRef.current = now;

        const results = landmarker.detectForVideo(video, now);

        const faces = results.faceLandmarks;

        // 1. Verificação: quantidade de rostos
        if (!faces || faces.length === 0) {
          setFeedbackMessage('Posicione seu rosto dentro do oval');
          okSinceRef.current = null;
          requestAnimRef.current = requestAnimationFrame(processFrame);
          return;
        }

        if (faces.length > 1) {
          setFeedbackMessage('Apareça só você no quadro');
          okSinceRef.current = null;
          requestAnimRef.current = requestAnimationFrame(processFrame);
          return;
        }

        const landmarks = faces[0];

        // 2. Bounding Box do rosto
        let minX = 1;
        let maxX = 0;
        let minY = 1;
        let maxY = 0;

        for (let i = 0; i < landmarks.length; i++) {
          const p = landmarks[i];
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }

        const faceHeight = maxY - minY;
        const faceWidth = maxX - minX;
        const faceCenterX = (minX + maxX) / 2;
        const faceCenterY = (minY + maxY) / 2;

        lastDetectedFaceRef.current = {
          centerX: faceCenterX,
          centerY: faceCenterY,
          width: faceWidth,
          height: faceHeight,
        };

        // 3. Verificação: Tamanho do rosto (35% a 80% da altura)
        if (faceHeight < 0.32) {
          setFeedbackMessage('Aproxime-se da câmera');
          okSinceRef.current = null;
          requestAnimRef.current = requestAnimationFrame(processFrame);
          return;
        }

        if (faceHeight > 0.82) {
          setFeedbackMessage('Afaste-se um pouco');
          okSinceRef.current = null;
          requestAnimRef.current = requestAnimationFrame(processFrame);
          return;
        }

        // 4. Verificação: Centralização no oval
        // Como o vídeo é espelhado via CSS scaleX(-1), o centro X de 0.5 permanece no meio
        if (Math.abs(faceCenterX - 0.5) > 0.16) {
          setFeedbackMessage('Centralize o rosto no oval');
          okSinceRef.current = null;
          requestAnimRef.current = requestAnimationFrame(processFrame);
          return;
        }

        if (Math.abs(faceCenterY - 0.48) > 0.18) {
          setFeedbackMessage('Ajuste a altura do rosto');
          okSinceRef.current = null;
          requestAnimRef.current = requestAnimationFrame(processFrame);
          return;
        }

        // 5. Verificação: Brilho e Iluminação
        // Criar canvas de análise auxiliar caso necessário
        let canvas = canvasRef.current;
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvasRef.current = canvas;
        }
        if (canvas.width !== 320) {
          canvas.width = 320;
          canvas.height = 180;
        }
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const px = faceCenterX * canvas.width - (faceWidth * canvas.width) / 2;
          const py = faceCenterY * canvas.height - (faceHeight * canvas.height) / 2;
          const pw = faceWidth * canvas.width;
          const ph = faceHeight * canvas.height;

          const lum = computeFaceLuminance(ctx, px, py, pw, ph);
          if (lum < 40) {
            setFeedbackMessage('Pouca luz, vá para um local mais claro');
            okSinceRef.current = null;
            requestAnimRef.current = requestAnimationFrame(processFrame);
            return;
          }
          if (lum > 225) {
            setFeedbackMessage('Luz muito forte no rosto');
            okSinceRef.current = null;
            requestAnimRef.current = requestAnimationFrame(processFrame);
            return;
          }

          // 6. Nitidez e movimento
          const sharpness = computeSharpness(
            ctx,
            faceCenterX * canvas.width,
            faceCenterY * canvas.height,
            48
          );
          if (sharpness < 8) {
            setFeedbackMessage('Fique parado para a foto ficar nítida');
            okSinceRef.current = null;
            requestAnimRef.current = requestAnimationFrame(processFrame);
            return;
          }
        }

        // 7. Cálculo do ângulo Yaw da cabeça
        // Landmark 1: Ponta do nariz
        // Landmark 234: Lado direito do rosto da pessoa
        // Landmark 454: Lado esquerdo do rosto da pessoa
        const nose = landmarks[1];
        const rightCheek = landmarks[234];
        const leftCheek = landmarks[454];

        // Usar Z relativo 3D dos pontos da bochecha fornecidos pelo MediaPipe
        // Do ponto de vista da pessoa:
        // Ao virar para a ESQUERDA da pessoa: sua bochecha esquerda (454) se afasta (Z aumenta), bochecha direita (234) se aproxima (Z diminui)
        // Usamos tanto a diferença de profundidade Z quanto a projeção relativa X
        const dx = leftCheek.x - rightCheek.x;
        const dz = (leftCheek.z || 0) - (rightCheek.z || 0);
        
        // Ângulo estimado em graus (yaw)
        // Positivo = virado para a ESQUERDA da pessoa
        // Negativo = virado para a DIREITA da pessoa
        let estimatedYaw = Math.atan2(dz, Math.max(0.01, dx)) * (180 / Math.PI);

        // Ajuste fino com posição relativa do nariz entre as orelhas/bochechas
        const cheekWidth = Math.abs(leftCheek.x - rightCheek.x);
        if (cheekWidth > 0.05) {
          const midX = (leftCheek.x + rightCheek.x) / 2;
          const noseOffsetRatio = (nose.x - midX) / (cheekWidth / 2);
          // Na câmera frontal espelhada pelo stream nativo, quando a pessoa vira para sua esquerda,
          // o nariz se desloca para o lado de 454
          estimatedYaw = (estimatedYaw + noseOffsetRatio * 45) / 2;
        }

        // Validar Pose Atual
        const { targetYawMin, targetYawMax, requireSmile } = currentPose;

        // Pose de Frente: -10° a +10°
        if (currentPose.id === 1) {
          if (estimatedYaw < -12) {
            setFeedbackMessage('Olhe mais de frente (você está virado para a direita)');
            okSinceRef.current = null;
            requestAnimRef.current = requestAnimationFrame(processFrame);
            return;
          }
          if (estimatedYaw > 12) {
            setFeedbackMessage('Olhe mais de frente (você está virado para a esquerda)');
            okSinceRef.current = null;
            requestAnimRef.current = requestAnimationFrame(processFrame);
            return;
          }
        }

        // Pose Esquerda: virar levemente para a ESQUERDA da pessoa
        if (currentPose.id === 2) {
          if (estimatedYaw < 12) {
            setFeedbackMessage('Vire o rosto levemente para a ESQUERDA');
            okSinceRef.current = null;
            requestAnimRef.current = requestAnimationFrame(processFrame);
            return;
          }
          if (estimatedYaw > 48) {
            setFeedbackMessage('Vire só um pouquinho para a esquerda');
            okSinceRef.current = null;
            requestAnimRef.current = requestAnimationFrame(processFrame);
            return;
          }
        }

        // Pose Direita: virar levemente para a DIREITA da pessoa
        if (currentPose.id === 3) {
          if (estimatedYaw > -12) {
            setFeedbackMessage('Vire o rosto levemente para a DIREITA');
            okSinceRef.current = null;
            requestAnimRef.current = requestAnimationFrame(processFrame);
            return;
          }
          if (estimatedYaw < -48) {
            setFeedbackMessage('Vire só um pouquinho para a direita');
            okSinceRef.current = null;
            requestAnimRef.current = requestAnimationFrame(processFrame);
            return;
          }
        }

        // Pose 4: Sorriso leve
        if (requireSmile) {
          // Checar blendshapes se disponível
          const blendshapes = results.faceBlendshapes?.[0]?.categories;
          let smileScore = 0;
          if (blendshapes) {
            const smileLeft = blendshapes.find((c) => c.categoryName === 'mouthSmileLeft')?.score || 0;
            const smileRight = blendshapes.find((c) => c.categoryName === 'mouthSmileRight')?.score || 0;
            smileScore = (smileLeft + smileRight) / 2;
          } else {
            // Fallback por geometria da boca (distância entre cantos labiais 61 e 291 vs lábios 0 e 17)
            const lipLeft = landmarks[61];
            const lipRight = landmarks[291];
            const mouthWidth = Math.hypot(lipLeft.x - lipRight.x, lipLeft.y - lipRight.y);
            smileScore = mouthWidth > 0.18 ? 0.6 : 0.2;
          }

          if (smileScore < 0.35) {
            setFeedbackMessage('Dê um leve sorriso olhando de frente');
            okSinceRef.current = null;
            requestAnimRef.current = requestAnimationFrame(processFrame);
            return;
          }
        }

        // SE CHEGOU AQUI: TODAS AS CONDIÇÕES ESTÃO OK!
        setFeedbackMessage('Perfeito! Fique parado...');

        if (okSinceRef.current === null) {
          okSinceRef.current = performance.now();
        } else {
          const stableDuration = performance.now() - okSinceRef.current;
          // Quando estiver estável por 600ms (0,6 segundo): inicia contagem e captura
          if (stableDuration >= 600 && !isCapturingRef.current) {
            isCapturingRef.current = true;

            // Contagem rápida 3-2-1
            setCountdown(3);
            let count = 3;

            countdownTimerRef.current = setInterval(() => {
              count -= 1;
              if (count > 0) {
                setCountdown(count);
              } else {
                if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                setCountdown(null);
                captureCurrentFrame();
              }
            }, 550);
          }
        }
      } catch (err) {
        // Ignora pequenos drops de frame
      }

      requestAnimRef.current = requestAnimationFrame(processFrame);
    };

    requestAnimRef.current = requestAnimationFrame(processFrame);

    return () => {
      isActive = false;
      if (requestAnimRef.current) cancelAnimationFrame(requestAnimRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isOpen, modelLoading, currentPose, captureCurrentFrame]);

  if (!isOpen) return null;

  const currentPhotoForPose = capturedPhotos.find((p) => p.poseId === currentPose.id);

  // Finalizar e usar as fotos
  const handleFinish = () => {
    onComplete(capturedPhotos);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between overflow-hidden">
      {/* FLASH BRANCO DE CAPTURA */}
      {flashActive && (
        <div className="absolute inset-0 z-50 bg-white pointer-events-none animate-out fade-out duration-300" />
      )}

      {/* TOPO: BARRA DE NAVEGAÇÃO E INSTRUÇÕES */}
      <header className="relative z-20 px-4 py-3 sm:py-4 bg-gradient-to-b from-black/90 via-black/70 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA]">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Captura Guiada <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#8B5CF6] text-white">IA</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Pose {stepIndex + 1} de {POSES.length}
            </p>
          </div>
        </div>

        {/* Botão Fechar / Alternar para Galeria */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (capturedPhotos.length > 0) {
                onComplete(capturedPhotos);
              }
              onFallbackToGallery();
            }}
            className="text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Prefiro enviar da galeria
          </button>
          <button
            type="button"
            onClick={() => {
              if (capturedPhotos.length > 0) {
                onComplete(capturedPhotos);
              } else {
                onClose();
              }
            }}
            title={capturedPhotos.length > 0 ? 'Salvar fotos e fechar' : 'Fechar'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ÁREA CENTRAL: VÍDEO COM OVAL-GUIA OU TELA DE REVISÃO */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* TELA DE REVISÃO E CONFIRMAÇÃO DAS FOTOS CAPTURADAS */}
        {isReviewOpen ? (
          <div className="relative w-full max-w-lg mx-auto bg-[#12121a]/95 rounded-3xl border border-emerald-500/50 p-5 sm:p-6 shadow-2xl backdrop-blur-md flex flex-col space-y-4 animate-in fade-in zoom-in-95 z-30">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 mb-2 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center justify-center gap-2">
                Identidade Facial Registrada!
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {capturedPhotos.length} {capturedPhotos.length === 1 ? 'pose' : 'poses'}
                </span>
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                As fotos do seu rosto foram capturadas em enquadramento perfeito (HD 3:4) e serão usadas com 100% de prioridade no ensaio.
              </p>
            </div>

            {/* Grid com as miniaturas das fotos capturadas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-2">
              {POSES.map((pose) => {
                const photo = capturedPhotos.find((p) => p.poseId === pose.id);
                return (
                  <div
                    key={pose.id}
                    className="relative rounded-xl border border-slate-700 bg-slate-900 overflow-hidden aspect-[3/4] flex flex-col justify-between group shadow-md"
                  >
                    {photo ? (
                      <>
                        <img
                          src={photo.dataUrl}
                          alt={pose.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-2">
                          <span className="text-[11px] font-semibold text-white drop-shadow">
                            {pose.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsReviewOpen(false);
                              setStepIndex(POSES.findIndex((p) => p.id === pose.id));
                            }}
                            className="text-[10px] text-[#A78BFA] hover:text-white underline text-left mt-0.5"
                          >
                            Refazer esta pose
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-500 text-[10px]">
                        <span>Sem foto</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Botões de Ação na Revisão */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Usar {capturedPhotos.length} fotos e avançar para o ensaio</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                Voltar à câmera
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* MODAL DE DICAS INICIAIS */}
            {showTips && (
              <div className="absolute inset-x-4 top-2 z-30 max-w-md mx-auto p-4 rounded-2xl bg-[#12121a]/95 border border-[#8B5CF6]/40 shadow-2xl backdrop-blur-md text-center space-y-3 animate-in fade-in zoom-in-95">
                <div className="w-10 h-10 mx-auto rounded-full bg-[#8B5CF6]/20 flex items-center justify-center text-[#A78BFA]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Dicas para fotos perfeitas</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tire óculos escuros e boné, fique em local bem iluminado e com fundo simples.
                </p>
                <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-800/30 flex items-center gap-2 text-[11px] text-purple-300 text-left">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    A análise do rosto roda só no seu aparelho; nenhuma imagem é enviada a servidor antes do clique em &ldquo;Gerar minha foto&rdquo;.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTips(false)}
                  className="w-full py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold shadow-md shadow-[#8B5CF6]/30 cursor-pointer"
                >
                  Entendi, vamos começar
                </button>
              </div>
            )}

            {/* CONTAINER DA CÂMERA */}
            <div className="relative w-full max-w-sm sm:max-w-md aspect-[3/4] rounded-3xl overflow-hidden border border-slate-800 bg-[#0a0a0f] shadow-2xl flex items-center justify-center">
              {/* VÍDEO DA CÂMERA (ESPELHADO, COM AUTOPLAY E OBJECT-COVER) */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />

          {/* OVAL-GUIA SOBREPOSTO */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
            <div
              className={`w-[78%] h-[82%] rounded-[50%/60%] border-3 transition-all duration-300 ${
                isCheckSuccess
                  ? 'border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.6)] bg-emerald-500/10'
                  : countdown !== null
                  ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)] bg-amber-400/5'
                  : 'border-white/50 border-dashed shadow-[0_0_20px_rgba(255,255,255,0.15)]'
              }`}
            />
          </div>

          {/* INSTRUÇÃO GRANDE NO TOPO DO QUADRO */}
          <div className="absolute top-4 inset-x-4 text-center pointer-events-none z-10">
            <div className="inline-block px-4 py-2 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 shadow-lg">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                {currentPose.instruction}
              </span>
            </div>
          </div>

          {/* FEEDBACK EM TEMPO REAL NO RODAPÉ DO QUADRO */}
          <div className="absolute bottom-5 inset-x-4 text-center pointer-events-none z-10">
            <div
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border shadow-md transition-all ${
                isCheckSuccess
                  ? 'bg-emerald-500/90 text-white border-emerald-400'
                  : countdown !== null
                  ? 'bg-amber-500/90 text-white border-amber-400 animate-pulse'
                  : feedbackMessage.includes('Perfeito')
                  ? 'bg-emerald-600/80 text-white border-emerald-500'
                  : 'bg-black/80 text-amber-300 border-amber-400/40'
              }`}
            >
              {isCheckSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : countdown !== null ? (
                <Sparkles className="w-4 h-4 text-white" />
              ) : (
                <Info className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>{feedbackMessage}</span>
            </div>
          </div>

          {/* CONTAGEM REGRESSIVA 3-2-1 */}
          {countdown !== null && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-black/20">
              <span className="text-7xl sm:text-8xl font-black text-amber-400 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] animate-ping">
                {countdown}
              </span>
            </div>
          )}

          {/* CHECK VERDE ANIMADO AO CAPTURAR */}
          {isCheckSuccess && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-emerald-950/40 backdrop-blur-xs">
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-2xl animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
            </div>
          )}

          {/* MENSAGEM SE A CÂMERA FALHAR */}
          {cameraError && (
            <div className="absolute inset-0 z-30 p-6 bg-[#0a0a0f] flex flex-col items-center justify-center text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-rose-500" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Acesso à câmera bloqueado</h4>
                <p className="text-xs text-slate-400 max-w-xs">{cameraError}</p>
              </div>
              <button
                type="button"
                onClick={onFallbackToGallery}
                className="px-5 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold cursor-pointer"
              >
                Continuar com upload da galeria
              </button>
            </div>
          )}

          {/* MENSAGEM SE O MODELO MEDIAPIPE FALHAR */}
          {modelError && (
            <div className="absolute inset-0 z-30 p-6 bg-[#0a0a0f] flex flex-col items-center justify-center text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-500" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Erro ao carregar detector</h4>
                <p className="text-xs text-slate-400 max-w-xs">{modelError}</p>
              </div>
              <button
                type="button"
                onClick={onFallbackToGallery}
                className="px-5 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold cursor-pointer"
              >
                Enviar fotos da galeria
              </button>
            </div>
          )}

          {/* LOADING DO MODELO MEDIAPIPE */}
          {modelLoading && !cameraError && !modelError && (
            <div className="absolute inset-0 z-30 bg-black/85 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin" />
              <p className="text-xs font-medium text-slate-300">
                Iniciando detector facial em tempo real...
              </p>
            </div>
          )}
        </div>
        </>
        )}
      </main>

      {/* RODAPÉ: MINIATURAS DAS POSES, PROGRESSO E BOTÃO CONCLUIR */}
      {!isReviewOpen && (
        <footer className="relative z-20 px-4 py-3 sm:py-4 bg-gradient-to-t from-black via-black/90 to-transparent space-y-3">
        {/* BARRA DE PROGRESSO DAS 4 POSES */}
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-4 gap-2">
            {POSES.map((pose, idx) => {
              const photo = capturedPhotos.find((p) => p.poseId === pose.id);
              const isCurrent = stepIndex === idx;

              return (
                <div
                  key={pose.id}
                  onClick={() => setStepIndex(idx)}
                  className={`relative p-1.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    isCurrent
                      ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 shadow-md shadow-[#8B5CF6]/30'
                      : photo
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-slate-800 bg-[#12121a]/80 opacity-70'
                  }`}
                >
                  {/* Miniatura ou Ícone */}
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                    {photo ? (
                      <>
                        <img src={photo.dataUrl} alt={pose.title} className="w-full h-full object-cover" />
                        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        </div>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-slate-500">{idx + 1}</span>
                    )}
                  </div>

                  <span className="text-[10px] font-medium text-slate-300 truncate w-full text-center">
                    {pose.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTÕES DE CONTROLE: REFAZER POSE ATUAL, CAPTURAR MANUALMENTE OU CONCLUIR */}
        <div className="max-w-md mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {currentPhotoForPose ? (
            <button
              type="button"
              onClick={() => {
                setCapturedPhotos((prev) => prev.filter((p) => p.poseId !== currentPose.id));
                isCapturingRef.current = false;
                okSinceRef.current = null;
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Refazer pose
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => captureCurrentFrame()}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-purple-600 hover:from-[#7C3AED] hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#8B5CF6]/30 transition-all cursor-pointer shrink-0"
              >
                <Camera className="w-3.5 h-3.5" />
                Tirar foto
              </button>

              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                title="Abre a câmera de alta definição do seu celular"
                className="px-2.5 py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-700/60 text-[#A78BFA] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="hidden sm:inline">Câmera HD</span>
              </button>
            </div>
          )}

          {/* Input oculto para disparo direto da câmera nativa do celular (Full Ultra HD) */}
          <input
            type="file"
            ref={nativeCameraInputRef}
            accept="image/*"
            capture="user"
            onChange={handleNativeCameraSnap}
            className="hidden"
          />

          {/* Botão de Finalizar quando tiver fotos suficientes (a partir de 1 foto) */}
          {capturedPhotos.length >= 1 ? (
            <button
              type="button"
              onClick={handleFinish}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
            >
              <span>Usar {capturedPhotos.length} foto{capturedPhotos.length > 1 ? 's' : ''}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[10px] sm:text-[11px] text-slate-400">
              Aline o rosto ou clique em tirar foto
            </span>
          )}
        </div>
      </footer>
      )}
    </div>
  );
};
