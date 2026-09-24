import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Tooltip 
} from 'recharts';
import { 
  Target as TargetIcon, 
  Flame, 
  Crosshair, 
  Shield, 
  Zap, 
  Info, 
  EyeOff, 
  X, 
  Sparkles, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Award
} from 'lucide-react';
import { DashboardData } from '../types';

export interface PlayerRadarChartProps {
  p1Stats: any;
  p2Stats?: any;
  p1Name: string;
  p2Name?: string;
  rankingData?: any[];
  data?: DashboardData;
  title?: string;
  onHide?: () => void;
  className?: string;
}

const parseNumber = (val: string | number | undefined | null): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = val.toString().replace(/\D/g, '');
  return parseInt(cleaned, 10) || 0;
};

export const PlayerRadarChart: React.FC<PlayerRadarChartProps> = ({
  p1Stats,
  p2Stats,
  p1Name,
  p2Name,
  rankingData = [],
  data,
  title,
  onHide,
  className = ''
}) => {
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [radarViewMode, setRadarViewMode] = useState<'league' | 'team'>('league');

  // 1. Cálculo da Média da Liga (Benchmark para Dano, HS, Sobrevivência e Agressividade)
  const leagueAverages = useMemo(() => {
    let totalDmg = 0;
    let totalMatches = 0;
    let totalHs = 0;
    let totalKills = 0;
    let totalDeaths = 0;
    let totalKnocks = 0;
    let totalKpmSum = 0;
    let playerCount = 0;

    if (rankingData && rankingData.length > 0) {
      rankingData.forEach((p: any) => {
        const m = parseNumber(p.matches) || 0;
        if (m > 0) {
          totalMatches += m;
          totalDmg += parseNumber(p.damage);
          totalHs += parseNumber(p.hs);
          totalKills += parseNumber(p.kills);
          totalDeaths += parseNumber(p.deaths);
          totalKnocks += parseNumber(p.knocks);
          totalKpmSum += parseFloat(p.kpm) || 0;
          playerCount += 1;
        }
      });
    } else if (data?.players && data.players.length > 0) {
      data.players.forEach(p => {
        totalMatches += 1;
        totalDmg += parseNumber(p.Dano);
        totalHs += parseNumber(p.HS);
        totalKills += parseNumber(p.Abates);
        totalKnocks += parseNumber(p.Deitados);
      });
      totalDeaths = Math.max(1, totalKills);
      playerCount = 1;
    }

    const avgDmg = totalMatches > 0 ? totalDmg / totalMatches : 400;
    const avgHs = totalMatches > 0 ? totalHs / totalMatches : 0.8;
    const avgKd = totalDeaths > 0 ? totalKills / totalDeaths : 1.0;
    const avgKpm = playerCount > 0 ? totalKpmSum / playerCount : (totalMatches > 0 ? (totalKills + totalKnocks) / totalMatches : 0.5);

    return {
      avgDmg: parseFloat(avgDmg.toFixed(1)),
      avgHs: parseFloat(avgHs.toFixed(2)),
      avgKd: parseFloat(avgKd.toFixed(2)),
      avgKpm: parseFloat(avgKpm.toFixed(2)),
      totalMatches,
      playerCount
    };
  }, [rankingData, data]);

  // 2. Extração dos atributos individuais do jogador P1 e P2
  const getAttributes = (stats: any) => {
    if (!stats) {
      return {
        dano: 0,
        hs: 0,
        sobrevivencia: 0,
        agressividade: 0,
        raw: { dano: '0', hs: '0.00', sobrevivencia: '0.00', agressividade: '0.00' }
      };
    }

    const matches = parseNumber(stats.matches) || 1;
    const kills = parseNumber(stats.kills);
    const damage = parseNumber(stats.damage);
    const hs = parseNumber(stats.hs);
    const deaths = parseNumber(stats.deaths) || 0;
    const knocks = parseNumber(stats.knocks);

    // Métricas médias oficiais por partida
    const avgDmg = matches > 0 ? damage / matches : 0;
    const avgHs = matches > 0 ? hs / matches : 0;
    const kd = deaths > 0 ? kills / deaths : (kills > 0 ? kills : 1.0);
    const kpm = parseFloat(stats.kpm) || (matches > 0 ? (kills + knocks) / matches : 0);

    return {
      dano: avgDmg,
      hs: avgHs,
      sobrevivencia: kd,
      agressividade: kpm,
      raw: {
        dano: `${avgDmg.toFixed(0)} Dano/Q`,
        hs: `${avgHs.toFixed(2)} HS/Q`,
        sobrevivencia: `K/D ${kd.toFixed(2)}`,
        agressividade: `${kpm.toFixed(2)} KPM`
      }
    };
  };

  const p1Attrs = getAttributes(p1Stats);
  const p2Attrs = p2Stats ? getAttributes(p2Stats) : null;

  // 3. Montagem dos dados para o Radar Chart no Modo "Atributos vs Média da Liga"
  const leagueRadarData = useMemo(() => {
    const calcScore = (val: number, benchmark: number) => {
      if (!benchmark || benchmark <= 0) return 50;
      // 50 pontos = exatamente na média da liga
      // 100 pontos = 2x a média da liga (desempenho de elite)
      return Math.min(100, Math.max(10, Math.round((val / benchmark) * 50)));
    };

    const calcDiffPct = (val: number, benchmark: number) => {
      if (!benchmark || benchmark <= 0) return 0;
      return ((val - benchmark) / benchmark) * 100;
    };

    return [
      {
        subject: 'DANO',
        attributeName: 'Dano por Queda',
        playerScore: calcScore(p1Attrs.dano, leagueAverages.avgDmg),
        leagueScore: 50,
        playerRaw: p1Attrs.raw.dano,
        leagueRaw: `${leagueAverages.avgDmg.toFixed(0)} Dano/Q`,
        diffPct: calcDiffPct(p1Attrs.dano, leagueAverages.avgDmg),
        icon: Flame,
        color: 'text-amber-400',
        barColor: 'from-amber-500 to-yellow-400',
        desc: 'Poder de fogo e impacto médio por partida disputada'
      },
      {
        subject: 'HS',
        attributeName: 'Média de Headshots',
        playerScore: calcScore(p1Attrs.hs, leagueAverages.avgHs),
        leagueScore: 50,
        playerRaw: p1Attrs.raw.hs,
        leagueRaw: `${leagueAverages.avgHs.toFixed(2)} HS/Q`,
        diffPct: calcDiffPct(p1Attrs.hs, leagueAverages.avgHs),
        icon: Crosshair,
        color: 'text-purple-400',
        barColor: 'from-purple-500 to-fuchsia-400',
        desc: 'Taxa média de headshots por queda (HS ÷ Partidas Jogadas)'
      },
      {
        subject: 'SOBREVIVÊNCIA',
        attributeName: 'Índice de Sobrevivência (K/D)',
        playerScore: calcScore(p1Attrs.sobrevivencia, leagueAverages.avgKd),
        leagueScore: 50,
        playerRaw: p1Attrs.raw.sobrevivencia,
        leagueRaw: `K/D ${leagueAverages.avgKd.toFixed(2)}`,
        diffPct: calcDiffPct(p1Attrs.sobrevivencia, leagueAverages.avgKd),
        icon: Shield,
        color: 'text-emerald-400',
        barColor: 'from-emerald-500 to-teal-400',
        desc: 'Resiliência e capacidade de eliminar mantendo-se vivo'
      },
      {
        subject: 'AGRESSIVIDADE',
        attributeName: 'Ritmo Ofensivo & KPM',
        playerScore: calcScore(p1Attrs.agressividade, leagueAverages.avgKpm),
        leagueScore: 50,
        playerRaw: p1Attrs.raw.agressividade,
        leagueRaw: `${leagueAverages.avgKpm.toFixed(2)} KPM`,
        diffPct: calcDiffPct(p1Attrs.agressividade, leagueAverages.avgKpm),
        icon: Zap,
        color: 'text-red-400',
        barColor: 'from-red-500 to-rose-400',
        desc: 'Frequência de abates e knockdowns por minuto de jogo'
      }
    ];
  }, [p1Attrs, leagueAverages]);

  // 4. Modo Secundário: Contribuição na Equipe (% do Time - 6 Eixos)
  const calcTeamScore = (stats: any) => {
    if (!stats) return { scoreKills: 0, scoreDmg: 0, scoreHs: 0, scoreKnocks: 0, scoreAssists: 0, scoreKP: 0, raw: {} };

    const kills = parseNumber(stats.kills);
    const damage = parseNumber(stats.damage);
    const hs = parseNumber(stats.hs);
    const knocks = parseNumber(stats.knocks);
    const assists = parseNumber(stats.assists);
    
    const teamTotalKills = (stats.teamTotalKills !== undefined && parseNumber(stats.teamTotalKills) > 0) 
      ? parseNumber(stats.teamTotalKills) : (kills || 1);
    const teamTotalDamage = (stats.teamTotalDamage !== undefined && parseNumber(stats.teamTotalDamage) > 0) 
      ? parseNumber(stats.teamTotalDamage) : (damage || 1);
    const teamTotalHS = (stats.teamTotalHS !== undefined && parseNumber(stats.teamTotalHS) > 0) 
      ? parseNumber(stats.teamTotalHS) : (hs || 1);
    const teamTotalKnocks = (stats.teamTotalKnocks !== undefined && parseNumber(stats.teamTotalKnocks) > 0) 
      ? parseNumber(stats.teamTotalKnocks) : (knocks || 1);
    const teamTotalAssists = (stats.teamTotalAssists !== undefined && parseNumber(stats.teamTotalAssists) > 0) 
      ? parseNumber(stats.teamTotalAssists) : (assists || 1);

    const pctKills = teamTotalKills > 0 ? (kills / teamTotalKills) * 100 : 0;
    const pctDmg = teamTotalDamage > 0 ? (damage / teamTotalDamage) * 100 : 0;
    const pctHs = teamTotalHS > 0 ? (hs / teamTotalHS) * 100 : 0;
    const pctKnocks = teamTotalKnocks > 0 ? (knocks / teamTotalKnocks) * 100 : 0;
    const pctAssists = teamTotalAssists > 0 ? (assists / teamTotalAssists) * 100 : 0;
    const kpPct = teamTotalKills > 0 ? ((kills + assists) / teamTotalKills) * 100 : 0;

    const scoreKills = Math.min(100, Math.max(5, Math.round(pctKills * 2)));
    const scoreDmg = Math.min(100, Math.max(5, Math.round(pctDmg * 2)));
    const scoreHs = Math.min(100, Math.max(5, Math.round(pctHs * 2)));
    const scoreKnocks = Math.min(100, Math.max(5, Math.round(pctKnocks * 2)));
    const scoreAssists = Math.min(100, Math.max(5, Math.round(pctAssists * 2)));
    const scoreKP = Math.min(100, Math.max(5, Math.round(kpPct)));

    const fmtNum = (num: number) => num >= 1000 ? `${(num / 1000).toFixed(1)}k` : `${num}`;

    return {
      scoreKills,
      scoreDmg,
      scoreHs,
      scoreKnocks,
      scoreAssists,
      scoreKP,
      raw: {
        avgKills: `${pctKills.toFixed(1)}% do Time (${kills}/${teamTotalKills})`,
        avgDmg: `${pctDmg.toFixed(1)}% do Time (${fmtNum(damage)}/${fmtNum(teamTotalDamage)})`,
        hsPct: `${pctHs.toFixed(1)}% do Time (${hs}/${teamTotalHS})`,
        avgKnocks: `${pctKnocks.toFixed(1)}% do Time (${knocks}/${teamTotalKnocks})`,
        avgAssists: `${pctAssists.toFixed(1)}% do Time (${assists}/${teamTotalAssists})`,
        kpPct: `${kpPct.toFixed(1)}% KP (${kills + assists}/${teamTotalKills})`,
      }
    };
  };

  const p1Team = calcTeamScore(p1Stats);
  const p2Team = p2Stats ? calcTeamScore(p2Stats) : null;

  const teamSubjects = [
    { key: 'scoreKills', rawKey: 'avgKills', label: 'Abates (% do Time)' },
    { key: 'scoreDmg', rawKey: 'avgDmg', label: 'Poder de Fogo (% Dano)' },
    { key: 'scoreHs', rawKey: 'hsPct', label: 'Precisão (% HS Time)' },
    { key: 'scoreKnocks', rawKey: 'avgKnocks', label: 'Impacto (% Deitados)' },
    { key: 'scoreAssists', rawKey: 'avgAssists', label: 'Suporte (% Assist.)' },
    { key: 'scoreKP', rawKey: 'kpPct', label: 'Participação (% KP)' },
  ];

  const teamRadarData = teamSubjects.map(s => {
    const item: any = {
      subject: s.label,
      p1Score: p1Team[s.key as keyof typeof p1Team],
      p1Raw: (p1Team.raw as any)[s.rawKey],
      fullMark: 100,
    };
    if (p2Team) {
      item.p2Score = p2Team[s.key as keyof typeof p2Team];
      item.p2Raw = (p2Team.raw as any)[s.rawKey];
    } else {
      item.score = p1Team[s.key as keyof typeof p1Team];
      item.raw = (p1Team.raw as any)[s.rawKey];
    }
    return item;
  });

  const isLeagueMode = radarViewMode === 'league' && !p2Stats;

  return (
    <div className={`bg-[#141417] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl p-6 ${className}`}>
      {/* Top Header Bar */}
      <div className="bg-black/40 -mx-6 -mt-6 px-6 md:px-8 py-5 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
            <TargetIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-[0.2em] italic font-display">
                {title || `Radar de Atributos: ${p1Name} vs Média da Liga`}
              </h3>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              {isLeagueMode 
                ? 'Visualização dos 4 Atributos Principais (Dano, HS, Sobrevivência, Agressividade) em relação à Média da Liga'
                : 'Atributos baseados na porcentagem (%) de contribuição individual sobre o total da equipe'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Modo do Radar (Liga vs Time) */}
          {!p2Stats && (
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/5 text-[10px]">
              <button
                onClick={() => setRadarViewMode('league')}
                className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  radarViewMode === 'league'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Crosshair size={12} />
                vs Média da Liga (4 Eixos)
              </button>
              <button
                onClick={() => setRadarViewMode('team')}
                className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  radarViewMode === 'team'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users size={12} />
                % do Time (6 Eixos)
              </button>
            </div>
          )}

          {p2Name && (
            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-wider bg-black/60 px-3 py-1.5 rounded-xl border border-white/5">
              <span className="flex items-center gap-1.5 text-yellow-500">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block shadow-[0_0_8px_rgba(234,179,8,0.8)]"></span>
                {p1Name}
              </span>
              <span className="text-gray-600 text-[10px]">VS</span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                {p2Name}
              </span>
            </div>
          )}

          <button 
            onClick={() => setShowExplanation(!showExplanation)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              showExplanation 
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Info size={13} />
            {showExplanation ? 'Ocultar Guia' : 'Entender o Radar'}
          </button>

          {onHide && (
            <button
              onClick={onHide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-white/5 transition-all"
              title="Ocultar Gráfico Radar"
            >
              <EyeOff size={13} />
              <span>Ocultar</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Radar Visual & Attribute Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radar Visual */}
        <div className="lg:col-span-6 h-[340px] md:h-[370px] w-full flex flex-col items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart 
              cx="50%" 
              cy="50%" 
              outerRadius="75%" 
              data={isLeagueMode ? leagueRadarData : teamRadarData}
            >
              <PolarGrid stroke="#334155" strokeDasharray="3 3" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: '900' }} 
              />
              <PolarRadiusAxis 
                angle={45} 
                domain={[0, 100]} 
                tick={{ fill: '#64748b', fontSize: 9 }} 
              />
              
              {/* Linha 1: Média da Liga (quando no modo liga) */}
              {isLeagueMode && (
                <Radar
                  name="Média da Liga"
                  dataKey="leagueScore"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )}

              {/* Linha Principal: Jogador Selecionado */}
              <Radar
                name={p1Name}
                dataKey={isLeagueMode ? "playerScore" : (p2Stats ? "p1Score" : "score")}
                stroke="#eab308"
                fill="#eab308"
                fillOpacity={0.4}
                strokeWidth={2.5}
              />

              {/* Linha Secundária: P2 (se duelo ativo) */}
              {p2Stats && (
                <Radar
                  name={p2Name}
                  dataKey="p2Score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              )}

              {/* Tooltip Especializado */}
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const itemData = payload[0].payload;
                    if (isLeagueMode) {
                      const isAbove = itemData.diffPct >= 0;
                      return (
                        <div className="bg-[#121214]/95 backdrop-blur-md border border-gray-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-2.5 z-50 min-w-[240px]">
                          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                            <span className="font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                              <TargetIcon size={13} className="text-amber-400" />
                              {itemData.attributeName || itemData.subject}
                            </span>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isAbove ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {isAbove ? `+${itemData.diffPct.toFixed(1)}%` : `${itemData.diffPct.toFixed(1)}%`} vs Liga
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-bold text-amber-400 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                                {p1Name}:
                              </span>
                              <span className="font-mono font-black text-white">
                                {itemData.playerRaw} <span className="text-[10px] text-gray-400">({itemData.playerScore}/100)</span>
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                              <span className="font-bold text-cyan-400 flex items-center gap-1">
                                <span className="w-2 h-0.5 bg-cyan-400 inline-block border-b border-dashed border-cyan-400" />
                                Média da Liga:
                              </span>
                              <span className="font-mono font-bold text-gray-300">
                                {itemData.leagueRaw} <span className="text-[10px] text-gray-400">(50/100)</span>
                              </span>
                            </div>
                          </div>
                          <p className="text-[9px] text-gray-500 pt-1 border-t border-white/5">{itemData.desc}</p>
                        </div>
                      );
                    }

                    // Tooltip modo equipe / duelo
                    return (
                      <div className="bg-[#0e0e11] border border-gray-700 p-3 rounded-xl shadow-2xl text-xs space-y-2 z-50">
                        <p className="font-black text-yellow-500 uppercase tracking-wider border-b border-white/10 pb-1">{itemData.subject}</p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-bold text-yellow-500">{p1Name}:</span>
                            <span className="font-mono font-black text-white">
                              {itemData.p1Score || itemData.score}/100 <span className="text-gray-400 font-normal">({itemData.p1Raw || itemData.raw})</span>
                            </span>
                          </div>
                          {p2Name && (
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-bold text-blue-400">{p2Name}:</span>
                              <span className="font-mono font-black text-white">
                                {itemData.p2Score}/100 <span className="text-gray-400 font-normal">({itemData.p2Raw})</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>

          {/* Legenda do Radar */}
          <div className="flex items-center gap-5 mt-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <span className="font-bold text-amber-300">{p1Name} (Atleta)</span>
            </div>

            {isLeagueMode ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 bg-cyan-400 border-b border-dashed border-cyan-400" />
                <span className="font-bold text-cyan-300">Média da Liga (Linha 50)</span>
              </div>
            ) : (
              p2Name && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  <span className="font-bold text-blue-300">{p2Name}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Breakdown de métricas no radar */}
        <div className="lg:col-span-6 space-y-3">
          {isLeagueMode ? (
            /* Cards Oficiais dos 4 Atributos vs Média da Liga */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {leagueRadarData.map((item, idx) => {
                const Icon = item.icon;
                const isAbove = item.diffPct >= 0;

                return (
                  <div key={idx} className="bg-black/40 hover:bg-black/60 p-3.5 rounded-2xl border border-white/5 hover:border-amber-500/20 transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg bg-white/5 ${item.color}`}>
                            <Icon size={15} />
                          </div>
                          <span className="text-xs font-black text-white uppercase italic tracking-wider">
                            {item.subject}
                          </span>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isAbove ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {isAbove ? `+${item.diffPct.toFixed(0)}%` : `${item.diffPct.toFixed(0)}%`}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between mt-1">
                        <div>
                          <span className="text-lg font-black text-white font-mono leading-none">
                            {item.playerRaw}
                          </span>
                          <span className="text-[9px] text-gray-500 uppercase tracking-wider block mt-0.5">
                            {item.attributeName}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-cyan-400 font-mono">
                            {item.leagueRaw}
                          </span>
                          <span className="text-[9px] text-gray-500 uppercase block">
                            Média da Liga
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Barra de Progresso Comparativa com Marcador Central da Média (50%) */}
                    <div className="mt-3 pt-2 border-t border-white/5">
                      <div className="relative w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                        {/* Marcador central da média da liga em 50% */}
                        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-cyan-400 z-10 opacity-70" title="Média da Liga (50%)" />
                        
                        <div 
                          className={`h-full bg-gradient-to-r ${item.barColor} rounded-full transition-all duration-700`}
                          style={{ width: `${Math.min(100, item.playerScore)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[8px] text-gray-500 font-mono mt-1">
                        <span>0%</span>
                        <span className="text-cyan-400 font-bold">Média (50%)</span>
                        <span>200%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Modo secundário: Contribuição na equipe (% do time) */
            <div className="space-y-2 bg-black/40 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Métricas de Contribuição no Time
                </span>
                <button 
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="text-[9px] text-yellow-500 hover:underline font-bold uppercase tracking-wider"
                >
                  {showExplanation ? 'Fechar Guia' : 'Como é calculado?'}
                </button>
              </div>

              {teamRadarData.map((item, idx) => {
                const v1 = item.p1Score || item.score;
                const v2 = item.p2Score;
                const p1Wins = v2 !== undefined && v1 > v2;
                const p2Wins = v2 !== undefined && v2 > v1;

                return (
                  <div key={idx} className="bg-black/60 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-black text-gray-300 uppercase italic">{item.subject}</span>
                      <div className="flex items-center gap-2 font-mono font-bold">
                        <span className={p1Wins ? 'text-yellow-400 font-black' : 'text-gray-300'}>
                          {v1} <span className="text-[9px] text-gray-500">({item.p1Raw || item.raw})</span>
                        </span>
                        {v2 !== undefined && (
                          <>
                            <span className="text-gray-600">vs</span>
                            <span className={p2Wins ? 'text-blue-400 font-black' : 'text-gray-300'}>
                              {v2} <span className="text-[9px] text-gray-500">({item.p2Raw})</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden flex">
                      {v2 === undefined ? (
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-700" 
                          style={{ width: `${v1}%` }}
                        ></div>
                      ) : (
                        <>
                          <div 
                            className={`h-full transition-all duration-700 ${p1Wins ? 'bg-yellow-500' : 'bg-yellow-500/50'}`} 
                            style={{ width: `${(v1 / (v1 + v2 || 1)) * 100}%` }}
                          ></div>
                          <div 
                            className={`h-full transition-all duration-700 ${p2Wins ? 'bg-blue-500' : 'bg-blue-500/50'}`} 
                            style={{ width: `${(v2 / (v1 + v2 || 1)) * 100}%` }}
                          ></div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Painel Explicativo / Guia do Gráfico Radar */}
      {showExplanation && (
        <div className="mt-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-300 space-y-6 bg-black/50 -mx-6 -mb-6 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-widest italic">
                  Como Funciona o Gráfico Radar (Atributos vs Média da Liga)?
                </h4>
                <p className="text-[10px] text-gray-400 font-medium">
                  Entenda como cada um dos 4 atributos oficiais é medido e comparado em relação aos padrões do campeonato.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowExplanation(false)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Grid de explicação dos 4 eixos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#121215] p-3.5 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-amber-400 uppercase italic flex items-center gap-1.5">
                  <Flame size={13} className="text-amber-500" /> Dano
                </span>
                <span className="text-[9px] font-mono font-bold text-cyan-400">Média: {leagueAverages.avgDmg}</span>
              </div>
              <p className="text-[10px] text-gray-400">
                Média de dano causado por partida disputada. Jogadores com polígono expandido neste eixo causam pressão contínua e desgaste elevado nos adversários.
              </p>
            </div>

            <div className="bg-[#121215] p-3.5 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-purple-400 uppercase italic flex items-center gap-1.5">
                  <Crosshair size={13} className="text-purple-400" /> HS (Precisão)
                </span>
                <span className="text-[9px] font-mono font-bold text-cyan-400">Média: {leagueAverages.avgHs}</span>
              </div>
              <p className="text-[10px] text-gray-400">
                Média de tiros na cabeça fatais por queda jogada (HS ÷ Partidas). Quanto maior este valor em relação à liga, maior a letalidade instantânea nos confrontos.
              </p>
            </div>

            <div className="bg-[#121215] p-3.5 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-emerald-400 uppercase italic flex items-center gap-1.5">
                  <Shield size={13} className="text-emerald-400" /> Sobrevivência
                </span>
                <span className="text-[9px] font-mono font-bold text-cyan-400">Média: {leagueAverages.avgKd}</span>
              </div>
              <p className="text-[10px] text-gray-400">
                Relação K/D (Abates ÷ Mortes) e tempo de sobrevida. Mede a capacidade do atleta de trocar dano com eficácia mantendo-se vivo para o final da queda.
              </p>
            </div>

            <div className="bg-[#121215] p-3.5 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-red-400 uppercase italic flex items-center gap-1.5">
                  <Zap size={13} className="text-red-400" /> Agressividade
                </span>
                <span className="text-[9px] font-mono font-bold text-cyan-400">Média: {leagueAverages.avgKpm}</span>
              </div>
              <p className="text-[10px] text-gray-400">
                KPM (Abates por minuto de jogo) e taxa de knockdowns. Indica a proatividade e a velocidade com que o atleta busca e resolve combates em mapa aberto.
              </p>
            </div>
          </div>

          {/* Dica de interpretação visual do polígono */}
          <div className="bg-black/60 p-4 rounded-2xl border border-white/5 space-y-2">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
              💡 Como Interpretar as Linhas do Radar
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px]">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-cyan-300 uppercase flex items-center gap-1">
                  Linha Ciano Pontilhada
                </span>
                <span className="text-gray-400">Representa o benchmark exato da Média da Liga (50 pts em todos os 4 eixos).</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-amber-300 uppercase flex items-center gap-1">
                  Polígono Dourado Acima da Linha
                </span>
                <span className="text-gray-400">Indica que o jogador supera a média da liga naquele atributo específico.</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-gray-400 uppercase flex items-center gap-1">
                  Polígono Dourado Abaixo da Linha
                </span>
                <span className="text-gray-400">Mostra atributos onde o jogador performa abaixo da média geral do campeonato.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerRadarChart;
