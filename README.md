# FotoFlow — Studio de Retratos Executivos com IA

O **FotoFlow** é uma aplicação completa para geração de ensaios fotográficos de alta fidelidade com padrão editorial (Forbes, LinkedIn Executivo, GQ, Vogue) a partir de fotos tiradas no celular, preservando a anatomia facial, microporos reais e eliminando o aspecto de "cabeça colada" (head-swap) e suavização plástica.

---

## 🛠️ Stack Tecnológica

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, MediaPipe Face Landmarker.
- **Componentes & UI:** Primitivos shadcn/ui (`button`, `card`, `badge`, `progress`, `dialog`) em `components.json`.
- **Serviços & Adapters:** Arquitetura desacoplada com modo duplo (`mock` e `supabase`) via `VITE_DATA_MODE`.
- **Backend / Edge:** Supabase PostgreSQL + Edge Functions (Deno) ou Express Server Node.js.
- **Motor de IA:** WaveSpeed AI (Google Nano Banana 2.1 & OpenAI GPT Image 2.5 Flare/Sunburst).

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js 20+ ou Bun instalado.

### 1. Instalação das Dependências
```bash
npm install
```

### 2. Configuração de Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env.local
```

### 3. Rodar em Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

### 4. Build de Produção
```bash
npm run build
npm run preview
```

### 5. Lint e Tipagem
```bash
npm run lint
```

---

## 🔄 Modos de Operação (`VITE_DATA_MODE`)

A camada de serviço (`src/lib/api/`) possui dois adaptadores intercambiáveis sem que seja necessário tocar no código visual:

1. **Modo Mock (`VITE_DATA_MODE=mock`):**
   - Roda 100% no navegador e memória local.
   - Não depende de nenhuma chave ou chamada de rede externa.
   - Ideal para testes visuais imediatos, prototipagem no Lovable e demonstrações.

2. **Modo Real / Supabase (`VITE_DATA_MODE=supabase`):**
   - Realiza chamadas para as Edge Functions do Supabase (`gerar-ensaio`, `pix-webhook`, `meta-capi`).
   - Persiste leads, sessões e pedidos nas tabelas do PostgreSQL.

---

## 📁 Estrutura de Pastas

```
fotoflow/
├── .env.example              # Template de variáveis de ambiente
├── components.json           # Configuração padrão do shadcn/ui
├── INVENTARIO.md             # Inventário e auditoria técnica
├── ARQUITETURA.md            # Diagramas e fluxo do funil
├── AGENTS.md                 # Regras para agentes de IA (Lovable, Cursor, Jules)
├── EXPORT_CHECKLIST.md       # Checklist pré-exportação
├── supabase/
│   ├── config.toml           # Configurações de Edge Functions e JWT
│   ├── functions/            # Edge Functions Deno (gerar-ensaio, pix-webhook, meta-capi)
│   └── migrations/           # SQL de banco de dados e Storage
└── src/
    ├── components/
    │   ├── layout/           # Navbar e Footer
    │   └── ui/               # Primitivos shadcn
    ├── data/                 # Listas estáticas de estilos e moldes
    ├── features/             # Módulos de landing, wizard e resultados
    ├── lib/
    │   ├── api/              # Camada com adaptadores mock e supabase
    │   ├── track.ts          # Tracking e deduplicação de eventos
    │   └── utils.ts          # Utilitário cn (clsx + tailwind-merge)
    ├── pages/                # Páginas da aplicação (HomePage)
    ├── services/             # Síntese de prompts e serviços WaveSpeed
    ├── types/                # Contratos de domínio TypeScript
    └── utils/                # Redimensionamento e manipulação de imagem
```
