import {
  Lead,
  Estilo,
  Referencia,
  Ensaio,
  Pacote,
  Pedido,
  StatusLead,
} from '@/types/domain';
import { MOCK_ESTILOS, MOCK_REFERENCIAS, MOCK_PACOTES } from '@/data/mockData';
import { FotoFlowApiService, GenerateEnsaioParams } from './types';

const STORAGE_KEY_LEAD = 'fotoflow_mock_lead';
const STORAGE_KEY_ENSAIO = 'fotoflow_mock_ensaio';
const STORAGE_KEY_PEDIDOS = 'fotoflow_mock_pedidos';

export class MockApiService implements FotoFlowApiService {
  async getEstilos(): Promise<Estilo[]> {
    return MOCK_ESTILOS;
  }

  async getReferencias(estiloId?: string, genero?: 'male' | 'female'): Promise<Referencia[]> {
    return MOCK_REFERENCIAS.filter((ref) => {
      if (estiloId && ref.estiloId !== estiloId) return false;
      if (genero && ref.genero !== genero) return false;
      return true;
    });
  }

  async getPacotes(): Promise<Pacote[]> {
    return MOCK_PACOTES;
  }

  async createLead(data: Partial<Lead>): Promise<Lead> {
    const lead: Lead = {
      id: `lead_${Date.now()}`,
      nome: data.nome || 'Cliente FotoFlow',
      email: data.email,
      telefone: data.telefone,
      genero: data.genero || 'male',
      estiloId: data.estiloId || 'estilo-corp',
      etapaAtual: 'landing',
      status: 'landing',
      utm: data.utm || {},
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY_LEAD, JSON.stringify(lead));
    } catch {
      // safe
    }
    return lead;
  }

  async updateLeadStatus(leadId: string, status: StatusLead): Promise<Lead> {
    let lead: Lead = {
      id: leadId,
      etapaAtual: status,
      status,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LEAD);
      if (saved) {
        lead = { ...JSON.parse(saved), status, etapaAtual: status, atualizadoEm: new Date().toISOString() };
      }
      localStorage.setItem(STORAGE_KEY_LEAD, JSON.stringify(lead));
    } catch {
      // safe
    }
    return lead;
  }

  async gerarEnsaio(params: GenerateEnsaioParams): Promise<Ensaio> {
    const steps = [
      { msg: 'Mapeando geometria facial e proporção áurea...', pct: 20 },
      { msg: 'Calibrando iluminação cinematográfica e profundidade...', pct: 45 },
      { msg: 'Aplicando retoque executivo suave e microporos...', pct: 75 },
      { msg: 'Finalizando renderização ultra-realista 4K...', pct: 95 },
    ];

    for (const step of steps) {
      if (params.onProgress) params.onProgress(step.msg, step.pct);
      await new Promise((r) => setTimeout(r, 700));
    }

    // Se o usuário forneceu uma foto de referência ou foto de usuário, usamos como mock visual
    const mockPreviewUrl =
      params.referenceImage ||
      params.userImages[0] ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=80';

    const ensaio: Ensaio = {
      id: `ensaio_${Date.now()}`,
      leadId: params.leadId,
      estiloId: params.estiloId,
      referenciaId: params.referenciaId,
      status: 'pronto',
      urlPreview: mockPreviewUrl,
      urlFinal: mockPreviewUrl,
      promptUsado: params.customPrompt || 'Ultra-realistic Hasselblad 85mm f/1.4 commercial editorial portrait',
      criadoEm: new Date().toISOString(),
      expiraEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY_ENSAIO, JSON.stringify(ensaio));
    } catch {
      // safe
    }

    if (params.onProgress) params.onProgress('Ensaio concluído com sucesso!', 100);
    return ensaio;
  }

  async criarPedido(leadId: string, pacoteId: string): Promise<Pedido> {
    const pedido: Pedido = {
      id: `ped_${Date.now()}`,
      leadId,
      pacoteId,
      status: 'pendente',
      provedor: 'pix_mock',
      pixCopiaECola: '00020126580014br.gov.bcb.pix0136mock-fotoflow-pix-key5204000053039865802BR5925FOTOFLOW SERVICOS DIGITA6009SAO PAULO62070503***6304E2CA',
      criadoEm: new Date().toISOString(),
      pagoEm: null,
    };

    try {
      const existingStr = localStorage.getItem(STORAGE_KEY_PEDIDOS);
      const list = existingStr ? JSON.parse(existingStr) : [];
      list.push(pedido);
      localStorage.setItem(STORAGE_KEY_PEDIDOS, JSON.stringify(list));
    } catch {
      // safe
    }

    return pedido;
  }

  async consultarPedido(pedidoId: string): Promise<Pedido> {
    try {
      const existingStr = localStorage.getItem(STORAGE_KEY_PEDIDOS);
      if (existingStr) {
        const list: Pedido[] = JSON.parse(existingStr);
        const found = list.find((p) => p.id === pedidoId);
        if (found) return found;
      }
    } catch {
      // safe
    }

    return {
      id: pedidoId,
      leadId: 'lead_default',
      pacoteId: 'pacote-starter',
      status: 'pago',
      provedor: 'pix_mock',
      criadoEm: new Date().toISOString(),
      pagoEm: new Date().toISOString(),
    };
  }
}

export const mockApiService = new MockApiService();
