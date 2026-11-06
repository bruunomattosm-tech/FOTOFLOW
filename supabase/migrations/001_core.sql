-- O QUE FAZ: Cria a estrutura relacional core (leads, estilos, referências, ensaios, pacotes, pedidos e eventos).
-- ONDE EXECUTA: Editor SQL do Supabase ou CLI via `supabase db push`.
-- O QUE FALTA CONFIGURAR: Ajustar políticas RLS para regras de auth do seu app se usar login obrigatório.

-- Habilita extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE LEADS
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT,
  telefone TEXT,
  email TEXT,
  genero TEXT CHECK (genero IN ('male', 'female')),
  estilo_id TEXT,
  etapa_atual TEXT NOT NULL DEFAULT 'landing',
  status TEXT NOT NULL DEFAULT 'landing',
  utm JSONB DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  abandonado_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_criado_em ON public.leads(criado_em);

-- 2. TABELA DE ESTILOS
CREATE TABLE IF NOT EXISTS public.estilos (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ordem INTEGER NOT NULL DEFAULT 0
);

-- 3. TABELA DE REFERÊNCIAS
CREATE TABLE IF NOT EXISTS public.referencias (
  id TEXT PRIMARY KEY,
  estilo_id TEXT REFERENCES public.estilos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  url_imagem TEXT NOT NULL,
  genero TEXT CHECK (genero IN ('male', 'female')),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ordem INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_referencias_estilo ON public.referencias(estilo_id, genero);

-- 4. TABELA DE ENSAIOS
CREATE TABLE IF NOT EXISTS public.ensaios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  estilo_id TEXT,
  referencia_id TEXT,
  status TEXT NOT NULL DEFAULT 'fila' CHECK (status IN ('fila', 'gerando', 'pronto', 'erro', 'expirado')),
  url_preview TEXT,
  url_final TEXT,
  prompt_usado TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ensaios_lead ON public.ensaios(lead_id);
CREATE INDEX IF NOT EXISTS idx_ensaios_status ON public.ensaios(status);

-- 5. TABELA DE PACOTES
CREATE TABLE IF NOT EXISTS public.pacotes (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  quantidade_fotos INTEGER NOT NULL,
  preco_centavos INTEGER NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 6. TABELA DE PEDIDOS
CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE RESTRICT,
  pacote_id TEXT REFERENCES public.pacotes(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'estornado')),
  provedor TEXT NOT NULL DEFAULT 'pix',
  pix_copia_e_cola TEXT,
  pago_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_lead ON public.pedidos(lead_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos(status);

-- 7. TABELA DE EVENTOS DE TRACKING
CREATE TABLE IF NOT EXISTS public.eventos_tracking (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  evento TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventos_lead ON public.eventos_tracking(lead_id);
CREATE INDEX IF NOT EXISTS idx_eventos_evento ON public.eventos_tracking(evento);

-- HABILITAÇÃO DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estilos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ensaios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_tracking ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PÚBLICAS BÁSICAS DE LEITURA
CREATE POLICY "Leitura pública de estilos ativos" ON public.estilos FOR SELECT USING (ativo = TRUE);
CREATE POLICY "Leitura pública de referências ativas" ON public.referencias FOR SELECT USING (ativo = TRUE);
CREATE POLICY "Leitura pública de pacotes ativos" ON public.pacotes FOR SELECT USING (ativo = TRUE);
CREATE POLICY "Inserção pública de leads" ON public.leads FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Atualização do próprio lead" ON public.leads FOR UPDATE USING (TRUE);
CREATE POLICY "Inserção de tracking" ON public.eventos_tracking FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Leitura e criação de ensaios anônimos" ON public.ensaios FOR ALL USING (TRUE);
CREATE POLICY "Leitura e criação de pedidos anônimos" ON public.pedidos FOR ALL USING (TRUE);
