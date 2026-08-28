import os

with open('components/TeamKpmAnalysis.tsx', 'r') as f:
    content = f.read()

target = """                        <button 
                            onClick={() => setTableMode('map')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tableMode === 'map' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            POR MAPA
                        </button>
                    </div>
                </div>"""

replacement = """                        <button 
                            onClick={() => setTableMode('map')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tableMode === 'map' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            POR MAPA
                        </button>
                    </div>
                    </div>
                </div>"""

content = content.replace(target, replacement)

with open('components/TeamKpmAnalysis.tsx', 'w') as f:
    f.write(content)
