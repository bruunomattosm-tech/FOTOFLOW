# CHECKLIST FINAL DE EXPORTAÇÃO — FOTOFLOW

> Verifique cada item antes de gerar o arquivo ZIP ou exportar para o GitHub/Lovable.

---

## 1. INTEGRIDADE DO CÓDIGO E BUILD

- [x] **Compilação Vite:** `npm run build` executa e conclui com sucesso gerando a pasta `dist/`.
- [x] **Checagem de Tipos (TypeScript):** `npm run lint` (`tsc --noEmit`) passa com 0 erros.
- [x] **Zero Uso de `any` nos Contratos de Domínio:** `src/types/domain.ts` completamente tipado.
- [x] **Alias `@/` Operacional:** Configurado e validado em `tsconfig.json` e `vite.config.ts`.
- [x] **Stack Pura Lovable:** Sem resquícios de Next.js, dependências desnecessárias ou APIs proprietárias.

---

## 2. SEGURANÇA E AMBIENTE

- [x] **Segredos Fora do Bundle:** Nenhuma chave privada ou credencial sensível no código cliente.
- [x] **`.env.example` Completo:** Todas as variáveis documentadas com valores vazios e comentários.
- [x] **Edge Functions Isoladas:** `supabase/functions/` preparadas para consumo seguro de `Deno.env`.
- [x] **`config.toml` Configurado:** Webhooks com `verify_jwt = false` explicitados.

---

## 3. ARQUITETURA E CAMADA DE SERVIÇO

- [x] **Dois Adaptadores Funcionais:** `mock.ts` e `supabase.ts` implementam a interface `FotoFlowApiService`.
- [x] **Chave de Alternância:** `import.meta.env.VITE_DATA_MODE` seleciona o adaptador ativo (padrão `'mock'`).
- [x] **Sem `fetch` Direto em Componentes:** Chamadas padronizadas via camada de serviço.
- [x] **Modo Mock Operante:** O wizard funciona perfeitamente sem necessidade de chaves externas.

---

## 4. DESIGN SYSTEM E COMPONENTES

- [x] **`components.json` Presente:** Configuração nativa do shadcn/ui.
- [x] **Primitivos Instalados:** `button`, `card`, `badge`, `progress`, `dialog` em `src/components/ui/`.
- [x] **Tokens de Cor:** Violeta `#8B5CF6`, `#A855F7`, verde `#22C55E`, fundo `#0A0A0F`, cards `#14141C`, texto `#F5F5F7` e `#A1A1AA`.
- [x] **Responsividade:** Layout adaptável para celular e desktop.

---

## 5. DOCUMENTAÇÃO TÉCNICA

- [x] **`INVENTARIO.md`:** Árvore de arquivos, rotas, componentes, dependências e inventário de secrets.
- [x] **`README.md`:** Instruções claras de setup, execução e variáveis de ambiente.
- [x] **`ARQUITETURA.md`:** Diagrama Mermaid, mapa de rotas, entidades e cronograma em 12 etapas.
- [x] **`AGENTS.md`:** Regras para agentes Lovable, Jules e Cursor.
- [x] **`FOTOFLOW_COMPLETO.md`:** Especificação consolidada disponível para download direto na aplicação.

---

## 6. PENDÊNCIAS EXTERNAS (PARA PRODUÇÃO NO SUPABASE)

- [ ] Criar projeto no Supabase e colar as credenciais no `.env.local` (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).
- [ ] Rodar as migrações SQL `001_core.sql` e `002_storage.sql` no Editor SQL do Supabase.
- [ ] Configurar os segredos `WAVESPEED_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `PIX_WEBHOOK_SECRET` no painel do Supabase.
- [ ] Fazer deploy das Edge Functions via Supabase CLI (`supabase functions deploy`).
