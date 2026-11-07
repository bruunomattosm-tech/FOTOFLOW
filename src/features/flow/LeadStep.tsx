export interface LeadForm {
  name: string;
  phone: string;
  email: string;
}
export const validLead = (lead: LeadForm) =>
  lead.name.trim().length > 0 &&
  lead.phone.replace(/\D/g, "").length >= 10 &&
  /^\S+@\S+\.\S+$/.test(lead.email);
export function LeadStep({
  lead,
  onChange,
  error,
}: {
  lead: LeadForm;
  onChange: (lead: LeadForm) => void;
  error: string;
}) {
  return (
    <>
      <h1>Quase lá!</h1>
      <p className="ff-sub">
        Informe seus dados para receber o ensaio e acessar depois, sem senha.
      </p>
      {(["name", "phone", "email"] as const).map((field) => (
        <label className="ff-label" key={field}>
          {{ name: "Nome", phone: "Telefone (WhatsApp)", email: "E-mail" }[field]}
          <input
            className="ff-input"
            type={field === "phone" ? "tel" : field === "email" ? "email" : "text"}
            autoComplete={field === "phone" ? "tel" : field}
            value={lead[field]}
            onChange={(e) => onChange({ ...lead, [field]: e.target.value })}
            placeholder={
              { name: "Seu nome", phone: "(11) 98765-4321", email: "voce@email.com" }[field]
            }
          />
        </label>
      ))}
      <p className="ff-sub ff-fine">
        Suas selfies são apagadas em 24h se você não liberar o ensaio.
      </p>
      {error && (
        <p className="ff-danger" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
