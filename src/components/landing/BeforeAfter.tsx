import { useLocale } from '@/context/LocaleContext';
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { landingAssets } from '@/data/landingAssets';

export function BeforeAfter() {
 const { t } = useLocale();
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number | string>('100vw');

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();

    // Also update on window resize
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  return (
    <section className="py-24 bg-[#0A0A0F]">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-[#F5F5F7] mb-6">
            {t("O poder da transformação")}
          </h2>
          <p className="text-[#A1A1AA] text-lg max-w-2xl mx-auto">
            {t("Arraste para ver como uma simples selfie se torna um retrato de estúdio em minutos.")}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto aspect-[3/4] md:aspect-video rounded-3xl overflow-hidden cursor-ew-resize touch-none select-none border border-white/10"
          ref={containerRef}
          onMouseDown={(e) => { setIsDragging(true); handleMove(e.clientX); }}
          onMouseMove={onMouseMove}
          onTouchStart={(e) => { setIsDragging(true); handleMove(e.touches[0].clientX); }}
          onTouchMove={onTouchMove}
        >
          {/* Base Image (After) */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={landingAssets.beforeAfter.after}
              alt="Ensaio FotoFlow"
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <span className="text-white text-sm font-medium">{t("Ensaio FotoFlow")}</span>
            </div>
          </div>

          {/* Top Image (Before) */}
          <div
            className="absolute inset-0 h-full overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <div className="relative w-full h-full" style={{ width: containerWidth }}>
              <img
                src={landingAssets.beforeAfter.before}
                alt="Selfie original"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ width: containerWidth, maxWidth: 'none' }}
                draggable={false}
              />
            </div>
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <span className="text-white text-sm font-medium">Selfie</span>
            </div>
          </div>

          {/* Slider Line & Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20"
            style={{ left: `calc(${sliderPosition}% - 2px)` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180 absolute">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
