import type { Country } from '@/lib/i18n';
import type { InternationalConfig } from './types';
const packs = (amounts: number[]) => amounts.map((amount, i) => ({ id: ['starter', 'pro', 'executive'][i] || 'starter', count: [3, 6, 10][i] || 3, cents: Math.round(amount * 100) }));
export const RECOVERY: Record<Country, string> = {
  BR: 'Oi, {nome}! Seu ensaio FotoFlow está pronto. Retome seu pagamento de {valor}: {link_checkout}',
  MX: '¡Hola, {nome}! Tu sesión FotoFlow está lista. Completa tu pago de {valor}: {link_checkout}',
  CO: '¡Hola, {nome}! Tu sesión FotoFlow está lista. Retoma tu pago de {valor}: {link_checkout}',
  US: 'Hi, {nome}! Your FotoFlow photos are ready. Complete your {valor} payment: {link_checkout}',
};
const config = (country: Country, amounts: number[], provider: string) => ({ domain: '', packages: packs(amounts), provider, publicKey: '', paymentReference: '', priceIds: '', message: RECOVERY[country], brlRate: country === 'BR' ? 1 : null });
export const DEFAULT_INTERNATIONAL: InternationalConfig = {
  BR: config('BR', [29.90, 49.90, 79.90], 'Mercado Pago'),
  MX: config('MX', [99, 179, 299], 'Stripe MX'),
  CO: config('CO', [25000, 45000, 75000], 'Wompi'),
  US: config('US', [9.90, 14.90, 24.90], 'Stripe US'),
};
