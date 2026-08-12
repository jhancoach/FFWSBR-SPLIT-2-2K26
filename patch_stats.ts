import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');

const targetStr = `
                                                 <td className="py-4 text-center text-gray-400 font-bold">{stat.matches}</td>
                                                 <td className="py-4 text-center text-white font-black text-xl">{stat.kills}</td>
                                                 <td className="py-4 text-center text-white font-black text-xl">{stat.dmg}</td>
                                                 <td className="py-4 text-center text-white font-black text-xl">{stat.knocks}</td>
`;

const replaceStr = `
                                                 <td className="py-4 text-center text-gray-400 font-bold">{stat.matches}</td>
                                                 <td className="py-4 text-center">
                                                     <div className="text-white font-black text-xl">{stat.kills}</div>
                                                     <div className="text-[10px] text-gray-500 font-mono mt-1">Média: {(stat.kills / (stat.matches || 1)).toFixed(2)}</div>
                                                 </td>
                                                 <td className="py-4 text-center">
                                                     <div className="text-white font-black text-xl">{stat.dmg}</div>
                                                     <div className="text-[10px] text-gray-500 font-mono mt-1">Média: {(stat.dmg / (stat.matches || 1)).toFixed(0)}</div>
                                                 </td>
                                                 <td className="py-4 text-center">
                                                     <div className="text-white font-black text-xl">{stat.knocks}</div>
                                                     <div className="text-[10px] text-gray-500 font-mono mt-1">Média: {(stat.knocks / (stat.matches || 1)).toFixed(2)}</div>
                                                 </td>
`;

if (content.includes(targetStr.trim())) {
    content = content.replace(targetStr.trim(), replaceStr.trim());
    fs.writeFileSync('pages/Players.tsx', content);
    console.log("Patched successfully");
} else {
    console.log("String not found");
}
