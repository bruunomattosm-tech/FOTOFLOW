# INVENTÁRIO TÉCNICO COMPLETO — FOTOFLOW

> Documento gerado na Etapa A para fins de auditoria, normalização e exportação para o Lovable.

---

## 1. ÁRVORE COMPLETA DE ARQUIVOS ATUAL

```
fotoflow/
├── .env.example
├── bun.lock
├── components.json
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── server.ts
├── FOTOFLOW_COMPLETO.md
├── INVENTARIO.md
├── README.md
├── ARQUITETURA.md
├── AGENTS.md
├── EXPORT_CHECKLIST.md
├── public/
│   ├── FOTOFLOW_COMPLETO.md
│   └── assets/
│       └── aistudio/
│           ├── image_43610175.png
│           ├── image_7ab70e2f.png
│           ├── image_7c340c12.png
│           ├── image_a2714acf.png
│           └── image_e8693c89.png
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/
│   │   ├── GuidedCameraModal.tsx
│   │   ├── PromptEditorModal.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── progress.tsx
│   ├── data/
│   │   └── mockData.ts
│   ├── features/
│   │   └── landing/
│   │       └── HeroSection.tsx
│   ├── lib/
│   │   ├── track.ts
│   │   ├── utils.ts
│   │   └── api/
│   │       ├── index.ts
│   │       ├── mock.ts
│   │       ├── supabase.ts
│   │       └── types.ts
│   ├── pages/
│   │   └── HomePage.tsx
│   ├── services/
│   │   ├── nanoBananaService.ts
│   │   └── promptSynthesisService.ts
│   ├── types/
│   │   └── domain.ts
│   └── utils/
│       └── imageUtils.ts
└── supabase/
    ├── config.toml
    ├── functions/
    │   ├── gerar-ensaio/
    │   │   └── index.ts
    │   ├── meta-capi/
    │   │   └── index.ts
    │   └── pix-webhook/
    │       └── index.ts
    └── migrations/
        ├── 001_core.sql
        └── 002_storage.sql
```

---

## 2. ROTAS E O QUE CADA UMA RENDERIZA

### Frontend (SPA React / Vite)
- `/` (Rota única): Renderiza `HomePage.tsx` contendo o funil gamificado em 5 passos (Etapa 1: Seleção de Referência; Etapa 2: Câmera & Upload 5 fotos; Etapa 3: Retoque e Geração; Etapa 4: Progresso com micro-etapas; Etapa 5: Preview, Watermark e Paywall).
- Outras rotas frontend: Não existe (aplicação SPA baseada em etapas de estado `status`).

### Backend (Express Proxy em `server.ts`)
- `GET /tmp-images/:filename`: Serve temporariamente imagens em memória (Buffer) para envio ao provedor com expiração de 15 minutos.
- `GET /download` (ou `/api/download`, `/download/fotoflow.md`): Dispara download com `Content-Disposition: attachment` do arquivo mestre `FOTOFLOW_COMPLETO.md`.
- `POST /api/analyze-prompt`: Rota interna de backend que utiliza o Gemini AI para analisar e sintetizar o prompt final anti-colagem.
- `POST /api/generate`: Proxy seguro que autentica com a API WaveSpeed AI (`/google/nano-banana-2.1/edit` ou `/openai/{model}/edit`) sem expor a chave no cliente.
- `GET /api/status`: Consulta de status e resultado da previsão na WaveSpeed (`/predictions/{id}/result`).

---

## 3. COMPONENTES E RESPONSABILIDADES (UMA LINHA CADA)

- `src/App.tsx`: Ponto de montagem raiz que renderiza a página inicial (`HomePage`).
- `src/pages/HomePage.tsx`: Orquestrador de fluxo do FotoFlow contendo estado do wizard, upload, polling e visualização de resultados.
- `src/components/layout/Navbar.tsx`: Barra superior com logo, tag de status, atalho de prompts mestre e botão de download do projeto.
- `src/components/layout/Footer.tsx`: Rodapé com direitos, selo anti-pele plástica e garantias de privacidade.
- `src/features/landing/HeroSection.tsx`: Cabeçalho promocional com proposta de valor executiva e selos de qualidade.
- `src/components/GuidedCameraModal.tsx`: Modal com feed de câmera e MediaPipe Face Landmarker para guiar o cliente em 5 poses sequenciais.
- `src/components/PromptEditorModal.tsx`: Modal para visualização e edição técnica granular das seções do prompt mestre.
- `src/components/ui/button.tsx`: Primitivo de botão shadcn com variantes e estados de foco/hover.
- `src/components/ui/card.tsx`: Primitivo de container shadcn com borda e superfície Dark Luxury `#14141C`.
- `src/components/ui/badge.tsx`: Primitivo de tag visual com variantes semânticas (amber, emerald, default, outline).
- `src/components/ui/progress.tsx`: Primitivo de barra de progresso com transição contínua e suporte a acessibilidade.
- `src/components/ui/dialog.tsx`: Primitivo de modal acessível com backdrop blur e botão de fechamento.

---

## 4. FUNÇÕES DE GERAÇÃO DE IMAGEM

### 1. `generatePhotoWithNanoBanana` (em `src/services/nanoBananaService.ts`)
- **Entrada:** `GenerateNanoBananaRequest`
  - `referenceImage`: Data URI base64 da imagem de referência.
  - `userImages`: Array de 1 a 5 Data URIs base64 do cliente.
  - `accessCode`: Chave ou código de acesso.
  - `model`: `'nano-banana-2.1' | 'nanobanana-2.1' | 'gpt-image-2.5-flare' | 'gpt-image-2.5-sunburst'`
  - `provider`: `'wavespeed' | 'nanobanana'`
  - `resolution`: `'1K' | '2K' | '4K'`
  - `prompt`: String com as diretrizes do prompt mestre.
  - `renderingTechnique`: `'organic_fusion' | 'client_first' | 'prompt_only'`
  - `onProgress`: Callback para atualização da mensagem de loading.
  - `onTaskIdCreated`: Callback emitido quando o ID de previsão é retornado.
- **Saída:** `Promise<string>` (URL da imagem gerada pela GPU).
- **Endpoint Chamado:**
  - Criação da Tarefa: `POST /api/generate` (local) -> repassa para `https://api.wavespeed.ai/api/v3/google/nano-banana-2.1/edit` ou `https://api.wavespeed.ai/api/v3/openai/{model}/edit`.
  - Polling de Conclusão: `GET /api/status?taskId={id}&provider=wavespeed` -> repassa para `https://api.wavespeed.ai/api/v3/predictions/{id}/result`.

### 2. `synthesizeMasterPrompt` (em `src/services/promptSynthesisService.ts`)
- **Entrada:** `{ referenceImage: string; userImages: string[]; gender: 'male' | 'female'; renderingTechnique: RenderingTechnique }`
- **Saída:** `Promise<PromptSynthesisResult>` contendo os JSONs técnicos de cena, identidade do cliente e os prompts mestres concatenados.
- **Endpoint Chamado:** `POST /api/analyze-prompt`.

### 3. `apiService.gerarEnsaio` (em `src/lib/api/`)
- **Entrada:** `GenerateEnsaioParams` (`leadId`, `estiloId`, `referenciaId`, `referenceImage`, `userImages`, `customPrompt`, `resolution`, `model`, `onProgress`)
- **Saída:** `Promise<Ensaio>` (`id`, `leadId`, `status: 'pronto'`, `urlPreview`, `urlFinal`)
- **Endpoint Chamado:**
  - No modo mock (`mock.ts`): Nenhum (executa 100% em memória com simulação realista e offline).
  - No modo real (`supabase.ts`): `POST {VITE_SUPABASE_URL}/functions/v1/gerar-ensaio`.

---

## 5. DEPENDÊNCIAS DO `package.json`

### Runtime Dependencies:
- `@google/genai`: `^2.4.0`
- `@mediapipe/tasks-vision`: `^1.0.1`
- `@tailwindcss/vite`: `^4.3.3`
- `@vitejs/plugin-react`: `^6.1.1`
- `class-variance-authority`: `^0.7.1`
- `clsx`: `^2.1.1`
- `dotenv`: `^17.2.3`
- `express`: `^4.21.2`
- `lucide-react`: `^0.546.0`
- `motion`: `^12.23.24`
- `react`: `^19.0.1`
- `react-dom`: `^19.0.1`
- `tailwind-merge`: `^3.5.0`
- `vite`: `^8.3.0`

### DevDependencies:
- `@types/express`: `^4.17.21`
- `@types/node`: `^22.14.0`
- `@types/react`: `^19.3.0`
- `@types/react-dom`: `^19.3.0`
- `autoprefixer`: `^10.4.21`
- `esbuild`: `^0.25.0`
- `tailwindcss`: `^4.3.3`
- `tsx`: `^4.21.0`
- `typescript`: `^7.0.2`

### O que foi adicionado ou normalizado:
- `clsx`, `tailwind-merge`, `class-variance-authority`: Adicionados para viabilizar os primitivos shadcn/ui nativamente compatíveis com Lovable.

---

## 6. ITENS QUE LEEM OU GRAVAM NO `localStorage`

1. `fotoflow_provider`: Provedor ativo de IA (`'wavespeed'`).
2. `fotoflow_wavespeed_key`: Chave temporária inserida manualmente pelo usuário no modal de configurações.
3. `fotoflow_access_code`: Código legado de acesso.
4. `fotoflow_model`: Modelo selecionado (`'nano-banana-2.1'`, `'gpt-image-2.5-flare'`, `'gpt-image-2.5-sunburst'`).
5. `fotoflow_resolution`: Resolução selecionada (`'1K'`, `'2K'`, `'4K'`).
6. `fotoflow_rendering_technique`: Técnica (`'organic_fusion'`, `'client_first'`, `'prompt_only'`).
7. `fotoflow_executive_retouch`: Flag booleana do retoque executivo suave.
8. `fotoflow_mock_lead`: Armazenamento de sessão de lead no adaptador mock.
9. `fotoflow_mock_ensaio`: Armazenamento do ensaio gerado no adaptador mock.
10. `fotoflow_mock_pedidos`: Histórico de pedidos no adaptador mock.

---

## 7. CHAMADAS A APIS EXTERNAS DIRETO DO NAVEGADOR

1. `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm`: Carregamento do binário WASM do MediaPipe para tracking 3D de rosto na câmera.
2. `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`: Download do modelo leve de Face Landmarker do Google.
3. `https://images.unsplash.com/...`: Imagens de catálogo e referências visuais para o modo mock.
4. Qualquer outra API externa: Não existe direto do navegador. Todas as chamadas para a WaveSpeed ou Gemini passam pelo backend proxy ou pelas Edge Functions do Supabase.

---

## 8. REGISTRO DE SEGREDOS RETIRADOS DO BUNDLE

- **Ponto 1 (`src/services/nanoBananaService.ts`):** Havia uma chave anon hardcoded (`sb_publishable_cDAb3V68cxErvwkMBVUCbg_Q9aXZdc7`) e a URL do Supabase. Foram substituídas por `import.meta.env.VITE_SUPABASE_URL` e `import.meta.env.VITE_SUPABASE_ANON_KEY`.
- **Ponto 2 (`server.ts`):** A chave `WAVESPEED_KEY` é estritamente consumida no servidor seguro (`process.env.WAVESPEED_KEY`) e nunca enviada no corpo da resposta do cliente.
- **Ponto 3 (`supabase/functions/`):** Todas as Edge Functions leem segredos via `Deno.env.get('WAVESPEED_API_KEY')`, mantendo 100% dos segredos fora do bundle do cliente.
