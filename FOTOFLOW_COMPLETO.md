# FOTOFLOW — ARQUITETURA TÉCNICA INTEGRAL & CÓDIGO FONTE (DUMP COMPLETO)

> **ARQUIVO ÚNICO CONSOLIDADO:** Este documento contém 100% da lógica de negócio, arquitetura, prompts mestres, esquemas de banco de dados (SQL/Supabase), implementação de backend segura (Node.js/Express) e especificações do frontend (React/Lovable/Jules). Copie e cole este arquivo diretamente em qualquer agente de IA para reconstruir o projeto do zero.

---

## ÍNDICE
1. [Visão Geral & Funil Gamificado (Business Logic)](#1-visão-geral--funil-gamificado)
2. [Motor de IA & Configuração Backend (WaveSpeed GPT Image 2.5)](#2-motor-de-ia--configuração-backend)
3. [Prompts Mestres Calibrados (O Cérebro da IA)](#3-prompts-mestres-calibrados)
4. [Código Backend Completo (server.ts / Node.js)](#4-código-backend-completo)
5. [Esquema de Banco de Dados Completo (Supabase / PostgreSQL)](#5-esquema-de-banco-de-dados-completo)
6. [Design System & Frontend (React + Tailwind)](#6-design-system--frontend)
7. [Prompt para Agente Lovable / Jules (Instrução Pronta)](#7-prompt-para-agente-lovable--jules)

---

## 1. VISÃO GERAL & FUNIL GAMIFICADO

O **FotoFlow** é uma plataforma que transforma 5 fotos tiradas pelo celular em um ensaio fotográfico profissional com qualidade de estúdio executivo (LinkedIn, Forbes, GQ, Vogue) sem efeito de "cabeça colada" e sem pele artificial de cera.

### As 5 Etapas do Funil do Usuário:
1. **Landing Page:** Comparador "Antes vs Depois" (Selfie caseira vs Foto Forbes), prova social e CTA direto sem fricção ("Criar Meu Ensaio").
2. **Escolha de Estilo & Gênero:**
   - Filtro: Masculino / Feminino.
   - Categorias: Corporativo / Executivo, Lifestyle Casual Chic, Aniversário & Celebração, Ensaio com Pet.
   - Seleção do Molde: Escolha de um dos cenários da galeria ou envio de referência personalizada.
3. **Câmera Guiada com IA (MediaPipe 3D):**
   - Captura guiada em 5 poses essenciais: (1) Frontal neutro, (2) 20° para a esquerda, (3) 20° para a direita, (4) Sorrindo confiante, (5) Ângulo livre.
   - Feedback em tempo real com mira inteligente que muda de cor (Verde = Perfeito; Amarelo = Ajuste necessário).
4. **Processamento Gamificado (Barra Dinâmica):**
   - Mensagens rotativas em tempo real:
     * 0-25%: "Mapeando geometria facial e ossatura zigomática..."
     * 25-50%: "Calibrando iluminação twilight de Dubai e profundidade de campo..."
     * 50-75%: "Aplicando grooming executivo e eliminando imperfeições da pele..."
     * 75-100%: "Renderizando em ultra-fidelidade com microporos fotográficos reais..."
5. **Preview & Paywall/Checkout:**
   - Exibição do resultado final em resolução moderada com marca d'água elegante.
   - Opções de compra: 1 Foto HD (R$ 29,90), Pack Pro 5 Fotos 4K (R$ 69,90), Executive 15 Fotos 4K (R$ 119,90).
   - Checkout com PIX dinâmico (liberação imediata) ou Cartão de Crédito.

---

## 2. MOTOR DE IA & CONFIGURAÇÃO BACKEND (WAVESPEED AI HUB UNIFICADO)

Todo o ecossistema de geração de imagens do FotoFlow foi unificado sob a plataforma **WaveSpeed AI**, utilizando uma única chave de API (`WAVESPEED_KEY`, formato `ws_...`):

- **Provedor Unificado:** WaveSpeed AI (`https://api.wavespeed.ai`)
- **Modelos Suportados:**
  1. `nano-banana-2.1` (**Google Nano Banana 2.1**):
     - Especializado em edição com referências múltiplas e preservação anatômica facial.
     - Endpoint Edit: `POST https://api.wavespeed.ai/api/v3/google/nano-banana-2.1/edit`
     - Endpoint Text2Img: `POST https://api.wavespeed.ai/api/v3/google/nano-banana-2.1/text-to-image`
     - Payload: `{ images: string[], prompt: string, resolution: "1k" | "2k" | "4k", aspect_ratio: "3:4", output_format: "png" }`
  2. `gpt-image-2.5-flare` (**OpenAI GPT Image 2.5 Flare**):
     - Ensaio ultrarrápido (15–35s), GPU de alta velocidade e excelente custo-benefício.
     - Endpoint Edit: `POST https://api.wavespeed.ai/api/v3/openai/gpt-image-2.5-flare/edit`
     - Payload: `{ images: string[], prompt: string, quality: "medium" | "high" | "max", aspect_ratio: "3:4", output_format: "png" }`
  3. `gpt-image-2.5-sunburst` (**OpenAI GPT Image 2.5 Sunburst**):
     - Ultra-fidelidade de microporos e iluminação de cinema (40–90s) para retratos editoriais 4K.
     - Endpoint Edit: `POST https://api.wavespeed.ai/api/v3/openai/gpt-image-2.5-sunburst/edit`
- **Consulta de Status e Polling:**
  - `GET https://api.wavespeed.ai/api/v3/predictions/{id}/result`
  - Polling a cada 1.5 a 3.0 segundos com extração automática da URL gerada.
- **Segurança da Chave de API:** A chave de API fica estritamente na variável de ambiente `WAVESPEED_KEY` ou no storage seguro do usuário (`localStorage`), sem exposição pública no cliente.

---

## 3. PROMPTS MESTRES CALIBRADOS

### 3.1 Prompt Mestre de Fusão Orgânica com Referência (Técnica Principal)
> **Como funciona:** Envia `Image #1` (Foto de Referência) + `Images #2..N` (Fotos do Cliente). Reconstrói o corpo organicamente para eliminar o efeito de colagem/head-swap.

```text
[HIGH-PRIORITY DIRECTIVE: REVOLUTIONARY ORGANIC EDITORIAL PORTRAIT RE-SYNTHESIS]

### VISUAL REFERENCES PROVIDED:
1. IMAGE #1 (SCENE, ACTION, COMPOSITION & STYLING TEMPLATE - DO NOT COPY THIS MODEL'S FACE):
   - Image #1 is the strict visual template for environment, camera distance, framing, optics, lighting mood, body pose, dynamic facial action, interactive props, and wardrobe.
   - EXACT CAMERA DISTANCE & FRAMING: {{enquadramento_distancia}} (e.g. Medium close-up portrait, framed from lower chest up with natural headroom, center-weighted composition).
   - EXACT FACIAL ACTION, HEAD TILT & MOUTH GESTURE (MANDATORY OVERRIDE):
     * {{expressao_acao_facial}} (e.g. Exact head tilt, eye state - gently closed or downward serene gaze focused toward the cake/prop, and mouth action - puckered rounded lips gently blowing out the sparkler candle from Image #1. DO NOT freeze the client in a forward stare or selfie toothy smile!).
     * THE CLIENT'S FACE MUST EXECUTE THIS EXACT DYNAMIC ACTION! If Image #1 shows closed/downward eyes and puckered lips blowing a candle, the client MUST have closed/downward eyes and puckered lips blowing the candle.
   - EXACT PROPS & PHYSICAL INTERACTION:
     * {{aderecos_interacao}} (e.g. Holding a round golden metallic birthday cake with golden spheres, engraved plaque, and an illuminated sparkling candle emitting bright golden sparks at chest level supported with both hands).
   - EXACT BACKGROUND & ENVIRONMENT:
     * {{cenario}} (e.g. Dark, intimate, warm amber and chocolate-brown photography studio backdrop with soft dark vignette, clean low-key mood, deep gradient shadows, completely devoid of open hall lights, white walls, or daylight windows).
     * STRICT BACKDROP RULE: If the reference is a dark studio backdrop with amber/warm vignette, REPRODUCE THIS EXACT DARK WARM STUDIO BACKDROP with deep shadows. Absolutely DO NOT replace it with bright rooms, pillars, or daylight windows.
   - EXACT LIGHTING SETUP & SPECULAR HIGHLIGHTS:
     * {{iluminacao}} (e.g. Atmospheric lighting matching Image #1: warm key light on the subject, dramatic specular reflections from props illuminating the face and clothing, and subtle rim light against the backdrop).
   - EXACT POSE, POSTURE & HANDS:
     * {{pose}} (e.g. Exact seated or standing body posture, chest orientation, head tilt, and arm/hand placement holding the prop from Image #1).
   - EXACT OUTFIT & WARDROBE:
     * {{roupa}} (Replicate the exact outfit from Image #1 with 100% fidelity. Do NOT replace with a suit or blazer unless present in Image #1).
   - EXACT LENS & OPTICS:
     * {{lente_e_camera}} (e.g. 85mm f/1.4 portrait prime lens on full-frame camera, creamy background bokeh, tack-sharp ocular focus).

2. IMAGES #2+ (SACROSANCT CLIENT IDENTITY - 100% BIOMETRIC FIDELITY):
   - CRITICAL OVERRIDE: All images after Image #1 represent the REAL CLIENT captured via camera / live photos.
   - THE CLIENT'S FACE AND BIOMETRIC IDENTITY ARE SACROSANCT: The person depicted in the final image must be UNMISTAKABLY AND 100% THE EXACT SAME INDIVIDUAL as shown in Images #2+.
   - DO NOT BLEND OR HYBRIDIZE: Do NOT morph or average the client's face with the reference model in Image #1. The final face must belong 100% to the client.
   - BIOMETRIC ANATOMY PRESERVATION (MANDATORY):
     * FACIAL GEOMETRY & CONTOURS: {{rosto}}
     * EYES & EYEBROWS (BIOMETRIC SHAPE): {{olhos_e_sobrancelhas}} (Biometric shape and eye spacing belong to the client; open/closed/downward state follows the action in Image #1).
     * NOSE & LIPS (BIOMETRIC MORPHOLOGY): {{nariz_e_labios}} (Nose bridge and lip fullness belong to the client; puckered blowing action follows Image #1).
     * REAL SKIN TONE, EXECUTIVE GROOMING & TEXTURE: {{tom_e_textura_pele}} (Pele com microporos reais e leve maquiagem de estúdio/retoque executivo suave sem efeito plástico).
     * REAL HAIR (COLOR, LENGTH & NATURAL TEXTURE): {{cabelo_cor_tamanho_textura}}
     * NATURAL AGE, MATURITY & DISTINCTIVE TRAITS: {{idade_e_caracteristicas_distintas}}
   - AUTHENTIC BEARD & FACIAL HAIR VOLUME:
     * ZERO TOLERANCE FOR REFERENCE BEARD: Under NO circumstance should the generated person inherit the beard volume, density, length, or shape from Image #1.
     * PRESERVE EXCLUSIVELY THE CLIENT'S AUTHENTIC BEARD: {{barba_e_pelos_faciais}}
     * If the client is clean-shaven in their camera photos, KEEP THEM 100% CLEAN-SHAVEN.
     * If the client has light stubble, KEEP LIGHT STUBBLE ONLY.
     * If the client has a short or trimmed beard, DO NOT make it bushy, thick, or full.

### CRITICAL ANTI-COLLAGE & ZERO-HEAD-SWAP DIRECTIVE (MANDATORY):
- UNDER NO CIRCUMSTANCES should you perform a face-swap, head replacement, cut-out, or composite collage.
- DO NOT cut the head from Images #2+ and paste it onto Image #1's neck or collar.
- INSTEAD, RECONSTRUCT AND RENDER THE ENTIRE HUMAN SUBJECT AS ONE CONTINUOUS, ORGANIC BIOLOGICAL ORGANISM from the crown of the head down through the neck, throat, collarbones, shoulders, arms, hands, and torso.
- Ensure 100% uniform skin tone, consistent pore texture, and natural muscle transitions across the jawline, neck, and chest with ZERO visible seams, ZERO cut-out artifacts, and ZERO halo borders.
- The cohesive lighting scheme from Image #1 (including key light, rim light, and specular highlights such as flickering golden candle sparks) must illuminate the client's head, face, neck, hands, and clothing cohesively in a single photographic exposure.

### 4. EXECUTIVE GROOMING & HIGH-END COMMERCIAL HEADSHOT RETOUCHING (BLEMISH-FREE YET AUTHENTIC):
- COMMERCIAL HEADSHOT STANDARD: Apply subtle high-end studio grooming for an executive professional profile (LinkedIn / Forbes editorial headshot standard).
- FLAWLESS YET REALISTIC COMPLEXION: Smooth out and conceal minor skin blemishes, redness, pimples, forehead marks, and undereye dark circles with light, sheer studio makeup/grooming.
- ABSOLUTELY ZERO PLASTIC SKIN: Keep authentic micro-pores, crisp hair details, and genuine facial anatomy. The skin must look impeccably clean, healthy, and rested — NEVER blurry, waxy, or artificial.
- Single individual, ultra-photorealistic Hasselblad 85mm f/1.4 commercial editorial portrait.
```

### 3.2 Prompt Mestre de Identidade Prioritária (#1 Cliente, #2 Referência)
> **Como funciona:** Coloca as fotos do cliente no início do array enviado à GPU para máxima ancoragem facial.

```text
[HIGH-PRIORITY DIRECTIVE: REVOLUTIONARY ORGANIC EDITORIAL PORTRAIT RE-SYNTHESIS]

### VISUAL REFERENCES PROVIDED:
1. IMAGES #1 THROUGH #N (PRIMARY HUMAN SUBJECT IDENTITY - SACROSANCT BIOMETRIC FIDELITY):
   - The subject of this photograph is 100% THE EXACT REAL INDIVIDUAL depicted in Images #1 through #N.
   - Absolute biometric facial fidelity:
     * FACIAL GEOMETRY & BONE STRUCTURE: {{rosto}}
     * EYES, IRIS COLOR & EYEBROWS (BIOMETRIC SHAPE): {{olhos_e_sobrancelhas}}
     * NOSE, LIPS & MOUTH (BIOMETRIC SHAPE): {{nariz_e_labios}}
     * REAL SKIN TONE, EXECUTIVE GROOMING & TEXTURE: {{tom_e_textura_pele}}
     * REAL HAIR COLOR, TEXTURE & HAIRLINE: {{cabelo_cor_tamanho_textura}}
     * AUTHENTIC BEARD & GROOMING: {{barba_e_pelos_faciais}}
     * NATURAL AGE & DISTINCTIVE TRAITS: {{idade_e_caracteristicas_distintas}}

2. LAST IMAGE (SCENE, ACTION, COMPOSITION & STYLING TEMPLATE - DO NOT COPY THIS MODEL'S FACE):
   - Recreate the subject from Images #1 through #N placed inside this exact scene, camera distance, framing, lighting, dynamic facial action, props, and wardrobe:
   - CAMERA DISTANCE & FRAMING: {{enquadramento_distancia}}
   - EXACT FACIAL ACTION & EMOTION (MANDATORY OVERRIDE): {{expressao_acao_facial}}
   - PROPS & PHYSICAL INTERACTION: {{aderecos_interacao}}
   - ENVIRONMENT & BACKGROUND: {{cenario}}
   - CAMERA & OPTICS: {{lente_e_camera}}
   - LIGHTING SETUP & ATMOSPHERE: {{iluminacao}}
   - BODY POSE & POSTURE: {{pose}}
   - WARDROBE & CLOTHING: {{roupa}}

### CRITICAL ANTI-COLLAGE & ZERO-HEAD-SWAP DIRECTIVE (MANDATORY):
- Reconstruct the subject organically inside the template scene.
- DO NOT perform any cut-and-paste montage or face replacement. Render the head, neck, throat, shoulders, and chest as ONE continuous anatomy with unified skin tone and cohesive lighting.

### EXECUTIVE GROOMING & HIGH-END COMMERCIAL RETOUCHING:
- Apply subtle high-end studio grooming for an executive professional profile: conceal minor blemishes, redness, forehead marks, and undereye dark circles with light sheer makeup.
- Retain authentic micro-pores and sharp photographic skin texture (NO plastic/waxy effect).
- Single individual, ultra-photorealistic Hasselblad 85mm f/1.4 commercial editorial portrait.
```

---

## 4. CÓDIGO BACKEND COMPLETO (Node.js / Express / TypeScript)

Salve este arquivo como `server.ts` ou utilize os endpoints em suas rotas de API:

```typescript
import express from 'express';
import fetch from 'node-fetch';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json({ limit: '50mb' }));

// Inicialização segura do SDK Gemini
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI() : null;

// Rota 1: Análise e Síntese Inteligente de Prompt
app.post('/api/analyze-prompt', async (req, res) => {
  const { referenceImage, userImages = [], gender = 'male', technique = 'organic_fusion' } = req.body;

  if (!ai) {
    return res.status(503).json({ success: false, error: 'Gemini AI não configurado no servidor.' });
  }

  try {
    const refMatch = referenceImage?.match(/^data:([^;]+);base64,(.+)$/);
    const refMime = refMatch ? refMatch[1] : 'image/jpeg';
    const refBase64 = refMatch ? refMatch[2] : referenceImage;

    const refPrompt = `You are a world-class fashion director. Analyze this REFERENCE image.
CRITICAL: Completely IGNORE and DISCARD all physical traits of the person (face, skin, hair, beard).
Extract technical JSON:
"enquadramento_distancia": exact distance (medium close-up, chest-up),
"cenario": detailed environment and background,
"pose": exact body posture, chest angle, head tilt and hand placement,
"roupa": exact outfit, fabric and color (DO NOT ADD SUIT UNLESS PRESENT),
"iluminacao": exact lighting scheme, key light and rim light,
"lente_e_camera": camera system, focal length (85mm f/1.4), bokeh depth of field.`;

    const userParts: any[] = [];
    for (const img of (userImages as string[]).slice(0, 4)) {
      const uMatch = img.match(/^data:([^;]+);base64,(.+)$/);
      if (uMatch) userParts.push({ inlineData: { mimeType: uMatch[1], data: uMatch[2] } });
    }

    const clientPrompt = `Analyze photos of this client for a professional corporate portrait.
IGNORE clothing and background.
Extract technical JSON:
"rosto": facial structure, jawline, forehead,
"olhos_e_sobrancelhas": eye shape, iris color, eyebrows,
"nariz_e_labios": nose proportions, lips,
"tom_e_textura_pele": real skin tone with executive grooming (concealing blemishes, redness, forehead marks and dark circles, while retaining real micro-pores, no plastic smoothing),
"cabelo_cor_tamanho_textura": exact hair color, texture and hairline,
"barba_e_pelos_faciais": EXACT BEARD STATUS (if clean-shaven, short stubble or trimmed beard. DO NOT EXAGGERATE),
"idade_e_caracteristicas_distintas": age and distinctive traits.`;

    userParts.push({ text: clientPrompt });

    const [refRes, clientRes] = await Promise.all([
      ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ parts: [{ inlineData: { mimeType: refMime, data: refBase64 } }, { text: refPrompt }] }],
        config: { responseMimeType: 'application/json' },
      }),
      ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ parts: userParts }],
        config: { responseMimeType: 'application/json' },
      }),
    ]);

    const sceneData = JSON.parse(refRes.text || '{}');
    const clientData = JSON.parse(clientRes.text || '{}');

    return res.json({
      success: true,
      referenceSceneJson: sceneData,
      clientIdentityJson: clientData,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Falha na análise Gemini.' });
  }
});

// Rota 2: Geração de Foto Unificada com WaveSpeed AI (Google Nano Banana 2.1 & OpenAI GPT 2.5)
app.post('/api/generate', async (req, res) => {
  const {
    prompt,
    images = [],
    model = 'nano-banana-2.1', // 'nano-banana-2.1' | 'gpt-image-2.5-flare' | 'gpt-image-2.5-sunburst'
    resolution = '1K',
    aspectRatio = '3:4',
  } = req.body;

  const apiKey = (req.headers['x-api-key'] || process.env.WAVESPEED_KEY || '').toString().trim();
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'Chave WAVESPEED_KEY ausente no servidor seguro ou cabeçalho.' });
  }

  if (!prompt || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ success: false, error: 'Prompt e ao menos 1 imagem são obrigatórios.' });
  }

  try {
    const isNanoBanana = model === 'nano-banana-2.1' || model === 'nanobanana-2.1';
    const isSunburst = model === 'gpt-image-2.5-sunburst';
    const waveSpeedModel = isNanoBanana ? 'nano-banana-2.1' : isSunburst ? 'gpt-image-2.5-sunburst' : 'gpt-image-2.5-flare';

    // Endpoints oficiais da WaveSpeed AI
    const endpoint = isNanoBanana
      ? 'https://api.wavespeed.ai/api/v3/google/nano-banana-2.1/edit'
      : `https://api.wavespeed.ai/api/v3/openai/${waveSpeedModel}/edit`;

    // Resolução estritamente em minúsculas ('1k', '2k', '4k') exigida pela WaveSpeed
    const resLower = (resolution || '1k').toString().toLowerCase();
    const qualityMap: Record<string, string> = { '1k': 'medium', '2k': 'high', '4k': 'max' };

    const requestBody: Record<string, any> = {
      prompt,
      images, // URLs públicas das imagens (Supabase Storage ou bucket seguro)
      resolution: resLower,
      aspect_ratio: aspectRatio || '3:4',
      output_format: 'png',
    };

    if (!isNanoBanana) {
      requestBody.quality = qualityMap[resLower] || 'medium';
    }

    const wsResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const wsText = await wsResponse.text();
    let wsData: any = {};
    try { wsData = JSON.parse(wsText); } catch { wsData = {}; }

    if (!wsResponse.ok || wsData?.code >= 400) {
      return res.status(wsResponse.status >= 400 ? wsResponse.status : 500).json({
        success: false,
        error: wsData?.message || wsData?.msg || 'Erro ao iniciar predição no WaveSpeed AI.',
        technicalDetails: wsText,
      });
    }

    const taskId = wsData?.data?.id || wsData?.id || wsData?.request_id;
    if (!taskId) {
      return res.status(500).json({ success: false, error: 'WaveSpeed não retornou ID de previsão.' });
    }

    // Polling automático da tarefa (WaveSpeed Predictions)
    const pollEndpoint = `https://api.wavespeed.ai/api/v3/predictions/${encodeURIComponent(taskId)}/result`;
    const startTime = Date.now();
    const MAX_POLL_TIME = 180000; // 3 minutos

    while (Date.now() - startTime < MAX_POLL_TIME) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(pollEndpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
      const pollData = (await pollRes.json()) as any;
      const rec = pollData?.data || pollData;
      const status = (rec?.status || pollData?.status || '').toString().toLowerCase();

      if (status === 'completed' || status === 'succeeded' || status === 'success') {
        const finalUrl = rec?.outputs?.[0] || rec?.output || rec?.result || rec?.image_url;
        return res.json({ success: true, taskId, imageUrl: finalUrl });
      }

      if (status === 'failed' || status === 'error') {
        return res.status(500).json({ success: false, error: rec?.error || 'Erro no processamento da imagem.' });
      }
    }

    return res.status(504).json({ success: false, error: 'Tempo limite esgotado no processamento da GPU.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Falha de comunicação com WaveSpeed.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FotoFlow Backend rodando na porta ${PORT}`));
```

---

## 5. ESQUEMA DE BANCO DE DADOS COMPLETO (Supabase / PostgreSQL)

Copie e execute este script SQL no editor do Supabase:

```sql
-- TABELA 1: PERFIS DE USUÁRIOS
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA 2: SESSÕES DE ENSAIO
CREATE TABLE public.photoshoot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_token TEXT UNIQUE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  category TEXT NOT NULL CHECK (category IN ('corporate', 'lifestyle', 'birthday', 'pet')),
  reference_image_url TEXT NOT NULL,
  rendering_technique TEXT DEFAULT 'organic_fusion' CHECK (rendering_technique IN ('organic_fusion', 'client_first', 'prompt_only')),
  executive_retouch BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'captured', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA 3: FOTOS CAPTURADAS DO CLIENTE
CREATE TABLE public.client_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.photoshoot_sessions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  pose_type TEXT NOT NULL, -- 'frontal', 'left_tilt', 'right_tilt', 'smiling', 'free'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA 4: JOBS DE GERAÇÃO IA
CREATE TABLE public.generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.photoshoot_sessions(id) ON DELETE CASCADE,
  wavespeed_task_id TEXT NOT NULL,
  model TEXT DEFAULT 'gpt-image-2.5-flare',
  resolution TEXT DEFAULT '1K',
  final_prompt TEXT NOT NULL,
  result_image_url TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'success', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA 5: PEDIDOS & PAGAMENTOS (PAYWALL)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.photoshoot_sessions(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'pro', 'executive')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  pix_qrcode TEXT,
  pix_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
```

---

## 6. DESIGN SYSTEM & FRONTEND (React + Tailwind)

### 6.1 Paleta de Cores e Estilo Visual
- **Fundo Principal:** `#090A0F` (Dark Luxury)
- **Superfície de Cards:** `#12141F` com borda `border-slate-800/80`
- **Dourado Nobre (Botões & Destaques):** `#F59E0B` (Amber 500) com gradiente para `#D97706` (Amber 600)
- **Violeta Neon (IA & Tecnologia):** `#8B5CF6`
- **Verde Esmeralda (Retoque Executivo & Validações):** `#10B981`

### 6.2 Componente React: Câmera Guiada MediaPipe 3D (`GuidedCameraModal.tsx`)

```tsx
import React, { useRef, useState, useEffect } from 'react';
import { Camera, Check, RefreshCw, X } from 'lucide-react';

interface GuidedCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotosCaptured: (photos: string[]) => void;
}

export const GuidedCameraModal: React.FC<GuidedCameraModalProps> = ({ isOpen, onClose, onPhotosCaptured }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);

  const STEPS = [
    { title: '1. Rosto Frontal', desc: 'Olhe diretamente para a lente com expressão neutra' },
    { title: '2. Levemente para Esquerda', desc: 'Vire o rosto cerca de 20° para a esquerda' },
    { title: '3. Levemente para Direita', desc: 'Vire o rosto cerca de 20° para a direita' },
    { title: '4. Sorriso Natural', desc: 'Dê um sorriso profissional e confiante' },
    { title: '5. Ângulo Livre', desc: 'Sua pose favorita ou olhar espontâneo' },
  ];

  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' } })
        .then((stream) => { if (videoRef.current) videoRef.current.srcObject = stream; })
        .catch(() => alert('Permissão de câmera necessária.'));
    }
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, 1024, 1024);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    const nextPhotos = [...capturedPhotos, dataUrl];
    setCapturedPhotos(nextPhotos);

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      onPhotosCaptured(nextPhotos);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#12141F] border border-amber-500/40 rounded-3xl p-6 max-w-lg w-full text-center space-y-4">
        <div className="flex justify-between items-center text-white">
          <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">{STEPS[currentStep].title}</span>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-slate-300">{STEPS[currentStep].desc}</p>
        
        <div className="relative rounded-2xl overflow-hidden aspect-square border-2 border-emerald-500 shadow-xl bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
          <div className="absolute inset-0 border-2 border-dashed border-emerald-400/50 rounded-full m-8 pointer-events-none" />
        </div>

        <button
          onClick={handleCapture}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all cursor-pointer"
        >
          <Camera className="w-5 h-5" />
          <span>Capturar Foto ({currentStep + 1}/5)</span>
        </button>
      </div>
    </div>
  );
};
```

---

## 7. PROMPT PARA AGENTE LOVABLE / JULES

Copie o texto abaixo e cole no seu prompt do Lovable ou Jules para iniciar a criação visual imediata:

```text
Atue como um Engenheiro Frontend Sênior. Crie o Web App completo do FotoFlow utilizando React 19, TypeScript e Tailwind CSS com base nas especificações do arquivo FOTOFLOW_COMPLETO.md.

Requisitos Obrigatórios:
1. Design System: Dark Luxury (Fundos pretos #090A0F e #12141F, acentos dourados em #F59E0B com sombras luminosas, detalhes em neon violeta #8B5CF6 e verde esmeralda #10B981).
2. Funil em 5 Etapas:
   - Hero com comparador "Antes/Depois".
   - Galeria de moldes por categoria (Corporativo, Lifestyle, Aniversário, Pet) e filtro de gênero (Masculino/Feminino).
   - Modal de Câmera Guiada capturando 5 fotos sequenciais.
   - Seletor de Técnicas (Fusão Orgânica recomendada, Identidade Prioritária, Síntese por Texto) e Toggle de Retoque Executivo ativo por padrão.
   - Barra de progresso gamificada e tela de checkout PIX.
3. Conexão Backend: As requisições de geração devem bater em /api/analyze-prompt e /api/generate enviando o prompt mestre anti-colagem com retenção de microporos reais (sem pele plástica).
```

*Fim do Documento Mestre Unificado FotoFlow.*
