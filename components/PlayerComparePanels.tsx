import React, { useState, useMemo } from 'react';
import { 
  Crosshair, Flame, Shield, Target, Trophy, Award, Zap, Skull, 
  Swords, ArrowRightLeft, Percent, BarChart3, Filter, Search, Check, 
  Sparkles, Activity, Users, ChevronDown, ChevronUp, Layers, HelpCircle
} from 'lucide-react';
import { getWeaponInfo, WEAPON_CATEGORY_CONFIG } from '../utils/weaponUtils';

interface SideBySideMetricsPanelProps {
  p1: any;
  p2: any;
  onSwap?: () => void;
}

interface SideBySideWeaponsPanelProps {
  p1: any;
  p2: any;
  customWeapons?: any[];
}

// Utilitário para formatar números e porcentagens
const toNum = (val: any): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const parsed = parseFloat(String(val).replace(',', '.'));
  return isNaN(parsed) ? 0 : parsed;
};

// =========================================================================
// 1. PAINEL LADO A LADO: MÉTRICAS PRINCIPAIS
// =========================================================================
export const SideBySideMetricsPanel: React.FC<SideBySideMetricsPanelProps> = ({ p1, p2, onSwap }) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'combat' | 'efficiency' | 'consistency'>('all');

  if (!p1 || !p2) return null;

  // Cálculo de métricas derivadas seguras
  const p1Kills = toNum(p1.kills);
  const p2Kills = toNum(p2.kills);

  const p1Deaths = toNum(p1.deaths);
  const p2Deaths = toNum(p2.deaths);

  const p1Matches = toNum(p1.matches) || 1;
  const p2Matches = toNum(p2.matches) || 1;

  const p1Rounds = toNum(p1.uniqueRoundsCount) || 1;
  const p2Rounds = toNum(p2.uniqueRoundsCount) || 1;

  const p1Dmg = toNum(p1.damage);
  const p2Dmg = toNum(p2.damage);

  const p1AvgKills = toNum(p1.avg) || (p1Kills / p1Matches);
  const p2AvgKills = toNum(p2.avg) || (p2Kills / p2Matches);

  const p1AvgDmg = toNum(p1.avgDmg) || (p1Dmg / p1Matches);
  const p2AvgDmg = toNum(p2.avgDmg) || (p2Dmg / p2Matches);

  const p1AvgKillsRound = toNum(p1.avgKillsPerRound) || (p1Kills / p1Rounds);
  const p2AvgKillsRound = toNum(p2.avgKillsPerRound) || (p2Kills / p2Rounds);

  const p1AvgDmgRound = toNum(p1.avgDamagePerRound) || (p1Dmg / p1Rounds);
  const p2AvgDmgRound = toNum(p2.avgDamagePerRound) || (p2Dmg / p2Rounds);

  const p1Kd = toNum(p1.kdRatio || p1.kd) || (p1Deaths > 0 ? p1Kills / p1Deaths : p1Kills);
  const p2Kd = toNum(p2.kdRatio || p2.kd) || (p2Deaths > 0 ? p2Kills / p2Deaths : p2Kills);

  const p1Hs = toNum(p1.hs);
  const p2Hs = toNum(p2.hs);

  const p1HsRate = p1Kills > 0 ? (p1Hs / p1Kills) * 100 : 0;
  const p2HsRate = p2Kills > 0 ? (p2Hs / p2Kills) * 100 : 0;

  const p1Knocks = toNum(p1.knocks);
  const p2Knocks = toNum(p2.knocks);

  const p1AvgKnocks = p1Matches > 0 ? p1Knocks / p1Matches : 0;
  const p2AvgKnocks = p2Matches > 0 ? p2Knocks / p2Matches : 0;

  const p1Assists = toNum(p1.assists);
  const p2Assists = toNum(p2.assists);

  const p1Kpm = toNum(p1.kpm);
  const p2Kpm = toNum(p2.kpm);

  const p1WithKills = toNum(p1.withKillsPct);
  const p2WithKills = toNum(p2.withKillsPct);

  const p1ZeroKills = toNum(p1.zeroKillsPct);
  const p2ZeroKills = toNum(p2.zeroKillsPct);

  const p1Contribution = toNum(p1.killContributionPct);
  const p2Contribution = toNum(p2.killContributionPct);

  const p1Gelos = toNum(p1.gelos);
  const p2Gelos = toNum(p2.gelos);

  // Lista estruturada das métricas comparativas
  const metricsList = [
    {
      id: 'kills',
      name: 'Abates Totais',
      category: 'combat',
      icon: <Crosshair size={14} className="text-yellow-400" />,
      val1: p1Kills,
      val2: p2Kills,
      display1: p1Kills.toLocaleString('pt-BR'),
      display2: p2Kills.toLocaleString('pt-BR'),
      unit: 'kills',
      higherIsBetter: true
    },
    {
      id: 'avg_kills',
      name: 'Média de Abates / Queda',
      category: 'combat',
      icon: <Flame size={14} className="text-amber-400" />,
      val1: p1AvgKills,
      val2: p2AvgKills,
      display1: p1AvgKills.toFixed(2),
      display2: p2AvgKills.toFixed(2),
      unit: 'abates/pj',
      higherIsBetter: true
    },
    {
      id: 'avg_kills_rd',
      name: 'Abates por Rodada',
      category: 'combat',
      icon: <Target size={14} className="text-amber-400" />,
      val1: p1AvgKillsRound,
      val2: p2AvgKillsRound,
      display1: p1AvgKillsRound.toFixed(2),
      display2: p2AvgKillsRound.toFixed(2),
      unit: 'abates/rd',
      higherIsBetter: true
    },
    {
      id: 'kd',
      name: 'Rating K/D (Kills / Mortes)',
      category: 'efficiency',
      icon: <Trophy size={14} className="text-emerald-400" />,
      val1: p1Kd,
      val2: p2Kd,
      display1: p1Kd.toFixed(2),
      display2: p2Kd.toFixed(2),
      unit: 'ratio',
      higherIsBetter: true
    },
    {
      id: 'damage',
      name: 'Dano Total Causado',
      category: 'combat',
      icon: <Zap size={14} className="text-orange-400" />,
      val1: p1Dmg,
      val2: p2Dmg,
      display1: p1Dmg.toLocaleString('pt-BR'),
      display2: p2Dmg.toLocaleString('pt-BR'),
      unit: 'pts',
      higherIsBetter: true
    },
    {
      id: 'avg_dmg',
      name: 'Dano Médio / Queda',
      category: 'combat',
      icon: <Activity size={14} className="text-orange-400" />,
      val1: p1AvgDmg,
      val2: p2AvgDmg,
      display1: Math.round(p1AvgDmg).toLocaleString('pt-BR'),
      display2: Math.round(p2AvgDmg).toLocaleString('pt-BR'),
      unit: 'dmg/pj',
      higherIsBetter: true
    },
    {
      id: 'avg_dmg_rd',
      name: 'Dano Médio por Rodada',
      category: 'combat',
      icon: <Activity size={14} className="text-orange-400" />,
      val1: p1AvgDmgRound,
      val2: p2AvgDmgRound,
      display1: Math.round(p1AvgDmgRound).toLocaleString('pt-BR'),
      display2: Math.round(p2AvgDmgRound).toLocaleString('pt-BR'),
      unit: 'dmg/rd',
      higherIsBetter: true
    },
    {
      id: 'hs_rate',
      name: 'Taxa de Headshot (HS %)',
      category: 'efficiency',
      icon: <Sparkles size={14} className="text-purple-400" />,
      val1: p1HsRate,
      val2: p2HsRate,
      display1: `${p1HsRate.toFixed(1)}%`,
      display2: `${p2HsRate.toFixed(1)}%`,
      sub1: `${p1Hs} HS`,
      sub2: `${p2Hs} HS`,
      unit: '%',
      higherIsBetter: true
    },
    {
      id: 'knocks',
      name: 'Inimigos Deitados (Knocks)',
      category: 'combat',
      icon: <Skull size={14} className="text-red-400" />,
      val1: p1Knocks,
      val2: p2Knocks,
      display1: p1Knocks.toLocaleString('pt-BR'),
      display2: p2Knocks.toLocaleString('pt-BR'),
      sub1: `${p1AvgKnocks.toFixed(2)}/pj`,
      sub2: `${p2AvgKnocks.toFixed(2)}/pj`,
      unit: 'knocks',
      higherIsBetter: true
    },
    {
      id: 'assists',
      name: 'Assistências',
      category: 'consistency',
      icon: <Users size={14} className="text-blue-400" />,
      val1: p1Assists,
      val2: p2Assists,
      display1: p1Assists.toLocaleString('pt-BR'),
      display2: p2Assists.toLocaleString('pt-BR'),
      unit: 'ast',
      higherIsBetter: true
    },
    {
      id: 'kpm',
      name: 'Kills Por Minuto (KPM)',
      category: 'efficiency',
      icon: <Award size={14} className="text-cyan-400" />,
      val1: p1Kpm,
      val2: p2Kpm,
      display1: p1Kpm.toFixed(3),
      display2: p2Kpm.toFixed(3),
      unit: 'kpm',
      higherIsBetter: true
    },
    {
      id: 'consistency',
      name: 'Constância (% Quedas c/ Kill)',
      category: 'consistency',
      icon: <Shield size={14} className="text-emerald-400" />,
      val1: p1WithKills,
      val2: p2WithKills,
      display1: `${p1WithKills.toFixed(1)}%`,
      display2: `${p2WithKills.toFixed(1)}%`,
      unit: '%',
      higherIsBetter: true
    },
    {
      id: 'zero_kills',
      name: 'Taxa de Quedas Zeradas',
      category: 'consistency',
      icon: <HelpCircle size={14} className="text-rose-400" />,
      val1: p1ZeroKills,
      val2: p2ZeroKills,
      display1: `${p1ZeroKills.toFixed(1)}%`,
      display2: `${p2ZeroKills.toFixed(1)}%`,
      unit: '%',
      higherIsBetter: false // Menor taxa de zeros é melhor!
    },
    {
      id: 'contribution',
      name: 'Participação nas Kills da Equipe',
      category: 'efficiency',
      icon: <BarChart3 size={14} className="text-indigo-400" />,
      val1: p1Contribution,
      val2: p2Contribution,
      display1: `${p1Contribution.toFixed(1)}%`,
      display2: `${p2Contribution.toFixed(1)}%`,
      unit: '% do time',
      higherIsBetter: true
    },
    {
      id: 'gelos',
      name: 'Gelos Utilizados',
      category: 'consistency',
      icon: <Shield size={14} className="text-sky-400" />,
      val1: p1Gelos,
      val2: p2Gelos,
      display1: p1Gelos.toLocaleString('pt-BR'),
      display2: p2Gelos.toLocaleString('pt-BR'),
      unit: 'gelos',
      higherIsBetter: true
    },
    {
      id: 'matches',
      name: 'Volume de Quedas Disputadas',
      category: 'consistency',
      icon: <Layers size={14} className="text-gray-400" />,
      val1: p1Matches,
      val2: p2Matches,
      display1: `${p1Matches} Quedas`,
      display2: `${p2Matches} Quedas`,
      sub1: `${p1Rounds} Rodadas`,
      sub2: `${p2Rounds} Rodadas`,
      unit: 'partidas',
      higherIsBetter: true
    }
  ];

  // Contagem de vantagens
  let p1Wins = 0;
  let p2Wins = 0;
  metricsList.forEach(m => {
    if (m.val1 === m.val2) return;
    if (m.higherIsBetter) {
      if (m.val1 > m.val2) p1Wins++;
      else p2Wins++;
    } else {
      if (m.val1 < m.val2) p1Wins++;
      else p2Wins++;
    }
  });

  const filteredMetrics = metricsList.filter(m => {
    if (filterCategory === 'all') return true;
    return m.category === filterCategory;
  });

  return (
    <div className="bg-[#12141a]/95 rounded-[32px] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Header Superior: Título + Placar de Liderança + Troca rápida */}
      <div className="bg-gradient-to-r from-yellow-500/10 via-black/60 to-blue-500/10 p-6 md:p-8 border-b border-white/10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-yellow-500/15 border border-yellow-500/30 rounded-xl text-yellow-400">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-lg md:text-xl font-black text-white uppercase italic tracking-[0.15em]">
                Painel Lado a Lado: Métricas Principais
              </h3>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Comparativo direto e equilibrado entre {p1.name} e {p2.name}
            </p>
          </div>

          {/* Placar de Domínio / Vantagens */}
          <div className="flex items-center gap-3 bg-black/60 px-5 py-2.5 rounded-2xl border border-white/10">
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-yellow-500 block">{p1.name}</span>
              <span className="text-xl font-black text-yellow-400 italic leading-none">{p1Wins} vantagens</span>
            </div>
            <span className="text-xs font-black text-gray-600 px-1">VS</span>
            <div className="text-left">
              <span className="text-[10px] font-black uppercase text-blue-400 block">{p2.name}</span>
              <span className="text-xl font-black text-blue-400 italic leading-none">{p2Wins} vantagens</span>
            </div>

            {onSwap && (
              <button
                type="button"
                onClick={onSwap}
                title="Inverter lados dos desafiantes"
                className="ml-3 p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
              >
                <ArrowRightLeft size={14} />
                <span className="hidden sm:inline text-[10px] uppercase font-black">Inverter</span>
              </button>
            )}
          </div>
        </div>

        {/* Cabeçalho dos dois jogadores em destaque lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Jogador 1 (Amarelo) */}
          <div className="bg-black/50 p-4 rounded-2xl border border-yellow-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-black border-2 border-yellow-500/50 p-0.5 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-lg shadow-yellow-500/10">
                {p1.img || p1.playerImg ? (
                  <img src={p1.img || p1.playerImg} alt={p1.name} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                ) : (
                  <Crosshair size={22} className="text-yellow-500" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500 block">DESAFIANTE 1</span>
                <span className="text-lg font-black text-white uppercase italic truncate block leading-tight">{p1.name}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase truncate block">
                  {p1.team || 'Sem Equipe'} {p1.funcao ? `• ${p1.funcao}` : ''}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-2xl font-black text-yellow-400 italic block leading-none">{p1Kills}</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase">abates totais</span>
            </div>
          </div>

          {/* Jogador 2 (Azul) */}
          <div className="bg-black/50 p-4 rounded-2xl border border-blue-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-black border-2 border-blue-500/50 p-0.5 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-lg shadow-blue-500/10">
                {p2.img || p2.playerImg ? (
                  <img src={p2.img || p2.playerImg} alt={p2.name} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                ) : (
                  <Crosshair size={22} className="text-blue-400" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 block">DESAFIANTE 2</span>
                <span className="text-lg font-black text-white uppercase italic truncate block leading-tight">{p2.name}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase truncate block">
                  {p2.team || 'Sem Equipe'} {p2.funcao ? `• ${p2.funcao}` : ''}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-2xl font-black text-blue-400 italic block leading-none">{p2Kills}</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase">abates totais</span>
            </div>
          </div>
        </div>

        {/* Filtro de Categorias de Métricas */}
        <div className="flex items-center gap-1.5 mt-5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Todas as Métricas' },
            { id: 'combat', label: 'Combate & Abates' },
            { id: 'efficiency', label: 'Eficiência (K/D & HS)' },
            { id: 'consistency', label: 'Constância & Volume' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                filterCategory === tab.id
                  ? 'bg-white text-black shadow-md'
                  : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela Comparativa Lado a Lado */}
      <div className="p-4 md:p-6 space-y-3">
        {filteredMetrics.map((m) => {
          const isP1Better = m.val1 !== m.val2 && (m.higherIsBetter ? m.val1 > m.val2 : m.val1 < m.val2);
          const isP2Better = m.val1 !== m.val2 && (m.higherIsBetter ? m.val2 > m.val1 : m.val2 < m.val1);
          const isEqual = m.val1 === m.val2;

          // Proporção visual para barra comparativa
          const totalVal = Math.max(Math.abs(m.val1) + Math.abs(m.val2), 0.001);
          const p1Pct = Math.round((Math.abs(m.val1) / totalVal) * 100);
          const p2Pct = 100 - p1Pct;

          return (
            <div
              key={m.id}
              className="bg-black/40 p-3.5 md:p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
            >
              {/* Lado Esquerdo: Valor Jogador 1 */}
              <div className="flex items-center gap-2 min-w-[130px] md:w-44">
                <span className={`text-base md:text-lg font-black italic tracking-tight font-mono ${
                  isP1Better ? 'text-yellow-400 font-extrabold' : 'text-gray-400'
                }`}>
                  {m.display1}
                </span>
                {isP1Better && (
                  <span className="px-1.5 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[9px] font-black uppercase flex items-center gap-0.5">
                    <Check size={10} className="stroke-[3]" /> Top
                  </span>
                )}
                {m.sub1 && (
                  <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">({m.sub1})</span>
                )}
              </div>

              {/* Centro: Nome da Métrica + Barra Proporcional */}
              <div className="flex-1 px-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-black uppercase text-gray-300">
                    {m.icon}
                    <span>{m.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    {isEqual ? 'Empate' : isP1Better ? `+${p1.name}` : `+${p2.name}`}
                  </span>
                </div>

                {/* Barra de Distribuição Relativa */}
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex border border-white/5">
                  <div
                    className={`h-full transition-all duration-700 ${
                      isP1Better ? 'bg-yellow-500' : 'bg-yellow-500/40'
                    }`}
                    style={{ width: `${p1Pct}%` }}
                    title={`${p1.name}: ${p1Pct}%`}
                  />
                  <div
                    className={`h-full transition-all duration-700 ${
                      isP2Better ? 'bg-blue-400' : 'bg-blue-400/40'
                    }`}
                    style={{ width: `${p2Pct}%` }}
                    title={`${p2.name}: ${p2Pct}%`}
                  />
                </div>
              </div>

              {/* Lado Direito: Valor Jogador 2 */}
              <div className="flex items-center justify-end gap-2 min-w-[130px] md:w-44 text-right">
                {m.sub2 && (
                  <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">({m.sub2})</span>
                )}
                {isP2Better && (
                  <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-black uppercase flex items-center gap-0.5">
                    <Check size={10} className="stroke-[3]" /> Top
                  </span>
                )}
                <span className={`text-base md:text-lg font-black italic tracking-tight font-mono ${
                  isP2Better ? 'text-blue-400 font-extrabold' : 'text-gray-400'
                }`}>
                  {m.display2}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =========================================================================
// 2. PAINEL LADO A LADO: ARSENAL & PORCENTAGENS DE ARMAS
// =========================================================================
interface WeaponEntry {
  name: string;
  count: number;
  pctOfTotal: number;
  pctOfWeapons: number;
  info: ReturnType<typeof getWeaponInfo>;
}

export const SideBySideWeaponsPanel: React.FC<SideBySideWeaponsPanelProps> = ({ p1, p2, customWeapons }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [weaponSearch, setWeaponSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<'kills' | 'p1pct' | 'p2pct' | 'name'>('kills');

  if (!p1 || !p2) return null;

  const p1TotalKills = toNum(p1.kills) || 1;
  const p2TotalKills = toNum(p2.kills) || 1;

  // Normalização e extração segura das armas com porcentagens
  const p1WeaponsRaw: Array<{ name: string; count: number; img?: string }> = Array.isArray(p1.killerWeapons) ? p1.killerWeapons : [];
  const p2WeaponsRaw: Array<{ name: string; count: number; img?: string }> = Array.isArray(p2.killerWeapons) ? p2.killerWeapons : [];

  const p1TotalWeaponKills = p1WeaponsRaw.reduce((acc, w) => acc + (w.count || 0), 0);
  const p2TotalWeaponKills = p2WeaponsRaw.reduce((acc, w) => acc + (w.count || 0), 0);

  // Mapeamento enriquecido para P1
  const p1WeaponMap = useMemo(() => {
    const map = new Map<string, WeaponEntry>();

    p1WeaponsRaw.forEach(w => {
      if (!w.name) return;
      const key = w.name.trim().toUpperCase();
      const count = toNum(w.count);
      const info = getWeaponInfo(w.name, customWeapons);
      const pctOfTotal = p1TotalKills > 0 ? (count / p1TotalKills) * 100 : 0;
      const pctOfWeapons = p1TotalWeaponKills > 0 ? (count / p1TotalWeaponKills) * 100 : 0;

      map.set(key, {
        name: info.name || w.name,
        count,
        pctOfTotal,
        pctOfWeapons,
        info
      });
    });
    return map;
  }, [p1WeaponsRaw, p1TotalKills, p1TotalWeaponKills, customWeapons]);

  // Mapeamento enriquecido para P2
  const p2WeaponMap = useMemo(() => {
    const map = new Map<string, WeaponEntry>();

    p2WeaponsRaw.forEach(w => {
      if (!w.name) return;
      const key = w.name.trim().toUpperCase();
      const count = toNum(w.count);
      const info = getWeaponInfo(w.name, customWeapons);
      const pctOfTotal = p2TotalKills > 0 ? (count / p2TotalKills) * 100 : 0;
      const pctOfWeapons = p2TotalWeaponKills > 0 ? (count / p2TotalWeaponKills) * 100 : 0;

      map.set(key, {
        name: info.name || w.name,
        count,
        pctOfTotal,
        pctOfWeapons,
        info
      });
    });
    return map;
  }, [p2WeaponsRaw, p2TotalKills, p2TotalWeaponKills, customWeapons]);

  // Todas as armas distintas usadas por P1 OU P2
  const combinedWeaponsList = useMemo(() => {
    const allKeys = Array.from(new Set([...p1WeaponMap.keys(), ...p2WeaponMap.keys()]));

    return allKeys.map(key => {
      const data1 = p1WeaponMap.get(key);
      const data2 = p2WeaponMap.get(key);

      const info = data1?.info || data2?.info || getWeaponInfo(key, customWeapons);
      const count1 = data1?.count || 0;
      const count2 = data2?.count || 0;
      const pct1 = data1?.pctOfTotal || 0;
      const pct2 = data2?.pctOfTotal || 0;
      const totalCombinedKills = count1 + count2;

      return {
        key,
        name: info.name || key,
        tipo: info.tipo || 'OUTRAS',
        config: info.config,
        img: info.img || data1?.info.img || data2?.info.img,
        count1,
        count2,
        pct1,
        pct2,
        totalCombinedKills
      };
    });
  }, [p1WeaponMap, p2WeaponMap, customWeapons]);

  // Lista de Categorias distintas disponíveis
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    combinedWeaponsList.forEach(w => {
      if (w.tipo) cats.add(w.tipo);
    });
    return ['TODAS', ...Array.from(cats).sort()];
  }, [combinedWeaponsList]);

  // Filtragem e Ordenação
  const filteredCombined = useMemo(() => {
    return combinedWeaponsList.filter(w => {
      if (selectedCategory !== 'TODAS' && w.tipo !== selectedCategory) return false;
      if (weaponSearch.trim() && !w.name.toLowerCase().includes(weaponSearch.toLowerCase().trim())) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'kills') return b.totalCombinedKills - a.totalCombinedKills || b.count1 - a.count1;
      if (sortBy === 'p1pct') return b.pct1 - a.pct1 || b.count1 - a.count1;
      if (sortBy === 'p2pct') return b.pct2 - a.pct2 || b.count2 - a.count2;
      return a.name.localeCompare(b.name);
    });
  }, [combinedWeaponsList, selectedCategory, weaponSearch, sortBy]);

  // Listas individuais filtradas para o modo Cards
  const p1FilteredList: WeaponEntry[] = useMemo(() => {
    const list: WeaponEntry[] = Array.from(p1WeaponMap.values());
    return list.filter((w: WeaponEntry) => {
      if (selectedCategory !== 'TODAS' && w.info.tipo !== selectedCategory) return false;
      if (weaponSearch.trim() && !w.name.toLowerCase().includes(weaponSearch.toLowerCase().trim())) return false;
      return true;
    }).sort((a: WeaponEntry, b: WeaponEntry) => b.count - a.count || b.pctOfTotal - a.pctOfTotal);
  }, [p1WeaponMap, selectedCategory, weaponSearch]);

  const p2FilteredList: WeaponEntry[] = useMemo(() => {
    const list: WeaponEntry[] = Array.from(p2WeaponMap.values());
    return list.filter((w: WeaponEntry) => {
      if (selectedCategory !== 'TODAS' && w.info.tipo !== selectedCategory) return false;
      if (weaponSearch.trim() && !w.name.toLowerCase().includes(weaponSearch.toLowerCase().trim())) return false;
      return true;
    }).sort((a: WeaponEntry, b: WeaponEntry) => b.count - a.count || b.pctOfTotal - a.pctOfTotal);
  }, [p2WeaponMap, selectedCategory, weaponSearch]);

  // Arma favorita de cada jogador
  const p1TopWeapon: WeaponEntry | null = p1FilteredList[0] || null;
  const p2TopWeapon: WeaponEntry | null = p2FilteredList[0] || null;

  return (
    <div className="bg-[#12141a]/95 rounded-[32px] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl space-y-6">
      {/* Header Superior da Seção de Armas */}
      <div className="bg-gradient-to-r from-yellow-500/10 via-black/60 to-blue-500/10 p-6 md:p-8 border-b border-white/10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-yellow-500/15 border border-yellow-500/30 rounded-xl text-yellow-400">
                <Flame size={20} />
              </div>
              <h3 className="text-lg md:text-xl font-black text-white uppercase italic tracking-[0.15em]">
                Arsenal & Porcentagens de Armas Lado a Lado
              </h3>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Contagem de abates e porcentagem exata de kills com cada arma utilizada pelos atletas
            </p>
          </div>

          {/* Switch de Visualização: Tabela Comparativa vs Cards */}
          <div className="flex items-center bg-black/60 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                viewMode === 'table'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 size={14} />
              <span>Tabela Comparativa Direta</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                viewMode === 'cards'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers size={14} />
              <span>Cards Individuais</span>
            </button>
          </div>
        </div>

        {/* Resumo do Arsenal dos Dois Atletas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* P1 Resumo */}
          <div className="bg-black/50 p-4 rounded-2xl border border-yellow-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-black border border-yellow-500/40 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {p1TopWeapon?.info.img ? (
                  <img src={p1TopWeapon.info.img} alt={p1TopWeapon.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <Flame size={18} className="text-yellow-500" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase text-yellow-500 tracking-wider block">ARMA FAVORITA DE {p1.name}</span>
                <span className="text-base font-black text-white uppercase italic truncate block">
                  {p1TopWeapon ? p1TopWeapon.name : 'N/A'}
                </span>
                <span className="text-[10px] text-gray-400 font-bold block">
                  {p1TopWeapon ? `${p1TopWeapon.count} abates (${p1TopWeapon.pctOfTotal.toFixed(1)}% do total)` : 'Sem dados'}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-lg font-black text-yellow-400 italic block">{p1WeaponsRaw.length}</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase">armas distintas</span>
            </div>
          </div>

          {/* P2 Resumo */}
          <div className="bg-black/50 p-4 rounded-2xl border border-blue-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-black border border-blue-500/40 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {p2TopWeapon?.info.img ? (
                  <img src={p2TopWeapon.info.img} alt={p2TopWeapon.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <Flame size={18} className="text-blue-400" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider block">ARMA FAVORITA DE {p2.name}</span>
                <span className="text-base font-black text-white uppercase italic truncate block">
                  {p2TopWeapon ? p2TopWeapon.name : 'N/A'}
                </span>
                <span className="text-[10px] text-gray-400 font-bold block">
                  {p2TopWeapon ? `${p2TopWeapon.count} abates (${p2TopWeapon.pctOfTotal.toFixed(1)}% do total)` : 'Sem dados'}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-lg font-black text-blue-400 italic block">{p2WeaponsRaw.length}</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase">armas distintas</span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Busca de Armas */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 pt-5 border-t border-white/5">
          {/* Categorias */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1">
            {availableCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-yellow-500 text-black shadow-md'
                    : 'bg-black/50 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Busca e Ordenação */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[160px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar arma..."
                value={weaponSearch}
                onChange={(e) => setWeaponSearch(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white uppercase placeholder-gray-600 focus:border-yellow-500 focus:outline-none"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-300 uppercase focus:border-yellow-500 focus:outline-none"
            >
              <option value="kills">Mais Kills Totais</option>
              <option value="p1pct">Maior % {p1.name}</option>
              <option value="p2pct">Maior % {p2.name}</option>
              <option value="name">Nome (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conteúdo: Tabela Comparativa Direta */}
      {viewMode === 'table' && (
        <div className="p-4 md:p-6 space-y-3">
          {filteredCombined.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs font-bold uppercase tracking-wider">
              Nenhuma arma encontrada com os filtros selecionados
            </div>
          ) : (
            filteredCombined.map((w) => {
              const isP1Ahead = w.count1 > w.count2;
              const isP2Ahead = w.count2 > w.count1;
              const isP1PctAhead = w.pct1 > w.pct2;
              const isP2PctAhead = w.pct2 > w.pct1;
              const isEqual = w.count1 === w.count2;

              const totalKillsWeapon = Math.max(w.count1 + w.count2, 1);
              const barP1 = Math.round((w.count1 / totalKillsWeapon) * 100);
              const barP2 = 100 - barP1;

              return (
                <div
                  key={w.key}
                  className="bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-white/15 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Desafiante 1: Kills e Porcentagem */}
                  <div className="flex items-center gap-3 min-w-[170px] md:w-56">
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className={`text-base md:text-lg font-black italic tracking-tight font-mono ${
                          isP1Ahead ? 'text-yellow-400 font-extrabold' : 'text-gray-300'
                        }`}>
                          {w.count1} <span className="text-xs font-normal text-gray-500">abates</span>
                        </span>
                        {isP1Ahead && (
                          <span className="px-1.5 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[8px] font-black uppercase">
                            +{w.count1 - w.count2}
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] font-black tracking-wide block ${
                        isP1PctAhead ? 'text-yellow-300' : 'text-gray-400'
                      }`}>
                        {w.pct1.toFixed(1)}% <span className="text-[9px] text-gray-500 font-normal">das kills de {p1.name}</span>
                      </span>
                    </div>
                  </div>

                  {/* Centro: Arma + Categoria + Barra Comparativa */}
                  <div className="flex-1 px-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-9 rounded-xl bg-black border border-white/10 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {w.img ? (
                            <img src={w.img} alt={w.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <Crosshair size={16} className="text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white uppercase italic tracking-wide">{w.name}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${w.config?.bg || 'bg-white/5'} ${w.config?.text || 'text-gray-300'} ${w.config?.border || 'border-white/10'}`}>
                              {w.tipo}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Total: <strong className="text-white font-mono">{w.totalCombinedKills}</strong> abates
                        </span>
                      </div>
                    </div>

                    {/* Barra Relativa de Domínio com a Arma */}
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex border border-white/5">
                      <div
                        className={`h-full transition-all duration-700 ${
                          isP1Ahead ? 'bg-yellow-500' : 'bg-yellow-500/40'
                        }`}
                        style={{ width: `${w.totalCombinedKills > 0 ? barP1 : 50}%` }}
                        title={`${p1.name}: ${w.count1} kills (${barP1}%)`}
                      />
                      <div
                        className={`h-full transition-all duration-700 ${
                          isP2Ahead ? 'bg-blue-400' : 'bg-blue-400/40'
                        }`}
                        style={{ width: `${w.totalCombinedKills > 0 ? barP2 : 50}%` }}
                        title={`${p2.name}: ${w.count2} kills (${barP2}%)`}
                      />
                    </div>
                  </div>

                  {/* Desafiante 2: Kills e Porcentagem */}
                  <div className="flex items-center justify-end gap-3 min-w-[170px] md:w-56 text-right">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isP2Ahead && (
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[8px] font-black uppercase">
                            +{w.count2 - w.count1}
                          </span>
                        )}
                        <span className={`text-base md:text-lg font-black italic tracking-tight font-mono ${
                          isP2Ahead ? 'text-blue-400 font-extrabold' : 'text-gray-300'
                        }`}>
                          {w.count2} <span className="text-xs font-normal text-gray-500">abates</span>
                        </span>
                      </div>
                      <span className={`text-[11px] font-black tracking-wide block ${
                        isP2PctAhead ? 'text-blue-300' : 'text-gray-400'
                      }`}>
                        {w.pct2.toFixed(1)}% <span className="text-[9px] text-gray-500 font-normal">das kills de {p2.name}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Conteúdo: Cards Individuais Lado a Lado */}
      {viewMode === 'cards' && (
        <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna P1 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-yellow-500/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider">
                  Arsenal de {p1.name}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  ({p1FilteredList.length} armas)
                </span>
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase">
                {p1TotalKills} abates totais
              </span>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
              {p1FilteredList.length === 0 ? (
                <div className="text-center py-10 text-gray-600 text-xs font-bold uppercase">Nenhuma arma cadastrada</div>
              ) : (
                p1FilteredList.map((w, idx) => (
                  <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 hover:border-yellow-500/30 transition-all flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xs font-black text-gray-600 w-5 text-center">#{idx + 1}</span>
                      <div className="w-10 h-9 rounded-xl bg-black border border-yellow-500/20 overflow-hidden flex items-center justify-center p-1 flex-shrink-0">
                        {w.info.img ? (
                          <img src={w.info.img} alt={w.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <Crosshair size={14} className="text-yellow-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white uppercase italic truncate block">{w.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[7px] font-black uppercase border ${w.info.config?.bg} ${w.info.config?.text} ${w.info.config?.border}`}>
                            {w.info.tipo}
                          </span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
                          <div className="bg-yellow-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, w.pctOfTotal * 2)}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 min-w-[70px]">
                      <span className="text-sm font-black text-yellow-400 italic block leading-none">{w.count} abates</span>
                      <span className="text-[10px] font-black text-yellow-500/90 block mt-0.5">{w.pctOfTotal.toFixed(1)}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Coluna P2 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-blue-500/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider">
                  Arsenal de {p2.name}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  ({p2FilteredList.length} armas)
                </span>
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase">
                {p2TotalKills} abates totais
              </span>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
              {p2FilteredList.length === 0 ? (
                <div className="text-center py-10 text-gray-600 text-xs font-bold uppercase">Nenhuma arma cadastrada</div>
              ) : (
                p2FilteredList.map((w, idx) => (
                  <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xs font-black text-gray-600 w-5 text-center">#{idx + 1}</span>
                      <div className="w-10 h-9 rounded-xl bg-black border border-blue-500/20 overflow-hidden flex items-center justify-center p-1 flex-shrink-0">
                        {w.info.img ? (
                          <img src={w.info.img} alt={w.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <Crosshair size={14} className="text-blue-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white uppercase italic truncate block">{w.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[7px] font-black uppercase border ${w.info.config?.bg} ${w.info.config?.text} ${w.info.config?.border}`}>
                            {w.info.tipo}
                          </span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
                          <div className="bg-blue-400 h-full rounded-full transition-all" style={{ width: `${Math.min(100, w.pctOfTotal * 2)}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 min-w-[70px]">
                      <span className="text-sm font-black text-blue-400 italic block leading-none">{w.count} abates</span>
                      <span className="text-[10px] font-black text-blue-300 block mt-0.5">{w.pctOfTotal.toFixed(1)}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
