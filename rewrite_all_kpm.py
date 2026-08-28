import os

with open('components/TeamKpmAnalysis.tsx', 'r') as f:
    content = f.read()

# Make sure tableMode exists
if "tableMode" not in content:
    content = content.replace(
        "const [mapFilter, setMapFilter] = useState<string>('ALL');",
        "const [mapFilter, setMapFilter] = useState<string>('ALL');\n    const [tableMode, setTableMode] = useState<'safe' | 'map'>('safe');"
    )

# Make sure optgroup logic exists in sorting
if "ber_kpm" not in content:
    sort_old = """        results.sort((a, b) => {
            if (sortBy === 'global_kpm') return b.globalKpm - a.globalKpm;
            if (sortBy === 'total_kills') return b.totalKills - a.totalKills;
            if (sortBy === 's1_kpm') return b.kpmBySafe[1] - a.kpmBySafe[1];
            if (sortBy === 's2_kpm') return b.kpmBySafe[2] - a.kpmBySafe[2];
            if (sortBy === 's3_kpm') return b.kpmBySafe[3] - a.kpmBySafe[3];
            if (sortBy === 's4_kpm') return b.kpmBySafe[4] - a.kpmBySafe[4];
            if (sortBy === 's5_kpm') return b.kpmBySafe[5] - a.kpmBySafe[5];
            if (sortBy === 's6_kpm') return b.kpmBySafe[6] - a.kpmBySafe[6];
            if (sortBy === 's7_kpm') return b.s7_8_kpm - a.s7_8_kpm;
            return b.globalKpm - a.globalKpm;
        });"""
    sort_new = """        results.sort((a, b) => {
            if (sortBy === 'global_kpm') return b.globalKpm - a.globalKpm;
            if (sortBy === 'total_kills') return b.totalKills - a.totalKills;
            if (sortBy === 's1_kpm') return b.kpmBySafe[1] - a.kpmBySafe[1];
            if (sortBy === 's2_kpm') return b.kpmBySafe[2] - a.kpmBySafe[2];
            if (sortBy === 's3_kpm') return b.kpmBySafe[3] - a.kpmBySafe[3];
            if (sortBy === 's4_kpm') return b.kpmBySafe[4] - a.kpmBySafe[4];
            if (sortBy === 's5_kpm') return b.kpmBySafe[5] - a.kpmBySafe[5];
            if (sortBy === 's6_kpm') return b.kpmBySafe[6] - a.kpmBySafe[6];
            if (sortBy === 's7_kpm') return b.s7_8_kpm - a.s7_8_kpm;
            if (sortBy === 'ber_kpm') return (b.kpmByMap['BER']||0) - (a.kpmByMap['BER']||0);
            if (sortBy === 'pur_kpm') return (b.kpmByMap['PUR']||0) - (a.kpmByMap['PUR']||0);
            if (sortBy === 'kal_kpm') return (b.kpmByMap['KAL']||0) - (a.kpmByMap['KAL']||0);
            if (sortBy === 'nt_kpm') return (b.kpmByMap['NT']||0) - (a.kpmByMap['NT']||0);
            if (sortBy === 'sol_kpm') return (b.kpmByMap['SOL']||0) - (a.kpmByMap['SOL']||0);
            return b.globalKpm - a.globalKpm;
        });"""
    content = content.replace(sort_old, sort_new)

# Add optgroup to the top filter
select_old = """                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-black/60 border border-gray-700 text-xs text-white rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500 transition-colors font-bold cursor-pointer"
                        >
                            <option value="global_kpm">KPM Global (Maior)</option>
                            <option value="total_kills">Total Kills (Maior)</option>
                            <option value="s1_kpm">Safe 1 KPM (Maior)</option>
                            <option value="s2_kpm">Safe 2 KPM (Maior)</option>
                            <option value="s3_kpm">Safe 3 KPM (Maior)</option>
                            <option value="s4_kpm">Safe 4 KPM (Maior)</option>
                            <option value="s5_kpm">Safe 5 KPM (Maior)</option>
                            <option value="s6_kpm">Safe 6 KPM (Maior)</option>
                            <option value="s7_kpm">Safe 7+ KPM (Maior)</option>
                        </select>"""
select_new = """                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-black/60 border border-gray-700 text-xs text-white rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500 transition-colors font-bold cursor-pointer"
                        >
                            <option value="global_kpm">KPM Global (Maior)</option>
                            <option value="total_kills">Total Kills (Maior)</option>
                            <optgroup label="Por Fase">
                                <option value="s1_kpm">Safe 1 KPM (Maior)</option>
                                <option value="s2_kpm">Safe 2 KPM (Maior)</option>
                                <option value="s3_kpm">Safe 3 KPM (Maior)</option>
                                <option value="s4_kpm">Safe 4 KPM (Maior)</option>
                                <option value="s5_kpm">Safe 5 KPM (Maior)</option>
                                <option value="s6_kpm">Safe 6 KPM (Maior)</option>
                                <option value="s7_kpm">Safe 7+ KPM (Maior)</option>
                            </optgroup>
                            <optgroup label="Por Mapa">
                                <option value="ber_kpm">Bermuda KPM (Maior)</option>
                                <option value="pur_kpm">Purgatório KPM (Maior)</option>
                                <option value="kal_kpm">Kalahari KPM (Maior)</option>
                                <option value="nt_kpm">Nova Terra KPM (Maior)</option>
                                <option value="sol_kpm">Solara KPM (Maior)</option>
                            </optgroup>
                        </select>"""
content = content.replace(select_old, select_new)

# Now, we rewrite the entire table logic block.
import re
# find the line with "TABELA DE KPM"
idx = content.find('TABELA DE KPM')
if idx != -1:
    # Find the beginning of this div container
    div_idx = content.rfind('<div className="bg-[#1a1a1a] rounded-3xl p-6 md:p-8 border border-gray-800 shadow-xl overflow-hidden flex flex-col">', 0, idx)
    if div_idx != -1:
        # we will replace everything from div_idx to the end, then add the closing tags
        # but wait, let's just use string splitting
        top_content = content[:div_idx]
        
        table_html = """        <div className="bg-[#1a1a1a] rounded-3xl p-6 md:p-8 border border-gray-800 shadow-xl overflow-hidden flex flex-col">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                    <h3 className="text-white font-black text-sm uppercase italic tracking-widest flex items-center gap-2">
                        <Activity size={20} className="text-emerald-500" />
                        TABELA DE KPM DETALHADA
                    </h3>
                    
                    <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-1">
                        <button 
                            onClick={() => setTableMode('safe')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tableMode === 'safe' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            POR SAFE
                        </button>
                        <button 
                            onClick={() => setTableMode('map')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tableMode === 'map' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            POR MAPA
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto whitespace-nowrap min-w-[1000px]">
                        <thead className="bg-black/80 text-[10px] text-gray-500 uppercase font-black tracking-widest border-b-2 border-gray-800">
                            <tr>
                                <th className="px-4 py-3 w-10 text-center">#</th>
                                <th className="px-4 py-3">Equipe</th>
                                <th className="px-4 py-3 text-center border-r border-white/5" title="Partidas Analisadas">Partidas</th>
                                
                                {tableMode === 'safe' ? (
                                    <>
                                        {[1, 2, 3, 4, 5, 6].map(s => (
                                            <th key={s} className="px-4 py-3 text-center border-r border-white/5">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-white">SAFE {s}</span>
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-center border-r border-white/5">
                                            <div className="flex flex-col items-center">
                                                <span className="text-white">SAFE 7+</span>
                                            </div>
                                        </th>
                                    </>
                                ) : (
                                    <>
                                        {['BER', 'PUR', 'KAL', 'NT', 'SOL'].map(m => (
                                            <th key={m} className="px-4 py-3 text-center border-r border-white/5">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-white" style={{color: MAP_COLORS[m]}}>{m}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </>
                                )}

                                <th className="px-4 py-3 text-center bg-emerald-500/5">
                                    <div className="flex flex-col items-center">
                                        <span className="text-emerald-400">GLOBAL</span>
                                        <span className="text-[8px] text-gray-600">KPM</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/40 text-xs font-medium">
                            {displayData.map((team, tIdx) => {
                                const isSelected = selectedTeam && normalize(selectedTeam) === team.name;
                                return (
                                    <tr 
                                        key={team.name} 
                                        className={`transition-colors group ${isSelected ? 'bg-emerald-900/20' : 'hover:bg-white/5 cursor-pointer'}`}
                                        onClick={() => !isSelected && onSelectTeam(team.name)}
                                    >
                                        <td className="px-4 py-3 text-center text-gray-500 font-mono text-[10px]">
                                            {tIdx + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-7 h-7 bg-black rounded-lg border p-0.5 flex-shrink-0 flex items-center justify-center shadow-lg transition-colors ${isSelected ? 'border-emerald-500' : 'border-gray-800 group-hover:border-emerald-500/50'}`}>
                                                    {team.image ? (
                                                        <img src={team.image} alt={team.name} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Shield size={14} className="text-gray-600" />
                                                    )}
                                                </div>
                                                <span className={`font-black uppercase italic tracking-wider transition-colors ${isSelected ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'}`}>
                                                    {team.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-gray-500 border-r border-white/5">
                                            {team.matchesPlayed}
                                        </td>
                                        
                                        {tableMode === 'safe' ? (
                                            <>
                                                {[1, 2, 3, 4, 5, 6].map(s => (
                                                    <td key={s} className="px-4 py-3 text-center border-r border-white/5">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className="text-[10px] text-gray-500 font-bold w-4 text-right">{team.killsBySafe[s] || 0}</span>
                                                            <span className="text-[10px] text-gray-700">|</span>
                                                            <span className={`font-black text-sm w-8 text-left ${team.kpmBySafe[s] > 0.5 ? 'text-amber-400' : team.kpmBySafe[s] > 0.2 ? 'text-white' : 'text-gray-600'}`}>
                                                                {team.kpmBySafe[s].toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                ))}

                                                <td className="px-4 py-3 text-center border-r border-white/5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="text-[10px] text-gray-500 font-bold w-4 text-right">{team.s7_8_kills || 0}</span>
                                                        <span className="text-[10px] text-gray-700">|</span>
                                                        <span className={`font-black text-sm w-8 text-left ${team.s7_8_kpm > 0.5 ? 'text-amber-400' : team.s7_8_kpm > 0.2 ? 'text-white' : 'text-gray-600'}`}>
                                                            {team.s7_8_kpm.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                {['BER', 'PUR', 'KAL', 'NT', 'SOL'].map(m => (
                                                    <td key={m} className="px-4 py-3 text-center border-r border-white/5">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className="text-[10px] text-gray-500 font-bold w-4 text-right">{team.killsByMap[m] || 0}</span>
                                                            <span className="text-[10px] text-gray-700">|</span>
                                                            <span className={`font-black text-sm w-8 text-left ${team.kpmByMap[m] > 0.5 ? 'text-amber-400' : team.kpmByMap[m] > 0.2 ? 'text-white' : 'text-gray-600'}`}>
                                                                {team.kpmByMap[m].toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                ))}
                                            </>
                                        )}

                                        <td className="px-4 py-3 text-center bg-emerald-500/5">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-[10px] text-emerald-500/60 font-bold w-4 text-right">{team.totalKills}</span>
                                                <span className="text-[10px] text-emerald-500/30">|</span>
                                                <span className="font-black text-sm w-8 text-left text-emerald-400">
                                                    {team.globalKpm.toFixed(2)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {displayData.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="py-12 text-center text-gray-500 italic font-bold uppercase tracking-widest">
                                        Nenhum dado encontrado
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
"""
        with open('components/TeamKpmAnalysis.tsx', 'w') as f:
            f.write(top_content + table_html)

