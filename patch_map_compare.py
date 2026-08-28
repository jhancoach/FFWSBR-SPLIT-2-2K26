import os

with open('components/TeamVsTeamMapCompare.tsx', 'r') as f:
    content = f.read()

import_statement = "import { calculateMapDurationSec } from '../utils/kpmUtils';\n"
if "calculateMapDurationSec" not in content:
    content = content.replace("import { normalize", import_statement + "import { normalize")

target = """      const statsA = calculateTeamStats({ details: teamADetails })[0] || { pts: 0, ptsc: 0, abts: 0, b: 0, s: 0, avgPts: '0.00', avgAbts: '0.00', avgPtsc: '0.00' };
      const statsB = calculateTeamStats({ details: teamBDetails })[0] || { pts: 0, ptsc: 0, abts: 0, b: 0, s: 0, avgPts: '0.00', avgAbts: '0.00', avgPtsc: '0.00' };"""

replacement = """      const statsA = calculateTeamStats({ details: teamADetails })[0] || { pts: 0, ptsc: 0, abts: 0, b: 0, s: 0, avgPts: '0.00', avgAbts: '0.00', avgPtsc: '0.00' };
      const statsB = calculateTeamStats({ details: teamBDetails })[0] || { pts: 0, ptsc: 0, abts: 0, b: 0, s: 0, avgPts: '0.00', avgAbts: '0.00', avgPtsc: '0.00' };
      
      const durationSecA = calculateMapDurationSec(mapName) * (statsA.s || 0);
      const kpmA = durationSecA > 0 ? (statsA.abts / (durationSecA / 60)).toFixed(2) : '0.00';
      
      const durationSecB = calculateMapDurationSec(mapName) * (statsB.s || 0);
      const kpmB = durationSecB > 0 ? (statsB.abts / (durationSecB / 60)).toFixed(2) : '0.00';
      
      const kpmDiff = parseFloat(kpmA) - parseFloat(kpmB);
      """

content = content.replace(target, replacement)

target2 = """      return {
        mapName,
        isTie,
        statsA,
        statsB,"""

replacement2 = """      return {
        mapName,
        isTie,
        statsA: { ...statsA, kpm: kpmA },
        statsB: { ...statsB, kpm: kpmB },
        kpmDiff,"""

content = content.replace(target2, replacement2)


target3 = """                    <StatRow label="Quedas c/ Abates" valA={m.statsA.withKillsMatches || 0} valB={m.statsB.withKillsMatches || 0} format="number" />
                    <StatRow label="% Quedas c/ Abates" valA={`${m.statsA.withKillsPct || 0}%`} valB={`${m.statsB.withKillsPct || 0}%`} format="string" highlightMax />
                    <StatRow label="Média de Abates" valA={m.statsA.avgAbts} valB={m.statsB.avgAbts} highlightMax format="number" />"""

replacement3 = """                    <StatRow label="Quedas c/ Abates" valA={m.statsA.withKillsMatches || 0} valB={m.statsB.withKillsMatches || 0} format="number" />
                    <StatRow label="% Quedas c/ Abates" valA={`${m.statsA.withKillsPct || 0}%`} valB={`${m.statsB.withKillsPct || 0}%`} format="string" highlightMax />
                    <StatRow label="Média de Abates" valA={m.statsA.avgAbts} valB={m.statsB.avgAbts} highlightMax format="number" />
                    <StatRow label="KPM (Abates p/ Minuto)" valA={m.statsA.kpm} valB={m.statsB.kpm} highlightMax format="number" />"""

content = content.replace(target3, replacement3)

with open('components/TeamVsTeamMapCompare.tsx', 'w') as f:
    f.write(content)
