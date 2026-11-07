import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

function Counter({ end, suffix = '', label }: { end: number; suffix?: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const duration = 2000; // 2 seconds

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;

        // easeOutQuart
        const easeProgress = 1 - Math.pow(1 - Math.min(progress / duration, 1), 4);

        setCount(Math.floor(easeProgress * end));

        if (progress < duration) {
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isInView, end]);

  // Format large numbers
  const formattedCount = count > 1000 ? count.toLocaleString('pt-BR') : count;

  return (
    <div ref={ref} className="flex flex-col items-center justify-center p-6 bg-[#14141C] rounded-2xl border border-white/5">
      <span className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] mb-2">
        {formattedCount}{suffix}
      </span>
      <span className="text-sm font-medium text-[#A1A1AA] text-center">{label}</span>
    </div>
  );
}

export function Counters() {
  return (
    <section className="py-10 border-y border-white/5 bg-[#0A0A0F]/50">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <Counter end={18472} suffix="+" label={t("Fotos geradas")} />
          <Counter end={4.9} suffix="/5" label={t("Avaliação média")} />
          <Counter end={2} suffix=" min" label={t("Tempo médio")} />
          <Counter end={5} label={t("Estilos disponíveis")} />
        </div>
      </div>
    </section>
  );
}
