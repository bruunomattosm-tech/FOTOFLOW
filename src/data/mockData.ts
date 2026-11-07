import { Estilo, Referencia, Pacote } from '@/types/domain';

export const MOCK_ESTILOS: Estilo[] = [
  {
    id: 'estilo-corp',
    slug: 'corporate',
    nome: 'Corporativo & Executivo',
    descricao: 'Retratos sóbrios e de liderança para LinkedIn, Forbes e perfil corporativo.',
    ativo: true,
    ordem: 1,
  },
  {
    id: 'estilo-life',
    slug: 'lifestyle',
    nome: 'Lifestyle Casual Chic',
    descricao: 'Elegância natural, café parisiense e atmosfera sofisticada de fim de tarde.',
    ativo: true,
    ordem: 2,
  },
  {
    id: 'estilo-niver',
    slug: 'birthday',
    nome: 'Aniversário & Celebração',
    descricao: 'Estúdio escuro acolhedor, bolo dourado nas mãos e vela cintilante acesa.',
    ativo: true,
    ordem: 3,
  },
  {
    id: 'estilo-pet',
    slug: 'pet',
    nome: 'Ensaio com Pet',
    descricao: 'Conexão afetiva e cumplicidade elegante com seu animal de estimação.',
    ativo: true,
    ordem: 4,
  },
];

export const MOCK_REFERENCIAS: Referencia[] = [
  {
    id: 'ref-m-corp-1',
    estiloId: 'estilo-corp',
    titulo: 'Executivo Tech Moderno',
    urlImagem: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    genero: 'male',
    ativo: true,
    ordem: 1,
  },
  {
    id: 'ref-f-corp-1',
    estiloId: 'estilo-corp',
    titulo: 'Liderança Forbes Feminina',
    urlImagem: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    genero: 'female',
    ativo: true,
    ordem: 2,
  },
  {
    id: 'ref-m-life-1',
    estiloId: 'estilo-life',
    titulo: 'Casual Chic Alpha',
    urlImagem: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
    genero: 'male',
    ativo: true,
    ordem: 3,
  },
  {
    id: 'ref-f-life-1',
    estiloId: 'estilo-life',
    titulo: 'Elegância Parisiense',
    urlImagem: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    genero: 'female',
    ativo: true,
    ordem: 4,
  },
  {
    id: 'ref-f-niver-1',
    estiloId: 'estilo-niver',
    titulo: 'Celebração Vela Sparkler',
    urlImagem: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
    genero: 'female',
    ativo: true,
    ordem: 5,
  },
  {
    id: 'ref-m-niver-1',
    estiloId: 'estilo-niver',
    titulo: 'Brinde & Conquista',
    urlImagem: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&auto=format&fit=crop&q=80',
    genero: 'male',
    ativo: true,
    ordem: 6,
  },
];

export const MOCK_PACOTES: Pacote[] = [
  {
    id: 'pacote-starter',
    slug: 'starter',
    quantidadeFotos: 3,
    precoCentavos: 2990,
    ativo: true,
  },
  {
    id: 'pacote-pro',
    slug: 'pro',
    quantidadeFotos: 6,
    precoCentavos: 4990,
    ativo: true,
  },
  {
    id: 'pacote-executive',
    slug: 'executive',
    quantidadeFotos: 10,
    precoCentavos: 7990,
    ativo: true,
  },
];
