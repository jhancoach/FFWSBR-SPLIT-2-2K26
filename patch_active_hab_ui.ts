import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');

const targetStrHeader = `
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center text-blue-500 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleHabSort('knocks')}>
                                                 <div className="flex items-center justify-center gap-1">Deitados {activeHabSort.field === 'knocks' && (activeHabSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}</div>
                                             </th>
                                         </tr>
`;

const replaceStrHeader = `
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center text-blue-500 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleHabSort('knocks')}>
                                                 <div className="flex items-center justify-center gap-1">Deitados {activeHabSort.field === 'knocks' && (activeHabSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}</div>
                                             </th>
                                             {allSafeNames.map(safeName => (
                                                 <th key={safeName} className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleHabSort(\`safe_\${safeName}\`)}>
                                                     <div className="flex items-center justify-center gap-1">{safeName === 'OUT' ? 'OUT' : \`S\${safeName}\`} {activeHabSort.field === \`safe_\${safeName}\` && (activeHabSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}</div>
                                                 </th>
                                             ))}
                                         </tr>
`;

const targetStrCell = `
                                                 <td className="py-4 text-center">
                                                     <div className="text-white font-black text-xl">{stat.knocks}</div>
                                                     <div className="text-[10px] text-gray-500 font-mono mt-1">Média: {(stat.knocks / (stat.matches || 1)).toFixed(2)}</div>
                                                 </td>
                                             </tr>
`;

const replaceStrCell = `
                                                 <td className="py-4 text-center">
                                                     <div className="text-white font-black text-xl">{stat.knocks}</div>
                                                     <div className="text-[10px] text-gray-500 font-mono mt-1">Média: {(stat.knocks / (stat.matches || 1)).toFixed(2)}</div>
                                                 </td>
                                                 {allSafeNames.map(safeName => (
                                                     <td key={safeName} className="py-4 text-center">
                                                         <div className={\`text-sm font-black \${stat.safeKills?.[safeName] ? 'text-yellow-500' : 'text-gray-700'}\`}>{stat.safeKills?.[safeName] || '-'}</div>
                                                     </td>
                                                 ))}
                                             </tr>
`;

if (content.includes(targetStrHeader.trim()) && content.includes(targetStrCell.trim())) {
    content = content.replace(targetStrHeader.trim(), replaceStrHeader.trim());
    content = content.replace(targetStrCell.trim(), replaceStrCell.trim());
    console.log("Patched UI successfully");
} else {
    console.log("Could not find UI targets");
}

fs.writeFileSync('pages/Players.tsx', content);
