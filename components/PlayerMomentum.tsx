import React, { useMemo, useState } from 'react';
import { DashboardData, PlayerData } from '../types';
import { Flame, MapPin, Calendar, TrendingUp, TrendingDown, Crown, AlertTriangle, Search, Target, Swords, Shield, Award, Sparkles, User, Crosshair } from 'lucide-react';
import { normalize, parseNumber } from '../lib/utils';
import { findTeamLogo } from '../utils/teamUtils';
import { findDimImg } from '../utils/skillImages';

interface PlayerMomentumProps {
  data: DashboardData;
  onSelectPlayer?: (playerName: string) => void;
}

const MAPS_CONFIG = [
  { id: 'BER', name: 'Bermuda', url: 'https://i.ibb.co/q34yct8f/BERMUDA-MAPA.png' },
  { id: 'PUR', name: 'Purgatório', url: 'https://i.ibb.co/G4sGkqk1/image.png' },
  { id: 'KAL', name: 'Kalahari', url: 'https://i.ibb.co/7t4mHjWy/image.png' },
  { id: 'NT', name: 'Nova Terra', url: 'https://i.ibb.co/vC4pT91L/image.png' },
  { id: 'SOL', name: 'Solara', url: 'https://i.ibb.co/sdQ8hqbM/image.png' }
];

interface PlayerRoundStat {
  name: string;
  team: string;
  playerImg: string;
  teamImg?: string;
  kills: number;
  damage: number;
  hs: number;
  mvp: number;
  matches: number;
  avgKills: number;
  avgDmg: number;
}

export const PlayerMomentum: React.FC<PlayerMomentumProps> = ({ data, onSelectPlayer }) => {
  const [viewMode, setViewMode] = useState<'rounds' | 'maps'>('rounds');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('ALL');

  // Cálculo dos dados por RODADA
  const roundsMomentum = useMemo(() => {
    // 1. Filtrar registros válidos que tenham jogador, rodada e mapa preenchido
    const validEntries = data.players.filter(p => {
      const pName = p.PLAYER?.trim();
      const rd = p.RD?.trim();
      const mapa = p.MAPA?.trim();
      return pName && rd && mapa;
    });

    // 2. Extrair rodadas únicas com jogos reais
    const uniqueRounds = Array.from(new Set(validEntries.map(p => p.RD!.trim()))).filter(Boolean);

    // Ordenar rodadas de forma numérica decrescente (Rodada 10, 9, 8...)
    const sortedRounds = uniqueRounds.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numB - numA;
    });

    const results: {
      roundName: string;
      totalMatches: number;
      top3: PlayerRoundStat[];
      bottom3: PlayerRoundStat[];
      allPlayers: PlayerRoundStat[];
    }[] = [];

    for (const rd of sortedRounds) {
      const roundPlayers = validEntries.filter(p => normalize(p.RD) === normalize(rd));
      if (roundPlayers.length === 0) continue;

      const playerMap = new Map<string, {
        name: string;
        team: string;
        kills: number;
        damage: number;
        hs: number;
        mvp: number;
        matches: number;
      }>();

      roundPlayers.forEach(p => {
        const name = p.PLAYER.trim();
        const team = p.TIME?.trim() || '';
        const kills = parseNumber(p.Abates);
        const damage = parseNumber(p.Dano);
        const hs = parseNumber(p.HS);
        const mvp = parseNumber(p.MVP);

        if (!playerMap.has(name)) {
          playerMap.set(name, {
            name,
            team,
            kills: 0,
            damage: 0,
            hs: 0,
            mvp: 0,
            matches: 0
          });
        }

        const stat = playerMap.get(name)!;
        if (team && !stat.team) stat.team = team;
        stat.kills += kills;
        stat.damage += damage;
        stat.hs += hs;
        stat.mvp += mvp;
        stat.matches += 1;
      });

      const playerList: PlayerRoundStat[] = Array.from(playerMap.values()).map(p => {
        const matches = p.matches || 1;
        return {
          ...p,
          playerImg: findDimImg(data.playersDimension, p.name) || '',
          teamImg: findTeamLogo(p.team, data.teamsReference),
          avgKills: Number((p.kills / matches).toFixed(2)),
          avgDmg: Number((p.damage / matches).toFixed(0))
        };
      });

      // Ordenar para Top 3 Melhores (Kills desc -> Damage desc)
      const sortedBest = [...playerList].sort((a, b) => b.kills - a.kills || b.damage - a.damage);
      const top3 = sortedBest.slice(0, 3);

      // Para Bottom 3 (Piores): considerar jogadores que jogaram pelo menos 2 ou 3 salas na rodada para ser justo
      // Se não houver suficientes com >= 3, pega com >= 1
      let eligibleForWorst = playerList.filter(p => p.matches >= 3);
      if (eligibleForWorst.length < 3) {
        eligibleForWorst = playerList.filter(p => p.matches >= 2);
      }
      if (eligibleForWorst.length < 3) {
        eligibleForWorst = playerList;
      }

      // Ordenar Piores (Kills asc -> AvgKills asc -> Damage asc)
      const sortedWorst = [...eligibleForWorst].sort((a, b) => a.kills - b.kills || a.avgKills - b.avgKills || a.damage - b.damage);
      const bottom3 = sortedWorst.slice(0, 3);

      results.push({
        roundName: rd.toUpperCase().includes('RODADA') ? rd : `RODADA ${rd}`,
        totalMatches: Math.max(...playerList.map(p => p.matches), 0),
        top3,
        bottom3,
        allPlayers: sortedBest
      });
    }

    return results;
  }, [data.players, data.playersDimension, data.teamsReference]);

  // Cálculo dos dados por MAPA
  const mapsMomentum = useMemo(() => {
    const validEntries = data.players.filter(p => {
      const pName = p.PLAYER?.trim();
      const mapa = p.MAPA?.trim();
      return pName && mapa;
    });

    const results = [];

    for (const mapConfig of MAPS_CONFIG) {
      const mapPlayers = validEntries.filter(p => {
        const m = normalize(p.MAPA);
        return m === normalize(mapConfig.id) || m === normalize(mapConfig.name) || m.startsWith(normalize(mapConfig.id));
      });

      if (mapPlayers.length === 0) continue;

      const playerMap = new Map<string, {
        name: string;
        team: string;
        kills: number;
        damage: number;
        hs: number;
        mvp: number;
        matches: number;
      }>();

      mapPlayers.forEach(p => {
        const name = p.PLAYER.trim();
        const team = p.TIME?.trim() || '';
        const kills = parseNumber(p.Abates);
        const damage = parseNumber(p.Dano);
        const hs = parseNumber(p.HS);
        const mvp = parseNumber(p.MVP);

        if (!playerMap.has(name)) {
          playerMap.set(name, {
            name,
            team,
            kills: 0,
            damage: 0,
            hs: 0,
            mvp: 0,
            matches: 0
          });
        }

        const stat = playerMap.get(name)!;
        if (team && !stat.team) stat.team = team;
        stat.kills += kills;
        stat.damage += damage;
        stat.hs += hs;
        stat.mvp += mvp;
        stat.matches += 1;
      });

      const playerList: PlayerRoundStat[] = Array.from(playerMap.values()).map(p => {
        const matches = p.matches || 1;
        return {
          ...p,
          playerImg: findDimImg(data.playersDimension, p.name) || '',
          teamImg: findTeamLogo(p.team, data.teamsReference),
          avgKills: Number((p.kills / matches).toFixed(2)),
          avgDmg: Number((p.damage / matches).toFixed(0))
        };
      });

      // Top 3 Melhores do Mapa
      const sortedBest = [...playerList].sort((a, b) => b.kills - a.kills || b.avgKills - a.avgKills || b.damage - a.damage);
      const top3 = sortedBest.slice(0, 3);

      // Piores do Mapa (jogadores com pelo menos 4 salas jogadas no mapa)
      let eligibleForWorst = playerList.filter(p => p.matches >= 4);
      if (eligibleForWorst.length < 3) {
        eligibleForWorst = playerList.filter(p => p.matches >= 2);
      }
      if (eligibleForWorst.length < 3) {
        eligibleForWorst = playerList;
      }

      const sortedWorst = [...eligibleForWorst].sort((a, b) => a.kills - b.kills || a.avgKills - b.avgKills || a.damage - b.damage);
      const bottom3 = sortedWorst.slice(0, 3);

      results.push({
        mapConfig,
        totalPlayers: playerList.length,
        top3,
        bottom3,
        allPlayers: sortedBest
      });
    }

    return results;
  }, [data.players, data.playersDimension, data.teamsReference]);

  const filteredRounds = useMemo(() => {
    let list = roundsMomentum;
    if (selectedRoundFilter !== 'ALL') {
      list = list.filter(r => normalize(r.roundName).includes(normalize(selectedRoundFilter)));
    }
    if (searchTerm.trim()) {
      const q = normalize(searchTerm);
      list = list.map(r => ({
        ...r,
        top3: r.top3.filter(p => normalize(p.name).includes(q) || normalize(p.team).includes(q)),
        bottom3: r.bottom3.filter(p => normalize(p.name).includes(q) || normalize(p.team).includes(q))
      })).filter(r => r.top3.length > 0 || r.bottom3.length > 0);
    }
    return list;
  }, [roundsMomentum, selectedRoundFilter, searchTerm]);

  const filteredMaps = useMemo(() => {
    let list = mapsMomentum;
    if (searchTerm.trim()) {
      const q = normalize(searchTerm);
      list = list.map(m => ({
        ...m,
        top3: m.top3.filter(p => normalize(p.name).includes(q) || normalize(p.team).includes(q)),
        bottom3: m.bottom3.filter(p => normalize(p.name).includes(q) || normalize(p.team).includes(q))
      })).filter(m => m.top3.length > 0 || m.bottom3.length > 0);
    }
    return list;
  }, [mapsMomentum, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Principal */}
      <div className="flex flex-col items-center justify-center text-center py-8 bg-gradient-to-b from-[#16161a] to-[#0d0d10] rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Flame size={140} />
        </div>
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center text-black mb-4 shadow-[0_0_30px_rgba(234,179,8,0.35)] rotate-3">
          <Flame size={34} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-widest italic mb-2">
          Destaques de Jogadores (Top & Bottom)
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm max-w-2xl px-4 leading-relaxed">
          Estatísticas exclusivas de desempenho individual: acompanhe os <strong className="text-green-400">Top 3 Melhores</strong> e os <strong className="text-red-400">Top 3 Piores</strong> atletas por <strong className="text-yellow-400">Rodada</strong> e por <strong className="text-yellow-400">Mapa</strong> com médias calculadas e salas jogadas.
        </p>

        {/* Barra de Navegação entre Rodada e Mapa */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6 bg-black/60 p-1.5 rounded-2xl border border-white/10 shadow-inner">
          <button
            onClick={() => setViewMode('rounds')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'rounds'
                ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-105'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar size={15} /> Por Rodada
          </button>
          <button
            onClick={() => setViewMode('maps')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'maps'
                ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-105'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MapPin size={15} /> Por Mapa
          </button>
        </div>

        {/* Filtros Auxiliares */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4 px-4 w-full max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar jogador ou time..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-black/80 text-white pl-9 pr-4 py-2 rounded-xl text-xs border border-gray-800 focus:border-yellow-500 focus:outline-none placeholder-gray-600 transition-colors"
            />
          </div>
          {viewMode === 'rounds' && (
            <select
              value={selectedRoundFilter}
              onChange={e => setSelectedRoundFilter(e.target.value)}
              className="bg-black/80 text-white px-3 py-2 rounded-xl text-xs border border-gray-800 focus:border-yellow-500 focus:outline-none font-bold uppercase transition-colors"
            >
              <option value="ALL">Todas as Rodadas</option>
              {roundsMomentum.map(r => (
                <option key={r.roundName} value={r.roundName}>
                  {r.roundName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* VISÃO: POR RODADA */}
      {viewMode === 'rounds' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRounds.map((rdData, idx) => (
            <div
              key={idx}
              className="bg-[#151518] rounded-[28px] border border-gray-800/80 overflow-hidden shadow-2xl flex flex-col hover:border-gray-700 transition-all duration-300 group"
            >
              {/* Topo da Rodada */}
              <div className="bg-gradient-to-r from-[#1c1c22] via-[#16161b] to-black px-6 py-4 flex items-center justify-between border-b border-gray-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-widest italic">
                      {rdData.roundName}
                    </h3>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      Resumo Individual
                    </span>
                  </div>
                </div>
                <div className="bg-black/50 px-2.5 py-1 rounded-md border border-white/5 text-[10px] font-black text-gray-400 uppercase">
                  {rdData.allPlayers.length} Atletas
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col gap-5">
                {/* BLOCO TOP 3 MELHORES (EM ALTA) */}
                <div className="bg-gradient-to-b from-green-500/10 via-green-500/5 to-transparent rounded-2xl p-4 border border-green-500/20 shadow-lg">
                  <div className="flex items-center justify-between mb-3 border-b border-green-500/20 pb-2">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={16} className="text-green-400" />
                      <span className="text-xs font-black text-green-400 uppercase tracking-widest">
                        Top 3 Melhores
                      </span>
                    </div>
                    <span className="text-[9px] text-green-500/80 font-bold uppercase tracking-wider">
                      Em Alta 🔥
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {rdData.top3.map((player, tIdx) => {
                      const medalColor =
                        tIdx === 0
                          ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                          : tIdx === 1
                          ? 'bg-slate-300 text-black'
                          : 'bg-amber-700 text-white';

                      return (
                        <div
                          key={tIdx}
                          onClick={() => onSelectPlayer && onSelectPlayer(player.name)}
                          className={`flex items-center justify-between bg-black/60 hover:bg-black/90 p-2.5 rounded-xl border border-white/5 hover:border-green-500/30 transition-all ${
                            onSelectPlayer ? 'cursor-pointer' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Posição */}
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 ${medalColor}`}
                            >
                              {tIdx + 1}º
                            </div>

                            {/* Foto do Jogador */}
                            <div className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center relative">
                              {player.playerImg ? (
                                <img
                                  src={player.playerImg}
                                  alt={player.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <User size={18} className="text-gray-500" />
                              )}
                              {player.teamImg && (
                                <img
                                  src={player.teamImg}
                                  alt={player.team}
                                  className="absolute bottom-0 right-0 w-3.5 h-3.5 object-contain bg-black/80 rounded-full p-0.5 border border-gray-600"
                                />
                              )}
                            </div>

                            {/* Nome e Time */}
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-black text-white truncate uppercase hover:text-yellow-400 transition-colors">
                                {player.name}
                              </span>
                              <span className="text-[9px] text-gray-400 font-bold truncate uppercase">
                                {player.team}
                              </span>
                            </div>
                          </div>

                          {/* Estatísticas */}
                          <div className="text-right shrink-0 pl-2">
                            <span className="block text-sm font-black text-green-400 italic leading-none">
                              {player.kills} <span className="text-[10px] uppercase font-bold">abts</span>
                            </span>
                            <div className="flex items-center justify-end gap-1.5 mt-1">
                              <span className="text-[9px] text-gray-400 font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                {player.matches} {player.matches === 1 ? 'sala' : 'salas'}
                              </span>
                              <span className="text-[9px] text-yellow-400 font-black">
                                {player.avgKills.toFixed(2)} K/S
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* BLOCO TOP 3 PIORES (EM BAIXA) */}
                <div className="bg-gradient-to-b from-red-500/10 via-red-500/5 to-transparent rounded-2xl p-4 border border-red-500/20 shadow-lg mt-auto">
                  <div className="flex items-center justify-between mb-3 border-b border-red-500/20 pb-2">
                    <div className="flex items-center gap-1.5">
                      <TrendingDown size={16} className="text-red-400" />
                      <span className="text-xs font-black text-red-400 uppercase tracking-widest">
                        Top 3 Piores
                      </span>
                    </div>
                    <span className="text-[9px] text-red-500/80 font-bold uppercase tracking-wider">
                      Em Baixa ⚠️
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {rdData.bottom3.map((player, tIdx) => (
                      <div
                        key={tIdx}
                        onClick={() => onSelectPlayer && onSelectPlayer(player.name)}
                        className={`flex items-center justify-between bg-black/60 hover:bg-black/90 p-2.5 rounded-xl border border-white/5 hover:border-red-500/30 transition-all ${
                          onSelectPlayer ? 'cursor-pointer' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-gray-900 border border-red-500/30 flex items-center justify-center text-red-400 text-[10px] font-black shrink-0">
                            <AlertTriangle size={12} />
                          </div>

                          <div className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center relative">
                            {player.playerImg ? (
                              <img
                                src={player.playerImg}
                                alt={player.name}
                                className="w-full h-full object-cover grayscale opacity-80"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <User size={18} className="text-gray-500" />
                            )}
                            {player.teamImg && (
                              <img
                                src={player.teamImg}
                                alt={player.team}
                                className="absolute bottom-0 right-0 w-3.5 h-3.5 object-contain bg-black/80 rounded-full p-0.5 border border-gray-600"
                              />
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-gray-300 truncate uppercase">
                              {player.name}
                            </span>
                            <span className="text-[9px] text-gray-500 font-bold truncate uppercase">
                              {player.team}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <span className="block text-sm font-black text-red-400 italic leading-none">
                            {player.kills} <span className="text-[10px] uppercase font-bold">abts</span>
                          </span>
                          <div className="flex items-center justify-end gap-1.5 mt-1">
                            <span className="text-[9px] text-gray-500 font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                              {player.matches} {player.matches === 1 ? 'sala' : 'salas'}
                            </span>
                            <span className="text-[9px] text-gray-400 font-black">
                              {player.avgKills.toFixed(2)} K/S
                            </span>
                          </div>
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

      {/* VISÃO: POR MAPA */}
      {viewMode === 'maps' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMaps.map((mapData, idx) => (
            <div
              key={idx}
              className="bg-[#151518] rounded-[28px] border border-gray-800/80 overflow-hidden shadow-2xl flex flex-col hover:border-gray-700 transition-all duration-300 group"
            >
              {/* Header com Banner do Mapa */}
              <div className="relative h-28 overflow-hidden">
                <div className="absolute inset-0 bg-black/50 z-10" />
                <img
                  src={mapData.mapConfig.url}
                  alt={mapData.mapConfig.name}
                  className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#151518] via-transparent to-transparent z-20" />
                <div className="absolute bottom-3 left-5 z-30 flex items-center justify-between right-5">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-yellow-500" />
                    <h3 className="text-xl font-black text-white uppercase tracking-widest italic drop-shadow-md">
                      {mapData.mapConfig.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-black text-yellow-400 bg-black/60 px-2.5 py-1 rounded-md border border-yellow-500/20 uppercase">
                    {mapData.mapConfig.id}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col gap-5">
                {/* BLOCO TOP 3 MELHORES NO MAPA */}
                <div className="bg-gradient-to-b from-green-500/10 via-green-500/5 to-transparent rounded-2xl p-4 border border-green-500/20 shadow-lg">
                  <div className="flex items-center justify-between mb-3 border-b border-green-500/20 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Crown size={16} className="text-yellow-400" />
                      <span className="text-xs font-black text-green-400 uppercase tracking-widest">
                        Reis do Mapa (Top 3)
                      </span>
                    </div>
                    <span className="text-[9px] text-green-400 font-bold uppercase tracking-wider">
                      Mais Fatais 🎯
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {mapData.top3.map((player, tIdx) => {
                      const medalColor =
                        tIdx === 0
                          ? 'bg-yellow-500 text-black shadow-[0_0_12px_rgba(234,179,8,0.5)] font-black'
                          : tIdx === 1
                          ? 'bg-slate-300 text-black font-bold'
                          : 'bg-amber-700 text-white font-bold';

                      return (
                        <div
                          key={tIdx}
                          onClick={() => onSelectPlayer && onSelectPlayer(player.name)}
                          className={`flex items-center justify-between bg-black/60 hover:bg-black/90 p-2.5 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-all ${
                            onSelectPlayer ? 'cursor-pointer' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] shrink-0 ${medalColor}`}
                            >
                              {tIdx + 1}º
                            </div>

                            <div className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center relative">
                              {player.playerImg ? (
                                <img
                                  src={player.playerImg}
                                  alt={player.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <User size={18} className="text-gray-500" />
                              )}
                              {player.teamImg && (
                                <img
                                  src={player.teamImg}
                                  alt={player.team}
                                  className="absolute bottom-0 right-0 w-3.5 h-3.5 object-contain bg-black/80 rounded-full p-0.5 border border-gray-600"
                                />
                              )}
                            </div>

                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-black text-white truncate uppercase hover:text-yellow-400 transition-colors">
                                {player.name}
                              </span>
                              <span className="text-[9px] text-gray-400 font-bold truncate uppercase">
                                {player.team}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-2">
                            <span className="block text-sm font-black text-green-400 italic leading-none">
                              {player.kills} <span className="text-[10px] uppercase font-bold">abts</span>
                            </span>
                            <div className="flex items-center justify-end gap-1.5 mt-1">
                              <span className="text-[9px] text-gray-400 font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                {player.matches} {player.matches === 1 ? 'sala' : 'salas'}
                              </span>
                              <span className="text-[9px] text-yellow-400 font-black">
                                {player.avgKills.toFixed(2)} K/S
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* BLOCO TOP 3 PIORES NO MAPA */}
                <div className="bg-gradient-to-b from-red-500/10 via-red-500/5 to-transparent rounded-2xl p-4 border border-red-500/20 shadow-lg mt-auto">
                  <div className="flex items-center justify-between mb-3 border-b border-red-500/20 pb-2">
                    <div className="flex items-center gap-1.5">
                      <TrendingDown size={16} className="text-red-400" />
                      <span className="text-xs font-black text-red-400 uppercase tracking-widest">
                        Em Baixa no Mapa
                      </span>
                    </div>
                    <span className="text-[9px] text-red-500/80 font-bold uppercase tracking-wider">
                      Dificuldade ⚠️
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {mapData.bottom3.map((player, tIdx) => (
                      <div
                        key={tIdx}
                        onClick={() => onSelectPlayer && onSelectPlayer(player.name)}
                        className={`flex items-center justify-between bg-black/60 hover:bg-black/90 p-2.5 rounded-xl border border-white/5 hover:border-red-500/30 transition-all ${
                          onSelectPlayer ? 'cursor-pointer' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-gray-900 border border-red-500/30 flex items-center justify-center text-red-400 text-[10px] font-black shrink-0">
                            <AlertTriangle size={12} />
                          </div>

                          <div className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center relative">
                            {player.playerImg ? (
                              <img
                                src={player.playerImg}
                                alt={player.name}
                                className="w-full h-full object-cover grayscale opacity-80"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <User size={18} className="text-gray-500" />
                            )}
                            {player.teamImg && (
                              <img
                                src={player.teamImg}
                                alt={player.team}
                                className="absolute bottom-0 right-0 w-3.5 h-3.5 object-contain bg-black/80 rounded-full p-0.5 border border-gray-600"
                              />
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-gray-300 truncate uppercase">
                              {player.name}
                            </span>
                            <span className="text-[9px] text-gray-500 font-bold truncate uppercase">
                              {player.team}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <span className="block text-sm font-black text-red-400 italic leading-none">
                            {player.kills} <span className="text-[10px] uppercase font-bold">abts</span>
                          </span>
                          <div className="flex items-center justify-end gap-1.5 mt-1">
                            <span className="text-[9px] text-gray-500 font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                              {player.matches} {player.matches === 1 ? 'sala' : 'salas'}
                            </span>
                            <span className="text-[9px] text-gray-400 font-black">
                              {player.avgKills.toFixed(2)} K/S
                            </span>
                          </div>
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
export default PlayerMomentum;
