import { useLocale } from '@/context/LocaleContext';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { track } from '@/lib/track';
import { landingAssets } from '@/data/landingAssets';
import { Star } from 'lucide-react';

export function Hero() {
 const { t } = useLocale();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = landingAssets.hero.mockupImages;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  const handleCTA = () => {
    track('ClickCTA', { location: 'Hero' });
    navigate('/app');
  };

  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-32 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#1A0B2E] rounded-full blur-[120px] opacity-60 -z-10 pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-start"
          >
            <div className="inline-flex items-center gap-2 bg-[#14141C] border border-white/10 rounded-full px-4 py-1.5 mb-8">
              <span className="text-[#8B5CF6]">✦</span>
              <span className="text-sm font-medium text-[#F5F5F7]">{t("Mais de 18.000 ensaios gerados")}</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[68px] font-bold text-[#F5F5F7] leading-[1.1] tracking-[-0.03em] mb-6">
              Seu ensaio profissional.{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#A855F7]">
                {t("Sem estúdio, sem fotógrafo, sem espera.")}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[#A1A1AA] leading-relaxed mb-10 max-w-xl">
              {t("Envie 4 selfies. A IA cria um ensaio ultra-realista com você — no cenário, no estilo e na pose que você escolher. Pronto em minutos.")}
            </p>

            <div className="w-full sm:w-auto flex flex-col items-start gap-4">
              <button
                onClick={handleCTA}
                className="w-full sm:w-auto bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                {t("Criar meu ensaio")}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <div className="flex flex-col gap-2">
                <span className="text-sm text-[#A1A1AA]">
                  {t("Grátis para criar · Você só paga para baixar")}
                </span>

                <div className="flex items-center gap-3">
                  <div className="flex text-[#22C55E]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-[#F5F5F7]">
                    {t("4,9/5 · +18.000 ensaios")}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column (Mockup) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mx-auto w-full max-w-[320px] lg:max-w-[400px]"
          >
            {/* Glow behind mockup */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#8B5CF6]/30 to-transparent rounded-[3rem] blur-2xl -z-10" />

            <div className="relative bg-[#0A0A0F] rounded-[3rem] p-3 border-4 border-[#14141C] shadow-2xl shadow-black/50 overflow-hidden aspect-[9/19]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#14141C] rounded-b-3xl z-20" />

              <div className="relative w-full h-full rounded-[2.25rem] overflow-hidden bg-[#1A0B2E]">
                {images.map((src, idx) => (
                  <img
                    key={src}
                    src={src}
                    alt={`Exemplo de ensaio ${idx + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                      idx === currentImageIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
              </div>

              {/* Floating Badge */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-6 md:-right-12 bottom-20 bg-[#14141C]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex items-center gap-3 z-30"
              >
                <div className="w-10 h-10 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
                  <Star size={20} className="text-[#22C55E]" fill="currentColor" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#F5F5F7]">{t("Ensaio pronto")}</p>
                  <p className="text-xs text-[#22C55E]">{t("em 2 minutos")}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
