import React, { useState, useMemo, useRef } from 'react';
import { DashboardData } from '../types';
import { Download, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import { findTeamLogo } from '../utils/teamUtils';
import { findDimImg } from '../utils/skillImages';
import { Flame, Crosshair, AlertTriangle, Target as TargetIcon, Skull, Activity, Shield, Star, Crown, Map as MapIcon, Swords, User, Users, Zap } from 'lucide-react';

interface BannersProps {
  data: DashboardData;
}

export const formatMapName = (rawMap: string | undefined | null): string => {
  if (!rawMap) return '';
  const trimmed = rawMap.trim();
  const upper = trimmed.toUpperCase();

  const MAP_NAMES: Record<string, string> = {
    'BER': 'BERMUDA',
    'BERMUDA': 'BERMUDA',
    'KAL': 'KALAHARI',
    'KALAHARI': 'KALAHARI',
    'NT': 'NOVA TERRA',
    'NOV': 'NOVA TERRA',
    'NOVATERRA': 'NOVA TERRA',
    'NOVA TERRA': 'NOVA TERRA',
    'PUR': 'PURGATÓRIO',
    'PURG': 'PURGATÓRIO',
    'PURGATORIO': 'PURGATÓRIO',
    'PURGATÓRIO': 'PURGATÓRIO',
    'SOL': 'SOLARA',
    'SOLARA': 'SOLARA',
    'ALP': 'ALPINE',
    'ALPINE': 'ALPINE',
    'NEX': 'NOVA TERRA',
    'NEXTERRA': 'NOVA TERRA'
  };

  return MAP_NAMES[upper] || upper;
};

const parseNumber = (val: string | number | undefined | null): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
  
  let str = val.toString().trim();
  if (!str) return 0;
  
  if (/^-?\d{1,3}([.,]\d{3})+$/.test(str)) {
      str = str.replace(/[.,]/g, '');
  } else {
      str = str.replace(',', '.');
  }

  if (/^-?\d+$/.test(str)) return parseInt(str, 10);
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num);
};

const PlayerStatCard = ({ title, data, statKey, avgKey, statLabel, color }: any) => {
  const titleClass = color === 'red' ? 'bg-red-500' : color === 'orange' ? 'bg-orange-500' : color === 'purple' ? 'bg-purple-500' : 'bg-blue-500';
  const borderClass = color === 'red' ? 'border-red-500/20' : color === 'orange' ? 'border-orange-500/20' : color === 'purple' ? 'border-purple-500/20' : 'border-blue-500/20';
  const shadowClass = color === 'red' ? 'shadow-[0_10px_30px_rgba(239,68,68,0.3)]' : color === 'orange' ? 'shadow-[0_10px_30px_rgba(249,115,22,0.3)]' : color === 'purple' ? 'shadow-[0_10px_30px_rgba(168,85,247,0.3)]' : 'shadow-[0_10px_30px_rgba(59,130,246,0.3)]';

  return (
    <div className={`bg-black/50 p-6 rounded-3xl border ${borderClass} backdrop-blur-sm relative flex flex-col h-full`}>
      <div className={`absolute -top-6 left-6 ${titleClass} text-white px-4 py-2 rounded-xl font-black text-xl uppercase tracking-widest italic ${shadowClass}`}>
        {title}
      </div>
      <div className="flex-1 flex flex-col justify-evenly mt-4 gap-6">
        {data.map((player: any, idx: number) => {
          const isFirst = idx === 0;
          return (
            <div key={player.name} className={`flex items-center gap-4 ${isFirst ? 'scale-105 origin-left' : 'opacity-90'}`}>
              <div className="text-gray-400 font-bold text-xl w-8 text-right">#{idx + 1}</div>
              <div className={`w-20 h-20 rounded-full border-4 ${isFirst ? 'border-white' : 'border-white/20'} bg-black overflow-hidden flex-shrink-0 relative`}>
                {player.playerImg ? (
                  <img src={player.playerImg} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xl font-black uppercase flex items-center justify-center w-full h-full">{player.name.substring(0,3)}</span>
                )}
                {player.teamImg && (
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-black rounded-full border border-gray-800 p-0.5 z-10">
                    <img src={player.teamImg} alt="team" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-black text-2xl uppercase truncate">{player.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-yellow-400 font-black text-2xl">{player[statKey]} <span className="text-sm text-yellow-600">{statLabel}</span></p>
                  <span className="text-gray-500 font-mono text-sm uppercase font-bold">(Média: {player[avgKey]} | {player.matches} Quedas)</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
};


const FifaCard = ({ 
  data, 
  mode, 
  selectedId, 
  selectedRd = 'all', 
  selectedQueda = 'all' 
}: { 
  data: any; 
  mode: 'player' | 'team'; 
  selectedId: string; 
  selectedRd?: string; 
  selectedQueda?: string; 
}) => {
  const [isFlipped, setIsFlipped] = React.useState(false);

  const { stats, topWeapon, mapStats, safeStats, info, rank, topVictims, topVictimTeams, filterLabel, teamPlayers } = React.useMemo(() => {
    const emptyStats = { 
      kills: 0, matches: 0, damage: 0, hs: 0, knocks: 0, assists: 0, mvp: 0, 
      matchesWithKills: 0, matchesZeroKills: 0, killContribution: '0',
      pts: 0, ptsc: 0, booyahs: 0, booyahRate: '0', top3Count: 0, top3Rate: '0',
      avgPts: '0', avgKills: '0', avgPtsc: '0', avgDamage: '0', avgKnocks: '0', avgHs: '0', avgAssists: '0'
    };

    const filterText = (selectedRd === 'all' && selectedQueda === 'all')
      ? 'FFWS 2026 • GERAL'
      : (selectedRd !== 'all' && selectedQueda !== 'all')
      ? `RODADA ${selectedRd} • QUEDA ${selectedQueda}`
      : selectedRd !== 'all'
      ? `RODADA ${selectedRd}`
      : `QUEDA ${selectedQueda}`;

    if (!selectedId) {
      return { 
        stats: emptyStats, 
        topWeapon: 'NENHUMA', 
        mapStats: [], 
        safeStats: [], 
        info: { name: '', subtitle: '', img: '', teamImg: '', weaponImg: '', role: '' }, 
        rank: 0, 
        topVictims: [], 
        topVictimTeams: [],
        filterLabel: filterText,
        teamPlayers: []
      };
    }

    // Filter helpers
    const isRowMatching = (r: { RD?: any; Q?: any }) => {
      if (selectedRd && selectedRd !== 'all') {
        const rdVal = (r.RD ?? '').toString().trim();
        if (rdVal !== selectedRd.toString().trim()) return false;
      }
      if (selectedQueda && selectedQueda !== 'all') {
        const qVal = (r.Q ?? '').toString().trim();
        if (qVal !== selectedQueda.toString().trim()) return false;
      }
      return true;
    };

    const filteredPlayers = data.players.filter(isRowMatching);
    const filteredDetails = data.details.filter(isRowMatching);
    const filteredKillFeed = data.killFeed.filter(isRowMatching);

    let kills = 0, matches = 0, damage = 0, hs = 0, knocks = 0, assists = 0, mvp = 0;
    let pts = 0, ptsc = 0, booyahs = 0, top3Count = 0;
    let matchesWithKills = 0, matchesZeroKills = 0;
    const mapCount: Record<string, { kills: number, matches: number }> = {};
    const safeCount: Record<string, number> = {};
    const weaponCount: Record<string, number> = {};
    const victimPlayerCount: Record<string, number> = {};
    const victimTeamCount: Record<string, number> = {};

    let img = '';
    let name = selectedId;
    let subtitle = '';
    let teamImg = '';
    let role = '';
    let killContribution = '0';
    let rank = 0;

    const teamPlayers: Array<{
      name: string;
      img: string;
      role: string;
      kills: number;
      damage: number;
      hs: number;
      knocks: number;
      assists: number;
      mvp: number;
      matches: number;
      killShare: string;
      avgKills: string;
      avgDamage: string;
    }> = [];

    if (mode === 'player') {
      const pDim = data.playersDimension?.find((d: any) => d.Name === selectedId);
      img = pDim ? pDim.IMG : '';
      role = pDim ? pDim.Funcao || '' : '';
      
      let pTeam = '';
      filteredPlayers.forEach((p: any) => {
        if (p.PLAYER === selectedId) {
          const k = parseNumber(p.Abates);
          kills += k;
          damage += parseNumber(p.Dano);
          hs += parseNumber(p.HS);
          knocks += parseNumber(p.Deitados);
          assists += parseNumber(p.Assistencias);
          mvp += parseNumber(p.MVP);
          matches += 1;
          if (!pTeam && p.TIME) pTeam = p.TIME;

          if (k > 0) matchesWithKills++;
          else matchesZeroKills++;
        }
      });

      // Fallback team lookup if no matches found in current filter
      if (!pTeam) {
        pTeam = data.players.find((p: any) => p.PLAYER === selectedId)?.TIME || '';
      }

      subtitle = pTeam;
      if (pTeam) {
        teamImg = findTeamLogo(pTeam, data.teamsReference) || '';
      }

      let teamTotalKills = 0;
      filteredPlayers.forEach((p: any) => {
        if (p.TIME === pTeam) {
          teamTotalKills += parseNumber(p.Abates);
        }
      });
      killContribution = teamTotalKills > 0 ? ((kills / teamTotalKills) * 100).toFixed(1) : '0';

      const playerMap = new Map<string, number>();
      filteredPlayers.forEach((p: any) => {
        const k = parseNumber(p.Abates);
        playerMap.set(p.PLAYER, (playerMap.get(p.PLAYER) || 0) + k);
      });
      const sorted = Array.from(playerMap.entries()).sort((a, b) => b[1] - a[1]);
      const idx = sorted.findIndex(s => s[0] === selectedId);
      rank = idx !== -1 ? idx + 1 : 0;

      filteredKillFeed.forEach((k: any) => {
        if (k.PLAYER === selectedId) {
          if (k.ARMA) weaponCount[k.ARMA] = (weaponCount[k.ARMA] || 0) + 1;
          if (k.MAPA) {
            const m = formatMapName(k.MAPA);
            if (!mapCount[m]) mapCount[m] = { kills: 0, matches: 0 };
            mapCount[m].kills += 1;
          }
          if (k.SAFE) safeCount[k.SAFE] = (safeCount[k.SAFE] || 0) + 1;
          
          if (k.VITIMA) {
            victimPlayerCount[k.VITIMA] = (victimPlayerCount[k.VITIMA] || 0) + 1;
            const vTeam = data.players.find((p: any) => p.PLAYER === k.VITIMA)?.TIME;
            if (vTeam) {
              victimTeamCount[vTeam] = (victimTeamCount[vTeam] || 0) + 1;
            }
          }
        }
      });

      filteredDetails.forEach((d: any) => {
        if (d.TIME === pTeam && d.MAPA) {
          const m = formatMapName(d.MAPA);
          if (!mapCount[m]) mapCount[m] = { kills: 0, matches: 0 };
          mapCount[m].matches += 1;
        }
      });

    } else {
      // Team Mode
      const teamLogo = findTeamLogo(selectedId, data.teamsReference);
      img = teamLogo || '';
      teamImg = teamLogo || '';

      const teamRef = data.teamsReference?.find((t: any) => t.TIME === selectedId);
      subtitle = teamRef?.GRUPO ? `GRUPO ${teamRef.GRUPO}` : 'EQUIPE FFWS';

      filteredDetails.forEach((d: any) => {
        if (d.TIME === selectedId) {
          const rowAbts = parseNumber(d.ABTS);
          const rowPtsc = parseNumber(d.PTSC);
          const rowPts = parseNumber(d.PTS) || (rowPtsc + rowAbts);
          const rowPos = parseNumber(d.POS);
          const rowB = parseNumber(d.B);

          kills += rowAbts;
          ptsc += rowPtsc;
          pts += rowPts;
          matches += 1;

          if (rowPos === 1 || rowB === 1) {
            booyahs += 1;
          }
          if (rowPos >= 1 && rowPos <= 3) {
            top3Count += 1;
          }
          if (rowAbts > 0) {
            matchesWithKills += 1;
          } else {
            matchesZeroKills += 1;
          }

          if (d.MAPA) {
            const m = formatMapName(d.MAPA);
            if (!mapCount[m]) mapCount[m] = { kills: 0, matches: 0 };
            mapCount[m].matches += 1;
          }
        }
      });

      filteredPlayers.forEach((p: any) => {
        if (p.TIME === selectedId) {
          damage += parseNumber(p.Dano);
          hs += parseNumber(p.HS);
          knocks += parseNumber(p.Deitados);
          assists += parseNumber(p.Assistencias);
          mvp += parseNumber(p.MVP);
        }
      });

      // Calculate roster of team players
      const pMap = new Map<string, {
        name: string;
        kills: number;
        damage: number;
        hs: number;
        knocks: number;
        assists: number;
        mvp: number;
        matches: number;
      }>();

      filteredPlayers.forEach((p: any) => {
        if (p.TIME === selectedId && p.PLAYER) {
          const cur = pMap.get(p.PLAYER) || {
            name: p.PLAYER,
            kills: 0,
            damage: 0,
            hs: 0,
            knocks: 0,
            assists: 0,
            mvp: 0,
            matches: 0
          };
          cur.kills += parseNumber(p.Abates);
          cur.damage += parseNumber(p.Dano);
          cur.hs += parseNumber(p.HS);
          cur.knocks += parseNumber(p.Deitados);
          cur.assists += parseNumber(p.Assistencias);
          cur.mvp += parseNumber(p.MVP);
          cur.matches += 1;
          pMap.set(p.PLAYER, cur);
        }
      });

      // Fallback: make sure all registered players for this team in data.players exist in the map
      data.players.forEach((p: any) => {
        if (p.TIME === selectedId && p.PLAYER && !pMap.has(p.PLAYER)) {
          pMap.set(p.PLAYER, {
            name: p.PLAYER,
            kills: 0,
            damage: 0,
            hs: 0,
            knocks: 0,
            assists: 0,
            mvp: 0,
            matches: 0
          });
        }
      });

      Array.from(pMap.values()).forEach(p => {
        const pDim = data.playersDimension?.find((d: any) => d.Name === p.name || d.PLAYER === p.name);
        const killShare = kills > 0 ? ((p.kills / kills) * 100).toFixed(0) : '0';
        const avgKills = p.matches > 0 ? (p.kills / p.matches).toFixed(1) : '0';
        const avgDamage = p.matches > 0 ? (p.damage / p.matches).toFixed(0) : '0';
        teamPlayers.push({
          ...p,
          img: pDim ? pDim.IMG : '',
          role: pDim ? pDim.Funcao || '' : '',
          killShare,
          avgKills,
          avgDamage
        });
      });

      teamPlayers.sort((a, b) => b.kills - a.kills || b.damage - a.damage);

      // Team rank in filtered period
      const teamMap = new Map<string, { pts: number; kills: number }>();
      filteredDetails.forEach((d: any) => {
        const t = d.TIME;
        if (!t) return;
        const current = teamMap.get(t) || { pts: 0, kills: 0 };
        const rowAbts = parseNumber(d.ABTS);
        const rowPtsc = parseNumber(d.PTSC);
        const rowPts = parseNumber(d.PTS) || (rowPtsc + rowAbts);
        teamMap.set(t, {
          pts: current.pts + rowPts,
          kills: current.kills + rowAbts,
        });
      });
      const sortedTeams = Array.from(teamMap.entries()).sort((a, b) => {
        if (b[1].pts !== a[1].pts) return b[1].pts - a[1].pts;
        return b[1].kills - a[1].kills;
      });
      const idx = sortedTeams.findIndex(s => s[0] === selectedId);
      rank = idx !== -1 ? idx + 1 : 0;

      // KillFeed for Team
      filteredKillFeed.forEach((k: any) => {
        const pTeam = data.players.find((p: any) => p.PLAYER === k.PLAYER)?.TIME;
        if (pTeam === selectedId) {
          if (k.ARMA) weaponCount[k.ARMA] = (weaponCount[k.ARMA] || 0) + 1;
          if (k.MAPA) {
            const m = formatMapName(k.MAPA);
            if (!mapCount[m]) mapCount[m] = { kills: 0, matches: 0 };
            mapCount[m].kills += 1;
          }
          if (k.SAFE) safeCount[k.SAFE] = (safeCount[k.SAFE] || 0) + 1;
          
          if (k.VITIMA) {
            victimPlayerCount[k.VITIMA] = (victimPlayerCount[k.VITIMA] || 0) + 1;
            const vTeam = data.players.find((p: any) => p.PLAYER === k.VITIMA)?.TIME;
            if (vTeam) {
              victimTeamCount[vTeam] = (victimTeamCount[vTeam] || 0) + 1;
            }
          }
        }
      });
    }

    let topWeapon = 'NENHUMA';
    let maxW = 0;
    for (const [w, c] of Object.entries(weaponCount)) {
      if (c > maxW) { maxW = c; topWeapon = w; }
    }
    
    let weaponImg = '';
    if (topWeapon !== 'NENHUMA' && data.weapons) {
      const wDim = data.weapons.find((w: any) => w.Arma?.toUpperCase() === topWeapon.toUpperCase());
      if (wDim) weaponImg = wDim.IMG;
    }
    
    const topVictims = Object.entries(victimPlayerCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([n, c]) => {
        const pDim = data.playersDimension?.find((d: any) => d.Name === n);
        return { name: n, count: c, img: pDim ? pDim.IMG : '' };
      });

    const topVictimTeams = Object.entries(victimTeamCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([n, c]) => {
        return { name: n, count: c, img: findTeamLogo(n, data.teamsReference) || '' };
      });

    const booyahRate = matches > 0 ? ((booyahs / matches) * 100).toFixed(1) : '0';
    const top3Rate = matches > 0 ? ((top3Count / matches) * 100).toFixed(1) : '0';
    const avgPts = matches > 0 ? (pts / matches).toFixed(1) : '0';
    const avgKills = matches > 0 ? (kills / matches).toFixed(1) : '0';
    const avgPtsc = matches > 0 ? (ptsc / matches).toFixed(1) : '0';
    const avgDamage = matches > 0 ? (damage / matches).toFixed(0) : '0';
    const avgKnocks = matches > 0 ? (knocks / matches).toFixed(1) : '0';
    const avgHs = matches > 0 ? (hs / matches).toFixed(1) : '0';
    const avgAssists = matches > 0 ? (assists / matches).toFixed(1) : '0';

    return {
      stats: { 
        kills, matches, damage, hs, knocks, assists, mvp, matchesWithKills, matchesZeroKills, killContribution,
        pts, ptsc, booyahs, booyahRate, top3Count, top3Rate,
        avgPts, avgKills, avgPtsc, avgDamage, avgKnocks, avgHs, avgAssists
      },
      topWeapon,
      mapStats: Object.entries(mapCount).map(([k, v]) => ({ name: k, ...v })).sort((a, b) => b.kills - a.kills),
      safeStats: Object.entries(safeCount).map(([k, v]) => ({ name: k, kills: v })).sort((a, b) => parseInt(a.name) - parseInt(b.name)),
      info: { name, subtitle, img, teamImg, weaponImg, role },
      rank,
      topVictims,
      topVictimTeams,
      filterLabel: filterText,
      teamPlayers
    };
  }, [data, mode, selectedId, selectedRd, selectedQueda]);

  if (!selectedId) {
    return <div className="text-gray-500 font-bold uppercase tracking-widest h-96 flex items-center justify-center">Selecione um {mode === 'player' ? 'jogador' : 'time'} para gerar a carta.</div>;
  }

  return (
    <div className="flex justify-center my-8">
      <div 
        className="relative w-[360px] h-[580px] cursor-pointer group select-none" 
        style={{ perspective: '1200px', WebkitPerspective: '1200px' }} 
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className="w-full h-full relative transition-transform duration-700" 
          style={{ 
            transformStyle: 'preserve-3d', 
            WebkitTransformStyle: 'preserve-3d', 
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            WebkitTransform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front */}
          <div 
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 via-black to-neutral-950 p-4 border-[2px] border-zinc-700 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col items-center"
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg) translateZ(1px)',
              WebkitTransform: 'rotateY(0deg) translateZ(1px)',
              pointerEvents: isFlipped ? 'none' : 'auto',
              visibility: isFlipped ? 'hidden' : 'visible',
              transition: 'visibility 0s linear 0.35s'
            }}
          >
             {/* Rank Badge absolute top-center without 2D translate transform */}
             {rank > 0 && (
                 <div 
                     className="absolute top-0 inset-x-0 mx-auto w-fit bg-yellow-500 text-black px-4 py-1 rounded-b-xl border-x-2 border-b-2 border-yellow-600 font-black italic shadow-lg"
                     style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                 >
                     RANK #{rank}
                 </div>
             )}

             <div className="flex w-full items-start justify-between px-2 mb-1 mt-3" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                 {/* Team Badge Top Left */}
                 <div 
                     className="w-12 h-12 bg-zinc-900 rounded-lg border-2 border-white/20 shadow-lg p-1 overflow-hidden flex items-center justify-center"
                     style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                 >
                    {info.teamImg ? (
                        <img src={info.teamImg} alt={info.subtitle} className="w-full h-full object-contain" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }} />
                    ) : (
                        <span className="text-xs font-bold text-gray-500">{info.subtitle.substring(0,3)}</span>
                    )}
                 </div>

                 {/* Role / Group Top Right */}
                 {mode === 'player' ? (
                    info.role && (
                      <div className="bg-black/60 border border-white/20 rounded-md px-2 py-1" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                          <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{info.role}</span>
                      </div>
                    )
                 ) : (
                    <div className="bg-black/60 border border-white/20 rounded-md px-2 py-1" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                        <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{info.subtitle}</span>
                    </div>
                 )}
             </div>

             <div 
                 className="relative w-32 h-32 rounded-full bg-zinc-900 border-4 border-white/20 shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden mb-2 flex items-center justify-center p-1.5 -mt-8"
                 style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
             >
                {info.img ? (
                    <img 
                        src={info.img} 
                        alt={info.name} 
                        className={`w-full h-full ${mode === 'team' ? 'object-contain p-2' : 'object-cover'} rounded-full`} 
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    />
                ) : (
                    <span className="text-3xl font-black text-gray-500">{info.name.substring(0,3)}</span>
                )}
             </div>
             
             <h2 className="text-[28px] font-black italic text-white uppercase tracking-tighter shadow-black drop-shadow-md text-center leading-tight max-w-[280px] truncate">{info.name}</h2>
             
             {mode === 'player' ? (
                 <div className="bg-white/5 border border-white/10 rounded-full px-3 py-0.5 mt-1 mb-1.5">
                     <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-widest">
                         ⚡ {stats.killContribution}% Kills do Time
                     </span>
                 </div>
             ) : (
                 <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-full px-3 py-0.5 mt-1 mb-1.5 flex items-center gap-1.5">
                     <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                         🏆 {stats.booyahs} BOOYAHS ({stats.booyahRate}%)
                     </span>
                 </div>
             )}

             {/* Dynamic Stats Grid for Player vs Team */}
             {mode === 'player' ? (
               <>
                 <div className="grid grid-cols-3 gap-1.5 w-full mt-1">
                     <div className="bg-white/5 p-1.5 rounded-xl border border-white/10 text-center flex flex-col justify-center">
                        <span className="block text-lg font-black text-white italic leading-none">{stats.kills}</span>
                        <span className="text-[8px] uppercase font-bold text-yellow-300 mt-1">Abates</span>
                     </div>
                     <div className="bg-white/5 p-1.5 rounded-xl border border-white/10 text-center flex flex-col justify-center">
                        <span className="block text-lg font-black text-white italic leading-none">{stats.avgKills}</span>
                        <span className="text-[8px] uppercase font-bold text-yellow-300 mt-1">Média/Q</span>
                     </div>
                     <div className="bg-white/5 p-1.5 rounded-xl border border-white/10 text-center flex flex-col justify-center">
                        <span className="block text-lg font-black text-white italic leading-none">{stats.matches}</span>
                        <span className="text-[8px] uppercase font-bold text-yellow-300 mt-1">Partidas</span>
                     </div>
                     
                     <div className="bg-white/5 p-1 rounded-xl border border-white/10 text-center flex flex-col justify-center">
                        <span className="block text-lg font-black text-white italic leading-none">{stats.damage.toLocaleString('pt-BR')}</span>
                        <span className="text-[7.5px] text-gray-400 font-bold mt-0.5">AVG {stats.avgDamage}</span>
                        <span className="text-[8px] uppercase font-bold text-yellow-300 mt-0.5">Dano</span>
                     </div>
                     <div className="bg-white/5 p-1 rounded-xl border border-white/10 text-center flex flex-col justify-center">
                        <span className="block text-lg font-black text-white italic leading-none">{stats.hs}</span>
                        <span className="text-[7.5px] text-gray-400 font-bold mt-0.5">AVG {stats.avgHs}</span>
                        <span className="text-[8px] uppercase font-bold text-yellow-300 mt-0.5">HS</span>
                     </div>
                     <div className="bg-white/5 p-1 rounded-xl border border-white/10 text-center flex flex-col justify-center">
                        <span className="block text-lg font-black text-white italic leading-none">{stats.assists}</span>
                        <span className="text-[7.5px] text-gray-400 font-bold mt-0.5">AVG {stats.avgAssists}</span>
                        <span className="text-[8px] uppercase font-bold text-yellow-300 mt-0.5">Assist.</span>
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-1.5 w-full mt-1.5">
                     <div className="bg-white/5 p-1 rounded-xl border border-white/10 text-center flex flex-col justify-center">
                         <span className="block text-sm font-black text-white italic leading-none">{stats.knocks}</span>
                         <span className="text-[7.5px] text-gray-400 font-bold mt-0.5">AVG {stats.avgKnocks}</span>
                         <span className="text-[8px] uppercase font-bold text-yellow-300 mt-0.5">Deitados</span>
                     </div>
                     <div className="bg-white/5 p-1 rounded-xl border border-green-500/40 text-center flex flex-col justify-center">
                         <span className="block text-sm font-black text-green-400 italic leading-none">{stats.matchesWithKills}</span>
                         <span className="text-[7.5px] text-transparent font-bold mt-0.5 select-none">-</span>
                         <span className="text-[8px] uppercase font-bold text-green-300 mt-0.5">Q. c/ Kill</span>
                     </div>
                     <div className="bg-white/5 p-1 rounded-xl border border-red-500/40 text-center flex flex-col justify-center">
                         <span className="block text-sm font-black text-red-400 italic leading-none">{stats.matchesZeroKills}</span>
                         <span className="text-[7.5px] text-transparent font-bold mt-0.5 select-none">-</span>
                         <span className="text-[8px] uppercase font-bold text-red-300 mt-0.5">Q. Zerada</span>
                     </div>
                 </div>
               </>
             ) : (
               /* TEAM FRONT STATS */
               <>
                 <div className="grid grid-cols-3 gap-1.5 w-full mt-1">
                     <div className="bg-white/5 p-1.5 rounded-xl border border-yellow-500/30 text-center flex flex-col justify-center">
                        <span className="block text-lg font-black text-yellow-400 italic leading-none">{stats.pts}</span>
                        <span className="text-[7.5px] text-gray-400 font-bold mt-0.5">AVG {stats.avgPts}</span>
                        <span className="text-[8px] uppercase font-bold text-yellow-300 mt-0.5">Pontos Totais</span>
                     </div>
                     <div className="bg-white/5 p-1.5 rounded-xl border border-white/10 text-center flex flex-col justify-center">
                        <span className="block text-lg font-black text-white italic leading-none">{stats.kills}</span>
                        <span className="text-[7.5px] text-gray-400 font-bold mt-0.5">AVG {stats.avgKills}</span>
                        <span className="text-[8px] uppercase font-bold text-yellow-300 mt-0.5">Abates</span>
                     </div>
                     <div className="bg-white/5 p-1.5 rounded-xl border border-white/10 text-center flex flex-col justify-center">
                        <span className="block text-lg font-black text-white italic leading-none">{stats.matches}</span>
                        <span className="text-[7.5px] text-gray-400 font-bold mt-0.5">Disputadas</span>
                        <span className="text-[8px] uppercase font-bold text-yellow-300 mt-0.5">Quedas</span>
                     </div>
                     
                     <div className="bg-white/5 p-1 rounded-xl border border-yellow-500/20 text-center flex flex-col justify-center">
                        <span className="block text-lg font-black text-yellow-300 italic leading-none">{stats.booyahs}</span>
                        <span className="text-[7.5px] text-yellow-400 font-bold mt-0.5">{stats.booyahRate}%</span>
                        <span className="text-[8px] uppercase font-bold text-yellow-300 mt-0.5">Booyahs</span>
                     </div>
                     <div className="bg-white/5 p-1 rounded-xl border border-white/10 text-center flex flex-col justify-center">
                        <span className="block text-lg font-black text-white italic leading-none">{stats.ptsc}</span>
                        <span className="text-[7.5px] text-gray-400 font-bold mt-0.5">AVG {stats.avgPtsc}</span>
                        <span className="text-[8px] uppercase font-bold text-yellow-300 mt-0.5">Pts Coloc.</span>
                     </div>
                     <div className="bg-white/5 p-1 rounded-xl border border-white/10 text-center flex flex-col justify-center">
                        <span className="block text-lg font-black text-white italic leading-none">{stats.top3Count}</span>
                        <span className="text-[7.5px] text-gray-400 font-bold mt-0.5">{stats.top3Rate}%</span>
                        <span className="text-[8px] uppercase font-bold text-yellow-300 mt-0.5">Top 3</span>
                     </div>
                 </div>

                 <div className="grid grid-cols-3 gap-1.5 w-full mt-1.5">
                     <div className="bg-white/5 p-1 rounded-xl border border-white/10 text-center flex flex-col justify-center">
                         <span className="block text-sm font-black text-white italic leading-none">{stats.damage.toLocaleString('pt-BR')}</span>
                         <span className="text-[7.5px] text-gray-400 font-bold mt-0.5">AVG {stats.avgDamage}</span>
                         <span className="text-[8px] uppercase font-bold text-yellow-300 mt-0.5">Dano</span>
                     </div>
                     <div className="bg-white/5 p-1 rounded-xl border border-white/10 text-center flex flex-col justify-center">
                         <span className="block text-sm font-black text-white italic leading-none">{stats.knocks}</span>
                         <span className="text-[7.5px] text-gray-400 font-bold mt-0.5">AVG {stats.avgKnocks}</span>
                         <span className="text-[8px] uppercase font-bold text-yellow-300 mt-0.5">Deitados</span>
                     </div>
                     <div className="bg-white/5 p-1 rounded-xl border border-white/10 text-center flex flex-col justify-center">
                         <span className="block text-sm font-black text-white italic leading-none">{stats.hs}</span>
                         <span className="text-[7.5px] text-gray-400 font-bold mt-0.5">AVG {stats.avgHs}</span>
                         <span className="text-[8px] uppercase font-bold text-yellow-300 mt-0.5">HS</span>
                     </div>
                 </div>
               </>
             )}

             <div className="mt-auto pt-1 flex flex-col items-center gap-0.5">
                <span className="text-[8px] text-gray-400 font-black uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                  {filterLabel}
                </span>
                <span className="text-[9px] text-yellow-400 uppercase font-black tracking-widest group-hover:opacity-100 opacity-60 transition-opacity">
                  Clique para virar
                </span>
             </div>
          </div>

          {/* Back */}
          <div 
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 via-black to-neutral-950 p-3.5 border-[2px] border-zinc-700 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col"
            style={{ 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg) translateZ(1px)',
              WebkitTransform: 'rotateY(180deg) translateZ(1px)',
              pointerEvents: isFlipped ? 'auto' : 'none',
              visibility: !isFlipped ? 'hidden' : 'visible',
              transition: 'visibility 0s linear 0.35s'
            }}
          >
             <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2 shrink-0">
               <h3 className="text-base font-black text-white italic uppercase truncate max-w-[200px]">
                 {mode === 'team' ? 'Elenco da Equipe' : 'Estatísticas'}
               </h3>
               <span className="text-[8px] text-yellow-400 font-black uppercase bg-white/5 px-2 py-0.5 rounded border border-white/10 shrink-0">
                 {filterLabel}
               </span>
             </div>
             
             {mode === 'team' ? (
               /* TEAM BACK: PLAYERS ROSTER + COMPACT SUMMARY */
               <div className="flex-1 flex flex-col gap-2 min-h-0">
                 
                 {/* Team Roster / Players List */}
                 <div className="flex-1 flex flex-col min-h-0 bg-white/5 rounded-xl p-2 border border-white/10">
                   <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/10 shrink-0">
                     <h4 className="text-[9px] font-black text-yellow-400 uppercase tracking-wider flex items-center gap-1">
                       <Users size={11} /> Jogadores da Equipe
                     </h4>
                     <div className="flex items-center gap-2 text-[7.5px] font-bold text-gray-400 uppercase tracking-wider px-1">
                       <span className="w-7 text-center">Kills</span>
                       <span className="w-10 text-center">Dano</span>
                       <span className="w-8 text-center">% Time</span>
                       <span className="w-7 text-center">Média</span>
                     </div>
                   </div>

                   <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-0.5">
                     {teamPlayers.map((p, idx) => (
                       <div 
                         key={p.name} 
                         className="flex items-center justify-between bg-black/40 hover:bg-black/60 rounded-lg px-2 py-1 border border-white/5 transition-colors"
                       >
                         {/* Player Avatar + Name + Role */}
                         <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                           <span className="text-[8px] font-bold text-gray-500 w-2.5 shrink-0">#{idx + 1}</span>
                           <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                             {p.img ? (
                               <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                             ) : (
                               <span className="text-[7px] font-black text-gray-400 uppercase">{p.name.substring(0, 2)}</span>
                             )}
                           </div>
                           <div className="flex flex-col min-w-0">
                             <span className="text-[9px] font-black text-white uppercase truncate leading-tight">{p.name}</span>
                             {p.role ? (
                               <span className="text-[7px] font-bold text-yellow-500/90 uppercase tracking-tighter leading-none truncate">{p.role}</span>
                             ) : (
                               <span className="text-[7px] font-bold text-gray-500 uppercase leading-none">{p.matches}Q</span>
                             )}
                           </div>
                         </div>

                         {/* Stats columns */}
                         <div className="flex items-center gap-2 text-[9px] font-black shrink-0">
                           <span className="w-7 text-center text-yellow-400 font-black italic">{p.kills}</span>
                           <span className="w-10 text-center text-white/90 font-bold text-[8.5px]">{p.damage.toLocaleString('pt-BR')}</span>
                           <span className="w-8 text-center text-yellow-300/80 font-bold text-[8px]">{p.killShare}%</span>
                           <span className="w-7 text-center text-gray-400 font-bold text-[8px]">{p.avgKills}</span>
                         </div>
                       </div>
                     ))}
                     {teamPlayers.length === 0 && (
                       <div className="text-center text-gray-500 text-xs py-4 italic">Nenhum jogador registrado no filtro.</div>
                     )}
                   </div>
                 </div>

                 {/* Secondary Stats: Weapon + Victims + Map */}
                 <div className="grid grid-cols-3 gap-1.5 shrink-0">
                   {/* Arma Letal */}
                   <div className="bg-white/5 border border-white/10 rounded-xl p-1.5 flex flex-col justify-between">
                     <span className="text-[7.5px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                       <TargetIcon size={9} /> Arma Letal
                     </span>
                     <div className="flex flex-col items-center justify-center my-0.5">
                       {info.weaponImg ? (
                         <img src={info.weaponImg} alt={topWeapon} className="h-5 w-auto object-contain drop-shadow" />
                       ) : null}
                       <span className="text-[9px] font-black text-white italic uppercase truncate w-full text-center mt-0.5">{topWeapon}</span>
                     </div>
                   </div>

                   {/* Top Vítima Time */}
                   <div className="bg-white/5 border border-white/10 rounded-xl p-1.5 flex flex-col justify-between">
                     <span className="text-[7.5px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                       <Swords size={9} /> Top Vítima
                     </span>
                     {topVictimTeams.length > 0 ? (
                       <div className="flex items-center gap-1.5 my-auto">
                         <div className="w-5 h-5 bg-black rounded overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                           {topVictimTeams[0].img ? (
                             <img src={topVictimTeams[0].img} className="w-full h-full object-contain p-0.5" />
                           ) : (
                             <span className="text-[6px] text-gray-500">{topVictimTeams[0].name.substring(0, 3)}</span>
                           )}
                         </div>
                         <div className="flex flex-col min-w-0 flex-1">
                           <span className="text-[8px] font-black text-white uppercase truncate leading-tight">{topVictimTeams[0].name}</span>
                           <span className="text-[7.5px] text-yellow-400 font-bold leading-tight">{topVictimTeams[0].count} abates</span>
                         </div>
                       </div>
                     ) : (
                       <span className="text-[8px] text-gray-500 italic my-auto text-center">Sem dados</span>
                     )}
                   </div>

                   {/* Melhor Mapa */}
                   <div className="bg-white/5 border border-white/10 rounded-xl p-1.5 flex flex-col justify-between">
                     <span className="text-[7.5px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                       <MapIcon size={9} /> Melhor Mapa
                     </span>
                     {mapStats.length > 0 ? (
                       <div className="flex flex-col items-center justify-center my-auto text-center">
                         <span className="text-[8.5px] font-black text-white uppercase truncate w-full">{mapStats[0].name}</span>
                         <span className="text-[7.5px] text-yellow-400 font-bold">{mapStats[0].kills} abates</span>
                       </div>
                     ) : (
                       <span className="text-[8px] text-gray-500 italic my-auto text-center">Sem dados</span>
                     )}
                   </div>
                 </div>

               </div>
             ) : (
               /* PLAYER BACK: WEAPON, VICTIMS, MAPS, SAFES */
               <div className="flex-1 flex flex-col gap-2">
                  
                  {/* 1. Arma & Top Victims */}
                  <div className="grid grid-cols-1 gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                          {/* Weapon */}
                          <div className="flex-1">
                              <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><TargetIcon size={10}/> Arma Favorita</h4>
                              <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex items-center justify-center gap-2 h-10">
                                  {info.weaponImg && (
                                  <img src={info.weaponImg} alt={topWeapon} className="h-6 w-auto object-contain drop-shadow-md" />
                                  )}
                                  <span className="text-xs font-black text-white italic uppercase truncate">{topWeapon}</span>
                              </div>
                          </div>
                      </div>

                      {/* Top Victims Grid */}
                      <div className="grid grid-cols-2 gap-2">
                          <div>
                              <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Swords size={10}/> Vítimas (Times)</h4>
                              <div className="flex flex-col gap-1">
                                  {topVictimTeams.map(t => (
                                      <div key={t.name} className="bg-white/5 rounded-lg p-1 border border-white/10 flex items-center gap-2">
                                          <div className="w-5 h-5 bg-black rounded overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                                          {t.img ? <img src={t.img} className="w-full h-full object-contain p-0.5" /> : <span className="text-[6px] text-gray-500">{t.name.substring(0,3)}</span>}
                                          </div>
                                          <div className="flex flex-col min-w-0">
                                          <span className="text-[8px] font-black text-white uppercase truncate leading-none mb-0.5">{t.name}</span>
                                          <span className="text-[8px] text-yellow-400 leading-none">{t.count} abates</span>
                                          </div>
                                      </div>
                                  ))}
                                  {topVictimTeams.length === 0 && <span className="text-xs text-gray-500 italic">Nenhum</span>}
                              </div>
                          </div>
                          <div>
                              <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><User size={10}/> Vítimas (Jogadores)</h4>
                              <div className="flex flex-col gap-1">
                                  {topVictims.map(p => (
                                      <div key={p.name} className="bg-white/5 rounded-lg p-1 border border-white/10 flex items-center gap-2">
                                          <div className="w-5 h-5 bg-black rounded overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                                          {p.img ? <img src={p.img} className="w-full h-full object-cover" /> : <span className="text-[6px] text-gray-500">{p.name.substring(0,2)}</span>}
                                          </div>
                                          <div className="flex flex-col min-w-0">
                                          <span className="text-[8px] font-black text-white uppercase truncate leading-none mb-0.5">{p.name}</span>
                                          <span className="text-[8px] text-yellow-400 leading-none">{p.count} abates</span>
                                          </div>
                                      </div>
                                  ))}
                                  {topVictims.length === 0 && <span className="text-xs text-gray-500 italic">Nenhum</span>}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Maps (Grid - 3 columns to save space) */}
                  <div className="shrink-0">
                      <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><MapIcon size={10}/> Por Mapa</h4>
                      <div className="grid grid-cols-3 gap-1">
                          {mapStats.slice(0, 6).map(m => (
                              <div key={m.name} className="flex flex-col items-center justify-center bg-white/5 rounded-md p-1 border border-white/5">
                                  <span className="text-[8px] font-bold text-white uppercase truncate w-full text-center">{m.name}</span>
                                  <div className="flex items-baseline gap-1 mt-0.5">
                                      <span className="text-[10px] text-yellow-400 font-black leading-none">{m.kills}</span>
                                      <span className="text-[7px] text-gray-500 font-bold leading-none">AVG {m.matches > 0 ? (m.kills/m.matches).toFixed(1) : 0}</span>
                                  </div>
                              </div>
                          ))}
                          {mapStats.length === 0 && <span className="text-xs text-gray-500">Sem dados</span>}
                      </div>
                  </div>

                  {/* Safes (Grid) */}
                  <div className="flex-1 flex flex-col">
                      <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Shield size={10}/> Abates por Safe</h4>
                      <div className="flex flex-wrap gap-1 content-start">
                          {safeStats.map(s => (
                              <div key={s.name} className="w-[calc(16.666%-0.2rem)] min-w-[28px] bg-white/5 rounded-md p-1 border border-white/5 flex flex-col items-center justify-center">
                                  <span className="text-[7px] font-bold text-gray-400 uppercase leading-none mb-0.5">S{s.name.replace(/^S/i, '')}</span>
                                  <span className="text-[10px] font-black text-yellow-400 leading-none">{s.kills}</span>
                              </div>
                          ))}
                          {safeStats.length === 0 && <span className="text-xs text-gray-500">Sem dados</span>}
                      </div>
                  </div>

               </div>
             )}

             <div className="mt-auto pt-1.5 border-t border-white/10 text-center shrink-0 group-hover:opacity-100 opacity-60 transition-opacity">
                <span className="text-[9px] text-yellow-400 uppercase font-black tracking-widest">Clique para virar</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SQUAD_THEMES: Record<string, {
  name: string;
  primary: string;
  primaryDark: string;
  bgGradient: string;
  badgeBg: string;
  badgeBorder: string;
  textPrimary: string;
  boxBorder: string;
  boxGlow: string;
  lineColor: string;
  dotBg: string;
  triangleColor: string;
}> = {
  neon_green: {
    name: 'Verde Neon (Estilo LOUD)',
    primary: '#00ff66',
    primaryDark: '#023816',
    bgGradient: 'from-[#031409] via-[#072410] to-[#010a04]',
    badgeBg: 'bg-[#00ff66] text-black font-black',
    badgeBorder: 'border-[#00ff66]',
    textPrimary: 'text-[#00ff66]',
    boxBorder: 'border-[#00ff66]/60',
    boxGlow: 'shadow-[0_0_25px_rgba(0,255,102,0.3)]',
    lineColor: '#00ff66',
    dotBg: 'bg-[#00ff66]',
    triangleColor: '#00ff66',
  },
  gold_yellow: {
    name: 'Amarelo Ouro',
    primary: '#facc15',
    primaryDark: '#423102',
    bgGradient: 'from-[#171304] via-[#292109] to-[#0b0802]',
    badgeBg: 'bg-yellow-400 text-black font-black',
    badgeBorder: 'border-yellow-400',
    textPrimary: 'text-yellow-400',
    boxBorder: 'border-yellow-400/60',
    boxGlow: 'shadow-[0_0_25px_rgba(250,204,21,0.3)]',
    lineColor: '#facc15',
    dotBg: 'bg-yellow-400',
    triangleColor: '#facc15',
  },
  neon_red: {
    name: 'Vermelho Fogo',
    primary: '#ef4444',
    primaryDark: '#450a0a',
    bgGradient: 'from-[#170404] via-[#290909] to-[#0b0202]',
    badgeBg: 'bg-red-500 text-white font-black',
    badgeBorder: 'border-red-500',
    textPrimary: 'text-red-500',
    boxBorder: 'border-red-500/60',
    boxGlow: 'shadow-[0_0_25px_rgba(239,68,68,0.3)]',
    lineColor: '#ef4444',
    dotBg: 'bg-red-500',
    triangleColor: '#ef4444',
  },
  cyber_purple: {
    name: 'Roxo Cyber',
    primary: '#a855f7',
    primaryDark: '#3b0764',
    bgGradient: 'from-[#110417] via-[#210929] to-[#07020b]',
    badgeBg: 'bg-purple-500 text-white font-black',
    badgeBorder: 'border-purple-500',
    textPrimary: 'text-purple-400',
    boxBorder: 'border-purple-500/60',
    boxGlow: 'shadow-[0_0_25px_rgba(168,85,247,0.3)]',
    lineColor: '#a855f7',
    dotBg: 'bg-purple-500',
    triangleColor: '#a855f7',
  },
  electric_blue: {
    name: 'Azul Elétrico',
    primary: '#06b6d4',
    primaryDark: '#083344',
    bgGradient: 'from-[#041217] via-[#092229] to-[#02090b]',
    badgeBg: 'bg-cyan-400 text-black font-black',
    badgeBorder: 'border-cyan-400',
    textPrimary: 'text-cyan-400',
    boxBorder: 'border-cyan-400/60',
    boxGlow: 'shadow-[0_0_25px_rgba(6,182,212,0.3)]',
    lineColor: '#06b6d4',
    dotBg: 'bg-cyan-400',
    triangleColor: '#06b6d4',
  }
};

const Banners: React.FC<BannersProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<
    | 'teams' 
    | 'players' 
    | 'team_perf' 
    | 'map_kings' 
    | 'drop_kings' 
    | 'role_kings' 
    | 'team_map_kings'
    | 'team_drop_kings'
    | 'map_kings_stories' 
    | 'drop_kings_stories' 
    | 'role_kings_stories'
    | 'team_map_kings_stories'
    | 'team_drop_kings_stories'
    | 'fifa_card'
    | 'esport_squad'
  >('teams');
  const [selectedMapOrDrop, setSelectedMapOrDrop] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedRd, setSelectedRd] = useState<string>('all');
  const [selectedQueda, setSelectedQueda] = useState<string>('all');
  const [storiesSubtype, setStoriesSubtype] = useState<string>('highlights');
  const bannerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fifaCardMode, setFifaCardMode] = useState<'player' | 'team'>('player');
  const [fifaCardSelected, setFifaCardSelected] = useState<string>('');
  const [squadColorTheme, setSquadColorTheme] = useState<string>('neon_green');
  const [squadFormat, setSquadFormat] = useState<'feed' | 'stories'>('feed');

  const availableRds = useMemo(() => {
    const rds = new Set<string>();
    data.details.forEach(d => {
      if (d.RD) rds.add(d.RD.toString());
    });
    return Array.from(rds).sort((a, b) => parseNumber(a) - parseNumber(b));
  }, [data.details]);

  const availableQuedas = useMemo(() => {
    const qs = new Set<string>();
    data.details.forEach(d => {
      if (d.Q) {
        if (selectedRd === 'all' || !selectedRd || (d.RD && d.RD.toString().trim() === selectedRd.toString().trim())) {
          qs.add(d.Q.toString().trim());
        }
      }
    });
    data.players.forEach(p => {
      if (p.Q) {
        if (selectedRd === 'all' || !selectedRd || (p.RD && p.RD.toString().trim() === selectedRd.toString().trim())) {
          qs.add(p.Q.toString().trim());
        }
      }
    });
    if (qs.size === 0) {
      data.details.forEach(d => { if (d.Q) qs.add(d.Q.toString().trim()); });
      data.players.forEach(p => { if (p.Q) qs.add(p.Q.toString().trim()); });
    }
    return Array.from(qs).sort((a, b) => parseNumber(a) - parseNumber(b));
  }, [data.details, data.players, selectedRd]);

  const availableTeams = useMemo(() => {
    const teams = new Set<string>();
    (Array.isArray(data?.teamsReference) ? data.teamsReference : []).forEach(t => { if (t.TIME) teams.add(t.TIME); });
    data.details.forEach(d => { if (d.TIME) teams.add(d.TIME); });
    return Array.from(teams).sort((a, b) => a.localeCompare(b));
  }, [data.details, data.teamsReference]);

  useMemo(() => {
    if (selectedRd === '' && availableRds.length > 0) {
      setSelectedRd('all');
    }
  }, [availableRds, selectedRd]);

  useMemo(() => {
    if (!selectedTeam && availableTeams.length > 0) {
      setSelectedTeam(availableTeams[0]);
    }
  }, [availableTeams, selectedTeam]);

      
  const kingsData = useMemo(() => {
    if (
      activeTab !== "map_kings" && 
      activeTab !== "drop_kings" && 
      activeTab !== "role_kings" && 
      activeTab !== "map_kings_stories" && 
      activeTab !== "drop_kings_stories" && 
      activeTab !== "role_kings_stories"
    ) return [];

    // Pre-calculate deaths from killFeed
    const totalDeathsMap = new Map<string, number>();
    data.killFeed.forEach(f => {
      const victim = f.VITIMA;
      if (!victim) return;
      const normalizedVictim = victim.trim().toUpperCase();
      totalDeathsMap.set(normalizedVictim, (totalDeathsMap.get(normalizedVictim) || 0) + 1);
    });

    if (activeTab === "role_kings" || activeTab === "role_kings_stories") {
      // 1. Aggregate player stats across all matches
      const playerStatsMap = new Map<string, any>();
      
      data.players.forEach(p => {
        const pName = p.PLAYER;
        if (!pName) return;
        const normalizedPName = pName.trim().toUpperCase();

        if (!playerStatsMap.has(normalizedPName)) {
          playerStatsMap.set(normalizedPName, {
            name: p.PLAYER,
            team: p.TIME,
            playerImg: findDimImg(data.playersDimension, p.PLAYER) || "",
            teamImg: findTeamLogo(p.TIME, data.teamsReference),
            kills: 0,
            damage: 0,
            hs: 0,
            knocks: 0,
            reviveu: 0,
            aliadosRevividos: 0,
            mvp: 0,
            matches: 0,
            zeroKills: 0,
            withKills: 0,
            deaths: totalDeathsMap.get(normalizedPName) || 0
          });
        }

        const stats = playerStatsMap.get(normalizedPName);
        const kills = parseNumber(p.Abates);
        stats.kills += kills;
        stats.damage += parseNumber(p.Dano);
        stats.hs += parseNumber(p.HS);
        stats.knocks += parseNumber(p.Deitados);
        stats.reviveu += parseNumber(p.Reviveu);
        stats.aliadosRevividos += parseNumber(p.AliadosRevividos);
        stats.mvp += parseNumber(p.MVP);
        stats.matches += 1;

        if (kills === 0) stats.zeroKills += 1;
        else stats.withKills += 1;
      });

      // 2. Map players to their respective roles (Função and Função2)
      const roleGroupsMap = new Map<string, Map<string, any>>();

      data.playersDimension.forEach(dim => {
        const pName = dim.Name;
        if (!pName) return;
        const normalizedPName = pName.trim().toUpperCase();
        const baseStats = playerStatsMap.get(normalizedPName);
        if (!baseStats) return;

        const role1 = dim.Funcao?.trim().toUpperCase();
        const role2 = dim.Funcao2?.trim().toUpperCase();

        const addPlayerToRole = (role: string) => {
          if (!role || role === 'N/A' || role === '-' || role === 'SEM FUNÇÃO') return;
          if (!roleGroupsMap.has(role)) {
            roleGroupsMap.set(role, new Map());
          }
          roleGroupsMap.get(role)!.set(normalizedPName, { ...baseStats });
        };

        if (role1) addPlayerToRole(role1);
        if (role2 && role2 !== role1) addPlayerToRole(role2);
      });

      const roleGroups = Array.from(roleGroupsMap.entries()).map(([roleName, playersMap]) => {
        const players = Array.from(playersMap.values()).map(p => ({
          ...p,
          avgKills: p.matches > 0 ? (p.kills / p.matches) : 0,
          avgDamage: p.matches > 0 ? (p.damage / p.matches) : 0,
          avgHs: p.matches > 0 ? (p.hs / p.matches) : 0,
          avgKnocks: p.matches > 0 ? (p.knocks / p.matches) : 0,
          zeroRate: p.matches > 0 ? (p.zeroKills / p.matches) * 100 : 0
        })).sort((a, b) => b.kills - a.kills || b.avgKills - a.avgKills);

        const getTop = (sortFn: (a: any, b: any) => number) => [...players].sort(sortFn)[0] || null;

        return {
          name: roleName,
          players,
          topDamage: getTop((a, b) => b.damage - a.damage),
          topAvgKills: getTop((a, b) => b.avgKills - a.avgKills),
          topKnocks: getTop((a, b) => b.knocks - a.knocks),
          topHs: getTop((a, b) => b.hs - a.hs),
          topZero: getTop((a, b) => b.zeroKills - a.zeroKills),
          topRevives: getTop((a, b) => b.reviveu - a.reviveu),
          topAlliesRevived: getTop((a, b) => b.aliadosRevividos - a.aliadosRevividos),
          topMvp: getTop((a, b) => b.mvp - a.mvp),
          topDeaths: getTop((a, b) => b.deaths - a.deaths)
        };
      }).sort((a, b) => a.name.localeCompare(b.name));

      const allRolePlayers = Array.from(playerStatsMap.values()).map(p => ({
        ...p,
        avgKills: p.matches > 0 ? (p.kills / p.matches) : 0,
        avgDamage: p.matches > 0 ? (p.damage / p.matches) : 0,
        avgHs: p.matches > 0 ? (p.hs / p.matches) : 0,
        avgKnocks: p.matches > 0 ? (p.knocks / p.matches) : 0,
        zeroRate: p.matches > 0 ? (p.zeroKills / p.matches) * 100 : 0
      })).sort((a, b) => b.kills - a.kills || b.avgKills - a.avgKills);

      const getTopAllRole = (sortFn: (a: any, b: any) => number) => [...allRolePlayers].sort(sortFn)[0] || null;

      const allRoleObj = {
        name: "TODAS AS FUNÇÕES",
        players: allRolePlayers,
        topDamage: getTopAllRole((a, b) => b.damage - a.damage),
        topAvgKills: getTopAllRole((a, b) => b.avgKills - a.avgKills),
        topKnocks: getTopAllRole((a, b) => b.knocks - a.knocks),
        topHs: getTopAllRole((a, b) => b.hs - a.hs),
        topZero: getTopAllRole((a, b) => b.zeroKills - a.zeroKills),
        topRevives: getTopAllRole((a, b) => b.reviveu - a.reviveu),
        topAlliesRevived: getTopAllRole((a, b) => b.aliadosRevividos - a.aliadosRevividos),
        topMvp: getTopAllRole((a, b) => b.mvp - a.mvp),
        topDeaths: getTopAllRole((a, b) => b.deaths - a.deaths)
      };

      return [allRoleObj, ...roleGroups];
    }

    const processGroup = (keyExtractor: (p: any) => string, allGroupName?: string) => {
        // Pre-calculate deaths from killFeed for this grouping
        const groupDeathsMap = new Map<string, Map<string, number>>();
        const allDeathsMap = new Map<string, number>();

        data.killFeed.forEach(f => {
            const key = keyExtractor(f);
            const victim = f.VITIMA;
            if (!victim) return;
            const normalizedVictim = victim.trim().toUpperCase();

            allDeathsMap.set(normalizedVictim, (allDeathsMap.get(normalizedVictim) || 0) + 1);

            if (!key) return;
            
            if (!groupDeathsMap.has(key)) {
                groupDeathsMap.set(key, new Map());
            }
            const playerDeaths = groupDeathsMap.get(key)!;
            playerDeaths.set(normalizedVictim, (playerDeaths.get(normalizedVictim) || 0) + 1);
        });

        const groupMap = new Map<string, Map<string, any>>();
        const allPlayerMap = new Map<string, any>();
        
        data.players.forEach(p => {
            const key = keyExtractor(p);
            const pName = p.PLAYER;
            if (!pName) return;
            const normalizedPName = pName.trim().toUpperCase();

            const kills = parseNumber(p.Abates);
            const damage = parseNumber(p.Dano);
            const hs = parseNumber(p.HS);
            const knocks = parseNumber(p.Deitados);
            const reviveu = parseNumber(p.Reviveu);
            const aliadosRevividos = parseNumber(p.AliadosRevividos);
            const mvp = parseNumber(p.MVP);

            if (allGroupName) {
              if (!allPlayerMap.has(normalizedPName)) {
                allPlayerMap.set(normalizedPName, {
                  name: p.PLAYER,
                  team: p.TIME,
                  playerImg: findDimImg(data.playersDimension, p.PLAYER) || "",
                  teamImg: findTeamLogo(p.TIME, data.teamsReference),
                  kills: 0,
                  damage: 0,
                  hs: 0,
                  knocks: 0,
                  reviveu: 0,
                  aliadosRevividos: 0,
                  mvp: 0,
                  matches: 0,
                  zeroKills: 0,
                  withKills: 0,
                  deaths: 0
                });
              }
              const allStats = allPlayerMap.get(normalizedPName);
              allStats.kills += kills;
              allStats.damage += damage;
              allStats.hs += hs;
              allStats.knocks += knocks;
              allStats.reviveu += reviveu;
              allStats.aliadosRevividos += aliadosRevividos;
              allStats.mvp += mvp;
              allStats.matches += 1;
              if (kills === 0) allStats.zeroKills += 1;
              else allStats.withKills += 1;
            }

            if (!key) return;

            if (!groupMap.has(key)) {
                groupMap.set(key, new Map());
            }
            const playerMap = groupMap.get(key)!;

            if (!playerMap.has(normalizedPName)) {
                playerMap.set(normalizedPName, {
                    name: p.PLAYER,
                    team: p.TIME,
                    playerImg: findDimImg(data.playersDimension, p.PLAYER) || "",
                    teamImg: findTeamLogo(p.TIME, data.teamsReference),
                    kills: 0,
                    damage: 0,
                    hs: 0,
                    knocks: 0,
                    reviveu: 0,
                    aliadosRevividos: 0,
                    mvp: 0,
                    matches: 0,
                    zeroKills: 0,
                    withKills: 0,
                    deaths: 0
                });
            }
            
            const stats = playerMap.get(normalizedPName);
            
            stats.kills += kills;
            stats.damage += damage;
            stats.hs += hs;
            stats.knocks += knocks;
            stats.reviveu += reviveu;
            stats.aliadosRevividos += aliadosRevividos;
            stats.mvp += mvp;
            stats.matches += 1;
            
            if (kills === 0) stats.zeroKills += 1;
            else stats.withKills += 1;
        });

        // Set computed deaths to each player in the groupMap
        groupMap.forEach((playerMap, groupName) => {
            const deathsForThisGroup = groupDeathsMap.get(groupName) || new Map<string, number>();
            playerMap.forEach((stats, normalizedPName) => {
                stats.deaths = deathsForThisGroup.get(normalizedPName) || 0;
            });
        });

        const groups = Array.from(groupMap.entries()).map(([groupName, playersMap]) => {
            const players = Array.from(playersMap.values()).map(p => ({
                ...p,
                avgKills: p.matches > 0 ? (p.kills / p.matches) : 0,
                avgDamage: p.matches > 0 ? (p.damage / p.matches) : 0,
                avgHs: p.matches > 0 ? (p.hs / p.matches) : 0,
                avgKnocks: p.matches > 0 ? (p.knocks / p.matches) : 0,
                zeroRate: p.matches > 0 ? (p.zeroKills / p.matches) * 100 : 0
            })).sort((a, b) => b.kills - a.kills || b.avgKills - a.avgKills);

            const getTop = (sortFn: (a: any, b: any) => number) => [...players].sort(sortFn)[0] || null;

            return {
                name: groupName,
                players,
                topDamage: getTop((a, b) => b.damage - a.damage),
                topAvgKills: getTop((a, b) => b.avgKills - a.avgKills),
                topKnocks: getTop((a, b) => b.knocks - a.knocks),
                topHs: getTop((a, b) => b.hs - a.hs),
                topZero: getTop((a, b) => b.zeroKills - a.zeroKills),
                topRevives: getTop((a, b) => b.reviveu - a.reviveu),
                topAlliesRevived: getTop((a, b) => b.aliadosRevividos - a.aliadosRevividos),
                topMvp: getTop((a, b) => b.mvp - a.mvp),
                topDeaths: getTop((a, b) => b.deaths - a.deaths)
            };
        }).sort((a, b) => {
           const numA = parseInt(a.name.replace(/\D/g, ""));
           const numB = parseInt(b.name.replace(/\D/g, ""));
           if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
           return a.name.localeCompare(b.name);
        });

        if (allGroupName) {
          allPlayerMap.forEach((stats, normalizedPName) => {
            stats.deaths = allDeathsMap.get(normalizedPName) || 0;
          });

          const allPlayers = Array.from(allPlayerMap.values()).map(p => ({
            ...p,
            avgKills: p.matches > 0 ? (p.kills / p.matches) : 0,
            avgDamage: p.matches > 0 ? (p.damage / p.matches) : 0,
            avgHs: p.matches > 0 ? (p.hs / p.matches) : 0,
            avgKnocks: p.matches > 0 ? (p.knocks / p.matches) : 0,
            zeroRate: p.matches > 0 ? (p.zeroKills / p.matches) * 100 : 0
          })).sort((a, b) => b.kills - a.kills || b.avgKills - a.avgKills);

          const getTopAll = (sortFn: (a: any, b: any) => number) => [...allPlayers].sort(sortFn)[0] || null;

          const allGroupObj = {
            name: allGroupName,
            players: allPlayers,
            topDamage: getTopAll((a, b) => b.damage - a.damage),
            topAvgKills: getTopAll((a, b) => b.avgKills - a.avgKills),
            topKnocks: getTopAll((a, b) => b.knocks - a.knocks),
            topHs: getTopAll((a, b) => b.hs - a.hs),
            topZero: getTopAll((a, b) => b.zeroKills - a.zeroKills),
            topRevives: getTopAll((a, b) => b.reviveu - a.reviveu),
            topAlliesRevived: getTopAll((a, b) => b.aliadosRevividos - a.aliadosRevividos),
            topMvp: getTopAll((a, b) => b.mvp - a.mvp),
            topDeaths: getTopAll((a, b) => b.deaths - a.deaths)
          };

          return [allGroupObj, ...groups];
        }

        return groups;
    };

    if (activeTab === "map_kings" || activeTab === "map_kings_stories") {
        return processGroup(p => formatMapName(p.MAPA), "TODOS OS MAPAS");
    } else {
        return processGroup(p => (p.Q || "").trim().toUpperCase(), "TODAS AS QUEDAS");
    }
  }, [data.players, data.killFeed, activeTab, data.playersDimension, data.teamsReference]);

  const teamKingsData = useMemo(() => {
    if (
      activeTab !== "team_map_kings" && 
      activeTab !== "team_drop_kings" && 
      activeTab !== "team_map_kings_stories" && 
      activeTab !== "team_drop_kings_stories"
    ) return [];

    // 1. Build Player -> Team map
    const playerToTeamMap = new Map<string, string>();
    data.players.forEach(p => {
      if (p.PLAYER && p.TIME) {
        playerToTeamMap.set(p.PLAYER.trim().toUpperCase(), p.TIME.trim());
      }
    });
    data.playersDimension.forEach(dim => {
      if (dim.Name && dim.Equipe) {
        const key = dim.Name.trim().toUpperCase();
        if (!playerToTeamMap.has(key)) {
          playerToTeamMap.set(key, dim.Equipe.trim());
        }
      }
    });

    const isMapTab = activeTab === "team_map_kings" || activeTab === "team_map_kings_stories";
    const allGroupName = isMapTab ? "TODOS OS MAPAS" : "TODAS AS QUEDAS";

    // 2. Pre-calculate team deaths from killFeed
    const groupDeathsMap = new Map<string, Map<string, number>>();
    const allDeathsMap = new Map<string, number>();

    data.killFeed.forEach(f => {
      const rawKey = isMapTab ? formatMapName(f.MAPA) : (f.Q || "").trim().toUpperCase();
      const victim = f.VITIMA;
      if (!victim) return;
      const normalizedVictim = victim.trim().toUpperCase();
      const victimTeam = playerToTeamMap.get(normalizedVictim);
      if (!victimTeam) return;

      const normalizedTeam = victimTeam.toUpperCase();
      allDeathsMap.set(normalizedTeam, (allDeathsMap.get(normalizedTeam) || 0) + 1);

      if (!rawKey) return;
      if (!groupDeathsMap.has(rawKey)) {
        groupDeathsMap.set(rawKey, new Map());
      }
      const teamDeaths = groupDeathsMap.get(rawKey)!;
      teamDeaths.set(normalizedTeam, (teamDeaths.get(normalizedTeam) || 0) + 1);
    });

    // 3. Process matches per team from data.details and stats from data.players
    const groupMap = new Map<string, Map<string, any>>();
    const allTeamsMap = new Map<string, any>();

    const getOrCreateTeam = (map: Map<string, any>, teamName: string) => {
      const normalized = teamName.toUpperCase();
      if (!map.has(normalized)) {
        map.set(normalized, {
          name: teamName,
          team: teamName,
          playerImg: findTeamLogo(teamName, data.teamsReference) || "",
          teamImg: findTeamLogo(teamName, data.teamsReference) || "",
          kills: 0,
          damage: 0,
          hs: 0,
          knocks: 0,
          reviveu: 0,
          aliadosRevividos: 0,
          mvp: 0,
          matches: 0,
          zeroKills: 0,
          withKills: 0,
          deaths: 0,
          pts: 0,
          ptsc: 0,
          booyahs: 0
        });
      }
      return map.get(normalized)!;
    };

    const POSITION_POINTS: Record<number, number> = {
      1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1
    };

    // First process data.details for match counts, placement, booyahs and team kills
    if (data.details && data.details.length > 0) {
      data.details.forEach(d => {
        const teamName = d.TIME;
        if (!teamName || !teamName.trim()) return;
        const rawKey = isMapTab ? formatMapName(d.MAPA) : (d.Q || "").trim().toUpperCase();

        let ptsc = parseNumber(d.PTSC);
        let pts = parseNumber(d.PTS);
        let abts = parseNumber(d.ABTS);
        let booyah = parseNumber(d.B);
        let pos = parseNumber(d.POS);
        let s = parseNumber(d.S);

        // Skip completely empty placeholder spreadsheet rows
        if (s === 0 && pts === 0 && ptsc === 0 && abts === 0 && pos === 0 && booyah === 0) {
          return;
        }

        // Derive PTSC from POS if needed
        if (ptsc === 0 && pos >= 1 && pos <= 10) {
          ptsc = POSITION_POINTS[pos] || 0;
        }

        // Derive Booyah from POS
        if (booyah === 0 && pos === 1) {
          booyah = 1;
        }

        // Derive Total Match Points
        let matchTotalPts = 0;
        if (pts > 0) {
          matchTotalPts = pts;
          if (ptsc === 0 && abts > 0 && pts >= abts) ptsc = pts - abts;
          if (abts === 0 && ptsc > 0 && pts >= ptsc) abts = pts - ptsc;
        } else {
          matchTotalPts = ptsc + abts;
        }

        // A equipe zerou a partida se fez exatamente 0 pontos totais (0 kills e 0 pontos de colocação)
        const isZeroPointMatch = (matchTotalPts === 0) && (abts === 0);

        // Add to ALL (Todas as partidas do campeonato)
        const allStats = getOrCreateTeam(allTeamsMap, teamName);
        allStats.matches += 1;
        allStats.ptsc += ptsc;
        allStats.pts += matchTotalPts;
        allStats.kills += abts;
        allStats.booyahs += booyah;
        if (isZeroPointMatch) allStats.zeroKills += 1;
        else allStats.withKills += 1;

        // Add to specific group (Mapa ou Queda)
        if (!rawKey) return;
        if (!groupMap.has(rawKey)) {
          groupMap.set(rawKey, new Map());
        }
        const groupTeamMap = groupMap.get(rawKey)!;
        const teamStats = getOrCreateTeam(groupTeamMap, teamName);
        teamStats.matches += 1;
        teamStats.ptsc += ptsc;
        teamStats.pts += matchTotalPts;
        teamStats.kills += abts;
        teamStats.booyahs += booyah;
        if (isZeroPointMatch) teamStats.zeroKills += 1;
        else teamStats.withKills += 1;
      });
    } else {
      // Fallback from data.players by grouping match rounds per team
      const teamMatchesMap = new Map<string, Map<string, { key: string, kills: number }>>();
      data.players.forEach(p => {
        const teamName = p.TIME;
        if (!teamName) return;
        const rawKey = isMapTab ? formatMapName(p.MAPA) : (p.Q || "").trim().toUpperCase();
        const matchId = `${p.RD || ''}-${p.Q || ''}-${p.CONFRONTO || ''}-${p.MAPA || ''}`;
        const kills = parseNumber(p.Abates);

        const normTeam = teamName.toUpperCase();
        if (!teamMatchesMap.has(normTeam)) {
          teamMatchesMap.set(normTeam, new Map());
        }
        const m = teamMatchesMap.get(normTeam)!;
        if (!m.has(matchId)) {
          m.set(matchId, { key: rawKey, kills: 0 });
        }
        m.get(matchId)!.kills += kills;
      });

      teamMatchesMap.forEach((matchesMap, normalizedTeam) => {
        const originalName = data.players.find(p => p.TIME?.toUpperCase() === normalizedTeam)?.TIME || normalizedTeam;
        const allStats = getOrCreateTeam(allTeamsMap, originalName);
        matchesMap.forEach(({ key: rawKey, kills }) => {
          allStats.matches += 1;
          allStats.kills += kills;
          if (kills === 0) allStats.zeroKills += 1;
          else allStats.withKills += 1;

          if (rawKey) {
            if (!groupMap.has(rawKey)) {
              groupMap.set(rawKey, new Map());
            }
            const groupTeamMap = groupMap.get(rawKey)!;
            const teamStats = getOrCreateTeam(groupTeamMap, originalName);
            teamStats.matches += 1;
            teamStats.kills += kills;
            if (kills === 0) teamStats.zeroKills += 1;
            else teamStats.withKills += 1;
          }
        });
      });
    }

    // Then process data.players for damage, hs, knocks, revive, aliados, mvp
    data.players.forEach(p => {
      const teamName = p.TIME;
      if (!teamName) return;
      const rawKey = isMapTab ? formatMapName(p.MAPA) : (p.Q || "").trim().toUpperCase();

      const damage = parseNumber(p.Dano);
      const hs = parseNumber(p.HS);
      const knocks = parseNumber(p.Deitados);
      const reviveu = parseNumber(p.Reviveu);
      const aliadosRevividos = parseNumber(p.AliadosRevividos);
      const mvp = parseNumber(p.MVP);

      // If team wasn't in details for some reason, ensure exists
      const allStats = getOrCreateTeam(allTeamsMap, teamName);
      allStats.damage += damage;
      allStats.hs += hs;
      allStats.knocks += knocks;
      allStats.reviveu += reviveu;
      allStats.aliadosRevividos += aliadosRevividos;
      allStats.mvp += mvp;

      if (!rawKey) return;
      if (!groupMap.has(rawKey)) {
        groupMap.set(rawKey, new Map());
      }
      const groupTeamMap = groupMap.get(rawKey)!;
      const teamStats = getOrCreateTeam(groupTeamMap, teamName);
      teamStats.damage += damage;
      teamStats.hs += hs;
      teamStats.knocks += knocks;
      teamStats.reviveu += reviveu;
      teamStats.aliadosRevividos += aliadosRevividos;
      teamStats.mvp += mvp;
    });

    // Assign deaths from groupDeathsMap
    groupMap.forEach((teamsMap, groupName) => {
      const deathsForThisGroup = groupDeathsMap.get(groupName) || new Map<string, number>();
      teamsMap.forEach((stats, normalizedTeam) => {
        stats.deaths = deathsForThisGroup.get(normalizedTeam) || 0;
      });
    });

    const groups = Array.from(groupMap.entries()).map(([groupName, teamsMap]) => {
      const players = Array.from(teamsMap.values()).map(t => ({
        ...t,
        avgKills: t.matches > 0 ? (t.kills / t.matches) : 0,
        avgDamage: t.matches > 0 ? (t.damage / t.matches) : 0,
        avgHs: t.matches > 0 ? (t.hs / t.matches) : 0,
        avgKnocks: t.matches > 0 ? (t.knocks / t.matches) : 0,
        zeroRate: t.matches > 0 ? (t.zeroKills / t.matches) * 100 : 0
      })).sort((a, b) => b.kills - a.kills || b.avgKills - a.avgKills || b.pts - a.pts);

      const getTop = (sortFn: (a: any, b: any) => number) => [...players].sort(sortFn)[0] || null;

      return {
        name: groupName,
        players,
        topDamage: getTop((a, b) => b.damage - a.damage),
        topAvgKills: getTop((a, b) => b.avgKills - a.avgKills),
        topKnocks: getTop((a, b) => b.knocks - a.knocks),
        topHs: getTop((a, b) => b.hs - a.hs),
        topZero: getTop((a, b) => b.zeroKills - a.zeroKills || b.zeroRate - a.zeroRate || b.matches - a.matches),
        topRevives: getTop((a, b) => b.reviveu - a.reviveu),
        topAlliesRevived: getTop((a, b) => b.aliadosRevividos - a.aliadosRevividos),
        topMvp: getTop((a, b) => b.mvp - a.mvp),
        topDeaths: getTop((a, b) => b.deaths - a.deaths)
      };
    }).sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, ""));
      const numB = parseInt(b.name.replace(/\D/g, ""));
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.name.localeCompare(b.name);
    });

    if (allGroupName) {
      allTeamsMap.forEach((stats, normalizedTeam) => {
        stats.deaths = allDeathsMap.get(normalizedTeam) || 0;
      });

      const allTeams = Array.from(allTeamsMap.values()).map(t => ({
        ...t,
        avgKills: t.matches > 0 ? (t.kills / t.matches) : 0,
        avgDamage: t.matches > 0 ? (t.damage / t.matches) : 0,
        avgHs: t.matches > 0 ? (t.hs / t.matches) : 0,
        avgKnocks: t.matches > 0 ? (t.knocks / t.matches) : 0,
        zeroRate: t.matches > 0 ? (t.zeroKills / t.matches) * 100 : 0
      })).sort((a, b) => b.kills - a.kills || b.avgKills - a.avgKills || b.pts - a.pts);

      const getTopAll = (sortFn: (a: any, b: any) => number) => [...allTeams].sort(sortFn)[0] || null;

      const allGroupObj = {
        name: allGroupName,
        players: allTeams,
        topDamage: getTopAll((a, b) => b.damage - a.damage),
        topAvgKills: getTopAll((a, b) => b.avgKills - a.avgKills),
        topKnocks: getTopAll((a, b) => b.knocks - a.knocks),
        topHs: getTopAll((a, b) => b.hs - a.hs),
        topZero: getTopAll((a, b) => b.zeroKills - a.zeroKills || b.zeroRate - a.zeroRate || b.matches - a.matches),
        topRevives: getTopAll((a, b) => b.reviveu - a.reviveu),
        topAlliesRevived: getTopAll((a, b) => b.aliadosRevividos - a.aliadosRevividos),
        topMvp: getTopAll((a, b) => b.mvp - a.mvp),
        topDeaths: getTopAll((a, b) => b.deaths - a.deaths)
      };

      return [allGroupObj, ...groups];
    }

    return groups;
  }, [data.players, data.details, data.killFeed, data.teamsReference, data.playersDimension, activeTab]);

  const isTeamTab = activeTab === 'team_map_kings' || activeTab === 'team_drop_kings' || activeTab === 'team_map_kings_stories' || activeTab === 'team_drop_kings_stories';
  const isKingsTab = activeTab === 'map_kings' || activeTab === 'drop_kings' || activeTab === 'role_kings' || activeTab === 'team_map_kings' || activeTab === 'team_drop_kings' || activeTab === 'map_kings_stories' || activeTab === 'drop_kings_stories' || activeTab === 'role_kings_stories' || activeTab === 'team_map_kings_stories' || activeTab === 'team_drop_kings_stories';
  const isFeedTab = activeTab === 'map_kings' || activeTab === 'drop_kings' || activeTab === 'role_kings' || activeTab === 'team_map_kings' || activeTab === 'team_drop_kings';
  const currentKingsData = isTeamTab ? teamKingsData : kingsData;

  useMemo(() => {
    const list = isTeamTab ? teamKingsData : kingsData;
    if (list.length > 0 && (!selectedMapOrDrop || !list.find(g => g.name === selectedMapOrDrop))) {
        setSelectedMapOrDrop(list[0].name);
    }
  }, [kingsData, teamKingsData, isTeamTab, selectedMapOrDrop]);

  const bannerTeamPerfData = useMemo(() => {
    if (!selectedTeam) return null;
    
    let totalPtsc = 0;
    let totalAbts = 0;
    let totalBooyahs = 0;
    let matches = 0;

    const mapStatsMap = new Map<string, { mapName: string, matches: number, ptsc: number, abts: number, pts: number, booyahs: number }>();

    data.details.forEach(d => {
      if (d.TIME?.toLowerCase() !== selectedTeam.toLowerCase()) return;
      if (selectedRd !== 'all' && d.RD?.toString() !== selectedRd) return;
      
      const ptsc = parseNumber(d.PTSC);
      const abts = parseNumber(d.ABTS);
      const booyahs = parseNumber(d.B);
      const pts = ptsc + abts;

      totalPtsc += ptsc;
      totalAbts += abts;
      totalBooyahs += booyahs;
      matches++;
      
      const mapName = formatMapName(d.MAPA) || 'Desconhecido';
      if (!mapStatsMap.has(mapName)) {
        mapStatsMap.set(mapName, { mapName, matches: 0, ptsc: 0, abts: 0, pts: 0, booyahs: 0 });
      }
      
      const mStat = mapStatsMap.get(mapName)!;
      mStat.matches++;
      mStat.ptsc += ptsc;
      mStat.abts += abts;
      mStat.pts += pts;
      mStat.booyahs += booyahs;
    });

    const playerStats = new Map<string, { name: string, img: string, kills: number, dmg: number, hs: number, knocks: number, matches: number }>();
    data.players.forEach(p => {
      if (p.TIME?.toLowerCase() !== selectedTeam.toLowerCase()) return;
      if (selectedRd !== 'all' && p.RD?.toString() !== selectedRd) return;

      const pName = p.PLAYER;
      if (!pName) return;

      if (!playerStats.has(pName)) {
        const playerRef = data.playersDimension.find(d => d.Name.toLowerCase().trim() === pName.toLowerCase().trim());
        playerStats.set(pName, { name: pName, img: playerRef?.IMG || '', kills: 0, dmg: 0, hs: 0, knocks: 0, matches: 0 });
      }

      const stats = playerStats.get(pName)!;
      stats.kills += parseNumber(p.Abates);
      stats.dmg += parseNumber(p.Dano);
      stats.hs += parseNumber(p.HS);
      stats.knocks += parseNumber(p.Deitados);
      stats.matches++;
    });

    const players = Array.from(playerStats.values()).sort((a, b) => b.kills - a.kills).map(p => ({
      ...p,
      avgKills: p.matches > 0 ? (p.kills / p.matches).toFixed(2) : '0.00',
      avgDmg: p.matches > 0 ? (p.dmg / p.matches).toFixed(0) : '0',
      avgHs: p.matches > 0 ? (p.hs / p.matches).toFixed(2) : '0.00',
      avgKnocks: p.matches > 0 ? (p.knocks / p.matches).toFixed(2) : '0.00'
    }));
    
    const maps = Array.from(mapStatsMap.values()).sort((a, b) => b.pts - a.pts).map(m => ({
      ...m,
      avgPts: m.matches > 0 ? (m.pts / m.matches).toFixed(1) : '0.0',
      avgPtsc: m.matches > 0 ? (m.ptsc / m.matches).toFixed(1) : '0.0',
      avgAbts: m.matches > 0 ? (m.abts / m.matches).toFixed(1) : '0.0',
      avgBooyahs: m.matches > 0 ? (m.booyahs / m.matches).toFixed(2) : '0.00'
    }));

    const teamImg = findTeamLogo(selectedTeam, data.teamsReference);

    return { teamName: selectedTeam, teamImg, ptsc: totalPtsc, abts: totalAbts, pts: totalPtsc + totalAbts, booyahs: totalBooyahs, matches, players, maps };
  }, [data.details, data.players, data.teamsReference, data.playersDimension, selectedTeam, selectedRd]);

  const bannerPlayerData = useMemo(() => {
    if (!selectedRd) return { topAbts: [], topDmg: [], topHs: [], topKnocks: [] };

    const playerStats = new Map<string, { name: string, team: string, teamImg: string, playerImg: string, kills: number, dmg: number, hs: number, knocks: number, matches: number }>();

    data.players.forEach(p => {
      if (p.RD?.toString() !== selectedRd) return;
      
      const pName = p.PLAYER;
      if (!pName) return;

      if (!playerStats.has(pName)) {
        const teamName = p.TIME || '';
        const teamImg = findTeamLogo(teamName, data.teamsReference);
        const playerRef = data.playersDimension.find(d => d.Name.toLowerCase().trim() === pName.toLowerCase().trim());
        const playerImg = playerRef?.IMG || '';
        playerStats.set(pName, { name: pName, team: teamName, teamImg, playerImg, kills: 0, dmg: 0, hs: 0, knocks: 0, matches: 0 });
      }

      const stats = playerStats.get(pName)!;
      stats.kills += parseNumber(p.Abates);
      stats.dmg += parseNumber(p.Dano);
      stats.hs += parseNumber(p.HS);
      stats.knocks += parseNumber(p.Deitados);
      stats.matches += 1;
    });

    const allPlayers = Array.from(playerStats.values()).map(p => ({
      ...p,
      avgKills: p.matches > 0 ? (p.kills / p.matches).toFixed(2) : '0.00',
      avgDmg: p.matches > 0 ? (p.dmg / p.matches).toFixed(0) : '0',
      avgHs: p.matches > 0 ? (p.hs / p.matches).toFixed(2) : '0.00',
      avgKnocks: p.matches > 0 ? (p.knocks / p.matches).toFixed(2) : '0.00'
    }));

    const topAbts = [...allPlayers].sort((a, b) => b.kills - a.kills).slice(0, 3);
    const topDmg = [...allPlayers].sort((a, b) => b.dmg - a.dmg).slice(0, 3);
    const topHs = [...allPlayers].sort((a, b) => b.hs - a.hs).slice(0, 3);
    const topKnocks = [...allPlayers].sort((a, b) => b.knocks - a.knocks).slice(0, 3);

    return { topAbts, topDmg, topHs, topKnocks };
  }, [data.players, data.teamsReference, data.playersDimension, selectedRd]);

  const bannerData = useMemo(() => {
    if (!selectedRd) return { topPtsc: [], topAbts: [], topBooyahs: [] };

    // Agrupar estatísticas por time na rodada selecionada
    const teamStats = new Map<string, { name: string, ptsc: number, abts: number, booyahs: number, img: string }>();

    data.details.forEach(d => {
      if (d.RD?.toString() !== selectedRd) return;
      
      const teamName = d.TIME;
      if (!teamName) return;

      const teamImg = findTeamLogo(teamName, data.teamsReference);

      const ptsc = parseNumber(d.PTSC);
      const abts = parseNumber(d.ABTS);
      const booyahs = parseNumber(d.B);

      if (!teamStats.has(teamName)) {
        teamStats.set(teamName, { name: teamName, ptsc: 0, abts: 0, booyahs: 0, img: teamImg });
      }

      const stats = teamStats.get(teamName)!;
      stats.ptsc += ptsc;
      stats.abts += abts;
      stats.booyahs += booyahs;
    });

    const allTeams = Array.from(teamStats.values());

    const topPtsc = [...allTeams].sort((a, b) => b.ptsc - a.ptsc).slice(0, 3);
    const topAbts = [...allTeams].sort((a, b) => b.abts - a.abts).slice(0, 3);
    const topBooyahs = [...allTeams].filter(t => t.booyahs > 0).sort((a, b) => b.booyahs - a.booyahs).slice(0, 3);

    return { topPtsc, topAbts, topBooyahs };
  }, [data.details, data.teamsReference, selectedRd]);

  const bannerSquadData = useMemo(() => {
    if (activeTab !== 'esport_squad' || !selectedTeam) return null;

    const teamImg = findTeamLogo(selectedTeam, data.teamsReference);

    let totalPtsc = 0;
    let totalAbts = 0;
    let totalBooyahs = 0;
    let totalMatches = 0;

    data.details.forEach(d => {
      if (d.TIME?.toLowerCase() !== selectedTeam.toLowerCase()) return;
      if (selectedRd !== 'all' && d.RD?.toString() !== selectedRd) return;

      totalPtsc += parseNumber(d.PTSC);
      totalAbts += parseNumber(d.ABTS);
      totalBooyahs += parseNumber(d.B);
      totalMatches++;
    });

    const winRate = totalMatches > 0 ? Math.round((totalBooyahs / totalMatches) * 100) : 0;

    const playerStatsMap = new Map<string, {
      name: string;
      img: string;
      kills: number;
      dmg: number;
      hs: number;
      knocks: number;
      assists: number;
      matches: number;
      mvp: number;
    }>();

    // 1. Gather all unique players belonging to selectedTeam from data.players and data.characters
    const teamPlayerNames = new Set<string>();
    data.players.forEach(p => {
      if (p.TIME?.toLowerCase() === selectedTeam.toLowerCase() && p.PLAYER?.trim()) {
        teamPlayerNames.add(p.PLAYER.trim());
      }
    });
    data.characters.forEach(c => {
      if (c.Time?.toLowerCase() === selectedTeam.toLowerCase() && c.Player?.trim()) {
        teamPlayerNames.add(c.Player.trim());
      }
    });

    teamPlayerNames.forEach(pName => {
      const charEntry = data.characters.find(c => c.Player?.toLowerCase().trim() === pName.toLowerCase() && c.playerImg);
      const playerRef = data.playersDimension.find(d => d.Name.toLowerCase().trim() === pName.toLowerCase());
      const playerImg = charEntry?.playerImg || playerRef?.IMG || findDimImg(data.playersDimension, pName) || '';

      playerStatsMap.set(pName, {
        name: pName,
        img: playerImg,
        kills: 0,
        dmg: 0,
        hs: 0,
        knocks: 0,
        assists: 0,
        matches: 0,
        mvp: 0,
      });
    });

    // 2. Accumulate stats for each player
    data.players.forEach(p => {
      if (p.TIME?.toLowerCase() !== selectedTeam.toLowerCase()) return;
      if (selectedRd !== 'all' && p.RD?.toString() !== selectedRd) return;

      const pName = p.PLAYER?.trim();
      if (!pName || !playerStatsMap.has(pName)) return;

      const pStat = playerStatsMap.get(pName)!;
      pStat.kills += parseNumber(p.Abates);
      pStat.dmg += parseNumber(p.Dano);
      pStat.hs += parseNumber(p.HS);
      pStat.knocks += parseNumber(p.Deitados);
      pStat.assists += parseNumber(p.Assistencias);
      pStat.mvp += parseNumber(p.MVP);
      pStat.matches++;
    });

    let roster = Array.from(playerStatsMap.values()).sort((a, b) => b.kills - a.kills);

    // If no players found in stats for filtered round, grab overall roster for the team across all rounds
    if (roster.length === 0 || roster.every(r => r.matches === 0)) {
      const fallbackMap = new Map<string, typeof roster[0]>();
      data.players.forEach(p => {
        if (p.TIME?.toLowerCase() !== selectedTeam.toLowerCase()) return;
        const pName = p.PLAYER?.trim();
        if (!pName) return;
        if (!fallbackMap.has(pName)) {
          const charEntry = data.characters.find(c => c.Player?.toLowerCase().trim() === pName.toLowerCase() && c.playerImg);
          const playerRef = data.playersDimension.find(d => d.Name.toLowerCase().trim() === pName.toLowerCase());
          const playerImg = charEntry?.playerImg || playerRef?.IMG || findDimImg(data.playersDimension, pName) || '';
          fallbackMap.set(pName, {
            name: pName,
            img: playerImg,
            kills: 0,
            dmg: 0,
            hs: 0,
            knocks: 0,
            assists: 0,
            matches: 0,
            mvp: 0,
          });
        }
        const pStat = fallbackMap.get(pName)!;
        pStat.kills += parseNumber(p.Abates);
        pStat.dmg += parseNumber(p.Dano);
        pStat.hs += parseNumber(p.HS);
        pStat.knocks += parseNumber(p.Deitados);
        pStat.assists += parseNumber(p.Assistencias);
        pStat.mvp += parseNumber(p.MVP);
        pStat.matches++;
      });
      roster = Array.from(fallbackMap.values()).sort((a, b) => b.kills - a.kills);
    }

    return {
      teamName: selectedTeam,
      teamImg,
      totalPtsc,
      totalAbts,
      totalBooyahs,
      totalMatches,
      winRate,
      roster: roster.slice(0, 5)
    };
  }, [activeTab, selectedTeam, selectedRd, data.details, data.players, data.characters, data.teamsReference, data.playersDimension]);

  const handleDownload = async () => {
    if (!bannerRef.current) return;
    setIsGenerating(true);
    
    const wrapperElement = bannerRef.current.parentElement;
    const originalClassName = wrapperElement ? wrapperElement.className : '';
    
    if (wrapperElement) {
      wrapperElement.className = 'relative origin-top'; // Remove transform and scale classes
    }

    await new Promise(r => setTimeout(r, 100)); // allow DOM to update

    try {
      const isFeed = activeTab === 'map_kings' || activeTab === 'drop_kings' || activeTab === 'role_kings' || activeTab === 'team_map_kings' || activeTab === 'team_drop_kings' || (activeTab === 'esport_squad' && squadFormat === 'feed');
      const canvasHeight = isFeed ? 1350 : 1920;

      const canvas = await html2canvas(bannerRef.current, {
        scale: 3, // Alta definição
        backgroundColor: '#000000',
        useCORS: true,
        width: 1080,
        height: canvasHeight,
        windowWidth: 1080,
        windowHeight: canvasHeight,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      
      let filename = "";
      if (activeTab === 'map_kings' || activeTab === 'drop_kings' || activeTab === 'role_kings' || activeTab === 'team_map_kings' || activeTab === 'team_drop_kings') {
        filename = `Post_Instagram_${activeTab}_${selectedMapOrDrop.replace(/\//g, '-')}.png`;
      } else if (activeTab === 'map_kings_stories' || activeTab === 'drop_kings_stories' || activeTab === 'role_kings_stories' || activeTab === 'team_map_kings_stories' || activeTab === 'team_drop_kings_stories') {
        filename = `Stories_Instagram_${activeTab}_${storiesSubtype}_${selectedMapOrDrop.replace(/\//g, '-')}.png`;
      } else if (activeTab === 'fifa_card') {
        const rdPart = selectedRd === 'all' ? 'Geral' : `RD${selectedRd}`;
        const qPart = selectedQueda === 'all' ? '' : `_Q${selectedQueda}`;
        filename = `FIFA_Card_${fifaCardMode}_${fifaCardSelected}_${rdPart}${qPart}.png`;
      } else if (activeTab === 'esport_squad') {
        const rdPart = selectedRd === 'all' ? 'Geral' : `RD${selectedRd}`;
        filename = `Banner_Esport_Squad_${selectedTeam}_${squadFormat}_${rdPart}.png`;
      } else {
        const rdPart = selectedRd === 'all' ? 'Geral' : `RD_${selectedRd}`;
        filename = `Stories_Banner_${activeTab}_${rdPart}.png`;
      }

      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      alert('Ocorreu um erro ao gerar o banner. Verifique se há imagens bloqueadas pelo navegador.');
    } finally {
      if (wrapperElement) {
        wrapperElement.className = originalClassName;
      }
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1a1a1a] p-6 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-wider flex items-center gap-2">
            <ImageIcon className="text-yellow-500" />
            Gerador de Banners (Stories & Feed)
          </h2>
          <p className="text-gray-400 text-sm mt-1">Gere banners para Instagram Stories e Feed com os destaques de jogadores e equipes.</p>
        </div>
        
        <div className="flex flex-col xl:flex-row xl:items-end flex-wrap gap-4 w-full lg:w-auto">
          {/* Tab Categories */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Stories Category */}
            <div className="flex flex-col gap-1.5">
              <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">Stories (1080x1920)</span>
              <div className="flex flex-wrap bg-black p-1 rounded-xl border border-white/10 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('teams')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    activeTab === 'teams' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Top 3
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('players')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    activeTab === 'players' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Top Jogadores
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('team_perf')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    activeTab === 'team_perf' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Por Equipe
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('map_kings_stories')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    activeTab === 'map_kings_stories' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Jog. Mapa
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('drop_kings_stories')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    activeTab === 'drop_kings_stories' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Jog. Queda
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('role_kings_stories')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    activeTab === 'role_kings_stories' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Top Funções
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('team_map_kings_stories')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    activeTab === 'team_map_kings_stories' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Times Mapa
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('team_drop_kings_stories')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    activeTab === 'team_drop_kings_stories' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Times Call
                </button>
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">Cartões (Fifa Card)</span>
              <div className="flex flex-wrap bg-black p-1 rounded-xl border border-white/10 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('fifa_card')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    activeTab === 'fifa_card' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  FIFA Card
                </button>
              </div>
            </div>

            {/* Squad Esport Banner Category (Estilo LOUD) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-green-400 font-bold uppercase tracking-widest text-[11px] flex items-center gap-1">
                ★ Squad Esport (Estilo LOUD)
              </span>
              <div className="flex flex-wrap bg-black p-1 rounded-xl border border-green-500/30 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('esport_squad')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    activeTab === 'esport_squad' ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-emerald-400 hover:text-white'
                  }`}
                >
                  Banner Squad
                </button>
              </div>
            </div>

            {/* Feed Category */}
            <div className="flex flex-col gap-1.5">
              <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">Feed (1080x1350)</span>
              <div className="flex flex-wrap bg-black p-1 rounded-xl border border-white/10 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('map_kings')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    activeTab === 'map_kings' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Jog. Mapa
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('drop_kings')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    activeTab === 'drop_kings' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Jog. Queda
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('role_kings')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    activeTab === 'role_kings' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Top Funções
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('team_map_kings')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    activeTab === 'team_map_kings' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Times Mapa
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('team_drop_kings')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    activeTab === 'team_drop_kings' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Times Queda
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3 flex-1 md:flex-initial">
            {/* Esport Squad Options */}
            {activeTab === 'esport_squad' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px] leading-none">Equipe</span>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="bg-black border border-green-500/40 text-white rounded-xl px-3 py-2.5 font-bold uppercase text-xs focus:border-green-400 outline-none"
                  >
                    {availableTeams.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px] leading-none">Formato</span>
                  <select
                    value={squadFormat}
                    onChange={(e) => setSquadFormat(e.target.value as 'feed' | 'stories')}
                    className="bg-black border border-white/10 text-white rounded-xl px-3 py-2.5 font-bold uppercase text-xs outline-none"
                  >
                    <option value="feed">Feed (1080x1350)</option>
                    <option value="stories">Stories (1080x1920)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px] leading-none">Tema de Cores</span>
                  <select
                    value={squadColorTheme}
                    onChange={(e) => setSquadColorTheme(e.target.value)}
                    className="bg-black border border-white/10 text-white rounded-xl px-3 py-2.5 font-bold uppercase text-xs outline-none"
                  >
                    {Object.entries(SQUAD_THEMES).map(([k, v]) => (
                      <option key={k} value={k}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            {/* Map/Drop/Role Selector */}
            {(activeTab === 'map_kings' || activeTab === 'drop_kings' || activeTab === 'role_kings' || activeTab === 'team_map_kings' || activeTab === 'team_drop_kings' || activeTab === 'map_kings_stories' || activeTab === 'drop_kings_stories' || activeTab === 'role_kings_stories' || activeTab === 'team_map_kings_stories' || activeTab === 'team_drop_kings_stories') && (
              <div className="flex flex-col gap-1.5">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px] leading-none">
                  {(activeTab === 'role_kings' || activeTab === 'role_kings_stories') ? 'Função' : (activeTab === 'map_kings' || activeTab === 'map_kings_stories' || activeTab === 'team_map_kings' || activeTab === 'team_map_kings_stories') ? 'Mapa' : 'Queda'}
                </span>
                <select 
                  value={selectedMapOrDrop}
                  onChange={(e) => setSelectedMapOrDrop(e.target.value)}
                  className="bg-black border border-white/10 text-white rounded-xl px-3 py-2.5 font-bold uppercase text-xs"
                >
                  {currentKingsData.map(g => (
                    <option key={g.name} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Model Selector (Available for Feed and Stories) */}
            {isKingsTab && (
              <div className="flex flex-col gap-1.5">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px] leading-none">Modelo do Banner</span>
                <select 
                  value={storiesSubtype}
                  onChange={(e) => setStoriesSubtype(e.target.value)}
                  className="bg-black border border-white/10 text-white rounded-xl px-3 py-2.5 font-bold uppercase text-xs"
                >
                  <option value="highlights">Destaques Completos</option>
                  <option value="zero_kills">{isTeamTab ? 'Times que Mais Zeram (0 Pontos)' : 'Mais Zera'}</option>
                  <option value="matches">Partidas e Médias</option>
                  <option value="damage">Maiores Danos</option>
                  <option value="avg_kills">{isTeamTab ? 'Mais Média de Abates' : 'Mais Média de Kills'}</option>
                  <option value="knocks">{isTeamTab ? 'Times que Mais Derrubam' : 'Mais Derruba'}</option>
                  <option value="hs">{isTeamTab ? 'Times com Mais HS' : 'Mais HS e Médias'}</option>
                  <option value="revives">{isTeamTab ? 'Times que Mais Revivem' : 'Mais Revive'}</option>
                  <option value="allies_revived">{isTeamTab ? 'Times com Mais Aliados Revividos' : 'Mais Aliados Revive'}</option>
                  <option value="mvp">{isTeamTab ? 'Times com Mais MVPs' : 'Mais MVP'}</option>
                  <option value="deaths">{isTeamTab ? 'Times que Mais Morrem' : 'Mais Morre'}</option>
                </select>
              </div>
            )}

            
            {activeTab === 'fifa_card' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px] leading-none">Tipo</span>
                  <select
                    value={fifaCardMode}
                    onChange={(e) => { setFifaCardMode(e.target.value as 'player' | 'team'); setFifaCardSelected(''); }}
                    className="bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold focus:border-yellow-500 outline-none w-32 text-xs uppercase"
                  >
                    <option value="player">Jogador</option>
                    <option value="team">Time</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px] leading-none">{fifaCardMode === 'player' ? 'Jogador' : 'Time'}</span>
                  <select
                    value={fifaCardSelected}
                    onChange={(e) => setFifaCardSelected(e.target.value)}
                    className="bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold focus:border-yellow-500 outline-none w-48 text-xs uppercase"
                  >
                    <option value="" disabled>Selecionar</option>
                    {fifaCardMode === 'player' 
                      ? Array.from(new Set(data.players.map(p => p.PLAYER))).sort().map(p => <option key={p} value={p}>{p}</option>)
                      : availableTeams.map(t => <option key={t} value={t}>{t}</option>)
                    }
                  </select>
                </div>
              </>
            )}

            {activeTab === 'team_perf' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px] leading-none">Equipe</span>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold focus:border-yellow-500 outline-none w-40 text-xs uppercase"
                >
                  <option value="" disabled>Equipe</option>
                  {availableTeams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}

            {activeTab !== 'map_kings' && activeTab !== 'drop_kings' && activeTab !== 'role_kings' && activeTab !== 'map_kings_stories' && activeTab !== 'drop_kings_stories' && activeTab !== 'role_kings_stories' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px] leading-none">Rodada</span>
                <select
                  value={selectedRd}
                  onChange={(e) => {
                    setSelectedRd(e.target.value);
                    setSelectedQueda('all');
                  }}
                  className="bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold focus:border-yellow-500 outline-none w-40 text-xs"
                >
                  <option value="" disabled>Rodada</option>
                  <option value="all">Geral (Todas)</option>
                  {availableRds.map(rd => (
                    <option key={rd} value={rd}>Rodada {rd}</option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'fifa_card' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px] leading-none">Queda</span>
                <select
                  value={selectedQueda}
                  onChange={(e) => setSelectedQueda(e.target.value)}
                  className="bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white font-bold focus:border-yellow-500 outline-none w-36 text-xs uppercase"
                >
                  <option value="all">Todas Quedas</option>
                  {availableQuedas.map(q => (
                    <option key={q} value={q}>Queda {q}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={
                isGenerating || 
                (activeTab === 'fifa_card' && !fifaCardSelected) ||
                (activeTab !== 'fifa_card' && !isKingsTab && activeTab !== 'team_perf' && !selectedRd) || 
                (activeTab === 'team_perf' && !selectedTeam) || 
                (isKingsTab && !selectedMapOrDrop)
              }
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] disabled:opacity-50 shrink-0 text-xs h-[38px] md:h-auto"
            >
              <Download size={14} />
              {isGenerating ? 'Gerando...' : 'Baixar'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex md:justify-center bg-white/5 p-4 md:p-8 rounded-3xl border border-white/5 overflow-x-auto">
        
        {/* Banner Real (Scale down for preview, full size for render) */}
        <div className={`relative origin-top transform scale-[0.3] min-[380px]:scale-[0.35] sm:scale-[0.5] md:scale-[0.6] lg:scale-[0.7] ${isFeedTab ? '-mb-[945px] min-[380px]:-mb-[877px] sm:-mb-[675px] md:-mb-[540px] lg:-mb-[405px]' : '-mb-[1344px] min-[380px]:-mb-[1248px] sm:-mb-[960px] md:-mb-[768px] lg:-mb-[576px]'}`}>
          
          <div 
            ref={bannerRef}
            className={`bg-gradient-to-br from-[#1a1a1a] to-black w-[1080px] ${isFeedTab ? 'h-[1350px]' : 'h-[1920px]'} relative overflow-hidden flex flex-col font-display border border-white/5`}
            style={{ padding: '80px', boxSizing: 'border-box' }}
          >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-yellow-500/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-500/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none translate-y-1/2 -translate-x-1/3"></div>
            
            {/* Header */}
            {!isKingsTab && activeTab !== 'esport_squad' && (
              <div className="text-center mb-12 relative z-10">
                <h1 className="text-[60px] font-black text-white uppercase tracking-[0.2em] italic mb-4">
                  {activeTab === 'fifa_card' ? (
                    <>FIFA CARD <span className="text-yellow-500">{
                      (selectedRd === 'all' && selectedQueda === 'all')
                        ? (fifaCardMode === 'player' ? 'JOGADOR' : 'EQUIPE')
                        : (selectedRd !== 'all' && selectedQueda !== 'all')
                        ? `RODADA ${selectedRd} • Q${selectedQueda}`
                        : selectedRd !== 'all'
                        ? `RODADA ${selectedRd}`
                        : `QUEDA ${selectedQueda}`
                    }</span></>
                  ) : activeTab === 'team_perf' ? (
                    <>Desempenho <span className="text-yellow-500">{selectedRd === 'all' ? 'Geral' : 'Rodada ' + selectedRd}</span></>
                  ) : (
                    <>{selectedRd === 'all' ? 'Classificação' : 'Rodada'} <span className="text-yellow-500">{selectedRd === 'all' ? 'Geral' : selectedRd}</span></>
                  )}
                </h1>
                <div className="h-1 w-32 bg-yellow-500 mx-auto rounded-full"></div>
              </div>
            )}

            {/* SQUAD ESPORT BANNER (ESTILO LOUD) */}
            {activeTab === 'esport_squad' && (() => {
              const theme = SQUAD_THEMES[squadColorTheme] || SQUAD_THEMES.neon_green;
              return (
                <div className={`absolute inset-0 w-[1080px] ${squadFormat === 'feed' ? 'h-[1350px]' : 'h-[1920px]'} overflow-hidden bg-gradient-to-b ${theme.bgGradient} font-display p-10 flex flex-col justify-between text-white z-20`}>
                  
                  {/* Tech Grid Pattern */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#ffffff0d,transparent_75%)] pointer-events-none" />

                  {/* Gigantic Repeating Stroke Watermark */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center opacity-[0.05] select-none pointer-events-none overflow-hidden leading-none">
                    <span className="text-[170px] font-black italic tracking-tighter uppercase whitespace-nowrap" style={{ WebkitTextStroke: `4px ${theme.primary}`, color: 'transparent' }}>
                      {bannerSquadData?.teamName || 'SQUAD'}
                    </span>
                    <span className="text-[170px] font-black italic tracking-tighter uppercase whitespace-nowrap text-white">
                      {bannerSquadData?.teamName || 'SQUAD'}
                    </span>
                    <span className="text-[170px] font-black italic tracking-tighter uppercase whitespace-nowrap" style={{ WebkitTextStroke: `4px ${theme.primary}`, color: 'transparent' }}>
                      {bannerSquadData?.teamName || 'SQUAD'}
                    </span>
                  </div>

                  {/* Neon Triangle Decorative Overlay */}
                  <div className="absolute top-8 right-8 opacity-75 pointer-events-none">
                    <svg width="220" height="220" viewBox="0 0 100 100" fill="none">
                      <polygon points="10,10 90,50 10,90 30,50" fill={theme.primary} fillOpacity="0.2" stroke={theme.primary} strokeWidth="3" />
                      <polygon points="30,25 80,50 30,75 45,50" fill={theme.primary} fillOpacity="0.6" />
                    </svg>
                  </div>

                  {/* TOP HEADER */}
                  <div className="relative z-30 flex items-center justify-between">
                    {/* Team Emblem & Name */}
                    <div className="flex items-center gap-5">
                      <div className={`w-24 h-24 rounded-3xl bg-black/90 p-3 border-2 ${theme.boxBorder} ${theme.boxGlow} flex items-center justify-center shrink-0`}>
                        {bannerSquadData?.teamImg ? (
                          <img src={bannerSquadData.teamImg} alt="" crossOrigin="anonymous" className="w-full h-full object-contain" />
                        ) : (
                          <span className={`text-3xl font-black ${theme.textPrimary}`}>
                            {bannerSquadData?.teamName.substring(0,3) || 'SQD'}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-md text-xs uppercase tracking-widest ${theme.badgeBg}`}>
                            FFWS BR 2026 SPLIT 2
                          </span>
                          <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">
                            {selectedRd === 'all' ? 'DESEMPENHO GERAL' : `RODADA ${selectedRd}`}
                          </span>
                        </div>
                        <h1 className="text-5xl font-black text-white italic uppercase tracking-wider mt-1 drop-shadow-xl">
                          {bannerSquadData?.teamName || 'EQUIPE'}
                        </h1>
                      </div>
                    </div>

                    {/* Top Right Highlight Card */}
                    <div className={`bg-black/90 border-2 ${theme.boxBorder} ${theme.boxGlow} rounded-2xl px-7 py-3.5 flex items-center gap-6 backdrop-blur-md`}>
                      <div className="text-center">
                        <span className={`text-4xl font-black ${theme.textPrimary} block leading-none`}>
                          {bannerSquadData?.winRate}%
                        </span>
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1 block">
                          WIN RATE
                        </span>
                      </div>
                      <div className="w-[1px] h-9 bg-white/20" />
                      <div className="text-center">
                        <span className="text-4xl font-black text-white block leading-none">
                          {bannerSquadData?.totalAbts || 0}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 block">
                          ABATES TOTAL
                        </span>
                      </div>
                      <div className="w-[1px] h-9 bg-white/20" />
                      <div className="text-center">
                        <span className={`text-4xl font-black ${theme.textPrimary} block leading-none`}>
                          {bannerSquadData?.totalBooyahs || 0}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 block">
                          BOOYAHS
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* MIDDLE SECTION: PLAYERS & CALLOUT CARDS INTEGRATED PER COLUMN */}
                  <div className="relative flex-1 my-6 flex flex-col justify-center">
                    
                    {/* 5 PLAYERS ROSTER & CARDS GRID */}
                    <div className="grid grid-cols-5 gap-3 items-end justify-items-center relative z-20 px-2">
                      {bannerSquadData?.roster.map((player, idx) => {
                        const badges = ['MVP', 'RUSHER', 'SUPORTE', 'GRANADEIRO', 'CAPITÃO'];
                        const roleBadge = badges[idx % 5];

                        // Stats tailored per player slot
                        let stat1Value = `${bannerSquadData.winRate}% WIN RATE`;
                        let stat1Label = 'TAXA DE VITÓRIAS';
                        let stat2Value = `${player.kills} KILLS`;
                        let stat2Label = 'TOP FRAGGER';

                        if (idx === 1) {
                          stat1Value = `${player.matches} JOGOS`;
                          stat1Label = 'DISPUTADOS';
                          stat2Value = `${player.kills} ABATES`;
                          stat2Label = 'DESTAQUE FRAGS';
                        } else if (idx === 2) {
                          stat1Value = `${player.assists} ASSIST.`;
                          stat1Label = 'SUPORTE TÁTICO';
                          stat2Value = `${player.kills} KILLS`;
                          stat2Label = 'PONTUAÇÃO INDIVIDUAL';
                        } else if (idx === 3) {
                          stat1Value = `${player.kills} ABATES`;
                          stat1Label = 'IMPACTO PARTIDA';
                          stat2Value = `${(player.dmg / 1000).toFixed(1)}K DANO`;
                          stat2Label = 'DANO TOTAL';
                        } else if (idx === 4) {
                          stat1Value = `${player.matches} JOGOS`;
                          stat1Label = 'PARTIDAS';
                          stat2Value = `${player.kills} ABATES`;
                          stat2Label = 'PONTUAÇÃO INDIVIDUAL';
                        }

                        return (
                          <div key={player.name + idx} className="flex flex-col items-center group relative w-full">
                            {/* 1. Stat Callout Box for this Player */}
                            <div className={`w-full bg-black/95 border-2 ${theme.boxBorder} ${theme.boxGlow} rounded-2xl p-3.5 backdrop-blur-md shadow-2xl relative z-30 flex flex-col justify-between`}>
                              <div className="flex items-center justify-between gap-1 border-b border-white/10 pb-1.5 mb-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${theme.badgeBg} truncate max-w-[90px]`}>
                                  {player.name}
                                </span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                                  {idx === 0 && <Zap size={10} className={theme.textPrimary} />}
                                  {roleBadge}
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <span className={`text-2xl font-black ${idx === 0 ? theme.textPrimary : 'text-white'} block leading-none`}>
                                    {stat1Value}
                                  </span>
                                  <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider block mt-0.5 truncate">
                                    {stat1Label}
                                  </span>
                                </div>
                                <div className="w-full h-[1px] bg-white/10" />
                                <div>
                                  <span className={`text-xl font-black ${idx === 0 ? 'text-white' : theme.textPrimary} block leading-none`}>
                                    {stat2Value}
                                  </span>
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mt-0.5 truncate">
                                    {stat2Label}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 2. Neon Connecting Line with Glowing Anchor Dot */}
                            <div className="flex flex-col items-center my-2 z-20">
                              <div className={`w-3.5 h-3.5 ${theme.dotBg} rounded-full border-2 border-black shadow-[0_0_10px_${theme.primary}]`} />
                              <div className={`w-[2px] h-7 bg-gradient-to-b ${theme.primary} to-transparent opacity-80`} />
                            </div>

                            {/* 3. Player Avatar Frame */}
                            <div className="relative w-full flex items-center justify-center my-1">
                              <div className={`absolute w-36 h-36 rounded-full ${idx === 0 ? 'bg-emerald-500/25' : 'bg-white/5'} blur-xl pointer-events-none`} />
                              
                              <div className={`relative w-32 h-32 rounded-full border-4 ${idx === 0 ? theme.boxBorder : 'border-white/20'} ${idx === 0 ? theme.boxGlow : ''} overflow-hidden bg-black/90 flex items-center justify-center shrink-0 shadow-2xl`}>
                                {player.img ? (
                                  <img
                                    src={player.img}
                                    alt={player.name}
                                    crossOrigin="anonymous"
                                    className="w-full h-full object-cover filter contrast-110"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                                    <User size={36} className={theme.textPrimary} />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 4. Player Name Badge */}
                            <div className={`mt-2 px-3 py-2 rounded-xl bg-black/90 border-2 ${theme.boxBorder} ${theme.boxGlow} backdrop-blur-md text-center w-full shadow-2xl shrink-0 z-30`}>
                              <span className="text-xl font-black text-white italic tracking-wider block uppercase leading-none truncate">
                                {player.name}
                              </span>
                              <span className={`text-[10px] font-bold ${theme.textPrimary} uppercase tracking-widest mt-1 block truncate`}>
                                {roleBadge}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>

                  {/* FOOTER BAR */}
                  <div className="relative z-30 flex items-center justify-between border-t border-white/10 pt-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Flame className={theme.textPrimary} size={20} />
                      <span className="text-sm font-bold text-gray-300 uppercase tracking-widest">
                        CAMPEONATO DE FREE FIRE • FFWS BR 2026 SPLIT 2
                      </span>
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest ${theme.textPrimary}`}>
                      @FFWSBR_OFICIAL
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Content Blocks */}
            {activeTab === 'teams' ? (
              <div className="flex-1 flex flex-col justify-center gap-20 relative z-10">
                
                {/* Pontos de Colocação */}
                <div className="bg-black/50 p-10 rounded-3xl border border-yellow-500/20 backdrop-blur-sm relative">
                  <div className="absolute -top-8 left-10 bg-yellow-500 text-black px-6 py-2 rounded-xl font-black text-2xl uppercase tracking-widest italic shadow-[0_10px_30px_rgba(234,179,8,0.3)]">
                    Top 3 - Colocação
                  </div>
                  <div className="flex items-end justify-center gap-12 mt-8">
                    {bannerData.topPtsc.map((team, idx) => {
                      const isFirst = idx === 0;
                      return (
                        <div key={team.name} className={`flex flex-col items-center gap-4 ${isFirst ? 'order-2 scale-110 -translate-y-8' : idx === 1 ? 'order-1' : 'order-3'}`}>
                          <span className="text-gray-400 font-bold text-2xl">#{idx + 1}</span>
                          <div className={`w-32 h-32 rounded-full border-4 ${isFirst ? 'border-yellow-400' : 'border-white/20'} bg-black overflow-hidden p-4 shadow-xl flex items-center justify-center`}>
                             {team.img ? (
                               <img src={team.img} alt={team.name} className="w-full h-full object-contain" />
                             ) : (
                               <span className="text-white text-3xl font-black uppercase">{team.name.substring(0,3)}</span>
                             )}
                          </div>
                          <div className="text-center">
                            <h3 className="text-white font-black text-3xl uppercase">{team.name}</h3>
                            <p className="text-yellow-400 font-black text-4xl mt-2">{team.ptsc} pts</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Abates */}
                <div className="bg-black/50 p-10 rounded-3xl border border-red-500/20 backdrop-blur-sm relative">
                  <div className="absolute -top-8 left-10 bg-red-500 text-white px-6 py-2 rounded-xl font-black text-2xl uppercase tracking-widest italic shadow-[0_10px_30px_rgba(239,68,68,0.3)]">
                    Top 3 - Abates
                  </div>
                  <div className="flex items-end justify-center gap-12 mt-8">
                    {bannerData.topAbts.map((team, idx) => {
                      const isFirst = idx === 0;
                      return (
                        <div key={team.name} className={`flex flex-col items-center gap-4 ${isFirst ? 'order-2 scale-110 -translate-y-8' : idx === 1 ? 'order-1' : 'order-3'}`}>
                          <span className="text-gray-400 font-bold text-2xl">#{idx + 1}</span>
                          <div className={`w-32 h-32 rounded-full border-4 ${isFirst ? 'border-red-400' : 'border-white/20'} bg-black overflow-hidden p-4 shadow-xl flex items-center justify-center`}>
                             {team.img ? (
                               <img src={team.img} alt={team.name} className="w-full h-full object-contain" />
                             ) : (
                               <span className="text-white text-3xl font-black uppercase">{team.name.substring(0,3)}</span>
                             )}
                          </div>
                          <div className="text-center">
                            <h3 className="text-white font-black text-3xl uppercase">{team.name}</h3>
                            <p className="text-red-400 font-black text-4xl mt-2">{team.abts} abates</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Booyahs */}
                <div className="bg-black/50 p-10 rounded-3xl border border-blue-500/20 backdrop-blur-sm relative">
                  <div className="absolute -top-8 left-10 bg-blue-500 text-white px-6 py-2 rounded-xl font-black text-2xl uppercase tracking-widest italic shadow-[0_10px_30px_rgba(59,130,246,0.3)]">
                    Top 3 - Booyahs
                  </div>
                  <div className="flex items-end justify-center gap-12 mt-8">
                    {bannerData.topBooyahs.map((team, idx) => {
                      const isFirst = idx === 0;
                      return (
                        <div key={team.name} className={`flex flex-col items-center gap-4 ${isFirst ? 'order-2 scale-110 -translate-y-8' : idx === 1 ? 'order-1' : 'order-3'}`}>
                          <span className="text-gray-400 font-bold text-2xl">#{idx + 1}</span>
                          <div className={`w-32 h-32 rounded-full border-4 ${isFirst ? 'border-blue-400' : 'border-white/20'} bg-black overflow-hidden p-4 shadow-xl flex items-center justify-center`}>
                             {team.img ? (
                               <img src={team.img} alt={team.name} className="w-full h-full object-contain" />
                             ) : (
                               <span className="text-white text-3xl font-black uppercase">{team.name.substring(0,3)}</span>
                             )}
                          </div>
                          <div className="text-center">
                            <h3 className="text-white font-black text-3xl uppercase">{team.name}</h3>
                            <p className="text-blue-400 font-black text-4xl mt-2">{team.booyahs} booyahs</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            ) : activeTab === 'players' ? (
              <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-12 relative z-10 my-4">
                <PlayerStatCard title="Top 3 - Abates" data={bannerPlayerData.topAbts} statKey="kills" avgKey="avgKills" statLabel="abates" color="red" />
                <PlayerStatCard title="Top 3 - Dano" data={bannerPlayerData.topDmg} statKey="dmg" avgKey="avgDmg" statLabel="dano" color="orange" />
                <PlayerStatCard title="Top 3 - Headshots (HS)" data={bannerPlayerData.topHs} statKey="hs" avgKey="avgHs" statLabel="HS" color="purple" />
                <PlayerStatCard title="Top 3 - Deitados" data={bannerPlayerData.topKnocks} statKey="knocks" avgKey="avgKnocks" statLabel="deitados" color="blue" />
              </div>
            
            ) : activeTab === 'fifa_card' ? (
              <div className="flex-1 flex flex-col justify-center items-center relative z-10 w-full h-full">
                <div className="transform scale-[2.5] origin-center">
                  <FifaCard 
                    data={data} 
                    mode={fifaCardMode} 
                    selectedId={fifaCardSelected} 
                    selectedRd={selectedRd}
                    selectedQueda={selectedQueda}
                  />
                </div>
              </div>

            ) : activeTab === 'team_perf' && bannerTeamPerfData ? (
              <div className="flex-1 flex flex-col justify-start gap-4 relative z-10 w-full">
                
                {/* Cabeçalho da Equipe e Resumo Coletivo */}
                <div className="bg-black/50 p-6 rounded-3xl border border-yellow-500/30 backdrop-blur-sm flex items-center justify-between shadow-[0_10px_30px_rgba(234,179,8,0.2)]">
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 rounded-full border-4 border-yellow-400 bg-black overflow-hidden p-4 shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center justify-center">
                      {bannerTeamPerfData.teamImg ? (
                        <img src={bannerTeamPerfData.teamImg} alt={bannerTeamPerfData.teamName} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-white text-4xl font-black uppercase">{bannerTeamPerfData.teamName.substring(0,3)}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-white font-black text-4xl uppercase tracking-wider">{bannerTeamPerfData.teamName}</h2>
                      <div className="text-gray-400 font-bold text-xl mt-1 uppercase tracking-widest">{bannerTeamPerfData.matches} Quedas Jogadas</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-8 text-center">
                     <div>
                       <p className="text-gray-400 font-bold text-lg uppercase mb-1">Pts Totais</p>
                       <p className="text-white font-black text-4xl">{bannerTeamPerfData.pts}</p>
                     </div>
                     <div>
                       <p className="text-gray-400 font-bold text-lg uppercase mb-1">Colocação</p>
                       <p className="text-yellow-400 font-black text-4xl">{bannerTeamPerfData.ptsc}</p>
                     </div>
                     <div>
                       <p className="text-gray-400 font-bold text-lg uppercase mb-1">Abates</p>
                       <p className="text-red-400 font-black text-4xl">{bannerTeamPerfData.abts}</p>
                     </div>
                     <div>
                       <p className="text-gray-400 font-bold text-lg uppercase mb-1">Booyahs</p>
                       <p className="text-blue-400 font-black text-4xl">{bannerTeamPerfData.booyahs}</p>
                     </div>
                  </div>
                </div>

                {/* Desempenho Individual (Grid) */}
                <div className="bg-black/50 p-6 rounded-3xl border border-white/10 backdrop-blur-sm flex-1 flex flex-col">
                  <h3 className="text-white font-black text-2xl uppercase tracking-widest italic mb-4 flex items-center gap-4 shrink-0">
                    <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>
                    Desempenho Individual
                  </h3>
                  
                  <div className="flex flex-col gap-3 flex-1 overflow-hidden justify-center">
                    {bannerTeamPerfData.players.slice(0, 5).map((player, idx) => (
                      <div key={player.name} className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-3">
                         <div className="text-gray-500 font-black text-2xl w-10 text-right">#{idx + 1}</div>
                         <div className="w-16 h-16 rounded-full border-2 border-white/20 bg-black overflow-hidden flex items-center justify-center shrink-0">
                            {player.img ? (
                              <img src={player.img} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-lg font-black uppercase">{player.name.substring(0,3)}</span>
                            )}
                         </div>
                         <div className="flex-1 min-w-0">
                           <h4 className="text-white font-black text-2xl uppercase truncate">{player.name}</h4>
                           <div className="text-gray-400 font-bold text-base">{player.matches} Quedas</div>
                         </div>
                         
                         <div className="flex gap-4 text-center shrink-0 pr-4">
                           <div className="w-28">
                             <p className="text-gray-500 font-bold text-xs uppercase mb-0.5">Abates</p>
                             <p className="text-white font-black text-2xl">{player.kills} <span className="text-gray-500 text-xs">({player.avgKills})</span></p>
                           </div>
                           <div className="w-28">
                             <p className="text-gray-500 font-bold text-xs uppercase mb-0.5">Dano</p>
                             <p className="text-white font-black text-2xl">{player.dmg} <span className="text-gray-500 text-xs">({player.avgDmg})</span></p>
                           </div>
                           <div className="w-28">
                             <p className="text-gray-500 font-bold text-xs uppercase mb-0.5">Deitados</p>
                             <p className="text-white font-black text-2xl">{player.knocks} <span className="text-gray-500 text-xs">({player.avgKnocks})</span></p>
                           </div>
                           <div className="w-28">
                             <p className="text-gray-500 font-bold text-xs uppercase mb-0.5">HS</p>
                             <p className="text-white font-black text-2xl">{player.hs} <span className="text-gray-500 text-xs">({player.avgHs})</span></p>
                           </div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desempenho por Mapa */}
                {bannerTeamPerfData.maps && bannerTeamPerfData.maps.length > 0 && (
                  <div className="bg-black/50 p-6 rounded-3xl border border-white/10 backdrop-blur-sm flex-1 flex flex-col">
                    <h3 className="text-white font-black text-2xl uppercase tracking-widest italic mb-4 flex items-center gap-4 shrink-0">
                      <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                      Desempenho por Mapa
                    </h3>
                    
                    <div className="flex flex-col gap-3 flex-1 overflow-hidden justify-center">
                      {bannerTeamPerfData.maps.slice(0, 5).map((map, idx) => (
                        <div key={map.mapName} className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-3 shadow-lg">
                           <div className="w-40 shrink-0 border-r border-white/10 pr-4">
                             <h4 className="text-white font-black text-2xl uppercase truncate">{map.mapName}</h4>
                             <div className="text-gray-400 font-bold text-base">{map.matches} Quedas</div>
                           </div>
                           
                           <div className="flex-1 flex gap-4 text-center justify-between">
                             <div className="flex-1 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                               <div className="text-gray-500 font-bold text-xs uppercase mb-0.5">Pts Totais</div>
                               <div className="text-white font-black text-xl">{map.pts} <span className="text-gray-500 text-xs">({map.avgPts})</span></div>
                             </div>
                             <div className="flex-1 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                               <div className="text-gray-500 font-bold text-xs uppercase mb-0.5">Colocação</div>
                               <div className="text-yellow-400 font-black text-xl">{map.ptsc} <span className="text-gray-500 text-xs">({map.avgPtsc})</span></div>
                             </div>
                             <div className="flex-1 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                               <div className="text-gray-500 font-bold text-xs uppercase mb-0.5">Abates</div>
                               <div className="text-red-400 font-black text-xl">{map.abts} <span className="text-gray-500 text-xs">({map.avgAbts})</span></div>
                             </div>
                             <div className="flex-1 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                               <div className="text-gray-500 font-bold text-xs uppercase mb-0.5">Booyahs</div>
                               <div className="text-blue-400 font-black text-xl">{map.booyahs} <span className="text-gray-500 text-xs">({map.avgBooyahs})</span></div>
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            ) : (activeTab === 'map_kings_stories' || activeTab === 'drop_kings_stories' || activeTab === 'role_kings_stories' || activeTab === 'team_map_kings_stories' || activeTab === 'team_drop_kings_stories') && currentKingsData.length > 0 && selectedMapOrDrop ? (
              (() => {
                const group = currentKingsData.find(g => g.name === selectedMapOrDrop);
                if (!group) return null;
                const type = (activeTab === 'map_kings_stories' || activeTab === 'team_map_kings_stories') ? 'map' : (activeTab === 'drop_kings_stories' || activeTab === 'team_drop_kings_stories') ? 'drop' : 'role';
                const groupPrefix = group.name.startsWith("TOD") 
                  ? group.name 
                  : isTeamTab
                    ? (type === 'map' ? `TIMES REIS DE ${group.name}` : `TIMES REIS DA ${group.name}`)
                    : (type === 'role' ? `FUNÇÃO ${group.name}` : `REIS DE ${group.name}`);
                
                let title = "";
                let playersList = [...group.players];
                let valueLabel = "";
                let valueExtractor = (p: any): string => "";
                let subValueExtractor = (p: any): string => "";

                switch (storiesSubtype) {
                  case 'matches':
                    title = `${groupPrefix}\nPARTIDAS E MÉDIAS`;
                    playersList.sort((a, b) => b.matches - a.matches || b.kills - a.kills);
                    valueLabel = "Partidas";
                    valueExtractor = (p) => `${p.matches}`;
                    subValueExtractor = (p) => `Média: ${p.avgKills.toFixed(2)}`;
                    break;
                  case 'damage':
                    title = `${groupPrefix}\nMAIORES DANOS`;
                    playersList.sort((a, b) => b.damage - a.damage);
                    valueLabel = "Dano";
                    valueExtractor = (p) => `${p.damage}`;
                    subValueExtractor = (p) => `Média: ${p.avgDamage.toFixed(0)}`;
                    break;
                  case 'avg_kills':
                    title = isTeamTab ? `${groupPrefix}\nMÉDIA DE ABATES` : `${groupPrefix}\nMÉDIA DE KILLS`;
                    playersList.sort((a, b) => b.avgKills - a.avgKills || b.kills - a.kills);
                    valueLabel = "Média";
                    valueExtractor = (p) => `${p.avgKills.toFixed(2)}`;
                    subValueExtractor = (p) => `Total Abates: ${p.kills}`;
                    break;
                  case 'knocks':
                    title = isTeamTab ? `${groupPrefix}\nMAIS DERRUBAM` : `${groupPrefix}\nMAIS DERRUBA`;
                    playersList.sort((a, b) => b.knocks - a.knocks);
                    valueLabel = "Deitados";
                    valueExtractor = (p) => `${p.knocks}`;
                    subValueExtractor = (p) => `Média: ${p.avgKnocks.toFixed(2)}`;
                    break;
                  case 'hs':
                    title = `${groupPrefix}\nMAIS HEADSHOTS`;
                    playersList.sort((a, b) => b.hs - a.hs);
                    valueLabel = "HS";
                    valueExtractor = (p) => `${p.hs}`;
                    subValueExtractor = (p) => `Média: ${p.avgHs.toFixed(2)}`;
                    break;
                  case 'zero_kills':
                    title = isTeamTab ? `${groupPrefix}\nTIMES QUE MAIS ZERAM\n(0 PONTOS NA PARTIDA)` : `${groupPrefix}\nMAIS ZERA`;
                    playersList.sort((a, b) => b.zeroKills - a.zeroKills || b.zeroRate - a.zeroRate || b.matches - a.matches);
                    valueLabel = "Zeradas";
                    valueExtractor = (p) => `${p.zeroKills}`;
                    subValueExtractor = (p) => isTeamTab 
                      ? `Taxa: ${p.zeroRate.toFixed(1)}% (${p.zeroKills}/${p.matches} quedas)` 
                      : `Taxa: ${p.zeroRate.toFixed(1)}% (${p.matches} quedas)`;
                    break;
                  case 'revives':
                    title = isTeamTab ? `${groupPrefix}\nMAIS REVIVEM` : `${groupPrefix}\nMAIS REVIVEU`;
                    playersList.sort((a, b) => b.reviveu - a.reviveu);
                    valueLabel = "Revives";
                    valueExtractor = (p) => `${p.reviveu}`;
                    subValueExtractor = (p) => `Média: ${(p.reviveu / (p.matches || 1)).toFixed(2)}`;
                    break;
                  case 'allies_revived':
                    title = `${groupPrefix}\nALIADOS REVIVIDOS`;
                    playersList.sort((a, b) => b.aliadosRevividos - a.aliadosRevividos);
                    valueLabel = "Aliados";
                    valueExtractor = (p) => `${p.aliadosRevividos}`;
                    subValueExtractor = (p) => `Média: ${(p.aliadosRevividos / (p.matches || 1)).toFixed(2)}`;
                    break;
                  case 'mvp':
                    title = `${groupPrefix}\nMAIS MVPs`;
                    playersList.sort((a, b) => b.mvp - a.mvp);
                    valueLabel = "MVPs";
                    valueExtractor = (p) => `${p.mvp}`;
                    subValueExtractor = (p) => `Partidas: ${p.matches}`;
                    break;
                  case 'deaths':
                    title = isTeamTab ? `${groupPrefix}\nMAIS MORREM` : `${groupPrefix}\nMAIS MORREU`;
                    playersList.sort((a, b) => b.deaths - a.deaths);
                    valueLabel = "Mortes";
                    valueExtractor = (p) => `${p.deaths}`;
                    subValueExtractor = (p) => `Média: ${(p.deaths / (p.matches || 1)).toFixed(2)}`;
                    break;
                  case 'highlights':
                  default:
                    title = isTeamTab
                      ? (type === 'map' ? 'TOP 5 TIMES REIS DO MAPA' : 'TOP 5 TIMES REIS DA QUEDA')
                      : (type === 'role' ? 'TOP 5 REIS POR FUNÇÃO' : `TOP 5 REIS DO ${type === 'map' ? 'MAPA' : 'QUEDA'}`);
                    playersList.sort((a, b) => b.kills - a.kills || b.avgKills - a.avgKills);
                    break;
                }

                const top5 = playersList.slice(0, 5);

                if (storiesSubtype === 'highlights') {
                  return (
                    <div className="absolute inset-0 z-10 flex flex-col bg-[#0a0a0a] px-10 pt-16 pb-8 justify-between">
                      {/* Header */}
                      <div className="flex flex-col items-center">
                        <h1 className="text-[52px] font-black text-white uppercase italic tracking-tighter leading-none text-center">
                          {isTeamTab 
                            ? (type === 'map' ? 'TOP 5 TIMES REIS DO MAPA' : 'TOP 5 TIMES REIS DA QUEDA')
                            : (type === 'role' ? 'TOP 5 REIS POR FUNÇÃO' : `TOP 5 REIS DO ${type === 'map' ? 'MAPA' : 'QUEDA'}`)}
                        </h1>
                        <div className="mt-2 px-6 py-1.5 bg-yellow-500 rounded-xl">
                          <span className="text-[32px] font-black text-black uppercase tracking-wider">{group.name}</span>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-start gap-8 mt-6">
                        {/* Top 5 list */}
                        <div className="flex flex-col gap-3">
                          <h2 className="text-[26px] font-black text-yellow-500 uppercase tracking-widest border-b-2 border-yellow-500/30 pb-2 mb-1">Ranking de Abates</h2>
                        {top5.map((p, idx) => {
                          const displayImg = isTeamTab ? (p.teamImg || p.playerImg) : p.playerImg;
                          return (
                            <div key={idx} className="flex items-center gap-3 bg-white/5 rounded-xl py-2 px-3 border border-white/10">
                              <div className="w-[45px] h-[45px] flex-shrink-0 bg-black/50 rounded-lg flex items-center justify-center font-black text-[22px] text-gray-500 border border-white/5">
                                {idx === 0 ? <Crown size={24} className="text-yellow-500" /> : idx + 1}
                              </div>
                              {displayImg ? (
                                <img src={displayImg} alt="" crossOrigin="anonymous" className={`${idx === 0 ? 'w-[65px] h-[65px] border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'w-[55px] h-[55px] border-gray-800'} flex-shrink-0 rounded-full border-2 ${isTeamTab ? 'object-contain p-1 bg-black/60' : 'object-cover'}`} />
                              ) : (
                                <div className="w-[55px] h-[55px] flex-shrink-0 rounded-full bg-gray-900 border-2 border-gray-800 flex items-center justify-center">
                                  <span className="text-gray-600 text-xs font-bold">{p.name ? p.name.substring(0, 3).toUpperCase() : 'N/A'}</span>
                                </div>
                              )}
                              <div className="flex-1 flex flex-col justify-center min-w-0">
                                <span className={`font-black uppercase italic leading-none truncate ${idx === 0 ? 'text-yellow-500 text-[28px]' : 'text-white text-[24px]'}`}>{p.name}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {!isTeamTab && p.teamImg && <img src={p.teamImg} alt="" crossOrigin="anonymous" className="w-5 h-5 object-contain opacity-75" />}
                                  <span className="text-[14px] font-bold text-gray-400 uppercase tracking-wider">{isTeamTab ? 'EQUIPE' : p.team}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-right">
                                <div className="flex flex-col items-center">
                                  <span className="text-[26px] font-black text-white leading-none">{p.matches}</span>
                                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider leading-none mt-1">Partidas</span>
                                </div>
                                <div className="w-[1px] h-8 bg-white/10" />
                                <div className="flex flex-col items-center">
                                  <span className="text-[26px] font-black text-white leading-none">{p.avgKills.toFixed(2)}</span>
                                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider leading-none mt-1">Média</span>
                                </div>
                                <div className="w-[1px] h-8 bg-white/10" />
                                <div className="flex flex-col items-center min-w-[55px]">
                                  <span className="text-[36px] font-black text-yellow-500 leading-none">{p.kills}</span>
                                  <span className="text-[13px] font-bold text-yellow-500 uppercase tracking-wider leading-none mt-1">Kills</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 3x3 Highlights Grid */}
                      <div className="flex flex-col gap-2 mt-4">
                        <h2 className="text-[26px] font-black text-yellow-500 uppercase tracking-widest border-b-2 border-yellow-500/30 pb-2 mb-1">Destaques</h2>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { title: "Maior Dano", player: group.topDamage, value: group.topDamage?.damage, icon: <Flame className="text-red-500" size={18} />, color: "bg-red-500/10 border-red-500/20 text-red-500" },
                            { title: isTeamTab ? "Média Abates" : "Média Kills", player: group.topAvgKills, value: group.topAvgKills?.avgKills.toFixed(2), icon: <Crosshair className="text-green-500" size={18} />, color: "bg-green-500/10 border-green-500/20 text-green-500" },
                            { title: isTeamTab ? "Mais Derrubam" : "Mais Derruba", player: group.topKnocks, value: group.topKnocks?.knocks, icon: <AlertTriangle className="text-orange-500" size={18} />, color: "bg-orange-500/10 border-orange-500/20 text-orange-500" },
                            { title: isTeamTab ? "Mais HS" : "Mais HS", player: group.topHs, value: group.topHs?.hs, icon: <TargetIcon className="text-yellow-500" size={18} />, color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" },
                            { title: isTeamTab ? "Mais Zeram (0 Pts)" : "Mais Zera", player: group.topZero, value: `${group.topZero?.zeroKills ?? 0}`, icon: <Skull className="text-gray-400" size={18} />, color: "bg-gray-500/10 border-gray-500/20 text-gray-400" },
                            { title: isTeamTab ? "Mais Revivem" : "Mais Revive", player: group.topRevives, value: group.topRevives?.reviveu, icon: <Activity className="text-cyan-500" size={18} />, color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500" },
                            { title: isTeamTab ? "Aliados Rev." : "Aliados Rev", player: group.topAlliesRevived, value: group.topAlliesRevived?.aliadosRevividos, icon: <Shield className="text-emerald-500" size={18} />, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" },
                            { title: isTeamTab ? "Mais MVPs" : "Mais MVP", player: group.topMvp, value: group.topMvp?.mvp, icon: <Star className="text-purple-500" size={18} />, color: "bg-purple-500/10 border-purple-500/20 text-purple-500" },
                            { title: isTeamTab ? "Mais Morrem" : "Mais Morre", player: group.topDeaths, value: group.topDeaths?.deaths, icon: <Skull className="text-rose-500" size={18} />, color: "bg-rose-500/10 border-rose-500/20 text-rose-500" },
                          ].map((h, i) => (
                            <div key={i} className="flex flex-col p-2.5 rounded-xl border border-white/5 bg-white/5 min-w-0 justify-between h-[120px]">
                              <div className="flex items-center gap-1.5 border-b border-white/5 pb-1">
                                <div className={`p-1.5 rounded-lg ${h.color} border flex-shrink-0`}>
                                  {h.icon}
                                </div>
                                <span className="text-[13px] font-black text-gray-400 uppercase tracking-wider truncate flex-1 leading-none">{h.title}</span>
                              </div>
                              <div className="flex flex-col mt-2 justify-center">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {isTeamTab && h.player?.teamImg && (
                                    <img src={h.player.teamImg} alt="" crossOrigin="anonymous" className="w-4 h-4 object-contain shrink-0" />
                                  )}
                                  <span className="text-[20px] font-black text-white italic uppercase truncate leading-none mb-1">{h.player?.name || "-"}</span>
                                </div>
                                <span className={`text-[28px] font-black italic leading-none ${h.color.split(' ')[2]}`}>
                                  {h.value ?? 0}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-4 text-center text-gray-500 text-lg font-bold uppercase tracking-widest border-t border-white/5 pt-3">
                        FFWS BR 2026 - SPLIT 2
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="absolute inset-0 z-10 flex flex-col bg-[#0a0a0a] px-12 pt-20 pb-12 justify-between">
                      {/* Header */}
                      <div className="flex flex-col items-center">
                        <span className="text-[26px] font-black text-yellow-500 uppercase tracking-[0.3em] leading-none mb-2">TOP 5</span>
                        <h1 className="text-[55px] font-black text-white uppercase italic tracking-tighter leading-none text-center whitespace-pre-line">
                          {title}
                        </h1>
                        <div className="h-1.5 w-32 bg-yellow-500 mt-4 rounded-full"></div>
                      </div>

                      {/* Top 5 list */}
                      <div className="flex-1 flex flex-col justify-start gap-6 mt-10">
                        {top5.map((p, idx) => {
                          const displayImg = isTeamTab ? (p.teamImg || p.playerImg) : p.playerImg;
                          return (
                            <div key={idx} className="flex items-center gap-6 bg-white/5 rounded-3xl p-5 border border-white/10 hover:bg-white/10 transition-all">
                              <div className="w-[70px] h-[70px] flex-shrink-0 bg-black/60 rounded-2xl flex items-center justify-center font-black text-[35px] text-gray-500 border border-white/5 shadow-inner">
                                {idx === 0 ? <Crown size={38} className="text-yellow-500" /> : idx + 1}
                              </div>
                              {displayImg ? (
                                <img src={displayImg} alt="" crossOrigin="anonymous" className={`${idx === 0 ? 'w-[110px] h-[110px] border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]' : 'w-[90px] h-[90px] border-gray-800'} flex-shrink-0 rounded-full border-4 ${isTeamTab ? 'object-contain p-2 bg-black/60' : 'object-cover'}`} />
                              ) : (
                                <div className="w-[90px] h-[90px] flex-shrink-0 rounded-full bg-gray-900 border-4 border-gray-800 flex items-center justify-center">
                                  <span className="text-gray-600 font-bold">{p.name ? p.name.substring(0, 3).toUpperCase() : 'N/A'}</span>
                                </div>
                              )}
                              <div className="flex-1 flex flex-col justify-center min-w-0">
                                <span className={`font-black uppercase italic leading-none truncate ${idx === 0 ? 'text-yellow-500 text-[42px] drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'text-white text-[34px]'}`}>{p.name}</span>
                                <div className="flex items-center gap-3 mt-2">
                                  {!isTeamTab && p.teamImg && <img src={p.teamImg} alt="" crossOrigin="anonymous" className="w-6 h-6 object-contain opacity-75" />}
                                  <span className="text-[18px] font-bold text-gray-400 uppercase tracking-widest">{isTeamTab ? 'EQUIPE' : p.team}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end justify-center pr-2">
                                <span className="text-[52px] font-black text-yellow-500 leading-none">{valueExtractor(p)}</span>
                                <span className="text-[15px] font-bold text-gray-500 uppercase mt-1 tracking-wider whitespace-nowrap">{subValueExtractor(p)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer */}
                      <div className="text-center text-gray-500 text-2xl font-bold uppercase tracking-widest border-t border-white/5 pt-6">
                        FFWS BR 2026 - SPLIT 2
                      </div>
                    </div>
                  );
                }
              })()
            ) : (activeTab === 'map_kings' || activeTab === 'drop_kings' || activeTab === 'role_kings' || activeTab === 'team_map_kings' || activeTab === 'team_drop_kings') && currentKingsData.length > 0 && selectedMapOrDrop ? (
              (() => {
                const group = currentKingsData.find(g => g.name === selectedMapOrDrop);
                if (!group) return null;
                const type = (activeTab === 'map_kings' || activeTab === 'team_map_kings') ? 'map' : (activeTab === 'drop_kings' || activeTab === 'team_drop_kings') ? 'drop' : 'role';

                if (storiesSubtype === 'highlights') {
                  const top5 = group.players.slice(0, 5);
                  return (
                    <div className="absolute inset-0 z-10 flex flex-col bg-[#0a0a0a]">
                      <div className="pt-24 px-16 z-10 flex flex-col items-center">
                          <h1 className="text-[75px] font-black text-white uppercase italic tracking-tighter leading-none text-center">
                              {isTeamTab 
                                ? (type === 'map' ? 'TOP 5 TIMES REIS DO MAPA' : 'TOP 5 TIMES REIS DA QUEDA') 
                                : (type === 'role' ? 'TOP 5 REIS POR FUNÇÃO' : `TOP 5 REIS DO ${type === 'map' ? 'MAPA' : 'QUEDA'}`)}
                          </h1>
                          <div className="mt-4 px-10 py-3 bg-yellow-500 rounded-2xl">
                              <span className="text-[48px] font-black text-black uppercase tracking-widest">{group.name}</span>
                          </div>
                      </div>

                      <div className="flex-1 flex justify-center items-center gap-8 px-8 pt-4 pb-10 z-10">
                          {/* Left Side: Top 5 Ranking */}
                          <div className="w-[560px] flex flex-col gap-5 justify-center pb-0">
                              <h2 className="text-[32px] font-black text-yellow-500 uppercase tracking-widest border-b-4 border-yellow-500/30 pb-3 mb-1">Ranking de Abates</h2>
                              {top5.map((p, idx) => {
                                const displayImg = isTeamTab ? (p.teamImg || p.playerImg) : p.playerImg;
                                return (
                                  <div key={idx} className="flex items-center gap-3 bg-white/5 rounded-2xl py-3 px-4 border border-white/10">
                                      <div className="w-[55px] h-[55px] flex-shrink-0 bg-black/50 rounded-xl flex items-center justify-center font-black text-[26px] text-gray-500 border border-white/5">
                                          {idx === 0 ? <Crown size={32} className="text-yellow-500" /> : idx + 1}
                                      </div>
                                      {displayImg ? (
                                          <img src={displayImg} alt="" crossOrigin="anonymous" className={`${idx === 0 ? 'w-[85px] h-[85px] border-yellow-500 shadow-[0_0_18px_rgba(234,179,8,0.4)]' : 'w-[70px] h-[70px] border-gray-800'} flex-shrink-0 rounded-full border-4 ${isTeamTab ? 'object-contain p-1.5 bg-black/60' : 'object-cover'}`} />
                                      ) : (
                                          <div className="w-[70px] h-[70px] flex-shrink-0 rounded-full bg-gray-900 border-4 border-gray-800 flex items-center justify-center">
                                              <span className="text-gray-600 font-bold">{p.name ? p.name.substring(0, 3).toUpperCase() : 'N/A'}</span>
                                          </div>
                                      )}
                                      <div className="flex-1 flex flex-col justify-center min-w-0">
                                          <span className={`font-black uppercase italic leading-none truncate ${idx === 0 ? 'text-yellow-500 text-[42px] drop-shadow-[0_0_12px_rgba(234,179,8,0.4)]' : 'text-white text-[32px]'}`}>{p.name}</span>
                                          <div className="flex items-center gap-2 mt-1">
                                              {!isTeamTab && p.teamImg && <img src={p.teamImg} alt="" crossOrigin="anonymous" className="w-6 h-6 object-contain opacity-70" />}
                                              <span className="text-[16px] font-bold text-gray-400 uppercase tracking-widest truncate">{isTeamTab ? 'EQUIPE' : p.team}</span>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-3 text-right shrink-0">
                                          <div className="flex flex-col items-center min-w-[45px]">
                                              <span className="text-[26px] font-black text-white leading-none">{p.matches}</span>
                                              <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider leading-none mt-1">Partidas</span>
                                          </div>
                                          <div className="w-[1px] h-8 bg-white/10" />
                                          <div className="flex flex-col items-center min-w-[50px]">
                                              <span className="text-[26px] font-black text-white leading-none">{p.avgKills.toFixed(2)}</span>
                                              <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider leading-none mt-1">Média</span>
                                          </div>
                                          <div className="w-[1px] h-8 bg-white/10" />
                                          <div className="flex flex-col items-center min-w-[55px]">
                                              <span className="text-[38px] font-black text-yellow-500 leading-none">{p.kills}</span>
                                              <span className="text-[12px] font-bold text-yellow-500 uppercase tracking-wider leading-none mt-1">Kills</span>
                                          </div>
                                      </div>
                                  </div>
                                );
                              })}
                          </div>

                          {/* Right Side: Highlights Grid */}
                          <div className="w-[410px] flex flex-col gap-5">
                              <h2 className="text-[32px] font-black text-yellow-500 uppercase tracking-widest border-b-4 border-yellow-500/30 pb-3 mb-1">Destaques</h2>
                              
                              <div className="grid grid-cols-1 gap-3.5">
                                  {[
                                      { title: "Maior Dano", player: group.topDamage, value: group.topDamage?.damage, icon: <Flame className="text-red-500" size={28} />, color: "bg-red-500/10 border-red-500/20 text-red-500" },
                                      { title: isTeamTab ? "Média Abates" : "Média Kills", player: group.topAvgKills, value: group.topAvgKills?.avgKills.toFixed(2), icon: <Crosshair className="text-green-500" size={28} />, color: "bg-green-500/10 border-green-500/20 text-green-500" },
                                      { title: isTeamTab ? "Mais Derrubam" : "Mais Derruba", player: group.topKnocks, value: group.topKnocks?.knocks, icon: <AlertTriangle className="text-orange-500" size={28} />, color: "bg-orange-500/10 border-orange-500/20 text-orange-500" },
                                      { title: isTeamTab ? "Mais HS" : "Mais HS", player: group.topHs, value: group.topHs?.hs, icon: <TargetIcon className="text-yellow-500" size={28} />, color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" },
                                      { title: isTeamTab ? "Mais Zeram (0 Pts)" : "Mais Zera", player: group.topZero, value: `${group.topZero?.zeroKills ?? 0}`, icon: <Skull className="text-gray-400" size={28} />, color: "bg-gray-500/10 border-gray-500/20 text-gray-400" },
                                      { title: isTeamTab ? "Mais Revivem" : "Mais Revive", player: group.topRevives, value: group.topRevives?.reviveu, icon: <Activity className="text-cyan-500" size={28} />, color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500" },
                                      { title: isTeamTab ? "Aliados Revividos" : "Aliados Rev", player: group.topAlliesRevived, value: group.topAlliesRevived?.aliadosRevividos, icon: <Shield className="text-emerald-500" size={28} />, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" },
                                      { title: isTeamTab ? "Mais MVPs" : "Mais MVP", player: group.topMvp, value: group.topMvp?.mvp, icon: <Star className="text-purple-500" size={28} />, color: "bg-purple-500/10 border-purple-500/20 text-purple-500" },
                                      { title: isTeamTab ? "Mais Morrem" : "Mais Morre", player: group.topDeaths, value: group.topDeaths?.deaths, icon: <Skull className="text-rose-500" size={28} />, color: "bg-rose-500/10 border-rose-500/20 text-rose-500" },
                                  ].map((h, i) => (
                                      <div key={i} className={`flex items-center gap-3.5 py-2.5 px-4 rounded-2xl border border-white/5 bg-white/5`}>
                                          <div className={`p-3 rounded-xl ${h.color} border`}>
                                              {h.icon}
                                          </div>
                                          <div className="flex-1 flex flex-col justify-center min-w-0">
                                              <span className="text-[16px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">{h.title}</span>
                                              <div className="flex items-center gap-2">
                                                  {h.player?.teamImg && <img src={h.player.teamImg} alt="" crossOrigin="anonymous" className="w-6 h-6 object-contain shrink-0" />}
                                                  <span className="text-[28px] font-black text-white italic uppercase leading-none truncate">{h.player?.name || "-"}</span>
                                              </div>
                                          </div>
                                          <span className={`text-[36px] font-black italic shrink-0 ${h.color.split(' ')[2]}`}>
                                              {h.value ?? 0}
                                          </span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                    </div>
                  );
                } else {
                  // Dedicated Feed ranking for specific stats (e.g. Times que mais zeram)
                  const groupPrefix = isTeamTab
                    ? (type === 'map' ? `REIS DO MAPA ${group.name}` : `REIS DA QUEDA ${group.name}`)
                    : (type === 'role' ? `FUNÇÃO ${group.name}` : `REIS DE ${group.name}`);
                  
                  let title = "";
                  let playersList = [...group.players];
                  let valueLabel = "";
                  let valueExtractor = (p: any): string => "";
                  let subValueExtractor = (p: any): string => "";

                  switch (storiesSubtype) {
                    case 'matches':
                      title = `${groupPrefix} - PARTIDAS E MÉDIAS`;
                      playersList.sort((a, b) => b.matches - a.matches || b.kills - a.kills);
                      valueLabel = "Partidas";
                      valueExtractor = (p) => `${p.matches}`;
                      subValueExtractor = (p) => `Média: ${p.avgKills.toFixed(2)}`;
                      break;
                    case 'damage':
                      title = `${groupPrefix} - MAIORES DANOS`;
                      playersList.sort((a, b) => b.damage - a.damage);
                      valueLabel = "Dano";
                      valueExtractor = (p) => `${p.damage}`;
                      subValueExtractor = (p) => `Média: ${p.avgDamage.toFixed(0)}`;
                      break;
                    case 'avg_kills':
                      title = isTeamTab ? `${groupPrefix} - MÉDIA DE ABATES` : `${groupPrefix} - MÉDIA DE KILLS`;
                      playersList.sort((a, b) => b.avgKills - a.avgKills || b.kills - a.kills);
                      valueLabel = "Média";
                      valueExtractor = (p) => `${p.avgKills.toFixed(2)}`;
                      subValueExtractor = (p) => `Total Abates: ${p.kills}`;
                      break;
                    case 'knocks':
                      title = isTeamTab ? `${groupPrefix} - MAIS DERRUBAM` : `${groupPrefix} - MAIS DERRUBA`;
                      playersList.sort((a, b) => b.knocks - a.knocks);
                      valueLabel = "Deitados";
                      valueExtractor = (p) => `${p.knocks}`;
                      subValueExtractor = (p) => `Média: ${p.avgKnocks.toFixed(2)}`;
                      break;
                    case 'hs':
                      title = `${groupPrefix} - MAIS HEADSHOTS`;
                      playersList.sort((a, b) => b.hs - a.hs);
                      valueLabel = "HS";
                      valueExtractor = (p) => `${p.hs}`;
                      subValueExtractor = (p) => `Média: ${p.avgHs.toFixed(2)}`;
                      break;
                    case 'zero_kills':
                      title = isTeamTab ? `${groupPrefix} - TIMES QUE MAIS ZERAM (0 PONTOS)` : `${groupPrefix} - MAIS ZERA`;
                      playersList.sort((a, b) => b.zeroKills - a.zeroKills || b.zeroRate - a.zeroRate || b.matches - a.matches);
                      valueLabel = "Zeradas";
                      valueExtractor = (p) => `${p.zeroKills}`;
                      subValueExtractor = (p) => isTeamTab 
                        ? `Taxa: ${p.zeroRate.toFixed(1)}% (${p.zeroKills}/${p.matches} quedas)` 
                        : `Taxa: ${p.zeroRate.toFixed(1)}% (${p.matches} quedas)`;
                      break;
                    case 'revives':
                      title = isTeamTab ? `${groupPrefix} - MAIS REVIVEM` : `${groupPrefix} - MAIS REVIVEU`;
                      playersList.sort((a, b) => b.reviveu - a.reviveu);
                      valueLabel = "Revives";
                      valueExtractor = (p) => `${p.reviveu}`;
                      subValueExtractor = (p) => `Média: ${(p.reviveu / (p.matches || 1)).toFixed(2)}`;
                      break;
                    case 'allies_revived':
                      title = `${groupPrefix} - ALIADOS REVIVIDOS`;
                      playersList.sort((a, b) => b.aliadosRevividos - a.aliadosRevividos);
                      valueLabel = "Aliados";
                      valueExtractor = (p) => `${p.aliadosRevividos}`;
                      subValueExtractor = (p) => `Média: ${(p.aliadosRevividos / (p.matches || 1)).toFixed(2)}`;
                      break;
                    case 'mvp':
                      title = `${groupPrefix} - MAIS MVPs`;
                      playersList.sort((a, b) => b.mvp - a.mvp);
                      valueLabel = "MVPs";
                      valueExtractor = (p) => `${p.mvp}`;
                      subValueExtractor = (p) => `Total: ${p.mvp}`;
                      break;
                    case 'deaths':
                      title = isTeamTab ? `${groupPrefix} - TIMES QUE MAIS MORREM` : `${groupPrefix} - MAIS MORREU`;
                      playersList.sort((a, b) => b.deaths - a.deaths);
                      valueLabel = "Mortes";
                      valueExtractor = (p) => `${p.deaths}`;
                      subValueExtractor = (p) => `Média: ${(p.deaths / (p.matches || 1)).toFixed(2)}`;
                      break;
                    default:
                      title = `${groupPrefix} - RANKING`;
                      valueLabel = "Kills";
                      valueExtractor = (p) => `${p.kills}`;
                      subValueExtractor = (p) => `Média: ${p.avgKills.toFixed(2)}`;
                  }

                  const top5 = playersList.slice(0, 5);

                  return (
                    <div className="absolute inset-0 z-10 flex flex-col bg-[#0a0a0a] p-14 justify-between">
                      {/* Header */}
                      <div className="flex flex-col items-center text-center">
                        <h1 className="text-[48px] font-black text-white uppercase italic tracking-tighter leading-tight max-w-[950px]">
                          {title}
                        </h1>
                        <div className="mt-3 px-8 py-2 bg-yellow-500 rounded-xl">
                          <span className="text-[26px] font-black text-black uppercase tracking-widest">{group.name}</span>
                        </div>
                      </div>

                      {/* Top 5 Cards List */}
                      <div className="flex flex-col gap-4 my-auto">
                        {top5.map((p, idx) => {
                          const isLeader = idx === 0;
                          const displayImg = isTeamTab ? (p.teamImg || p.playerImg) : p.playerImg;
                          return (
                            <div 
                              key={idx} 
                              className={`flex items-center gap-6 px-8 py-4 rounded-3xl border transition-all ${
                                isLeader 
                                  ? 'bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-black border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]' 
                                  : 'bg-white/5 border-white/10'
                              }`}
                            >
                              {/* Position Badge */}
                              <div className={`w-[60px] h-[60px] flex-shrink-0 rounded-2xl flex items-center justify-center font-black text-[32px] ${
                                isLeader ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/40' : 'bg-black/50 text-gray-400 border border-white/5'
                              }`}>
                                {isLeader ? <Crown size={36} className="text-black" /> : idx + 1}
                              </div>

                              {/* Logo / Photo */}
                              {displayImg ? (
                                <img 
                                  src={displayImg} 
                                  alt="" 
                                  crossOrigin="anonymous" 
                                  className={`w-[85px] h-[85px] flex-shrink-0 rounded-full border-4 ${
                                    isLeader ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]' : 'border-gray-700'
                                  } ${isTeamTab ? 'object-contain p-2 bg-black/60' : 'object-cover'}`} 
                                />
                              ) : (
                                <div className="w-[85px] h-[85px] flex-shrink-0 rounded-full bg-gray-900 border-4 border-gray-800 flex items-center justify-center">
                                  <span className="text-gray-600 font-bold text-2xl">{p.name ? p.name.substring(0, 3).toUpperCase() : 'N/A'}</span>
                                </div>
                              )}

                              {/* Name & Sub-info */}
                              <div className="flex-1 flex flex-col justify-center min-w-0">
                                <span className={`font-black uppercase italic leading-none truncate ${
                                  isLeader ? 'text-yellow-400 text-[40px] drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'text-white text-[32px]'
                                }`}>
                                  {p.name}
                                </span>
                                <div className="flex items-center gap-3 mt-2">
                                  {!isTeamTab && p.teamImg && <img src={p.teamImg} alt="" crossOrigin="anonymous" className="w-6 h-6 object-contain opacity-70" />}
                                  <span className="text-[16px] font-bold text-gray-400 uppercase tracking-widest">
                                    {isTeamTab ? 'EQUIPE' : p.team}
                                  </span>
                                  {subValueExtractor(p) && (
                                    <>
                                      <span className="text-gray-600">•</span>
                                      <span className="text-[16px] font-bold text-yellow-500/90 uppercase tracking-wide">
                                        {subValueExtractor(p)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Big Stat Value */}
                              <div className="flex flex-col items-end shrink-0 min-w-[120px]">
                                <span className={`text-[46px] font-black italic leading-none ${
                                  isLeader ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'text-white'
                                }`}>
                                  {valueExtractor(p)}
                                </span>
                                <span className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                  {valueLabel}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer */}
                      <div className="text-center text-gray-500 text-xl font-bold uppercase tracking-widest border-t border-white/5 pt-4">
                        FFWS BR 2026 - SPLIT 2
                      </div>
                    </div>
                  );
                }
              })()
            ) : null}


            {/* Footer */}
            {!isKingsTab && (
              <div className="mt-16 text-center text-gray-500 text-2xl font-bold uppercase tracking-widest border-t border-white/5 pt-8 relative z-10">
                FFWS BR 2026 - SPLIT 2
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Banners;
