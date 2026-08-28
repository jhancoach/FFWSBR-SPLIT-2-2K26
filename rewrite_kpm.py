import os

with open('components/TeamKpmAnalysis.tsx', 'r') as f:
    content = f.read()

# Add mapFilter state
content = content.replace(
    "const [sortBy, setSortBy] = useState<string>('global_kpm');",
    "const [sortBy, setSortBy] = useState<string>('global_kpm');\n    const [mapFilter, setMapFilter] = useState<string>('ALL');"
)

# Add mapFilter dependency to useMemo
content = content.replace(
    "}, [data.details, data.killFeed, data.players, data.teamsReference, sortBy]);",
    "}, [data.details, data.killFeed, data.players, data.teamsReference, sortBy, mapFilter]);"
)

# Apply mapFilter in data.details loop
old_details_loop = """            const matchId = `${d.Q}-${d.MAPA}-${d.CONFRONTO || ''}`;
            const mapGroup = getMapGroup(d.MAPA);
            
            if (!teamMatches.get(t)!.some(m => m.matchId === matchId)) {"""
new_details_loop = """            const matchId = `${d.Q}-${d.MAPA}-${d.CONFRONTO || ''}`;
            const mapGroup = getMapGroup(d.MAPA);
            
            if (mapFilter !== 'ALL' && mapGroup !== mapFilter) return;

            if (!teamMatches.get(t)!.some(m => m.matchId === matchId)) {"""
content = content.replace(old_details_loop, new_details_loop)

# Apply mapFilter in killFeed loop
old_killfeed_logic = """            // Find map using the match Q from killfeed
            let mapGroup = 'BER';
            if (k.MAPA) {
                mapGroup = getMapGroup(k.MAPA);
            } else {
                // fallback to finding the map from team matches based on Q
                const match = teamMatches.get(team)?.find(m => m.matchId.startsWith(`${k.Q}-`));
                if (match) mapGroup = match.mapGroup;
            }"""
new_killfeed_logic = """            // Find map using the match Q from killfeed
            let mapGroup = 'BER';
            if (k.MAPA) {
                mapGroup = getMapGroup(k.MAPA);
            } else {
                // fallback to finding the map from team matches based on Q
                // Note: we need to find the map from original details if it was filtered out
                const dDataMatch = data.details.find(d => d.Q === k.Q);
                if (dDataMatch) mapGroup = getMapGroup(dDataMatch.MAPA);
            }
            
            if (mapFilter !== 'ALL' && mapGroup !== mapFilter) return;"""
content = content.replace(old_killfeed_logic, new_killfeed_logic)


# Add map filter UI
old_ui = """                    <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-2">Ordenar por:</span>"""
new_ui = """                    <div className="flex flex-wrap items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                        <div className="flex items-center border-r border-white/10 pr-3 mr-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-2"><MapIcon size={12} className="inline mr-1" /> Mapa:</span>
                            <select 
                                value={mapFilter}
                                onChange={(e) => setMapFilter(e.target.value)}
                                className="bg-black/60 border border-gray-700 text-xs text-white rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500 transition-colors font-bold"
                            >
                                <option value="ALL">TODOS OS MAPAS</option>
                                <option value="BER">Bermuda</option>
                                <option value="PUR">Purgatório</option>
                                <option value="KAL">Kalahari</option>
                                <option value="NT">Nova Terra</option>
                                <option value="SOL">Solara</option>
                            </select>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-2">Ordenar por:</span>"""
content = content.replace(old_ui, new_ui)

with open('components/TeamKpmAnalysis.tsx', 'w') as f:
    f.write(content)
