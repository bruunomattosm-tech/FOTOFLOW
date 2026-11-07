import { useLocale } from '@/context/LocaleContext';
import React from 'react';
import { landingAssets } from '@/data/landingAssets';

export function Gallery() {
 const { t } = useLocale();
  const { row1, row2, row3 } = landingAssets.gallery;

  const MarqueeRow = ({ images, direction = 'left', speed = 40 }: { images: string[], direction?: 'left' | 'right', speed?: number }) => (
    <div className="relative flex overflow-hidden group">
      <div
        className={`flex min-w-full shrink-0 gap-4 py-4 animate-marquee ${direction === 'right' ? 'animate-marquee-reverse' : ''}`}
        style={{ '--duration': `${speed}s` } as React.CSSProperties}
      >
        {/* Render twice for infinite effect */}
        {[...images, ...images].map((src, i) => (
          <div
            key={i}
            className="relative w-48 md:w-64 aspect-[3/4] rounded-2xl overflow-hidden shrink-0 group-hover/card:scale-105 transition-transform duration-300"
          >
            <img
              src={src}
              alt="Ensaio gerado"
              loading="lazy"
              className="w-full h-full object-cover"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <span className="text-white font-medium text-sm">{t("Estilo Premium")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="py-24 overflow-hidden bg-[#0A0A0F]">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl mb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[#F5F5F7] mb-4">
          {t("Ensaios criados com o FotoFlow")}
        </h2>
        <p className="text-[#A1A1AA] text-lg max-w-2xl mx-auto">
          {t("Resultados reais gerados por nossa inteligência artificial a partir de selfies comuns.")}
        </p>
      </div>

      <div className="flex flex-col gap-2 -mx-4 rotate-[-2deg] scale-105">
        <MarqueeRow images={row1} speed={50} />
        <MarqueeRow images={row2} direction="right" speed={40} />
        <div className="hidden md:block">
          <MarqueeRow images={row3} speed={60} />
        </div>
      </div>

      {/* CSS is required for the marquee animations. We will add this to index.css or a style tag */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee var(--duration) linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee var(--duration) linear infinite reverse;
        }
        .group:hover .animate-marquee, .group:hover .animate-marquee-reverse {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
