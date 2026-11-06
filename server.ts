import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar cliente Gemini no servidor
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Configurar limites de payload para receber imagens em Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Armazenamento em memória das imagens temporárias
interface TempImage {
  buffer: Buffer;
  contentType: string;
  createdAt: number;
}

const imageStore = new Map<string, TempImage>();

// Limpeza automática periódica (remove imagens após 15 minutos)
setInterval(() => {
  const now = Date.now();
  const MAX_AGE = 15 * 60 * 1000;
  for (const [id, item] of imageStore.entries()) {
    if (now - item.createdAt > MAX_AGE) {
      imageStore.delete(id);
    }
  }
}, 3 * 60 * 1000);

// Helper para sanitizar logs e erros, garantindo que a chave nunca seja exibida
function sanitizeKey(text: string, rawKey: string): string {
  if (!text) return '';
  const clean = (rawKey || '').trim();
  if (clean && clean.length >= 4) {
    return text.split(clean).join('[CHAVE_REDACTADA]');
  }
  return text;
}

/**
 * Upload de imagem para o Supabase Storage
 * REGRAS OBRIGATÓRIAS:
 * 1. O header "x-upsert" NÃO é enviado
 * 2. O nome do arquivo é estritamente único por imagem usando UUID
 */
async function uploadToSupabaseStorage(
  buffer: Buffer,
  contentType: string,
  supabaseUrl: string,
  supabaseKey: string,
  bucket = 'images'
): Promise<string> {
  const cleanUrl = supabaseUrl.replace(/\/$/, '');
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  // Nome único gerado por UUID para cada imagem
  const uniqueFileName = `${crypto.randomUUID()}.${ext}`;

  const uploadEndpoint = `${cleanUrl}/storage/v1/object/${bucket}/${uniqueFileName}`;

  // Headers sem x-upsert
  const headers: Record<string, string> = {
    Authorization: `Bearer ${supabaseKey}`,
    apikey: supabaseKey,
    'Content-Type': contentType,
  };

  const res = await fetch(uploadEndpoint, {
    method: 'POST',
    headers,
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Supabase Storage HTTP ${res.status}: ${errorText}`);
  }

  // URL pública da imagem no Supabase Storage
  return `${cleanUrl}/storage/v1/object/public/${bucket}/${uniqueFileName}`;
}

// Helper para descobrir a URL pública base do app
function resolveBaseUrl(req: express.Request, clientOrigin?: string): string {
  // Se o front-end enviou o window.location.origin público da nuvem
  if (clientOrigin && clientOrigin.startsWith('http') && !clientOrigin.includes('localhost')) {
    return clientOrigin.replace(/\/$/, '');
  }
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  if (clientOrigin && clientOrigin.startsWith('http')) {
    return clientOrigin.replace(/\/$/, '');
  }
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || `localhost:${PORT}`;
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  return `${proto}://${host}`;
}

// -------------------------------------------------------------
// ROTA 1: GET /tmp-images/:filename
// Expõe cada imagem temporária publicamente com Content-Type apropriado
// -------------------------------------------------------------
app.get('/tmp-images/:filename', (req, res) => {
  const filename = req.params.filename;
  const id = filename.replace(/\.[^/.]+$/, '');
  const item = imageStore.get(id);

  if (!item) {
    return res.status(404).send('Imagem temporária não encontrada ou expirada (limite de 15 minutos).');
  }

  res.setHeader('Content-Type', item.contentType || 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=900');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.send(item.buffer);
});

// -------------------------------------------------------------
// ROTA: GET /download / /api/download / /download/fotoflow.md
// Permite download direto do arquivo consolidado em 1 clique
// -------------------------------------------------------------
app.get(['/download', '/api/download', '/download/fotoflow.md'], (req, res) => {
  const filePath = path.join(__dirname, 'FOTOFLOW_COMPLETO.md');
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="FOTOFLOW_COMPLETO.md"');
  return res.sendFile(filePath);
});

// -------------------------------------------------------------
// ROTA: POST /api/analyze-prompt
// Pipeline em 3 etapas:
// 1. Analisa a referência ignorando traços físicos (roupa, pose, iluminação, cenário, ângulo, lente)
// 2. Faz scan profundo das fotos do cliente (apenas traços físicos, ignorando roupas)
// 3. Dá o match unindo os dois prompts gerando o prompt mestre definitivo
// -------------------------------------------------------------
app.post('/api/analyze-prompt', async (req, res) => {
  const { referenceImage, userImages = [], gender = 'male' } = req.body;

  if (!ai) {
    return res.status(503).json({
      success: false,
      error: 'Cliente Gemini não inicializado no servidor.',
    });
  }

  try {
    // 1) Análise da Referência (ignorar características físicas e barba da referência)
    const refMatch = referenceImage?.match(/^data:([^;]+);base64,(.+)$/);
    const refMime = refMatch ? refMatch[1] : 'image/jpeg';
    const refBase64 = refMatch ? refMatch[2] : (referenceImage || '');

    const refPrompt = `You are a world-class master commercial & fashion photography director and cinematographer.
Analyze this REFERENCE image with surgical precision to produce a prompt that will reproduce the exact scene, distance, camera shot, lighting, atmosphere, dynamic facial action, interactive props, and body pose with 100% photographic fidelity.

CRITICAL MANDATORY INSTRUCTIONS:
- Completely IGNORE and DISCARD ALL PHYSICAL TRAITS of the person in the image (face, head shape, eyes, skin tone, ethnicity, hair color, hair length, body shape).
- CRITICAL BEARD DIRECTIVE: Completely DISCARD any beard, mustache, stubble, sideburns, or facial hair from this reference model. Treat the person strictly as an invisible, featureless mannequin.

EXTRACT AND SPECIFY WITH MAXIMUM TECHNICAL PHOTOGRAPHIC PRECISION:
1. enquadramento_distancia:
   - EXACT camera distance to subject: extreme close-up, close-up, medium close-up (chest-up), medium shot (waist-up), cowboy shot (mid-thighs up), or full body shot.
   - Exact vertical and horizontal crop boundaries (e.g. "framed from lower chest / upper torso to above the head with 15% headroom, center-weighted").

2. expressao_acao_facial (MANDATORY & CRITICAL FOR POSE/EMOTION FIDELITY):
   - Analyze the exact dynamic facial action, head angle, eye state, and mouth gesture:
     * EYE STATE & GAZE: Are eyes wide open looking at the camera, OR gently closed in a wish, OR cast downward focused on an object/cake/hands? (e.g. "Gently closed eyes / serene downward gaze focused toward the birthday cake in front of her").
     * HEAD TILT & ORIENTATION: Exact 3D angle of the head (e.g. "Head tilted forward and downward toward the sparkler on the cake, chin slightly lowered").
     * MOUTH GESTURE & ACTION: Exact mouth shape (e.g. "Puckered rounded lips gently blowing air out to extinguish the sparkler candle", "Soft serene closed-mouth smile", or "Confident neutral editorial gaze").
   - NOTE: This dynamic facial action will be STRICTLY ENFORCED on the client's face.

3. aderecos_interacao (MANDATORY PROP & PHYSICAL INTERACTION):
   - Identify every object, prop, accessory, cake, candle, glass, or item held or interacted with:
     * Full description: (e.g. "Holding a round golden metallic frosted birthday cake adorned with reflective golden spheres and an embossed name plaque 'Erika Dantas'. Centered on the cake is an active sparkling firework candle / sparkler shooting glittering golden embers and light smoke").
     * Hand and finger placement: (e.g. "Held firmly at chest level supported with both hands from underneath the golden platter").

4. cenario:
   - Complete background environment and setting classification:
     * Classify clearly:
       A) STUDIO PHOTOGRAPHY WITH BACKDROP / SEAMLESS CANVAS: (e.g. "Dark, intimate, warm amber and chocolate-brown photography studio backdrop with soft dark vignette, clean low-key mood, deep gradient shadows, completely devoid of open hall lights, white walls, or daylight windows").
       B) REAL LOCATION / INTERIOR / EXTERIOR: specific environment, architectural backdrop, or landscape.
     * STRICT PROHIBITION: If the reference is a studio backdrop with dark/amber vignette, explicitly forbid adding daylight windows, pillars, or open brightly-lit rooms.

5. pose:
   - Exact body posture, torso angle, shoulder alignment, arms positioning, and physical stance.

6. roupa:
   - Exact garments, fabric, color, texture, and neckline (e.g. shimmering metallic golden sequins/lurex long-sleeve top, tailored blazer, crisp shirt).
   - Accessories: earrings, watch, rings matching the reference. DO NOT add suits or ties unless explicitly worn in the reference.

7. iluminacao:
   - Exact lighting scheme, key light direction, fill light, ambient color temperature, and SPECULAR PROP REFLECTIONS:
     * Key light, rim light, and local reflections (e.g. "Low-key warm dramatic studio lighting with warm golden key light from the front, complemented by bright flickering golden specular reflections from the sparkler candle illuminating the cheeks, puckered lips, and sparkling sequin fabric from below, with soft warm rim lighting on hair and shoulders, contrasting against the dark amber backdrop").

8. lente_e_camera:
   - Full-frame portrait prime lens (85mm f/1.4 or 50mm f/1.4), shallow depth of field, creamy background bokeh, ultra-sharp ocular focus.

Return a clean JSON object with keys:
"enquadramento_distancia", "expressao_acao_facial", "aderecos_interacao", "cenario", "pose", "roupa", "iluminacao", "lente_e_camera", "regra_barba", "regras_estritas".`;

    // 2) Scan Profundo das fotos do Cliente (ignorar roupas, focar em traços físicos e volume real de barba)
    const userParts: any[] = [];
    for (const img of (userImages as string[]).slice(0, 4)) {
      const uMatch = img.match(/^data:([^;]+);base64,(.+)$/);
      if (uMatch) {
        userParts.push({
          inlineData: { mimeType: uMatch[1], data: uMatch[2] },
        });
      }
    }

    const clientPrompt = `You are an expert biometric and phenotypic facial analyst. Analyze these photos of the SAME CLIENT.
CRITICAL MANDATORY INSTRUCTIONS:
- Completely IGNORE all clothing, shirts, casual wear, accessories, and backgrounds in these photos.
- SEPARATION OF BIOMETRIC ANATOMY VS SELFIE POSE/EXPRESSION:
  * Extract ONLY the authentic physical and facial anatomy of this real person across all photos:
    1. rosto: facial structure, jawline, cheekbones, chin, forehead proportions.
    2. olhos_e_sobrancelhas: biometric eye shape, eye distance, eye color, eyelid creases, eyebrow shape and density. (NOTE: Open/closed state and gaze direction will follow the reference action).
    3. nariz_e_labios: nose bridge, nose tip, nostrils, natural lip fullness and volume. (NOTE: Mouth gesture such as puckered lips or blowing follows the reference action).
    4. tom_e_textura_pele: exact real skin tone and undertones. Specify that for this professional profile portrait, subtle executive studio grooming / light matte retouching is applied: redness, forehead marks, blemishes, and undereye dark circles are seamlessly softened and concealed, while maintaining authentic, tack-sharp photographic micro-pores without plastic smoothing.
    5. cabelo_cor_tamanho_textura: exact hair color, hair length, natural texture (straight, wavy, curly, coily), hairline.
    6. barba_e_pelos_faciais: EXACT BEARD STATUS, VOLUME, AND LENGTH. Determine if the client is clean-shaven, has light 5 o'clock stubble (1-3mm), short trimmed beard (3-5mm), medium groomed beard, or full beard. Specify exact volume and coverage on cheeks, jaw, and chin. DO NOT EXAGGERATE the beard volume.
    7. idade_e_caracteristicas_distintas: natural age, facial maturity, unique facial traits.
  * DO NOT lock the client into their selfie pose or expression! If the client has a wide toothy smile or is staring forward at the phone camera in their selfies, DO NOT force this smile if the reference scene depicts a different action (such as blowing out a candle with puckered lips, or a serene look).
  * The client's biometric face will dynamically perform the EXACT FACIAL ACTION, HEAD TILT, EYE STATE, AND MOUTH GESTURE dictated by the reference scene!
Return a clean JSON object with keys: "rosto", "olhos_e_sobrancelhas", "nariz_e_labios", "tom_e_textura_pele", "cabelo_cor_tamanho_textura", "barba_e_pelos_faciais", "idade_e_caracteristicas_distintas", "regras_estritas".`;

    userParts.push({ text: clientPrompt });

    // Executar análises em PARALELO para velocidade máxima (< 3 segundos)
    const [refRes, clientRes] = await Promise.all([
      ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          {
            parts: [
              { inlineData: { mimeType: refMime, data: refBase64 } },
              { text: refPrompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      }),
      ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ parts: userParts }],
        config: {
          responseMimeType: 'application/json',
        },
      }),
    ]);

    let refSceneData: any = {};
    try {
      refSceneData = JSON.parse(refRes.text || '{}');
      if (!refSceneData.angulo && refSceneData.enquadramento_distancia) {
        refSceneData.angulo = refSceneData.enquadramento_distancia;
      }
    } catch {
      refSceneData = {
        enquadramento_distancia: 'Medium close-up portrait, framed from lower chest / upper torso up, center-weighted composition matching Image #1',
        expressao_acao_facial: 'Exact dynamic facial action, head tilt, eye state (gently closed or downward gaze toward the cake/prop), and mouth gesture (puckered rounded lips gently blowing out the candle) from Image #1',
        aderecos_interacao: 'Holding the exact interactive prop from Image #1 (e.g. golden metallic birthday cake with golden spheres, plaque, and an illuminated sparkling candle emitting bright golden sparks) at chest level with both hands',
        roupa: 'Replicate exact outfit, fabric, colors, and styling from Image #1 with 100% fidelity',
        pose: 'Replicate exact body posture, chest orientation, head tilt, and arm/hand placement from Image #1',
        iluminacao: 'Atmospheric lighting matching Image #1: warm key light on the subject, dramatic specular reflections from props illuminating the face and clothing, and subtle rim light against the backdrop',
        cenario: 'Exact environment, backdrop, architectural setting, and depth-of-field from Image #1. If Image #1 is a dark, warm amber studio backdrop with vignette, reproduce this exact intimate studio atmosphere with deep shadows',
        angulo: 'Eye-level camera angle, perfectly matched distance and framing to Image #1',
        lente_e_camera: '85mm f/1.4 portrait prime lens on full-frame camera, creamy background bokeh, tack-sharp ocular focus',
        regra_barba: 'Descartar 100% da barba da referência.',
        regras_estritas: 'Ignorar traços físicos da referência. Preservar a ação e emoção da referência.',
      };
    }

    let clientData: any = {};
    try {
      clientData = JSON.parse(clientRes.text || '{}');
    } catch {
      clientData = {
        rosto: 'Preservar estrutura facial exata do cliente',
        olhos_e_sobrancelhas: 'Formato e cor dos olhos do cliente (o estado aberto/fechado e direção do olhar segue a ação da referência)',
        nariz_e_labios: 'Proporções naturais do nariz e lábios (o gesto de biquinho ou expressão segue a ação da referência)',
        tom_e_textura_pele: 'Tom e textura natural de pele com poros reais e retoque executivo sutil',
        cabelo_cor_tamanho_textura: 'Cor e textura real do cabelo',
        barba_e_pelos_faciais: gender === 'male' ? 'Preservar volume exato de barba do cliente das fotos, sem engrossar nem usar a barba da referência' : 'Sem barba',
        idade_e_caracteristicas_distintas: 'Idade real e traços distintivos',
        regras_estritas: 'Ignorar roupas das fotos do cliente. Extrair biometria facial mas adotar a ação facial da referência.',
      };
    }

    // Se o cliente for masculino, certificar que a barba do cliente seja rigorosamente espelhada das fotos reais
    if (gender === 'male' && (!clientData.barba_e_pelos_faciais || clientData.barba_e_pelos_faciais.length < 5)) {
      clientData.barba_e_pelos_faciais = 'Preservar com fidelidade absoluta de 100% o volume, corte e densidade de barba original do cliente visível em suas fotos reais. Proibido copiar ou transferir a barba da imagem de referência.';
    }

    // 3) Match & Síntese Mestre - Estrutura Original:
    // Image #1 = Imagem de Referência (molde de roupa, cenário e iluminação)
    // Images #2..N = Fotos do Cliente (biótipo, tom de pele uniforme e identidade)
    const clientCount = Math.max(1, (userImages as string[]).length);
    const clientRefLabel = clientCount > 1 ? `Images #2 through #${clientCount + 1}` : 'Image #2';
    const clientHeading = clientCount > 1 ? 'IMAGES #2+' : 'IMAGE #2';
    const clientHeadingFirst = clientCount > 1 ? `IMAGES #1 THROUGH #${clientCount}` : 'IMAGE #1';
    const sceneRefLast = `IMAGE #${clientCount + 1}`;

    // Prompt Mestre: Fusão Orgânica com Referência (Image #1 = Referência, Images #2+ = Cliente)
    // RECONSTRUÇÃO TOTAL ANTI-COLAGEM: sem corte de pescoço, sem head-swap
    const masterPrompt = `[HIGH-PRIORITY DIRECTIVE: REVOLUTIONARY ORGANIC EDITORIAL PORTRAIT RE-SYNTHESIS]

### VISUAL REFERENCES PROVIDED:
1. IMAGE #1 (SCENE, ACTION, COMPOSITION & STYLING TEMPLATE - DO NOT COPY THIS MODEL'S FACE):
   - Image #1 is the strict visual template for environment, camera distance, framing, optics, lighting mood, body pose, dynamic facial action, interactive props, and wardrobe.
   - EXACT CAMERA DISTANCE & FRAMING: ${refSceneData.enquadramento_distancia || refSceneData.angulo || 'Medium close-up portrait, framed from lower chest up with natural headroom, center-weighted composition'}
   - EXACT FACIAL ACTION, HEAD TILT & MOUTH GESTURE (MANDATORY OVERRIDE):
     * ${refSceneData.expressao_acao_facial || 'Exact head tilt, eye state (gently closed or downward gaze toward the cake/prop), and mouth action (puckered rounded lips gently blowing out the sparkler candle) from Image #1. DO NOT freeze the client in a forward stare or selfie toothy smile!'}
     * THE CLIENT'S FACE MUST EXECUTE THIS EXACT DYNAMIC ACTION! If Image #1 shows closed/downward eyes and puckered lips blowing a candle, the client MUST have closed/downward eyes and puckered lips blowing the candle.
   - EXACT PROPS & PHYSICAL INTERACTION:
     * ${refSceneData.aderecos_interacao || 'Holding the exact prop at chest level with both hands (e.g. golden metallic birthday cake with golden spheres, engraved plaque, and an illuminated sparkling candle emitting bright golden sparks).'}
   - EXACT BACKGROUND & ENVIRONMENT:
     * ${refSceneData.cenario || 'Dark, intimate, warm amber and chocolate-brown photography studio backdrop with soft dark vignette, clean low-key mood, deep gradient shadows, completely devoid of open hall lights, white walls, or daylight windows'}
     * STRICT BACKDROP RULE: If the reference is a dark studio backdrop with amber/warm vignette, REPRODUCE THIS EXACT DARK WARM STUDIO BACKDROP with deep shadows. Absolutely DO NOT replace it with bright rooms, pillars, or daylight windows.
   - EXACT LIGHTING SETUP & SPECULAR HIGHLIGHTS:
     * ${refSceneData.iluminacao || 'Atmospheric lighting matching Image #1: warm key light on the subject, dramatic specular reflections from props illuminating the face and clothing, and subtle rim light against the backdrop'}
   - EXACT POSE, POSTURE & HANDS:
     * ${refSceneData.pose || 'Exact seated or standing body posture, chest orientation, head tilt, and arm/hand placement holding the prop from Image #1'}
   - EXACT OUTFIT & WARDROBE:
     * ${refSceneData.roupa || 'Replicate the exact outfit, fabric, colors, and styling from Image #1 with 100% fidelity. Do NOT replace with a suit or any other clothing unless present in Image #1.'}
   - EXACT LENS & OPTICS:
     * ${refSceneData.lente_e_camera || '85mm f/1.4 portrait prime lens on full-frame camera, creamy background bokeh, tack-sharp ocular focus'}

2. ${clientHeading} (${clientRefLabel}) (SACROSANCT CLIENT IDENTITY - 100% BIOMETRIC FIDELITY):
   - CRITICAL OVERRIDE: All images after Image #1 (${clientRefLabel}) represent the REAL CLIENT captured via camera / live photos.
   - THE CLIENT'S FACE AND BIOMETRIC IDENTITY ARE SACROSANCT: The person depicted in the final image must be UNMISTAKABLY AND 100% THE EXACT SAME INDIVIDUAL as shown in ${clientRefLabel}.
   - DO NOT BLEND OR HYBRIDIZE: Do NOT morph or average the client's face with the reference model in Image #1. The final face must belong 100% to the client.
   - BIOMETRIC ANATOMY PRESERVATION (MANDATORY):
     * FACIAL GEOMETRY & CONTOURS: ${clientData.rosto || 'Preservar com precisão cirúrgica o formato do rosto do cliente, ossatura zigomática e linha do maxilar'}
     * EYES & EYEBROWS (BIOMETRIC SHAPE): ${clientData.olhos_e_sobrancelhas || 'Formato e espaçamento dos olhos da cliente (o estado aberto/fechado ou olhar para baixo segue a ação da Imagem #1)'}
     * NOSE & LIPS (BIOMETRIC MORPHOLOGY): ${clientData.nariz_e_labios || 'Anatomia exata do nariz e volume dos lábios da cliente (a ação de biquinho assoprando ou expressão segue a Imagem #1)'}
     * REAL SKIN TONE & EXECUTIVE RETOUCHING: ${clientData.tom_e_textura_pele || 'Tom natural de pele e sub-tom do cliente, com poros fotográficos reais, com leve maquiagem de estúdio/retoque executivo suave sem efeito de pele plástica'}
     * REAL HAIR (COLOR, LENGTH & NATURAL TEXTURE): ${clientData.cabelo_cor_tamanho_textura || 'Cor natural exata do cabelo, comprimento, densidade, linha frontal capilar e padrão de textura'}
     * NATURAL AGE, MATURITY & DISTINCTIVE TRAITS: ${clientData.idade_e_caracteristicas_distintas || 'Idade real aparente, linhas de expressão naturais e traços fisionômicos únicos do cliente'}
   - AUTHENTIC BEARD & FACIAL HAIR VOLUME:
     * ZERO TOLERANCE FOR REFERENCE BEARD: Under NO circumstance should the generated person inherit the beard volume, density, length, or shape from Image #1.
     * PRESERVE EXCLUSIVELY THE CLIENT'S AUTHENTIC BEARD: ${clientData.barba_e_pelos_faciais || (gender === 'male' ? 'Preservar com fidelidade absoluta de 100% o volume, corte e densidade de barba original do cliente visível em suas fotos reais. Proibido copiar qualquer barba da imagem de referência.' : 'Não aplicável (sem pelos faciais, pele feminina limpa e suave).')}
     * If the client is clean-shaven in their camera photos, KEEP THEM 100% CLEAN-SHAVEN.
     * If the client has light stubble, KEEP LIGHT STUBBLE ONLY.
     * If the client has a short or trimmed beard, DO NOT make it bushy, thick, or full.

### CRITICAL ANTI-COLLAGE & ZERO-HEAD-SWAP DIRECTIVE (MANDATORY):
- UNDER NO CIRCUMSTANCES should you perform a face-swap, head replacement, cut-out, or composite collage.
- DO NOT cut the head from ${clientRefLabel} and paste it onto Image #1's neck or collar.
- INSTEAD, RECONSTRUCT AND RENDER THE ENTIRE HUMAN SUBJECT AS ONE CONTINUOUS, ORGANIC BIOLOGICAL ORGANISM from the crown of the head down through the neck, throat, collarbones, shoulders, arms, hands, and torso.
- Ensure 100% uniform skin tone, consistent pore texture, and natural muscle transitions across the jawline, neck, and chest with ZERO visible seams, ZERO cut-out artifacts, and ZERO halo borders.
- The cohesive lighting scheme from Image #1 (including key light, rim light, and specular highlights such as flickering golden candle sparks) must illuminate the client's head, face, neck, hands, and clothing cohesively in a single photographic exposure.

### 4. EXECUTIVE GROOMING & HIGH-END COMMERCIAL HEADSHOT RETOUCHING (BLEMISH-FREE YET AUTHENTIC):
- COMMERCIAL HEADSHOT STANDARD: Apply subtle high-end studio grooming for an executive professional profile (LinkedIn / Forbes editorial headshot).
- FLAWLESS YET REALISTIC COMPLEXION: Smooth out and conceal minor skin blemishes, redness, pimples, forehead marks, and undereye dark circles with light, sheer studio makeup/grooming.
- ABSOLUTELY ZERO PLASTIC SKIN: Keep authentic micro-pores, crisp hair details, and genuine facial anatomy. The skin must look impeccably clean, healthy, and rested — NEVER blurry, waxy, or artificial.
- Single individual, ultra-photorealistic Hasselblad 85mm f/1.4 commercial editorial portrait.`;

    // Prompt Mestre: Inversão de Prioridade (Image #1 = Cliente, Image #2 = Referência)
    const clientFirstMasterPrompt = `[HIGH-PRIORITY DIRECTIVE: REVOLUTIONARY ORGANIC EDITORIAL PORTRAIT RE-SYNTHESIS]

### VISUAL REFERENCES PROVIDED:
1. ${clientHeadingFirst} (PRIMARY HUMAN SUBJECT IDENTITY - SACROSANCT BIOMETRIC FIDELITY):
   - The subject of this photograph is 100% THE EXACT REAL INDIVIDUAL depicted in ${clientHeadingFirst}.
   - Absolute biometric facial fidelity:
     * FACIAL GEOMETRY & BONE STRUCTURE: ${clientData.rosto}
     * EYES, IRIS COLOR & EYEBROWS (BIOMETRIC SHAPE): ${clientData.olhos_e_sobrancelhas}
     * NOSE, LIPS & MOUTH (BIOMETRIC SHAPE): ${clientData.nariz_e_labios}
     * REAL SKIN TONE & NATURAL PORE TEXTURE: ${clientData.tom_e_textura_pele}
     * REAL HAIR COLOR, TEXTURE & HAIRLINE: ${clientData.cabelo_cor_tamanho_textura}
     * AUTHENTIC BEARD & GROOMING: ${clientData.barba_e_pelos_faciais}
     * NATURAL AGE & DISTINCTIVE TRAITS: ${clientData.idade_e_caracteristicas_distintas}

2. ${sceneRefLast} (SCENE, ACTION, COMPOSITION & STYLING TEMPLATE - DO NOT COPY THIS MODEL'S FACE):
   - Recreate the subject from ${clientHeadingFirst} placed inside this exact scene, camera distance, framing, lighting, dynamic facial action, props, and wardrobe:
   - CAMERA DISTANCE & FRAMING: ${refSceneData.enquadramento_distancia || refSceneData.angulo || 'Medium close-up portrait, framed from lower chest up with natural headroom'}
   - EXACT FACIAL ACTION & EMOTION (MANDATORY OVERRIDE): ${refSceneData.expressao_acao_facial || 'Exact head tilt, eye state (gently closed or downward gaze toward the cake/prop), and mouth action (puckered rounded lips gently blowing out the candle). The client must perform this action rather than their selfie pose.'}
   - PROPS & PHYSICAL INTERACTION: ${refSceneData.aderecos_interacao || 'Holding the exact prop at chest level with both hands'}
   - ENVIRONMENT & BACKGROUND: ${refSceneData.cenario || 'Dark, intimate, warm amber studio backdrop with vignette and deep shadows'}
   - CAMERA & OPTICS: ${refSceneData.lente_e_camera || '85mm f/1.4 prime lens on full-frame camera'}
   - LIGHTING SETUP & ATMOSPHERE: ${refSceneData.iluminacao}
   - BODY POSE & POSTURE: ${refSceneData.pose}
   - WARDROBE & CLOTHING: ${refSceneData.roupa} (Do NOT replace with a suit or blazer unless present in ${sceneRefLast}).

### CRITICAL ANTI-COLLAGE & ZERO-HEAD-SWAP DIRECTIVE (MANDATORY):
- Reconstruct the subject from ${clientHeadingFirst} organically inside the scene from ${sceneRefLast}.
- DO NOT perform any cut-and-paste montage or face replacement. Render the head, neck, throat, shoulders, and chest as ONE continuous anatomy with unified skin tone and cohesive lighting.

### EXECUTIVE GROOMING & HIGH-END COMMERCIAL RETOUCHING:
- Apply subtle high-end studio grooming for an executive professional profile: conceal minor blemishes, redness, forehead marks, and undereye dark circles with light sheer makeup.
- Retain authentic micro-pores and sharp photographic skin texture (NO plastic/waxy effect).
- Single individual, ultra-photorealistic Hasselblad 85mm f/1.4 commercial editorial portrait.`;

    const antiCollageMasterPrompt = `[HIGH-PRIORITY DIRECTIVE: ULTRA-REALISTIC SINGLE-SUBJECT EDITORIAL PORTRAIT]

### 1. SUBJECT IDENTITY (SACROSANCT 100% FIDELITY FROM ${clientHeading}):
- The subject of this photograph is 100% THE EXACT REAL INDIVIDUAL shown in ${clientRefLabel}.
- Absolute biometric identity match:
  * Facial geometry, bone structure, jawline, chin: ${clientData.rosto || 'Preservar com precisão cirúrgica o formato do rosto do cliente'}
  * Eyes, iris color, gaze direction, and eyebrow shape: ${clientData.olhos_e_sobrancelhas || 'Formato e cor dos olhos do cliente'}
  * Nose bridge, tip, mouth, and natural expression: ${clientData.nariz_e_labios || 'Proporções anatômicas naturais do nariz e lábios'}
  * Authentic skin tone with executive grooming retouch (flawless blemish-free complexion, concealed redness and undereye circles, crisp micro-pores, NO plastic/waxy smoothing): ${clientData.tom_e_textura_pele || 'Pele uniforme, limpa e suavemente maquiada para ensaio profissional com poros reais'}
  * Real hairline, natural hair color, texture, and density: ${clientData.cabelo_cor_tamanho_textura || 'Cor e textura real do cabelo'}
  * Natural age, maturity, and distinctive facial traits: ${clientData.idade_e_caracteristicas_distintas || 'Idade real e traços distintivos'}
  * AUTHENTIC BEARD & FACIAL HAIR: ${clientData.barba_e_pelos_faciais}

### 2. SCENE, WARDROBE, CAMERA & LIGHTING SYNTHESIS (EXACT REPLICATION FROM REFERENCE):
- Synthesize the complete environment, styling, and atmosphere around the subject with 100% photographic accuracy matching the reference:
  * CAMERA DISTANCE & FRAMING: ${refSceneData.enquadramento_distancia || refSceneData.angulo || 'Medium close-up portrait, framed from lower chest up'}
  * EXACT FACIAL ACTION & MOUTH GESTURE: ${refSceneData.expressao_acao_facial || 'Exact head tilt, eye state (gently closed or downward gaze toward the cake/prop), and mouth action (puckered rounded lips gently blowing out the candle)'}
  * PROPS & PHYSICAL INTERACTION: ${refSceneData.aderecos_interacao || 'Holding the exact prop at chest level with both hands'}
  * CAMERA & OPTICS: ${refSceneData.lente_e_camera || '85mm f/1.4 prime lens on full-frame camera'}, ${refSceneData.angulo || 'eye-level framing'}
  * ENVIRONMENT & SETTING: ${refSceneData.cenario || 'Dark, intimate, warm amber studio backdrop with soft dark vignette and deep shadows'}
  * LIGHTING & ATMOSPHERE: ${refSceneData.iluminacao || 'Atmospheric lighting matching reference with warm key light, specular reflections from candle, and subtle rim light'}
  * WARDROBE & CLOTHING: ${refSceneData.roupa || 'Replicate the exact outfit, fabric, colors, and styling from the reference scene'}
  * POSE & BODY POSTURE: ${refSceneData.pose || 'Exact body posture, chest orientation, head tilt, and arm/hand placement from the reference'}

### 3. ORGANIC COHESION DIRECTIVE (ANTI-COLLAGE / ZERO HEAD-SWAP):
- DO NOT perform any head-swapping, paste-on, or composite montage.
- The head, neck, shoulders, and body must be rendered as one continuous, anatomically flawless organism.
- Match the lighting on the face seamlessly with the scene's ambient light and environment: warm key light on the face, subtle rim light on the jaw and hair, with natural shadows.
- Executive grooming: clean, blemish-free complexion with subtle studio makeup and realistic pores.
- Both hands (if visible) must have five anatomically correct fingers with natural knuckles and skin texture.
- Shot on a full-frame Hasselblad / Leica camera with an 85mm f/1.4 lens. Soft natural depth of field and creamy background bokeh. Ultra-sharp focus on the subject's eyes. Single individual portrait.`;

    return res.json({
      success: true,
      referenceSceneJson: refSceneData,
      clientIdentityJson: clientData,
      masterPrompt,
      clientFirstMasterPrompt,
      antiCollageMasterPrompt,
    });
  } catch (err: any) {
    console.warn('[AnalyzePrompt] Aviso na análise Gemini (utilizando síntese de alta fidelidade):', err?.message || err);
    
    // Heurística de síntese de alta fidelidade com prioridade 100% no cliente
    const isMale = gender === 'male';
    const fallbackScene = {
      roupa: 'Replicate the exact outfit, fabric, colors, and styling from Image #1 with 100% fidelity. Do NOT replace with a suit or any other clothing unless present in Image #1.',
      pose: 'Exact body posture, chest orientation, head tilt, and arm/hand placement from Image #1',
      expressao_acao_facial: 'Exact dynamic facial action, head tilt, eye state (gently closed or downward gaze toward prop), and mouth gesture (puckered rounded lips gently blowing out candle or subtle expression) from Image #1. The client must adopt this action rather than their selfie pose.',
      aderecos_interacao: 'Holding the exact interactive prop from Image #1 at chest level with both hands (e.g. golden metallic birthday cake with golden spheres, plaque, and an illuminated sparkling candle emitting bright golden sparks).',
      iluminacao: 'Atmospheric lighting matching Image #1: warm key light on the subject, dramatic specular reflections from props illuminating the face and clothing, and subtle rim light against the backdrop',
      cenario: 'Exact environment, backdrop, architectural setting, and depth-of-field from Image #1. If Image #1 is a dark, warm amber studio backdrop with vignette, reproduce this exact intimate studio atmosphere with deep shadows',
      angulo: 'Eye-level portrait framing, medium close-up (bust to chest), centered composition matching Image #1',
      lente_e_camera: '85mm f/1.4 portrait prime lens, creamy background bokeh, ultra-sharp ocular focus',
      regra_barba: 'DESCARTAR 100% da barba da referência. Nunca aplicar o volume de barba da referência ao cliente.',
      regras_estritas: 'IGNORAR 100% dos traços físicos da pessoa na foto de referência (rosto, barba, olhos, pele, cabelo). Usar apenas a roupa exata de Image #1, iluminação, cenário, pose e ação facial.',
    };

    const beardRule = isMale
      ? 'Preservar com fidelidade absoluta de 100% o volume, corte e densidade de barba original do cliente visível em suas fotos reais. Se for barbeado, manter barbeado e liso; se tiver barba por fazer ou curta, manter exatamente esse mesmo comprimento rente ao rosto sem avolumar. Proibido copiar qualquer barba da imagem de referência.'
      : 'Não aplicável (sem pelos faciais, pele feminina limpa e suave).';

    const fallbackClient = {
      rosto: 'Preservar com precisão cirúrgica o formato do rosto do cliente, ossatura zigomática, linha do maxilar e contorno do queixo das fotos enviadas.',
      olhos_e_sobrancelhas: 'Formato, espaçamento, cor da íris e desenho das sobrancelhas exatamente idênticos aos das fotos reais do cliente (o estado aberto/fechado ou olhar para baixo segue a ação da Imagem #1).',
      nariz_e_labios: 'Proporção anatômica exata do nariz e formato dos lábios do cliente (o gesto de biquinho ou ação segue a Imagem #1).',
      tom_e_textura_pele: 'Tom natural de pele e sub-tom do cliente, com poros fotográficos reais, com leve maquiagem de estúdio/retoque executivo suave sem efeito de pele plástica.',
      cabelo_cor_tamanho_textura: 'Cor natural exata do cabelo, comprimento, densidade, linha frontal capilar e padrão de textura conforme as fotos da pessoa.',
      barba_e_pelos_faciais: beardRule,
      idade_e_caracteristicas_distintas: 'Idade real aparente, linhas de expressão naturais e traços fisionômicos únicos do cliente.',
      regras_estritas: 'IGNORAR todas as roupas e fundos das fotos do cliente. Extrair e reproduzir exclusivamente sua identidade física, facial e volume real de barba, executando a ação facial da referência.',
    };

    const clientCount = Math.max(1, (userImages as string[]).length);
    const clientRefLabel = clientCount > 1 ? `Images #2 through #${clientCount + 1}` : 'Image #2';
    const clientHeading = clientCount > 1 ? 'IMAGES #2+' : 'IMAGE #2';
    const clientHeadingFirst = clientCount > 1 ? `IMAGES #1 THROUGH #${clientCount}` : 'IMAGE #1';
    const sceneRefLast = `IMAGE #${clientCount + 1}`;

    const fallbackMasterPrompt = `[HIGH-PRIORITY DIRECTIVE: REVOLUTIONARY ORGANIC EDITORIAL PORTRAIT RE-SYNTHESIS]

### VISUAL REFERENCES PROVIDED:
1. IMAGE #1 (SCENE, ACTION, COMPOSITION & STYLING TEMPLATE - DO NOT COPY THIS MODEL'S FACE):
   - Image #1 is the strict visual template for environment, camera distance, framing, optics, lighting mood, body pose, dynamic facial action, and wardrobe.
   - EXACT CAMERA DISTANCE & FRAMING: ${fallbackScene.angulo}
   - EXACT FACIAL ACTION & MOUTH GESTURE: ${fallbackScene.expressao_acao_facial}
   - EXACT PROPS & INTERACTION: ${fallbackScene.aderecos_interacao}
   - EXACT CAMERA & OPTICS: ${fallbackScene.lente_e_camera}
   - EXACT LIGHTING SETUP & ATMOSPHERE: ${fallbackScene.iluminacao}
   - EXACT BACKGROUND & ENVIRONMENT: ${fallbackScene.cenario}
   - EXACT POSE, POSTURE & HANDS: ${fallbackScene.pose}
   - EXACT OUTFIT & WARDROBE: ${fallbackScene.roupa} (Do NOT replace with a suit or blazer unless present in Image #1).

2. ${clientHeading} (${clientRefLabel}) (SACROSANCT CLIENT IDENTITY - 100% BIOMETRIC FIDELITY):
   - CRITICAL OVERRIDE: All images after Image #1 (${clientRefLabel}) represent the REAL CLIENT captured via camera / live photos.
   - THE CLIENT'S FACE AND BIOMETRIC IDENTITY ARE SACROSANCT: The person depicted in the final image must be UNMISTAKABLY AND 100% THE EXACT SAME INDIVIDUAL as shown in ${clientRefLabel}.
   - DO NOT BLEND OR HYBRIDIZE: Do NOT morph or average the client's face with the reference model in Image #1. The final face must belong 100% to the client.
   - EXACT PHYSICAL TRAITS TO PRESERVE (DO NOT ALTER):
     * FACIAL GEOMETRY & CONTOURS: ${fallbackClient.rosto}
     * EYES & EYEBROWS: ${fallbackClient.olhos_e_sobrancelhas}
     * NOSE, LIPS & ANATOMY: ${fallbackClient.nariz_e_labios}
     * REAL SKIN TONE & NATURAL PORE TEXTURE: ${fallbackClient.tom_e_textura_pele}
     * REAL HAIR (COLOR, LENGTH & NATURAL TEXTURE): ${fallbackClient.cabelo_cor_tamanho_textura}
     * NATURAL AGE, MATURITY & DISTINCTIVE TRAITS: ${fallbackClient.idade_e_caracteristicas_distintas}
   - AUTHENTIC BEARD & FACIAL HAIR VOLUME:
     * ZERO TOLERANCE FOR REFERENCE BEARD: Under NO circumstance should the generated person inherit the beard volume, density, length, or shape from Image #1.
     * PRESERVE EXCLUSIVELY THE CLIENT'S AUTHENTIC BEARD: ${fallbackClient.barba_e_pelos_faciais}
     * If the client is clean-shaven in their camera photos, KEEP THEM 100% CLEAN-SHAVEN.
     * If the client has light stubble, KEEP LIGHT STUBBLE ONLY.
     * If the client has a short or trimmed beard, DO NOT make it bushy, thick, or full.

### CRITICAL ANTI-COLLAGE & ZERO-HEAD-SWAP DIRECTIVE (MANDATORY):
- UNDER NO CIRCUMSTANCES should you perform a face-swap, head replacement, cut-out, or composite collage.
- DO NOT cut the head from ${clientRefLabel} and paste it onto Image #1's neck or collar.
- INSTEAD, RECONSTRUCT AND RENDER THE ENTIRE HUMAN SUBJECT AS ONE CONTINUOUS, ORGANIC BIOLOGICAL ORGANISM from the crown of the head down through the neck, throat, collarbones, shoulders, arms, hands, and torso.
- Ensure 100% uniform skin tone, consistent pore texture, and natural muscle transitions across the jawline, neck, and chest with ZERO visible seams, ZERO cut-out artifacts, and ZERO halo borders.
- The ambient scene lighting and specular reflections must naturally wrap around the client's face, neck, and garments in a single photographic exposure.
- Single individual, ultra-photorealistic Hasselblad 85mm f/1.4 commercial editorial portrait.`;

    const fallbackClientFirstMasterPrompt = `[HIGH-PRIORITY DIRECTIVE: REVOLUTIONARY ORGANIC EDITORIAL PORTRAIT RE-SYNTHESIS]

### VISUAL REFERENCES PROVIDED:
1. ${clientHeadingFirst} (PRIMARY HUMAN SUBJECT IDENTITY - SACROSANCT BIOMETRIC FIDELITY):
   - The subject of this photograph is 100% THE EXACT REAL INDIVIDUAL depicted in ${clientHeadingFirst}.
   - Absolute biometric facial fidelity:
     * FACIAL GEOMETRY & BONE STRUCTURE: ${fallbackClient.rosto}
     * EYES, IRIS COLOR & EYEBROWS: ${fallbackClient.olhos_e_sobrancelhas}
     * NOSE, LIPS & MOUTH: ${fallbackClient.nariz_e_labios}
     * REAL SKIN TONE & NATURAL PORE TEXTURE: ${fallbackClient.tom_e_textura_pele}
     * REAL HAIR COLOR, TEXTURE & HAIRLINE: ${fallbackClient.cabelo_cor_tamanho_textura}
     * AUTHENTIC BEARD & GROOMING: ${fallbackClient.barba_e_pelos_faciais}
     * NATURAL AGE & DISTINCTIVE TRAITS: ${fallbackClient.idade_e_caracteristicas_distintas}

2. ${sceneRefLast} (SCENE, ACTION, COMPOSITION & STYLING TEMPLATE - DO NOT COPY THIS MODEL'S FACE):
   - Recreate the subject from ${clientHeadingFirst} placed inside this exact scene, camera distance, framing, lighting, dynamic facial action, props, and wardrobe:
   - CAMERA ANGLE & FRAMING: ${fallbackScene.angulo}
   - EXACT FACIAL ACTION & MOUTH GESTURE: ${fallbackScene.expressao_acao_facial}
   - EXACT PROPS & INTERACTION: ${fallbackScene.aderecos_interacao}
   - ENVIRONMENT & BACKGROUND: ${fallbackScene.cenario}
   - CAMERA & OPTICS: ${fallbackScene.lente_e_camera}
   - LIGHTING SETUP & ATMOSPHERE: ${fallbackScene.iluminacao}
   - BODY POSE & POSTURE: ${fallbackScene.pose}
   - WARDROBE & CLOTHING: ${fallbackScene.roupa}

### CRITICAL ANTI-COLLAGE & ZERO-HEAD-SWAP DIRECTIVE (MANDATORY):
- Reconstruct the subject from ${clientHeadingFirst} organically inside the scene from ${sceneRefLast}.
- DO NOT perform any cut-and-paste montage or face replacement. Render the head, neck, throat, shoulders, and chest as ONE continuous anatomy with unified skin tone and cohesive lighting.
- Single individual, ultra-photorealistic Hasselblad 85mm f/1.4 commercial editorial portrait.`;

    const fallbackAntiCollageMasterPrompt = `[HIGH-PRIORITY DIRECTIVE: ULTRA-REALISTIC SINGLE-SUBJECT EDITORIAL PORTRAIT]

### 1. SUBJECT IDENTITY (SACROSANCT 100% FIDELITY FROM IMAGES #1+):
- The subject of this photograph is 100% THE EXACT REAL INDIVIDUAL shown in the provided client camera photographs (Images #1+).
- Absolute biometric identity match:
  * Facial geometry, bone structure, jawline, chin: ${fallbackClient.rosto}
  * Eyes, iris color, gaze direction, and eyebrow shape: ${fallbackClient.olhos_e_sobrancelhas}
  * Nose bridge, tip, mouth, and natural expression: ${fallbackClient.nariz_e_labios}
  * Authentic skin tone, natural skin undertone, visible pores and micro-texture (NO airbrushing, NO plastic smoothing, NO beauty filters): ${fallbackClient.tom_e_textura_pele}
  * Real hairline, natural hair color, texture, and density: ${fallbackClient.cabelo_cor_tamanho_textura}
  * Natural age, maturity, and distinctive facial traits: ${fallbackClient.idade_e_caracteristicas_distintas}
  * AUTHENTIC BEARD & FACIAL HAIR: ${fallbackClient.barba_e_pelos_faciais}

### 2. SCENE, WARDROBE & VEHICLE SYNTHESIS (RENDER COHESIVELY FROM SCRATCH AROUND THE SUBJECT):
- Synthesize the complete environment, styling, and atmosphere around the subject with 100% organic cohesion:
  * ENVIRONMENT & SETTING: ${fallbackScene.cenario}
  * EXACT FACIAL ACTION & MOUTH GESTURE: ${fallbackScene.expressao_acao_facial}
  * PROPS & INTERACTION: ${fallbackScene.aderecos_interacao}
  * WARDROBE & CLOTHING: ${fallbackScene.roupa}
  * POSE & BODY POSTURE: ${fallbackScene.pose}
  * LIGHTING & ATMOSPHERE: ${fallbackScene.iluminacao}
  * CAMERA & OPTICS: ${fallbackScene.lente_e_camera}, ${fallbackScene.angulo}

### 3. ORGANIC COHESION DIRECTIVE (ANTI-COLLAGE / ZERO HEAD-SWAP):
- DO NOT perform any head-swapping, paste-on, or composite montage.
- The head, neck, shoulders, and body must be rendered as one continuous, anatomically flawless organism.
- Match the lighting on the face seamlessly with the scene's backlight and environment: warm rim light on the edges of the face, jaw, and hair, with natural shadows under the brow and nose.
- Both hands (if visible) must have five anatomically correct fingers with natural knuckles and skin texture.
- Shot on a full-frame Hasselblad / Leica camera with an 85mm f/1.8 lens. Soft natural depth of field and creamy background bokeh. Ultra-sharp focus on the subject's eyes. Single individual portrait.`;

    return res.json({
      success: true,
      referenceSceneJson: fallbackScene,
      clientIdentityJson: fallbackClient,
      masterPrompt: fallbackMasterPrompt,
      clientFirstMasterPrompt: fallbackClientFirstMasterPrompt,
      antiCollageMasterPrompt: fallbackAntiCollageMasterPrompt,
    });
  }
});

/**
 * Faz upload rápido em memória para o bucket público do Supabase para gerar URL HTTP válida para o WaveSpeedAI
 */
async function uploadToStorage(imgItem: string): Promise<string> {
  if (typeof imgItem !== 'string' || !imgItem.trim()) return '';
  if (imgItem.startsWith('http://') || imgItem.startsWith('https://')) {
    return imgItem;
  }
  const match = imgItem.match(/^data:([^;]+);base64,(.+)$/);
  const mimeType = match ? match[1] : 'image/jpeg';
  const base64Data = match ? match[2] : imgItem;
  const buffer = Buffer.from(base64Data, 'base64');
  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  const filename = `ws_${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;

  try {
    const uploadRes = await fetch(
      `https://ynodhjsyirxlrdjftxnh.supabase.co/storage/v1/object/temp-images/${filename}`,
      {
        method: 'POST',
        headers: {
          apikey: 'sb_publishable_cDAb3V68cxErvwkMBVUCbg_Q9aXZdc7',
          Authorization: 'Bearer sb_publishable_cDAb3V68cxErvwkMBVUCbg_Q9aXZdc7',
          'Content-Type': mimeType,
        },
        body: buffer,
      }
    );
    if (uploadRes.ok) {
      return `https://ynodhjsyirxlrdjftxnh.supabase.co/storage/v1/object/public/temp-images/${filename}`;
    }
  } catch (err) {
    console.warn('[Storage] Falha ao fazer upload temporário para Supabase:', err);
  }
  return imgItem;
}

// -------------------------------------------------------------
// ROTA 2: POST /api/generate
// Envia diretamente para o WaveSpeedAI (OpenAI GPT Image 2.5 Flare / Sunburst)
// com fallback legado para Nano Banana se explicitamente requisitado
// -------------------------------------------------------------
app.post('/api/generate', async (req, res) => {
  const {
    apiKey = '',
    prompt,
    aspectRatio = '3:4',
    resolution = '1K',
    model = 'gpt-image-2.5-flare',
    images = [],
    clientOrigin,
  } = req.body;

  // Resolve chave de API enviada por qualquer parâmetro ou cabeçalho
  const rawApiKey = (
    apiKey ||
    req.body?.accessCode ||
    req.body?.waveSpeedApiKey ||
    req.headers['x-api-key'] ||
    req.headers['authorization']?.replace(/^Bearer\s+/i, '') ||
    ''
  ).toString().trim();

  const waveSpeedKey =
    rawApiKey ||
    (process.env.WAVESPEED_KEY || process.env.WAVESPEED_API_KEY || '').trim();

  if (!waveSpeedKey) {
    return res.status(400).json({
      success: false,
      code: 400,
      error: 'Chave de API do WaveSpeedAI necessária para gerar fotos com GPT Image 2.5. Insira sua chave (ex: chave FOTOFLOW) em "⚙️ Configurações".',
      technicalDetails: 'Missing WaveSpeedAI API key in request and no WAVESPEED_KEY env variable found.',
    });
  }

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({
      success: false,
      code: 400,
      error: 'O prompt de geração é obrigatório.',
      technicalDetails: 'Missing prompt in request body.',
    });
  }

  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({
      success: false,
      code: 400,
      error: 'Nenhuma imagem foi enviada.',
      technicalDetails: 'images array must contain at least 1 image.',
    });
  }

  try {
    const isNanoBanana =
      model === 'nano-banana-2.1' ||
      model === 'nanobanana-2.1' ||
      model === 'nanobanana-2' ||
      model === 'nanobanana-pro';

    const isSunburst = model === 'gpt-image-2.5-sunburst';

    const waveSpeedModel = isNanoBanana
      ? 'nano-banana-2.1'
      : isSunburst
      ? 'gpt-image-2.5-sunburst'
      : 'gpt-image-2.5-flare';

    // Preparar URLs públicas para todas as imagens (garante compatibilidade 100% com WaveSpeedAI)
    console.log(`[FotoFlow Backend] -> Preparando ${images.length} imagens para upload público (WaveSpeed ${waveSpeedModel})...`);
    const waveSpeedImages: string[] = await Promise.all(
      images.slice(0, 16).map((imgItem: string) => uploadToStorage(imgItem))
    );

    const waveSpeedEndpoint = isNanoBanana
      ? (waveSpeedImages.length > 0
          ? 'https://api.wavespeed.ai/api/v3/google/nano-banana-2.1/edit'
          : 'https://api.wavespeed.ai/api/v3/google/nano-banana-2.1/text-to-image')
      : (waveSpeedImages.length > 0
          ? `https://api.wavespeed.ai/api/v3/openai/${waveSpeedModel}/edit`
          : `https://api.wavespeed.ai/api/v3/openai/${waveSpeedModel}/text-to-image`);

    const waveSpeedQuality =
      resolution === '4K' ? 'max' : resolution === '2K' ? 'high' : 'medium';

    const resLower = (resolution || '1k').toString().toLowerCase(); // '1k', '2k', '4k'

    const waveSpeedBody: Record<string, any> = {
      prompt,
      resolution: resLower,
      output_format: 'png',
      aspect_ratio: aspectRatio || '3:4',
    };

    if (!isNanoBanana) {
      waveSpeedBody.quality = waveSpeedQuality;
    }

    if (waveSpeedImages.length > 0) {
      waveSpeedBody.images = waveSpeedImages;
      if (waveSpeedImages.length === 1) {
        waveSpeedBody.image = waveSpeedImages[0];
      }
    }

    console.log(
      `[FotoFlow Backend] -> DISPARANDO CHAMADA DIRETA PARA WAVESPEED (${waveSpeedModel} em ${waveSpeedEndpoint}) com ${waveSpeedImages.length} imagens e resolução ${resolution}`
    );

    const wsResponse = await fetch(waveSpeedEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${waveSpeedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(waveSpeedBody),
    });

      const wsResponseText = await wsResponse.text();
      let wsData: any = null;
      try {
        wsData = JSON.parse(wsResponseText);
      } catch {
        wsData = null;
      }

      console.log(
        `[FotoFlow Backend] -> RESPOSTA WAVESPEED HTTP ${wsResponse.status}:`,
        wsData?.code || wsData?.message || wsResponse.statusText
      );

      if (!wsResponse.ok || wsData?.code === 401 || (wsData?.code && wsData.code >= 400)) {
        const errorMsg =
          wsData?.message ||
          wsData?.msg ||
          (wsResponse.status === 401
            ? 'Chave de API do WaveSpeedAI inválida. Verifique sua chave no painel do WaveSpeedAI.'
            : 'Erro retornado pela API WaveSpeedAI ao iniciar GPT Image 2.5.');

        return res.status(wsResponse.status >= 400 ? wsResponse.status : 500).json({
          success: false,
          code: wsData?.code || wsResponse.status,
          error: errorMsg,
          technicalDetails: sanitizeKey(
            `HTTP ${wsResponse.status} ${wsResponse.statusText}\n${wsResponseText}`,
            waveSpeedKey
          ),
        });
      }

      const waveTaskId =
        wsData?.data?.id || wsData?.id || wsData?.request_id || wsData?.data?.request_id;

      if (!waveTaskId) {
        return res.status(500).json({
          success: false,
          code: 500,
          error: 'A API WaveSpeedAI não retornou o ID da previsão (request_id).',
          technicalDetails: sanitizeKey(wsResponseText, waveSpeedKey),
        });
      }

      console.log(`[FotoFlow Backend] -> Tarefa iniciada no WaveSpeed com ID: ${waveTaskId}`);

      return res.json({
        success: true,
        code: 200,
        data: {
          taskId: waveTaskId,
          provider: 'wavespeed',
        },
      });
    /*
    // Fluxo legado para Nano Banana
    const cleanKey = nanoKey;
    const supabaseUrl =
      process.env.SUPABASE_URL || req.body?.supabaseUrl || 'https://ynodhjsyirxlrdjftxnh.supabase.co';
    const supabaseKey =
      process.env.SUPABASE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      req.body?.supabaseKey ||
      'sb_publishable_cDAb3V68cxErvwkMBVUCbg_Q9aXZdc7';
    const supabaseBucket =
      process.env.SUPABASE_BUCKET || req.body?.supabaseBucket || 'temp-images';

    const baseUrl = resolveBaseUrl(req, clientOrigin);
    const imageUrls: string[] = [];

    // Limite de imagens: Nano Banana 2 suporta até 14, Pro suporta até 8
    const maxImages = model === 'nanobanana-pro' ? 8 : 14;

    for (const imgItem of images.slice(0, maxImages)) {
      let contentType = 'image/jpeg';
      let base64Data = '';

      if (typeof imgItem === 'string' && imgItem.startsWith('data:')) {
        const match = imgItem.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          contentType = match[1];
          base64Data = match[2];
        } else {
          base64Data = imgItem.replace(/^data:[^;]+;base64,/, '');
        }
      } else if (typeof imgItem === 'string' && imgItem.startsWith('http')) {
        imageUrls.push(imgItem);
        continue;
      } else if (typeof imgItem === 'string') {
        base64Data = imgItem;
      }

      const buffer = Buffer.from(base64Data, 'base64');
      const ext = contentType.includes('png') ? 'png' : 'jpg';
      let publicUrl = '';

      if (supabaseUrl && supabaseKey) {
        try {
          publicUrl = await uploadToSupabaseStorage(
            buffer,
            contentType,
            supabaseUrl,
            supabaseKey,
            supabaseBucket
          );
        } catch (supaErr: any) {
          console.warn(
            '[FotoFlow Backend] Aviso no Supabase Storage (fallback para armazenamento local):',
            supaErr?.message || supaErr
          );
        }
      }

      if (!publicUrl) {
        const imageId = crypto.randomUUID();
        imageStore.set(imageId, {
          buffer,
          contentType,
          createdAt: Date.now(),
        });

        setTimeout(() => {
          imageStore.delete(imageId);
        }, 15 * 60 * 1000);

        publicUrl = `${baseUrl}/tmp-images/${imageId}.${ext}`;
      }

      imageUrls.push(publicUrl);
    }

    const isNanoBanana2 = model !== 'nanobanana-pro';
    const targetUrl = isNanoBanana2
      ? 'https://api.nanobananaapi.ai/api/v1/nanobanana/generate-2'
      : 'https://api.nanobananaapi.ai/api/v1/nanobanana/generate-pro';

    // Corpo da requisição conforme o modelo selecionado
    const requestBody = isNanoBanana2
      ? {
          prompt,
          imageUrls: imageUrls.slice(0, 14),
          aspectRatio: aspectRatio || '3:4',
          resolution: resolution || '1K',
          googleSearch: false,
          outputFormat: 'png',
        }
      : {
          prompt,
          imageUrls: imageUrls.slice(0, 8),
          resolution: resolution || '1K',
          aspectRatio: aspectRatio || '3:4',
          callBackUrl: 'https://example.com/callback',
        };

    console.log(
      `[FotoFlow Backend] Criando tarefa em ${isNanoBanana2 ? 'Nano Banana 2' : 'Nano Banana Pro'} (${resolution}) com ${imageUrls.length} imagens públicas`
    );

    // Chamar a API da nanobananaapi pelo servidor
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cleanKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }

    const sanitizedTechDetails = sanitizeKey(
      `HTTP ${response.status} ${response.statusText}\n${responseText}`,
      cleanKey
    );

    if (!response.ok || data?.code !== 200) {
      console.error(`[FotoFlow Backend] Erro retornado pela nanobananaapi (HTTP ${response.status})`);
      let friendlyMessage = 'Erro retornado pela API nanobananaapi ao criar tarefa.';
      if (data?.msg || data?.message) {
        friendlyMessage = `Erro do provedor: ${data.msg || data.message}`;
      } else if (response.status === 401) {
        friendlyMessage = 'Chave de API inválida ou não autorizada pela nanobananaapi.ai.';
      }

      return res.status(response.status >= 400 ? response.status : 500).json({
        success: false,
        code: data?.code || response.status,
        error: friendlyMessage,
        technicalDetails: sanitizedTechDetails,
      });
    }

    const taskId = data?.data?.taskId || data?.taskId;
    if (!taskId) {
      return res.status(500).json({
        success: false,
        code: 500,
        error: 'A API respondeu com status 200, mas não retornou o taskId.',
        technicalDetails: sanitizedTechDetails,
      });
    }

    return res.json({
      success: true,
      code: 200,
      data: { taskId },
    });
    */
  } catch (err: any) {
    const rawMsg = err?.message || String(err);
    const sanitizedMsg = sanitizeKey(rawMsg, waveSpeedKey);
    console.error('[FotoFlow Backend] Falha na rota /api/generate (WaveSpeed):', sanitizedMsg);

    return res.status(500).json({
      success: false,
      code: 500,
      error: 'Falha de comunicação com a API WaveSpeedAI.',
      technicalDetails: sanitizedMsg,
    });
  }
});

// -------------------------------------------------------------
// ROTA 3: GET /api/status?taskId=...
// Recebe a chave no header "x-api-key" e consulta nanobananaapi
// -------------------------------------------------------------
app.get('/api/status', async (req, res) => {
  const apiKey = (req.headers['x-api-key'] as string) || '';
  const taskId = (req.query.taskId as string) || '';
  const provider = (req.query.provider as string) || '';

  if (!taskId) {
    return res.status(400).json({
      success: false,
      code: 400,
      error: 'Parâmetro taskId é obrigatório.',
      technicalDetails: 'Missing taskId query parameter.',
    });
  }

  // Se o provedor for WaveSpeedAI (ou se o ID de tarefa for de predição do WaveSpeed)
  const isWaveSpeed =
    provider === 'wavespeed' ||
    req.query?.provider === 'wavespeed' ||
    taskId.startsWith('pred_') ||
    taskId.startsWith('ws_') ||
    (taskId.length >= 20 && taskId.includes('-')) ||
    provider !== 'nanobanana';

  if (isWaveSpeed) {
    const waveKey =
      apiKey.trim() ||
      (process.env.WAVESPEED_KEY || process.env.WAVESPEED_API_KEY || '').trim();

    if (!waveKey) {
      return res.status(400).json({
        success: false,
        code: 400,
        error: 'Chave de API do WaveSpeedAI necessária para consultar status.',
        technicalDetails: 'Missing WaveSpeedAI key in x-api-key header and env.',
      });
    }

    try {
      const cleanPredId = taskId.replace(/^ws_/, '');
      let wsStatusRes = await fetch(
        `https://api.wavespeed.ai/api/v3/predictions/${encodeURIComponent(cleanPredId)}/result`,
        {
          headers: {
            Authorization: `Bearer ${waveKey}`,
          },
        }
      );

      // Fallback para rota sem /result caso o modelo utilize formato REST direto
      if (wsStatusRes.status === 404) {
        wsStatusRes = await fetch(
          `https://api.wavespeed.ai/api/v3/predictions/${encodeURIComponent(cleanPredId)}`,
          {
            headers: {
              Authorization: `Bearer ${waveKey}`,
            },
          }
        );
      }

      const wsText = await wsStatusRes.text();
      let wsData: any = null;
      try {
        wsData = JSON.parse(wsText);
      } catch {
        wsData = null;
      }

      if (!wsStatusRes.ok || !wsData) {
        return res.status(wsStatusRes.status).json({
          success: false,
          code: wsData?.code || wsStatusRes.status,
          error: wsData?.message || wsData?.msg || 'Erro ao consultar status no WaveSpeedAI.',
          technicalDetails: sanitizeKey(wsText, waveKey),
        });
      }

      const record = wsData?.data || wsData;
      const statusStr = (record?.status || wsData?.status || '').toString().toLowerCase();

      // Extrair URL do resultado em todas as propriedades comuns possíveis da API WaveSpeed
      let resultUrl: string | null = null;
      const candidates = [
        record?.outputs,
        record?.output,
        record?.images,
        record?.image,
        record?.results,
        record?.result,
        record?.output_images,
        record?.output_url,
        record?.resultImageUrl,
        record?.image_url,
        record?.url,
        wsData?.outputs,
        wsData?.output,
        wsData?.images,
        wsData?.image,
        wsData?.results,
        wsData?.result,
        wsData?.output_url,
        wsData?.resultImageUrl,
        wsData?.url,
      ];

      for (const item of candidates) {
        if (!item) continue;
        if (typeof item === 'string' && (item.startsWith('http://') || item.startsWith('https://'))) {
          resultUrl = item;
          break;
        }
        if (Array.isArray(item) && item.length > 0) {
          const first = item[0];
          if (typeof first === 'string' && (first.startsWith('http://') || first.startsWith('https://'))) {
            resultUrl = first;
            break;
          }
          if (first && typeof first === 'object' && typeof first.url === 'string') {
            resultUrl = first.url;
            break;
          }
        }
        if (typeof item === 'object' && typeof item.url === 'string') {
          resultUrl = item.url;
          break;
        }
      }

      const isCompleted =
        statusStr === 'completed' ||
        statusStr === 'succeeded' ||
        statusStr === 'success' ||
        statusStr === 'done' ||
        statusStr === 'finished' ||
        Boolean(resultUrl);

      // Quando o status for de sucesso ou tiver imagem pronta
      if (isCompleted && resultUrl) {
        console.log(`[FotoFlow Backend] -> Foto gerada com sucesso via WaveSpeedAI! URL: ${resultUrl}`);
        return res.json({
          success: true,
          code: 200,
          data: {
            successFlag: 1,
            isFinished: true,
            resultImageUrl: resultUrl,
            response: { resultImageUrl: resultUrl },
          },
          resultImageUrl: resultUrl,
          isFinished: true,
        });
      }

      // Se falhou
      if (
        statusStr === 'failed' ||
        statusStr === 'canceled' ||
        statusStr === 'cancelled' ||
        statusStr === 'error'
      ) {
        const errorMsg =
          record?.error ||
          record?.message ||
          wsData?.error ||
          wsData?.message ||
          'Falha no processamento pelo modelo GPT Image 2.5 no WaveSpeedAI.';
        return res.json({
          success: false,
          code: 500,
          data: {
            successFlag: 2,
            isFinished: true,
            errorMessage: errorMsg,
          },
          error: errorMsg,
        });
      }

      // Em processamento / fila
      return res.json({
        success: true,
        code: 200,
        data: {
          successFlag: 0,
          isFinished: false,
          state: statusStr || 'processing',
        },
        isFinished: false,
      });
    } catch (wsErr: any) {
      return res.status(500).json({
        success: false,
        error: wsErr?.message || 'Erro de rede ao consultar WaveSpeedAI.',
      });
    }
  }

  // Provedor padrão: Nano Banana API
  const cleanKey = apiKey.trim() || (process.env.NANO || '').trim();

  if (!cleanKey) {
    return res.status(400).json({
      success: false,
      code: 400,
      error: 'Chave de API ausente no cabeçalho x-api-key e na variável NANO.',
      technicalDetails: 'Missing x-api-key header or NANO env variable.',
    });
  }

  try {
    const upstreamRes = await fetch(
      `https://api.nanobananaapi.ai/api/v1/nanobanana/record-info?taskId=${encodeURIComponent(taskId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cleanKey}`,
        },
      }
    );

    const responseText = await upstreamRes.text();
    let data: any = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }

    if (!upstreamRes.ok || !data) {
      return res.status(upstreamRes.status).json({
        success: false,
        code: data?.code || upstreamRes.status,
        error: `Erro ao consultar status da tarefa (HTTP ${upstreamRes.status}).`,
        technicalDetails: sanitizeKey(
          `HTTP ${upstreamRes.status} ${upstreamRes.statusText}\n${responseText}`,
          cleanKey
        ),
      });
    }

    // Extrair URL do resultado caso concluído para facilitar consumo no cliente
    const record = data?.data || data;
    const resultUrl =
      record?.response?.resultImageUrl ||
      record?.response?.originImageUrl ||
      record?.resultImageUrl ||
      record?.originImageUrl ||
      record?.response?.imageUrl ||
      (typeof record?.response === 'string' && record.response.startsWith('http') ? record.response : null);

    return res.json({
      ...data,
      resultImageUrl: resultUrl,
      isFinished: record?.successFlag === 1,
      isFailed: record?.successFlag === 2 || record?.successFlag === 3,
    });

    // Retorna o JSON diretamente para o front-end
    return res.json(data);
  } catch (err: any) {
    const rawMsg = err?.message || String(err);
    const sanitizedMsg = sanitizeKey(rawMsg, cleanKey);
    console.error('[FotoFlow Backend] Erro na rota /api/status:', sanitizedMsg);

    return res.status(500).json({
      success: false,
      code: 500,
      error: 'Falha de rede ao consultar status da tarefa.',
      technicalDetails: sanitizedMsg,
    });
  }
});

// Setup Vite em desenvolvimento ou arquivos estáticos em produção
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[FotoFlow] Servidor rodando em http://localhost:${PORT}`);
  });
  server.setTimeout(0); // Permite conexões de longa duração sem abortar downloads/uploads ou gerações 4K
  server.keepAliveTimeout = 120000;
}

startServer();
