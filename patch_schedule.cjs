const fs = require('fs');
let code = fs.readFileSync('pages/Schedule.tsx', 'utf8');

// 1. Add state variable
if (!code.includes('selectedScheduleMap')) {
    code = code.replace(
        `const [search, setSearch] = useState<string>('');`,
        `const [search, setSearch] = useState<string>('');\n  const [selectedScheduleMap, setSelectedScheduleMap] = useState<string>('ALL');\n  const availableMaps = React.useMemo(() => {\n    const maps = new Set<string>();\n    if (data.details) {\n      data.details.forEach(d => {\n        if (d.MAPA) maps.add(normalize(String(d.MAPA)));\n      });\n    }\n    return Array.from(maps).sort();\n  }, [data.details]);`
    );
}

// 2. Add map filter UI and modify team list rendering
const targetList = `<div className="flex flex-col gap-3">
                  {OFFICIAL_SCHEDULE.filter(t => t.rounds[selectedRound]).map(t => {
                     const mapStyles = getTeamMapStyles(t.name, data.details);
                     return (
                      <div key={t.name} className="flex flex-col gap-2 p-3 bg-black/40 rounded-xl border border-white/5 shadow-md">
                        <span className={\`text-[12px] font-black uppercase flex items-center gap-1.5 \${t.isLoud ? 'text-yellow-400 drop-shadow-md' : 'text-emerald-400'}\`}>
                          {t.name} {t.isLoud && '★'}
                        </span>
                        
                        {mapStyles.length > 0 ? (
                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                             {mapStyles.map(m => (
                                <div key={m.mapName} className={\`flex flex-col gap-1 p-2 rounded-lg border \${m.characteristic.bg} \${m.characteristic.border} bg-opacity-50\`}>
                                   <span className="text-[9px] font-black text-white uppercase tracking-widest truncate">{m.mapName}</span>
                                   <div className={\`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest \${m.characteristic.color}\`}>
                                     {m.characteristic.label === 'Agressivo' && <Flame size={10} />}
                                     {m.characteristic.label === 'Equilibrado' && <Activity size={10} />}
                                     {m.characteristic.label === 'Posicional' && <Target size={10} />}
                                     {m.characteristic.label}
                                   </div>
                                </div>
                             ))}
                           </div>
                        ) : (
                           <span className="text-[9px] text-gray-500 font-bold uppercase italic">Sem dados registrados</span>
                        )}
                      </div>
                     );
                  })}
                </div>`;

const replacementList = `<div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-800 mb-2">
                    <button
                      onClick={() => setSelectedScheduleMap('ALL')}
                      className={\`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all \${
                        selectedScheduleMap === 'ALL'
                          ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }\`}
                    >
                      Todos os Mapas
                    </button>
                    {availableMaps.map(map => (
                      <button
                        key={map}
                        onClick={() => setSelectedScheduleMap(map)}
                        className={\`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all \${
                          selectedScheduleMap === map
                            ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }\`}
                      >
                        {map}
                      </button>
                    ))}
                  </div>
                  {OFFICIAL_SCHEDULE.filter(t => t.rounds[selectedRound]).map(t => {
                     let mapStyles = getTeamMapStyles(t.name, data.details);
                     
                     if (selectedScheduleMap !== 'ALL') {
                         mapStyles = mapStyles.filter(m => normalize(m.mapName) === selectedScheduleMap);
                     }
                     
                     return (
                      <div key={t.name} className="flex flex-col gap-2 p-3 bg-black/40 rounded-xl border border-white/5 shadow-md">
                        <span className={\`text-[12px] font-black uppercase flex items-center gap-1.5 \${t.isLoud ? 'text-yellow-400 drop-shadow-md' : 'text-emerald-400'}\`}>
                          {t.name} {t.isLoud && '★'}
                        </span>
                        
                        {mapStyles.length > 0 ? (
                           <div className={\`grid \${selectedScheduleMap === 'ALL' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'} gap-2\`}>
                             {mapStyles.map(m => (
                                <div key={m.mapName} className={\`flex \${selectedScheduleMap === 'ALL' ? 'flex-col' : 'items-center justify-between'} gap-1 p-2 rounded-lg border \${m.characteristic.bg} \${m.characteristic.border} bg-opacity-50\`}>
                                   <span className="text-[10px] font-black text-white uppercase tracking-widest truncate">{m.mapName}</span>
                                   <div className={\`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest \${m.characteristic.color}\`}>
                                     {m.characteristic.label === 'Agressivo' && <Flame size={12} />}
                                     {m.characteristic.label === 'Equilibrado' && <Activity size={12} />}
                                     {m.characteristic.label === 'Posicional' && <Target size={12} />}
                                     {m.characteristic.label}
                                   </div>
                                </div>
                             ))}
                           </div>
                        ) : (
                           <span className="text-[9px] text-gray-500 font-bold uppercase italic">Sem dados registrados neste mapa</span>
                        )}
                      </div>
                     );
                  })}
                </div>`;

if (code.includes('const mapStyles = getTeamMapStyles(t.name, data.details);')) {
    code = code.replace(targetList, replacementList);
    fs.writeFileSync('pages/Schedule.tsx', code);
    console.log("Schedule updated successfully!");
} else {
    console.log("Target not found!");
}
