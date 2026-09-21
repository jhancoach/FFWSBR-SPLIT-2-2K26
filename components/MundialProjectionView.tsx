import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, 
  Globe, 
  Target, 
  TrendingUp, 
  Flame, 
  Sliders, 
  ChevronRight, 
  Sparkles, 
  Percent, 
  ShieldCheck, 
  AlertCircle, 
  BarChart3, 
  Zap, 
  Layers, 
  Compass, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Crosshair,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { DashboardData, TeamStats } from '../types';
import { calculateTeamStats } from '../services/dataService';
import { findTeamLogo } from '../utils/teamUtils';

interface MundialProjectionViewProps {
  data: DashboardData;
  initialTeam?: string;
  isModal?: boolean;
  onClose?: () => void;
}

const BONUS_POINTS_TABLE = [50, 42, 35, 29, 24, 19, 15, 11, 8, 5, 2, 0];

export const MundialProjectionView: React.FC<MundialProjectionViewProps> = ({
  data,
  initialTeam = 'LOUD SNICKERS',
  isModal = false,
  onClose
}) => {
  const [selectedTeamName, setSelectedTeamName] = useState<string>(initialTeam);
  const [targetType, setTargetType] = useState<'TOP_1' | 'TOP_2' | 'CUSTOM'>('TOP_1');
  const [customTargetPoints, setCustomTargetPoints] = useState<number>(600);
  
  // Controle de Quedas Restantes (Padrão 24, pois são 4 rodadas restantes de 6 quedas)
  const [remainingMatches, setRemainingMatches] = useState<number>(24);
  
  // Ritmo simulado do adversário alvo (pts por queda)
  const [simulatedOpponentPace, setSimulatedOpponentPace] = useState<number>(15.92);
  const [pacePreset, setPacePreset] = useState<'CURRENT' | 'STRONG' | 'MEDIUM' | 'LOW' | 'CUSTOM'>('CURRENT');

  const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

  // 1. Processar dados oficiais da 1ª Fase e da 2ª Fase
  const tournamentData = useMemo(() => {
    if (!data.details || data.details.length === 0) return null;

    // Qualificatória (Rodadas 1 a 14)
    const qualiDetails = data.details.filter(d => {
      const roundNum = parseInt(d.RD?.replace(/\D/g, '') || '0') || 0;
      const confrontoNorm = normalize(d.CONFRONTO);
      const rdNorm = normalize(d.RD);
      const isQualiText = confrontoNorm.includes('CLASSIF') || confrontoNorm.includes('QUALI') || rdNorm.includes('CLASSIF') || rdNorm.includes('FASE 1') || rdNorm.includes('1A FASE') || rdNorm.includes('1ª FASE');
      const isQualiRound = (!confrontoNorm || (!confrontoNorm.includes('MUNDIAL') && !confrontoNorm.includes('FINAL'))) && (roundNum === 0 || (roundNum >= 1 && roundNum <= 14));
      return isQualiText || isQualiRound;
    });

    const qualiStats = calculateTeamStats({ ...data, details: qualiDetails });
    const top12Quali = qualiStats.slice(0, 12);
    const bonusMap = new Map<string, number>();
    top12Quali.forEach((team, idx) => {
      bonusMap.set(team.name, BONUS_POINTS_TABLE[idx] ?? 0);
    });

    // Rumo ao Mundial (Rodadas 15 a 20)
    const rumoDetails = data.details.filter(d => {
      const roundNum = parseInt(d.RD?.replace(/\D/g, '') || '0') || 0;
      const confrontoNorm = normalize(d.CONFRONTO);
      const rdNorm = normalize(d.RD);
      const isRumoText = confrontoNorm.includes('RUMO') || confrontoNorm.includes('MUNDIAL') || confrontoNorm.includes('FASE 2') || confrontoNorm.includes('2A FASE') || confrontoNorm.includes('2ª FASE') || rdNorm.includes('RUMO') || rdNorm.includes('MUNDIAL');
      const isRumoRound = (!confrontoNorm || (!confrontoNorm.includes('CLASSIF') && !confrontoNorm.includes('FINAL'))) && (roundNum >= 15 && roundNum <= 20);
      return isRumoText || isRumoRound;
    });

    // Partidas efetivamente jogadas da 2ª Fase (rodadas com dados reais)
    const rumoPlayedDetails = rumoDetails.filter(d => {
      const roundNum = parseInt(d.RD?.replace(/\D/g, '') || '0') || 0;
      const pts = parseInt(d.PTS || '0') || 0;
      return (roundNum === 15 || roundNum === 16) || pts > 0;
    });

    const rumoPlayedStats = calculateTeamStats({ ...data, details: rumoPlayedDetails });
    const rumoPlayedMap = new Map<string, TeamStats>();
    rumoPlayedStats.forEach(s => rumoPlayedMap.set(s.name, s));

    // Rodadas e quedas jogadas
    const playedRoundsSet = new Set<string>();
    rumoPlayedDetails.forEach(d => {
      if (d.RD) playedRoundsSet.add(d.RD.toString());
    });
    const playedRoundsCount = playedRoundsSet.size || 2; // Padrão 2 rodadas (R15 e R16)
    const totalPhaseRounds = 6;
    const remainingRoundsCount = Math.max(0, totalPhaseRounds - playedRoundsCount);

    // Tabela completa do Rumo ao Mundial
    const leaderboard = top12Quali.map((qualiTeam, idx) => {
      const bonus = bonusMap.get(qualiTeam.name) ?? 0;
      const played = rumoPlayedMap.get(qualiTeam.name);

      const s = played?.s || 0;
      const b = played?.b || 0;
      const abts = played?.abts || 0;
      const ptsc = played?.ptsc || 0;
      const rawPts = abts + ptsc;
      const totalPts = rawPts + bonus;
      const avgPts = s > 0 ? parseFloat((rawPts / s).toFixed(2)) : 0;
      const avgAbts = s > 0 ? parseFloat((abts / s).toFixed(2)) : 0;
      const avgPtsc = s > 0 ? parseFloat((ptsc / s).toFixed(2)) : 0;

      return {
        rank: idx + 1,
        name: qualiTeam.name,
        image: qualiTeam.image || findTeamLogo(qualiTeam.name),
        bonus,
        rawPts,
        totalPts,
        b,
        abts,
        ptsc,
        s,
        avgPts,
        avgAbts,
        avgPtsc
      };
    });

    // Ordenar de acordo com o regulamento do Rumo ao Mundial
    leaderboard.sort((a, b) => b.totalPts - a.totalPts || b.b - a.b || b.abts - a.abts || b.ptsc - a.ptsc);
    leaderboard.forEach((item, index) => {
      item.rank = index + 1;
    });

    return {
      leaderboard,
      top1Team: leaderboard[0] || null,
      top2Team: leaderboard[1] || null,
      playedRoundsCount,
      remainingRoundsCount,
      defaultRemainingMatches: remainingRoundsCount * 6
    };
  }, [data.details]);

  // Se não encontrar dados suficientes
  if (!tournamentData || tournamentData.leaderboard.length === 0) {
    return (
      <div className="bg-[#141418] border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
        <AlertCircle className="mx-auto mb-2 text-yellow-500" size={32} />
        <p className="font-bold">Aguardando dados das partidas da 2ª Fase (Rumo ao Mundial)...</p>
      </div>
    );
  }

  const { leaderboard, top1Team, top2Team, playedRoundsCount, remainingRoundsCount } = tournamentData;

  // Equipe Selecionada (ex: LOUD)
  const currentSelectedTeam = leaderboard.find(t => 
    normalize(t.name) === normalize(selectedTeamName) ||
    normalize(t.name).includes(normalize(selectedTeamName)) ||
    normalize(selectedTeamName).includes(normalize(t.name))
  ) || leaderboard.find(t => normalize(t.name).includes('LOUD')) || leaderboard[4] || leaderboard[0];

  // Equipe Alvo da Projeção
  const targetTeam = targetType === 'TOP_1' ? top1Team : targetType === 'TOP_2' ? top2Team : null;

  // Atualizar ritmo simulado automaticamente quando mudar o alvo e estiver no modo CURRENT
  useEffect(() => {
    if (pacePreset === 'CURRENT') {
      const active = targetType === 'TOP_1' ? top1Team : targetType === 'TOP_2' ? top2Team : null;
      if (active && active.avgPts > 0) {
        setSimulatedOpponentPace(active.avgPts);
      }
    }
  }, [targetType, top1Team?.avgPts, top2Team?.avgPts, pacePreset]);

  // Selecionar alvo e atualizar ritmo imediatamente
  const selectTarget = (newTarget: 'TOP_1' | 'TOP_2' | 'CUSTOM') => {
    setTargetType(newTarget);
    setPacePreset('CURRENT');
    if (newTarget === 'TOP_1') {
      const pace = top1Team && top1Team.avgPts > 0 ? top1Team.avgPts : 15.92;
      setSimulatedOpponentPace(pace);
    } else if (newTarget === 'TOP_2') {
      const pace = top2Team && top2Team.avgPts > 0 ? top2Team.avgPts : 15.42;
      setSimulatedOpponentPace(pace);
    }
  };

  // Atualizar preset de ritmo quando o alvo muda
  const handlePacePreset = (preset: 'CURRENT' | 'STRONG' | 'MEDIUM' | 'LOW') => {
    setPacePreset(preset);
    if (!targetTeam) return;

    if (preset === 'CURRENT') {
      setSimulatedOpponentPace(targetTeam.avgPts > 0 ? targetTeam.avgPts : 15.92);
    } else if (preset === 'STRONG') {
      setSimulatedOpponentPace(14.0);
    } else if (preset === 'MEDIUM') {
      setSimulatedOpponentPace(12.5);
    } else if (preset === 'LOW') {
      setSimulatedOpponentPace(10.0);
    }
  };

  // Cálculos matemáticos da Projeção
  const targetCurrentPoints = targetTeam ? targetTeam.totalPts : customTargetPoints;
  const targetName = targetType === 'TOP_1' 
    ? `Top 1 (${top1Team?.name || 'Líder'})` 
    : targetType === 'TOP_2' 
      ? `Top 2 - Vaga Mundial (${top2Team?.name || 'Vice-Líder'})` 
      : 'Meta Personalizada';

  // Pontuação final estimada do alvo
  const targetProjectedPoints = targetTeam 
    ? Math.round(targetCurrentPoints + (simulatedOpponentPace * remainingMatches))
    : customTargetPoints;

  // Pontos que a equipe selecionada precisa fazer para superar o alvo (pelo menos +1 ponto que o alvo)
  const targetFinalScoreToBeat = targetProjectedPoints + 1;
  const pointsNeededToScore = Math.max(0, targetFinalScoreToBeat - currentSelectedTeam.totalPts);
  
  // Média necessária por partida
  const neededPacePerMatch = remainingMatches > 0 
    ? parseFloat((pointsNeededToScore / remainingMatches).toFixed(2)) 
    : 0;

  // Média necessária por rodada (6 quedas)
  const neededPacePerRound = parseFloat((neededPacePerMatch * 6).toFixed(1));

  // Diferencial direto por queda em relação ao adversário alvo
  const pointGapCurrent = targetCurrentPoints - currentSelectedTeam.totalPts;
  const directDifferentialPerMatch = remainingMatches > 0 
    ? parseFloat((pointGapCurrent / remainingMatches).toFixed(2)) 
    : 0;
  const directDifferentialPerRound = parseFloat((directDifferentialPerMatch * 6).toFixed(1));

  // Termômetro de Dificuldade do Ritmo Necessário
  const getDifficultyLevel = (pace: number) => {
    if (pace <= 11.5) {
      return {
        label: 'Ritmo Confortável / Padrão',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        barColor: 'bg-emerald-500',
        percent: 25,
        desc: 'Ritmo compatível com a média competitiva regular.'
      };
    } else if (pace <= 14.5) {
      return {
        label: 'Ritmo Forte / Alta Regularidade',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10 border-yellow-500/30',
        barColor: 'bg-yellow-500',
        percent: 55,
        desc: 'Exige boas colocações consistentes e média de 5 a 7 abates por queda.'
      };
    } else if (pace <= 17.0) {
      return {
        label: 'Ritmo de Campeão / Agressivo',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10 border-orange-500/30',
        barColor: 'bg-orange-500',
        percent: 80,
        desc: 'Ritmo intenso exigindo múltiplos Booyahs e top 3 frequentes com muitas kills.'
      };
    } else {
      return {
        label: 'Ritmo Histórico / Sob Pressão Extrema',
        color: 'text-red-400',
        bg: 'bg-red-500/10 border-red-500/30',
        barColor: 'bg-red-500',
        percent: 100,
        desc: 'Desafio extremo que requer média acima de 17 pontos por queda ao longo de 24 partidas.'
      };
    }
  };

  const difficulty = getDifficultyLevel(neededPacePerMatch);

  // Cenários Pré-Calculados para Tabela Comparativa (quando o alvo for a LOS ou INTZ)
  const simulatedScenarios = useMemo(() => {
    if (!targetTeam) return [];
    
    const baselineCurrent = targetTeam.avgPts > 0 ? targetTeam.avgPts : 15.92;
    const scenariosList = [
      {
        title: `Ritmo Atual do Alvo (${baselineCurrent.toFixed(1)} pts/q)`,
        pace: baselineCurrent,
        tag: 'Cenário Base',
        tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      },
      {
        title: 'Ritmo Forte (14,0 pts/q)',
        pace: 14.0,
        tag: 'Alvo Regular',
        tagColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
      },
      {
        title: 'Ritmo Médio Competitivo (12,5 pts/q)',
        pace: 12.5,
        tag: 'Alvo Equilibrado',
        tagColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
      },
      {
        title: 'Oscilação do Alvo (11,0 pts/q)',
        pace: 11.0,
        tag: 'Alvo Pressionado',
        tagColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
      },
      {
        title: 'Queda Brusca do Alvo (9,5 pts/q)',
        pace: 9.5,
        tag: 'Alvo em Crise',
        tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      },
    ];

    return scenariosList.map(sc => {
      const projFinal = Math.round(targetCurrentPoints + (sc.pace * remainingMatches));
      const targetScore = projFinal + 1;
      const ptsToScore = Math.max(0, targetScore - currentSelectedTeam.totalPts);
      const reqPace = remainingMatches > 0 ? parseFloat((ptsToScore / remainingMatches).toFixed(2)) : 0;
      const reqRound = parseFloat((reqPace * 6).toFixed(1));
      return {
        ...sc,
        projFinal,
        ptsToScore,
        reqPace,
        reqRound
      };
    });
  }, [targetTeam, targetCurrentPoints, remainingMatches, currentSelectedTeam.totalPts]);

  return (
    <div className={`bg-[#121215] border border-purple-500/30 rounded-2xl text-gray-200 overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] ${isModal ? 'max-w-5xl w-full max-h-[92vh] overflow-y-auto' : 'w-full'}`}>
      {/* Header com Identidade Visual Rumo ao Mundial */}
      <div className="bg-gradient-to-r from-purple-950/80 via-[#181226] to-[#121215] border-b border-purple-500/30 p-6 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-500/20 border border-purple-500/40 rounded-2xl text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)] shrink-0">
              <Target size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Globe size={11} /> 2ª Fase • Rumo ao Mundial
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={11} /> Simulador Matemático Oficial
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-wide text-white font-display mt-1">
                Projeção de Pontos por Partida
              </h2>
              <p className="text-xs text-gray-400 font-medium">
                Cálculo em tempo real do rendimento necessário para alcançar o <strong>Top 1</strong> ou a <strong>Vaga Direta no Mundial (Top 2)</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/60 border border-purple-500/20 rounded-xl px-3.5 py-2 text-right">
              <span className="text-[9px] text-gray-400 font-bold uppercase block tracking-wider">Status da 2ª Fase</span>
              <span className="text-xs font-black text-purple-300">
                12 Quedas Disputadas • <span className="text-yellow-400">24 Quedas Restantes</span>
              </span>
            </div>

            {isModal && onClose && (
              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Fechar visualização"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="p-6 space-y-6">
        
        {/* Barra de Controles e Seletores: Time & Alvo */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-[#0d0d10] p-4 rounded-2xl border border-white/5">
          
          {/* Seletor de Equipe */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-purple-400" /> Selecione a Equipe a Projetar:
            </label>
            <div className="relative">
              <select
                value={currentSelectedTeam.name}
                onChange={(e) => setSelectedTeamName(e.target.value)}
                className="w-full bg-[#16161c] border border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs font-black text-white uppercase focus:outline-none focus:border-purple-400 transition-all cursor-pointer"
              >
                {leaderboard.map((team) => (
                  <option key={team.name} value={team.name}>
                    {team.rank}º {team.name} — {team.totalPts} pts ({team.avgPts.toFixed(1)} pts/q)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-400">
              <img src={currentSelectedTeam.image} alt={currentSelectedTeam.name} className="w-4 h-4 object-contain rounded" />
              <span>
                Pontuação Atual: <strong className="text-yellow-400">{currentSelectedTeam.totalPts} pts</strong> 
                {' '}(Bônus: +{currentSelectedTeam.bonus} | Quedas: {currentSelectedTeam.rawPts} pts • Média Sem Bônus: <strong className="text-white">{currentSelectedTeam.avgPts.toFixed(2)} pts/q</strong>)
              </span>
            </div>
          </div>

          {/* Seletor do Objetivo (Top 1 / Top 2 / Custom) */}
          <div className="md:col-span-7 space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <Trophy size={12} className="text-yellow-500" /> Objetivo de Classificação:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => selectTarget('TOP_1')}
                className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase flex flex-col items-center justify-center transition-all cursor-pointer border ${
                  targetType === 'TOP_1'
                    ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)] font-black'
                    : 'bg-[#16161c] text-gray-300 border-gray-800 hover:border-gray-700 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1">🥇 TOP 1 (Líder)</span>
                <span className="text-[9px] font-bold opacity-80 mt-0.5">
                  {top1Team ? `${top1Team.name} (${top1Team.totalPts} pts)` : 'Líder'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => selectTarget('TOP_2')}
                className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase flex flex-col items-center justify-center transition-all cursor-pointer border ${
                  targetType === 'TOP_2'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] font-black'
                    : 'bg-[#16161c] text-gray-300 border-gray-800 hover:border-gray-700 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1">🌍 TOP 2 (Vaga Mundial)</span>
                <span className="text-[9px] font-bold opacity-80 mt-0.5">
                  {top2Team ? `${top2Team.name} (${top2Team.totalPts} pts)` : '2º Colocado'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => selectTarget('CUSTOM')}
                className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase flex flex-col items-center justify-center transition-all cursor-pointer border ${
                  targetType === 'CUSTOM'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)] font-black'
                    : 'bg-[#16161c] text-gray-300 border-gray-800 hover:border-gray-700 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1">🎯 Meta Customizada</span>
                <span className="text-[9px] font-bold opacity-80 mt-0.5">
                  {customTargetPoints} Pts
                </span>
              </button>
            </div>

            {targetType === 'CUSTOM' && (
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs text-gray-400 font-bold">Definir Pontuação Desejada:</span>
                <input
                  type="number"
                  min="200"
                  max="800"
                  step="10"
                  value={customTargetPoints}
                  onChange={(e) => setCustomTargetPoints(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 bg-black/80 border border-blue-500/50 rounded-lg px-2 py-1 text-xs font-mono font-bold text-blue-300 text-center"
                />
              </div>
            )}
          </div>
        </div>

        {/* Banner de Esclarecimento sobre o Bônus vs Médias */}
        <div className="flex items-start sm:items-center gap-3 p-3.5 bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-blue-950/40 border border-blue-500/30 rounded-2xl text-xs text-blue-200 shadow-sm">
          <Info size={18} className="shrink-0 text-blue-400 mt-0.5 sm:mt-0" />
          <div className="leading-relaxed">
            <strong className="text-white uppercase tracking-wider text-[11px] block sm:inline mr-2">📌 Regra de Cálculo Oficial:</strong>
            Os pontos bônus da 1ª Fase entram <strong>apenas na pontuação total acumulada</strong>. Todas as médias por partida (M.PTS) e os ritmos necessários projetados são calculados <strong>estritamente sobre os pontos das quedas (Sem o Bônus)</strong>.
          </div>
        </div>

        {/* Big Impact Highlight Cards (Os Números Chave da Projeção) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Média Necessária por Queda */}
          <div className="bg-gradient-to-b from-[#1a1429] to-[#120f1c] border-2 border-purple-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-purple-500/10 group-hover:text-purple-500/20 transition-all pointer-events-none">
              <Zap size={64} />
            </div>
            <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider block mb-1">
              Média / Queda Necessária (Sem Bônus)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                {neededPacePerMatch.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-gray-400 uppercase">pts / queda</span>
            </div>
            <p className="text-[11px] text-gray-300 mt-2 font-medium">
              Média pura de campo (abates + colocação, sem somar bônus) em cada uma das <strong className="text-white">{remainingMatches} quedas</strong> restantes.
            </p>
          </div>

          {/* Card 2: Média por Rodada (6 Quedas) */}
          <div className="bg-[#15151a] border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
              Média por Rodada (6 Quedas)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-white">
                {neededPacePerRound.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-gray-400 uppercase">pts / dia</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Pontuação alvo necessária ao término de cada uma das <strong className="text-gray-200">{(remainingMatches / 6).toFixed(0)} rodadas restantes</strong>.
            </p>
          </div>

          {/* Card 3: Diferencial Direto em Confronto */}
          <div className="bg-[#15151a] border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
              Diferencial Necessário / Queda
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">
                +{directDifferentialPerMatch.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-gray-400 uppercase">pts a mais / q</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Vantagem líquida que a {currentSelectedTeam.name} precisa abrir sobre o ritmo de campo do adversário ({targetName}) por partida.
            </p>
          </div>

          {/* Card 4: Distância Total & Pontos a Somar */}
          <div className="bg-[#15151a] border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
              Pontos a Somar nas {remainingMatches} Quedas
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-purple-300">
                {pointsNeededToScore}
              </span>
              <span className="text-xs font-bold text-gray-400 uppercase">pts totais</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Para atingir <strong className="text-white">{targetFinalScoreToBeat} pts</strong> e ultrapassar a projeção de {targetProjectedPoints} pts.
            </p>
          </div>
        </div>

        {/* Simulador Interativo de Ritmo do Adversário & Quedas Restantes */}
        <div className="bg-[#0f0f13] border border-purple-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders size={18} className="text-yellow-500" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white font-display">
                Ajuste os Parâmetros da Simulação
              </h3>
            </div>
            <span className="text-xs text-purple-300 font-medium">
              Altere o ritmo do líder ou o número de quedas para ver o impacto instantâneo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Controle 1: Ritmo do Adversário Alvo */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">
                  Ritmo de Campo do Adversário ({targetTeam?.name || 'Alvo'}) <span className="text-gray-400 font-normal">[Sem Bônus]</span>:
                </span>
                <span className="text-sm font-black font-mono text-yellow-400 bg-black/60 px-2.5 py-0.5 rounded-lg border border-yellow-500/30">
                  {simulatedOpponentPace.toFixed(2)} pts / queda
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="8.0"
                max="20.0"
                step="0.1"
                value={simulatedOpponentPace}
                onChange={(e) => {
                  setSimulatedOpponentPace(parseFloat(e.target.value));
                  setPacePreset('CUSTOM');
                }}
                className="w-full accent-yellow-500 cursor-pointer h-2 bg-gray-800 rounded-lg"
              />

              {/* Botões de Preset Rápido */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePacePreset('CURRENT')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                    pacePreset === 'CURRENT'
                      ? 'bg-yellow-500 text-black border-yellow-400 font-black'
                      : 'bg-black/40 text-gray-400 border-gray-800 hover:text-white'
                  }`}
                >
                  Ritmo Atual Sem Bônus ({targetTeam ? targetTeam.avgPts.toFixed(2) : '15.92'} pts/q)
                </button>
                <button
                  type="button"
                  onClick={() => handlePacePreset('STRONG')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                    pacePreset === 'STRONG'
                      ? 'bg-yellow-500 text-black border-yellow-400 font-black'
                      : 'bg-black/40 text-gray-400 border-gray-800 hover:text-white'
                  }`}
                >
                  Forte (14.0 pts)
                </button>
                <button
                  type="button"
                  onClick={() => handlePacePreset('MEDIUM')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                    pacePreset === 'MEDIUM'
                      ? 'bg-yellow-500 text-black border-yellow-400 font-black'
                      : 'bg-black/40 text-gray-400 border-gray-800 hover:text-white'
                  }`}
                >
                  Médio (12.5 pts)
                </button>
                <button
                  type="button"
                  onClick={() => handlePacePreset('LOW')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                    pacePreset === 'LOW'
                      ? 'bg-yellow-500 text-black border-yellow-400 font-black'
                      : 'bg-black/40 text-gray-400 border-gray-800 hover:text-white'
                  }`}
                >
                  Oscilando (10.0 pts)
                </button>
              </div>
            </div>

            {/* Controle 2: Quedas Restantes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">
                  Quedas Restantes na Disputa:
                </span>
                <span className="text-sm font-black font-mono text-purple-300 bg-black/60 px-2.5 py-0.5 rounded-lg border border-purple-500/30">
                  {remainingMatches} quedas ({Math.ceil(remainingMatches / 6)} rodadas)
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={remainingMatches}
                onChange={(e) => setRemainingMatches(parseInt(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer h-2 bg-gray-800 rounded-lg"
              />

              <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span>1 queda</span>
                <button 
                  onClick={() => setRemainingMatches(6)}
                  className="hover:text-purple-300 hover:underline cursor-pointer"
                >
                  6 quedas (1 rodada)
                </button>
                <button 
                  onClick={() => setRemainingMatches(12)}
                  className="hover:text-purple-300 hover:underline cursor-pointer"
                >
                  12 quedas (2 rodadas)
                </button>
                <button 
                  onClick={() => setRemainingMatches(24)}
                  className="hover:text-purple-300 hover:underline cursor-pointer text-purple-400 font-bold"
                >
                  24 quedas (Oficial 4 rodadas)
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Termômetro de Dificuldade & Tradução Prática em Jogo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Termômetro de Dificuldade */}
          <div className="lg:col-span-6 bg-[#141418] border border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Termômetro de Desafio Competitivo
              </span>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border ${difficulty.bg} ${difficulty.color}`}>
                {difficulty.label}
              </span>
            </div>

            {/* Barra de Progresso Visual */}
            <div className="w-full bg-gray-900 rounded-full h-3.5 p-0.5 border border-white/5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${difficulty.barColor}`}
                style={{ width: `${Math.min(100, Math.max(10, difficulty.percent))}%` }}
              />
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              {difficulty.desc}
            </p>

            <div className="pt-2 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-400 font-mono">
              <span>Média Atual da {currentSelectedTeam.name}: <strong>{currentSelectedTeam.avgPts.toFixed(2)} pts/q</strong></span>
              <span>Necessário: <strong className="text-yellow-400">{neededPacePerMatch.toFixed(2)} pts/q</strong></span>
            </div>
          </div>

          {/* Tradução Prática no Free Fire (Como fazer essa pontuação em campo?) */}
          <div className="lg:col-span-6 bg-[#141418] border border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Crosshair size={16} className="text-yellow-500" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white font-display">
                O que {neededPacePerMatch.toFixed(1)} pts/queda exige em jogo?
              </h4>
            </div>

            <p className="text-xs text-gray-300">
              Para atingir a média de <strong>{neededPacePerMatch.toFixed(2)} pontos</strong> por partida, a equipe precisa mirar em uma das seguintes composições em cada queda:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="bg-black/50 p-2.5 rounded-xl border border-yellow-500/20 text-center">
                <span className="text-[10px] font-black text-yellow-400 block uppercase">Opção A (Booyah)</span>
                <span className="text-xs font-black text-white">12 pts posição</span>
                <span className="text-[10px] text-gray-400 block">+ {Math.max(0, Math.round(neededPacePerMatch - 12))} abates</span>
              </div>

              <div className="bg-black/50 p-2.5 rounded-xl border border-gray-800 text-center">
                <span className="text-[10px] font-black text-purple-300 block uppercase">Opção B (Top 2)</span>
                <span className="text-xs font-black text-white">9 pts posição</span>
                <span className="text-[10px] text-gray-400 block">+ {Math.max(0, Math.round(neededPacePerMatch - 9))} abates</span>
              </div>

              <div className="bg-black/50 p-2.5 rounded-xl border border-gray-800 text-center">
                <span className="text-[10px] font-black text-blue-300 block uppercase">Opção C (Top 3)</span>
                <span className="text-xs font-black text-white">7 pts posição</span>
                <span className="text-[10px] text-gray-400 block">+ {Math.max(0, Math.round(neededPacePerMatch - 7))} abates</span>
              </div>
            </div>
          </div>

        </div>

        {/* Tabela de Cenários Comparativos */}
        <div className="bg-[#0f0f12] border border-gray-800 rounded-2xl overflow-hidden shadow-xl space-y-0">
          <div className="p-4 bg-black/40 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-purple-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white font-display">
                Matriz de Cenários • Disputa com o {targetName}
              </h4>
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase">
              Base: {remainingMatches} Quedas Restantes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#17171d] border-b border-gray-800 text-gray-400 font-mono text-[10px] uppercase">
                  <th className="py-3 px-4">Cenário do Adversário ({targetTeam?.name || 'Alvo'})</th>
                  <th className="py-3 px-3 text-center">Ritmo do Alvo</th>
                  <th className="py-3 px-3 text-center">Pontos Finais Projetados</th>
                  <th className="py-3 px-3 text-center">Pontos Necessários ({currentSelectedTeam.name})</th>
                  <th className="py-3 px-4 text-center font-black text-yellow-400">Média Exigida por Queda</th>
                  <th className="py-3 px-4 text-center">Média por Rodada (6Q)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-medium">
                {simulatedScenarios.map((sc, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${sc.tagColor}`}>
                          {sc.tag}
                        </span>
                        <span className="font-bold text-white">{sc.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-gray-300">
                      {sc.pace.toFixed(1)} pts/q
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-purple-300">
                      ~{sc.projFinal} pts
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-white">
                      +{sc.ptsToScore} pts
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-3 py-1 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 font-mono font-black text-sm shadow-sm">
                        {sc.reqPace.toFixed(2)} pts/q
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-gray-300">
                      ~{sc.reqRound.toFixed(1)} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela com as 12 Equipes do Rumo ao Mundial e Distância Atual */}
        <div className="bg-[#141418] border border-gray-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-purple-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white font-display">
                Classificação & Distância ao Top 1 e Top 2 (12 Equipes da 2ª Fase)
              </h4>
            </div>
            <span className="text-[10px] text-gray-400">
              12 Quedas Disputadas (R15 e R16)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {leaderboard.map((team) => {
              const isSelected = normalize(team.name) === normalize(currentSelectedTeam.name);
              const gapToTop1 = (top1Team?.totalPts || 0) - team.totalPts;
              const gapToTop2 = (top2Team?.totalPts || 0) - team.totalPts;
              const isTop1 = team.rank === 1;
              const isTop2 = team.rank === 2;

              return (
                <div
                  key={team.name}
                  onClick={() => setSelectedTeamName(team.name)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/50 shadow-lg'
                      : 'bg-black/40 border-gray-800/80 hover:border-gray-700 hover:bg-black/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isTop1 ? 'bg-yellow-500 text-black' : isTop2 ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300'
                    }`}>
                      {team.rank}
                    </span>
                    <img src={team.image} alt={team.name} className="w-5 h-5 object-contain rounded shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-black text-white truncate block uppercase">
                        {team.name}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {team.totalPts} pts • {team.avgPts.toFixed(1)} pts/q
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono text-[10px]">
                    {isTop1 ? (
                      <span className="text-yellow-400 font-bold block uppercase text-[9px]">Líder Atual</span>
                    ) : (
                      <span className="text-gray-400 block">
                        Top 1: <strong className="text-red-400">-{gapToTop1}</strong>
                      </span>
                    )}
                    {isTop2 ? (
                      <span className="text-purple-400 font-bold block uppercase text-[9px]">Vaga Mundial</span>
                    ) : !isTop1 && (
                      <span className="text-gray-400 block">
                        Top 2: <strong className={gapToTop2 <= 0 ? 'text-emerald-400' : 'text-orange-400'}>
                          {gapToTop2 <= 0 ? 'Na Zona' : `-${gapToTop2}`}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MundialProjectionView;
