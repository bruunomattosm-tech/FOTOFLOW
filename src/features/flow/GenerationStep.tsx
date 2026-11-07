import { useLocale } from '@/context/LocaleContext';
export function GenerationStep({
  percent,
  batch,
  status,
}: {
  percent: number;
  batch: boolean;
  status: string;
}) {
 const { t } = useLocale();
  return (
    <div className="ff-generation">
      <h1>{batch ? t("Criando as imagens restantes") : t("Criando seu ensaio")}</h1>
      <div className="ff-percent" aria-live="polite">
        {percent}%
      </div>
      <progress className="ff-progress" max={100} value={percent} />
      <p className="ff-sub">{t(status)}</p>
      <div className="ff-notice warning">
        {t("⚠ Não saia desta página. Seu ensaio está quase pronto.")}
      </div>
    </div>
  );
}
