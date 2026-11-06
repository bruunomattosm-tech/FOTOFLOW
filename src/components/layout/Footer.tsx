import React from 'react';
import { ShieldCheck, Lock, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-[#07070b] py-8 px-4 text-center text-xs text-slate-500">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-slate-300">FotoFlow</span>
          <span>• Retratos Executivos & Ensaios com IA</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-slate-400">
            <Lock className="w-3 h-3 text-emerald-400" />
            Privacidade e Criptografia
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
            Anti-Pele Plástica
          </span>
        </div>
      </div>
      <p className="mt-4 text-[10px] text-slate-600">
        © {new Date().getFullYear()} FotoFlow. Todos os direitos reservados. Fotos processadas e descartadas conforme termos de uso.
      </p>
    </footer>
  );
};
