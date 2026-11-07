import { describe, expect, it } from 'vitest';
import { COUNTRIES, detectCountry, internationalPhone, LOCALES } from '@/lib/i18n';
import { DEFAULT_INTERNATIONAL } from '@/features/international/defaults';
import { summarizeOrders } from '@/features/international/reports';
import { translate } from '@/features/international/messages';
import { generateEventId } from '@/lib/track';
import { canTrack, readChoice, saveChoices } from '@/lib/consent';
import { hashLead } from '@/features/tracking/attribution';
import type { CrmOrder } from '@/features/shared/types';
describe('Operação internacional', () => {
  it.each([['BR','br','pt-BR','BRL','55'],['MX','mx','es-MX','MXN','52'],['CO','co','es-CO','COP','57'],['US','us','en-US','USD','1']] as const)('detecta e identifica %s', (c, sub, lang, currency, ddi) => {
    expect(detectCountry(`${sub}.fotoflow.com`, '')).toBe(c);
    expect(detectCountry('localhost', `?country=${c}`)).toBe(c);
    expect(detectCountry('localhost', `?lang=${lang}`)).toBe(c);
    expect(LOCALES[c].currency).toBe(currency); expect(LOCALES[c].ddi).toBe(ddi);
  });
  it('aceita en e usa BR como fallback', () => { expect(detectCountry('en.fotoflow.com','')).toBe('US'); expect(detectCountry('localhost','?country=ZZ')).toBe('BR'); });
  it.each([['MX',[9900,17900,29900]],['CO',[2500000,4500000,7500000]],['US',[990,1490,2490]]] as const)('mantém preços locais de %s', (country, cents) => { expect(DEFAULT_INTERNATIONAL[country].packages.map(p => p.cents)).toEqual(cents); expect(DEFAULT_INTERNATIONAL[country].packages.map(p => p.count)).toEqual([3,6,10]); });
  it('preserva DDI sem duplicar prefixo', () => { expect(internationalPhone('2025550123','US')).toBe('12025550123'); expect(internationalPhone('+52 55 1234 5678','MX')).toBe('525512345678'); expect(internationalPhone('3001234567','CO')).toBe('573001234567'); expect(internationalPhone('11987654321','BR')).toBe('5511987654321'); });
  it('não soma moedas sem taxa explícita', () => {
    const orders: CrmOrder[] = [{ id:'br', name:'A', count:3, cents:2990, country:'BR',status:'Pago',when:'agora' }, {id:'us',name:'B',count:3,cents:990,country:'US',status:'Pago',when:'agora'}];
    expect(summarizeOrders(orders,'US',DEFAULT_INTERNATIONAL).revenue).toBe(990);
    expect(summarizeOrders(orders,'all',DEFAULT_INTERNATIONAL).missing).toEqual(['US']);
    const config = structuredClone(DEFAULT_INTERNATIONAL); config.US.brlRate = 5;
    expect(summarizeOrders(orders,'all',config).revenue).toBe(7940);
  });
  it('traduz sem modificar português', () => { expect(translate('Escolha seu pacote','US')).toBe('Choose your package'); expect(translate('Escolha seu pacote','MX')).toBe('Elige tu paquete'); expect(translate('Escolha seu pacote','BR')).toBe('Escolha seu pacote'); });
  it('usa UUIDs distintos', () => { const id = generateEventId(); expect(id).toMatch(/^[a-f0-9-]{36}$/); expect(generateEventId()).not.toBe(id); });
  it('requer aceite publicitário explícito para matching', async () => { localStorage.clear(); saveChoices({ analytics:'granted', advertising:'denied' }); expect(readChoice('advertising')).toBe('denied'); expect(await canTrack('advertising')).toBe(false); expect(await hashLead({email:'a@example.com',phone:'2025550123',name:'Ana'},'US')).toEqual({}); });
  it('usa meios locais sem trocar moedas', () => { expect(LOCALES.MX.methods).toEqual(['SPEI','OXXO','Tarjeta']); expect(LOCALES.CO.methods).toEqual(['PSE','Nequi']); expect(LOCALES.US.methods).toEqual(['Credit Card','Apple Pay','CashApp']); expect(COUNTRIES).toEqual(['BR','MX','CO','US']); });
});
