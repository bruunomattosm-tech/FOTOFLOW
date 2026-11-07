import { useState } from 'react';
import { Copy, LoaderCircle } from 'lucide-react';
import { Action } from '../shared/Controls';
import { formatMoney } from '../shared/catalog';
import type { FlowPackage } from '../shared/types';
export function PixStep({ pack, code }: { pack: FlowPackage; code: string }) {
 const [copied, setCopied] = useState(false); const [error, setError] = useState('');
 return <><h1>Pague com PIX</h1><p className="ff-sub">Pacote de {pack.count} fotos · {formatMoney(pack.cents)}</p><div className="ff-pix"><b>PIX copia e cola</b><div className="ff-pix-code">{code}</div><Action className="ff-small ff-wide" onClick={() => { void navigator.clipboard.writeText(code).then(() => setCopied(true)).catch(() => setError('Selecione e copie o código acima.')); }}><Copy size={16} />{copied ? 'Código copiado ✓' : 'Copiar código'}</Action>{error && <p role="alert">{error}</p>}</div><div className="ff-notice violet"><LoaderCircle className="ff-spin" size={17} />Aguardando pagamento. Liberamos assim que o PIX for confirmado.</div><p className="ff-sub ff-fine">PIX de demonstração · não faça uma transferência real.</p></>;
}
