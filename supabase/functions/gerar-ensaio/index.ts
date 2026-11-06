// O QUE FAZ: Edge Function para orquestrar a geração com a API WaveSpeed (Google Nano Banana 2.1 e GPT 2.5).
// ONDE EXECUTA: Runtime Deno no Supabase Edge Functions (`supabase functions deploy gerar-ensaio`).
// O QUE FALTA CONFIGURAR: Definir os segredos `WAVESPEED_API_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no painel do Supabase.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const waveKey = Deno.env.get('WAVESPEED_API_KEY');
    if (!waveKey) {
      throw new Error('Chave WAVESPEED_API_KEY não configurada nos segredos do Supabase.');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      leadId,
      estiloId,
      referenciaId,
      referenceImage,
      userImages = [],
      prompt,
      model = 'nano-banana-2.1',
      resolution = '1k',
      aspectRatio = '3:4',
    } = body;

    if (!leadId) {
      throw new Error('O parâmetro leadId é obrigatório.');
    }

    // 1. Cria registro do ensaio no banco de dados com status 'fila'
    const { data: ensaioRecord, error: insertError } = await supabase
      .from('ensaios')
      .insert({
        lead_id: leadId,
        estilo_id: estiloId,
        referencia_id: referenciaId,
        status: 'gerando',
        prompt_usado: prompt || 'Editorial Portrait',
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Erro ao registrar ensaio: ${insertError.message}`);
    }

    // 2. Monta payload para a WaveSpeed
    const isNanoBanana = model.includes('nano-banana');
    const endpoint = isNanoBanana
      ? 'https://api.wavespeed.ai/api/v3/google/nano-banana-2.1/edit'
      : `https://api.wavespeed.ai/api/v3/openai/${model}/edit`;

    const allImages = [referenceImage, ...userImages].filter(Boolean);
    const resLower = (resolution || '1k').toString().toLowerCase();

    const waveSpeedBody: Record<string, unknown> = {
      prompt: prompt || 'Ultra-realistic editorial portrait Hasselblad 85mm f/1.4',
      images: allImages,
      resolution: resLower,
      aspect_ratio: aspectRatio,
      output_format: 'png',
    };

    if (!isNanoBanana) {
      waveSpeedBody.quality = resLower === '4k' ? 'max' : resLower === '2k' ? 'high' : 'medium';
    }

    // 3. Dispara requisição para a WaveSpeed AI
    const wsRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${waveKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(waveSpeedBody),
    });

    const wsData = await wsRes.json();
    if (!wsRes.ok || wsData?.code >= 400) {
      const errMsg = wsData?.message || wsData?.msg || 'Erro na API WaveSpeed AI';
      await supabase.from('ensaios').update({ status: 'erro' }).eq('id', ensaioRecord.id);
      throw new Error(errMsg);
    }

    const taskId = wsData?.data?.id || wsData?.id || wsData?.request_id;
    if (!taskId) {
      throw new Error('A WaveSpeed não retornou taskId de predição.');
    }

    // 4. Polling da predição na WaveSpeed
    const pollEndpoint = `https://api.wavespeed.ai/api/v3/predictions/${encodeURIComponent(taskId)}/result`;
    let finalImageUrl = '';
    const startTime = Date.now();
    const MAX_WAIT_MS = 120000; // 2 minutos

    while (Date.now() - startTime < MAX_WAIT_MS) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(pollEndpoint, {
        headers: { Authorization: `Bearer ${waveKey}` },
      });
      const pollData = await pollRes.json();
      const rec = pollData?.data || pollData;
      const status = (rec?.status || pollData?.status || '').toString().toLowerCase();

      if (status === 'completed' || status === 'succeeded' || status === 'success') {
        finalImageUrl = rec?.outputs?.[0] || rec?.output || rec?.result || rec?.image_url;
        break;
      }

      if (status === 'failed' || status === 'error') {
        throw new Error(rec?.error || 'A GPU falhou ao gerar o ensaio.');
      }
    }

    if (!finalImageUrl) {
      throw new Error('Tempo limite esgotado aguardando renderização.');
    }

    // 5. Atualiza registro com sucesso
    await supabase
      .from('ensaios')
      .update({
        status: 'pronto',
        url_preview: finalImageUrl,
        url_final: finalImageUrl,
      })
      .eq('id', ensaioRecord.id);

    return new Response(
      JSON.stringify({
        id: ensaioRecord.id,
        status: 'pronto',
        urlPreview: finalImageUrl,
        urlFinal: finalImageUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
