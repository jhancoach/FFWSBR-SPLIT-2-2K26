const fs = require('fs');
let code = fs.readFileSync('pages/Schedule.tsx', 'utf8');

const target1 = `const getTeamMapStyles = (teamName: string, details: any[]) => {`;

const replacement1 = `const getTeamRoundLiveStyle = (teamName: string, roundNum: number, details: any[]) => {
    const normName = normalize(teamName);
    const roundMatches = details.filter((d: any) => {
        if (!d.RD) return false;
        const num = parseInt(String(d.RD).replace(/\\D/g, ''), 10);
        const nameMatches = normalize(d.TIME) === normName || normalize(d.TIME).includes(normName) || normName.includes(normalize(d.TIME));
        return num === roundNum && nameMatches;
    });
    
    if (roundMatches.length === 0) return null;
    
    let totalPts = 0;
    let totalAbates = 0;
    let totalPtsColocacao = 0;
    
    roundMatches.forEach((m: any) => {
        const abts = typeof m.ABTS === 'number' ? m.ABTS : parseFloat(String(m.ABTS || '0').replace(',', '.'));
        const ptsc = typeof m.PTSC === 'number' ? m.PTSC : parseFloat(String(m.PTSC || '0').replace(',', '.'));
        const pts = typeof m.PTS === 'number' ? m.PTS : parseFloat(String(m.PTS || '0').replace(',', '.'));
        
        totalAbates += isNaN(abts) ? 0 : abts;
        totalPtsColocacao += isNaN(ptsc) ? 0 : ptsc;
        totalPts += isNaN(pts) ? 0 : pts;
    });
    
    const percentAbts = totalPts > 0 ? Math.round((totalAbates / totalPts) * 100) : 0;
    const percentPos = totalPts > 0 ? Math.round((totalPtsColocacao / totalPts) * 100) : 0;
    
    const characteristic = getTeamCharacteristic(percentAbts, percentPos);
    
    return {
        totalMatches: roundMatches.length,
        totalPts,
        totalAbates,
        totalPtsColocacao,
        percentAbts,
        percentPos,
        characteristic
    };
};

const getTeamMapStyles = (teamName: string, details: any[]) => {`;

if (code.includes(target1) && !code.includes('getTeamRoundLiveStyle')) {
    code = code.replace(target1, replacement1);
}

const target2 = `                     let mapStyles = getTeamMapStyles(t.name, data.details);
                     
                     if (selectedScheduleMap !== 'ALL') {
                         mapStyles = mapStyles.filter(m => normalize(m.mapName) === selectedScheduleMap);
                     }
                     
                     return (
                      <div key={t.name} className="flex flex-col gap-2 p-3 bg-black/40 rounded-xl border border-white/5 shadow-md">
                        <span className={\`text-[12px] font-black uppercase flex items-center gap-1.5 \${t.isLoud ? 'text-yellow-400 drop-shadow-md' : 'text-emerald-400'}\`}>
                          {t.name} {t.isLoud && '★'}
                        </span>
                        
                        {mapStyles.length > 0 ? (`;

const replacement2 = `                     let mapStyles = getTeamMapStyles(t.name, data.details);
                     const liveRoundStats = getTeamRoundLiveStyle(t.name, selectedRound, data.details);
                     
                     if (selectedScheduleMap !== 'ALL') {
                         mapStyles = mapStyles.filter(m => normalize(m.mapName) === selectedScheduleMap);
                     }
                     
                     return (
                      <div key={t.name} className="flex flex-col gap-2 p-3 bg-black/40 rounded-xl border border-white/5 shadow-md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                           <span className={\`text-[12px] font-black uppercase flex items-center gap-1.5 \${t.isLoud ? 'text-yellow-400 drop-shadow-md' : 'text-emerald-400'}\`}>
                             {t.name} {t.isLoud && '★'}
                           </span>
                           {liveRoundStats ? (
                               <div className={\`flex items-center gap-2 px-2 py-1 rounded-lg border \${liveRoundStats.characteristic.bg} \${liveRoundStats.characteristic.border} text-[9px] font-black uppercase tracking-widest \${liveRoundStats.characteristic.color}\`}>
                                  {liveRoundStats.characteristic.label === 'Agressivo' && <Flame size={12} />}
                                  {liveRoundStats.characteristic.label === 'Equilibrado' && <Activity size={12} />}
                                  {liveRoundStats.characteristic.label === 'Posicional' && <Target size={12} />}
                                  <span className="flex items-center gap-1">
                                      DESEMPENHO ATUAL: {liveRoundStats.characteristic.label} ({liveRoundStats.totalPts} Pts / {liveRoundStats.totalAbates} Kills)
                                  </span>
                               </div>
                           ) : (
                               <span className="px-2 py-1 rounded-lg border border-gray-800 bg-black/50 text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                                  Aguardando quedas...
                               </span>
                           )}
                        </div>
                        
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                            Histórico de Estilo por Mapa:
                        </div>
                        {mapStyles.length > 0 ? (`;

if (code.includes('let mapStyles = getTeamMapStyles(t.name, data.details);')) {
    code = code.replace(target2, replacement2);
}

fs.writeFileSync('pages/Schedule.tsx', code);
console.log("Applied live round stats successfully!");
