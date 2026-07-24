import React from 'react';
import { X, Trophy, Globe, Flame, ShieldAlert, Award, FileText, CheckCircle, Info } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BONUS_POINTS_TABLE = [
  { pos: '1º', pts: 50 },
  { pos: '2º', pts: 42 },
  { pos: '3º', pts: 35 },
  { pos: '4º', pts: 29 },
  { pos: '5º', pts: 24 },
  { pos: '6º', pts: 19 },
  { pos: '7º', pts: 15 },
  { pos: '8º', pts: 11 },
  { pos: '9º', pts: 8 },
  { pos: '10º', pts: 5 },
  { pos: '11º', pts: 2 },
  { pos: '12º', pts: 0 },
];

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-yellow-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(249,115,22,0.15)] relative text-gray-200 flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#121215]/95 backdrop-blur border-b border-gray-800 p-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-500">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-wider text-white font-display flex items-center gap-2">
                Regulamento Oficial <span className="text-yellow-500">FFWSBR 2026 - 2º Split</span>
              </h2>
              <p className="text-xs text-gray-400 font-medium">Formato, pontuação, fases e critérios de desempate</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">

          {/* 1ª Fase */}
          <div className="bg-[#1a1a1e] rounded-2xl p-6 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black text-xs uppercase tracking-widest rounded-lg">
                  1ª Fase
                </span>
                <h3 className="text-lg font-black uppercase italic text-white font-display">
                  Fase Classificatória
                </h3>
              </div>
              <span className="text-xs font-bold text-gray-400">14 Equipes</span>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              As 14 equipes participantes se enfrentam de acordo com o calendário da Etapa. Em cada rodada, somente <strong className="text-yellow-400">duas equipes folgam</strong> enquanto as outras 12 se enfrentam. Os pontos geram uma tabela única com as 14 equipes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-[#0f0f12] p-4 rounded-xl border border-gray-800/80 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-500 block">
                  Classificação e Rebaixamento
                </span>
                <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                  <li><strong className="text-green-400">Top 12:</strong> Classificam-se para a próxima fase.</li>
                  <li><strong className="text-red-400">13º e 14º:</strong> Equipes rebaixadas.</li>
                </ul>
              </div>

              <div className="bg-[#0f0f12] p-4 rounded-xl border border-gray-800/80 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-500 block">
                  Critérios de Desempate (1ª Fase)
                </span>
                <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside font-medium">
                  <li>Soma de Booyahs (Vitórias);</li>
                  <li>Soma de abates;</li>
                  <li>Colocação na última queda em que jogaram juntas.</li>
                </ol>
              </div>
            </div>

            {/* Tabela de Pontos Extras */}
            <div className="pt-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1.5 mb-2">
                <Award size={14} /> Pontos Extras para a Próxima Fase (Top 12)
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
                {BONUS_POINTS_TABLE.map((item) => (
                  <div key={item.pos} className="bg-[#0f0f12] p-2 rounded-xl border border-gray-800 text-center">
                    <span className="text-[10px] font-bold text-gray-400 block">{item.pos}</span>
                    <span className="text-sm font-black text-yellow-400">{item.pts} <span className="text-[8px] text-gray-500 font-normal">pts</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2ª Fase */}
          <div className="bg-[#1a1a1e] rounded-2xl p-6 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 font-black text-xs uppercase tracking-widest rounded-lg">
                  2ª Fase
                </span>
                <h3 className="text-lg font-black uppercase italic text-white font-display">
                  Rumo ao Mundial
                </h3>
              </div>
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                <Globe size={14} /> 2 Vagas Diretas no Mundial
              </span>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Durante a 2ª fase, as 12 equipes classificadas jogam <strong className="text-white">6 rodadas</strong>. Os <strong className="text-yellow-400">dois melhores colocados</strong> ao final das rodadas garantem vaga direta no <strong className="text-yellow-400">Free Fire World Series - Grand Finals</strong>.
            </p>

            <div className="bg-[#0f0f12] p-4 rounded-xl border border-purple-500/20 text-xs text-gray-300 space-y-1">
              <p>• <strong>Eliminações:</strong> Nenhuma equipe é eliminada após a 2ª fase.</p>
              <p>• <strong>Transição para a Grande Final:</strong> Todas as 12 equipes iniciam a 3ª Fase com a pontuação zerada.</p>
              <p>• <strong>Desempate:</strong> 1º Booyahs; 2º Abates; 3º Colocação na última queda juntas.</p>
            </div>
          </div>

          {/* 3ª Fase - Grande Final (Champions Rush) */}
          <div className="bg-[#1a1a1e] rounded-2xl p-6 border border-yellow-500/40 relative overflow-hidden space-y-4 shadow-[0_0_30px_rgba(234,179,8,0.05)]">
            <div className="absolute top-0 right-0 p-6 opacity-5 text-yellow-500 pointer-events-none">
              <Trophy size={140} />
            </div>

            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-yellow-500 text-black font-black text-xs uppercase tracking-widest rounded-lg">
                  3ª Fase
                </span>
                <h3 className="text-lg font-black uppercase italic text-yellow-400 font-display flex items-center gap-2">
                  Grande Final <span className="text-white">• Champions Rush</span>
                </h3>
              </div>
              <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                <Trophy size={14} /> Campeão do 2º Split
              </span>
            </div>

            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-4 rounded-xl border border-yellow-500/30 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-yellow-400 flex items-center gap-2">
                <Flame size={16} /> Regra Champions Rush (160 Pontos)
              </h4>
              <p className="text-xs text-gray-200 leading-relaxed">
                A equipe que atingir <strong>160 pontos</strong> estará habilitada a ser campeã ao dar o Booyah. A equipe precisa <strong>iniciar a queda com 160+ pontos</strong> para que o Booyah a declare campeã e garanta vaga no <strong>Free Fire World Series - Grand Finals 2026</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-[#0f0f12] p-4 rounded-xl border border-gray-800 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-white block">
                  Dia 1 da Final (Sábado)
                </span>
                <p className="text-xs text-gray-300">
                  Realizadas <strong>6 quedas</strong> (Mapas: Bermuda, Purgatório, Nova Terra, Kalahari, Solara + 6º sorteado). Os pontos acumulados são levados para o segundo dia.
                </p>
              </div>

              <div className="bg-[#0f0f12] p-4 rounded-xl border border-gray-800 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-white block">
                  Dia 2 da Final (Domingo)
                </span>
                <p className="text-xs text-gray-300">
                  Sem limite de quedas! A primeira equipe que iniciar uma queda com <strong>160+ pontos</strong> e der o Booyah será declarada a grande Campeã do FFWSBR 2026 - 2º Split!
                </p>
              </div>
            </div>

            <div className="bg-[#0f0f12] p-3 rounded-xl border border-gray-800 text-[11px] text-gray-400 flex items-center gap-2">
              <Info size={14} className="text-yellow-500 shrink-0" />
              <span>
                Caso a campeã já possua vaga no Mundial obtida na 2ª Fase, a vaga do Mundial passa para a próxima equipe na classificação final.
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#121215] border-t border-gray-800 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-lg font-display"
          >
            Entendido / Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

export default RulesModal;
