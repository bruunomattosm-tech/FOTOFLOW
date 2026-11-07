import { useLocale } from '@/context/LocaleContext';
import type { ButtonProps } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft } from "lucide-react";
import type { FlowReference } from "./types";
export function Action({ className = "", ...props }: ButtonProps) {
  return <Button variant="ghost" className={`ff-action ${className}`} {...props} />;
}
export function Back({ onClick }: { onClick: () => void }) {
 const { t } = useLocale();
  return (
    <Action className="ff-back" onClick={onClick}>
      <ArrowLeft size={15} /> {t("Voltar")}
    </Action>
  );
}
export function ReferenceGrid({
  refs,
  selected,
  onSelect,
}: {
  refs: FlowReference[];
  selected: string[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="ff-reference-grid">
      {refs.map((ref) => (
        <Action
          key={ref.id}
          aria-label={ref.code}
          aria-pressed={selected.includes(ref.id)}
          className={`ff-tile ${selected.includes(ref.id) ? "selected" : ""}`}
          onClick={() => onSelect(ref.id)}
        >
          <img src={ref.image} alt={`${ref.code} · referência de ensaio`} />
          <span className="ff-ref-code">{ref.code}</span>
          {selected.includes(ref.id) && (
            <span className="ff-check">
              <Check size={15} />
            </span>
          )}
        </Action>
      ))}
    </div>
  );
}
export function Toggle({
  checked,
  onChange,
  label, disabled = false,
}: {
  disabled?: boolean;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <Action
      disabled={disabled}
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={onChange}
      className={`ff-toggle ${checked ? "on" : ""}`}
    >
      <span />
    </Action>
  );
}
