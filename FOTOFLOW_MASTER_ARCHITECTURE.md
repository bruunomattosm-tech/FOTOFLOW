# FotoFlow — Master System Architecture & Production Specification

> **Documento Mestre para IA Coders (Lovable, Jules, Cursor, Claude Code, GitHub):**
> Este arquivo contém a especificação técnica integral, a arquitetura de software, o pipeline de prompts calibrados, as regras de negócio de alta fidelidade e os esquemas de dados para exportação e implementação do **FotoFlow**.

---

## 1. Visão Geral & Fluxo de Negócio (Business Logic & Funil Gamificado)

O **FotoFlow** é uma plataforma SaaS B2C/B2B de retratos executivos e ensaios com Inteligência Artificial, projetada para transformar selfies caseiras em fotos profissionais de estúdio editorial (nível Forbes, GQ, Vogue e LinkedIn Top Voices).

### 1.1 O Funil de Conversão Gamificado (Etapa por Etapa)

```
[ 1. LANDING PAGE HERO ]
      │
      ├── Promessa de Valor: "Fotos de Estúdio Profissional em 30 Segundos sem Sair de Casa"
      ├── Social Proof & Comparativo Antes vs Depois (Slider Interativo)
      └── CTA Primário: "Criar Meu Ensaio Agora" (Sem fricção, sem cadastro prévio obrigatório)
      │
      ▼
[ 2. ESCOLHA DE CATEGORIA & GÊNERO ]
      │
      ├── Filtro de Gênero: Masculino / Feminino
      ├── Categorias Principais:
      │     ├── 👔 Corporativo & Perfil Executivo (LinkedIn, Conselho, Diretoria)
      │     ├── 🍸 Lifestyle & Casual Chic (Café Parisiense, Rooftop, Dubai Marina)
      │     ├── 🥂 Aniversário & Celebração (Champagne, Bokeh Festivo, Glamour)
      │     └── 🐕 Ensaio com Pet (Conexão Afetuosa, Luz Natural)
      └── Seleção do Look / Molde de Referência (Galeria Curada ou Upload Personalizado)
      │
      ▼
[ 3. CAPTURA INTELIGENTE (5 FOTOS GUIADAS) ]
      │
      ├── Câmera Guiada com IA no Navegador (MediaPipe Face Landmarker 3D):
      │     ├── Validação de Pose em Tempo Real:
      │     │     * Foto 1: Rosto Frontal Neutro
      │     │     * Foto 2: Rosto Levemente Inclinado à Esquerda (15° - 25°)
      │     │     * Foto 3: Rosto Levemente Inclinado à Direita (15° - 25°)
      │     │     * Foto 4: Expressão de Sorriso Confiante
      │     │     * Foto 5: Ângulo Livre / Expressão Natural
      │     ├── HUD Interativo com Indicadores Visuais: Iluminação, Distância e Centralização
      │     └── Fallback: Upload manual de fotos da galeria (com validação de resolução)
      │
      ▼
[ 4. SÍNTESE E PROCESSAMENTO IA (BARRA GAMIFICADA) ]
      │
      ├── Análise Multimodal Paralela (< 2s via Gemini 3.1 Flash Lite):
      │     * Scan da Referência: Extrai cenário, iluminação, distância e figurino (ignora modelo)
      │     * Scan do Cliente: Extrai biometria pura, textura de pele e volume real da barba
      ├── Barra de Progresso Gamificada Dinâmica:
      │     * 0% - 25%: "Mapeando ossatura facial e traços únicos..."
      │     * 25% - 50%: "Ajustando iluminação de cinema e cenário..."
      │     * 50% - 75%: "Aplicando grooming executivo e eliminando imperfeições..."
      │     * 75% - 99%: "Renderizando em ultra-resolução com texturas reais..."
      └── Geração em GPU via WaveSpeed (OpenAI GPT Image 2.5)
      │
      ▼
[ 5. PREVIEW COM BLUR / MARCA D'ÁGUA & PAYWALL / CHECKOUT ]
      │
      ├── Visualização do Resultado: Preview de Alta Resolução com marca d'água elegante ou baixa resolução
      ├── Pacotes de Desbloqueio:
      │     ├── 🌟 Starter: 1 Ensaio em Alta Resolução (R$ 29,90)
      │     ├── 🚀 Pro Pack: 5 Ensaios em 4K + Todos os Cenários (R$ 69,90) - [Mais Vendido]
      │     └── 👑 Executive Unlimited: 15 Ensaios + Retoque Avançado + Formatos de Impressão (R$ 119,90)
      └── Checkout Rápido: PIX com liberação em tempo real (Webhook) ou Cartão de Crédito (Stripe / Asaas / Mercado Pago)
```

---

## 2. Configurações do Motor Backend (Engine & APIs)

### 2.1 Provedor & Modelos de Geração
- **Provedor Primário:** WaveSpeed AI (`https://api.wavespeed.ai/api/v3/openai/`)
- **Modelos Homologados:**
  - `gpt-image-2.5-flare`: Geração ultrarrápida (15-35s), altíssima fidelidade, custo otimizado.
  - `gpt-image-2.5-sunburst`: Geração de ultra-fidelidade profunda (40-90s), máxima micro-textura.
- **Resoluções Suportadas:** `1K` (1024x1365), `2K` (1536x2048), `4K` (2160x2880).
- **Aspect Ratio Padrão:** `3:4` (Ideal para retrato corporativo, feeds sociais e mobile).

### 2.2 Endpoints e Estratégia de Requisição
1. **Edição e Composição Multi-Imagem (Padrão):**
   - URL: `POST https://api.wavespeed.ai/api/v3/openai/{model}/edit`
   - O endpoint recebe as URLs públicas das imagens hospedadas temporariamente e o prompt sintetizado.
2. **Geração Somente por Texto (Fallback):**
   - URL: `POST https://api.wavespeed.ai/api/v3/openai/{model}/text-to-image`

### 2.3 Gestão Segura de Chaves e Variáveis de Ambiente
- **Regra de Ouro:** A chave da API WaveSpeed **NUNCA** pode ser exposta no frontend.
- O cliente envia as imagens e preferências para a rota do backend `/api/generate`.
- O backend consulta `process.env.WAVESPEED_KEY` de forma segura.
- Opcionalmente, para ambientes multi-tenant ou usuários VIP com chave própria, o backend aceita o header `x-api-key` criptografado na sessão.

---

## 3. Prompts Mestres (O Cérebro da IA FotoFlow)

Aqui estão os blocos de prompt exatos, refinados após dezenas de iterações para garantir:
1. **Fidelidade Biométrica Absoluta de 100%:** O rosto pertence exclusivamente ao cliente.
2. **Re-Síntese Orgânica Total (Zero Head-Swap / Fim da Colagem):** O modelo pinta a pessoa do zero como um organismo contínuo, sem cortes ou costuras no pescoço.
3. **Retoque Executivo & Leve Maquiagem de Estúdio (Sem Pele Plástica):** Suaviza manchas, marcas na testa, espinhas e olheiras para perfil profissional, preservando a nitidez de microporos reais.
4. **Descarte Estrito da Barba da Referência:** Homens com barba rala ou barbeados nunca herdam a barba cheia da foto de molde.

---

### 3.1 Prompt Mestre de Fusão Orgânica com Referência (Técnica Padrão Recomendada)

> **Uso:** Utilizado quando enviamos `Image #1` (Foto de Referência) + `Images #2..N` (Fotos do Cliente).

```text
[HIGH-PRIORITY DIRECTIVE: REVOLUTIONARY ORGANIC EDITORIAL PORTRAIT RE-SYNTHESIS]

### VISUAL REFERENCES PROVIDED:
1. IMAGE #1 (SCENE, COMPOSITION & STYLING TEMPLATE - DO NOT COPY THIS MODEL'S FACE):
   - Image #1 is the strict visual template for environment, camera distance, framing, optics, lighting mood, body pose, and wardrobe.
   - EXACT CAMERA DISTANCE & FRAMING: {{enquadramento_distancia}} (e.g. Medium shot / medium close-up, framed from lower chest/waist up, seated posture at dinner table).
   - EXACT CAMERA ANGLE & COMPOSITION: {{angulo}} (e.g. Eye-level camera angle, seated restaurant terrace composition matching Image #1).
   - EXACT LENS & OPTICS: {{lente_e_camera}} (e.g. 50mm to 85mm f/1.4 prime lens on full-frame camera, creamy background bokeh, tack-sharp ocular focus).
   - EXACT LIGHTING SETUP & ATMOSPHERE: {{iluminacao}} (e.g. Atmospheric twilight / blue hour evening dining lighting, warm diffused key light on face, gentle ambient fill, crisp rim lighting separating subject from background, glowing landmark lights).
   - EXACT BACKGROUND & ENVIRONMENT: {{cenario}} (e.g. Exact outdoor waterfront dining terrace overlooking iconic skyline with illuminated landmark tower, fountain lake, dining patrons, and foreground restaurant table setting).
   - EXACT POSE, POSTURE & HANDS: {{pose}} (e.g. Exact seated body posture, chest orientation, head tilt, and arm/hand placement from Image #1).
   - EXACT OUTFIT & WARDROBE: {{roupa}} (Replicate the exact outfit from Image #1 with 100% fidelity. Do NOT replace with a suit or blazer unless explicitly present in Image #1).

2. IMAGES #2+ (SACROSANCT CLIENT IDENTITY - 100% BIOMETRIC FIDELITY):
   - CRITICAL OVERRIDE: All images after Image #1 represent the REAL CLIENT captured via camera / live photos.
   - THE CLIENT'S FACE AND BIOMETRIC IDENTITY ARE SACROSANCT: The person depicted in the final image must be UNMISTAKABLY AND 100% THE EXACT SAME INDIVIDUAL as shown in Images #2+.
   - DO NOT BLEND OR HYBRIDIZE: Do NOT morph or average the client's face with the reference model in Image #1. The final face must belong 100% to the client.
   - EXACT PHYSICAL TRAITS TO PRESERVE (DO NOT ALTER):
     * FACIAL GEOMETRY & CONTOURS: {{rosto}}
     * EYES & EYEBROWS: {{olhos_e_sobrancelhas}}
     * NOSE, LIPS & EXPRESSION: {{nariz_e_labios}}
     * REAL SKIN TONE, EXECUTIVE GROOMING & TEXTURE: {{tom_e_textura_pele}}
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
- INSTEAD, RECONSTRUCT AND RENDER THE ENTIRE HUMAN SUBJECT AS ONE CONTINUOUS, ORGANIC BIOLOGICAL ORGANISM from the crown of the head down through the neck, throat, collarbones, shoulders, and torso.
- Ensure 100% uniform skin tone, consistent pore texture, and natural muscle transitions across the jawline, neck, and chest with ZERO visible seams, ZERO cut-out artifacts, and ZERO halo borders.
- The warm foreground ambient light (from the restaurant table) and the cool twilight rim lighting (from the skyline) must illuminate the client's head, neck, and clothing cohesively in a single photographic exposure.

### 4. EXECUTIVE GROOMING & HIGH-END COMMERCIAL HEADSHOT RETOUCHING (BLEMISH-FREE YET AUTHENTIC):
- COMMERCIAL HEADSHOT STANDARD: Apply subtle high-end studio grooming for an executive professional profile (LinkedIn / Forbes editorial headshot standard).
- FLAWLESS YET REALISTIC COMPLEXION: Smooth out and conceal minor skin blemishes, redness, pimples, forehead marks, and undereye dark circles with light, sheer studio makeup/grooming.
- ABSOLUTELY ZERO PLASTIC SKIN: Keep authentic micro-pores, crisp hair details, and genuine facial anatomy. The skin must look impeccably clean, healthy, and rested — NEVER blurry, waxy, or artificial.
- Single individual, ultra-photorealistic Hasselblad 85mm f/1.4 commercial editorial portrait.
```

---

### 3.2 Prompt Mestre de Identidade Prioritária (#1 Cliente, #2 Referência)

> **Uso:** Utilizado quando colocamos as fotos do cliente no início do array de imagens para máxima fixação biométrica na GPU.

```text
[HIGH-PRIORITY DIRECTIVE: REVOLUTIONARY ORGANIC EDITORIAL PORTRAIT RE-SYNTHESIS]

### VISUAL REFERENCES PROVIDED:
1. IMAGES #1 THROUGH #N (PRIMARY HUMAN SUBJECT IDENTITY - SACROSANCT BIOMETRIC FIDELITY):
   - The subject of this photograph is 100% THE EXACT REAL INDIVIDUAL depicted in Images #1 through #N.
   - Absolute biometric facial fidelity:
     * FACIAL GEOMETRY & BONE STRUCTURE: {{rosto}}
     * EYES, IRIS COLOR & EYEBROWS: {{olhos_e_sobrancelhas}}
     * NOSE, LIPS & MOUTH: {{nariz_e_labios}}
     * REAL SKIN TONE, EXECUTIVE GROOMING & TEXTURE: {{tom_e_textura_pele}}
     * REAL HAIR COLOR, TEXTURE & HAIRLINE: {{cabelo_cor_tamanho_textura}}
     * AUTHENTIC BEARD & GROOMING: {{barba_e_pelos_faciais}}
     * NATURAL AGE & DISTINCTIVE TRAITS: {{idade_e_caracteristicas_distintas}}

2. LAST IMAGE (SCENE, COMPOSITION & STYLING TEMPLATE - DO NOT COPY THIS MODEL'S FACE):
   - Recreate the subject from Images #1 through #N placed inside this exact scene, camera distance, framing, lighting, and wardrobe:
   - CAMERA DISTANCE & FRAMING: {{enquadramento_distancia}}
   - ENVIRONMENT & BACKGROUND: {{cenario}}
   - CAMERA & OPTICS: {{lente_e_camera}}
   - LIGHTING SETUP & ATMOSPHERE: {{iluminacao}}
   - BODY POSE & POSTURE: {{pose}}
   - WARDROBE & CLOTHING: {{roupa}} (Do NOT replace with a suit or blazer unless present in the template).

### CRITICAL ANTI-COLLAGE & ZERO-HEAD-SWAP DIRECTIVE (MANDATORY):
- Reconstruct the subject organically inside the template scene.
- DO NOT perform any cut-and-paste montage or face replacement. Render the head, neck, throat, shoulders, and chest as ONE continuous anatomy with unified skin tone and cohesive lighting.

### EXECUTIVE GROOMING & HIGH-END COMMERCIAL RETOUCHING:
- Apply subtle high-end studio grooming for an executive professional profile: conceal minor blemishes, redness, forehead marks, and undereye dark circles with light sheer makeup.
- Retain authentic micro-pores and sharp photographic skin texture (NO plastic/waxy effect).
- Single individual, ultra-photorealistic Hasselblad 85mm f/1.4 commercial editorial portrait.
```

---

### 3.3 Prompts de Cenários Pré-Calibrados por Categoria e Gênero

#### A) Categoria: Corporativo & Executivo (LinkedIn / Forbes)
- **Masculino:**
  - *Figurino:* Camisa social branca impecável de colarinho aberto sob blazer de lã fria azul-marinho sob medida, ou camiseta preta de algodão pima minimalista.
  - *Cenário:* Terraço contemporâneo de restaurante ou escritório executivo com janelas panorâmicas com vista para o skyline urbano ao pôr do sol/blue hour.
  - *Iluminação:* Luz suave de estúdio com recorte quente nas bordas (rim light) separando o sujeito do fundo escurecido.
  - *Câmera:* 85mm f/1.4, enquadramento do tórax para cima (medium close-up), olhar direto e confiante.
- **Feminino:**
  - *Figurino:* Blazer de corte reto estruturado em tom neutro (off-white, preto ou terracota) sobre blusa de seda, brincos pequenos minimalistas.
  - *Cenário:* Lounge moderno corporativo com profundidade de campo cremosa e tons quentes ao fundo.
  - *Iluminação:* Beauty dish difuso frontal-lateral proporcionando brilho suave nos olhos e sombras anatômicas elegantes.

#### B) Categoria: Lifestyle & Casual Chic
- **Masculino:**
  - *Figurino:* Camisa de linho bege ou verde-oliva com mangas levemente dobradas, ou jaqueta de camurça premium.
  - *Cenário:* Bistrô elegante ao ar livre, cafeteria estilosa com mesinhas de mármore e plantas arquitetônicas ao fundo.
  - *Iluminação:* Luz natural de golden hour suave, iluminação ambiental orgânica.
- **Feminino:**
  - *Figurino:* Suéter de tricô premium de gola alta suave ou vestido casual elegante em ambiente sofisticado.
  - *Cenário:* Café charmoso em área histórica europeia ou terraço arborizado com luz dourada natural.

#### C) Categoria: Aniversário & Celebração (Champagne & Glamour)
- **Masculino & Feminino:**
  - *Cenário:* Lounge VIP com iluminação indireta, luzes douradas de velas e globos luminosos criando bokeh circular ao fundo.
  - *Elemento de Cena:* Taça de cristal com espumante/champagne ou pose festiva sofisticada comemorativa.
  - *Figurino:* Traje de gala moderno, relógio sofisticado, tecidos com brilho acetinado sob luz âmbar.

#### D) Categoria: Dono & Companheiro com Pet
- **Configuração:**
  - *Sujeito Principal:* O cliente perfeitamente preservado com suas características biométricas.
  - *Companheiro:* Cão ou gato com pelos de alta definição, carinho orgânico nos braços ou sentado ao lado com cumplicidade.
  - *Iluminação & Cenário:* Estúdio neutro com fundo cinza artístico ou jardim ensolarado suave.

---

## 4. Estrutura de Dados Sugerida (Database & Schemas)

Para implantação em **Supabase (PostgreSQL)**, o seguinte esquema relacional foi desenhado para gerir o ciclo de vida completo do cliente:

```sql
-- 1. TABELA DE USUÁRIOS / PERFIS
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE SESSÕES DO ENSAIO (LEADS / FUNIL)
CREATE TABLE public.photoshoot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_token TEXT UNIQUE NOT NULL, -- Token anônimo antes do login
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  category TEXT NOT NULL CHECK (category IN ('corporate', 'lifestyle', 'birthday', 'pet')),
  reference_image_url TEXT NOT NULL,
  rendering_technique TEXT DEFAULT 'organic_fusion' CHECK (rendering_technique IN ('organic_fusion', 'client_first', 'prompt_only')),
  executive_retouch BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'pending_upload' CHECK (status IN ('pending_upload', 'uploaded', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FOTOS DE ENTRADA DO CLIENTE (1 a 5 fotos da Câmera Guiada)
CREATE TABLE public.client_input_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.photoshoot_sessions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  pose_label TEXT, -- 'front', 'tilt_left', 'tilt_right', 'smile', 'free'
  confidence_score NUMERIC(4, 2), -- Score vindo do MediaPipe
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TAREFAS DE GERAÇÃO (IA JOBS)
CREATE TABLE public.generation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.photoshoot_sessions(id) ON DELETE CASCADE,
  wavespeed_task_id TEXT NOT NULL,
  model_used TEXT DEFAULT 'gpt-image-2.5-flare',
  resolution TEXT DEFAULT '1K',
  final_prompt TEXT NOT NULL,
  result_image_url TEXT,
  watermarked_preview_url TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'success', 'error', 'timeout')),
  error_message TEXT,
  processing_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 5. TRANSAÇÕES & CHECKOUT (PAYWALL)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.photoshoot_sessions(id) ON DELETE RESTRICT,
  payment_provider TEXT DEFAULT 'pix' CHECK (payment_provider IN ('pix', 'stripe', 'mercado_pago')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  amount_cents INTEGER NOT NULL,
  package_tier TEXT NOT NULL CHECK (package_tier IN ('starter', 'pro', 'executive')),
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Implementação do Backend (Node.js / Express & Edge Functions)

Abaixo está o código-fonte pronto para produção do controller backend que recebe o payload do frontend, realiza a validação de segurança e despacha para a API WaveSpeed:

```typescript
// server/controllers/generatePhotoController.ts
import { Request, Response } from 'express';
import fetch from 'node-fetch';

interface GeneratePayload {
  referenceImageUrl: string;
  clientImageUrls: string[];
  renderingTechnique?: 'organic_fusion' | 'client_first' | 'prompt_only';
  executiveRetouch?: boolean;
  resolution?: '1K' | '2K' | '4K';
  customMasterPrompt?: string;
  aspectRatio?: string;
}

export async function handleGeneratePhoto(req: Request, res: Response) {
  try {
    const {
      referenceImageUrl,
      clientImageUrls = [],
      renderingTechnique = 'organic_fusion',
      executiveRetouch = true,
      resolution = '1K',
      customMasterPrompt = '',
      aspectRatio = '3:4',
    } = req.body as GeneratePayload;

    // 1. Validação de Credenciais no Backend
    const apiKey = (process.env.WAVESPEED_KEY || '').trim();
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Chave de API do WaveSpeed não configurada no servidor seguro.',
      });
    }

    if (clientImageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Pelo menos uma foto do cliente é obrigatória para o ensaio.',
      });
    }

    // 2. Ordenação Inteligente de Imagens conforme a Técnica Escolhida
    let targetImages: string[] = [];
    if (renderingTechnique === 'prompt_only') {
      targetImages = clientImageUrls.slice(0, 16);
    } else if (renderingTechnique === 'client_first') {
      targetImages = [...clientImageUrls, referenceImageUrl].slice(0, 16);
    } else {
      // Padrão: organic_fusion (Image #1 = Referência, Images #2..N = Cliente)
      targetImages = [referenceImageUrl, ...clientImageUrls].slice(0, 16);
    }

    // 3. Injeção de Diretivas de Retoque Executivo se solicitado
    let promptFinal = customMasterPrompt;
    if (executiveRetouch && !promptFinal.includes('EXECUTIVE GROOMING')) {
      promptFinal += `\n\n### MANDATORY EXECUTIVE GROOMING & BEAUTY RETOUCH:
Apply high-end commercial executive studio grooming and subtle matte makeup. Conceal all minor temporary skin blemishes, redness, forehead marks, and undereye dark circles, rendering an impeccably fresh, rested, and clean complexion for an elite professional headshot. Preserve authentic, tack-sharp photographic micro-pores and fine skin anatomy with zero plastic or waxy smoothing.`;
    }

    // 4. Parâmetros da Requisição WaveSpeed
    const qualityMap: Record<string, string> = {
      '1K': 'medium',
      '2K': 'high',
      '4K': 'max',
    };

    const waveSpeedEndpoint = 'https://api.wavespeed.ai/api/v3/openai/gpt-image-2.5-flare/edit';
    const requestBody = {
      prompt: promptFinal,
      resolution: resolution.toLowerCase(),
      quality: qualityMap[resolution] || 'medium',
      aspect_ratio: aspectRatio,
      output_format: 'png',
      images: targetImages,
    };

    // 5. Chamada de Criação de Tarefa
    const wsResponse = await fetch(waveSpeedEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const wsData = (await wsResponse.json()) as any;
    if (!wsResponse.ok || !wsData?.data?.taskId) {
      return res.status(wsResponse.status).json({
        success: false,
        error: wsData?.error || 'Falha ao iniciar renderização na GPU WaveSpeed.',
      });
    }

    const taskId = wsData.data.taskId;

    // 6. Polling do Resultado com Timeout Seguro (Até 5 minutos)
    const pollEndpoint = `https://api.wavespeed.ai/api/v3/tasks/${taskId}`;
    const startTime = Date.now();
    const timeoutMs = 300000; // 5 minutos

    while (Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pollRes = await fetch(pollEndpoint, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      const pollData = (await pollRes.json()) as any;
      const task = pollData?.data;

      if (task?.status === 'succeeded' || task?.status === 'success') {
        const finalUrl = task?.output?.url || task?.files?.[0]?.url || task?.result;
        return res.json({
          success: true,
          taskId,
          imageUrl: finalUrl,
          processingTimeMs: Date.now() - startTime,
        });
      }

      if (task?.status === 'failed' || task?.status === 'error') {
        return res.status(500).json({
          success: false,
          error: task?.error || 'A GPU reportou uma falha ao renderizar a imagem.',
        });
      }
    }

    return res.status(504).json({
      success: false,
      error: 'Tempo limite esgotado ao aguardar a renderização. Tente novamente.',
    });
  } catch (error: any) {
    console.error('[FotoFlow Backend Error]:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erro interno no servidor.',
    });
  }
}
```

---

## 6. Requisitos de Frontend & UI/UX (Design System para Lovable/Jules)

### 6.1 Identidade Visual & Design System (Dark Luxury & Neumorphism)
- **Backgrounds:** `#090A0F` (True Black Void), `#10121A` (Card Base), `#161926` (Card Highlight).
- **Acentos Primários (Dourado Luxo):** Gradiente de `#F59E0B` (Amber 500) a `#D97706` (Amber 600) com brilho de caixa `box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.3)`.
- **Acentos Secundários:** `#8B5CF6` (Violeta Neon para IA/Inovação), `#10B981` (Esmeralda para Retoque e Validação de Câmera).
- **Tipografia:** `Plus Jakarta Sans` ou `Inter` para legibilidade moderna e sofisticada.
- **Micro-interações:** Transições suaves de 200ms a 300ms, pulse suave em badges ativas, feedbacks táteis no clique.

### 6.2 Lista de Telas & Componentes React Obrigatórios

1. **`HeroLandingSection.tsx`**:
   - Título impactante com gradiente de texto dourado.
   - Comparador interativo de imagem (Before: selfie comum / After: capa da Forbes).
   - Botão flutuante de início rápido.

2. **`CategoryFilterBar.tsx`**:
   - Abas com ícones: Corporativo, Lifestyle, Aniversário, Pets.
   - Switch de Gênero: Masculino / Feminino.

3. **`ReferenceGallerySelector.tsx`**:
   - Cards com miniaturas de alta qualidade dos cenários e roupas.
   - Card de "Custom Upload" para o cliente enviar a própria referência.

4. **`GuidedCameraModal.tsx` (Core do Frontend)**:
   - Overlay de vídeo acessando a webcam do usuário com `@mediapipe/tasks-vision`.
   - Círculo de mira com detecção facial 3D:
     * Fica **Verde** quando a distância, iluminação e ângulo estão corretos.
     * Fica **Amarelo** com dica ("Aproxime-se um pouco mais", "Vire 15° para a esquerda").
   - Disparo automático de 5 fotos com feedback sonoro sintetizado (Web Audio API).

5. **`TechniqueSelectorCard.tsx`**:
   - Seletor em 3 colunas:
     * ✨ **Fusão Orgânica** (Padrão Ativo - Referência + Rosto sem colagem).
     * 👤 **Identidade #1 Prioritária** (Cliente primeiro).
     * 📝 **Síntese por Texto** (Sem imagem de referência).
   - Switch toggle para **Retoque Executivo & Leve Maquiagem de Estúdio**.

6. **`GamifiedProcessingView.tsx`**:
   - Barra de progresso circular ou linear com partículas e brilho dourado.
   - Textos rotativos a cada 5 segundos informando cada etapa de cálculo da GPU.

7. **`PaywallModal.tsx`**:
   - Card comparativo com os 3 planos.
   - Integração de QR Code PIX dinâmico com botão de "Copiar Código".
   - Liberação instantânea assim que o webhook confirma o pagamento.

---

## 7. Instruções para Inicialização do Projeto no Lovable / Jules

1. **Criar Projeto React + Tailwind:** Inicialize com Vite + React 19 + TypeScript + Tailwind CSS v4.
2. **Instalar Dependências:**
   ```bash
   npm install lucide-react @mediapipe/tasks-vision
   ```
3. **Copiar Estrutura de Estado:** Use o hook `usePhotoshootState` gerenciando:
   - `category`: categoria escolhida.
   - `gender`: gênero do ensaio.
   - `referenceImage`: URL base64 da referência.
   - `userPhotos`: lista de 5 fotos capturadas.
   - `renderingTechnique`: `'organic_fusion' | 'client_first' | 'prompt_only'`.
   - `useExecutiveRetouch`: booleano (padrão `true`).
4. **Configurar Variáveis de Ambiente no Backend:**
   ```env
   WAVESPEED_KEY=sua_chave_wavespeed_aqui
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
   ```

*Fim da Especificação Técnica FotoFlow v2.0.*
