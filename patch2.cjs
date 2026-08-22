const fs = require('fs');
let code = fs.readFileSync('pages/Schedule.tsx', 'utf8');

const target = `<div className="flex flex-wrap gap-1.5">
                  {OFFICIAL_SCHEDULE.filter(t => t.rounds[selectedRound]).map(t => (
                    <span 
                      key={t.name}
                      className={\`px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase flex items-center gap-1.5 \${
                        t.isLoud 
                          ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 font-black' 
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      }\`}
                    >
                      {t.name} {t.isLoud && '★'}
                    </span>
                  ))}
                </div>`;

const replacement = `<div className="flex flex-col gap-3">
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

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('pages/Schedule.tsx', code);
    console.log("Patched successfully!");
} else {
    console.log("Target not found!");
}
