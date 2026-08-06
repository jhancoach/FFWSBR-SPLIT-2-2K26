import React from 'react';
import { PlayerLoadoutDetailed } from '../src/utils/characterUtils';
import { User, Zap, Shield, Flame, X, Swords, ChevronRight } from 'lucide-react';

interface DropCompositionProps {
  teamName: string;
  round: string;
  drop: string;
  mapa?: string;
  playersLoadout: PlayerLoadoutDetailed[];
  onPlayerClick?: (playerName: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const DropCompositionViewer: React.FC<DropCompositionProps> = ({
  teamName,
  round,
  drop,
  mapa,
  playersLoadout,
  onPlayerClick,
  onClose,
  isModal = false
}) => {
  // Contagem de ativas para resumo
  const activeCounts: Record<string, number> = {};
  playersLoadout.forEach(p => {
    if (p.hab1) {
      activeCounts[p.hab1] = (activeCounts[p.hab1] || 0) + 1;
    }
  });

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 font-black text-[10px] uppercase tracking-widest">
              RD {round} • QUEDA {drop}
            </span>
            {mapa && (
              <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300 font-black text-[10px] uppercase tracking-wider italic">
                {mapa}
              </span>
            )}
          </div>
          <h3 className="text-xl font-black italic text-white uppercase tracking-tight flex items-center gap-2">
            <Shield size={18} className="text-yellow-500" />
            COMPOSIÇÃO DE PERSONAGENS • <span className="text-yellow-500">{teamName}</span>
          </h3>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Resumo de Ativas da Line-up */}
      {Object.keys(activeCounts).length > 0 && (
        <div className="bg-black/50 p-3.5 rounded-2xl border border-white/5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Zap size={14} className="text-yellow-500 animate-pulse" /> SÍNTESE DE HABILIDADES ATIVAS NA QUEDA:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(activeCounts).map(([hab, count]) => (
              <span
                key={hab}
                className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                {count}x {hab}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Grid dos 4 Jogadores */}
      {playersLoadout.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {playersLoadout.map((p, idx) => (
            <div
              key={idx}
              className="bg-[#0e0e11] rounded-2xl p-4 border border-gray-800 hover:border-yellow-500/30 transition-all flex flex-col justify-between shadow-xl group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none"></div>

              {/* Topo do Jogador */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => onPlayerClick && onPlayerClick(p.player)}
                    className="flex items-center gap-2 group/btn text-left hover:text-yellow-500 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-black border border-yellow-500/40 flex items-center justify-center p-0.5 shadow-md shrink-0">
                      <User size={16} className="text-yellow-500" />
                    </div>
                    <div>
                      <span className="text-sm font-black italic uppercase text-white group-hover/btn:text-yellow-500 flex items-center gap-1 leading-none">
                        {p.player}
                        <ChevronRight size={12} className="opacity-0 group-hover/btn:opacity-100 transition-opacity text-yellow-500" />
                      </span>
                      {p.funcao && (
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mt-0.5">
                          {p.funcao}
                        </span>
                      )}
                    </div>
                  </button>

                  {(p.kills !== undefined || p.damage !== undefined) && (
                    <div className="text-right">
                      {p.kills !== undefined && (
                        <span className="text-xs font-black italic text-red-500 block leading-none">
                          {p.kills} Kills
                        </span>
                      )}
                      {p.damage !== undefined && (
                        <span className="text-[8px] font-bold text-gray-500 block mt-0.5">
                          {p.damage} Dano
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Habilidade Ativa (Destaque) */}
                <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent p-3 rounded-xl border border-yellow-500/30 mb-3 shadow-inner">
                  <span className="text-[8px] text-yellow-500 font-black uppercase tracking-widest block mb-1">
                    ATIVA (HAB 1)
                  </span>
                  <div className="flex items-center gap-2">
                    {p.hab1Img ? (
                      <img src={p.hab1Img} className="w-7 h-7 object-contain rounded-md bg-black p-0.5 border border-yellow-500/40" alt={p.hab1} />
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-black border border-yellow-500/30 flex items-center justify-center">
                        <Zap size={14} className="text-yellow-500" />
                      </div>
                    )}
                    <span className="text-xs font-black italic text-white uppercase truncate">
                      {p.hab1 || 'Sem Ativa'}
                    </span>
                  </div>
                </div>

                {/* Passivas */}
                <div className="space-y-1.5 mb-3">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest block">
                    PASSIVAS
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { name: p.hab2, img: p.hab2Img, label: 'H2' },
                      { name: p.hab3, img: p.hab3Img, label: 'H3' },
                      { name: p.hab4, img: p.hab4Img, label: 'H4' },
                    ].map((hab, hIdx) => (
                      <div
                        key={hIdx}
                        className="bg-black/60 p-1.5 rounded-lg border border-white/5 flex flex-col items-center text-center"
                        title={hab.name}
                      >
                        {hab.img ? (
                          <img src={hab.img} className="w-5 h-5 object-contain mb-1" alt={hab.name} />
                        ) : (
                          <div className="w-5 h-5 rounded bg-gray-800/50 mb-1 flex items-center justify-center text-[8px] text-gray-600 font-mono">
                            {hab.label}
                          </div>
                        )}
                        <span className="text-[8px] font-bold text-gray-300 uppercase truncate max-w-[50px] leading-tight">
                          {hab.name || '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pet & Item */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                  <div className="bg-black/40 p-2 rounded-xl border border-white/5 flex items-center gap-2">
                    {p.petImg ? (
                      <img src={p.petImg} className="w-5 h-5 object-contain" alt={p.pet} />
                    ) : (
                      <div className="w-5 h-5 rounded bg-gray-900 border border-white/5 flex items-center justify-center text-[7px] text-gray-600">P</div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[7px] text-gray-500 font-black uppercase block leading-none">PET</span>
                      <span className="text-[9px] font-black text-gray-300 uppercase truncate block leading-tight">{p.pet || '-'}</span>
                    </div>
                  </div>

                  <div className="bg-black/40 p-2 rounded-xl border border-white/5 flex items-center gap-2">
                    {p.itemImg ? (
                      <img src={p.itemImg} className="w-5 h-5 object-contain" alt={p.item} />
                    ) : (
                      <div className="w-5 h-5 rounded bg-gray-900 border border-white/5 flex items-center justify-center text-[7px] text-gray-600">I</div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[7px] text-gray-500 font-black uppercase block leading-none">ITEM</span>
                      <span className="text-[9px] font-black text-gray-300 uppercase truncate block leading-tight">{p.item || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-[10px] text-gray-500 font-black uppercase italic tracking-widest bg-black/20 rounded-2xl border border-dashed border-gray-800">
          Nenhum registro de personagem/loadout encontrado para esta queda.
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-[#121215] w-full max-w-5xl rounded-3xl p-6 md:p-8 border border-gray-800 shadow-2xl my-8 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121215] rounded-3xl p-6 border border-gray-800 shadow-2xl">
      {content}
    </div>
  );
};
