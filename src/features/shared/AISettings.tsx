import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { HomePage } from '@/pages/HomePage';
import { Action } from './Controls';
export function AISettings({ compact = false }: { compact?: boolean }) {
 const [open, setOpen] = useState(false);
 return <><Action className={compact ? 'ff-icon-button' : 'ff-small'} title="Configurações de IA" aria-label="Configurações de IA" onClick={() => setOpen(true)}><Settings size={17} />{!compact && 'WaveSpeed · Modelos e resolução'}</Action>
 {open && <div className="ff-ai-overlay" role="dialog" aria-modal="true" aria-label="Configurações de IA existentes"><div className="ff-ai-top"><b>Configurações de IA · FotoFlow Studio</b><Action className="ff-icon-button" aria-label="Fechar configurações de IA" onClick={() => setOpen(false)}><X size={20} /></Action></div><div className="ff-ai-content"><HomePage /></div></div>}</>;
}
