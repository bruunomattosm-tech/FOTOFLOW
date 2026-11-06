import {
  Lead,
  Estilo,
  Referencia,
  Ensaio,
  Pacote,
  Pedido,
  StatusLead,
} from '@/types/domain';
import { FotoFlowApiService, GenerateEnsaioParams } from './types';
import { MOCK_ESTILOS, MOCK_REFERENCIAS, MOCK_PACOTES } from '@/data/mockData';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export class SupabaseApiService implements FotoFlowApiService {
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    };
  }

  async getEstilos(): Promise<Estilo[]> {
    if (!SUPABASE_URL) return MOCK_ESTILOS;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/estilos?ativo=eq.true&order=ordem.asc`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return MOCK_ESTILOS;
      const data = await res.json();
      return data && data.length ? data : MOCK_ESTILOS;
    } catch {
      return MOCK_ESTILOS;
    }
  }

  async getReferencias(estiloId?: string, genero?: 'male' | 'female'): Promise<Referencia[]> {
    if (!SUPABASE_URL) {
      return MOCK_REFERENCIAS.filter((r) => (!estiloId || r.estiloId === estiloId) && (!genero || r.genero === genero));
    }
    try {
      let query = `${SUPABASE_URL}/rest/v1/referencias?ativo=eq.true&order=ordem.asc`;
      if (estiloId) query += `&estilo_id=eq.${estiloId}`;
      if (genero) query += `&genero=eq.${genero}`;
      const res = await fetch(query, { headers: this.getHeaders() });
      if (!res.ok) return MOCK_REFERENCIAS;
      const data = await res.json();
      return data && data.length ? data : MOCK_REFERENCIAS;
    } catch {
      return MOCK_REFERENCIAS;
    }
  }

  async getPacotes(): Promise<Pacote[]> {
    if (!SUPABASE_URL) return MOCK_PACOTES;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/pacotes?ativo=eq.true&order=preco_centavos.asc`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return MOCK_PACOTES;
      const data = await res.json();
      return data && data.length ? data : MOCK_PACOTES;
    } catch {
      return MOCK_PACOTES;
    }
  }

  async createLead(data: Partial<Lead>): Promise<Lead> {
    const leadPayload = {
      nome: data.nome || 'Cliente FotoFlow',
      email: data.email,
      telefone: data.telefone,
      genero: data.genero || 'male',
      estilo_id: data.estiloId,
      etapa_atual: data.etapaAtual || 'landing',
      status: 'landing',
      utm: data.utm || {},
    };

    if (!SUPABASE_URL) {
      return {
        id: `lead_${Date.now()}`,
        ...data,
        etapaAtual: 'landing',
        status: 'landing',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: 'POST',
        headers: { ...this.getHeaders(), Prefer: 'return=representation' },
        body: JSON.stringify(leadPayload),
      });
      if (res.ok) {
        const rows = await res.json();
        return rows[0];
      }
    } catch {
      // fallback
    }

    return {
      id: `lead_${Date.now()}`,
      ...data,
      etapaAtual: 'landing',
      status: 'landing',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
  }

  async updateLeadStatus(leadId: string, status: StatusLead): Promise<Lead> {
    if (SUPABASE_URL) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${leadId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ etapa_atual: status, status, atualizado_em: new Date().toISOString() }),
        });
      } catch {
        // safe
      }
    }
    return {
      id: leadId,
      etapaAtual: status,
      status,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
  }

  async gerarEnsaio(params: GenerateEnsaioParams): Promise<Ensaio> {
    if (params.onProgress) params.onProgress('Enviando dados para o servidor seguro...', 10);

    const endpoint = `${SUPABASE_URL}/functions/v1/gerar-ensaio`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          leadId: params.leadId,
          estiloId: params.estiloId,
          referenciaId: params.referenciaId,
          referenceImage: params.referenceImage,
          userImages: params.userImages,
          gender: params.gender || 'male',
          renderingTechnique: params.renderingTechnique || 'organic_fusion',
          prompt: params.customPrompt,
          resolution: params.resolution || '1K',
          model: params.model || 'nano-banana-2.1',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro na Edge Function HTTP ${res.status}`);
      }

      const data = await res.json();
      if (params.onProgress) params.onProgress('Ensaio finalizado com sucesso!', 100);

      return {
        id: data.id || `ensaio_${Date.now()}`,
        leadId: params.leadId,
        estiloId: params.estiloId,
        referenciaId: params.referenciaId,
        status: 'pronto',
        urlPreview: data.urlPreview || data.urlFinal,
        urlFinal: data.urlFinal,
        promptUsado: params.customPrompt,
        criadoEm: new Date().toISOString(),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na geração';
      throw new Error(`Falha no motor Supabase: ${message}`);
    }
  }

  async criarPedido(leadId: string, pacoteId: string): Promise<Pedido> {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/pix-webhook`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ action: 'create_order', leadId, pacoteId }),
    }).catch(() => null);

    if (res && res.ok) {
      return await res.json();
    }

    return {
      id: `ped_${Date.now()}`,
      leadId,
      pacoteId,
      status: 'pendente',
      provedor: 'pix',
      pixCopiaECola: '00020126580014br.gov.bcb.pix0136pix@fotoflow.app5204000053039865802BR5925FOTOFLOW DIGITAL6009SAO PAULO62070503***6304ABCD',
      criadoEm: new Date().toISOString(),
    };
  }

  async consultarPedido(pedidoId: string): Promise<Pedido> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/pedidos?id=eq.${pedidoId}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows[0]) return rows[0];
      }
    } catch {
      // safe
    }

    return {
      id: pedidoId,
      leadId: 'lead_default',
      pacoteId: 'pacote-starter',
      status: 'pendente',
      provedor: 'pix',
      criadoEm: new Date().toISOString(),
    };
  }
}

export const supabaseApiService = new SupabaseApiService();
