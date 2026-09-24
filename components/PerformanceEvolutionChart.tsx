import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Crown, 
  Flame, 
  Users, 
  Shield, 
  Sparkles, 
  Search, 
  X, 
  BarChart2, 
  Layers, 
  Activity, 
  Trophy, 
  Eye, 
  EyeOff, 
  Check, 
  ChevronDown, 
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';
import { DashboardData } from '../types';
import { findTeamLogo } from '../utils/teamUtils';
import { findDimImg } from '../utils/skillImages';

export type EvolutionEntityMode = 'players' | 'teams';
export type EvolutionMetric = 'kills' | 'avgKills' | 'winRate' | 'damage' | 'points';
export type EvolutionTimeScope = 'perRound' | 'cumulative';

interface PerformanceEvolutionChartProps {
  data: DashboardData;
  initialMode?: EvolutionEntityMode;
  initialMetric?: EvolutionMetric;
  initialSelectedEntities?: string[];
  className?: string;
}

// Paleta de cores esportivas de alto contraste para múltiplos atletas/equipes
const PALETTE = [
  '#EAB308', // Dourado
  '#38BDF8', // Ciano / Azul Claro
  '#EF4444', // Vermelho
  '#22C55E', // Verde Esmeralda
  '#A855F7', // Roxo
  '#F97316', // Laranja
  '#EC4899', // Rosa
  '#14B8A6', // Teal
  '#FACC15', // Amarelo
  '#6366F1', // Indigo
  '#84CC16', // Lima
  '#F43F5E', // Rose
];

const parseNumber = (val: string | number | undefined | null): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = val.toString().trim().replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const normalize = (val: string | undefined | null) => (val || '').trim().toUpperCase();

export const PerformanceEvolutionChart: React.FC<PerformanceEvolutionChartProps> = ({
  data,
  initialMode = 'teams',
  initialMetric = 'kills',
  initialSelectedEntities,
  className = ''
}) => {
  const [entityMode, setEntityMode] = useState<EvolutionEntityMode>(initialMode);
  const [metric, setMetric] = useState<EvolutionMetric>(initialMetric);
  const [timeScope, setTimeScope] = useState<EvolutionTimeScope>('perRound');
  const [isCurveSmooth, setIsCurveSmooth] = useState<boolean>(true);
  const [showLeagueAverage, setShowLeagueAverage] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [activeHoverKey, setActiveHoverKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // 1. Extrair e ordenar todas as rodadas oficiais do campeonato
  const sortedRounds = useMemo(() => {
    const roundsSet = new Set<string>();
    data.players.forEach(p => {
      if (p.RD && p.RD.trim()) roundsSet.add(p.RD.trim());
    });
    data.details.forEach(d => {
      if (d.RD && d.RD.trim()) roundsSet.add(d.RD.trim());
    });

    return Array.from(roundsSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [data.players, data.details]);

  // 2. Extrair lista única de todas as equipes disponíveis
  const allTeams = useMemo(() => {
    const map = new Map<string, { name: string; logo?: string; group?: string }>();
    data.teamsReference.forEach(t => {
      if (t.TIME && t.TIME.trim()) {
        const norm = normalize(t.TIME);
        map.set(norm, {
          name: t.TIME.trim(),
          logo: t.IMG,
          group: t.GRUPO
        });
      }
    });

    // Complementar com dados de match details se houver
    data.details.forEach(d => {
      if (d.TIME && d.TIME.trim()) {
        const norm = normalize(d.TIME);
        if (!map.has(norm)) {
          map.set(norm, {
            name: d.TIME.trim(),
            logo: findTeamLogo(d.TIME, data.teamsReference)
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [data.teamsReference, data.details]);

  // 3. Extrair lista única de todos os jogadores disponíveis
  const allPlayers = useMemo(() => {
    const map = new Map<string, { name: string; team: string; playerImg?: string; teamImg?: string; funcao?: string; totalKills: number }>();
    data.players.forEach(p => {
      if (p.PLAYER && p.PLAYER.trim()) {
        const pName = p.PLAYER.trim();
        const norm = normalize(pName);
        const kills = parseNumber(p.Abates);
        if (!map.has(norm)) {
          map.set(norm, {
            name: pName,
            team: (p.TIME || '').trim(),
            playerImg: findDimImg(data.playersDimension, pName),
            teamImg: findTeamLogo(p.TIME, data.teamsReference),
            funcao: p.S,
            totalKills: kills
          });
        } else {
          const current = map.get(norm)!;
          current.totalKills += kills;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalKills - a.totalKills);
  }, [data.players, data.playersDimension, data.teamsReference]);

  // 4. Estado de seleção de entidades (Jogadores ou Equipes)
  const [selectedEntities, setSelectedEntities] = useState<string[]>(() => {
    if (initialSelectedEntities && initialSelectedEntities.length > 0) {
      return initialSelectedEntities;
    }
    if (initialMode === 'players') {
      return allPlayers.slice(0, 4).map(p => p.name);
    }
    return allTeams.slice(0, 4).map(t => t.name);
  });

  // Alternar entre modo Equipes e Jogadores reiniciando seleção com presets inteligentes
  const handleToggleEntityMode = (newMode: EvolutionEntityMode) => {
    setEntityMode(newMode);
    if (newMode === 'players') {
      setSelectedEntities(allPlayers.slice(0, 4).map(p => p.name));
    } else {
      setSelectedEntities(allTeams.slice(0, 4).map(t => t.name));
    }
    setSearchFilter('');
  };

  const toggleSelectEntity = (name: string) => {
    const norm = normalize(name);
    setSelectedEntities(prev => {
      const exists = prev.some(n => normalize(n) === norm);
      if (exists) {
        if (prev.length <= 1) return prev; // Manter pelo menos 1 selecionado
        return prev.filter(n => normalize(n) !== norm);
      }
      if (prev.length >= 8) {
        // Limite de 8 simultâneos para manter legibilidade visual
        return [...prev.slice(1), name];
      }
      return [...prev, name];
    });
  };

  // 5. Presets rápidos de seleção
  const applyPreset = (presetKey: string) => {
    if (entityMode === 'teams') {
      if (presetKey === 'top4') {
        setSelectedEntities(allTeams.slice(0, 4).map(t => t.name));
      } else if (presetKey === 'top6') {
        setSelectedEntities(allTeams.slice(0, 6).map(t => t.name));
      } else if (presetKey === 'groupA') {
        const groupA = allTeams.filter(t => (t.group || '').toUpperCase().includes('A'));
        setSelectedEntities(groupA.slice(0, 6).map(t => t.name));
      } else if (presetKey === 'groupB') {
        const groupB = allTeams.filter(t => (t.group || '').toUpperCase().includes('B'));
        setSelectedEntities(groupB.slice(0, 6).map(t => t.name));
      } else if (presetKey === 'groupC') {
        const groupC = allTeams.filter(t => (t.group || '').toUpperCase().includes('C'));
        setSelectedEntities(groupC.slice(0, 6).map(t => t.name));
      }
    } else {
      if (presetKey === 'top4Kills') {
        setSelectedEntities(allPlayers.slice(0, 4).map(p => p.name));
      } else if (presetKey === 'top6Kills') {
        setSelectedEntities(allPlayers.slice(0, 6).map(p => p.name));
      }
    }
  };

  // 6. Processamento dos Dados Rodada a Rodada para o Gráfico
  const { chartData, entityColors, leagueAverages, summaries } = useMemo(() => {
    // Atribuir cor única e estável para cada entidade selecionada
    const colorsMap: Record<string, string> = {};
    selectedEntities.forEach((ent, idx) => {
      colorsMap[ent] = PALETTE[idx % PALETTE.length];
    });

    // Mapeamento prévio por rodada
    // Para Equipes:
    // data.details: RD, TIME, ABTS, POS (1 = Booyah), B (1 = Booyah), PTS, Q
    const teamRoundMap = new Map<string, Map<string, { kills: number; matches: number; booyahs: number; points: number }>>();
    // Para Jogadores:
    // data.players: RD, PLAYER, TIME, Abates, Dano, HS, Q
    const playerRoundMap = new Map<string, Map<string, { kills: number; matches: number; damage: number; hs: number; booyahs: number }>>();

    // Conjunto de quedas vitoriosas (Booyahs) por time, rodada e queda
    const teamBooyahDrops = new Set<string>(); // "RD_Q_TIME"
    data.details.forEach(d => {
      const isBooyah = d.POS === '1' || d.B === '1' || parseNumber(d.POS) === 1;
      if (isBooyah && d.RD && d.Q && d.TIME) {
        teamBooyahDrops.add(`${normalize(d.RD)}_${normalize(d.Q)}_${normalize(d.TIME)}`);
      }
    });

    // Preencher dados das equipes
    data.details.forEach(d => {
      if (!d.RD || !d.TIME) return;
      const rdNorm = normalize(d.RD);
      const teamNorm = normalize(d.TIME);
      const kills = parseNumber(d.ABTS);
      const pts = parseNumber(d.PTS || d.PTSC);
      const isBooyah = d.POS === '1' || d.B === '1' || parseNumber(d.POS) === 1;

      if (!teamRoundMap.has(rdNorm)) teamRoundMap.set(rdNorm, new Map());
      const rdTeams = teamRoundMap.get(rdNorm)!;

      if (!rdTeams.has(teamNorm)) {
        rdTeams.set(teamNorm, { kills: 0, matches: 0, booyahs: 0, points: 0 });
      }
      const st = rdTeams.get(teamNorm)!;
      st.kills += kills;
      st.matches += 1;
      st.points += pts;
      if (isBooyah) st.booyahs += 1;
    });

    // Preencher dados dos jogadores
    data.players.forEach(p => {
      if (!p.RD || !p.PLAYER) return;
      const rdNorm = normalize(p.RD);
      const pNorm = normalize(p.PLAYER);
      const kills = parseNumber(p.Abates);
      const dmg = parseNumber(p.Dano);
      const hs = parseNumber(p.HS);
      const isBooyahDrop = teamBooyahDrops.has(`${rdNorm}_${normalize(p.Q)}_${normalize(p.TIME)}`);

      if (!playerRoundMap.has(rdNorm)) playerRoundMap.set(rdNorm, new Map());
      const rdPlayers = playerRoundMap.get(rdNorm)!;

      if (!rdPlayers.has(pNorm)) {
        rdPlayers.set(pNorm, { kills: 0, matches: 0, damage: 0, hs: 0, booyahs: 0 });
      }
      const st = rdPlayers.get(pNorm)!;
      st.kills += kills;
      st.matches += 1;
      st.damage += dmg;
      st.hs += hs;
      if (isBooyahDrop) st.booyahs += 1;
    });

    // Estruturas para acumulação progressiva
    const cumulativeStats: Record<string, { kills: number; matches: number; booyahs: number; damage: number; points: number }> = {};
    selectedEntities.forEach(ent => {
      cumulativeStats[ent] = { kills: 0, matches: 0, booyahs: 0, damage: 0, points: 0 };
    });

    // Médias da liga por rodada
    const roundLeagueAvgMap: Record<string, number> = {};

    // Construir os pontos do gráfico para cada rodada
    const points: Array<Record<string, any>> = [];

    sortedRounds.forEach(rd => {
      const rdNorm = normalize(rd);
      const roundLabel = `RD ${rd.replace(/\D/g, '') || rd}`;
      const point: Record<string, any> = {
        round: roundLabel,
        rawRound: rd,
      };

      let roundTotalLeagueVal = 0;
      let roundCountLeague = 0;

      // Calcular valor para cada entidade selecionada
      selectedEntities.forEach(ent => {
        const entNorm = normalize(ent);
        let roundKills = 0;
        let roundMatches = 0;
        let roundBooyahs = 0;
        let roundDamage = 0;
        let roundPoints = 0;

        if (entityMode === 'teams') {
          const tData = teamRoundMap.get(rdNorm)?.get(entNorm);
          if (tData) {
            roundKills = tData.kills;
            roundMatches = tData.matches;
            roundBooyahs = tData.booyahs;
            roundPoints = tData.points;
          }
        } else {
          const pData = playerRoundMap.get(rdNorm)?.get(entNorm);
          if (pData) {
            roundKills = pData.kills;
            roundMatches = pData.matches;
            roundBooyahs = pData.booyahs;
            roundDamage = pData.damage;
          }
        }

        // Atualizar cumulativos
        const cum = cumulativeStats[ent];
        cum.kills += roundKills;
        cum.matches += roundMatches;
        cum.booyahs += roundBooyahs;
        cum.damage += roundDamage;
        cum.points += roundPoints;

        // Determinar valor final conforme a métrica e o escopo de tempo
        let finalVal = 0;
        if (timeScope === 'perRound') {
          if (metric === 'kills') finalVal = roundKills;
          else if (metric === 'avgKills') finalVal = roundMatches > 0 ? parseFloat((roundKills / roundMatches).toFixed(2)) : 0;
          else if (metric === 'winRate') finalVal = roundMatches > 0 ? parseFloat(((roundBooyahs / roundMatches) * 100).toFixed(1)) : 0;
          else if (metric === 'damage') finalVal = roundDamage;
          else if (metric === 'points') finalVal = roundPoints;
        } else {
          // Acumulado
          if (metric === 'kills') finalVal = cum.kills;
          else if (metric === 'avgKills') finalVal = cum.matches > 0 ? parseFloat((cum.kills / cum.matches).toFixed(2)) : 0;
          else if (metric === 'winRate') finalVal = cum.matches > 0 ? parseFloat(((cum.booyahs / cum.matches) * 100).toFixed(1)) : 0;
          else if (metric === 'damage') finalVal = cum.damage;
          else if (metric === 'points') finalVal = cum.points;
        }

        point[ent] = finalVal;
        point[`${ent}_matches`] = roundMatches;
        point[`${ent}_kills`] = roundKills;
        point[`${ent}_booyahs`] = roundBooyahs;
        point[`${ent}_cumKills`] = cum.kills;
        point[`${ent}_cumMatches`] = cum.matches;
        point[`${ent}_cumBooyahs`] = cum.booyahs;
      });

      // Calcular média da liga nesta rodada
      if (entityMode === 'teams') {
        const teamsInRd = teamRoundMap.get(rdNorm);
        if (teamsInRd && teamsInRd.size > 0) {
          let sKills = 0;
          let sMatches = 0;
          let sBooyahs = 0;
          let sPts = 0;
          teamsInRd.forEach(st => {
            sKills += st.kills;
            sMatches += st.matches;
            sBooyahs += st.booyahs;
            sPts += st.points;
          });
          const count = teamsInRd.size;
          if (metric === 'kills') roundTotalLeagueVal = sKills / count;
          else if (metric === 'avgKills') roundTotalLeagueVal = sMatches > 0 ? sKills / sMatches : 0;
          else if (metric === 'winRate') roundTotalLeagueVal = sMatches > 0 ? (sBooyahs / sMatches) * 100 : 0;
          else if (metric === 'points') roundTotalLeagueVal = sPts / count;
          roundCountLeague = 1;
        }
      } else {
        const playersInRd = playerRoundMap.get(rdNorm);
        if (playersInRd && playersInRd.size > 0) {
          let sKills = 0;
          let sMatches = 0;
          let sBooyahs = 0;
          let sDmg = 0;
          playersInRd.forEach(st => {
            sKills += st.kills;
            sMatches += st.matches;
            sBooyahs += st.booyahs;
            sDmg += st.damage;
          });
          const count = playersInRd.size;
          if (metric === 'kills') roundTotalLeagueVal = sKills / count;
          else if (metric === 'avgKills') roundTotalLeagueVal = sMatches > 0 ? sKills / sMatches : 0;
          else if (metric === 'winRate') roundTotalLeagueVal = sMatches > 0 ? (sBooyahs / sMatches) * 100 : 0;
          else if (metric === 'damage') roundTotalLeagueVal = sDmg / count;
          roundCountLeague = 1;
        }
      }

      point.leagueAverage = parseFloat(roundTotalLeagueVal.toFixed(2));
      points.push(point);
    });

    // 7. Resumo consolidado de cada entidade (Totais, Médias, Melhor Rodada, etc.)
    const summaryCards = selectedEntities.map(ent => {
      let maxVal = -Infinity;
      let maxRound = '';
      let sum = 0;
      let validRounds = 0;

      points.forEach(pt => {
        const v = pt[ent];
        if (typeof v === 'number' && !isNaN(v)) {
          sum += v;
          validRounds++;
          if (v > maxVal) {
            maxVal = v;
            maxRound = pt.round;
          }
        }
      });

      const cum = cumulativeStats[ent];
      const overallAvgKills = cum.matches > 0 ? (cum.kills / cum.matches).toFixed(2) : '0.00';
      const overallWinRate = cum.matches > 0 ? ((cum.booyahs / cum.matches) * 100).toFixed(1) : '0.0';

      const lastPoint = points[points.length - 1];
      const prevPoint = points.length >= 2 ? points[points.length - 2] : null;
      const lastVal = lastPoint ? lastPoint[ent] || 0 : 0;
      const prevVal = prevPoint ? prevPoint[ent] || 0 : 0;
      const deltaLast = lastVal - prevVal;

      return {
        name: ent,
        color: colorsMap[ent],
        totalKills: cum.kills,
        totalMatches: cum.matches,
        totalBooyahs: cum.booyahs,
        totalPoints: cum.points,
        totalDamage: cum.damage,
        overallAvgKills,
        overallWinRate,
        bestRound: { round: maxRound, value: maxVal === -Infinity ? 0 : maxVal },
        lastRoundValue: lastVal,
        lastRoundDelta: deltaLast,
        logo: entityMode === 'teams' ? findTeamLogo(ent, data.teamsReference) : findDimImg(data.playersDimension, ent)
      };
    });

    return {
      chartData: points,
      entityColors: colorsMap,
      leagueAverages: roundLeagueAvgMap,
      summaries: summaryCards
    };
  }, [data.players, data.details, data.teamsReference, data.playersDimension, selectedEntities, entityMode, metric, timeScope, sortedRounds]);

  // Labels e formatação da métrica
  const metricInfo = useMemo(() => {
    switch (metric) {
      case 'kills':
        return {
          label: 'Abates Totais (Kills)',
          shortLabel: 'Kills',
          unit: 'Kills',
          icon: Target,
          format: (v: number) => `${v} Kills`,
          description: timeScope === 'perRound' ? 'Total de eliminações por rodada' : 'Acumulado progressivo de abates'
        };
      case 'avgKills':
        return {
          label: 'Média de Kills por Queda (K/Q)',
          shortLabel: 'Média K/Q',
          unit: 'K/Q',
          icon: Flame,
          format: (v: number) => `${v.toFixed(2)} K/Q`,
          description: timeScope === 'perRound' ? 'Média de abates por partida na rodada' : 'Média acumulada até a rodada'
        };
      case 'winRate':
        return {
          label: 'Taxa de Vitória / Booyah (Win Rate %)',
          shortLabel: 'Win Rate %',
          unit: '%',
          icon: Crown,
          format: (v: number) => `${v.toFixed(1)}%`,
          description: timeScope === 'perRound' ? '% de Booyahs conquistados na rodada' : 'Taxa de Booyah acumulada'
        };
      case 'damage':
        return {
          label: 'Dano Causado',
          shortLabel: 'Dano',
          unit: 'Dano',
          icon: Zap,
          format: (v: number) => `${v.toLocaleString('pt-BR')}`,
          description: timeScope === 'perRound' ? 'Dano total causado na rodada' : 'Dano acumulado'
        };
      case 'points':
        return {
          label: 'Pontos Totais',
          shortLabel: 'Pontos',
          unit: 'Pts',
          icon: Trophy,
          format: (v: number) => `${v} Pts`,
          description: timeScope === 'perRound' ? 'Pontos somados na rodada' : 'Pontuação geral acumulada'
        };
      default:
        return {
          label: 'Métrica',
          shortLabel: 'Valor',
          unit: '',
          icon: Activity,
          format: (v: number) => `${v}`,
          description: ''
        };
    }
  }, [metric, timeScope]);

  // Custom Tooltip rico e temático de Esports
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const sortedPayload = [...payload].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));

      return (
        <div className="bg-[#121215]/95 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-2xl min-w-[260px] max-w-sm text-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <span className="font-black text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} /> {label}
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase">
              {metricInfo.shortLabel} ({timeScope === 'perRound' ? 'Na Rodada' : 'Acumulado'})
            </span>
          </div>

          <div className="space-y-2">
            {sortedPayload.map((entry: any) => {
              if (entry.dataKey === 'leagueAverage') {
                return (
                  <div key="league-avg" className="flex items-center justify-between pt-1 border-t border-white/10 text-gray-400 text-[11px]">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 bg-yellow-500 rounded" />
                      Média da Liga:
                    </span>
                    <span className="font-mono font-bold text-yellow-400">
                      {metricInfo.format(entry.value)}
                    </span>
                  </div>
                );
              }

              const entName = entry.dataKey;
              const color = entry.color || entityColors[entName] || '#fff';
              const logo = entityMode === 'teams' ? findTeamLogo(entName, data.teamsReference) : findDimImg(data.playersDimension, entName);
              const isHovered = activeHoverKey === entName;

              return (
                <div 
                  key={entName} 
                  className={`flex items-center justify-between p-1.5 rounded-xl transition-all ${isHovered ? 'bg-white/15 font-black' : 'bg-black/20'}`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    {logo && (
                      <img src={logo} alt={entName} className="w-4 h-4 rounded object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                    )}
                    <span className="text-white font-bold uppercase truncate max-w-[120px]">
                      {entName}
                    </span>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-black text-white font-mono" style={{ color }}>
                      {metricInfo.format(Number(entry.value) || 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const MetricIcon = metricInfo.icon;

  return (
    <div className={`space-y-6 animate-in fade-in duration-300 ${className}`}>
      {/* CABEÇALHO DO COMPONENTE */}
      <div className="bg-[#141417] p-6 rounded-3xl border border-white/5 shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-yellow-500/10 rounded-2xl border border-yellow-500/30 text-yellow-400 shadow-lg shadow-yellow-500/10 flex-shrink-0">
              <TrendingUp size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tight">
                  Evolução de Performance Interativa
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-black uppercase tracking-wider">
                  Recharts Oficial
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[10px] font-black uppercase tracking-wider">
                  {entityMode === 'teams' ? '🛡️ Equipes' : '👤 Jogadores'}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Analise e compare a trajetória e consistência rodada a rodada de eliminações, médias e taxa de vitórias (Win Rate / Booyah).
              </p>
            </div>
          </div>

          {/* Alternadores de Modo (Jogadores vs Equipes) & Visão (Gráfico vs Tabela) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-1 bg-black/40 rounded-2xl border border-white/10 flex items-center gap-1">
              <button
                onClick={() => handleToggleEntityMode('teams')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  entityMode === 'teams'
                    ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20 scale-105'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Shield size={14} />
                <span>Equipes</span>
              </button>
              <button
                onClick={() => handleToggleEntityMode('players')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  entityMode === 'players'
                    ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20 scale-105'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users size={14} />
                <span>Jogadores</span>
              </button>
            </div>

            <div className="p-1 bg-black/40 rounded-2xl border border-white/10 flex items-center gap-1">
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  viewMode === 'chart'
                    ? 'bg-white/20 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Gráfico
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  viewMode === 'table'
                    ? 'bg-white/20 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Tabela
              </button>
            </div>
          </div>
        </div>

        {/* SELETORES DE MÉTRICA E ESCOPO TEMPORAL */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          {/* Métricas Principais */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase text-gray-500 mr-1 flex items-center gap-1">
              <MetricIcon size={12} className="text-yellow-500" /> Métrica:
            </span>

            {[
              { id: 'kills', label: 'Abates (Kills)', icon: Target },
              { id: 'avgKills', label: 'Média K/Q', icon: Flame },
              { id: 'winRate', label: 'Win Rate % (Booyah)', icon: Crown },
              ...(entityMode === 'players' ? [{ id: 'damage', label: 'Dano', icon: Zap }] : []),
              ...(entityMode === 'teams' ? [{ id: 'points', label: 'Pontos Totais', icon: Trophy }] : [])
            ].map(m => {
              const isSelected = metric === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMetric(m.id as EvolutionMetric)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20 scale-105'
                      : 'bg-black/30 text-gray-300 hover:text-white hover:bg-white/5 border border-white/5'
                  }`}
                >
                  <Icon size={13} className={isSelected ? 'text-black' : 'text-yellow-500'} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Escopo de Tempo: Rodada Individual vs Acumulado */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <span className="text-[10px] font-black uppercase text-gray-500 mr-1">Visão:</span>
            <div className="p-1 bg-black/40 rounded-xl border border-white/10 flex items-center gap-1 text-xs">
              <button
                onClick={() => setTimeScope('perRound')}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
                  timeScope === 'perRound'
                    ? 'bg-yellow-500 text-black font-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Por Rodada
              </button>
              <button
                onClick={() => setTimeScope('cumulative')}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
                  timeScope === 'cumulative'
                    ? 'bg-yellow-500 text-black font-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Acumulado
              </button>
            </div>

            {/* Alternar Média da Liga */}
            <button
              onClick={() => setShowLeagueAverage(!showLeagueAverage)}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                showLeagueAverage
                  ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400'
                  : 'bg-black/30 border-white/5 text-gray-500 hover:text-white'
              }`}
              title="Exibir ou ocultar linha pontilhada da média geral da liga"
            >
              {showLeagueAverage ? <Eye size={12} /> : <EyeOff size={12} />}
              <span>Média da Liga</span>
            </button>
          </div>
        </div>

        {/* BARRA DE SELEÇÃO E FILTROS DE ENTIDADES (CHIPS + DROPDOWN) */}
        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-yellow-500" />
                {entityMode === 'teams' ? 'Equipes Comparadas:' : 'Jogadores Comparados:'}
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                ({selectedEntities.length} selecionados • máx 8)
              </span>
            </div>

            {/* Presets Rápidos */}
            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
              <span className="text-gray-500 font-bold uppercase mr-1">Atalhos:</span>
              {entityMode === 'teams' ? (
                <>
                  <button onClick={() => applyPreset('top4')} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 font-bold">Top 4</button>
                  <button onClick={() => applyPreset('top6')} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 font-bold">Top 6</button>
                  <button onClick={() => applyPreset('groupA')} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 font-bold">Grupo A</button>
                  <button onClick={() => applyPreset('groupB')} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 font-bold">Grupo B</button>
                  <button onClick={() => applyPreset('groupC')} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 font-bold">Grupo C</button>
                </>
              ) : (
                <>
                  <button onClick={() => applyPreset('top4Kills')} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 font-bold">Top 4 Kills</button>
                  <button onClick={() => applyPreset('top6Kills')} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 font-bold">Top 6 Kills</button>
                </>
              )}
            </div>
          </div>

          {/* Chips das entidades ativas com remoção instantânea */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedEntities.map((name) => {
              const color = entityColors[name] || '#EAB308';
              const logo = entityMode === 'teams' ? findTeamLogo(name, data.teamsReference) : findDimImg(data.playersDimension, name);

              return (
                <div
                  key={name}
                  onMouseEnter={() => setActiveHoverKey(name)}
                  onMouseLeave={() => setActiveHoverKey(null)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shadow-sm ${
                    activeHoverKey === name
                      ? 'bg-white/20 border-white/50 scale-105'
                      : 'bg-black/60 border-white/10 hover:border-white/30'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  {logo && (
                    <img src={logo} alt={name} className="w-4 h-4 rounded object-cover" referrerPolicy="no-referrer" />
                  )}
                  <span className="text-xs font-black uppercase text-white truncate max-w-[130px]">
                    {name}
                  </span>
                  <button
                    onClick={() => toggleSelectEntity(name)}
                    className="p-0.5 hover:bg-white/20 rounded-full text-gray-400 hover:text-red-400 transition-colors"
                    title={`Remover ${name} do comparativo`}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}

            {/* Botão Dropdown para adicionar mais entidades */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-black uppercase tracking-wider transition-all"
              >
                <span>+ Adicionar {entityMode === 'teams' ? 'Equipe' : 'Jogador'}</span>
                <ChevronDown size={12} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-[#161619] border border-white/15 rounded-2xl shadow-2xl z-50 p-3 space-y-2 backdrop-blur-xl animate-in fade-in duration-150">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder={`Filtrar ${entityMode === 'teams' ? 'equipe' : 'jogador'}...`}
                      className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    {(entityMode === 'teams' ? allTeams : allPlayers)
                      .filter(item => !searchFilter || item.name.toLowerCase().includes(searchFilter.toLowerCase()))
                      .map(item => {
                        const isSelected = selectedEntities.some(n => normalize(n) === normalize(item.name));
                        const logo = entityMode === 'teams' ? (item as any).logo : (item as any).playerImg;

                        return (
                          <button
                            key={item.name}
                            onClick={() => {
                              toggleSelectEntity(item.name);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all ${
                              isSelected
                                ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-black'
                                : 'hover:bg-white/5 text-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {logo && (
                                <img src={logo} alt={item.name} className="w-5 h-5 rounded object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                              )}
                              <div className="min-w-0">
                                <span className="truncate block font-bold uppercase">{item.name}</span>
                                {entityMode === 'players' && (
                                  <span className="text-[9px] text-gray-500 truncate block">{(item as any).team}</span>
                                )}
                              </div>
                            </div>
                            {isSelected && <Check size={14} className="text-yellow-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA PRINCIPAL: GRÁFICO OU TABELA */}
      {viewMode === 'chart' ? (
        <div className="bg-[#141417] p-6 rounded-3xl border border-white/5 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <MetricIcon size={16} className="text-yellow-500" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Progressão de {metricInfo.label} • {timeScope === 'perRound' ? 'Por Rodada' : 'Acumulada'}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
              <span>Eixo X: Rodadas Oficiais</span>
              <span>•</span>
              <span>Eixo Y: {metricInfo.unit}</span>
            </div>
          </div>

          {/* RECHARTS LINE CHART */}
          <div className="w-full h-80 sm:h-96 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="#26262a" strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="round" 
                  stroke="#71717a" 
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 700 }}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickLine={{ stroke: '#3f3f46' }}
                />
                <YAxis 
                  stroke="#71717a" 
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 700 }}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickLine={{ stroke: '#3f3f46' }}
                  tickFormatter={(val) => `${val}${metricInfo.unit === '%' ? '%' : ''}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => {
                    if (value === 'leagueAverage') return <span className="text-yellow-400 text-xs font-bold uppercase">Média da Liga</span>;
                    return <span className="text-white text-xs font-bold uppercase">{value}</span>;
                  }}
                />

                {/* Linha da Média da Liga (se ativada) */}
                {showLeagueAverage && (
                  <Line
                    type="monotone"
                    dataKey="leagueAverage"
                    name="leagueAverage"
                    stroke="#EAB308"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={{ r: 4, stroke: '#EAB308', strokeWidth: 2, fill: '#000' }}
                  />
                )}

                {/* Linhas das Entidades Selecionadas */}
                {selectedEntities.map((ent) => {
                  const color = entityColors[ent] || '#EAB308';
                  const isHovered = activeHoverKey === ent;

                  return (
                    <Line
                      key={ent}
                      type={isCurveSmooth ? 'monotone' : 'linear'}
                      dataKey={ent}
                      name={ent}
                      stroke={color}
                      strokeWidth={isHovered ? 4 : 2.5}
                      dot={{ r: 3.5, stroke: color, strokeWidth: 1.5, fill: '#141417' }}
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: color }}
                      opacity={activeHoverKey && !isHovered ? 0.35 : 1}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* MODO TABELA DETALHADA RODADA A RODADA */
        <div className="bg-[#141417] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-4 bg-black/40 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-yellow-500" />
              Matriz de Desempenho por Rodada ({metricInfo.label})
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-black/60 border-b border-white/10 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="p-3">Entidade</th>
                  {chartData.map(pt => (
                    <th key={pt.round} className="p-3 text-center">{pt.round}</th>
                  ))}
                  <th className="p-3 text-right">Total Acumulado</th>
                  <th className="p-3 text-right">Média Geral</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {summaries.map(s => (
                  <tr key={s.name} className="hover:bg-white/5 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        {s.logo && <img src={s.logo} alt={s.name} className="w-5 h-5 rounded object-cover" />}
                        <span className="font-bold text-white uppercase">{s.name}</span>
                      </div>
                    </td>
                    {chartData.map(pt => {
                      const val = pt[s.name] || 0;
                      return (
                        <td key={pt.round} className="p-3 text-center font-mono font-bold text-gray-300">
                          {typeof val === 'number' ? (metric === 'avgKills' || metric === 'winRate' ? val.toFixed(1) : val) : val}
                        </td>
                      );
                    })}
                    <td className="p-3 text-right font-mono font-black text-yellow-400">
                      {metric === 'winRate' ? `${s.overallWinRate}%` : (metric === 'avgKills' ? s.overallAvgKills : s.totalKills)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-gray-400">
                      {metric === 'winRate' ? `${s.overallWinRate}%` : s.overallAvgKills}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CARDS DE RESUMO DE PERFORMANCE (KPIS) DE CADA ENTIDADE SELECIONADA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaries.map(s => (
          <div
            key={s.name}
            onMouseEnter={() => setActiveHoverKey(s.name)}
            onMouseLeave={() => setActiveHoverKey(null)}
            className="bg-[#161619] p-5 rounded-3xl border border-white/5 hover:border-yellow-500/30 transition-all shadow-xl space-y-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-20" style={{ backgroundColor: s.color }} />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                {s.logo && (
                  <img src={s.logo} alt={s.name} className="w-6 h-6 rounded-lg object-cover bg-black p-0.5 border border-white/10" referrerPolicy="no-referrer" />
                )}
                <h4 className="text-sm font-black text-white uppercase italic truncate">
                  {s.name}
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-xs">
              <div className="bg-black/30 p-2.5 rounded-xl">
                <span className="text-[9px] font-black uppercase text-gray-500 block">Total Kills</span>
                <span className="text-lg font-black italic text-white font-mono">{s.totalKills}</span>
                <span className="text-[9px] text-gray-400 block">{s.overallAvgKills} K/Q</span>
              </div>

              <div className="bg-black/30 p-2.5 rounded-xl">
                <span className="text-[9px] font-black uppercase text-gray-500 block">Win Rate (Booyah)</span>
                <span className="text-lg font-black italic text-yellow-400 font-mono">{s.overallWinRate}%</span>
                <span className="text-[9px] text-gray-400 block">{s.totalBooyahs} Booyahs</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
              <span className="text-gray-400 font-medium">Melhor Rodada:</span>
              <span className="font-mono font-bold text-yellow-400">
                {s.bestRound.round || '-'}: {metricInfo.format(s.bestRound.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceEvolutionChart;
