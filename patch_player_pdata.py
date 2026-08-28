import os

with open('pages/Players.tsx', 'r') as f:
    content = f.read()

target = """                        <MetricCard 
                            icon={Activity}
                            label="KPM" 
                            value={pData?.kpm || 0} 
                            color="text-emerald-500" 
                            subtext="Kills por Minuto"
                            subColor="text-emerald-400/80"
                            highlight="emerald"
                        />"""

replacement = """                        <MetricCard 
                            icon={Activity}
                            label="KPM" 
                            value={rankingData.find((p: any) => p.name === playerName)?.kpm || 0} 
                            color="text-emerald-500" 
                            subtext="Kills por Minuto"
                            subColor="text-emerald-400/80"
                            highlight="emerald"
                        />"""

content = content.replace(target, replacement)

with open('pages/Players.tsx', 'w') as f:
    f.write(content)
