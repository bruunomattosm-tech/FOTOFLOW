export function GenerationStep({ percent, batch, status }: { percent: number; batch: boolean; status: string }) {
 return <div className="ff-generation"><h1>{batch ? 'Criando as imagens restantes' : 'Criando seu ensaio'}</h1><div className="ff-percent" aria-live="polite">{percent}%</div><progress className="ff-progress" max={100} value={percent} /><p className="ff-sub">{status}</p><div className="ff-notice warning">⚠ Não saia desta página. Seu ensaio está quase pronto.</div></div>;
}
