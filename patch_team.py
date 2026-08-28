import os

with open('pages/Teams.tsx', 'r') as f:
    content = f.read()

import_statement = "import { calculateMapDurationSec } from '../utils/kpmUtils';\n"
if "calculateMapDurationSec" not in content:
    content = content.replace("import { calculateTeamStats } from '../services/dataService';", import_statement + "import { calculateTeamStats } from '../services/dataService';")


target = """      const totalTeamKills = matchesOnMap.reduce((acc, m) => acc + parseNumber(m.ABTS), 0);
      const avgKillsPerMatch = totalMatches > 0 ? (totalTeamKills / totalMatches).toFixed(2) : '0.00';"""

replacement = """      const totalTeamKills = matchesOnMap.reduce((acc, m) => acc + parseNumber(m.ABTS), 0);
      const avgKillsPerMatch = totalMatches > 0 ? (totalTeamKills / totalMatches).toFixed(2) : '0.00';
      const mapDurationSec = calculateMapDurationSec(mapName) * totalMatches;
      const teamKpm = mapDurationSec > 0 ? (totalTeamKills / (mapDurationSec / 60)).toFixed(2) : '0.00';"""

content = content.replace(target, replacement)

target_map = """      return {
        mapName,
        totalMatches,
        totalTeamKills,
        avgKillsPerMatch,
        roundsList,
        playersList
      };"""

replacement_map = """      return {
        mapName,
        totalMatches,
        totalTeamKills,
        avgKillsPerMatch,
        teamKpm,
        roundsList,
        playersList
      };"""
content = content.replace(target_map, replacement_map)


target_ui = """                                                <div className="bg-black/60 px-4 py-2 rounded-xl border border-white/5">
                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Média / Partida</div>
                                                    <div className="text-xl font-black text-white">{mGroup.avgKillsPerMatch}</div>
                                                </div>"""

replacement_ui = """                                                <div className="bg-black/60 px-4 py-2 rounded-xl border border-white/5">
                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Média / Partida</div>
                                                    <div className="text-xl font-black text-white">{mGroup.avgKillsPerMatch}</div>
                                                </div>
                                                <div className="bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                                                    <div className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-wider mb-1">KPM (Por Mapa)</div>
                                                    <div className="text-xl font-black text-emerald-400 italic">{mGroup.teamKpm}</div>
                                                </div>"""

content = content.replace(target_ui, replacement_ui)

with open('pages/Teams.tsx', 'w') as f:
    f.write(content)
