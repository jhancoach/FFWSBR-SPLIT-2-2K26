import os

with open('components/TeamKpmAnalysis.tsx', 'r') as f:
    content = f.read()

# Remove from bottom
bottom_ui = """                    <div className="flex flex-wrap items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
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
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-2">Ordenar por:</span>
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-black/60 border border-gray-700 text-xs text-white rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500 transition-colors cursor-pointer font-bold"
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
                        </select>
                    </div>"""

content = content.replace(bottom_ui, "")

# Add to top
top_anchor = """        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Highlights Row */}"""

top_ui = """        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1a1a] p-4 rounded-3xl border border-gray-800 shadow-xl">
                <div className="flex items-center gap-3 text-emerald-500 font-black italic tracking-widest">
                    <Activity size={24} />
                    KPM POR SAFE
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pl-1"><MapIcon size={14} className="inline mr-1" /> Mapa:</span>
                        <select 
                            value={mapFilter}
                            onChange={(e) => setMapFilter(e.target.value)}
                            className="bg-black/60 border border-gray-700 text-xs text-white rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500 transition-colors font-bold cursor-pointer"
                        >
                            <option value="ALL">TODOS OS MAPAS</option>
                            <option value="BER">Bermuda</option>
                            <option value="PUR">Purgatório</option>
                            <option value="KAL">Kalahari</option>
                            <option value="NT">Nova Terra</option>
                            <option value="SOL">Solara</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pl-1"><Filter size={14} className="inline mr-1" /> Ordenar por:</span>
                        <select 
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
                        </select>
                    </div>
                </div>
            </div>

            {/* Highlights Row */}"""

content = content.replace(top_anchor, top_ui)

with open('components/TeamKpmAnalysis.tsx', 'w') as f:
    f.write(content)
