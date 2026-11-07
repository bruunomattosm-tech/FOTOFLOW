import React, { useEffect } from 'react';
import { track } from '@/lib/track';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Counters } from '@/components/landing/Counters';
import { Gallery } from '@/components/landing/Gallery';
import { Styles } from '@/components/landing/Styles';
import { BeforeAfter } from '@/components/landing/BeforeAfter';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Testimonials } from '@/components/landing/Testimonials';
import { Pricing } from '@/components/landing/Pricing';
import { FAQ } from '@/components/landing/FAQ';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  useEffect(() => {
    track('PageView');
  }, []);

  return (
    <div className="bg-[#0A0A0F] text-[#A1A1AA] min-h-screen font-sans selection:bg-[#8B5CF6]/30">
      <Navbar />
      <main>
        <Hero />
        <Counters />
        <Gallery />
        <Styles />
        <BeforeAfter />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
