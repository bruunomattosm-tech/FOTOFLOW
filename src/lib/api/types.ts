import {
  Lead,
  Estilo,
  Referencia,
  Ensaio,
  Pacote,
  Pedido,
  StatusLead,
} from '@/types/domain';

export interface GenerateEnsaioParams {
  leadId: string;
  estiloId: string;
  referenciaId: string;
  referenceImage: string;
  userImages: string[];
  renderingTechnique?: 'organic_fusion' | 'client_first' | 'prompt_only';
  customPrompt?: string;
  gender?: 'male' | 'female';
  resolution?: '1K' | '2K' | '4K';
  model?: string;
  onProgress?: (message: string, percent?: number) => void;
}

export interface FotoFlowApiService {
  getEstilos(): Promise<Estilo[]>;
  getReferencias(estiloId?: string, genero?: 'male' | 'female'): Promise<Referencia[]>;
  getPacotes(): Promise<Pacote[]>;
  createLead(data: Partial<Lead>): Promise<Lead>;
  updateLeadStatus(leadId: string, status: StatusLead): Promise<Lead>;
  gerarEnsaio(params: GenerateEnsaioParams): Promise<Ensaio>;
  criarPedido(leadId: string, pacoteId: string): Promise<Pedido>;
  consultarPedido(pedidoId: string): Promise<Pedido>;
}
