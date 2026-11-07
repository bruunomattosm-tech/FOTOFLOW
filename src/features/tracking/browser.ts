import type { TrackingConfig } from './types';
import { canTrack, onConsentChange } from '@/lib/consent';
type Pixel = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[][]; push?: Pixel; loaded?: boolean; version?: string };
declare global { interface Window { fbq?: Pixel; _fbq?: Pixel; dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; } }
const initialized = new Set<string>();
function script(src: string, id: string) { if (document.getElementById(id)) return; const node = document.createElement('script'); node.id = id; node.async = true; node.src = src; document.head.append(node); }
export async function sendBrowser(config: TrackingConfig, name: string, payload: Record<string, unknown>, eventID: string): Promise<'Enfileirado' | 'Não configurado' | 'Bloqueado' | 'Erro'> {
  if (!await canTrack('advertising')) return 'Bloqueado';
  let queued = false;
  if (/^\d+$/.test(config.metaPixel)) {
    if (!window.fbq) {
      const pixel: Pixel = Object.assign((...args: unknown[]) => { if (pixel.callMethod) pixel.callMethod.apply(pixel, args); else pixel.queue.push(args); }, { queue: [] as unknown[][], loaded: true, version: '2.0' });
      pixel.push = pixel; window.fbq = pixel; window._fbq = pixel;
    }
    if (!initialized.has(config.metaPixel)) { window.fbq('init', config.metaPixel, {}, { agent: 'lovable' }); initialized.add(config.metaPixel); script('https://connect.facebook.net/en_US/fbevents.js', 'fotoflow-meta-pixel'); }
    window.fbq('consent', 'grant');
    window.fbq(['PageView', 'ViewContent', 'Lead', 'InitiateCheckout', 'Purchase'].includes(name) ? 'track' : 'trackCustom', name, payload, { eventID }); queued = true;
  }
  if (/^G-[A-Z0-9]+$/.test(config.ga4) || /^AW-\d+$/.test(config.googleAdsId)) {
    window.dataLayer ||= []; window.gtag ||= (...args: unknown[]) => { window.dataLayer?.push(args); };
    const tag = config.ga4 || config.googleAdsId;
    if (!initialized.has(tag)) { script(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tag)}`, 'fotoflow-google-tag'); window.gtag('js', new Date()); if (config.ga4) window.gtag('config', config.ga4, { send_page_view: false }); if (config.googleAdsId) window.gtag('config', config.googleAdsId); initialized.add(tag); }
    const names: Record<string, string> = { PageView: 'page_view', ViewContent: 'view_item', Lead: 'generate_lead', InitiateCheckout: 'begin_checkout', Purchase: 'purchase' };
    window.gtag('event', names[name] || name, { ...payload, event_id: eventID });
    if (name === 'Purchase' && config.googleAdsId && config.googleAdsLabel) window.gtag('event', 'conversion', { ...payload, send_to: `${config.googleAdsId}/${config.googleAdsLabel}` }); queued = true;
  }
  // GTM is an alternative to direct tags; never install alongside direct provider configuration.
  if (/^GTM-[A-Z0-9]+$/.test(config.gtm) && !config.metaPixel && !config.ga4 && !config.googleAdsId && !config.tiktokPixel) {
    window.dataLayer ||= []; if (!initialized.has(config.gtm)) { window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' }); script(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(config.gtm)}`, 'fotoflow-gtm'); initialized.add(config.gtm); }
    window.dataLayer.push({ event: name, ...payload, event_id: eventID }); queued = true;
  }
  return queued ? 'Enfileirado' : 'Não configurado';
}
if (typeof window !== 'undefined') onConsentChange(() => { void canTrack('advertising').then(allowed => { window.fbq?.('consent', allowed ? 'grant' : 'revoke'); }); });
