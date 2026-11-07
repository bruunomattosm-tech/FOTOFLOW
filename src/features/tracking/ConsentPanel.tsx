import { useEffect, useRef, useState } from 'react';
import { needsAnswer, onConsentChange, readChoice } from '@/lib/consent';
import { recordChoices } from './consentEvidence';
import { useLocale } from '@/context/LocaleContext';
import { Action, Toggle } from '@/features/shared/Controls';
import '@/features/shared/prototype.css';
import '@/features/international/international.css';
export function ConsentPanel() {
  const { country } = useLocale(); const en = country === 'US', es = country === 'MX' || country === 'CO';
  const [open, setOpen] = useState(false); const [settings, setSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false); const [advertising, setAdvertising] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
  const text = (pt: string, sp: string, eng: string) => en ? eng : es ? sp : pt;
  useEffect(() => { const refresh = () => { void needsAnswer(['analytics', 'advertising']).then(setOpen); }; refresh(); return onConsentChange(refresh); }, []);
  useEffect(() => { if (open) panel.current?.focus(); }, [open]);
  const edit = () => { setAnalytics(readChoice('analytics') === 'granted'); setAdvertising(readChoice('advertising') === 'granted'); setSettings(true); setOpen(true); };
  const save = (a: boolean, b: boolean) => { recordChoices(a && !gpc ? 'granted' : 'denied', b && !gpc ? 'granted' : 'denied'); setOpen(false); setSettings(false); };
  return <div className="ff-theme"><Action className="ff-cookie-link" onClick={edit}>{text('Configurações de cookies', 'Configuración de cookies', 'Cookie settings')}</Action>{open && <div ref={panel} tabIndex={-1} role="region" aria-label={text('Privacidade', 'Privacidad', 'Privacy')} className="ff-consent"><h3>{text('Sua privacidade', 'Tu privacidad', 'Your privacy')}</h3><p>{text('Usamos cookies de análise para medir visitas e de publicidade para medir anúncios. Com sua autorização, compartilhamos contatos para correspondência publicitária.', 'Usamos cookies de análisis para medir visitas y de publicidad para medir anuncios. Con tu autorización, compartimos datos de contacto para correspondencia publicitaria.', 'We use analytics cookies to measure visits and advertising cookies to measure ads. With your permission, contact details are shared for advertising matching.')}</p><a href="/privacy">{text('Política de privacidade', 'Política de privacidad', 'Privacy policy')}</a>{settings && <><div className="crm-setting-row">{text('Necessários · sempre ativos', 'Necesarios · siempre activos', 'Necessary · always on')}</div><div className="crm-setting-row"><span>{text('Análise · Lovable e Google', 'Análisis · Lovable y Google', 'Analytics · Lovable and Google')}</span><Toggle disabled={gpc} checked={!gpc && analytics} label="Analytics" onChange={() => { if (!gpc) setAnalytics(!analytics); }} /></div><div className="crm-setting-row"><span>{text('Publicidade · Meta, TikTok e Google', 'Publicidad · Meta, TikTok y Google', 'Advertising · Meta, TikTok and Google')}</span><Toggle disabled={gpc} checked={!gpc && advertising} label="Advertising" onChange={() => { if (!gpc) setAdvertising(!advertising); }} /></div>{gpc && <p>{text('A recusa do navegador está sendo respeitada.', 'Respetamos la negativa de tu navegador.', 'Your browser privacy signal applies.')}</p>}</>}<div className="ff-row"><Action className="ff-small" onClick={() => save(true, true)}>{text('Aceitar todos', 'Aceptar todos', 'Accept all')}</Action><Action className="ff-small" onClick={() => save(false, false)}>{text('Rejeitar todos', 'Rechazar todos', 'Reject all')}</Action>{settings ? <Action className="ff-small" onClick={() => save(analytics, advertising)}>{text('Salvar preferências', 'Guardar preferencias', 'Save choices')}</Action> : <Action className="ff-small" onClick={edit}>{text('Configurações', 'Configuración', 'Settings')}</Action>}</div></div>}</div>;
}
