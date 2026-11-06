# DIRETRIZES PARA AGENTES DE IA (LOVABLE, JULES, CURSOR, CLAUDE)

Este documento contém as regras inegociáveis para qualquer agente de código que atuar na manutenção ou evolução do repositório **FotoFlow**.

---

## 1. STACK E TECNOLOGIAS FIXAS

- **Framework:** Vite + React 19 + TypeScript.
- **Estilização:** Tailwind CSS v4 com variáveis semânticas Dark Luxury.
- **Componentes:** Primitivos shadcn/ui em `src/components/ui/` configurados em `components.json`.
- **Backend de Produção:** Supabase (PostgreSQL, Storage e Edge Functions em Deno).
- **Modo Padrão no Lovable:** Sempre preserve a compatibilidade com `VITE_DATA_MODE=mock`.

---

## 2. PROIBIÇÕES CRÍTICAS

1. **PROIBIDO USO DE `any`:** Todos os contratos de dados devem estar tipados em `src/types/domain.ts` ou nos respectivos arquivos de interface.
2. **PROIBIDO SEGREDOS NO CLIENTE:** Nunca insira chaves privadas de API (`WAVESPEED_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PIX_PROVIDER_KEY`) no código do frontend ou em chamadas diretas do navegador.
3. **PROIBIDO ALTERAÇÕES DE COPY OU DESIGN SEM PEDIDO:** Não mude os textos de retoque executivo, a paleta de cores ou a promessa de "zero pele plástica".
4. **PROIBIDO CHAMADAS `fetch` DIRETAS DENTRO DE TELAS:** Toda comunicação com a API ou mock deve obrigatoriamente passar por `src/lib/api/` via `apiService`.
5. **NÃO REINVENTE A LÓGICA DE PROMPTS:** Os prompts mestres foram hipercalibrados para evitar colagem e manter microporos reais; mantenha as diretrizes de fusão orgânica e preservação de barba/olhos.

---

## 3. ONDE ENCONTRAR E MODIFICAR CADA COISA

- **Tipos de Domínio:** `src/types/domain.ts`.
- **Dados Estáticos de Moldes e Estilos:** `src/data/mockData.ts`.
- **Camada de Serviço (Mock vs Supabase):** `src/lib/api/`.
- **Rastreamento e Eventos:** `src/lib/track.ts`.
- **Utilitários de UI:** `src/lib/utils.ts`.
- **Página Principal do Funil:** `src/pages/HomePage.tsx`.
- **Câmera Guiada com MediaPipe:** `src/components/GuidedCameraModal.tsx`.
- **Migrações e Esquemas SQL:** `supabase/migrations/`.
- **Edge Functions:** `supabase/functions/`.

---

## 4. COMO VERIFICAR ALTERAÇÕES

Antes de concluir qualquer tarefa de código, execute obrigatoriamente:

```bash
# Validação de tipos e lint
npm run lint

# Verificação de build de produção
npm run build
```

Ambos os comandos devem passar com zero erros (`exit code 0`).
