// O QUE FAZ: Webhook de confirmação de pagamento PIX (atualiza pedido para 'pago' e libera fotos do ensaio).
// ONDE EXECUTA: Runtime Deno no Supabase Edge Functions (`supabase functions deploy pix-webhook --no-verify-jwt`).
// O QUE FALTA CONFIGURAR: Cadastrar esta URL no painel do seu banco/gateway de PIX e definir o secret `PIX_WEBHOOK_SECRET`.

// NOTA CRÍTICA DE CONFIGURAÇÃO:
// Esta função precisa ser exposta publicamente sem checagem de token de usuário (verify_jwt = false no config.toml),
// pois é chamada diretamente pelos servidores do gateway bancário (Asaas, Mercado Pago, Woovi, etc.).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();

    // 1. Validação de assinatura ou token de segurança do webhook
    const webhookSecret = Deno.env.get('PIX_WEBHOOK_SECRET');
    const signature = req.headers.get('x-webhook-signature') || req.headers.get('x-signature');

    if (webhookSecret && signature && signature !== webhookSecret) {
      return new Response(JSON.stringify({ error: 'Assinatura de webhook inválida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Extrai identificador do pedido do payload recebido do gateway
    const pedidoId = body?.pedidoId || body?.id || body?.data?.id || body?.external_reference;
    const isPaid =
      body?.status === 'PAID' ||
      body?.status === 'pago' ||
      body?.event === 'PAYMENT_RECEIVED' ||
      body?.action === 'payment.updated';

    if (!pedidoId) {
      return new Response(JSON.stringify({ error: 'pedidoId não identificado no payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (isPaid) {
      // 3. Atualiza pedido para pago
      const { data: pedidoAtualizado, error: errPedido } = await supabase
        .from('pedidos')
        .update({
          status: 'pago',
          pago_em: new Date().toISOString(),
        })
        .eq('id', pedidoId)
        .select()
        .single();

      if (errPedido) {
        throw new Error(`Erro ao atualizar pedido: ${errPedido.message}`);
      }

      // 4. Libera ensaio vinculado ao lead do pedido
      if (pedidoAtualizado?.lead_id) {
        await supabase
          .from('ensaios')
          .update({ status: 'pronto' })
          .eq('lead_id', pedidoAtualizado.lead_id);

        await supabase
          .from('leads')
          .update({ status: 'pago', etapa_atual: 'pago' })
          .eq('id', pedidoAtualizado.lead_id);
      }
    }

    return new Response(JSON.stringify({ success: true, pedidoId }), {
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
