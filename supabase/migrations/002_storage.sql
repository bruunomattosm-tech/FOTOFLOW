-- O QUE FAZ: Cria os buckets de Storage do Supabase (referencias = público, ensaios = privado com URLs assinadas).
-- ONDE EXECUTA: Editor SQL do Supabase após aplicar 001_core.sql.
-- O QUE FALTA CONFIGURAR: Criar tokens de expiração para as URLs assinadas de download na sua aplicação.

-- 1. BUCKET PÚBLICO: REFERÊNCIAS DE CENÁRIOS E CATÁLOGO
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'referencias',
  'referencias',
  TRUE,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- POLÍTICA: Acesso público para visualização das referências
CREATE POLICY "Acesso público leitura referencias"
ON storage.objects FOR SELECT
USING (bucket_id = 'referencias');

-- 2. BUCKET PRIVADO: ENSAIOS FOTOGRÁFICOS GERADOS COM WATERMARK E ALTA RESOLUÇÃO
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ensaios',
  'ensaios',
  FALSE,
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- POLÍTICA: Acesso apenas via Edge Functions com Service Role ou URL assinada
CREATE POLICY "Leitura autenticada ou assinada de ensaios"
ON storage.objects FOR SELECT
USING (bucket_id = 'ensaios' AND auth.role() = 'service_role');

CREATE POLICY "Escrita de ensaios apenas via backend"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ensaios' AND auth.role() = 'service_role');
