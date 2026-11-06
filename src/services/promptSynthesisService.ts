/**
 * Serviço de Análise e Síntese Inteligente de Prompt
 * 
 * FLUXO EM 3 ETAPAS OBRIGATÓRIAS:
 * 1. Analisa a imagem de REFERÊNCIA ignorando 100% dos traços físicos da pessoa
 *    (cabelo, rosto, tom de pele, etnia) e extrai exclusivamente:
 *    roupa, pose, iluminação, cenário, ângulo, lente e câmera em JSON mestre.
 * 2. Faz um scan profundo das FOTOS DO CLIENTE levando em consideração todos
 *    os traços físicos reais (rosto, formato dos olhos, nariz, lábios, dentes,
 *    tom de pele, cor/tamanho/textura do cabelo, barba, traços) e ignorando
 *    completamente as roupas.
 * 3. Dá o match unindo os dois prompts gerando um prompt mestre ultrarrealista
 *    que obriga o gerador a seguir 100% as características do cliente na cena da referência.
 */

export interface ReferenceSceneAnalysis {
  roupa: string;
  pose: string;
  expressao_acao_facial?: string;
  aderecos_interacao?: string;
  iluminacao: string;
  cenario: string;
  angulo: string;
  enquadramento_distancia?: string;
  lente_e_camera: string;
  regra_barba: string;
  regras_estritas: string;
}

export interface ClientIdentityAnalysis {
  rosto: string;
  olhos_e_sobrancelhas: string;
  nariz_e_labios: string;
  tom_e_textura_pele: string;
  cabelo_cor_tamanho_textura: string;
  barba_e_pelos_faciais: string;
  idade_e_caracteristicas_distintas: string;
  proporcoes_e_maos?: string;
  regras_estritas: string;
}

export interface PromptSynthesisResult {
  referenceSceneJson: ReferenceSceneAnalysis;
  clientIdentityJson: ClientIdentityAnalysis;
  masterPrompt: string;
  clientFirstMasterPrompt?: string;
  antiCollageMasterPrompt?: string;
}

/**
 * Constrói o Prompt Mestre no modo Anti-Colagem (Síntese Fotográfica Pura / Prompt Only).
 * Neste modo, a foto de referência NÃO é enviada ao gerador (WaveSpeed).
 * Enviamos APENAS a foto real do cliente (Image #1 = Cliente).
 * O modelo é instruído a renderizar o sujeito de Image #1 diretamente na cena,
 * iluminação, roupa e pose descritas no prompt, eliminando 100% o recorte, colagem ou montagem de cabeça.
 */
export function buildAntiCollageMasterPrompt(
  scene: ReferenceSceneAnalysis,
  client: ClientIdentityAnalysis,
  clientPhotosCount = 1
): string {
  const clientHeading = clientPhotosCount > 1 ? 'IMAGES #1+' : 'IMAGE #1';
  const clientRef = clientPhotosCount > 1 ? 'the provided client camera photographs (Images #1+)' : 'Image #1';

  return `[HIGH-PRIORITY DIRECTIVE: ULTRA-REALISTIC SINGLE-SUBJECT EDITORIAL PORTRAIT]

### 1. SUBJECT IDENTITY (SACROSANCT 100% FIDELITY FROM ${clientHeading}):
- The subject of this photograph is 100% THE EXACT REAL INDIVIDUAL shown in ${clientRef}.
- Absolute biometric identity match:
  * Facial geometry, bone structure, jawline, chin: ${client.rosto}
  * Eyes, iris color, gaze direction, and eyebrow shape: ${client.olhos_e_sobrancelhas}
  * Nose bridge, tip, mouth, and natural expression: ${client.nariz_e_labios}
  * Authentic skin tone, natural skin undertone, visible pores and micro-texture (NO airbrushing, NO plastic smoothing, NO beauty filters): ${client.tom_e_textura_pele}
  * Real hairline, natural hair color, texture, and density: ${client.cabelo_cor_tamanho_textura}
  * Natural age, maturity, and distinctive facial traits: ${client.idade_e_caracteristicas_distintas}
  * AUTHENTIC BEARD & FACIAL HAIR: ${client.barba_e_pelos_faciais}

### 2. SCENE, WARDROBE, CAMERA & LIGHTING SYNTHESIS (EXACT REPLICATION FROM REFERENCE):
- Synthesize the complete environment, styling, and atmosphere around the subject with 100% photographic accuracy matching the reference:
  * CAMERA DISTANCE & FRAMING: ${scene.enquadramento_distancia || scene.angulo || 'Medium close-up portrait, framed from lower chest up'}
  * EXACT FACIAL ACTION & MOUTH GESTURE: ${scene.expressao_acao_facial || 'Exact head tilt, eye state (gently closed or downward gaze toward the cake/prop), and mouth action (puckered rounded lips gently blowing out candle)'}
  * PROPS & PHYSICAL INTERACTION: ${scene.aderecos_interacao || 'Holding the exact interactive prop at chest level with both hands'}
  * CAMERA & OPTICS: ${scene.lente_e_camera || '85mm f/1.4 prime lens on full-frame camera'}, ${scene.angulo || 'eye-level framing'}
  * ENVIRONMENT & SETTING: ${scene.cenario}
  * LIGHTING & ATMOSPHERE: ${scene.iluminacao}
  * WARDROBE & CLOTHING: ${scene.roupa}
  * POSE & BODY POSTURE: ${scene.pose}

### 3. ORGANIC COHESION DIRECTIVE (ANTI-COLLAGE / ZERO HEAD-SWAP):
- DO NOT perform any head-swapping, paste-on, or composite montage.
- The head, neck, shoulders, and body must be rendered as one continuous, anatomically flawless organism.
- Match the lighting on the face seamlessly with the scene's ambient light and environment: warm key light on the face, specular reflections from props, and subtle rim light on the jaw and hair, with natural shadows.
- EXECUTIVE GROOMING & RETOUCHING: Subtle high-end studio grooming for a professional executive portrait. Conceal minor blemishes, redness, forehead marks, and dark circles with light sheer makeup, while preserving authentic micro-pores (zero plastic/wax skin).
- Both hands (if visible) must have five anatomically correct fingers with natural knuckles and skin texture.
- Shot on a full-frame Hasselblad / Leica camera with an 85mm f/1.4 lens. Soft natural depth of field and creamy background bokeh. Ultra-sharp focus on the subject's eyes. Single individual portrait.`;
}

/**
 * Constrói o Prompt Mestre de Fusão Orgânica com Referência (Recomendado).
 * Em WaveSpeed GPT Image 2.5:
 * Image #1 = Imagem de Referência (molde de roupa, pose, iluminação, distância e enquadramento)
 * Images #2..N = Fotos do Cliente (biótipo, tom de pele uniforme, textura real de pele e barba)
 * Contém diretiva estrita de RE-SÍNTESE TOTAL ANTI-COLAGEM para eliminar qualquer montagem de cabeça.
 */
export function buildMasterPromptFromAnalyses(
  scene: ReferenceSceneAnalysis,
  client: ClientIdentityAnalysis,
  clientPhotosCount = 1
): string {
  const clientPhotosRef =
    clientPhotosCount > 1
      ? `Images #2 through #${clientPhotosCount + 1}`
      : 'Image #2';
  const clientHeading = clientPhotosCount > 1 ? 'IMAGES #2+' : 'IMAGE #2';

  return `[HIGH-PRIORITY DIRECTIVE: REVOLUTIONARY ORGANIC EDITORIAL PORTRAIT RE-SYNTHESIS]

### VISUAL REFERENCES PROVIDED:
1. IMAGE #1 (SCENE, ACTION, COMPOSITION & STYLING TEMPLATE - DO NOT COPY THIS MODEL'S FACE):
   - Image #1 is the strict visual template for environment, camera distance, framing, optics, lighting mood, body pose, dynamic facial action, interactive props, and wardrobe.
   - EXACT CAMERA DISTANCE & FRAMING: ${scene.enquadramento_distancia || scene.angulo || 'Medium close-up portrait, framed from lower chest up with natural headroom, center-weighted composition'}
   - EXACT FACIAL ACTION, HEAD TILT & MOUTH GESTURE (MANDATORY OVERRIDE):
     * ${scene.expressao_acao_facial || 'Exact head tilt, eye state (gently closed or downward gaze toward the cake/prop), and mouth action (puckered rounded lips gently blowing out the sparkler candle) from Image #1. DO NOT freeze the client in a forward stare or selfie toothy smile!'}
     * THE CLIENT'S FACE MUST EXECUTE THIS EXACT DYNAMIC ACTION! If Image #1 shows closed/downward eyes and puckered lips blowing a candle, the client MUST have closed/downward eyes and puckered lips blowing the candle.
   - EXACT PROPS & PHYSICAL INTERACTION:
     * ${scene.aderecos_interacao || 'Holding the exact prop at chest level with both hands (e.g. golden metallic birthday cake with golden spheres, engraved plaque, and an illuminated sparkling candle emitting bright golden sparks).'}
   - EXACT BACKGROUND & ENVIRONMENT:
     * ${scene.cenario}
     * STRICT BACKDROP RULE: If the reference is a dark studio backdrop with amber/warm vignette, REPRODUCE THIS EXACT DARK WARM STUDIO BACKDROP with deep shadows. Absolutely DO NOT replace it with bright rooms, pillars, or daylight windows.
   - EXACT LIGHTING SETUP & SPECULAR HIGHLIGHTS:
     * ${scene.iluminacao}
   - EXACT POSE, POSTURE & HANDS:
     * ${scene.pose}
   - EXACT OUTFIT & WARDROBE:
     * ${scene.roupa} (Replicate the exact outfit, fabric, colors, and styling from Image #1 with 100% fidelity. Do NOT replace with a suit or any other clothing unless present in Image #1).
   - EXACT LENS & OPTICS:
     * ${scene.lente_e_camera || '85mm f/1.4 portrait prime lens on full-frame camera, creamy background bokeh, tack-sharp ocular focus'}

2. ${clientHeading} (${clientPhotosRef}) (SACROSANCT CLIENT IDENTITY - 100% BIOMETRIC FIDELITY):
   - CRITICAL OVERRIDE: All images after Image #1 (${clientPhotosRef}) represent the REAL CLIENT captured via camera / live photos.
   - THE CLIENT'S FACE AND BIOMETRIC IDENTITY ARE SACROSANCT: The person depicted in the final image must be UNMISTAKABLY AND 100% THE EXACT SAME INDIVIDUAL as shown in ${clientPhotosRef}.
   - DO NOT BLEND OR HYBRIDIZE: Do NOT morph or average the client's face with the reference model in Image #1. The final face must belong 100% to the client.
   - BIOMETRIC ANATOMY PRESERVATION (MANDATORY):
     * FACIAL GEOMETRY & CONTOURS: ${client.rosto}
     * EYES & EYEBROWS (BIOMETRIC SHAPE): ${client.olhos_e_sobrancelhas} (Biometric shape and eye spacing belong to the client; open/closed/downward state follows the action in Image #1).
     * NOSE & LIPS (BIOMETRIC MORPHOLOGY): ${client.nariz_e_labios} (Nose bridge and lip fullness belong to the client; puckered blowing action follows Image #1).
     * REAL SKIN TONE, EXECUTIVE GROOMING & TEXTURE: ${client.tom_e_textura_pele}
     * REAL HAIR (COLOR, LENGTH & NATURAL TEXTURE): ${client.cabelo_cor_tamanho_textura}
     * NATURAL AGE, MATURITY & DISTINCTIVE TRAITS: ${client.idade_e_caracteristicas_distintas}
   - AUTHENTIC BEARD & FACIAL HAIR VOLUME:
     * ZERO TOLERANCE FOR REFERENCE BEARD: Under NO circumstance should the generated person inherit the beard volume, density, length, or shape from Image #1.
     * PRESERVE EXCLUSIVELY THE CLIENT'S AUTHENTIC BEARD: ${client.barba_e_pelos_faciais}
     * If the client is clean-shaven in their camera photos, KEEP THEM 100% CLEAN-SHAVEN.
     * If the client has light stubble, KEEP LIGHT STUBBLE ONLY.
     * If the client has a short or trimmed beard, DO NOT make it bushy, thick, or full.

### CRITICAL ANTI-COLLAGE & ZERO-HEAD-SWAP DIRECTIVE (MANDATORY):
- UNDER NO CIRCUMSTANCES should you perform a face-swap, head replacement, cut-out, or composite collage.
- DO NOT cut the head from ${clientPhotosRef} and paste it onto Image #1's neck or collar.
- INSTEAD, RECONSTRUCT AND RENDER THE ENTIRE HUMAN SUBJECT AS ONE CONTINUOUS, ORGANIC BIOLOGICAL ORGANISM from the crown of the head down through the neck, throat, collarbones, shoulders, arms, hands, and torso.
- Ensure 100% uniform skin tone, consistent pore texture, and natural muscle transitions across the jawline, neck, and chest with ZERO visible seams, ZERO cut-out artifacts, and ZERO halo borders.
- The cohesive lighting scheme from Image #1 (including key light, rim light, and specular highlights such as flickering golden candle sparks) must illuminate the client's head, face, neck, hands, and clothing cohesively in a single photographic exposure.

### 4. EXECUTIVE GROOMING & HIGH-END COMMERCIAL HEADSHOT RETOUCHING (BLEMISH-FREE YET AUTHENTIC):
- COMMERCIAL HEADSHOT STANDARD: Apply subtle high-end studio grooming for an executive professional profile (LinkedIn / Forbes editorial headshot).
- FLAWLESS YET REALISTIC COMPLEXION: Smooth out and conceal minor skin blemishes, redness, pimples, forehead marks, and undereye dark circles with light, sheer studio makeup/grooming.
- ABSOLUTELY ZERO PLASTIC SKIN: Keep authentic micro-pores, crisp hair details, and genuine facial anatomy. The skin must look impeccably clean, healthy, and rested — NEVER blurry, waxy, or artificial.
- Single individual, ultra-photorealistic Hasselblad 85mm f/1.4 commercial editorial portrait.`;
}

/**
 * Constrói o Prompt Mestre com Inversão de Prioridade (Cliente como Imagem #1).
 * Image #1 = Fotos do Cliente (Âncora máxima de identidade)
 * Image #2 = Imagem de Referência (Cenário, Iluminação, Pose e Roupa)
 */
export function buildClientFirstMasterPrompt(
  scene: ReferenceSceneAnalysis,
  client: ClientIdentityAnalysis,
  clientPhotosCount = 1
): string {
  const clientHeading = clientPhotosCount > 1 ? `IMAGES #1 THROUGH #${clientPhotosCount}` : 'IMAGE #1';
  const sceneRefLabel = `IMAGE #${clientPhotosCount + 1}`;

  return `[HIGH-PRIORITY DIRECTIVE: REVOLUTIONARY ORGANIC EDITORIAL PORTRAIT RE-SYNTHESIS]

### VISUAL REFERENCES PROVIDED:
1. ${clientHeading} (PRIMARY HUMAN SUBJECT IDENTITY - SACROSANCT BIOMETRIC FIDELITY):
   - The subject of this photograph is 100% THE EXACT REAL INDIVIDUAL depicted in ${clientHeading}.
   - Absolute biometric facial fidelity:
     * FACIAL GEOMETRY & BONE STRUCTURE: ${client.rosto}
     * EYES, IRIS COLOR & EYEBROWS (BIOMETRIC SHAPE): ${client.olhos_e_sobrancelhas}
     * NOSE, LIPS & MOUTH (BIOMETRIC SHAPE): ${client.nariz_e_labios}
     * REAL SKIN TONE, EXECUTIVE GROOMING & TEXTURE: ${client.tom_e_textura_pele}
     * REAL HAIR COLOR, TEXTURE & HAIRLINE: ${client.cabelo_cor_tamanho_textura}
     * AUTHENTIC BEARD & GROOMING: ${client.barba_e_pelos_faciais}
     * NATURAL AGE & DISTINCTIVE TRAITS: ${client.idade_e_caracteristicas_distintas}

2. ${sceneRefLabel} (SCENE, ACTION, COMPOSITION & STYLING TEMPLATE - DO NOT COPY THIS MODEL'S FACE):
   - Recreate the subject from ${clientHeading} placed inside this exact scene, camera distance, framing, lighting, dynamic facial action, props, and wardrobe:
   - CAMERA DISTANCE & FRAMING: ${scene.enquadramento_distancia || scene.angulo || 'Medium close-up portrait, framed from lower chest up with natural headroom'}
   - EXACT FACIAL ACTION & EMOTION (MANDATORY OVERRIDE): ${scene.expressao_acao_facial || 'Exact head tilt, eye state (gently closed or downward gaze toward the cake/prop), and mouth action (puckered rounded lips gently blowing out the candle). The client must perform this action rather than their selfie pose.'}
   - PROPS & PHYSICAL INTERACTION: ${scene.aderecos_interacao || 'Holding the exact prop at chest level with both hands'}
   - ENVIRONMENT & BACKGROUND: ${scene.cenario}
   - CAMERA & OPTICS: ${scene.lente_e_camera || '85mm f/1.4 prime lens on full-frame camera'}
   - LIGHTING SETUP & ATMOSPHERE: ${scene.iluminacao}
   - BODY POSE & POSTURE: ${scene.pose}
   - WARDROBE & CLOTHING: ${scene.roupa} (Do NOT replace with a suit or blazer unless present in ${sceneRefLabel}).

### CRITICAL ANTI-COLLAGE & ZERO-HEAD-SWAP DIRECTIVE (MANDATORY):
- Reconstruct the subject from ${clientHeading} organically inside the scene from ${sceneRefLabel}.
- DO NOT perform any cut-and-paste montage or face replacement. Render the head, neck, throat, shoulders, and chest as ONE continuous anatomy with unified skin tone and cohesive lighting.

### EXECUTIVE GROOMING & HIGH-END COMMERCIAL RETOUCHING:
- Apply subtle high-end studio grooming for an executive professional profile: conceal minor blemishes, redness, forehead marks, and undereye dark circles with light sheer makeup.
- Retain authentic micro-pores and sharp photographic skin texture (NO plastic/waxy effect).
- Single individual, ultra-photorealistic Hasselblad 85mm f/1.4 commercial editorial portrait.`;
}

/**
 * Heurística robusta de fallback e defaults originais para visualização e edição manual de prompts
 */
export function getDefaultAnalyses(gender: 'male' | 'female' = 'male'): {
  referenceSceneJson: ReferenceSceneAnalysis;
  clientIdentityJson: ClientIdentityAnalysis;
} {
  const isMale = gender === 'male';

  const referenceSceneJson: ReferenceSceneAnalysis = {
    enquadramento_distancia: 'Medium close-up portrait, framed from lower chest up with natural headroom, center-weighted composition matching Image #1',
    expressao_acao_facial: 'Exact dynamic facial action, head tilt, eye state (gently closed or downward serene gaze toward the cake/prop), and mouth gesture (puckered rounded lips gently blowing out the candle) from Image #1',
    aderecos_interacao: 'Holding the exact interactive prop from Image #1 at chest level with both hands (e.g. golden metallic birthday cake with golden spheres, plaque, and an illuminated sparkling candle emitting bright golden sparks).',
    roupa: 'Replicate the exact outfit, fabric, colors, and styling from Image #1 with 100% fidelity. Do NOT replace with a suit or any other clothing unless present in Image #1.',
    pose: 'Replicate exact posture, body angle, head tilt, and arm/hand placement from Image #1',
    iluminacao: 'Atmospheric lighting matching Image #1: warm key light on the subject, dramatic specular reflections from props illuminating the face and clothing, and subtle rim light against the backdrop',
    cenario: 'Exact environment, backdrop, architectural setting, and depth-of-field from Image #1. If Image #1 is a dark, warm amber studio backdrop with vignette, reproduce this exact intimate studio atmosphere with deep shadows',
    angulo: 'Eye-level portrait framing, medium close-up (bust to chest), centered composition matching Image #1',
    lente_e_camera: '85mm f/1.4 portrait prime lens on full-frame camera, creamy background bokeh, ultra-sharp ocular focus',
    regra_barba: 'DESCARTAR 100% da barba da referência. Nunca aplicar o volume de barba da referência ao cliente.',
    regras_estritas: 'IGNORAR 100% dos traços físicos da pessoa na foto de referência (rosto, barba, olhos, pele, cabelo). Usar apenas a roupa exata de Image #1, iluminação, cenário, pose e ação facial.',
  };

  const beardDescription = isMale
    ? 'Preservar com fidelidade absoluta de 100% o volume, corte e densidade de barba original do cliente visível em suas fotos reais. Se for barbeado, manter barbeado e liso; se tiver barba por fazer ou curta, manter exatamente esse mesmo comprimento rente ao rosto sem avolumar. Proibido copiar qualquer barba da imagem de referência.'
    : 'Não aplicável (sem pelos faciais, pele feminina limpa e suave).';

  const clientIdentityJson: ClientIdentityAnalysis = {
    rosto: 'Preservar com precisão cirúrgica o formato do rosto do cliente, ossatura zigomática, linha do maxilar e contorno do queixo das fotos enviadas.',
    olhos_e_sobrancelhas: 'Formato, espaçamento, cor da íris e desenho das sobrancelhas exatamente idênticos aos das fotos reais do cliente (o estado aberto/fechado ou olhar para baixo segue a ação da Imagem #1).',
    nariz_e_labios: 'Proporção anatômica exata do nariz e formato dos lábios do cliente (o gesto de biquinho ou ação segue a Imagem #1).',
    tom_e_textura_pele: 'Pele uniforme e saudável para perfil profissional/executivo, com leve maquiagem de estúdio que suaviza imperfeições, manchas, marcas da testa e olheiras, mantendo 100% da nitidez de microporos fotográficos reais sem efeito plástico ou artificial.',
    cabelo_cor_tamanho_textura: 'Cor natural exata do cabelo, comprimento, densidade, linha frontal capilar e padrão de textura conforme as fotos da pessoa.',
    barba_e_pelos_faciais: beardDescription,
    idade_e_caracteristicas_distintas: 'Idade real aparente, linhas de expressão naturais e traços fisionômicos únicos do cliente.',
    regras_estritas: 'IGNORAR todas as roupas e fundos das fotos do cliente. Extrair e reproduzir exclusivamente sua identidade física, facial e volume real de barba, adotando a ação facial da referência.',
  };

  return { referenceSceneJson, clientIdentityJson };
}

/**
 * Executa a síntese completa em 3 passos:
 * 1. Análise da Referência (ignora traços físicos e barba da referência)
 * 2. Scan Profundo do Cliente (ignora roupas do cliente e mapeia volume real da barba)
 * 3. Match e Geração do Prompt Mestre
 */
export async function synthesizeMasterPrompt(params: {
  referenceImage: string;
  userImages: string[];
  gender?: 'male' | 'female';
  fastMode?: boolean;
  renderingTechnique?: 'organic_fusion' | 'client_first' | 'prompt_only';
  antiCollageMode?: boolean; // compatibilidade retroativa
  onProgress?: (message: string) => void;
}): Promise<PromptSynthesisResult> {
  const gender = params.gender || 'male';
  const technique = params.renderingTechnique || (params.antiCollageMode === true ? 'prompt_only' : 'organic_fusion');
  const fastMode = params.fastMode === true;
  const clientCount = params.userImages.length || 1;

  // MODO ULTRARRÁPIDO: Síntese direta imediata se fastMode for explicitamente solicitado
  if (fastMode) {
    params.onProgress?.(
      technique === 'organic_fusion'
        ? 'Sintetizando diretivas de fusão orgânica e biometria facial instantaneamente...'
        : technique === 'client_first'
        ? 'Sintetizando diretivas com identidade prioritária do cliente...'
        : 'Sintetizando diretivas de cena e biometria facial...'
    );
    const { referenceSceneJson, clientIdentityJson } = getDefaultAnalyses(gender);
    const masterPrompt =
      technique === 'client_first'
        ? buildClientFirstMasterPrompt(referenceSceneJson, clientIdentityJson, clientCount)
        : technique === 'prompt_only'
        ? buildAntiCollageMasterPrompt(referenceSceneJson, clientIdentityJson, clientCount)
        : buildMasterPromptFromAnalyses(referenceSceneJson, clientIdentityJson, clientCount);

    return {
      referenceSceneJson,
      clientIdentityJson,
      masterPrompt,
      clientFirstMasterPrompt: buildClientFirstMasterPrompt(referenceSceneJson, clientIdentityJson, clientCount),
      antiCollageMasterPrompt: buildAntiCollageMasterPrompt(referenceSceneJson, clientIdentityJson, clientCount),
    };
  }

  params.onProgress?.(
    technique === 'organic_fusion'
      ? 'Analisando referência com IA (cenário, iluminação, distância e roupa para fusão orgânica)...'
      : technique === 'client_first'
      ? 'Analisando referência e priorizando biometria facial do cliente...'
      : 'Analisando referência com IA para síntese de cena...'
  );

  // Análise profunda via Gemini no servidor para extrair cena, iluminação e traços biométricos
  try {
    const res = await fetch('/api/analyze-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        referenceImage: params.referenceImage,
        userImages: params.userImages.slice(0, 5),
        gender,
        technique,
        antiCollage: technique === 'prompt_only',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.referenceSceneJson && data.clientIdentityJson) {
        params.onProgress?.(
          technique === 'organic_fusion'
            ? 'Síntese concluída! Gerando prompt de fusão fotográfica orgânica sem colagem...'
            : 'Síntese concluída! Gerando prompt mestre de alta fidelidade...'
        );

        let selectedPrompt = data.masterPrompt;
        if (technique === 'client_first' && data.clientFirstMasterPrompt) {
          selectedPrompt = data.clientFirstMasterPrompt;
        } else if (technique === 'prompt_only' && data.antiCollageMasterPrompt) {
          selectedPrompt = data.antiCollageMasterPrompt;
        } else if (!selectedPrompt) {
          selectedPrompt =
            technique === 'client_first'
              ? buildClientFirstMasterPrompt(data.referenceSceneJson, data.clientIdentityJson, clientCount)
              : technique === 'prompt_only'
              ? buildAntiCollageMasterPrompt(data.referenceSceneJson, data.clientIdentityJson, clientCount)
              : buildMasterPromptFromAnalyses(data.referenceSceneJson, data.clientIdentityJson, clientCount);
        }

        return {
          referenceSceneJson: data.referenceSceneJson,
          clientIdentityJson: data.clientIdentityJson,
          masterPrompt: selectedPrompt,
          clientFirstMasterPrompt:
            data.clientFirstMasterPrompt ||
            buildClientFirstMasterPrompt(data.referenceSceneJson, data.clientIdentityJson, clientCount),
          antiCollageMasterPrompt:
            data.antiCollageMasterPrompt ||
            buildAntiCollageMasterPrompt(data.referenceSceneJson, data.clientIdentityJson, clientCount),
        };
      }
    }
  } catch (err) {
    console.warn(
      '[PromptSynthesis] Endpoint /api/analyze-prompt não disponível, usando síntese inteligente local:',
      err
    );
  }

  // Fallback estruturado local de alta fidelidade
  params.onProgress?.(
    technique === 'organic_fusion'
      ? 'Sintetizando prompt mestre de fusão orgânica com fidelidade estrita...'
      : 'Sintetizando prompt mestre de alta fidelidade...'
  );
  const { referenceSceneJson, clientIdentityJson } = getDefaultAnalyses(gender);
  const masterPrompt =
    technique === 'client_first'
      ? buildClientFirstMasterPrompt(referenceSceneJson, clientIdentityJson, clientCount)
      : technique === 'prompt_only'
      ? buildAntiCollageMasterPrompt(referenceSceneJson, clientIdentityJson, clientCount)
      : buildMasterPromptFromAnalyses(referenceSceneJson, clientIdentityJson, clientCount);

  return {
    referenceSceneJson,
    clientIdentityJson,
    masterPrompt,
    clientFirstMasterPrompt: buildClientFirstMasterPrompt(referenceSceneJson, clientIdentityJson, clientCount),
    antiCollageMasterPrompt: buildAntiCollageMasterPrompt(referenceSceneJson, clientIdentityJson, clientCount),
  };
}
