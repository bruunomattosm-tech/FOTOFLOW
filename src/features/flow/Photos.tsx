import { Download, Lock } from 'lucide-react';
import { Action } from '../shared/Controls';
export async function downloadPhoto(url: string, index: number) {
 const image = new Image(); image.crossOrigin = 'anonymous';
 await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Não foi possível baixar a foto.')); image.src = url; });
 const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
 const context = canvas.getContext('2d'); if (!context) throw new Error('Download indisponível.'); context.drawImage(image, 0, 0);
 const link = document.createElement('a'); link.href = canvas.toDataURL('image/jpeg', .92); link.download = `fotoflow-${index + 1}.jpg`; link.click();
}
export function Photo({ url, locked = false }: { url: string; locked?: boolean }) {
 return <div className="ff-photo"><img src={url} alt="Foto do ensaio" />{locked && <><div className="ff-watermark">{Array.from({ length:30 }, (_, i) => <span key={i}>FOTOFLOW</span>)}</div><span className="ff-lock"><Lock size={13} />Bloqueada para download</span></>}</div>;
}
export function DownloadButton({ url, index, onError }: { url: string; index: number; onError: (error: string) => void }) {
 return <Action className="ff-small ff-download" onClick={() => { void downloadPhoto(url, index).catch((e: unknown) => onError(e instanceof Error ? e.message : 'Download indisponível.')); }}><Download size={16} />Baixar foto{index > 0 ? ` ${index + 1}` : ''}</Action>;
}
