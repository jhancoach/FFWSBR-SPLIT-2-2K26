import React, { useState, useMemo, useRef } from 'react';
import { DashboardData } from '../types';
import { Download, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import { findTeamLogo } from '../utils/teamUtils';

interface BannersProps {
  data: DashboardData;
}

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
  const [activeTab, setActiveTab] = useState<'teams' | 'players' | 'team_perf'>('teams');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedRd, setSelectedRd] = useState<string>('all');
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
      
      const mapName = d.MAPA || 'Desconhecido';
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
      const canvas = await html2canvas(bannerRef.current, {
        scale: 2, // Melhor qualidade
        backgroundColor: '#000000',
        useCORS: true,
        width: 1080,
        height: 1920,
        windowWidth: 1080,
        windowHeight: 1920,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Stories_Banner_${activeTab}_${selectedRd}.png`;
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
            Gerador de Stories
          </h2>
          <p className="text-gray-400 text-sm mt-1">Gere banners verticais para o Instagram com os TOP 3 da rodada ou da equipe.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex bg-black p-1 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
                activeTab === 'teams' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Equipes
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
                activeTab === 'players' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Jogadores
            </button>
            <button
              onClick={() => setActiveTab('team_perf')}
              className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
                activeTab === 'team_perf' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Por Equipe
            </button>
          </div>

          {activeTab === 'team_perf' && (
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-yellow-500 outline-none w-full md:w-48"
            >
              <option value="" disabled>Selecione a Equipe</option>
              {availableTeams.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}

          <select
            value={selectedRd}
            onChange={(e) => setSelectedRd(e.target.value)}
            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-yellow-500 outline-none w-full md:w-48"
          >
            <option value="" disabled>Selecione a Rodada</option>
            <option value="all">Geral (Todas)</option>
            {availableRds.map(rd => (
              <option key={rd} value={rd}>Rodada {rd}</option>
            ))}
          </select>

          <button
            onClick={handleDownload}
            disabled={isGenerating || !selectedRd || (activeTab === 'team_perf' && !selectedTeam)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] disabled:opacity-50 w-full md:w-auto shrink-0"
          >
            <Download size={20} />
            {isGenerating ? 'Gerando...' : 'Baixar'}
          </button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex md:justify-center bg-black/40 p-4 md:p-8 rounded-3xl border border-white/5 overflow-x-auto">
        
        {/* Banner Real (Scale down for preview, full size for render) */}
        <div className="relative origin-top transform scale-[0.4] sm:scale-[0.5] md:scale-[0.6] lg:scale-[0.7] -mb-[1152px] sm:-mb-[960px] md:-mb-[768px] lg:-mb-[576px]">
          
          <div 
            ref={bannerRef}
            className="bg-gradient-to-br from-[#1a1a1a] to-black w-[1080px] h-[1920px] relative overflow-hidden flex flex-col font-display border border-white/5"
            style={{ padding: '80px', boxSizing: 'border-box' }}
          >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-yellow-500/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-500/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none translate-y-1/2 -translate-x-1/3"></div>
            
            {/* Header */}
            <div className="text-center mb-12 relative z-10">
              <h1 className="text-[60px] font-black text-white uppercase tracking-[0.2em] italic mb-4">
                {activeTab === 'team_perf' ? 'Desempenho' : 'Rodada'} <span className="text-yellow-500">{activeTab === 'team_perf' ? (selectedRd === 'all' ? 'Geral' : 'Rodada ' + selectedRd) : selectedRd}</span>
              </h1>
              <div className="h-1 w-32 bg-yellow-500 mx-auto rounded-full"></div>
            </div>

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
            ) : null}

            {/* Footer */}
            <div className="mt-16 text-center text-gray-500 text-2xl font-bold uppercase tracking-widest border-t border-white/5 pt-8 relative z-10">
              FFWS BR 2026 - SPLIT 2
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Banners;
