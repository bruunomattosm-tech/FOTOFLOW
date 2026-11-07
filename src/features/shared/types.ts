export type FlowStep =
  | "gender"
  | "style"
  | "refs"
  | "capture"
  | "lead"
  | "gen"
  | "result"
  | "pack"
  | "pix"
  | "paid"
  | "batch"
  | "gen2"
  | "final";
export type Gender = "male" | "female";
export type StyleId = "corp" | "aniv" | "life" | "pet";
export interface FlowReference {
  id: string;
  code: string;
  style: StyleId;
  gender: Gender;
  image: string;
  active: boolean;
  choices: number;
}
export interface FlowPackage {
  id: string;
  count: number;
  cents: number;
}
export interface BusinessSettings {
  packages: FlowPackage[];
  retention: boolean;
  watermark: boolean;
  autoPix: boolean;
  emailLink: boolean;
  pixKey: string;
  pixMinutes: number;
  message: string;
}
export interface CrmLead {
  id: string;
  name: string;
  gender: Gender;
  city: string;
  phone: string;
  email: string;
  style: StyleId;
  stage: string;
  tone: "success" | "warning" | "danger" | "violet" | "muted";
  progress: number;
  activity: string;
  when: string;
  createdAt: string;
  photos: string[];
  note: string;
}
export interface CrmOrder {
  id: string;
  name: string;
  count: number;
  cents: number;
  status: "Pago" | "Pendente" | "Expirado";
  when: string;
}
