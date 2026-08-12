import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');

const targetStr = `
                                                 <td className="py-4 text-center">
                                                     <div className="text-white font-black text-xl">{stat.kills}</div>
                                                     <div className="text-[10px] text-gray-500 font-mono mt-1">Média: {(stat.kills / (stat.matches || 1)).toFixed(2)}</div>
                                                 </td>
`;

const replaceStr = `
                                                 <td className="py-4 text-center">
                                                     <div className="text-white font-black text-xl">{stat.kills}</div>
                                                     <div className="text-[10px] text-gray-500 font-mono mt-1">Média: {(stat.kills / (stat.matches || 1)).toFixed(2)}</div>
                                                     <div className="text-[9px] text-blue-400 font-black uppercase tracking-widest mt-0.5" title="Contribuição para os abates do time nestas quedas">
                                                         {stat.teamTotalKills > 0 ? ((stat.kills / stat.teamTotalKills) * 100).toFixed(1) : '0.0'}% TIME
                                                     </div>
                                                 </td>
`;

if (content.includes(targetStr.trim())) {
    content = content.replace(targetStr.trim(), replaceStr.trim());
    console.log("Patched contribution successfully");
} else {
    console.log("Could not find contribution target");
}

fs.writeFileSync('pages/Players.tsx', content);
