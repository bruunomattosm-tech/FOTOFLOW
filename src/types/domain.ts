export type StatusLead =
  | 'landing'
  | 'quiz_genero'
  | 'quiz_estilo'
  | 'referencias'
  | 'captura'
  | 'gerando'
  | 'preview_bloqueado'
  | 'checkout'
  | 'pago'
  | 'lote_gerando'
  | 'concluido'
  | 'abandonou';

export type StatusEnsaio = 'fila' | 'gerando' | 'pronto' | 'erro' | 'expirado';

export interface Lead {
  id: string;
  nome?: string;
  telefone?: string;
  email?: string;
  genero?: 'male' | 'female';
  estiloId?: string;
  etapaAtual: StatusLead;
  status: StatusLead;
  utm?: Record<string, string>;
  criadoEm: string;
  atualizadoEm: string;
  abandonadoEm?: string | null;
}

export interface Estilo {
  id: string;
  slug: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  ordem: number;
}

export interface Referencia {
  id: string;
  estiloId: string;
  titulo: string;
  urlImagem: string;
  genero: 'male' | 'female';
  ativo: boolean;
  ordem: number;
}

export interface Ensaio {
  id: string;
  leadId: string;
  estiloId: string;
  referenciaId: string;
  status: StatusEnsaio;
  urlPreview?: string | null;
  urlFinal?: string | null;
  promptUsado?: string;
  criadoEm: string;
  expiraEm?: string | null;
}

export interface Pacote {
  id: string;
  slug: string;
  quantidadeFotos: number;
  precoCentavos: number;
  ativo: boolean;
}

export interface Pedido {
  id: string;
  leadId: string;
  pacoteId: string;
  status: 'pendente' | 'pago' | 'cancelado' | 'estornado';
  provedor: string;
  pixCopiaECola?: string;
  pagoEm?: string | null;
  criadoEm: string;
}

export interface EventoTracking {
  id: string;
  leadId: string;
  evento: string;
  payload?: Record<string, unknown>;
  criadoEm: string;
}
