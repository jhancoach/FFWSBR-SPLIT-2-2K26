import React, { useState, useMemo, useRef } from 'react';
import { DashboardData } from '../types';
import { Download, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import { findTeamLogo } from '../utils/teamUtils';
import { findDimImg } from '../utils/skillImages';
import { Flame, Crosshair, AlertTriangle, Target as TargetIcon, Skull, Activity, Shield, Star, Crown } from 'lucide-react';

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
  >('teams');
  const [selectedMapOrDrop, setSelectedMapOrDrop] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedRd, setSelectedRd] = useState<string>('all');
  const [storiesSubtype, setStoriesSubtype] = useState<string>('highlights');
  const bannerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const availableRds = useMemo(() => {
    const rds = new Set<string>();
    data.details.forEach(d => {
      if (d.RD) rds.add(d.RD.toString());
    });
    return Array.from(rds).sort((a, b) => parseNumber(a) - parseNumber(b));
  }, [data.details]);

  const availableTeams = useMemo(() => {
    const teams = new Set<string>();
    data.teamsReference.forEach(t => { if (t.TIME) teams.add(t.TIME); });
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

    // First process data.details for match counts, placement, booyahs and team kills
    data.details.forEach(d => {
      const teamName = d.TIME;
      if (!teamName) return;
      const rawKey = isMapTab ? formatMapName(d.MAPA) : (d.Q || "").trim().toUpperCase();

      const ptsc = parseNumber(d.PTSC);
      const pts = parseNumber(d.PTS);
      const abts = parseNumber(d.ABTS);
      const booyah = parseNumber(d.B);

      // Add to ALL
      const allStats = getOrCreateTeam(allTeamsMap, teamName);
      allStats.matches += 1;
      allStats.ptsc += ptsc;
      allStats.pts += pts;
      allStats.kills += abts;
      allStats.booyahs += booyah;
      if (abts === 0) allStats.zeroKills += 1;
      else allStats.withKills += 1;

      // Add to specific group
      if (!rawKey) return;
      if (!groupMap.has(rawKey)) {
        groupMap.set(rawKey, new Map());
      }
      const groupTeamMap = groupMap.get(rawKey)!;
      const teamStats = getOrCreateTeam(groupTeamMap, teamName);
      teamStats.matches += 1;
      teamStats.ptsc += ptsc;
      teamStats.pts += pts;
      teamStats.kills += abts;
      teamStats.booyahs += booyah;
      if (abts === 0) teamStats.zeroKills += 1;
      else teamStats.withKills += 1;
    });

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
        topZero: getTopAll((a, b) => b.zeroKills - a.zeroKills),
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
      const isFeed = activeTab === 'map_kings' || activeTab === 'drop_kings' || activeTab === 'role_kings' || activeTab === 'team_map_kings' || activeTab === 'team_drop_kings';
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
      } else {
        filename = `Stories_Banner_${activeTab}_${selectedRd}.png`;
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
                  Times Queda
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

            {/* Stories Subtype Model Selector */}
            {(activeTab === 'map_kings_stories' || activeTab === 'drop_kings_stories' || activeTab === 'role_kings_stories' || activeTab === 'team_map_kings_stories' || activeTab === 'team_drop_kings_stories') && (
              <div className="flex flex-col gap-1.5">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px] leading-none">Modelo Stories</span>
                <select 
                  value={storiesSubtype}
                  onChange={(e) => setStoriesSubtype(e.target.value)}
                  className="bg-black border border-white/10 text-white rounded-xl px-3 py-2.5 font-bold uppercase text-xs"
                >
                  <option value="highlights">Destaques Completos</option>
                  <option value="matches">Partidas e Médias</option>
                  <option value="damage">Maiores Danos</option>
                  <option value="avg_kills">{isTeamTab ? 'Mais Média de Abates' : 'Mais Média de Kills'}</option>
                  <option value="knocks">{isTeamTab ? 'Times que Mais Derrubam' : 'Mais Derruba'}</option>
                  <option value="hs">{isTeamTab ? 'Times com Mais HS' : 'Mais HS e Médias'}</option>
                  <option value="zero_kills">{isTeamTab ? 'Times que Mais Zeram' : 'Mais Zera'}</option>
                  <option value="revives">{isTeamTab ? 'Times que Mais Revivem' : 'Mais Revive'}</option>
                  <option value="allies_revived">{isTeamTab ? 'Times com Mais Aliados Revividos' : 'Mais Aliados Revive'}</option>
                  <option value="mvp">{isTeamTab ? 'Times com Mais MVPs' : 'Mais MVP'}</option>
                  <option value="deaths">{isTeamTab ? 'Times que Mais Morrem' : 'Mais Morre'}</option>
                </select>
              </div>
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
                  onChange={(e) => setSelectedRd(e.target.value)}
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

            <button
              type="button"
              onClick={handleDownload}
              disabled={
                isGenerating || 
                ((activeTab !== 'map_kings' && activeTab !== 'drop_kings' && activeTab !== 'role_kings' && activeTab !== 'map_kings_stories' && activeTab !== 'drop_kings_stories' && activeTab !== 'role_kings_stories') && !selectedRd) || 
                (activeTab === 'team_perf' && !selectedTeam) || 
                ((activeTab === 'map_kings' || activeTab === 'drop_kings' || activeTab === 'role_kings' || activeTab === 'map_kings_stories' || activeTab === 'drop_kings_stories' || activeTab === 'role_kings_stories') && !selectedMapOrDrop)
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
      <div className="flex md:justify-center bg-black/40 p-4 md:p-8 rounded-3xl border border-white/5 overflow-x-auto">
        
        {/* Banner Real (Scale down for preview, full size for render) */}
        <div className={`relative origin-top transform scale-[0.4] sm:scale-[0.5] md:scale-[0.6] lg:scale-[0.7] ${(activeTab === 'map_kings' || activeTab === 'drop_kings' || activeTab === 'role_kings') ? '-mb-[810px] sm:-mb-[675px] md:-mb-[540px] lg:-mb-[405px]' : '-mb-[1152px] sm:-mb-[960px] md:-mb-[768px] lg:-mb-[576px]'}`}>
          
          <div 
            ref={bannerRef}
            className={`bg-gradient-to-br from-[#1a1a1a] to-black w-[1080px] ${(activeTab === 'map_kings' || activeTab === 'drop_kings' || activeTab === 'role_kings') ? 'h-[1350px]' : 'h-[1920px]'} relative overflow-hidden flex flex-col font-display border border-white/5`}
            style={{ padding: '80px', boxSizing: 'border-box' }}
          >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-yellow-500/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-500/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none translate-y-1/2 -translate-x-1/3"></div>
            
            {/* Header */}
            {activeTab !== 'map_kings' && activeTab !== 'drop_kings' && activeTab !== 'role_kings' && (
              <div className="text-center mb-12 relative z-10">
                <h1 className="text-[60px] font-black text-white uppercase tracking-[0.2em] italic mb-4">
                  {activeTab === 'team_perf' ? 'Desempenho' : 'Rodada'} <span className="text-yellow-500">{activeTab === 'team_perf' ? (selectedRd === 'all' ? 'Geral' : 'Rodada ' + selectedRd) : selectedRd}</span>
                </h1>
                <div className="h-1 w-32 bg-yellow-500 mx-auto rounded-full"></div>
              </div>
            )}

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
                             <div className="flex-1 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                               <div className="text-gray-500 font-bold text-xs uppercase mb-0.5">Pts Totais</div>
                               <div className="text-white font-black text-xl">{map.pts} <span className="text-gray-500 text-xs">({map.avgPts})</span></div>
                             </div>
                             <div className="flex-1 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                               <div className="text-gray-500 font-bold text-xs uppercase mb-0.5">Colocação</div>
                               <div className="text-yellow-400 font-black text-xl">{map.ptsc} <span className="text-gray-500 text-xs">({map.avgPtsc})</span></div>
                             </div>
                             <div className="flex-1 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                               <div className="text-gray-500 font-bold text-xs uppercase mb-0.5">Abates</div>
                               <div className="text-red-400 font-black text-xl">{map.abts} <span className="text-gray-500 text-xs">({map.avgAbts})</span></div>
                             </div>
                             <div className="flex-1 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
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
                    title = isTeamTab ? `${groupPrefix}\nMAIS ZERAM` : `${groupPrefix}\nMAIS ZERA`;
                    playersList.sort((a, b) => b.zeroKills - a.zeroKills);
                    valueLabel = "Zeradão";
                    valueExtractor = (p) => `${p.zeroKills}`;
                    subValueExtractor = (p) => `Taxa: ${p.zeroRate.toFixed(1)}%`;
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
                            { title: "Média Kills", player: group.topAvgKills, value: group.topAvgKills?.avgKills.toFixed(2), icon: <Crosshair className="text-green-500" size={18} />, color: "bg-green-500/10 border-green-500/20 text-green-500" },
                            { title: "Mais Derruba", player: group.topKnocks, value: group.topKnocks?.knocks, icon: <AlertTriangle className="text-orange-500" size={18} />, color: "bg-orange-500/10 border-orange-500/20 text-orange-500" },
                            { title: "Mais HS", player: group.topHs, value: group.topHs?.hs, icon: <TargetIcon className="text-yellow-500" size={18} />, color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" },
                            { title: "Mais Zera", player: group.topZero, value: `${group.topZero?.zeroKills}`, icon: <Skull className="text-gray-400" size={18} />, color: "bg-gray-500/10 border-gray-500/20 text-gray-400" },
                            { title: "Mais Revive", player: group.topRevives, value: group.topRevives?.reviveu, icon: <Activity className="text-cyan-500" size={18} />, color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500" },
                            { title: "Aliados Rev", player: group.topAlliesRevived, value: group.topAlliesRevived?.aliadosRevividos, icon: <Shield className="text-emerald-500" size={18} />, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" },
                            { title: "Mais MVP", player: group.topMvp, value: group.topMvp?.mvp, icon: <Star className="text-purple-500" size={18} />, color: "bg-purple-500/10 border-purple-500/20 text-purple-500" },
                            { title: "Mais Morre", player: group.topDeaths, value: group.topDeaths?.deaths, icon: <Skull className="text-rose-500" size={18} />, color: "bg-rose-500/10 border-rose-500/20 text-rose-500" },
                          ].map((h, i) => (
                            <div key={i} className="flex flex-col p-2.5 rounded-xl border border-white/5 bg-black/40 min-w-0 justify-between h-[120px]">
                              <div className="flex items-center gap-1.5 border-b border-white/5 pb-1">
                                <div className={`p-1.5 rounded-lg ${h.color} border flex-shrink-0`}>
                                  {h.icon}
                                </div>
                                <span className="text-[13px] font-black text-gray-400 uppercase tracking-wider truncate flex-1 leading-none">{h.title}</span>
                              </div>
                              <div className="flex flex-col mt-2 justify-center">
                                <span className="text-[22px] font-black text-white italic uppercase truncate leading-none mb-1">{h.player?.name || "-"}</span>
                                <span className={`text-[28px] font-black italic leading-none ${h.color.split(' ')[2]}`}>
                                  {h.value || 0}
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
                                    { title: "Média Kills", player: group.topAvgKills, value: group.topAvgKills?.avgKills.toFixed(2), icon: <Crosshair className="text-green-500" size={28} />, color: "bg-green-500/10 border-green-500/20 text-green-500" },
                                    { title: "Mais Derruba", player: group.topKnocks, value: group.topKnocks?.knocks, icon: <AlertTriangle className="text-orange-500" size={28} />, color: "bg-orange-500/10 border-orange-500/20 text-orange-500" },
                                    { title: "Mais HS", player: group.topHs, value: group.topHs?.hs, icon: <TargetIcon className="text-yellow-500" size={28} />, color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" },
                                    { title: "Mais Zera", player: group.topZero, value: `${group.topZero?.zeroKills}`, icon: <Skull className="text-gray-400" size={28} />, color: "bg-gray-500/10 border-gray-500/20 text-gray-400" },
                                    { title: "Mais Revive", player: group.topRevives, value: group.topRevives?.reviveu, icon: <Activity className="text-cyan-500" size={28} />, color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500" },
                                    { title: "Aliados Rev", player: group.topAlliesRevived, value: group.topAlliesRevived?.aliadosRevividos, icon: <Shield className="text-emerald-500" size={28} />, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" },
                                    { title: "Mais MVP", player: group.topMvp, value: group.topMvp?.mvp, icon: <Star className="text-purple-500" size={28} />, color: "bg-purple-500/10 border-purple-500/20 text-purple-500" },
                                    { title: "Mais Morre", player: group.topDeaths, value: group.topDeaths?.deaths, icon: <Skull className="text-rose-500" size={28} />, color: "bg-rose-500/10 border-rose-500/20 text-rose-500" },
                                ].map((h, i) => (
                                    <div key={i} className={`flex items-center gap-3.5 py-2.5 px-4 rounded-2xl border border-white/5 bg-black/40`}>
                                        <div className={`p-3 rounded-xl ${h.color} border`}>
                                            {h.icon}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center min-w-0">
                                            <span className="text-[16px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">{h.title}</span>
                                            <div className="flex items-center gap-2">
                                                {h.player?.teamImg && <img src={h.player.teamImg} alt="" crossOrigin="anonymous" className="w-6 h-6 object-contain" />}
                                                <span className="text-[28px] font-black text-white italic uppercase leading-none truncate">{h.player?.name || "-"}</span>
                                            </div>
                                        </div>
                                        <span className={`text-[36px] font-black italic shrink-0 ${h.color.split(' ')[2]}`}>
                                            {h.value || 0}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                  </div>
                );
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
