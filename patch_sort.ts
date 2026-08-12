import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');

// 1. Add state for activeHabSort
const stateCode = `  const [activeHabSort, setActiveHabSort] = useState<{field: string, direction: 'asc'|'desc'}>({ field: 'kills', direction: 'desc' });
`;
content = content.replace("const [activeHabFilter, setActiveHabFilter] = useState<string>('All');", "const [activeHabFilter, setActiveHabFilter] = useState<string>('All');\n" + stateCode);

// 2. Add handleHabSort function
const sortFuncCode = `
  const handleHabSort = (field: string) => {
      setActiveHabSort(prev => ({
          field,
          direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
      }));
  };
`;
content = content.replace("const handleRankingSort = (field: string) => {", sortFuncCode + "\n  const handleRankingSort = (field: string) => {");

// 3. Update the sorting in activeHabStats
const oldReturn = "return Array.from(playerMap.values()).sort((a,b) => b.kills - a.kills || b.dmg - a.dmg);";
const newReturn = `
    const arr = Array.from(playerMap.values());
    arr.sort((a, b) => {
        let valA = a[activeHabSort.field as keyof typeof a];
        let valB = b[activeHabSort.field as keyof typeof b];
        
        // Handling edge cases where val is a string (like name or team)
        if (typeof valA === 'string' && typeof valB === 'string') {
             return activeHabSort.direction === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
        }
        
        // Number comparison
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
        return activeHabSort.direction === 'desc' ? valB - valA : valA - valB;
    });
    return arr;
`;
content = content.replace(oldReturn, newReturn);
// Since activeHabStats needs the sort state as a dependency:
content = content.replace("}, [data.characters, data.players, activeHabFilter, filters, data.teamsReference]);", "}, [data.characters, data.players, activeHabFilter, filters, data.teamsReference, activeHabSort]);");


// 4. Update table headers
const oldThCode = `
                                         <tr className="border-b border-white/10">
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest pl-4">Jogador</th>
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Quedas</th>
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center text-yellow-500">Abates</th>
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center text-red-500">Dano</th>
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center text-blue-500">Deitados</th>
                                         </tr>
`;

const newThCode = `
                                         <tr className="border-b border-white/10">
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest pl-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleHabSort('name')}>
                                                 <div className="flex items-center gap-1">Jogador {activeHabSort.field === 'name' && (activeHabSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}</div>
                                             </th>
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleHabSort('matches')}>
                                                 <div className="flex items-center justify-center gap-1">Quedas {activeHabSort.field === 'matches' && (activeHabSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}</div>
                                             </th>
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center text-yellow-500 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleHabSort('kills')}>
                                                 <div className="flex items-center justify-center gap-1">Abates {activeHabSort.field === 'kills' && (activeHabSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}</div>
                                             </th>
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center text-red-500 cursor-pointer hover:text-red-400 transition-colors" onClick={() => handleHabSort('dmg')}>
                                                 <div className="flex items-center justify-center gap-1">Dano {activeHabSort.field === 'dmg' && (activeHabSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}</div>
                                             </th>
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center text-blue-500 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleHabSort('knocks')}>
                                                 <div className="flex items-center justify-center gap-1">Deitados {activeHabSort.field === 'knocks' && (activeHabSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}</div>
                                             </th>
                                         </tr>
`;

content = content.replace(oldThCode, newThCode);

fs.writeFileSync('pages/Players.tsx', content);
console.log("Patched successfully");
