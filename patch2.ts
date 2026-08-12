import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');

const tableCode = `
                    {activeHabFilter !== 'All' && activeHabStats.length > 0 && (
                        <div className="bg-black/40 rounded-3xl p-6 border border-white/5 mb-8 overflow-hidden">
                             <h3 className="text-white font-black text-xl uppercase tracking-widest italic mb-6 flex items-center gap-3">
                                 <Activity size={24} className="text-yellow-500" />
                                 Desempenho com {activeHabFilter}
                             </h3>
                             <div className="overflow-x-auto">
                                 <table className="w-full text-left border-collapse min-w-[600px]">
                                     <thead>
                                         <tr className="border-b border-white/10">
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest pl-4">Jogador</th>
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Quedas</th>
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center text-yellow-500">Abates</th>
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center text-red-500">Dano</th>
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center text-blue-500">Deitados</th>
                                         </tr>
                                     </thead>
                                     <tbody>
                                         {activeHabStats.map((stat, idx) => (
                                             <tr key={stat.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                 <td className="py-4 pl-4">
                                                     <div className="flex items-center gap-3">
                                                         <span className="text-gray-500 font-black text-sm w-6 text-right">#{idx+1}</span>
                                                         <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center border border-yellow-500/30 shrink-0">
                                                             {stat.img ? <img src={stat.img} className="w-full h-full object-cover"/> : <User size={20} className="text-gray-500"/>}
                                                         </div>
                                                         <div>
                                                             <div className="text-white font-black text-sm uppercase">{stat.name}</div>
                                                             <div className="text-gray-500 text-[10px] font-bold uppercase">{stat.team}</div>
                                                         </div>
                                                     </div>
                                                 </td>
                                                 <td className="py-4 text-center text-gray-400 font-bold">{stat.matches}</td>
                                                 <td className="py-4 text-center text-white font-black text-xl">{stat.kills}</td>
                                                 <td className="py-4 text-center text-white font-black text-xl">{stat.dmg}</td>
                                                 <td className="py-4 text-center text-white font-black text-xl">{stat.knocks}</td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                        </div>
                    )}
`;

content = content.replace('<div className="space-y-4">\n                        {charactersData.length > 0 ? charactersData.map((char, idx) => (', tableCode + '\n                    <div className="space-y-4">\n                        {charactersData.length > 0 ? charactersData.map((char, idx) => (');
fs.writeFileSync('pages/Players.tsx', content);
