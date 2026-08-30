import React, { useMemo, useState } from 'react';
import { DashboardData } from '../types';
import { Flame, Snowflake, Target, Crosshair, MapPin, TrendingUp, TrendingDown, Crown, AlertTriangle, Calendar } from 'lucide-react';
import { normalize } from '../lib/utils';

interface TeamMomentumProps {
  data: DashboardData;
}

const MAPS_CONFIG = [
  { id: 'BER', name: 'Bermuda', url: 'https://i.ibb.co/q34yct8f/BERMUDA-MAPA.png' },
  { id: 'PUR', name: 'Purgatório', url: 'https://i.ibb.co/G4sGkqk1/image.png' },
  { id: 'KAL', name: 'Kalahari', url: 'https://i.ibb.co/7t4mHjWy/image.png' },
  { id: 'NT', name: 'Nova Terra', url: 'https://i.ibb.co/vC4pT91L/image.png' },
  { id: 'SOL', name: 'Solara', url: 'https://i.ibb.co/sdQ8hqbM/image.png' }
];

export const TeamMomentum: React.FC<TeamMomentumProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<'maps' | 'rounds'>('maps');
  const momentumData = useMemo(() => {
    const results = [];

    for (const mapConfig of MAPS_CONFIG) {
      // Filtrar partidas deste mapa
      const mapMatches = data.details.filter(d => normalize(d.MAPA) === normalize(mapConfig.id) || normalize(d.MAPA) === normalize(mapConfig.name) || normalize(d.MAPA).startsWith(normalize(mapConfig.id)));
      if (mapMatches.length === 0) continue;

      // Pegar rodadas únicas deste mapa
      const uniqueRounds = Array.from(new Set(mapMatches.map(d => d.RD))).filter(Boolean) as string[];
      
      // Ordenar rodadas pelo número contido no texto (ex: "RODADA 1", "RODADA 2")
      const sortedRounds = uniqueRounds.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
      });

      // Pegar as 4 últimas rodadas que este mapa foi jogado
      const last4Rounds = sortedRounds.slice(-4);
      
      if (last4Rounds.length === 0) continue;

      // Calcular os pontos nessas rodadas específicas
      const teamStatsMap = new Map<string, { pts: number; kills: number; matches: number }>();
      
      const recentMatches = mapMatches.filter(d => last4Rounds.includes(d.RD));
      
      recentMatches.forEach(m => {
        const teamName = m.TIME;
        if (!teamName) return;
        
        const pts = parseInt(m.PTS as string) || 0;
        const kills = parseInt(m.ABTS as string) || 0;
        
        if (!teamStatsMap.has(teamName)) {
          teamStatsMap.set(teamName, { pts: 0, kills: 0, matches: 0 });
        }
        
        const stats = teamStatsMap.get(teamName)!;
        stats.pts += pts;
        stats.kills += kills;
        stats.matches += 1;
      });

      // Transformar em array e ordenar por PTS -> ABTS
      const sortedTeams = Array.from(teamStatsMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.pts - a.pts || b.kills - a.kills);

      // Top 3 e Bottom 3 (evitando times com 0 partidas recentes)
      const top3 = sortedTeams.slice(0, 3);
      // Pega os 3 últimos e inverte para o pior ficar em primeiro da lista "piores"
      const bottom3 = [...sortedTeams].reverse().slice(0, 3);

      results.push({
        mapConfig,
        rounds: last4Rounds,
        top3,
        bottom3
      });
    }

    return results;
  }, [data]);

  const roundMomentumData = useMemo(() => {
    const results = [];
    const allRounds = Array.from(new Set(data.details.filter(d => d.MAPA && d.MAPA.trim() !== '').map(d => d.RD))).filter(Boolean) as string[];

    const sortedRounds = allRounds.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    const recentRounds = sortedRounds.reverse().slice(0, 6);

    for (const rd of recentRounds) {
      const rdMatches = data.details.filter(d => normalize(d.RD) === normalize(rd));
      if (rdMatches.length === 0) continue;

      const teamStatsMap = new Map<string, { pts: number; kills: number; matches: number }>();

      rdMatches.forEach(m => {
        const teamName = m.TIME;
        if (!teamName) return;

        const pts = parseInt(m.PTS as string) || 0;
        const kills = parseInt(m.ABTS as string) || 0;

        if (!teamStatsMap.has(teamName)) {
          teamStatsMap.set(teamName, { pts: 0, kills: 0, matches: 0 });
        }

        const stats = teamStatsMap.get(teamName)!;
        stats.pts += pts;
        stats.kills += kills;
        stats.matches += 1;
      });

      const sortedTeams = Array.from(teamStatsMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.pts - a.pts || b.kills - a.kills);

      const top3 = sortedTeams.slice(0, 3);
      const bottom3 = [...sortedTeams].reverse().slice(0, 3);

      results.push({
        roundName: rd,
        top3,
        bottom3
      });
    }

    return results;
  }, [data]);


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col items-center justify-center text-center py-6 bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <Flame size={120} />
        </div>
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-[0_0_30px_rgba(249,115,22,0.3)] rotate-3">
          <Flame size={32} />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-widest italic mb-2">Termômetro da Liga</h2>
        <p className="text-gray-400 text-sm max-w-2xl px-4">
          Análise de <strong className="text-white">Momento</strong>. Acompanhe quem está dominando as partidas mais recentes e quais equipes precisam de atenção imediata.
        </p>
        
        <div className="flex gap-3 mt-6 bg-black/50 p-1 rounded-xl border border-white/5">
            <button 
                onClick={() => setViewMode('maps')} 
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${viewMode === 'maps' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'text-gray-400 hover:text-white'}`}
            >
                <MapPin size={13} /> Por Mapa
            </button>
            <button 
                onClick={() => setViewMode('rounds')} 
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${viewMode === 'rounds' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'text-gray-400 hover:text-white'}`}
            >
                <Calendar size={13} /> Por Rodada
            </button>
        </div>
      </div>

      {viewMode === 'maps' ? (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {momentumData.map((mapData, idx) => (
          <div key={idx} className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl relative group flex flex-col">
            {/* Header do Mapa */}
            <div className="relative h-28 overflow-hidden">
                <div className="absolute inset-0 bg-black/50 z-10" />
                <img src={mapData.mapConfig.url} alt={mapData.mapConfig.name} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent z-20" />
                <div className="absolute bottom-3 left-5 z-30 flex items-center gap-2">
                    <MapPin size={18} className="text-yellow-500" />
                    <h3 className="text-xl font-black text-white uppercase tracking-widest italic drop-shadow-md">{mapData.mapConfig.name}</h3>
                </div>
            </div>

            <div className="px-5 pb-5 pt-2 flex-1 flex flex-col gap-4">
                {/* Rounds info */}
                <div className="flex justify-between items-center bg-black/40 rounded-xl p-2.5 border border-white/5">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Rodadas Analisadas</span>
                    <div className="flex gap-1">
                        {mapData.rounds.map(r => {
                             const rNum = r.replace(/\D/g, '') || r;
                             return (
                                 <span key={r} className="w-5 h-5 rounded bg-gray-800 text-gray-300 text-[9px] font-black flex items-center justify-center border border-gray-700" title={r}>
                                     {rNum}
                                 </span>
                             )
                        })}
                    </div>
                </div>

                {/* EM ALTA */}
                <div className="bg-gradient-to-b from-green-500/10 to-transparent rounded-2xl p-4 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-3 border-b border-green-500/20 pb-2">
                        <TrendingUp size={16} className="text-green-400" />
                        <span className="text-xs font-black text-green-400 uppercase tracking-widest">Em Alta</span>
                    </div>
                    <div className="space-y-2">
                        {mapData.top3.map((team, tIdx) => (
                            <div key={tIdx} className="flex items-center justify-between bg-black/40 rounded-xl p-2 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${tIdx === 0 ? 'bg-yellow-500 text-black' : tIdx === 1 ? 'bg-gray-300 text-black' : 'bg-orange-700 text-white'}`}>
                                        {tIdx + 1}
                                    </div>
                                    <span className="text-xs font-black text-white truncate max-w-[100px] uppercase">{team.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-sm font-black text-green-400 italic leading-none">{team.pts} pts</span>
                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{team.kills} abts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* EM BAIXA */}
                <div className="bg-gradient-to-b from-red-500/10 to-transparent rounded-2xl p-4 border border-red-500/20 mt-auto">
                    <div className="flex items-center gap-2 mb-3 border-b border-red-500/20 pb-2">
                        <TrendingDown size={16} className="text-red-400" />
                        <span className="text-xs font-black text-red-400 uppercase tracking-widest">Em Baixa</span>
                    </div>
                    <div className="space-y-2">
                        {mapData.bottom3.map((team, tIdx) => (
                            <div key={tIdx} className="flex items-center justify-between bg-black/40 rounded-xl p-2 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded bg-gray-800 text-gray-500 flex items-center justify-center text-[10px] font-black">
                                        <AlertTriangle size={10} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 truncate max-w-[100px] uppercase">{team.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-sm font-black text-red-400 italic leading-none">{team.pts} pts</span>
                                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">{team.kills} abts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
          </div>
        ))}
      </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {roundMomentumData.map((rdData, idx) => (
          <div key={idx} className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl relative group flex flex-col">
            <div className="bg-gradient-to-r from-gray-900 to-black px-6 py-4 flex items-center gap-3 border-b border-gray-800">
                <Calendar size={18} className="text-yellow-500" />
                <h3 className="text-lg font-black text-white uppercase tracking-widest italic">{rdData.roundName}</h3>
            </div>
            
            <div className="px-5 pb-5 pt-4 flex-1 flex flex-col gap-4">
                {/* EM ALTA */}
                <div className="bg-gradient-to-b from-green-500/10 to-transparent rounded-2xl p-4 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-3 border-b border-green-500/20 pb-2">
                        <TrendingUp size={16} className="text-green-400" />
                        <span className="text-xs font-black text-green-400 uppercase tracking-widest">Melhores (Top 3)</span>
                    </div>
                    <div className="space-y-2">
                        {rdData.top3.map((team, tIdx) => (
                            <div key={tIdx} className="flex items-center justify-between bg-black/40 rounded-xl p-2 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${tIdx === 0 ? 'bg-yellow-500 text-black' : tIdx === 1 ? 'bg-gray-300 text-black' : 'bg-orange-700 text-white'}`}>
                                        {tIdx + 1}
                                    </div>
                                    <span className="text-xs font-black text-white truncate max-w-[100px] uppercase">{team.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-sm font-black text-green-400 italic leading-none">{team.pts} pts</span>
                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{team.kills} abts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* EM BAIXA */}
                <div className="bg-gradient-to-b from-red-500/10 to-transparent rounded-2xl p-4 border border-red-500/20 mt-auto">
                    <div className="flex items-center gap-2 mb-3 border-b border-red-500/20 pb-2">
                        <TrendingDown size={16} className="text-red-400" />
                        <span className="text-xs font-black text-red-400 uppercase tracking-widest">Piores (Bottom 3)</span>
                    </div>
                    <div className="space-y-2">
                        {rdData.bottom3.map((team, tIdx) => (
                            <div key={tIdx} className="flex items-center justify-between bg-black/40 rounded-xl p-2 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded bg-gray-800 text-gray-500 flex items-center justify-center text-[10px] font-black">
                                        <AlertTriangle size={10} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 truncate max-w-[100px] uppercase">{team.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-sm font-black text-red-400 italic leading-none">{team.pts} pts</span>
                                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">{team.kills} abts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};
