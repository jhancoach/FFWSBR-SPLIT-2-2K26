import os

with open('pages/Teams.tsx', 'r') as f:
    content = f.read()

import_statement = "import { calculateMapDurationSec, calculateOverallKpm } from '../utils/kpmUtils';\n"
if "calculateOverallKpm" not in content:
    content = content.replace("import { calculateMapDurationSec } from '../utils/kpmUtils';", import_statement)

target = """                                        <div className="grid grid-cols-3 gap-4 mb-8">
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">PTS TOTAL</span>
                                                <span className={`text-2xl font-black italic ${idx === 0 ? 'text-yellow-500' : 'text-blue-400'}`}>{stats.pts}</span>
                                            </div>
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">ABATES</span>
                                                <span className="text-2xl font-black text-white italic">{stats.abts}</span>
                                            </div>
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">BOOYAHS</span>
                                                <span className="text-2xl font-black text-white italic">{stats.b}</span>
                                            </div>
                                        </div>"""

replacement = """                                        <div className="grid grid-cols-4 gap-4 mb-8">
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">PTS TOTAL</span>
                                                <span className={`text-2xl font-black italic ${idx === 0 ? 'text-yellow-500' : 'text-blue-400'}`}>{stats.pts}</span>
                                            </div>
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">ABATES</span>
                                                <span className="text-2xl font-black text-white italic">{stats.abts}</span>
                                            </div>
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">KPM (GERAL)</span>
                                                <span className={`text-2xl font-black italic ${idx === 0 ? 'text-yellow-500' : 'text-blue-400'}`}>
                                                    {calculateOverallKpm(stats.abts, filteredData.details.filter(d => normalize(d.TIME) === normalize(stats.name)).map(m => ({ mapName: m.MAPA || '' }))).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">BOOYAHS</span>
                                                <span className="text-2xl font-black text-white italic">{stats.b}</span>
                                            </div>
                                        </div>"""

content = content.replace(target, replacement)

with open('pages/Teams.tsx', 'w') as f:
    f.write(content)
