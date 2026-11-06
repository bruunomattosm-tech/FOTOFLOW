// O QUE FAZ: Envia eventos para a Meta Conversions API (CAPI) no servidor com deduplicação por event_id.
// ONDE EXECUTA: Runtime Deno no Supabase Edge Functions (`supabase functions deploy meta-capi`).
// O QUE FALTA CONFIGURAR: Cadastrar os segredos `META_CAPI_TOKEN` e `VITE_META_PIXEL_ID` no Supabase.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const metaToken = Deno.env.get('META_CAPI_TOKEN');
    const pixelId = Deno.env.get('VITE_META_PIXEL_ID');

    if (!metaToken || !pixelId) {
      throw new Error('META_CAPI_TOKEN ou VITE_META_PIXEL_ID ausente nos segredos.');
    }

    const {
      eventName = 'Lead',
      eventId, // ID gerado no frontend para deduplicação com o Pixel do navegador
      eventSourceUrl,
      userData = {},
      customData = {},
    } = await req.json();

    if (!eventId) {
      throw new Error('O eventId é obrigatório para garantir deduplicação entre Pixel e CAPI.');
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: currentTimestamp,
          event_id: eventId, // Chave única de deduplicação
          event_source_url: eventSourceUrl || 'https://fotoflow.app',
          action_source: 'website',
          user_data: {
            client_user_agent: req.headers.get('user-agent') || '',
            ...userData,
          },
          custom_data: customData,
        },
      ],
    };

    const endpoint = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${metaToken}`;

    const metaRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const metaResult = await metaRes.json();

    if (!metaRes.ok) {
      throw new Error(metaResult?.error?.message || 'Erro ao enviar evento para Meta CAPI');
    }

    return new Response(JSON.stringify({ success: true, metaResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
