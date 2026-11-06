import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { track } from '@/lib/track';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCTA = () => {
    track('ClickCTA', { location: 'Navbar' });
    navigate('/app');
  };

  const navLinks = [
    { label: 'Como funciona', href: '#como-funciona' },
    { label: 'Estilos', href: '#estilos' },
    { label: 'Preços', href: '#precos' },
    { label: 'Dúvidas', href: '#faq' },
  ];

  const handleScrollTo = (href: string) => {
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0A0A0F]/80 backdrop-blur-md border-b border-white/5 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#F5F5F7] font-bold text-xl tracking-tight">FotoFlow</span>
          <span className="bg-[#1A0B2E] text-[#A855F7] text-xs font-semibold px-2 py-0.5 rounded-full border border-[#8B5CF6]/30">
            BETA
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleScrollTo(link.href)}
              className="text-sm text-[#A1A1AA] hover:text-[#F5F5F7] transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:block">
          <button
            onClick={handleCTA}
            className="bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white px-6 py-2.5 rounded-full font-medium text-sm hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all duration-300"
          >
            Criar meu ensaio
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-[#F5F5F7]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-[#14141C] border-b border-white/10 shadow-2xl p-6 md:hidden flex flex-col gap-6"
          >
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleScrollTo(link.href)}
                className="text-left text-[#F5F5F7] text-lg font-medium"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={handleCTA}
              className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white px-6 py-3.5 rounded-xl font-medium text-center"
            >
              Criar meu ensaio
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
