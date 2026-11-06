import React from 'react';
import { Sparkles, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const HeroSection: React.FC = () => {
  return (
    <section className="text-center py-6 sm:py-10 max-w-3xl mx-auto px-4 space-y-4">
      <div className="inline-flex items-center gap-2">
        <Badge variant="amber" className="px-3 py-1 text-xs gap-1.5 font-bold shadow-sm shadow-amber-500/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Retoque Executivo Padrão Forbes & LinkedIn
        </Badge>
      </div>

      <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
        Seu ensaio fotográfico de estúdio{' '}
        <span className="bg-gradient-to-r from-amber-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
          em segundos com IA
        </span>
      </h2>

      <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
        Envie 5 fotos do seu celular e gere retratos com iluminação de estúdio profissional,
        microporos reais e zero efeito de cabeça colada.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] text-slate-300">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Fidelidade Biometria 100%
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
          Zero Pele Plástica
        </span>
        <span className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          WaveSpeed AI Integrada
        </span>
      </div>
    </section>
  );
};
