const fs = require('fs');
const content = fs.readFileSync('pages/Banners.tsx', 'utf-8');

const startIdx = content.indexOf('const FifaCard =');
const endIdx = content.indexOf('const Banners: React.FC<BannersProps> =');

if (startIdx !== -1 && endIdx !== -1) {
    const newFifa = `const FifaCard = ({ data, mode, selectedId }: { data: any, mode: 'player' | 'team', selectedId: string }) => {
  const [isFlipped, setIsFlipped] = React.useState(false);

  const { stats, topWeapon, mapStats, safeStats, info } = React.useMemo(() => {
    if (!selectedId) {
      return { stats: { kills: 0, matches: 0, damage: 0, hs: 0, knocks: 0, assists: 0, mvp: 0, matchesWithKills: 0, matchesZeroKills: 0, killContribution: '0' }, topWeapon: 'NENHUMA', mapStats: [], safeStats: [], info: { name: '', subtitle: '', img: '', teamImg: '', weaponImg: '', role: '' } };
    }

    let kills = 0, matches = 0, damage = 0, hs = 0, knocks = 0, assists = 0, mvp = 0;
    let matchesWithKills = 0, matchesZeroKills = 0;
    const mapCount: Record<string, { kills: number, matches: number }> = {};
    const safeCount: Record<string, number> = {};
    const weaponCount: Record<string, number> = {};

    let img = '';
    let name = selectedId;
    let subtitle = '';
    let teamImg = '';
    let role = '';
    let killContribution = '0';

    if (mode === 'player') {
      const pDim = data.playersDimension?.find((d: any) => d.Name === selectedId);
      img = pDim ? pDim.Img : '';
      role = pDim ? pDim.Funcao || '' : '';
      
      let pTeam = '';
      data.players.forEach((p: any) => {
        if (p.PLAYER === selectedId) {
          const k = parseNumber(p.Abates);
          kills += k;
          damage += parseNumber(p.Dano);
          hs += parseNumber(p.HS);
          knocks += parseNumber(p.Deitados);
          assists += parseNumber(p.Assistencias);
          mvp += parseNumber(p.MVP);
          matches += 1;
          pTeam = p.TIME;

          if (k > 0) matchesWithKills++;
          else matchesZeroKills++;
        }
      });
      subtitle = pTeam;
      if (pTeam) {
          teamImg = findTeamLogo(pTeam, data.teamsReference) || '';
      }

      let teamTotalKills = 0;
      data.players.forEach((p: any) => {
          if (p.TIME === pTeam) {
              teamTotalKills += parseNumber(p.Abates);
          }
      });
      killContribution = teamTotalKills > 0 ? ((kills / teamTotalKills) * 100).toFixed(1) : '0';

      data.killFeed.forEach((k: any) => {
        if (k.PLAYER === selectedId) {
          if (k.ARMA) weaponCount[k.ARMA] = (weaponCount[k.ARMA] || 0) + 1;
          if (k.MAPA) {
            const m = formatMapName(k.MAPA);
            if (!mapCount[m]) mapCount[m] = { kills: 0, matches: 0 };
            mapCount[m].kills += 1;
          }
          if (k.SAFE) safeCount[k.SAFE] = (safeCount[k.SAFE] || 0) + 1;
        }
      });

      data.details.forEach((d: any) => {
        if (d.TIME === pTeam && d.MAPA) {
            const m = formatMapName(d.MAPA);
            if (!mapCount[m]) mapCount[m] = { kills: 0, matches: 0 };
            mapCount[m].matches += 1;
        }
      });

    } else {
      const tDim = data.teamsReference?.find((t: any) => t.name === selectedId);
      img = tDim ? tDim.logo : '';
      teamImg = img;

      data.details.forEach((d: any) => {
        if (d.TIME === selectedId) {
          kills += parseNumber(d.ABTS);
          matches += 1;
          if (d.MAPA) {
            const m = formatMapName(d.MAPA);
            if (!mapCount[m]) mapCount[m] = { kills: 0, matches: 0 };
            mapCount[m].matches += 1;
          }
        }
      });
      data.players.forEach((p: any) => {
        if (p.TIME === selectedId) {
          damage += parseNumber(p.Dano);
          hs += parseNumber(p.HS);
          knocks += parseNumber(p.Deitados);
          assists += parseNumber(p.Assistencias);
          mvp += parseNumber(p.MVP);
        }
      });

      data.killFeed.forEach((k: any) => {
        const pTeam = data.players.find((p: any) => p.PLAYER === k.PLAYER)?.TIME;
        if (pTeam === selectedId) {
          if (k.ARMA) weaponCount[k.ARMA] = (weaponCount[k.ARMA] || 0) + 1;
          if (k.MAPA) {
            const m = formatMapName(k.MAPA);
            if (!mapCount[m]) mapCount[m] = { kills: 0, matches: 0 };
            mapCount[m].kills += 1;
          }
          if (k.SAFE) safeCount[k.SAFE] = (safeCount[k.SAFE] || 0) + 1;
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

    return {
      stats: { kills, matches, damage, hs, knocks, assists, mvp, matchesWithKills, matchesZeroKills, killContribution },
      topWeapon,
      mapStats: Object.entries(mapCount).map(([k, v]) => ({ name: k, ...v })).sort((a,b) => b.kills - a.kills),
      safeStats: Object.entries(safeCount).map(([k, v]) => ({ name: k, kills: v })).sort((a,b) => parseInt(a.name) - parseInt(b.name)),
      info: { name, subtitle, img, teamImg, weaponImg, role }
    };
  }, [data, mode, selectedId]);

  if (!selectedId) {
    return <div className="text-gray-500 font-bold uppercase tracking-widest h-96 flex items-center justify-center">Selecione um {mode === 'player' ? 'jogador' : 'time'} para gerar a carta.</div>;
  }

  // Adjust card height slightly if we are adding more info
  return (
    <div className="flex justify-center my-8">
      <div 
        className="relative w-[360px] h-[550px] cursor-pointer" 
        style={{ perspective: '1000px' }} 
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className={\`w-full h-full relative transition-transform duration-700\`} 
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front */}
          <div 
            className="absolute w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-600 via-yellow-700 to-black p-4 border-[3px] border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.3)] flex flex-col items-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
             <div className="flex w-full items-start justify-between px-2 mb-2">
                 {/* Team Badge Top Left */}
                 <div className="w-12 h-12 bg-black rounded-lg border-2 border-yellow-400 shadow-lg p-1 overflow-hidden flex items-center justify-center">
                    {info.teamImg ? (
                        <img src={info.teamImg} alt={info.subtitle} className="w-full h-full object-contain" />
                    ) : (
                        <span className="text-xs font-bold text-gray-500">{info.subtitle.substring(0,3)}</span>
                    )}
                 </div>

                 {/* Role Top Right */}
                 {mode === 'player' && info.role && (
                    <div className="bg-black/60 border border-yellow-400/50 rounded-md px-2 py-1">
                        <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{info.role}</span>
                    </div>
                 )}
             </div>

             <div className="relative w-32 h-32 rounded-full bg-black border-4 border-yellow-400 shadow-xl overflow-visible mb-2 flex items-center justify-center p-1 z-10 -mt-8">
                {info.img ? (
                    <img src={info.img} alt={info.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                    <span className="text-4xl font-black text-gray-500">{info.name.substring(0,2)}</span>
                )}
             </div>
             
             <h2 className="text-[28px] font-black italic text-white uppercase tracking-tighter shadow-black drop-shadow-md text-center leading-tight max-w-[280px] truncate">{info.name}</h2>
             
             {mode === 'player' && (
                 <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-full px-3 py-0.5 mt-1 mb-2">
                     <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-widest">
                         ⚡ {stats.killContribution}% Kills do Time
                     </span>
                 </div>
             )}

             {!info.subtitle && <div className="h-2" />}

             {/* Adjust Grid for Stats including Partidas (Matches) */}
             <div className="grid grid-cols-3 gap-2 w-full mt-1">
                 <div className="bg-black/40 p-1.5 rounded-xl border border-yellow-400/30 text-center flex flex-col justify-center">
                    <span className="block text-xl font-black text-white italic leading-none">{stats.kills}</span>
                    <span className="text-[8px] uppercase font-bold text-yellow-300 mt-1">Abates</span>
                 </div>
                 <div className="bg-black/40 p-1.5 rounded-xl border border-yellow-400/30 text-center flex flex-col justify-center">
                    <span className="block text-xl font-black text-white italic leading-none">{stats.matches > 0 ? (stats.kills / stats.matches).toFixed(2) : 0}</span>
                    <span className="text-[8px] uppercase font-bold text-yellow-300 mt-1">Média/Q</span>
                 </div>
                 <div className="bg-black/40 p-1.5 rounded-xl border border-yellow-400/30 text-center flex flex-col justify-center">
                    <span className="block text-xl font-black text-white italic leading-none">{stats.matches}</span>
                    <span className="text-[8px] uppercase font-bold text-yellow-300 mt-1">Partidas</span>
                 </div>
                 <div className="bg-black/40 p-1.5 rounded-xl border border-yellow-400/30 text-center flex flex-col justify-center">
                    <span className="block text-lg font-black text-white italic leading-none">{stats.damage.toLocaleString('pt-BR')}</span>
                    <span className="text-[8px] uppercase font-bold text-yellow-300 mt-1">Dano</span>
                 </div>
                 <div className="bg-black/40 p-1.5 rounded-xl border border-yellow-400/30 text-center flex flex-col justify-center">
                    <span className="block text-lg font-black text-white italic leading-none">{stats.hs}</span>
                    <span className="text-[8px] uppercase font-bold text-yellow-300 mt-1">HS</span>
                 </div>
                 <div className="bg-black/40 p-1.5 rounded-xl border border-yellow-400/30 text-center flex flex-col justify-center">
                    <span className="block text-lg font-black text-white italic leading-none">{stats.assists}</span>
                    <span className="text-[8px] uppercase font-bold text-yellow-300 mt-1">Assist.</span>
                 </div>
             </div>
             
             {mode === 'player' ? (
               <div className="grid grid-cols-3 gap-2 w-full mt-2">
                   <div className="bg-black/40 p-1 rounded-xl border border-yellow-400/30 text-center flex flex-col justify-center">
                       <span className="block text-sm font-black text-white italic leading-none">{stats.knocks}</span>
                       <span className="text-[8px] uppercase font-bold text-yellow-300 mt-0.5">Deitados</span>
                   </div>
                   <div className="bg-black/40 p-1 rounded-xl border border-green-500/40 text-center flex flex-col justify-center">
                       <span className="block text-sm font-black text-green-400 italic leading-none">{stats.matchesWithKills}</span>
                       <span className="text-[8px] uppercase font-bold text-green-300 mt-0.5">Q. c/ Kill</span>
                   </div>
                   <div className="bg-black/40 p-1 rounded-xl border border-red-500/40 text-center flex flex-col justify-center">
                       <span className="block text-sm font-black text-red-400 italic leading-none">{stats.matchesZeroKills}</span>
                       <span className="text-[8px] uppercase font-bold text-red-300 mt-0.5">Q. Zerada</span>
                   </div>
               </div>
             ) : (
                 <div className="w-full mt-2 bg-black/40 p-1.5 rounded-xl border border-yellow-400/30 text-center flex items-center justify-center gap-2">
                     <span className="block text-xl font-black text-white italic leading-none">{stats.knocks}</span>
                     <span className="text-[9px] uppercase font-bold text-yellow-300">Deitados</span>
                 </div>
             )}

             <div className="mt-auto pt-2 text-center">
                <span className="text-[9px] text-yellow-400/60 uppercase font-black tracking-widest">Clique para virar</span>
             </div>
          </div>

          {/* Back */}
          <div 
            className="absolute w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-black to-black p-4 border-[3px] border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.3)] flex flex-col"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
             <h3 className="text-xl font-black text-yellow-400 italic uppercase border-b border-yellow-400/30 pb-2 mb-3 text-center">Estatísticas</h3>
             
             <div className="flex-1 overflow-y-auto pr-1 space-y-3 no-scrollbar">
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><TargetIcon size={12}/> Arma Favorita</h4>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-2 flex items-center justify-center gap-3">
                        {info.weaponImg && (
                           <img src={info.weaponImg} alt={topWeapon} className="h-10 w-auto object-contain drop-shadow-md" />
                        )}
                        <span className="text-lg font-black text-white italic uppercase">{topWeapon}</span>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><MapIcon size={12}/> Por Mapa</h4>
                    <div className="space-y-1">
                        {mapStats.map(m => (
                            <div key={m.name} className="flex items-center justify-between bg-white/5 rounded-lg p-1.5 border border-white/5">
                                <span className="text-xs font-bold text-white uppercase">{m.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-yellow-400 font-black">{m.kills} <span className="text-[9px] text-gray-500">KILLS</span></span>
                                    <span className="text-[9px] text-gray-400 font-bold w-12 text-right">AVG {m.matches > 0 ? (m.kills/m.matches).toFixed(1) : 0}</span>
                                </div>
                            </div>
                        ))}
                        {mapStats.length === 0 && <span className="text-xs text-gray-500">Sem dados</span>}
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Shield size={12}/> Abates por Safe</h4>
                    <div className="flex flex-wrap gap-1">
                        {safeStats.map(s => (
                            <div key={s.name} className="flex-1 min-w-[28%] bg-white/5 rounded-lg p-1 border border-white/5 flex flex-col items-center">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">S{s.name.replace(/^S/i, '')}</span>
                                <span className="text-sm font-black text-yellow-400 leading-none">{s.kills}</span>
                            </div>
                        ))}
                        {safeStats.length === 0 && <span className="text-xs text-gray-500">Sem dados</span>}
                    </div>
                </div>
             </div>

             <div className="mt-3 pt-2 border-t border-white/10 text-center">
                <span className="text-[9px] text-yellow-400/60 uppercase font-black tracking-widest">Clique para virar</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

    const newContent = content.substring(0, startIdx) + newFifa + '\n\n' + content.substring(endIdx);
    fs.writeFileSync('pages/Banners.tsx', newContent);
}
