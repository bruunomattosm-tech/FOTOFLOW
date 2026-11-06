# FotoFlow — Especificação Técnica Completa do Sistema & Arquitetura

> **Finalidade deste Documento:** Este arquivo contém a especificação técnica integral, arquitetura de software, fluxos de dados, esquemas de prompt, regras de negócio e integrações de API do sistema **FotoFlow**. Foi projetado para servir como fonte de verdade para alimentação de agentes de inteligência artificial externos, desenvolvedores e pipelines de automação.

---

## 1. Visão Geral do Sistema (System Overview)

O **FotoFlow** é uma aplicação web full-stack de alta performance desenvolvida para geração de **retratos fotográficos profissionais e ultra-realistas** usando Inteligência Artificial de última geração.

### O Problema Central Solucionado
Modelos generativos tradicionais frequentemente sofrem de:
1. **Contaminação de Identidade:** A pessoa gerada herda traços faciais, etnia ou barba do modelo da foto de referência.
2. **Pele Plástica / Artificial:** Filtros exagerados de IA que apagam poros, rugas naturais e textura fotográfica.
3. **Distorção de Barba e Pelos Faciais:** Homens barbeados recebem barba cheia só porque o terno da foto de referência tinha uma modelo com barba, ou vice-versa.
4. **Fotos de Baixa Qualidade de Entrada:** Fotos de galeria com ângulos ruins ou má iluminação comprometem a síntese.

### A Solução FotoFlow
O sistema resolve isso através de uma arquitetura em 3 pilares:
1. **Câmera Guiada com Visão Computacional (MediaPipe FaceLandmarker):** Valida em tempo real o ângulo 3D do rosto (yaw, pitch, roll), distância focal, iluminação e enquadramento antes de permitir a captura de até 5 ângulos essenciais.
2. **Síntese Mestre de Prompts em 3 Etapas (Dual-Scan + Cross-Match):** Um motor inteligente analisa a referência (extraindo apenas roupa, luz, pose e cenário) e analisa o cliente (extraindo biometria pura, poros e volume exato de barba), cruzando os dados em uma diretiva com 4 blocos mandatórios.
3. **Motor de Geração de Alta Fidelidade (Nano Banana 2 / Pro):** Pipeline de renderização em GPU com suporte a até 14 imagens de referência e resoluções até 4K, com timeout estendido de 360s e recuperação persistente de tarefas por `taskId`.

---

## 2. Stack Tecnológica & Dependências

### Front-end (Client SPA)
- **Framework:** React 19 + TypeScript + Vite
- **Estilização:** Tailwind CSS v4 (importação `@import "tailwindcss";`, dark luxury theme)
- **Ícones:** `lucide-react`
- **Visão Computacional no Navegador:** `@mediapipe/tasks-vision` (WebAssembly + modelos Face Landmarker float16/GPU)
- **Processamento de Imagens:** HTML5 Canvas, redimensionamento proporcional local para 1024px com compressão JPEG de qualidade 0.92, conversão base64 / Data URI.

### Back-end & Infraestrutura (Server)
- **Runtime:** Node.js com Express e `tsx`
- **Ambiente de Dev:** Servidor Express montando middlewares do Vite em porta 3000 (`tsx server.ts`)
- **SDK de IA:** `@google/genai` (Google Gemini 3.1 Flash Lite para análise multimodal das imagens)
- **Armazenamento Temporário:** Buffer em memória com TTL de 15 minutos e suporte transparente a Supabase Storage (bucket configurável).
- **Serviço de Geração de Imagens:** API Nano Banana (`nanobanana-2` e `nanobanana-pro` via endpoint direto ou Supabase Edge Functions).

---

## 3. Fluxo de Execução do Usuário (User Journey em 3 Etapas)

O fluxo principal foi desenhado para ser executado em uma única tela contínua sem recarregamento:

```
[ ETAPA 1: ESCOLHA DA REFERÊNCIA ]
  ├── Seleção de Gênero (Masculino / Feminino)
  ├── 5 Cards Predefinidos com Roupas/Cenários Elegantes
  └── Opção de Upload Manual de Referência Personalizada (redimensionada para máx 1024px)
        │
        ▼
[ ETAPA 2: CAPTURA DAS FOTOS DO CLIENTE (1 a 5 Fotos) ]
  ├── Opção Principal (Recomendada): 📸 CÂMERA GUIADA AO VIVO
  │     ├── Reconhecimento 3D facial em tempo real via MediaPipe
  │     ├── 5 Poses: De frente, Leve Esquerda, Leve Direita, Sorrindo, Ângulo Livre
  │     ├── Feedback de Iluminação, Centralização e Distância
  │     ├── Indicadores sonoros (Web Audio API)
  │     └── Botão nativo da câmera de 12MP como fallback instantâneo
  └── Opção Secundária: 📤 UPLOAD MANUAL DA GALERIA (Drag & Drop de fotos JPG/PNG/WEBP)
  └── Checkbox obrigatório de autorização de uso de imagem
        │
        ▼
[ ETAPA 3: DIRETIVAS, PROMPT MESTRE E GERAÇÃO ]
  ├── Card de Verificação e Edição de Prompts (Padrão vs. Customizado)
  ├── Código de Acesso / Chave mantido estritamente em memória
  ├── Botão Principal de Ação "Gerar minha foto"
  ├── Polling com progresso em tempo real e tempo decorrido (timeout de 360s)
  └── Exibição do Resultado:
        ├── Foto final em alta definição (3:4, até 4K)
        ├── Botão de Zoom / Tela Cheia
        ├── Download em PNG
        ├── Botão "Gerar outra variação"
        ├── Painel recolhível com JSONs das 3 etapas de análise
        └── Botão de recuperação de tarefa em caso de lentidão da rede
```

---

## 4. O Subsistema de Visão Computacional (Guided Camera Modal)

Localizado em `/src/components/GuidedCameraModal.tsx`:

### Recursos Técnicos:
1. **Carregamento Assíncrono do MediaPipe:**
   - Carrega o `@mediapipe/tasks-vision` via CDN do Google (`wasm` otimizado).
   - Instancia o `FaceLandmarker` no modo `VIDEO`.
2. **Cálculo dos Ângulos da Cabeça em 3D:**
   - **Yaw (Giro horizontal):** Calculado pela distância relativa entre o nariz e as orelhas/têmporas (Landmarks 1, 33, 263).
   - **Pitch (Inclinação vertical):** Calculado pelo alinhamento entre o topo da testa e o queixo (Landmarks 10, 152).
   - **Roll (Inclinação lateral):** Calculado pelo ângulo da linha dos olhos (Landmarks 33, 263).
3. **Validações em Tempo Real (60 FPS):**
   - **Enquadramento:** O rosto deve ocupar entre 18% e 65% da altura do vídeo.
   - **Iluminação:** Análise de luminância média no canvas central da face.
   - **Expressão Facial:** Detecção de sorriso através da distância dos cantos da boca (Blendshapes ou landmarks 61 e 291).
4. **Passo a Passo Guiado (5 Poses):**
   - Pose 1: De frente (`yaw: -10° a +10°`)
   - Pose 2: Virar levemente para a Esquerda (`yaw: +18° a +40°`)
   - Pose 3: Virar levemente para a Direita (`yaw: -40° a -18°`)
   - Pose 4: Sorrindo de frente (`smile detectado`)
   - Pose 5: Ângulo natural livre
5. **Automação de Captura:**
   - Contagem regressiva de estabilização de 0.8s assim que o cliente atinge a pose ideal.
   - Confirmação tátil/sonora através de sintetizador Web Audio (`playSuccessBeep`).
   - Prioridade de substituição: fotos tiradas na câmera ao vivo substituem automaticamente uploads antigos da galeria para garantir máxima fidelidade.

---

## 5. O Motor de Prompts Mestre (Prompt Synthesis Engine)

Arquivos responsáveis:
- `/src/services/promptSynthesisService.ts`
- `/server.ts` (endpoint `POST /api/analyze-prompt`)
- `/src/components/PromptEditorModal.tsx`

### A Lógica do Dual-Scan & Cross-Match:

```
[ IMAGEM #1: REFERÊNCIA ] ────────┐
                                  │
                                  ▼
                    [ SCAN DA CENA & ESTILO ]
                    - Roupa & Figurino
                    - Pose & Ângulo da câmera
                    - Iluminação de estúdio
                    - Cenário & Profundidade de campo
                    - Lente (85mm f/1.4)
                    - REGRA: Descartar 100% da pessoa e barba da referência
                                  │
                                  ├────────► [ MOTOR DE MATCH ]
                                  │                │
[ IMAGENS #2+: CLIENTE ] ─────────┘                │
                                  │                │
                                  ▼                ▼
                    [ SCAN BIOMÉTRICO DO CLIENTE ]  [ PROMPT MESTRE DEFINITIVO ]
                    - Geometria do rosto & mandíbula     (4 Blocos Mandatórios)
                    - Formato dos olhos & sobrancelhas
                    - Nariz, boca e lábios
                    - Tom de pele com microporos
                    - Textura, cor e linha do cabelo
                    - Volume real da barba do cliente
                    - REGRA: Descartar roupas casuais
```

### Estrutura dos JSONs Intermediários:

#### 1. JSON da Cena de Referência (`ReferenceSceneAnalysis`)
```json
{
  "roupa": "Tailored premium suit jacket, crisp collared dress shirt, elegant business-executive styling",
  "pose": "Poised high-status executive posture, body angled at 45 degrees, shoulders aligned, confident head tilt toward camera",
  "iluminacao": "Cinematic studio lighting with soft key light, gentle ambient fill, subtle warm rim light on shoulders",
  "cenario": "Contemporary architectural interior with soft blurred depth-of-field, upscale modern textures",
  "angulo": "Eye-level portrait framing, medium close-up (bust to chest), centered composition",
  "lente_e_camera": "85mm f/1.4 portrait prime lens, creamy background bokeh, ultra-sharp ocular focus",
  "regra_barba": "DESCARTAR 100% da barba da referência. Nunca aplicar o volume de barba da referência ao cliente.",
  "regras_estritas": "IGNORAR 100% dos traços físicos da pessoa na foto de referência (rosto, barba, olhos, pele, cabelo). Usar apenas roupa, iluminação, cenário e pose."
}
```

#### 2. JSON de Identidade do Cliente (`ClientIdentityAnalysis`)
```json
{
  "rosto": "Preservar com precisão cirúrgica o formato do rosto do cliente, ossatura zigomática, linha do maxilar e contorno do queixo das fotos enviadas.",
  "olhos_e_sobrancelhas": "Formato, espaçamento, cor da íris e desenho das sobrancelhas exatamente idênticos aos das fotos reais do cliente.",
  "nariz_e_labios": "Proporção anatômica exata do nariz, formato dos lábios e expressão natural autêntica da pessoa.",
  "tom_e_textura_pele": "Tom natural de pele e sub-tom do cliente, com poros fotográficos reais, sem efeito de pele plástica ou filtro de IA.",
  "cabelo_cor_tamanho_textura": "Cor natural exata do cabelo, comprimento, densidade, linha frontal capilar e padrão de textura conforme as fotos da pessoa.",
  "barba_e_pelos_faciais": "Preservar com fidelidade absoluta de 100% o volume, corte e densidade de barba original do cliente visível em suas fotos reais. Se for barbeado, manter barbeado e liso; se tiver barba por fazer ou curta, manter exatamente esse mesmo comprimento rente ao rosto sem avolumar. Proibido copiar qualquer barba da imagem de referência.",
  "idade_e_caracteristicas_distintas": "Idade real aparente, linhas de expressão naturais e traços fisionômicos únicos do cliente.",
  "regras_estritas": "IGNORAR todas as roupas e fundos das fotos do cliente. Extrair e reproduzir exclusivamente sua identidade física, facial e volume real de barba."
}
```

### O Prompt Mestre Consolidado (Texto Enviado ao Nano Banana):

```text
[HIGH-PRIORITY IDENTITY AND SCENE DIRECTIVE FOR ULTRA-REALISTIC PORTRAITURE]

### MANDATORY COMPOSITION AND IDENTITY MATCH RULES:
1. STRICT ROLE OF IMAGE #1 (STYLE, LIGHTING & WARDROBE TEMPLATE ONLY):
   - Image #1 is EXCLUSIVELY a template for environment, wardrobe, camera gear, and body posture.
   - CRITICAL NEGATIVE DIRECTIVE: NEVER copy the face, head shape, facial features, hair, skin tone, ethnicity, or personal identity of the model in Image #1. Discard the model in Image #1 completely as if they were an invisible, featureless mannequin.
   - CRITICAL BEARD DIRECTIVE: COMPLETELY DISCARD any beard, mustache, stubble, or facial hair from Image #1. If the model in Image #1 has a full or thick beard, DO NOT TRANSFER IT TO THE OUTPUT.
   - SCENE ELEMENTS EXTRACTED FROM IMAGE #1:
     * OUTFIT & WARDROBE: {scene.roupa}
     * POSE & GESTURE: {scene.pose}
     * LIGHTING SETUP: {scene.iluminacao}
     * BACKGROUND & ENVIRONMENT: {scene.cenario}
     * CAMERA ANGLE & FRAMING: {scene.angulo}
     * LENS & OPTICS: {scene.lente_e_camera}

2. STRICT ROLE OF IMAGES #2+ (TRUE CLIENT IDENTITY - ABSOLUTE 100% FIDELITY):
   - CRITICAL OVERRIDE: All images after Image #1 represent the REAL CLIENT captured via camera / live photos.
   - THE CLIENT'S FACE AND BIOMETRIC IDENTITY ARE SACROSANCT: The person depicted in the final image must be UNMISTAKABLY AND 100% THE EXACT SAME INDIVIDUAL as shown in these client photographs (Image #2 onward).
   - DO NOT BLEND OR HYBRIDIZE: Do NOT morph or average the client's face with the reference model in Image #1. The final face must belong 100% to the client.
   - EXACT PHYSICAL TRAITS TO PRESERVE (DO NOT ALTER):
     * FACIAL GEOMETRY & CONTOURS: {client.rosto}
     * EYES & EYEBROWS: {client.olhos_e_sobrancelhas}
     * NOSE, LIPS & EXPRESSION: {client.nariz_e_labios}
     * REAL SKIN TONE & NATURAL PORE TEXTURE: {client.tom_e_textura_pele}
     * REAL HAIR (COLOR, LENGTH & NATURAL TEXTURE): {client.cabelo_cor_tamanho_textura}
     * NATURAL AGE, MATURITY & DISTINCTIVE TRAITS: {client.idade_e_caracteristicas_distintas}
   - CRITICAL NEGATIVE DIRECTIVE: IGNORE all clothing, t-shirts, casual wear, and backgrounds from the client photos. Seamlessly dress this exact person in the outfit from Image #1.

3. ABSOLUTE DIRECTIVE ON BEARD AND FACIAL HAIR VOLUME:
   - ZERO TOLERANCE FOR REFERENCE BEARD: Under NO circumstance should the generated person inherit the beard volume, density, length, or shape from Image #1.
   - PRESERVE EXCLUSIVELY THE CLIENT'S AUTHENTIC BEARD: {client.barba_e_pelos_faciais}.
   - If the client is clean-shaven in their camera photos, KEEP THEM 100% CLEAN-SHAVEN.
   - If the client has light stubble, KEEP LIGHT STUBBLE ONLY.
   - If the client has a short or trimmed beard, DO NOT make it bushy, thick, or full.
   - Match the exact volume, density, and grooming style visible in the client's camera photos.

4. FINAL EXECUTION DIRECTIVE:
   Create an ultra-photorealistic editorial portrait featuring 100% of the CLIENT's authentic facial identity, skin tone, hair, and exact beard volume from the camera photos, seamlessly wearing the outfit from Image #1 and positioned in the exact pose, lighting, and scene of Image #1.
   Sharp focus on the client's eyes, natural skin micro-texture without plastic AI smoothing, professional Hasselblad medium-format aesthetic, flawless anatomic coherence, single individual.
```

---

## 6. O Editor de Prompts Separados (Prompt Editor Modal)

Localizado em `/src/components/PromptEditorModal.tsx`:
- **Aba 1 (Cena & Referência):** Permite inspecionar e editar campos individuais de Roupa, Pose, Iluminação, Cenário, Ângulo, Lente, Regra de Barba da Referência e Regras Negativas.
- **Aba 2 (Identidade do Cliente):** Permite inspecionar e editar campos de Rosto, Olhos/Sobrancelhas, Nariz/Lábios, Tom e Textura de Pele (poros), Cabelo, Volume Real da Barba, Idade e Descarte de Roupas.
- **Aba 3 (Prompt Mestre Consolidado):** Exibe o texto completo compilado com contagem de caracteres e palavras, permitindo edição livre e direta.
- **Toggle "Usar Meus Prompts Customizados":** Quando marcado, o gerador ignora a análise automática e envia exatamente as palavras customizadas pelo operador.
- **Persistência Local:** Salva as customizações no `localStorage` sob as chaves `fotoflow_custom_scene`, `fotoflow_custom_client`, `fotoflow_custom_master_prompt` e `fotoflow_custom_prompt_active`.
- **Botão "Restaurar Padrão":** Reverte para os valores calibrados oficiais em 1 clique.

---

## 7. O Serviço de Geração (Nano Banana Service & Polling)

Localizado em `/src/services/nanoBananaService.ts`:

### Modelos Suportados:
- `nanobanana-2` (Padrão): Suporta até 14 imagens de entrada, fidelidade ultra-realista.
- `nanobanana-pro`: Suporta até 8 imagens de entrada.

### Resoluções Suportadas:
- `1K` (Padrão e recomendado para rapidez)
- `2K`
- `4K`
- Proporção fixa: `3:4` (retrato editorial).

### Tolerância e Timeout:
- O timeout de polling é configurado para **360 segundos (6 minutos)** com intervalo de consulta a cada **3.5 segundos**.
- Geração típica de 5 fotos de referência consome entre **120 e 190 segundos** de processamento em GPU.
- Atualização contínua de status na UI com contador de tempo decorrido: `⚡ Etapa 3/3: Processando ensaio na GPU (1m 45s)...`.
- **Recuperação de Tarefas:** Assim que o `taskId` é gerado, ele é gravado em `sessionStorage` (`fotoflow_last_task_id`). Se houver qualquer falha temporária de rede, o usuário conta com o botão **"Verificar resultado da última geração"** que recupera a imagem pronta do servidor sem gastar novos créditos.

---

## 8. Arquitetura de Endpoints do Servidor Express (`server.ts`)

| Método | Rota | Descrição | Parâmetros Principais |
|---|---|---|---|
| `POST` | `/api/analyze-prompt` | Faz o Dual-Scan inteligente via Gemini multimodal | `referenceImage`, `userImages: string[]`, `gender: 'male'\|'female'` |
| `POST` | `/api/generate` | Cria a tarefa de geração na API Nano Banana | `apiKey`, `prompt`, `images: string[]`, `aspectRatio: '3:4'`, `resolution`, `model` |
| `GET` | `/api/status` | Consulta o estado da tarefa em execução | Query param: `taskId`. Headers: `x-api-key` (fallback para env `NANO`) |

### Resposta de Sucesso do `/api/status`:
```json
{
  "code": 200,
  "msg": "success",
  "taskId": "a8962dc215aef693bae599b169e7350d",
  "state": "completed",
  "isFinished": true,
  "resultImageUrl": "https://tempfile.aiquickdraw.com/models/nano-banana-2/...png",
  "costTime": 189
}
```

---

## 9. Variáveis de Ambiente & Configuração (`.env.example`)

```ini
# Chave da API Nano Banana para geração de fotos em GPU
NANO="sua_chave_nanobanana_aqui"

# Chave Gemini para análise multimodal de biometria e roupas
GEMINI_API_KEY="sua_chave_gemini_aqui"

# (Opcional) Supabase para armazenamento de imagens
SUPABASE_URL=""
SUPABASE_KEY=""
SUPABASE_BUCKET="images"
```

---

## 10. Resumo de Diretrizes para o Agente Externo

Ao utilizar estas informações para automação ou suporte ao usuário:
1. **Regra de Ouro Facial:** A foto de referência (Imagem #1) é **apenas estilo e roupa**. Traços faciais, olhos, nariz e barba pertencem **100% às fotos do cliente (Imagens #2+)**.
2. **Regra de Ouro da Barba:** Se o cliente for barbeado, **mantenha barbeado**. Nunca copie a barba do modelo da referência.
3. **Fotos da Câmera:** Fotos capturadas ao vivo pela câmera têm resolução HD calibrada e orientação validada pelo MediaPipe, tendo precedência sobre uploads manuais.
4. **Resiliência a Timeout:** Tarefas no Nano Banana levam ~3 minutos. Sempre utilize o `taskId` para checar o status e recuperar a imagem concluída.
