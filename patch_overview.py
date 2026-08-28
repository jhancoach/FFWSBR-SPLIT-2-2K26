import os

with open('pages/Players.tsx', 'r') as f:
    content = f.read()

target = """                    <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 lg:gap-3">
                        {/* 1. Abates */}
                        <MetricCard 
                            icon={Skull}
                            label="Abates" 
                            value={stats.kills} 
                            color="text-red-500" 
                            subtext={`Média ${stats.avg}/Q`}
                            subColor="text-red-400/80"
                            highlight="red"
                        />"""

replacement = """                    <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 lg:gap-3">
                        {/* 1. Abates */}
                        <MetricCard 
                            icon={Skull}
                            label="Abates" 
                            value={stats.kills} 
                            color="text-red-500" 
                            subtext={`Média ${stats.avg}/Q`}
                            subColor="text-red-400/80"
                            highlight="red"
                        />
                        {/* KPM */}
                        <MetricCard 
                            icon={Activity}
                            label="KPM" 
                            value={pData?.kpm || 0} 
                            color="text-emerald-500" 
                            subtext="Kills por Minuto"
                            subColor="text-emerald-400/80"
                            highlight="emerald"
                        />"""

content = content.replace(target, replacement)

with open('pages/Players.tsx', 'w') as f:
    f.write(content)
