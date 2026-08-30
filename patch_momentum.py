import re

with open("components/TeamMomentum.tsx", "r") as f:
    content = f.read()

# 1. Add Calendar to lucide-react import
content = content.replace("AlertTriangle }", "AlertTriangle, Calendar }")

# 2. Add useState to react import
if "useState" not in content:
    content = content.replace("import React, { useMemo }", "import React, { useMemo, useState }")

# 3. Add viewMode state
state_code = "const [viewMode, setViewMode] = useState<'maps' | 'rounds'>('maps');"
content = content.replace("const momentumData = useMemo(() => {", f"{state_code}\n  const momentumData = useMemo(() => {{")

# 4. Add roundMomentumData useMemo
round_memo = """
  const roundMomentumData = useMemo(() => {
    const results = [];
    const allRounds = Array.from(new Set(data.details.map(d => d.RD))).filter(Boolean) as string[];

    const sortedRounds = allRounds.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    const recentRounds = sortedRounds.reverse().slice(0, 6);

    for (const rd of recentRounds) {
      const rdMatches = data.details.filter(d => normalize(d.RD) === normalize(rd));
      if (rdMatches.length === 0) continue;

      const teamStatsMap = new Map<string, { pts: number; kills: number; matches: number }>();

      rdMatches.forEach(m => {
        const teamName = m.TIME;
        if (!teamName) return;

        const pts = parseInt(m.PTS as string) || 0;
        const kills = parseInt(m.ABTS as string) || 0;

        if (!teamStatsMap.has(teamName)) {
          teamStatsMap.set(teamName, { pts: 0, kills: 0, matches: 0 });
        }

        const stats = teamStatsMap.get(teamName)!;
        stats.pts += pts;
        stats.kills += kills;
        stats.matches += 1;
      });

      const sortedTeams = Array.from(teamStatsMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.pts - a.pts || b.kills - a.kills);

      const top3 = sortedTeams.slice(0, 3);
      const bottom3 = [...sortedTeams].reverse().slice(0, 3);

      results.push({
        roundName: rd,
        top3,
        bottom3
      });
    }

    return results;
  }, [data]);
"""
content = content.replace("return results;\n  }, [data]);", "return results;\n  }, [data]);\n" + round_memo)

# 5. Modify Header to add buttons
header_search = """<p className="text-gray-400 text-sm max-w-2xl px-4">
          Análise de <strong className="text-white">Momento</strong> baseada exclusivamente nas <strong className="text-orange-400">últimas 4 aparições</strong> de cada mapa. Descubra quais equipes estão dominando o meta atual e quais estão em queda livre.
        </p>
      </div>"""

header_replace = """<p className="text-gray-400 text-sm max-w-2xl px-4">
          Análise de <strong className="text-white">Momento</strong>. Acompanhe quem está dominando as partidas mais recentes e quais equipes precisam de atenção imediata.
        </p>
        
        <div className="flex gap-3 mt-6 bg-black/50 p-1 rounded-xl border border-white/5">
            <button 
                onClick={() => setViewMode('maps')} 
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${viewMode === 'maps' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'text-gray-400 hover:text-white'}`}
            >
                <MapPin size={13} /> Por Mapa
            </button>
            <button 
                onClick={() => setViewMode('rounds')} 
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${viewMode === 'rounds' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'text-gray-400 hover:text-white'}`}
            >
                <Calendar size={13} /> Por Rodada
            </button>
        </div>
      </div>"""

content = content.replace(header_search, header_replace)

# 6. Make grid render conditional
grid_search = '<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">'
grid_replace = """{viewMode === 'maps' ? (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">"""

content = content.replace(grid_search, grid_replace)

# 7. Add round render logic at the end of maps grid
end_grid_search = """))}
      </div>
    </div>
  );"""

end_grid_replace = """))}
      </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {roundMomentumData.map((rdData, idx) => (
          <div key={idx} className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl relative group flex flex-col">
            <div className="bg-gradient-to-r from-gray-900 to-black px-6 py-4 flex items-center gap-3 border-b border-gray-800">
                <Calendar size={18} className="text-yellow-500" />
                <h3 className="text-lg font-black text-white uppercase tracking-widest italic">{rdData.roundName}</h3>
            </div>
            
            <div className="px-5 pb-5 pt-4 flex-1 flex flex-col gap-4">
                {/* EM ALTA */}
                <div className="bg-gradient-to-b from-green-500/10 to-transparent rounded-2xl p-4 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-3 border-b border-green-500/20 pb-2">
                        <TrendingUp size={16} className="text-green-400" />
                        <span className="text-xs font-black text-green-400 uppercase tracking-widest">Melhores (Top 3)</span>
                    </div>
                    <div className="space-y-2">
                        {rdData.top3.map((team, tIdx) => (
                            <div key={tIdx} className="flex items-center justify-between bg-black/40 rounded-xl p-2 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${tIdx === 0 ? 'bg-yellow-500 text-black' : tIdx === 1 ? 'bg-gray-300 text-black' : 'bg-orange-700 text-white'}`}>
                                        {tIdx + 1}
                                    </div>
                                    <span className="text-xs font-black text-white truncate max-w-[100px] uppercase">{team.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-sm font-black text-green-400 italic leading-none">{team.pts} pts</span>
                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{team.kills} abts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* EM BAIXA */}
                <div className="bg-gradient-to-b from-red-500/10 to-transparent rounded-2xl p-4 border border-red-500/20 mt-auto">
                    <div className="flex items-center gap-2 mb-3 border-b border-red-500/20 pb-2">
                        <TrendingDown size={16} className="text-red-400" />
                        <span className="text-xs font-black text-red-400 uppercase tracking-widest">Piores (Bottom 3)</span>
                    </div>
                    <div className="space-y-2">
                        {rdData.bottom3.map((team, tIdx) => (
                            <div key={tIdx} className="flex items-center justify-between bg-black/40 rounded-xl p-2 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded bg-gray-800 text-gray-500 flex items-center justify-center text-[10px] font-black">
                                        <AlertTriangle size={10} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 truncate max-w-[100px] uppercase">{team.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-sm font-black text-red-400 italic leading-none">{team.pts} pts</span>
                                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">{team.kills} abts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );"""

content = content.replace(end_grid_search, end_grid_replace)

with open("components/TeamMomentum.tsx", "w") as f:
    f.write(content)

print("Patch round momentum applied")
