import os

with open('pages/Players.tsx', 'r') as f:
    content = f.read()

# Add import for calculateOverallKpmFromMapStats
import_statement = "import { calculateOverallKpmFromMapStats } from '../utils/kpmUtils';\n"
if "calculateOverallKpmFromMapStats" not in content:
    content = content.replace("import { FilterBar }", import_statement + "import { FilterBar }")
    if import_statement not in content:
        content = content.replace("import FilterBar", import_statement + "import FilterBar")

# Add kpm to mapped data
target = """            deaths,
            kd: (stat.kills / (deaths || 1)).toFixed(2),"""

replacement = """            deaths,
            kd: (stat.kills / (deaths || 1)).toFixed(2),
            kpm: parseFloat(calculateOverallKpmFromMapStats(stat.kills, stat.mapStats).toFixed(3)),
            mapStats: stat.mapStats,"""

content = content.replace(target, replacement)

with open('pages/Players.tsx', 'w') as f:
    f.write(content)
