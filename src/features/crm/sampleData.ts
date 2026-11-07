import type { CrmLead, CrmOrder } from '../shared/types';
const createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
export const SAMPLE_LEADS: CrmLead[] = [
 { id:'demo-1',name:'Camila Ribeiro',gender:'female',city:'São Paulo',phone:'(11) 98765-4321',email:'camila.ribeiro@gmail.com',style:'corp',stage:'Abriu checkout',tone:'warning',progress:85,activity:'parada há 42 min',when:'hoje, 14:08',createdAt,photos:[],note:'' },
 { id:'demo-2',name:'Juliana Prado',gender:'female',city:'Curitiba',phone:'(41) 99812-3344',email:'ju.prado@hotmail.com',style:'pet',stage:'Pagou · 6 fotos',tone:'success',progress:100,activity:'concluído',when:'hoje, 13:52',createdAt,photos:[],note:'' },
 { id:'demo-3',name:'Marcos Lima',gender:'male',city:'Belo Horizonte',phone:'(31) 98877-1020',email:'marcos.lima@empresa.com.br',style:'corp',stage:'Enviou fotos',tone:'violet',progress:55,activity:'gerando agora',when:'hoje, 13:40',createdAt,photos:[],note:'' },
 { id:'demo-4',name:'Patrícia Souza',gender:'female',city:'Recife',phone:'(81) 99654-7788',email:'patisouza@gmail.com',style:'aniv',stage:'Abandonou no checkout',tone:'danger',progress:85,activity:'sem ação há 1 dia',when:'ontem, 21:15',createdAt,photos:[],note:'' },
 { id:'demo-5',name:'Rafael Ferreira',gender:'male',city:'Porto Alegre',phone:'(51) 99123-4567',email:'rafa.ferreira@outlook.com',style:'life',stage:'Escolheu estilo',tone:'muted',progress:35,activity:'parado há 2 h',when:'hoje, 12:01',createdAt,photos:[],note:'' },
 { id:'demo-6',name:'Bianca Torres',gender:'female',city:'Salvador',phone:'(71) 98123-9090',email:'bi.torres@gmail.com',style:'life',stage:'Pagou · 3 fotos',tone:'success',progress:100,activity:'concluído',when:'hoje, 11:20',createdAt,photos:[],note:'' },
 { id:'demo-7',name:'Diego Alves',gender:'male',city:'Goiânia',phone:'(62) 99345-1122',email:'diego.alves@gmail.com',style:'pet',stage:'Abriu checkout',tone:'warning',progress:85,activity:'parado há 1 h',when:'hoje, 11:02',createdAt,photos:[],note:'' },
];
export const SAMPLE_ORDERS: CrmOrder[] = [
 {id:'#4821',name:'Camila Ribeiro',count:6,cents:4990,status:'Pendente',when:'hoje, 14:08'},
 {id:'#4820',name:'Juliana Prado',count:6,cents:4990,status:'Pago',when:'hoje, 13:52'},
 {id:'#4819',name:'Bianca Torres',count:3,cents:2990,status:'Pago',when:'hoje, 11:20'},
 {id:'#4818',name:'Diego Alves',count:10,cents:7990,status:'Pendente',when:'hoje, 11:02'},
 {id:'#4817',name:'Patrícia Souza',count:6,cents:4990,status:'Expirado',when:'ontem, 21:15'},
 {id:'#4816',name:'Lucas Moreira',count:10,cents:7990,status:'Pago',when:'ontem, 18:40'},
];
export const FUNNEL = [['Iniciou quiz',1284],['Escolheu gênero',1102],['Escolheu estilo',986],['Enviou fotos',640],['Gerou ensaio',598],['Abriu checkout',294],['Pagou',182]] as const;
