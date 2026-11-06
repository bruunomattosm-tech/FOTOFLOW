import React from 'react';
import { Sparkles, Sliders, Zap, Download, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface NavbarProps {
  selectedModel: string;
  selectedResolution: string;
  isCustomPromptActive: boolean;
  onOpenPromptModal: () => void;
  onToggleSettingsModal: () => void;
  isSettingsOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedModel,
  selectedResolution,
  isCustomPromptActive,
  onOpenPromptModal,
  onToggleSettingsModal,
  isSettingsOpen,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-purple-900/20 px-4 py-3 sm:py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B5CF6] via-purple-600 to-[#F59E0B] p-[1px] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/20">
            <div className="w-full h-full bg-[#0a0a0f] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#F59E0B]" />
            </div>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              FotoFlow{' '}
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40 font-semibold uppercase tracking-wider">
                Studio
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Gerador de fotos ultra-realistas com IA
            </p>
          </div>
        </div>

        {/* Controles de Prompt, Tag da API e Download */}
        <div className="flex items-center gap-2">
          {/* Botão de Download do Projeto Completo (.md) */}
          <a
            href="/download"
            download="FOTOFLOW_COMPLETO.md"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/20 cursor-pointer"
            title="Baixar arquivo único (.md) com 100% da arquitetura, prompts e códigos para agentes"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Baixar Projeto (.md)</span>
            <span className="sm:hidden">Baixar .md</span>
          </a>

          <button
            type="button"
            onClick={onOpenPromptModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isCustomPromptActive
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 shadow-sm shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-violet-500/50 hover:text-white'
            }`}
            title="Visualizar e editar os prompts mestre da IA em seções separadas"
          >
            <Sliders className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">Prompts Mestre</span>
            <span className="sm:hidden">Prompts</span>
            {isCustomPromptActive ? (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                Editado
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">
                (Padrão)
              </span>
            )}
          </button>

          {/* Tag com API e Resolução selecionadas */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
            <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>
              API:{' '}
              <strong className="text-slate-300 font-mono">
                {selectedModel.includes('nano-banana')
                  ? 'Nano Banana 2.1'
                  : selectedModel.includes('sunburst')
                  ? 'GPT 2.5 Sunburst'
                  : 'GPT 2.5 Flare'}{' '}
                ({selectedResolution})
              </strong>
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleSettingsModal}
            className="flex items-center gap-1 text-xs"
            title="Configurações de IA e Modelo"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isSettingsOpen ? 'Fechar' : 'Configurações'}</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
