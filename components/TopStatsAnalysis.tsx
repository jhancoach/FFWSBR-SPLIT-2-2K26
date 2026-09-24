import React, { useState, useMemo } from 'react';
import { 
  Trophy, Crown, Skull, Flame, Target, Crosshair, Zap, Users, Shield, 
  ShieldAlert, Activity, Scale, BarChart2, CheckCircle2, MapPin, Search, 
  ArrowLeft, ChevronRight, ChevronLeft, LayoutGrid, Award, ArrowUpRight,
  Sparkles, ExternalLink, Filter, X, Globe, ListOrdered, Hash, TrendingUp
} from 'lucide-react';

export interface StatMetricDefinition {
  id: string;
  label: string;
  shortLabel: string;
  category: 'Combate' | 'Dano & Precisão' | 'Knockdowns & MVPs' | 'Suporte & Utilidade' | 'Safes';
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  accentBg: string;
  barColor: string;
  getValue: (p: any) => number;
  formatValue: (p: any) => string;
  subDetail: (p: any) => string;
  unit: string;
}

interface TopStatsAnalysisProps {
  rankingData: any[];
  onSelectPlayer: (playerName: string) => void;
  allSafeNames?: string[];
}

export const TopStatsAnalysis: React.FC<TopStatsAnalysisProps> = ({
  rankingData,
  onSelectPlayer,
  allSafeNames = []
}) => {
  const [selectedMetricId, setSelectedMetricId] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rankingScope, setRankingScope] = useState<'top10' | 'general'>('top10');
  const [playerTableSearch, setPlayerTableSearch] = useState<string>('');

  // Lista completa e oficial de todas as estatísticas do Ranking Geral
  const metricsList = useMemo<StatMetricDefinition[]>(() => {
    const baseList: StatMetricDefinition[] = [
      // --- COMBATE ---
      {
        id: 'kills',
        label: 'Abates Totais (Kills)',
        shortLabel: 'Abates (K)',
        category: 'Combate',
        description: 'Total acumulado de eliminações confirmadas pelo atleta',
        icon: Skull,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        accentBg: 'from-red-500/20 via-red-500/5 to-transparent',
        barColor: 'bg-red-500',
        getValue: (p) => p.kills || 0,
        formatValue: (p) => `${p.kills} Kills`,
        subDetail: (p) => `Média ${p.avg}/Q • ${p.killContributionPct}% time`,
        unit: 'Kills'
      },
      {
        id: 'diff',
        label: 'Saldo de Abates (Diff / S)',
        shortLabel: 'Saldo (Diff)',
        category: 'Combate',
        description: 'Diferença entre abates totais e partidas disputadas (Abates - Quedas)',
        icon: Scale,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        accentBg: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
        barColor: 'bg-emerald-500',
        getValue: (p) => p.diff || 0,
        formatValue: (p) => `${p.diff > 0 ? '+' + p.diff : p.diff} Saldo`,
        subDetail: (p) => `${p.kills} Kills em ${p.matches} Partidas`,
        unit: 'Saldo'
      },
      {
        id: 'killContributionPct',
        label: '% de Contribuição nos Abates (% C)',
        shortLabel: '% Contribuição',
        category: 'Combate',
        description: 'Fatia percentual de abates do atleta em relação ao total de abates da equipe',
        icon: BarChart2,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        accentBg: 'from-blue-500/20 via-blue-500/5 to-transparent',
        barColor: 'bg-blue-500',
        getValue: (p) => parseFloat(p.killContributionPct) || 0,
        formatValue: (p) => `${p.killContributionPct}%`,
        subDetail: (p) => `${p.kills} do total de ${p.teamTotalKills} da equipe`,
        unit: '%'
      },
      {
        id: 'avg',
        label: 'Média de Abates por Queda (AVG K)',
        shortLabel: 'Média Kills',
        category: 'Combate',
        description: 'Média de abates realizados por queda (partida) jogada',
        icon: Target,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        accentBg: 'from-yellow-500/20 via-yellow-500/5 to-transparent',
        barColor: 'bg-yellow-500',
        getValue: (p) => parseFloat(p.avg) || 0,
        formatValue: (p) => `${p.avg} K/Q`,
        subDetail: (p) => `${p.kills} Kills em ${p.matches} Partidas`,
        unit: 'K/Q'
      },
      {
        id: 'kpm',
        label: 'Kills Por Minuto (KPM Geral)',
        shortLabel: 'KPM Geral',
        category: 'Combate',
        description: 'Frequência de eliminações por minuto ativo de sobrevivência nas safes',
        icon: Flame,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        accentBg: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
        barColor: 'bg-emerald-500',
        getValue: (p) => p.kpm || 0,
        formatValue: (p) => `${p.kpm} KPM`,
        subDetail: (p) => `Velocidade e ritmo de eliminação`,
        unit: 'KPM'
      },
      {
        id: 'withKills',
        label: 'Quedas com Abate (Q. C/ KILL)',
        shortLabel: 'Quedas c/ Kill',
        category: 'Combate',
        description: 'Índice de consistência: número de partidas onde o atleta fez ao menos 1 kill',
        icon: CheckCircle2,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        accentBg: 'from-green-500/20 via-green-500/5 to-transparent',
        barColor: 'bg-green-500',
        getValue: (p) => p.withKills || 0,
        formatValue: (p) => `${p.withKills} Quedas (${p.withKillsPct}%)`,
        subDetail: (p) => `De ${p.matches} partidas disputadas`,
        unit: 'Quedas'
      },
      {
        id: 'zeroKills',
        label: 'Quedas Zeradas (Q. ZERO)',
        shortLabel: 'Quedas Zeradas',
        category: 'Combate',
        description: 'Quantidade de quedas disputadas sem conseguir realizar abates',
        icon: Skull,
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/30',
        accentBg: 'from-rose-500/20 via-rose-500/5 to-transparent',
        barColor: 'bg-rose-500',
        getValue: (p) => p.zeroKills || 0,
        formatValue: (p) => `${p.zeroKills} Zeradas (${p.zeroKillsPct}%)`,
        subDetail: (p) => `De ${p.matches} partidas disputadas`,
        unit: 'Quedas'
      },

      // --- DANO & PRECISÃO ---
      {
        id: 'damage',
        label: 'Dano Total Infligido (DMG)',
        shortLabel: 'Dano Total',
        category: 'Dano & Precisão',
        description: 'Quantidade total de dano infligido contra adversários na competição',
        icon: Flame,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        accentBg: 'from-orange-500/20 via-orange-500/5 to-transparent',
        barColor: 'bg-orange-500',
        getValue: (p) => p.damage || 0,
        formatValue: (p) => `${p.damage.toLocaleString()} Dano`,
        subDetail: (p) => `Média de ${p.avgDmg} Dano/Q em ${p.matches} Partidas`,
        unit: 'Dano'
      },
      {
        id: 'avgDmg',
        label: 'Média de Dano por Queda (AVG D)',
        shortLabel: 'Média Dano',
        category: 'Dano & Precisão',
        description: 'Média de dano infligido por queda (partida) disputada',
        icon: Flame,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        accentBg: 'from-amber-500/20 via-amber-500/5 to-transparent',
        barColor: 'bg-amber-500',
        getValue: (p) => parseFloat(p.avgDmg) || 0,
        formatValue: (p) => `${p.avgDmg} Dano/Q`,
        subDetail: (p) => `${p.damage.toLocaleString()} Dano Total em ${p.matches} Quedas`,
        unit: 'Dano/Q'
      },
      {
        id: 'hs',
        label: 'Headshots Totais (HS)',
        shortLabel: 'Headshots (HS)',
        category: 'Dano & Precisão',
        description: 'Quantidade total de abates concluídos com tiro na cabeça',
        icon: Crosshair,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        accentBg: 'from-purple-500/20 via-purple-500/5 to-transparent',
        barColor: 'bg-purple-500',
        getValue: (p) => p.hs || 0,
        formatValue: (p) => `${p.hs} HS`,
        subDetail: (p) => `Média de ${p.avgHs} HS/Q em ${p.matches} Partidas`,
        unit: 'HS'
      },
      {
        id: 'avgHs',
        label: 'Média de Headshots (AVG HS)',
        shortLabel: 'Média HS',
        category: 'Dano & Precisão',
        description: 'Média de headshots por queda (HS dividida por partidas jogadas)',
        icon: Crosshair,
        color: 'text-purple-300',
        bgColor: 'bg-purple-500/15',
        borderColor: 'border-purple-400/30',
        accentBg: 'from-purple-600/20 via-purple-500/5 to-transparent',
        barColor: 'bg-purple-400',
        getValue: (p) => parseFloat(p.avgHs) || 0,
        formatValue: (p) => `${p.avgHs} HS/Q`,
        subDetail: (p) => `${p.hs} Headshots em ${p.matches} Partidas`,
        unit: 'HS/Q'
      },

      // --- KNOCKDOWNS & MVPS ---
      {
        id: 'knocks',
        label: 'Inimigos Deitados (KNK)',
        shortLabel: 'Deitados (Knocks)',
        category: 'Knockdowns & MVPs',
        description: 'Quantidade de inimigos derrubados durante as trocas de tiro',
        icon: Zap,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        accentBg: 'from-amber-500/20 via-amber-500/5 to-transparent',
        barColor: 'bg-amber-500',
        getValue: (p) => p.knocks || 0,
        formatValue: (p) => `${p.knocks} Deitados`,
        subDetail: (p) => `Média de ${p.avgKnocks} KNK/Q • ${p.kills} finalizados`,
        unit: 'Deitados'
      },
      {
        id: 'avgKnocks',
        label: 'Média de Deitados por Queda (AVG KNK)',
        shortLabel: 'Média Deitados',
        category: 'Knockdowns & MVPs',
        description: 'Média de oponentes derrubados por queda disputada',
        icon: Zap,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        accentBg: 'from-yellow-500/20 via-yellow-500/5 to-transparent',
        barColor: 'bg-yellow-500',
        getValue: (p) => parseFloat(p.avgKnocks) || 0,
        formatValue: (p) => `${p.avgKnocks} KNK/Q`,
        subDetail: (p) => `${p.knocks} Deitados em ${p.matches} Partidas`,
        unit: 'KNK/Q'
      },
      {
        id: 'mvp',
        label: 'Most Valuable Player (MVP)',
        shortLabel: 'MVPs',
        category: 'Knockdowns & MVPs',
        description: 'Quantidade de vezes em que o jogador foi o destaque da queda',
        icon: Crown,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        accentBg: 'from-yellow-500/20 via-yellow-500/5 to-transparent',
        barColor: 'bg-yellow-500',
        getValue: (p) => p.mvp || 0,
        formatValue: (p) => `${p.mvp} MVPs`,
        subDetail: (p) => `Em ${p.matches} partidas oficiais disputadas`,
        unit: 'MVPs'
      },

      // --- SUPORTE & UTILIDADE ---
      {
        id: 'assists',
        label: 'Assistências (AST)',
        shortLabel: 'Assistências',
        category: 'Suporte & Utilidade',
        description: 'Assistências em eliminações colaborando com o squad',
        icon: Users,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        accentBg: 'from-blue-500/20 via-blue-500/5 to-transparent',
        barColor: 'bg-blue-500',
        getValue: (p) => p.assists || 0,
        formatValue: (p) => `${p.assists} Assist.`,
        subDetail: (p) => `Média de ${(p.matches > 0 ? (p.assists / p.matches).toFixed(2) : 0)} AST/Q`,
        unit: 'AST'
      },
      {
        id: 'matches',
        label: 'Partidas Oficiais Jogadas (PJ)',
        shortLabel: 'Partidas (PJ)',
        category: 'Suporte & Utilidade',
        description: 'Total de quedas oficiais disputadas na competição',
        icon: Activity,
        color: 'text-slate-300',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        accentBg: 'from-slate-500/20 via-slate-500/5 to-transparent',
        barColor: 'bg-slate-400',
        getValue: (p) => p.matches || 0,
        formatValue: (p) => `${p.matches} Partidas`,
        subDetail: (p) => `Presença em quedas oficiais`,
        unit: 'Partidas'
      },
      {
        id: 'gelos',
        label: 'Paredes de Gelo Colocadas (GLO)',
        shortLabel: 'Gelos Usados',
        category: 'Suporte & Utilidade',
        description: 'Total de paredes de gelo erguidas para defesa tática e avanço',
        icon: Shield,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
        accentBg: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
        barColor: 'bg-cyan-500',
        getValue: (p) => p.gelos || 0,
        formatValue: (p) => `${p.gelos} Gelos`,
        subDetail: (p) => `Média de ${(p.matches > 0 ? (p.gelos / p.matches).toFixed(1) : 0)} Gelos/Q`,
        unit: 'Gelos'
      },
      {
        id: 'gelosDestruidos',
        label: 'Paredes de Gelo Destruídas (DES)',
        shortLabel: 'Gelos Quebrados',
        category: 'Suporte & Utilidade',
        description: 'Paredes de gelo adversárias quebradas por disparos',
        icon: ShieldAlert,
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/30',
        accentBg: 'from-pink-500/20 via-pink-500/5 to-transparent',
        barColor: 'bg-pink-500',
        getValue: (p) => p.gelosDestruidos || 0,
        formatValue: (p) => `${p.gelosDestruidos} Destruídos`,
        subDetail: (p) => `Pressão e quebra de cobertura inimiga`,
        unit: 'Gelos'
      },
      {
        id: 'reviveu',
        label: 'Reviveu no Sistema (REV)',
        shortLabel: 'Reviveu (REV)',
        category: 'Suporte & Utilidade',
        description: 'Vezes em que utilizou o sistema do jogo para reviver companheiros',
        icon: Activity,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        accentBg: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
        barColor: 'bg-emerald-500',
        getValue: (p) => p.reviveu || 0,
        formatValue: (p) => `${p.reviveu} Revives`,
        subDetail: (p) => `Resgates no sistema de renascimento`,
        unit: 'Revives'
      },
      {
        id: 'aliadosRevividos',
        label: 'Aliados Levantados (ALR)',
        shortLabel: 'Aliados Levantados',
        category: 'Suporte & Utilidade',
        description: 'Vezes em que levantou aliados caídos (deitados) no campo',
        icon: Users,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        accentBg: 'from-green-500/20 via-green-500/5 to-transparent',
        barColor: 'bg-green-500',
        getValue: (p) => p.aliadosRevividos || 0,
        formatValue: (p) => `${p.aliadosRevividos} Levantados`,
        subDetail: (p) => `Salvamentos imediatos em combate`,
        unit: 'Levantados'
      },

      // --- SAFES ---
      {
        id: 'totalSafeKills',
        label: 'Abates Totais em Safes (TOT S)',
        shortLabel: 'Abates em Safes',
        category: 'Safes',
        description: 'Total acumulado de eliminações dentro de qualquer círculo de safe zone',
        icon: MapPin,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        accentBg: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
        barColor: 'bg-emerald-500',
        getValue: (p) => p.totalSafeKills || 0,
        formatValue: (p) => `${p.totalSafeKills} Safes`,
        subDetail: (p) => `Abates posicionados dentro de círculos`,
        unit: 'Safes'
      }
    ];

    // Safes específicas dinâmicas se houver
    allSafeNames.forEach(s => {
      const sUpper = s.toUpperCase();
      const safeLabel = sUpper === 'OUT' ? 'Fora de Safe (OUT)' : sUpper.startsWith('S') ? `Safe ${sUpper}` : `Safe ${s}`;
      baseList.push({
        id: `safe_${s}`,
        label: `Abates na ${safeLabel}`,
        shortLabel: safeLabel,
        category: 'Safes',
        description: `Eliminações efetuadas exclusivamente durante a ${safeLabel}`,
        icon: MapPin,
        color: 'text-emerald-300',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        accentBg: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
        barColor: 'bg-emerald-400',
        getValue: (p) => p.safeKills?.[s] || p[`safe_${s}`] || 0,
        formatValue: (p) => `${p.safeKills?.[s] || p[`safe_${s}`] || 0} Abates`,
        subDetail: (p) => `Abates registrados na ${safeLabel}`,
        unit: 'Abates'
      });
    });

    return baseList;
  }, [allSafeNames]);

  // Lista dinâmica de Funções extraídas dos atletas
  const availableRoles = useMemo(() => {
    const rolesMap = new Map<string, number>();
    rankingData.forEach(p => {
      const r1 = (p.funcao || '').trim().toUpperCase();
      const r2 = (p.funcao2 || '').trim().toUpperCase();
      if (r1 && r1 !== 'N/A') {
        rolesMap.set(r1, (rolesMap.get(r1) || 0) + 1);
      }
      if (r2 && r2 !== 'N/A' && r2 !== r1) {
        rolesMap.set(r2, (rolesMap.get(r2) || 0) + 1);
      }
    });

    const standardOrder = ['CPT', 'RUSH', 'SUPORTE', 'GRANADEIRO'];
    const keys = Array.from(rolesMap.keys()).sort((a, b) => {
      const idxA = standardOrder.indexOf(a);
      const idxB = standardOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return keys.map(role => ({
      role,
      count: rolesMap.get(role) || 0
    }));
  }, [rankingData]);

  // Atletas filtrados pela Função selecionada
  const filteredRankingDataByRole = useMemo(() => {
    if (roleFilter === 'all') return rankingData;
    const target = roleFilter.trim().toUpperCase();
    return rankingData.filter(p => {
      const r1 = (p.funcao || '').trim().toUpperCase();
      const r2 = (p.funcao2 || '').trim().toUpperCase();
      return r1 === target || r2 === target;
    });
  }, [rankingData, roleFilter]);

  const categories = useMemo(() => {
    return ['all', 'Combate', 'Dano & Precisão', 'Knockdowns & MVPs', 'Suporte & Utilidade', 'Safes'];
  }, []);

  // Filtra métricas pela categoria e pela busca
  const filteredMetrics = useMemo(() => {
    return metricsList.filter(m => {
      if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.label.toLowerCase().includes(q) ||
          m.shortLabel.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [metricsList, categoryFilter, searchQuery]);

  // Função auxiliar para calcular o ranking (Top 10 ou Geral) de qualquer métrica considerando a função
  const getRankedPlayers = (metric: StatMetricDefinition, scope: 'top10' | 'general' = 'top10') => {
    const sorted = [...filteredRankingDataByRole]
      .sort((a, b) => {
        const valA = metric.getValue(a);
        const valB = metric.getValue(b);
        const diff = valB - valA;
        if (diff !== 0) return diff;
        // Critérios de desempate oficiais
        const dmgDiff = (b.damage || 0) - (a.damage || 0);
        if (dmgDiff !== 0) return dmgDiff;
        return (b.kills || 0) - (a.kills || 0);
      });

    if (scope === 'top10') {
      return sorted.slice(0, 10);
    }
    return sorted;
  };

  const getTop10 = (metric: StatMetricDefinition) => getRankedPlayers(metric, 'top10');
  const getGeneral = (metric: StatMetricDefinition) => getRankedPlayers(metric, 'general');

  // Cálculo das estatísticas gerais da métrica (Totais, Médias, Quebras por Função e Líder da Liga)
  const getMetricSummary = (metric: StatMetricDefinition) => {
    let sum = 0;
    let count = 0;
    let leaderVal = -Infinity;
    let leaderPlayer: any = null;
    let positiveCount = 0;

    const values: number[] = [];

    filteredRankingDataByRole.forEach(p => {
      const val = metric.getValue(p);
      if (typeof val === 'number' && !isNaN(val)) {
        sum += val;
        count++;
        values.push(val);
        if (val > 0) positiveCount++;
        if (val > leaderVal || leaderPlayer === null) {
          leaderVal = val;
          leaderPlayer = p;
        }
      }
    });

    const avg = count > 0 ? sum / count : 0;
    const isRate = ['avg', 'kpm', 'avgDmg', 'avgHs', 'avgKnocks', 'killContributionPct', 'withKillsPct', 'zeroKillsPct'].includes(metric.id);

    // Média por Função para esta métrica
    const standardRoles = ['CPT', 'RUSH', 'SUPORTE', 'GRANADEIRO'];
    const roleBreakdown = standardRoles.map(r => {
      const target = r.toUpperCase();
      const playersInRole = rankingData.filter(p => {
        const r1 = (p.funcao || '').trim().toUpperCase();
        const r2 = (p.funcao2 || '').trim().toUpperCase();
        return r1 === target || r2 === target;
      });

      let rSum = 0;
      let rCount = 0;
      playersInRole.forEach(p => {
        const v = metric.getValue(p);
        if (typeof v === 'number' && !isNaN(v)) {
          rSum += v;
          rCount++;
        }
      });

      const rAvg = rCount > 0 ? rSum / rCount : 0;
      return {
        role: r,
        avg: rAvg.toFixed(2),
        count: rCount,
        total: rSum >= 1000 ? rSum.toLocaleString('pt-BR') : rSum.toFixed(rSum % 1 === 0 ? 0 : 2)
      };
    });

    let formattedTotal = '';
    if (metric.id.includes('Pct')) {
      formattedTotal = `${avg.toFixed(1)}%`;
    } else if (isRate) {
      formattedTotal = avg.toFixed(2);
    } else {
      formattedTotal = sum >= 1000 ? sum.toLocaleString('pt-BR') : sum.toFixed(sum % 1 === 0 ? 0 : 2);
    }

    return {
      total: formattedTotal,
      rawSum: sum,
      avg: avg.toFixed(2),
      leaderVal: leaderVal === -Infinity ? 0 : leaderVal,
      leaderPlayer,
      count,
      positiveCount,
      roleBreakdown,
      isRate
    };
  };

  const currentSelectedMetric = useMemo(() => {
    if (selectedMetricId === 'all') return null;
    return metricsList.find(m => m.id === selectedMetricId) || null;
  }, [metricsList, selectedMetricId]);

  // Navegação anterior / próximo
  const handleNavigateMetric = (direction: 'prev' | 'next') => {
    const currentIndex = metricsList.findIndex(m => m.id === selectedMetricId);
    if (currentIndex === -1) return;
    if (direction === 'prev') {
      const prevIdx = currentIndex > 0 ? currentIndex - 1 : metricsList.length - 1;
      setSelectedMetricId(metricsList[prevIdx].id);
    } else {
      const nextIdx = currentIndex < metricsList.length - 1 ? currentIndex + 1 : 0;
      setSelectedMetricId(metricsList[nextIdx].id);
    }
  };

  // Cores e ícones dos botões de função
  const getRoleButtonColor = (r: string, isSelected: boolean) => {
    if (isSelected) {
      if (r === 'CPT') return 'bg-yellow-500 text-black shadow-md shadow-yellow-500/30 font-black scale-105';
      if (r === 'RUSH') return 'bg-red-500 text-white shadow-md shadow-red-500/30 font-black scale-105';
      if (r === 'SUPORTE') return 'bg-blue-500 text-white shadow-md shadow-blue-500/30 font-black scale-105';
      if (r === 'GRANADEIRO') return 'bg-orange-500 text-white shadow-md shadow-orange-500/30 font-black scale-105';
      return 'bg-purple-500 text-white shadow-md shadow-purple-500/30 font-black scale-105';
    }
    if (r === 'CPT') return 'bg-black/40 text-yellow-400 hover:bg-yellow-500/10 border border-yellow-500/30';
    if (r === 'RUSH') return 'bg-black/40 text-red-400 hover:bg-red-500/10 border border-red-500/30';
    if (r === 'SUPORTE') return 'bg-black/40 text-blue-400 hover:bg-blue-500/10 border border-blue-500/30';
    if (r === 'GRANADEIRO') return 'bg-black/40 text-orange-400 hover:bg-orange-500/10 border border-orange-500/30';
    return 'bg-black/40 text-purple-400 hover:bg-purple-500/10 border border-purple-500/30';
  };

  const getRoleIcon = (r: string) => {
    if (r === 'CPT') return <Crown size={12} />;
    if (r === 'RUSH') return <Flame size={12} />;
    if (r === 'SUPORTE') return <Shield size={12} />;
    if (r === 'GRANADEIRO') return <Zap size={12} />;
    return <Award size={12} />;
  };

  const getRoleBadgeStyle = (r: string) => {
    const roleNorm = (r || '').trim().toUpperCase();
    if (roleNorm === 'CPT') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    if (roleNorm === 'RUSH') return 'bg-red-500/20 text-red-400 border-red-500/40';
    if (roleNorm === 'SUPORTE') return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    if (roleNorm === 'GRANADEIRO') return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* BARRA DE COMANDO / CONTROLE SUPERIOR */}
      <div className="bg-[#141417] p-5 rounded-3xl border border-white/5 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/30 text-yellow-500 shadow-lg shadow-yellow-500/10">
              <Trophy size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white uppercase italic tracking-tight">
                  Top 10 de Estatísticas do Ranking Geral
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-black uppercase tracking-wider">
                  Oficial
                </span>
                {roleFilter !== 'all' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Crown size={11} /> Função: {roleFilter}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Filtre por função, selecione qualquer métrica para explorar o pódio e Top 10 detalhado ou navegue no mosaico geral.
              </p>
            </div>
          </div>

          {/* Menus Dropdowns de Seleção de Estatística e Função */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Seletor de Função Dropdown */}
            <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-2xl border border-white/10 min-w-[200px]">
              <span className="text-[10px] font-black uppercase text-yellow-500 px-2 tracking-wider flex items-center gap-1">
                <Crown size={11} /> Função:
              </span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer w-full py-1 pr-2"
              >
                <option value="all" className="bg-[#1a1a1a] text-yellow-400 font-black">
                  Todas as Funções ({rankingData.length})
                </option>
                {availableRoles.map(({ role, count }) => (
                  <option key={role} value={role} className="bg-[#1a1a1a] text-white font-bold">
                    {role} ({count} atletas)
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor de Estatística Dropdown */}
            <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-2xl border border-white/10 min-w-[240px] sm:min-w-[280px]">
              <span className="text-[10px] font-black uppercase text-yellow-500 px-2 tracking-wider">Estatística:</span>
              <select
                value={selectedMetricId}
                onChange={(e) => setSelectedMetricId(e.target.value)}
                className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer w-full py-1 pr-2"
              >
                <option value="all" className="bg-[#1a1a1a] text-yellow-400 font-black">
                  🌟 Visualizar Todas (Mosaico)
                </option>
                <optgroup label="Combate" className="bg-[#1a1a1a] text-gray-400 font-bold">
                  {metricsList.filter(m => m.category === 'Combate').map(m => (
                    <option key={m.id} value={m.id} className="bg-[#1a1a1a] text-white">
                      {m.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Dano & Precisão" className="bg-[#1a1a1a] text-gray-400 font-bold">
                  {metricsList.filter(m => m.category === 'Dano & Precisão').map(m => (
                    <option key={m.id} value={m.id} className="bg-[#1a1a1a] text-white">
                      {m.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Knockdowns & MVPs" className="bg-[#1a1a1a] text-gray-400 font-bold">
                  {metricsList.filter(m => m.category === 'Knockdowns & MVPs').map(m => (
                    <option key={m.id} value={m.id} className="bg-[#1a1a1a] text-white">
                      {m.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Suporte & Utilidade" className="bg-[#1a1a1a] text-gray-400 font-bold">
                  {metricsList.filter(m => m.category === 'Suporte & Utilidade').map(m => (
                    <option key={m.id} value={m.id} className="bg-[#1a1a1a] text-white">
                      {m.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Safes" className="bg-[#1a1a1a] text-gray-400 font-bold">
                  {metricsList.filter(m => m.category === 'Safes').map(m => (
                    <option key={m.id} value={m.id} className="bg-[#1a1a1a] text-white">
                      {m.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {selectedMetricId !== 'all' && (
              <button
                onClick={() => setSelectedMetricId('all')}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                title="Voltar para a visão de todas as estatísticas"
              >
                <LayoutGrid size={14} />
                <span>Ver Todas</span>
              </button>
            )}
          </div>
        </div>

        {/* BARRA DEDICADA DE FILTRO POR FUNÇÃO (Botões Rápidos Interativos) */}
        <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-yellow-500" />
            <span className="text-xs font-black uppercase text-white tracking-wider">Filtrar por Função:</span>
            {roleFilter !== 'all' && (
              <span className="text-[11px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">
                {filteredRankingDataByRole.length} atletas na função
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                roleFilter === 'all'
                  ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20 font-black scale-105'
                  : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
              }`}
            >
              <Users size={13} className={roleFilter === 'all' ? 'text-black' : 'text-gray-400'} />
              <span>Todas as Funções</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${roleFilter === 'all' ? 'bg-black/20 text-black' : 'bg-black/40 text-gray-500'}`}>
                {rankingData.length}
              </span>
            </button>

            {availableRoles.map(({ role, count }) => {
              const isSelected = roleFilter === role;
              return (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${getRoleButtonColor(role, isSelected)}`}
                  title={`Filtrar estatísticas apenas para a função ${role}`}
                >
                  {getRoleIcon(role)}
                  <span>{role}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${isSelected ? 'bg-black/20 text-current' : 'bg-black/40 text-gray-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {roleFilter !== 'all' && (
              <button
                onClick={() => setRoleFilter('all')}
                className="px-2.5 py-1 text-[10px] font-black text-gray-400 hover:text-red-400 uppercase transition-colors flex items-center gap-1 bg-white/5 hover:bg-red-500/10 rounded-lg border border-white/5"
                title="Limpar filtro de função"
              >
                <X size={11} />
                <span>Limpar Função</span>
              </button>
            )}
          </div>
        </div>

        {/* Categorias & Busca de Métrica */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          {/* Categorias */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-black uppercase text-gray-500 mr-1 flex items-center gap-1">
              <Sparkles size={11} /> Tipo:
            </span>
            {categories.map(cat => {
              const isSelected = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    isSelected
                      ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20 font-black'
                      : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
                  }`}
                >
                  {cat === 'all' ? 'Todas as Categorias' : cat}
                </button>
              );
            })}
          </div>

          {/* Campo de Busca Rápida de Métrica */}
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar métrica (ex: HS, Dano, Kills)..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* ATALHOS RÁPIDOS DE SELEÇÃO: Botões de cada estatística */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedMetricId('all')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
              selectedMetricId === 'all'
                ? 'bg-yellow-500 text-black border-yellow-500 shadow-md shadow-yellow-500/20 font-black'
                : 'bg-black/30 text-gray-400 hover:text-white border-white/5 hover:border-white/10'
            }`}
          >
            <LayoutGrid size={12} />
            <span>Mosaico Geral</span>
          </button>

          {filteredMetrics.map(metric => {
            const isCurrent = selectedMetricId === metric.id;
            const IconComp = metric.icon;
            return (
              <button
                key={metric.id}
                onClick={() => setSelectedMetricId(metric.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                  isCurrent
                    ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-500/20 font-black scale-105'
                    : 'bg-black/30 text-gray-400 hover:text-white border-white/5 hover:border-white/10 hover:bg-white/5'
                }`}
                title={`Ver Top 10 em ${metric.label}`}
              >
                <IconComp size={12} className={isCurrent ? 'text-black' : metric.color} />
                <span>{metric.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AVISO DE FILTRO ATIVO SE ESTIVER FILTRANDO POR FUNÇÃO */}
      {roleFilter !== 'all' && (
        <div className="bg-gradient-to-r from-red-500/10 via-black/40 to-transparent p-3.5 rounded-2xl border border-red-500/30 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40">
              <Crown size={16} />
            </div>
            <div>
              <span className="text-xs font-black text-white uppercase tracking-wider block">
                Filtro Ativo: Função <span className="text-red-400 font-black">{roleFilter}</span>
              </span>
              <p className="text-[11px] text-gray-400 font-medium">
                Exibindo apenas os melhores desempenhos entre os {filteredRankingDataByRole.length} atletas que atuam como {roleFilter}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setRoleFilter('all')}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            <X size={12} />
            <span>Ver Todas as Funções</span>
          </button>
        </div>
      )}

      {/* MODO 1: VISUALIZAÇÃO DETALHADA DA ESTATÍSTICA SELECIONADA */}
      {currentSelectedMetric ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
          {/* Header da Métrica Selecionada */}
          {(() => {
            const summary = getMetricSummary(currentSelectedMetric);
            const top10 = getTop10(currentSelectedMetric);
            const allRanked = getGeneral(currentSelectedMetric);
            const MetricIcon = currentSelectedMetric.icon;
            const leaderVal = allRanked[0] ? currentSelectedMetric.getValue(allRanked[0]) : 1;

            if (top10.length === 0) {
              return (
                <div className="bg-[#161619] p-12 rounded-3xl border border-white/5 text-center text-gray-400 space-y-4 shadow-xl">
                  <Search size={40} className="mx-auto text-yellow-500 opacity-40" />
                  <div>
                    <h3 className="text-lg font-black text-white uppercase italic">
                      Nenhum Atleta Encontrado
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                      Não encontramos jogadores registrados com a função "{roleFilter}" para a métrica {currentSelectedMetric.label}.
                    </p>
                  </div>
                  <button
                    onClick={() => setRoleFilter('all')}
                    className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-wider transition-all"
                  >
                    Restaurar Todas as Funções
                  </button>
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {/* Banner de Topo com Controles */}
                <div className="bg-gradient-to-r from-black/90 via-[#18181c] to-black/90 p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 bg-gradient-to-br ${currentSelectedMetric.accentBg}`} />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl ${currentSelectedMetric.bgColor} border ${currentSelectedMetric.borderColor} shadow-xl`}>
                        <MetricIcon size={32} className={currentSelectedMetric.color} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                            {currentSelectedMetric.category}
                          </span>
                          <span className="text-yellow-500 font-mono text-xs font-bold">•</span>
                          {roleFilter !== 'all' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                              <Crown size={10} /> Função: {roleFilter} ({filteredRankingDataByRole.length} atletas)
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-gray-400">Ranking Geral ({filteredRankingDataByRole.length} atletas)</span>
                          )}
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight mt-1">
                          {currentSelectedMetric.label}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium mt-1 max-w-2xl">
                          {currentSelectedMetric.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => handleNavigateMetric('prev')}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all"
                        title="Estatística Anterior"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => handleNavigateMetric('next')}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all"
                        title="Próxima Estatística"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <button
                        onClick={() => setSelectedMetricId('all')}
                        className="px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-yellow-500/20 transition-all flex items-center gap-2"
                      >
                        <ArrowLeft size={14} />
                        <span>Ver Mosaico Geral</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* PANORAMA GERAL DA ESTATÍSTICA (Estatísticas Globais & Quebra por Função) */}
                <div className="bg-[#141417] p-5 rounded-3xl border border-white/5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-yellow-500" />
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">
                        Panorama Geral da Estatística • {currentSelectedMetric.label}
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {roleFilter !== 'all' ? `Filtro: ${roleFilter} (${summary.count} atletas)` : `Geral da Liga (${summary.count} atletas)`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Total Acumulado */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between">
                      <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">
                        Total Acumulado ({summary.isRate ? 'Média Geral' : 'Soma Total'})
                      </span>
                      <div className="flex items-baseline gap-1 my-1">
                        <span className="text-2xl font-black italic text-white font-mono">
                          {summary.total}
                        </span>
                        <span className="text-[10px] font-bold text-yellow-500 uppercase">{currentSelectedMetric.unit}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {summary.positiveCount} de {summary.count} atletas pontuaram
                      </span>
                    </div>

                    {/* Média Geral por Atleta */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between">
                      <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">
                        Média Geral por Atleta
                      </span>
                      <div className="flex items-baseline gap-1 my-1">
                        <span className="text-2xl font-black italic text-yellow-400 font-mono">
                          {summary.avg}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{currentSelectedMetric.unit}/atleta</span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {roleFilter !== 'all' ? `Média da função ${roleFilter}` : 'Média da liga completa'}
                      </span>
                    </div>

                    {/* Líder Absoluto */}
                    <div 
                      onClick={() => summary.leaderPlayer && onSelectPlayer(summary.leaderPlayer.name)}
                      className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-yellow-500/40 cursor-pointer transition-colors group flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">
                          Líder da Estatística
                        </span>
                        <Crown size={12} className="text-yellow-500" />
                      </div>
                      {summary.leaderPlayer ? (
                        <div className="flex items-center gap-2.5 my-1">
                          <div className="w-8 h-8 rounded-xl bg-black border border-yellow-500/40 overflow-hidden flex-shrink-0">
                            {summary.leaderPlayer.playerImg ? (
                              <img src={summary.leaderPlayer.playerImg} alt={summary.leaderPlayer.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-black">
                                {summary.leaderPlayer.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-white uppercase italic truncate block group-hover:text-yellow-400 transition-colors">
                              {summary.leaderPlayer.name}
                            </span>
                            <span className="text-[10px] font-bold text-yellow-500 block">
                              {currentSelectedMetric.formatValue(summary.leaderPlayer)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 font-bold">-</span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        Clique para abrir perfil
                      </span>
                    </div>

                    {/* Quebra por Função */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between">
                      <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1">
                        Médias por Função
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        {summary.roleBreakdown.map(rb => (
                          <div key={rb.role} className="flex items-center justify-between bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                            <span className="font-black text-gray-400 text-[9px]">{rb.role}</span>
                            <span className="font-mono font-bold text-yellow-400">{rb.avg}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PÓDIO DOS 3 PRIMEIROS COLOCADOS (TOP 3) */}
                {top10.length >= 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {/* 2º Lugar (Prata) */}
                    <div 
                      onClick={() => onSelectPlayer(top10[1].name)}
                      className="order-2 md:order-1 bg-[#161619] p-5 rounded-3xl border border-slate-500/30 shadow-xl hover:border-slate-400 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-400/5 rounded-full blur-2xl pointer-events-none" />
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="px-3 py-1 rounded-xl bg-slate-400/20 text-slate-200 border border-slate-400/40 font-black text-xs uppercase flex items-center gap-1.5 shadow-sm">
                            <Award size={13} className="text-slate-200" /> {roleFilter === 'all' ? '#2 VICE-LÍDER' : `#2 VICE ${roleFilter}`}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase">{top10[1].team}</span>
                        </div>

                        <div className="flex items-center gap-3.5 mb-4">
                          <div className="w-16 h-16 rounded-2xl bg-black border-2 border-slate-400/50 overflow-hidden flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform relative">
                            {top10[1].playerImg ? (
                              <img src={top10[1].playerImg} alt={top10[1].name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600 bg-black font-black text-lg">
                                {top10[1].name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            {top10[1].teamImg && (
                              <img 
                                src={top10[1].teamImg} 
                                alt={top10[1].team} 
                                className="w-5 h-5 object-contain absolute bottom-1 right-1 rounded bg-black/80 p-0.5 border border-white/20" 
                                referrerPolicy="no-referrer"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-lg font-black text-white uppercase italic truncate group-hover:text-yellow-400 transition-colors">
                              {top10[1].name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getRoleBadgeStyle(top10[1].funcao)}`}>
                                {top10[1].funcao || 'N/A'}
                              </span>
                              <span className="text-xs font-bold text-gray-400 truncate">{top10[1].team}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/5">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Desempenho</span>
                          <span className={`text-2xl font-black italic ${currentSelectedMetric.color}`}>
                            {currentSelectedMetric.formatValue(top10[1])}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium truncate mb-2">
                          {currentSelectedMetric.subDetail(top10[1])}
                        </p>
                        <div className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-slate-400 transition-all duration-700" 
                            style={{ width: `${leaderVal > 0 ? (currentSelectedMetric.getValue(top10[1]) / leaderVal) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 1º Lugar (Ouro / Campeão) - Em Destaque Central */}
                    <div 
                      onClick={() => onSelectPlayer(top10[0].name)}
                      className="order-1 md:order-2 bg-gradient-to-b from-[#1c1a14] via-[#161619] to-[#121215] p-6 rounded-3xl border-2 border-yellow-500 shadow-2xl shadow-yellow-500/10 hover:border-yellow-400 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between transform md:-translate-y-2"
                    >
                      <div className="absolute top-0 right-0 w-44 h-44 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="px-3 py-1 rounded-xl bg-yellow-500 text-black font-black text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-yellow-500/30">
                            <Crown size={14} className="text-black" /> {roleFilter === 'all' ? '#1 LÍDER ABSOLUTO' : `#1 LÍDER ${roleFilter}`}
                          </span>
                          <span className="text-xs font-black text-yellow-500 uppercase tracking-wider">{top10[0].team}</span>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-20 h-20 rounded-2xl bg-black border-2 border-yellow-500 overflow-hidden flex-shrink-0 shadow-2xl shadow-yellow-500/30 group-hover:scale-105 transition-transform relative">
                            {top10[0].playerImg ? (
                              <img src={top10[0].playerImg} alt={top10[0].name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-yellow-500 bg-black font-black text-2xl">
                                {top10[0].name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            {top10[0].teamImg && (
                              <img 
                                src={top10[0].teamImg} 
                                alt={top10[0].team} 
                                className="w-6 h-6 object-contain absolute bottom-1 right-1 rounded bg-black/90 p-0.5 border border-yellow-500/50" 
                                referrerPolicy="no-referrer"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xl font-black text-white uppercase italic truncate group-hover:text-yellow-400 transition-colors">
                              {top10[0].name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getRoleBadgeStyle(top10[0].funcao)}`}>
                                {top10[0].funcao || 'N/A'}
                              </span>
                              <span className="text-xs font-bold text-gray-300 truncate">{top10[0].team}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-xs font-black uppercase text-yellow-400 tracking-wider">Melhor Marca</span>
                          <span className={`text-3xl font-black italic ${currentSelectedMetric.color}`}>
                            {currentSelectedMetric.formatValue(top10[0])}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 font-medium truncate mb-2">
                          {currentSelectedMetric.subDetail(top10[0])}
                        </p>
                        <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden">
                          <div className="h-full rounded-full bg-yellow-500 w-full" />
                        </div>
                      </div>
                    </div>

                    {/* 3º Lugar (Bronze) */}
                    <div 
                      onClick={() => onSelectPlayer(top10[2].name)}
                      className="order-3 md:order-3 bg-[#161619] p-5 rounded-3xl border border-amber-700/40 shadow-xl hover:border-amber-500 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-700/5 rounded-full blur-2xl pointer-events-none" />
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="px-3 py-1 rounded-xl bg-amber-700/20 text-amber-400 border border-amber-700/40 font-black text-xs uppercase flex items-center gap-1.5 shadow-sm">
                            <Award size={13} className="text-amber-400" /> {roleFilter === 'all' ? '#3 TERCEIRO LUGAR' : `#3 TOP 3 ${roleFilter}`}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase">{top10[2].team}</span>
                        </div>

                        <div className="flex items-center gap-3.5 mb-4">
                          <div className="w-16 h-16 rounded-2xl bg-black border-2 border-amber-700/50 overflow-hidden flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform relative">
                            {top10[2].playerImg ? (
                              <img src={top10[2].playerImg} alt={top10[2].name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600 bg-black font-black text-lg">
                                {top10[2].name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            {top10[2].teamImg && (
                              <img 
                                src={top10[2].teamImg} 
                                alt={top10[2].team} 
                                className="w-5 h-5 object-contain absolute bottom-1 right-1 rounded bg-black/80 p-0.5 border border-white/20" 
                                referrerPolicy="no-referrer"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-lg font-black text-white uppercase italic truncate group-hover:text-yellow-400 transition-colors">
                              {top10[2].name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getRoleBadgeStyle(top10[2].funcao)}`}>
                                {top10[2].funcao || 'N/A'}
                              </span>
                              <span className="text-xs font-bold text-gray-400 truncate">{top10[2].team}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/5">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Desempenho</span>
                          <span className={`text-2xl font-black italic ${currentSelectedMetric.color}`}>
                            {currentSelectedMetric.formatValue(top10[2])}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium truncate mb-2">
                          {currentSelectedMetric.subDetail(top10[2])}
                        </p>
                        <div className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-amber-600 transition-all duration-700" 
                            style={{ width: `${leaderVal > 0 ? (currentSelectedMetric.getValue(top10[2]) / leaderVal) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* BARRA DE ESCOPO: TOP 10 vs RANKING GERAL COMPLETO + BUSCA DE ATLETA */}
                {(() => {
                  const targetList = rankingScope === 'top10' ? top10 : allRanked;
                  const displayedPlayers = targetList.filter(p => {
                    if (!playerTableSearch.trim()) return true;
                    const q = playerTableSearch.toLowerCase().trim();
                    return (
                      (p.name || '').toLowerCase().includes(q) ||
                      (p.team || '').toLowerCase().includes(q) ||
                      (p.funcao || '').toLowerCase().includes(q)
                    );
                  });

                  return (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#141417] rounded-3xl border border-white/5 shadow-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setRankingScope('top10')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                              rankingScope === 'top10'
                                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black scale-105'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                            }`}
                          >
                            <Trophy size={14} className={rankingScope === 'top10' ? 'text-black' : 'text-yellow-500'} />
                            <span>Top 10 Melhores</span>
                          </button>

                          <button
                            onClick={() => setRankingScope('general')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                              rankingScope === 'general'
                                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black scale-105'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                            }`}
                          >
                            <Globe size={14} className={rankingScope === 'general' ? 'text-black' : 'text-yellow-500'} />
                            <span>Ranking Geral Completo ({filteredRankingDataByRole.length} Atletas)</span>
                          </button>
                        </div>

                        <div className="relative min-w-[240px]">
                          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            type="text"
                            value={playerTableSearch}
                            onChange={(e) => setPlayerTableSearch(e.target.value)}
                            placeholder="Buscar atleta ou time na tabela..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                          />
                          {playerTableSearch && (
                            <button
                              onClick={() => setPlayerTableSearch('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs font-bold"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>

                      {/* TABELA COMPLETA (TOP 10 ou RANKING GERAL) */}
                      <div className="bg-[#161619] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                        <div className="bg-black/40 px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {rankingScope === 'top10' ? (
                              <Trophy size={16} className="text-yellow-500" />
                            ) : (
                              <Globe size={16} className="text-yellow-500" />
                            )}
                            <span className="text-xs font-black text-white uppercase tracking-wider">
                              {rankingScope === 'top10' ? 'Tabela do Top 10' : 'Ranking Geral Completo'} • {currentSelectedMetric.label} {roleFilter !== 'all' && `(${roleFilter})`}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400">
                              {displayedPlayers.length} atletas exibidos
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-500 font-bold uppercase">
                            Clique no atleta para abrir seu Perfil Individual
                          </span>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                          <table className="w-full text-left border-separate border-spacing-y-1 p-3">
                            <thead>
                              <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest select-none bg-black/20">
                                <th className="px-4 py-3 text-center rounded-l-xl w-16"># Pos</th>
                                <th className="px-4 py-3">Jogador</th>
                                <th className="px-4 py-3">Equipe</th>
                                <th className="px-3 py-3 text-center">Função</th>
                                <th className="px-4 py-3 text-right">Resultado</th>
                                <th className="px-4 py-3 text-center">Partidas</th>
                                <th className="px-4 py-3 text-center">Média/Q</th>
                                <th className="px-4 py-3 text-center rounded-r-xl w-24">Ação</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayedPlayers.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="text-center py-8 text-xs text-gray-500 font-bold">
                                    Nenhum atleta encontrado para a busca "{playerTableSearch}".
                                  </td>
                                </tr>
                              ) : (
                                displayedPlayers.map((p, idx) => {
                                  const originalRank = allRanked.findIndex(item => item.name === p.name) + 1;
                                  const rank = rankingScope === 'top10' ? idx + 1 : (playerTableSearch ? originalRank : idx + 1);
                                  const val = currentSelectedMetric.getValue(p);
                                  const pctOfLeader = leaderVal > 0 ? (val / leaderVal) * 100 : 0;

                                  return (
                                    <tr
                                      key={`${currentSelectedMetric.id}-${p.name}-${idx}`}
                                      onClick={() => onSelectPlayer(p.name)}
                                      className="bg-black/30 hover:bg-white/10 transition-all cursor-pointer group rounded-xl border border-transparent hover:border-yellow-500/30"
                                    >
                                      {/* Rank */}
                                      <td className="px-4 py-3 text-center rounded-l-xl">
                                        {rank === 1 ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 font-black text-xs shadow-sm">
                                            <Crown size={12} /> #1
                                          </span>
                                        ) : rank === 2 ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-400/20 text-slate-200 border border-slate-400/40 font-black text-xs">
                                            #2
                                          </span>
                                        ) : rank === 3 ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-700/20 text-amber-400 border border-amber-600/40 font-black text-xs">
                                            #3
                                          </span>
                                        ) : (
                                          <span className="font-mono text-gray-500 font-bold text-xs">
                                            #{rank}
                                          </span>
                                        )}
                                      </td>

                                      {/* Jogador */}
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-xl bg-black border border-white/10 overflow-hidden flex-shrink-0 group-hover:border-yellow-500/50 transition-colors">
                                            {p.playerImg ? (
                                              <img src={p.playerImg} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-600 bg-black font-black text-xs">
                                                {p.name.substring(0, 2).toUpperCase()}
                                              </div>
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <span className="text-xs font-black text-white uppercase italic truncate block group-hover:text-yellow-400 transition-colors">
                                              {p.name}
                                            </span>
                                            <span className="text-[9px] text-gray-500 font-bold uppercase truncate block">
                                              {p.team}
                                            </span>
                                          </div>
                                        </div>
                                      </td>

                                      {/* Equipe */}
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                          {p.teamImg && (
                                            <img src={p.teamImg} alt={p.team} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                                          )}
                                          <span className="text-[11px] font-bold text-gray-300 uppercase truncate max-w-[120px]">
                                            {p.team}
                                          </span>
                                        </div>
                                      </td>

                                      {/* Função */}
                                      <td className="px-3 py-3 text-center">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${getRoleBadgeStyle(p.funcao)}`}>
                                          {p.funcao || 'N/A'}
                                        </span>
                                      </td>

                                      {/* Valor Formatado + Barra Proporcional */}
                                      <td className="px-4 py-3 text-right">
                                        <div className="flex flex-col items-end">
                                          <span className={`text-sm font-black italic ${currentSelectedMetric.color}`}>
                                            {currentSelectedMetric.formatValue(p)}
                                          </span>
                                          <div className="w-24 h-1 rounded-full bg-black/60 overflow-hidden mt-1">
                                            <div 
                                              className={`h-full rounded-full ${currentSelectedMetric.barColor}`} 
                                              style={{ width: `${Math.min(100, Math.max(5, pctOfLeader))}%` }}
                                            />
                                          </div>
                                        </div>
                                      </td>

                                      {/* Partidas */}
                                      <td className="px-4 py-3 text-center font-mono text-xs text-gray-400">
                                        {p.matches}
                                      </td>

                                      {/* Média */}
                                      <td className="px-4 py-3 text-center text-xs font-black italic text-yellow-500">
                                        {p.avg}
                                      </td>

                                      {/* Ação */}
                                      <td className="px-4 py-3 text-center rounded-r-xl">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-gray-400 group-hover:text-yellow-400 uppercase tracking-wider transition-colors">
                                          Perfil <ExternalLink size={10} />
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
        </div>
      ) : (
        /* MODO 2: MOSAICO GERAL DE TODAS AS ESTATÍSTICAS DO RANKING */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {filteredMetrics.map(metric => {
            const summary = getMetricSummary(metric);
            const top10 = getTop10(metric);
            const MetricIcon = metric.icon;

            return (
              <div 
                key={metric.id} 
                className="bg-[#161619] rounded-3xl border border-white/5 overflow-hidden shadow-xl hover:border-yellow-500/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="bg-black/40 p-4 border-b border-white/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl ${metric.bgColor} border ${metric.borderColor} shadow-md flex-shrink-0`}>
                        <MetricIcon size={18} className={metric.color} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider block">
                          {metric.category} {roleFilter !== 'all' ? `• Função: ${roleFilter}` : ''}
                        </span>
                        <h4 className="text-sm font-black text-white uppercase italic truncate">
                          {metric.label}
                        </h4>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedMetricId(metric.id);
                        setRankingScope('general');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-yellow-500 hover:text-black text-gray-400 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 flex-shrink-0"
                      title={`Ver Geral completo de ${metric.label}`}
                    >
                      <span>Ver Geral</span>
                      <ArrowUpRight size={11} />
                    </button>
                  </div>

                  {/* Resumo Geral da Métrica (Total & Média da Liga) */}
                  <div className="px-4 py-2 bg-black/25 border-b border-white/5 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Globe size={11} className="text-yellow-500" />
                      <span className="font-bold uppercase text-[9px]">Geral:</span>
                      <span className="text-white font-mono font-bold">{summary.total} {metric.unit}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <span className="font-bold uppercase text-[9px]">Média/Atleta:</span>
                      <span className="text-yellow-400 font-mono font-bold">{summary.avg}</span>
                    </div>
                  </div>

                  {/* Lista Top 10 */}
                  <div className="p-3 space-y-1">
                    {top10.length === 0 ? (
                      <div className="py-6 text-center text-gray-500 text-xs font-bold">
                        Nenhum atleta na função {roleFilter}
                      </div>
                    ) : (
                      top10.map((p, idx) => {
                        const rank = idx + 1;
                        const formattedVal = metric.formatValue(p);

                        return (
                          <div
                            key={`${metric.id}-${p.name}-${idx}`}
                            onClick={() => onSelectPlayer(p.name)}
                            className="flex items-center justify-between p-2 rounded-xl bg-black/20 hover:bg-white/10 transition-all cursor-pointer group/row"
                            title={`Clique para abrir o perfil de ${p.name}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Rank Badge */}
                              <span className={`w-5 text-center font-mono font-black text-xs flex-shrink-0 ${
                                rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-amber-500' : 'text-gray-600'
                              }`}>
                                #{rank}
                              </span>

                              {/* Foto / Iniciais */}
                              <div className="w-6 h-6 rounded-lg bg-black border border-white/10 overflow-hidden flex-shrink-0">
                                {p.playerImg ? (
                                  <img src={p.playerImg} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-gray-600">
                                    {p.name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <span className="text-xs font-black text-white uppercase italic truncate block group-hover/row:text-yellow-400 transition-colors">
                                  {p.name}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[8px] text-gray-500 font-bold uppercase truncate">
                                    {p.team}
                                  </span>
                                  {roleFilter === 'all' && p.funcao && (
                                    <span className={`text-[7px] font-black uppercase px-1 py-0.2 rounded border ${getRoleBadgeStyle(p.funcao)}`}>
                                      {p.funcao}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end flex-shrink-0 pl-2">
                              <span className={`text-xs font-black italic ${metric.color}`}>
                                {formattedVal}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Rodapé com Ações: Top 10 e Ver Geral */}
                <div className="p-3 bg-black/40 border-t border-white/5 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedMetricId(metric.id);
                      setRankingScope('top10');
                    }}
                    className="py-2 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                  >
                    <Trophy size={11} className="text-yellow-500" />
                    <span>Top 10</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMetricId(metric.id);
                      setRankingScope('general');
                    }}
                    className="py-2 px-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-md shadow-yellow-500/20"
                  >
                    <Globe size={11} />
                    <span>Ver Geral ({filteredRankingDataByRole.length})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TopStatsAnalysis;
