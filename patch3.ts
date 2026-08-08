import fs from 'fs';
let content = fs.readFileSync('pages/Banners.tsx', 'utf-8');

const newDataLogic = `  const bannerTeamPerfData = useMemo(() => {
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
  }, [data.details, data.players, data.teamsReference, data.playersDimension, selectedTeam, selectedRd]);`;

content = content.replace(/const bannerTeamPerfData = useMemo\(\(\) => \{[\s\S]*?return \{ teamName.*?\}\;\n  \}, \[data\.details, data\.players, data\.teamsReference, data\.playersDimension, selectedTeam, selectedRd\]\);/, newDataLogic);


const mapUI = `                {/* Desempenho por Mapa */}
                {bannerTeamPerfData.maps && bannerTeamPerfData.maps.length > 0 && (
                  <div className="bg-black/50 p-8 rounded-3xl border border-white/10 backdrop-blur-sm flex-1">
                    <h3 className="text-white font-black text-3xl uppercase tracking-widest italic mb-8 flex items-center gap-4">
                      <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                      Desempenho por Mapa
                    </h3>
                    
                    <div className="flex gap-4 overflow-x-auto pb-4">
                      {bannerTeamPerfData.maps.map((map, idx) => (
                        <div key={map.mapName} className="flex-1 min-w-[280px] bg-white/5 border border-white/5 rounded-2xl p-6 text-center shadow-lg">
                           <h4 className="text-white font-black text-2xl uppercase mb-1">{map.mapName}</h4>
                           <div className="text-gray-400 font-bold text-sm mb-4">{map.matches} Quedas</div>
                           
                           <div className="flex flex-col gap-3">
                             <div className="flex justify-between items-center bg-black/40 px-4 py-2 rounded-lg">
                               <span className="text-gray-500 font-bold text-sm uppercase">Pts Totais</span>
                               <span className="text-white font-black text-xl">{map.pts} <span className="text-gray-500 text-sm">({map.avgPts})</span></span>
                             </div>
                             <div className="flex justify-between items-center bg-black/40 px-4 py-2 rounded-lg">
                               <span className="text-gray-500 font-bold text-sm uppercase">Colocação</span>
                               <span className="text-yellow-400 font-black text-xl">{map.ptsc} <span className="text-gray-500 text-sm">({map.avgPtsc})</span></span>
                             </div>
                             <div className="flex justify-between items-center bg-black/40 px-4 py-2 rounded-lg">
                               <span className="text-gray-500 font-bold text-sm uppercase">Abates</span>
                               <span className="text-red-400 font-black text-xl">{map.abts} <span className="text-gray-500 text-sm">({map.avgAbts})</span></span>
                             </div>
                             <div className="flex justify-between items-center bg-black/40 px-4 py-2 rounded-lg">
                               <span className="text-gray-500 font-bold text-sm uppercase">Booyahs</span>
                               <span className="text-blue-400 font-black text-xl">{map.booyahs} <span className="text-gray-500 text-sm">({map.avgBooyahs})</span></span>
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}`;

content = content.replace(/\{\/\* Desempenho por Mapa \*\/\}\n                \{bannerTeamPerfData\.maps && bannerTeamPerfData\.maps\.length > 0 && \([\s\S]*?<\/[dD]iv>\n                  <\/div>\n                \)\}/, mapUI);

// Adicionar pontos totais no cabeçalho da equipe também
content = content.replace(/<div className="flex gap-12 text-center">\n                     <div>\n                       <p className="text-gray-400 font-bold text-xl uppercase mb-1">Pontos<\/p>\n                       <p className="text-yellow-400 font-black text-5xl">\{bannerTeamPerfData\.ptsc\}<\/p>\n                     <\/div>/, `<div className="flex gap-12 text-center">
                     <div>
                       <p className="text-gray-400 font-bold text-xl uppercase mb-1">Pts Totais</p>
                       <p className="text-white font-black text-5xl">{bannerTeamPerfData.pts}</p>
                     </div>
                     <div>
                       <p className="text-gray-400 font-bold text-xl uppercase mb-1">Colocação</p>
                       <p className="text-yellow-400 font-black text-5xl">{bannerTeamPerfData.ptsc}</p>
                     </div>`);

fs.writeFileSync('pages/Banners.tsx', content);
