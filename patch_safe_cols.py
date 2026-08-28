import os

with open('components/TeamKpmAnalysis.tsx', 'r') as f:
    content = f.read()

# Add state
if "safeColumnFilter" not in content:
    content = content.replace(
        "const [tableMode, setTableMode] = useState<'safe' | 'map'>('safe');",
        "const [tableMode, setTableMode] = useState<'safe' | 'map'>('safe');\n    const [safeColumnFilter, setSafeColumnFilter] = useState<string>('ALL');\n\n    const visibleSafes = useMemo(() => {\n        if (safeColumnFilter === 'EARLY') return [1, 2];\n        if (safeColumnFilter === 'MID') return [3, 4];\n        if (safeColumnFilter === 'LATE') return [5, 6, 7];\n        if (safeColumnFilter.startsWith('S')) return [parseInt(safeColumnFilter.replace('S', ''))];\n        return [1, 2, 3, 4, 5, 6, 7];\n    }, [safeColumnFilter]);"
    )

# Modify the controls in the Table section
table_controls_old = """                    <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-1">
                        <button 
                            onClick={() => setTableMode('safe')}"""

table_controls_new = """                    <div className="flex flex-wrap items-center gap-3">
                        {tableMode === 'safe' && (
                            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pl-1"><Filter size={12} className="inline mr-1" /> Colunas:</span>
                                <select 
                                    value={safeColumnFilter}
                                    onChange={(e) => setSafeColumnFilter(e.target.value)}
                                    className="bg-black/60 border border-gray-700 text-xs text-white rounded-lg px-2 py-1 outline-none focus:border-emerald-500 transition-colors font-bold cursor-pointer"
                                >
                                    <option value="ALL">Todas as Safes</option>
                                    <option value="EARLY">Early Game (S1-S2)</option>
                                    <option value="MID">Mid Game (S3-S4)</option>
                                    <option value="LATE">Late Game (S5-S7+)</option>
                                    <option value="S1">Safe 1</option>
                                    <option value="S2">Safe 2</option>
                                    <option value="S3">Safe 3</option>
                                    <option value="S4">Safe 4</option>
                                    <option value="S5">Safe 5</option>
                                    <option value="S6">Safe 6</option>
                                    <option value="S7">Safe 7+</option>
                                </select>
                            </div>
                        )}
                        <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-1">
                            <button 
                                onClick={() => setTableMode('safe')}"""

content = content.replace(table_controls_old, table_controls_new)

# Modify Table Header
th_old = """                                {tableMode === 'safe' ? (
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
                                )"""
th_new = """                                {tableMode === 'safe' ? (
                                    <>
                                        {visibleSafes.map(s => (
                                            <th key={s} className="px-4 py-3 text-center border-r border-white/5">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-white">SAFE {s === 7 ? '7+' : s}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </>
                                )"""
content = content.replace(th_old, th_new)

# Modify Table Body
tb_old = """                                        {tableMode === 'safe' ? (
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
                                        )"""
tb_new = """                                        {tableMode === 'safe' ? (
                                            <>
                                                {visibleSafes.map(s => {
                                                    const kills = s === 7 ? team.s7_8_kills : team.killsBySafe[s] || 0;
                                                    const kpm = s === 7 ? team.s7_8_kpm : team.kpmBySafe[s] || 0;
                                                    return (
                                                        <td key={s} className="px-4 py-3 text-center border-r border-white/5">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span className="text-[10px] text-gray-500 font-bold w-4 text-right">{kills}</span>
                                                                <span className="text-[10px] text-gray-700">|</span>
                                                                <span className={`font-black text-sm w-8 text-left ${kpm > 0.5 ? 'text-amber-400' : kpm > 0.2 ? 'text-white' : 'text-gray-600'}`}>
                                                                    {kpm.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </>
                                        )"""
content = content.replace(tb_old, tb_new)

with open('components/TeamKpmAnalysis.tsx', 'w') as f:
    f.write(content)
