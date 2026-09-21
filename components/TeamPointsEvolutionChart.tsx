import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Layers, 
  Trophy, 
  Flame, 
  Sparkles, 
  Filter, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp,
  Shield,
  Info
} from 'lucide-react';
import { DashboardData } from '../types';
import { findTeamLogo } from '../utils/teamUtils';

interface TeamPointsEvolutionChartProps {
  data: DashboardData;
  initialSelectedTeams?: string[];
}

// Sistema Oficial de Pontuação por Posição (FFWS / Copa FF)
const POSITION_POINTS: Record<number, number> = {
  1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1
};

// Conversor numérico robusto para formatos de planilha brasileira / internacional
const parseNumberVal = (val: string | number | undefined | null): number => {
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

// Resolução canônica de nome de equipe conforme cadastro oficial
const getCanonicalTeamName = (teamName: string, teamsRef: Array<{ TIME?: string; [key: string]: any }> = []): string => {
  if (!teamName || !teamName.trim()) return '';
  const clean = teamName.trim().toLowerCase();
  const ref = teamsRef.find(t => t.TIME && t.TIME.trim().toLowerCase() === clean);
  return ref && ref.TIME ? ref.TIME.trim() : teamName.trim();
};

// Paleta de cores vibrantes e contrastantes para esports
const TEAM_PALETTE: Record<string, { stroke: string; fill: string }> = {
  'LOS': { stroke: '#fbbf24', fill: '#f59e0b' },
  'LOUD SNICKERS': { stroke: '#22c55e', fill: '#10b981' },
  'LOUD': { stroke: '#22c55e', fill: '#10b981' },
  'INTZ ESPORTS': { stroke: '#38bdf8', fill: '#0284c7' },
  'INTZ': { stroke: '#38bdf8', fill: '#0284c7' },
  'FLUXO W7M': { stroke: '#c084fc', fill: '#9333ea' },
  'FLUXO': { stroke: '#c084fc', fill: '#9333ea' },
  'TEAM SOLID': { stroke: '#f87171', fill: '#dc2626' },
  'SOLID': { stroke: '#f87171', fill: '#dc2626' },
  'ALPHA7': { stroke: '#fb923c', fill: '#ea580c' },
  'SX TET': { stroke: '#2dd4bf', fill: '#0d9488' },
  'RUSH GAMING': { stroke: '#f472b6', fill: '#db2777' },
  'CPT VOX': { stroke: '#818cf8', fill: '#4f46e5' },
  'RISE GAMING': { stroke: '#facc15', fill: '#ca8a04' },
  'AFROGAMES': { stroke: '#34d399', fill: '#059669' },
  'INFLUENCE RAGE': { stroke: '#f43f5e', fill: '#be123c' },
  'E1 SPORTS': { stroke: '#a3e635', fill: '#65a30d' },
  'CORINTHIANS': { stroke: '#e2e8f0', fill: '#64748b' },
  'NETSHOES MINERS': { stroke: '#67e8f9', fill: '#0891b2' },
  'MAGIC SQUAD': { stroke: '#ec4899', fill: '#be185d' },
  'PAIN GAMING': { stroke: '#ef4444', fill: '#b91c1c' },
  'VKS': { stroke: '#8b5cf6', fill: '#6d28d9' },
  'VIVO KEYD': { stroke: '#8b5cf6', fill: '#6d28d9' },
};

const FALLBACK_COLORS = [
  { stroke: '#38bdf8', fill: '#0284c7' },
  { stroke: '#f472b6', fill: '#db2777' },
  { stroke: '#4ade80', fill: '#16a34a' },
  { stroke: '#facc15', fill: '#ca8a04' },
  { stroke: '#a78bfa', fill: '#7c3aed' },
  { stroke: '#fb923c', fill: '#ea580c' },
  { stroke: '#2dd4bf', fill: '#0f766e' },
  { stroke: '#f87171', fill: '#b91c1c' },
  { stroke: '#818cf8', fill: '#4338ca' },
  { stroke: '#e879f9', fill: '#c026d3' },
];

export const TeamPointsEvolutionChart: React.FC<TeamPointsEvolutionChartProps> = ({ 
  data, 
  initialSelectedTeams 
}) => {
  // Configurações do gráfico (Padrão: Curvas Individuais Sobrepostas com preenchimento gradiente)
  const [chartMode, setChartMode] = useState<'unstacked' | 'stacked' | 'roundOnly'>('unstacked');
  const [phaseFilter, setPhaseFilter] = useState<'ALL' | 'PHASE_1' | 'PHASE_2'>('ALL');
  const [markerDisplay, setMarkerDisplay] = useState<'all' | 'step2' | 'last' | 'none'>('all');
  const [showTable, setShowTable] = useState<boolean>(false);

  // 1. Processar dados brutos por rodada para cada equipe (estritamente SEM BÔNUS)
  const rawRoundData = useMemo(() => {
    if (!data || !data.details) return { rounds: [], teams: [], roundPoints: {}, totalPoints: {} };

    const roundSet = new Set<number>();
    const teamSet = new Set<string>();
    const roundPointsMap: Record<string, Record<number, number>> = {};
    const totalPointsMap: Record<string, number> = {};

    data.details.forEach(row => {
      const rdNum = parseInt(String(row.RD || '').replace(/\D/g, ''), 10);
      if (!rdNum || isNaN(rdNum)) return;

      const rawTeamName = row.TIME;
      if (!rawTeamName) return;

      const teamName = getCanonicalTeamName(rawTeamName, data.teamsReference);
      if (!teamName) return;

      // Pontos oficiais da queda (Sem Bônus)
      let rowPts = parseNumberVal(row.PTS);
      let rowPtsc = parseNumberVal(row.PTSC);
      let rowAbts = parseNumberVal(row.ABTS);
      let rowPos = parseNumberVal(row.POS);
      let rowS = parseNumberVal(row.S);
      let rowB = parseNumberVal(row.B);

      // Desconsidera linhas de placeholder/não jogadas
      const isUnplayed = (rowS === 0 && rowPts === 0 && rowPtsc === 0 && rowAbts === 0 && rowPos === 0 && rowB === 0) ||
                         (!row.MAPA && rowPts === 0 && rowPtsc === 0 && rowAbts === 0 && rowPos === 0 && rowB === 0);
      if (isUnplayed) return;

      // Pontos de colocação derivados da tabela oficial (se zerado na linha mas com colocação válida)
      if (rowPtsc === 0 && rowPos >= 1 && rowPos <= 10) {
        rowPtsc = POSITION_POINTS[rowPos] || 0;
      }

      // Pontos totais derivados com consistência entre abates e colocação
      if (rowPts > 0) {
        if (rowPtsc === 0 && rowAbts > 0 && rowPts >= rowAbts) {
          rowPtsc = rowPts - rowAbts;
        }
        if (rowAbts === 0 && rowPtsc > 0 && rowPts >= rowPtsc) {
          rowAbts = rowPts - rowPtsc;
        }
      } else {
        rowPts = rowPtsc + rowAbts;
      }

      roundSet.add(rdNum);
      teamSet.add(teamName);

      if (!roundPointsMap[teamName]) {
        roundPointsMap[teamName] = {};
        totalPointsMap[teamName] = 0;
      }

      roundPointsMap[teamName][rdNum] = (roundPointsMap[teamName][rdNum] || 0) + rowPts;
      totalPointsMap[teamName] += rowPts;
    });

    const sortedRounds = Array.from(roundSet).sort((a, b) => a - b);
    const sortedTeams = Array.from(teamSet).sort((a, b) => (totalPointsMap[b] || 0) - (totalPointsMap[a] || 0));

    return {
      rounds: sortedRounds,
      teams: sortedTeams,
      roundPoints: roundPointsMap,
      totalPoints: totalPointsMap
    };
  }, [data]);

  // Times selecionados para o gráfico
  const [selectedTeams, setSelectedTeams] = useState<string[]>(() => {
    if (initialSelectedTeams && initialSelectedTeams.length > 0) {
      return initialSelectedTeams;
    }
    // Padrão: Top 6 equipes
    return rawRoundData.teams.slice(0, 6);
  });

  // Atualizar seleção caso o initialSelectedTeams mude externamente
  React.useEffect(() => {
    if (initialSelectedTeams && initialSelectedTeams.length > 0) {
      setSelectedTeams(initialSelectedTeams);
    }
  }, [initialSelectedTeams]);

  // Se a lista de times selecionados estiver vazia e os dados chegarem, inicializar com Top 6
  React.useEffect(() => {
    if (selectedTeams.length === 0 && rawRoundData.teams.length > 0) {
      setSelectedTeams(rawRoundData.teams.slice(0, 6));
    }
  }, [rawRoundData.teams]);

  // Filtrar rodadas com base no filtro de fase
  const activeRounds = useMemo(() => {
    if (phaseFilter === 'PHASE_1') {
      // Rodadas 1 a 14 (Classificatória)
      return rawRoundData.rounds.filter(r => r <= 14);
    }
    if (phaseFilter === 'PHASE_2') {
      // Rodadas 15+ (Rumo ao Mundial / Finais)
      return rawRoundData.rounds.filter(r => r >= 15);
    }
    return rawRoundData.rounds;
  }, [rawRoundData.rounds, phaseFilter]);

  // 2. Construir os dados para o Recharts (com acumulado rodada a rodada)
  const chartData = useMemo(() => {
    if (activeRounds.length === 0 || selectedTeams.length === 0) return [];

    // Para cada time, rastreamos a pontuação acumulada dentro do recorte de rodadas selecionado
    const cumulativeMap: Record<string, number> = {};
    selectedTeams.forEach(t => {
      cumulativeMap[t] = 0;
    });

    return activeRounds.map(rd => {
      const dataPoint: Record<string, any> = {
        round: rd,
        roundLabel: `Rodada ${rd}`,
        roundShort: `R${rd}`,
        totalRoundSum: 0,
        totalCumulativeSum: 0
      };

      selectedTeams.forEach(team => {
        const ptsThisRound = rawRoundData.roundPoints[team]?.[rd] || 0;
        cumulativeMap[team] += ptsThisRound;

        // Se o modo for "Apenas Rodada", coloca os pontos individuais daquela rodada
        if (chartMode === 'roundOnly') {
          dataPoint[team] = ptsThisRound;
        } else {
          // Modo Acumulado (Stacked ou Normal)
          dataPoint[team] = cumulativeMap[team];
        }

        // Armazenar os pontos da rodada em propriedades auxiliares para o tooltip
        dataPoint[`${team}_roundPts`] = ptsThisRound;
        dataPoint[`${team}_cumPts`] = cumulativeMap[team];

        dataPoint.totalRoundSum += ptsThisRound;
        dataPoint.totalCumulativeSum += cumulativeMap[team];
      });

      return dataPoint;
    });
  }, [activeRounds, selectedTeams, rawRoundData.roundPoints, chartMode]);

  // Obter cores de cada equipe
  const getTeamColor = (teamName: string, index: number) => {
    const cleanName = teamName.trim();
    if (TEAM_PALETTE[cleanName]) {
      return TEAM_PALETTE[cleanName];
    }
    return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  };

  // Toggle de seleção de equipe
  const toggleTeam = (teamName: string) => {
    setSelectedTeams(prev => {
      if (prev.includes(teamName)) {
        if (prev.length === 1) return prev; // Manter pelo menos 1 equipe selecionada
        return prev.filter(t => t !== teamName);
      } else {
        return [...prev, teamName];
      }
    });
  };

  // Presets rápidos
  const selectTopN = (n: number) => {
    setSelectedTeams(rawRoundData.teams.slice(0, n));
  };

  const selectAll = () => {
    setSelectedTeams(rawRoundData.teams);
  };

  // 3. Métricas de Destaque
  const highlights = useMemo(() => {
    if (selectedTeams.length === 0 || activeRounds.length === 0) return null;

    // Líder atual no acumulado do recorte
    let leaderName = '';
    let leaderPts = -1;

    // Melhor rodada individual (qual time fez mais pontos numa única rodada)
    let bestRoundTeam = '';
    let bestRoundPts = -1;
    let bestRoundNum = 0;

    selectedTeams.forEach(t => {
      let cum = 0;
      activeRounds.forEach(r => {
        const pts = rawRoundData.roundPoints[t]?.[r] || 0;
        cum += pts;
        if (pts > bestRoundPts) {
          bestRoundPts = pts;
          bestRoundTeam = t;
          bestRoundNum = r;
        }
      });
      if (cum > leaderPts) {
        leaderPts = cum;
        leaderName = t;
      }
    });

    // Maior pontuação total da última rodada ativa no gráfico
    const lastRound = activeRounds[activeRounds.length - 1];
    let lastRoundTopTeam = '';
    let lastRoundTopPts = -1;
    selectedTeams.forEach(t => {
      const pts = rawRoundData.roundPoints[t]?.[lastRound] || 0;
      if (pts > lastRoundTopPts) {
        lastRoundTopPts = pts;
        lastRoundTopTeam = t;
      }
    });

    return {
      leaderName,
      leaderPts,
      bestRoundTeam,
      bestRoundPts,
      bestRoundNum,
      lastRound,
      lastRoundTopTeam,
      lastRoundTopPts
    };
  }, [selectedTeams, activeRounds, rawRoundData.roundPoints]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner de Informação */}
      <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-purple-500/10 p-6 rounded-3xl border border-yellow-500/20 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/5 blur-3xl -mr-32 -mt-32 rounded-full pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 bg-yellow-500/20 rounded-xl text-yellow-400 border border-yellow-500/30">
                <TrendingUp size={22} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-yellow-400">
                Análise Comparativa de Desempenho
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight text-white uppercase flex items-center gap-3">
              Evolução da Pontuação Acumulada
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl mt-1 leading-relaxed">
              Acompanhe a corrida pelo título rodada a rodada em um gráfico de área empilhada.
              Os pontos refletem <strong className="text-white">estritamente os abates e colocações em jogo (Sem o Bônus)</strong>.
            </p>
          </div>

          {/* Controles de Modo do Gráfico */}
          <div className="flex flex-wrap items-center gap-2 bg-black/60 p-2 rounded-2xl border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setChartMode('stacked')}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                chartMode === 'stacked'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers size={14} /> Área Empilhada
            </button>
            <button
              type="button"
              onClick={() => setChartMode('unstacked')}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                chartMode === 'unstacked'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp size={14} /> Curvas Individuais
            </button>
            <button
              type="button"
              onClick={() => setChartMode('roundOnly')}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                chartMode === 'roundOnly'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Flame size={14} /> Pontos / Rodada
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Chave */}
      {highlights && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#121218] border border-yellow-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-2xl rounded-full pointer-events-none" />
            <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1.5 mb-1">
              <Trophy size={14} /> Maior Pontuação Acumulada
            </span>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center p-1.5 shrink-0">
                  <img
                    src={findTeamLogo(highlights.leaderName, data.teamsReference)}
                    alt={highlights.leaderName}
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
                <div>
                  <h4 className="text-base font-black italic text-white uppercase leading-tight truncate max-w-[140px]">
                    {highlights.leaderName}
                  </h4>
                  <span className="text-[11px] text-gray-400">Total em campo</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-yellow-400">
                  {highlights.leaderPts}
                </span>
                <span className="block text-[10px] font-bold text-gray-400 uppercase">pts</span>
              </div>
            </div>
          </div>

          <div className="bg-[#121218] border border-purple-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-2xl rounded-full pointer-events-none" />
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5 mb-1">
              <Sparkles size={14} /> Recorde em Rodada Única
            </span>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center p-1.5 shrink-0">
                  <img
                    src={findTeamLogo(highlights.bestRoundTeam, data.teamsReference)}
                    alt={highlights.bestRoundTeam}
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
                <div>
                  <h4 className="text-base font-black italic text-white uppercase leading-tight truncate max-w-[140px]">
                    {highlights.bestRoundTeam}
                  </h4>
                  <span className="text-[11px] text-purple-300 font-bold">Rodada {highlights.bestRoundNum}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-purple-400">
                  {highlights.bestRoundPts}
                </span>
                <span className="block text-[10px] font-bold text-gray-400 uppercase">pts/rodada</span>
              </div>
            </div>
          </div>

          <div className="bg-[#121218] border border-blue-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl rounded-full pointer-events-none" />
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5 mb-1">
              <Flame size={14} /> Destaque da Rodada {highlights.lastRound}
            </span>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center p-1.5 shrink-0">
                  <img
                    src={findTeamLogo(highlights.lastRoundTopTeam, data.teamsReference)}
                    alt={highlights.lastRoundTopTeam}
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
                <div>
                  <h4 className="text-base font-black italic text-white uppercase leading-tight truncate max-w-[140px]">
                    {highlights.lastRoundTopTeam}
                  </h4>
                  <span className="text-[11px] text-gray-400">Última disputada</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-blue-400">
                  {highlights.lastRoundTopPts}
                </span>
                <span className="block text-[10px] font-bold text-gray-400 uppercase">pts</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Filtros e Seleção de Times */}
      <div className="bg-[#121218] border border-white/5 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
          {/* Filtro de Fase */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Filter size={13} /> Fase:
            </span>
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setPhaseFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  phaseFilter === 'ALL'
                    ? 'bg-yellow-500 text-black font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Todas as Rodadas (1-16)
              </button>
              <button
                type="button"
                onClick={() => setPhaseFilter('PHASE_1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  phaseFilter === 'PHASE_1'
                    ? 'bg-yellow-500 text-black font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Classificatória (1-14)
              </button>
              <button
                type="button"
                onClick={() => setPhaseFilter('PHASE_2')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  phaseFilter === 'PHASE_2'
                    ? 'bg-purple-600 text-white font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Rumo ao Mundial (15-16)
              </button>
            </div>
          </div>

          {/* Controle de Exibição dos Marcadores (Logo e Pontuação nos Pontos) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-yellow-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400">
                Marcadores nos Pontos (Logo & Pontuação):
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setMarkerDisplay('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  markerDisplay === 'all'
                    ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Exibir nós com logo da equipe e pill de pontuação em todas as rodadas"
              >
                Todas as Rodadas
              </button>
              <button
                type="button"
                onClick={() => setMarkerDisplay('step2')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  markerDisplay === 'step2'
                    ? 'bg-yellow-500 text-black font-black shadow-lg shadow-yellow-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Exibir marcadores a cada 2 rodadas para um espaçamento equilibrado"
              >
                A Cada 2 Rodadas
              </button>
              <button
                type="button"
                onClick={() => setMarkerDisplay('last')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  markerDisplay === 'last'
                    ? 'bg-yellow-500 text-black font-black shadow-lg shadow-yellow-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Exibir badge com logo e pontuação final na extremidade do gráfico"
              >
                Na Última Rodada
              </button>
              <button
                type="button"
                onClick={() => setMarkerDisplay('none')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  markerDisplay === 'none'
                    ? 'bg-red-500/80 text-white font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Ocultar marcadores para visualização ultra limpa"
              >
                Ocultar
              </button>
            </div>
          </div>

          {/* Presets Rápidos de Times */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Seleção Rápida:
            </span>
            <button
              type="button"
              onClick={() => selectTopN(4)}
              className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 transition-all"
            >
              Top 4
            </button>
            <button
              type="button"
              onClick={() => selectTopN(6)}
              className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 transition-all"
            >
              Top 6
            </button>
            <button
              type="button"
              onClick={() => selectTopN(12)}
              className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 transition-all"
            >
              Top 12
            </button>
            <button
              type="button"
              onClick={selectAll}
              className="px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 transition-all"
            >
              Todos ({rawRoundData.teams.length})
            </button>
          </div>
        </div>

        {/* Chips de Times com toggle visual */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
              Times em Comparação ({selectedTeams.length} selecionados):
            </span>
            <span className="text-[10px] text-gray-500 italic">
              Clique nos times para ativar/desativar no gráfico
            </span>
          </div>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar p-1">
            {rawRoundData.teams.map((teamName, idx) => {
              const isSelected = selectedTeams.includes(teamName);
              const color = getTeamColor(teamName, idx);
              const logo = findTeamLogo(teamName, data.teamsReference);

              return (
                <button
                  key={teamName}
                  type="button"
                  onClick={() => toggleTeam(teamName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-black/90 text-white shadow-md'
                      : 'bg-black/30 text-gray-500 border-white/5 hover:border-white/20 opacity-50'
                  }`}
                  style={{
                    borderColor: isSelected ? color.stroke : undefined,
                    boxShadow: isSelected ? `0 0 12px ${color.stroke}25` : undefined
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color.stroke }}
                  />
                  {logo && (
                    <img
                      src={logo}
                      alt={teamName}
                      className="w-3.5 h-3.5 object-contain"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  )}
                  <span className="truncate max-w-[120px]">{teamName}</span>
                  <span className="text-[10px] font-mono text-gray-400 ml-0.5">
                    {rawRoundData.totalPoints[teamName] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Container Principal do Gráfico Recharts */}
      <div className="bg-[#121218] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-black italic uppercase text-white tracking-wide flex items-center gap-2">
              <TrendingUp size={18} className="text-yellow-400" />
              {chartMode === 'stacked'
                ? 'Curva de Área Empilhada (Volume Acumulado)'
                : chartMode === 'unstacked'
                ? 'Curvas Individuais Sobrepostas'
                : 'Pontuação Individual por Rodada'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {chartMode === 'stacked'
                ? 'Cada camada colorida representa o acúmulo de pontos da equipe somado às anteriores.'
                : chartMode === 'unstacked'
                ? 'Compare a trajetória e as ultrapassagens diretas de cada equipe ao longo das rodadas.'
                : 'Pontuação bruta conquistada em cada rodada isolada.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Dados Oficiais • {activeRounds.length} rodadas</span>
          </div>
        </div>

        {/* Gráfico Recharts */}
        <div className="w-full h-[450px] sm:h-[520px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 32, right: 80, left: 10, bottom: 25 }}
            >
              <defs>
                {selectedTeams.map((teamName, idx) => {
                  const color = getTeamColor(teamName, idx);
                  const safeId = `color_${teamName.replace(/[^a-zA-Z0-9]/g, '_')}`;
                  return (
                    <linearGradient key={safeId} id={safeId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color.stroke} stopOpacity={chartMode === 'stacked' ? 0.8 : 0.4} />
                      <stop offset="95%" stopColor={color.fill} stopOpacity={chartMode === 'stacked' ? 0.4 : 0.05} />
                    </linearGradient>
                  );
                })}
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />

              <XAxis
                dataKey="roundShort"
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 700 }}
                dy={10}
                tickLine={false}
              />

              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 700 }}
                dx={-10}
                tickLine={false}
                axisLine={false}
                domain={[0, 'auto']}
                tickFormatter={(val) => `${val}`}
              />

              <Tooltip content={<CustomTooltip selectedTeams={selectedTeams} data={data} chartMode={chartMode} />} />

              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                content={(props) => (
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-4 text-xs">
                    {props.payload?.map((entry: any, index: number) => {
                      const teamName = entry.value;
                      const color = getTeamColor(teamName, index);
                      const logo = findTeamLogo(teamName, data.teamsReference);
                      return (
                        <div
                          key={`legend-${index}`}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 font-bold uppercase text-[11px] text-gray-300"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color.stroke }}
                          />
                          {logo && (
                            <img
                              src={logo}
                              alt={teamName}
                              className="w-3 h-3 object-contain"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          )}
                          <span>{teamName}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              />

              {selectedTeams.map((teamName, idx) => {
                const color = getTeamColor(teamName, idx);
                const logo = findTeamLogo(teamName, data.teamsReference);
                const safeId = `color_${teamName.replace(/[^a-zA-Z0-9]/g, '_')}`;

                return (
                  <Area
                    key={teamName}
                    type="monotone"
                    dataKey={teamName}
                    name={teamName}
                    stackId={chartMode === 'stacked' ? '1' : undefined}
                    stroke={color.stroke}
                    strokeWidth={2.5}
                    fill={`url(#${safeId})`}
                    isAnimationActive={true}
                    animationDuration={900}
                    dot={
                      markerDisplay === 'none'
                        ? false
                        : (dotProps: any) => (
                            <TeamPointMarker
                              key={`marker-${teamName}-${dotProps.index}`}
                              {...dotProps}
                              teamName={teamName}
                              color={color}
                              logo={logo}
                              markerDisplay={markerDisplay}
                              totalCount={chartData.length}
                              chartMode={chartMode}
                            />
                          )
                    }
                    activeDot={{
                      r: 8,
                      fill: color.stroke,
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Dica de rodapé */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-yellow-400" />
            <span>
              Passe o mouse ou toque no gráfico para inspecionar os pontos exatos de cada rodada.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowTable(prev => !prev)}
            className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 font-bold cursor-pointer"
          >
            {showTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showTable ? 'Ocultar Tabela Detalhada' : 'Ver Tabela Rodada a Rodada'}
          </button>
        </div>
      </div>

      {/* Tabela Resumo Rodada a Rodada (Expansível) */}
      {showTable && (
        <div className="bg-[#121218] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-black italic uppercase text-white tracking-wide">
              Matriz Detalhada: Pontos Acumulados por Rodada
            </h4>
            <span className="text-xs text-gray-400">Valores em pontos acumulados</span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  <th className="py-3 px-4 bg-black/40 sticky left-0 z-10">Equipe</th>
                  {activeRounds.map(r => (
                    <th key={r} className="py-3 px-3 text-center min-w-[50px]">
                      R{r}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right bg-yellow-500/10 text-yellow-400 font-black">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {selectedTeams.map(teamName => {
                  let cum = 0;
                  const logo = findTeamLogo(teamName, data.teamsReference);

                  return (
                    <tr key={teamName} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 font-black text-white uppercase bg-[#121218] sticky left-0 z-10 flex items-center gap-2">
                        {logo && (
                          <img
                            src={logo}
                            alt={teamName}
                            className="w-4 h-4 object-contain"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        )}
                        <span className="truncate max-w-[140px]">{teamName}</span>
                      </td>

                      {activeRounds.map(r => {
                        const roundPts = rawRoundData.roundPoints[teamName]?.[r] || 0;
                        cum += roundPts;
                        const played = roundPts > 0;

                        return (
                          <td
                            key={r}
                            className={`py-2.5 px-3 text-center font-mono ${
                              played ? 'text-gray-200' : 'text-gray-600'
                            }`}
                          >
                            <span className="font-bold">{cum}</span>
                            {played && (
                              <span className="block text-[9px] text-emerald-400 font-medium">
                                +{roundPts}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-4 text-right font-black font-mono text-yellow-400 bg-yellow-500/5 text-sm">
                        {cum}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente Customizado para Marcadores nos Nós (Logo e Pontuação)
interface TeamPointMarkerProps {
  cx?: number;
  cy?: number;
  value?: number;
  index?: number;
  payload?: any;
  teamName: string;
  color: { stroke: string; fill: string };
  logo?: string;
  markerDisplay: 'all' | 'step2' | 'last' | 'none';
  totalCount: number;
  chartMode: 'stacked' | 'unstacked' | 'roundOnly';
}

const TeamPointMarker: React.FC<TeamPointMarkerProps> = ({
  cx,
  cy,
  value,
  index,
  payload,
  teamName,
  color,
  logo,
  markerDisplay,
  totalCount,
  chartMode,
}) => {
  if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) return null;
  if (markerDisplay === 'none') return null;

  const isLast = index === totalCount - 1;

  // Determinar se exibe o marcador detalhado com logo e pontos neste nó
  let shouldShowBadge = false;
  if (markerDisplay === 'all') {
    shouldShowBadge = true;
  } else if (markerDisplay === 'step2') {
    shouldShowBadge = (index ?? 0) % 2 === 0 || isLast;
  } else if (markerDisplay === 'last') {
    shouldShowBadge = isLast;
  }

  // Extrair a pontuação real da equipe (sempre valor numérico da própria equipe, sem misturar com coordenadas empilhadas)
  const extractRealScore = (): number => {
    if (chartMode === 'roundOnly') {
      const rdPts = payload?.[`${teamName}_roundPts`];
      if (typeof rdPts === 'number') return rdPts;
    }
    // No modo acumulado (seja sobreposto ou empilhado), pegar o acumulado real da equipe
    const cum = payload?.[`${teamName}_cumPts`] ?? payload?.[teamName];
    if (typeof cum === 'number') return cum;
    if (Array.isArray(value)) {
      return Math.round(Number(value[1] || 0) - Number(value[0] || 0));
    }
    if (typeof value === 'number') return Math.round(value);
    return 0;
  };

  const realScore = extractRealScore();

  // 1. Destaque para o Último Ponto (Extremidade direita do gráfico)
  if (isLast) {
    const finalScore = realScore;
    const tagWidth = String(finalScore).length > 3 ? 68 : 60;

    return (
      <g key={`last-marker-${teamName}-${index}`} className="pointer-events-none">
        {/* Ponto central brilhante */}
        <circle
          cx={cx}
          cy={cy}
          r={5.5}
          fill={color.stroke}
          stroke="#0b0b10"
          strokeWidth={2}
        />
        {/* Linha guia pontilhada */}
        <line
          x1={cx}
          y1={cy}
          x2={cx + 8}
          y2={cy}
          stroke={color.stroke}
          strokeWidth={1.5}
          strokeDasharray="2 2"
        />
        {/* Badge lateral fixo */}
        <rect
          x={cx + 8}
          y={cy - 12}
          width={tagWidth}
          height={24}
          rx={12}
          fill="#0a0a12"
          stroke={color.stroke}
          strokeWidth={1.8}
        />
        {/* Logo da equipe */}
        {logo ? (
          <image
            href={logo}
            x={cx + 12}
            y={cy - 8}
            width={16}
            height={16}
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <circle cx={cx + 20} cy={cy} r={6} fill={color.stroke} />
        )}
        {/* Pontuação Final Real */}
        <text
          x={cx + (logo ? 33 : 22)}
          y={cy + 4}
          fill="#ffffff"
          fontSize="10"
          fontWeight="900"
          fontFamily="monospace"
        >
          {finalScore}
        </text>
      </g>
    );
  }

  // 2. Se não deve exibir o badge completo nos pontos intermediários, exibe apenas um ponto sutil
  if (!shouldShowBadge) {
    return (
      <circle
        key={`dot-subtle-${teamName}-${index}`}
        cx={cx}
        cy={cy}
        r={2.5}
        fill={color.stroke}
        stroke="#0b0b10"
        strokeWidth={1}
        className="pointer-events-none"
      />
    );
  }

  // 3. Nó completo com Logo da Equipe e Pill de Pontuação
  const currentScore = realScore;
  const scoreDigits = String(currentScore).length;
  const pillWidth = scoreDigits >= 4 ? 38 : scoreDigits === 3 ? 32 : 26;

  return (
    <g key={`marker-${teamName}-${index}`} className="pointer-events-none">
      {/* Círculo base do nó */}
      <circle
        cx={cx}
        cy={cy}
        r={7.5}
        fill="#0b0b12"
        stroke={color.stroke}
        strokeWidth={1.8}
      />
      {/* Logo no centro do nó */}
      {logo ? (
        <image
          href={logo}
          x={cx - 5}
          y={cy - 5}
          width={10}
          height={10}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <text
          x={cx}
          y={cy + 2.5}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="7"
          fontWeight="900"
        >
          {teamName.slice(0, 2)}
        </text>
      )}

      {/* Pill com a Pontuação acima do nó */}
      <g transform={`translate(${cx}, ${cy - 16})`}>
        <rect
          x={-pillWidth / 2}
          y={-6}
          width={pillWidth}
          height={12}
          rx={6}
          fill="#0a0a12f2"
          stroke={color.stroke}
          strokeWidth={0.9}
        />
        <text
          x={0}
          y={3}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="8.5"
          fontWeight="900"
          fontFamily="monospace"
        >
          {currentScore}
        </text>
      </g>
    </g>
  );
};

// Componente Customizado de Tooltip do Recharts
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  selectedTeams: string[];
  data: DashboardData;
  chartMode?: 'stacked' | 'unstacked' | 'roundOnly';
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ 
  active, 
  payload, 
  label, 
  data,
  chartMode = 'unstacked'
}) => {
  if (!active || !payload || !payload.length) return null;

  const currentRound = payload[0]?.payload?.round || label;
  const currentRoundLabel = payload[0]?.payload?.roundLabel || `Rodada ${currentRound}`;

  // Obter a pontuação real da equipe na rodada atual
  const getTeamScore = (entry: any): number => {
    const tName = entry.name;
    if (chartMode === 'roundOnly') {
      const rdPts = entry.payload?.[`${tName}_roundPts`];
      if (typeof rdPts === 'number') return rdPts;
    }
    const cum = entry.payload?.[`${tName}_cumPts`] ?? entry.payload?.[tName];
    if (typeof cum === 'number') return cum;
    if (Array.isArray(entry.value)) {
      return Math.round(Number(entry.value[1] || 0) - Number(entry.value[0] || 0));
    }
    if (typeof entry.value === 'number') return Math.round(entry.value);
    return 0;
  };

  // Ordenar equipes no tooltip da maior pontuação real para a menor
  const sortedEntries = [...payload].sort((a, b) => getTeamScore(b) - getTeamScore(a));

  // Soma do volume das equipes selecionadas
  const totalVolume = sortedEntries.reduce((acc, curr) => acc + getTeamScore(curr), 0);

  return (
    <div className="bg-[#121218]/95 backdrop-blur-md border border-yellow-500/30 p-4 rounded-2xl shadow-2xl min-w-[240px] text-xs">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <span className="font-black italic uppercase text-yellow-400 text-sm flex items-center gap-1.5">
          <TrendingUp size={15} /> {currentRoundLabel}
        </span>
        <span className="text-[10px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-gray-300">
          Total Selecionado: {totalVolume} pts
        </span>
      </div>

      <div className="space-y-2">
        {sortedEntries.map((entry: any, index: number) => {
          const teamName = entry.name;
          const cumPts = getTeamScore(entry);
          const roundPts = entry.payload?.[`${teamName}_roundPts`] ?? 0;
          const logo = findTeamLogo(teamName, data.teamsReference);

          return (
            <div key={`tt-${index}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.stroke || entry.color }}
                />
                {logo && (
                  <img
                    src={logo}
                    alt={teamName}
                    className="w-3.5 h-3.5 object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                )}
                <span className="font-bold text-gray-200 truncate max-w-[120px]">
                  {teamName}
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono font-black text-white text-xs">
                  {cumPts} pts
                </span>
                {roundPts > 0 && (
                  <span className="text-[10px] font-mono text-emerald-400 ml-1.5 font-bold">
                    (+{roundPts})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-2 border-t border-white/5 text-[9px] text-gray-400 italic">
        * Pontuação pura conquistada em campo (sem bônus)
      </div>
    </div>
  );
};
