import React from 'react';
import { motion } from 'framer-motion';

interface QuizLayoutProps {
  step: number;
  totalSteps: number;
  children: React.ReactNode;
}

export function QuizLayout({ step, totalSteps, children }: QuizLayoutProps) {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F5F5F7] font-sans flex flex-col items-center justify-center p-4 selection:bg-[#8B5CF6]/30">
      <div className="w-full max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#A1A1AA]">
            Passo {step} de {totalSteps}
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#14141C] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] shadow-[0_0_10px_rgba(139,92,246,0.5)]"
          />
        </div>
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl bg-[#14141C] rounded-3xl p-6 md:p-10 border border-white/5 shadow-[0_0_40px_rgba(139,92,246,0.05)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#8B5CF6]/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
