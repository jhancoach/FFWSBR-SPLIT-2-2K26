import re

with open("pages/Teams.tsx", "r") as f:
    content = f.read()

# 1. Add import
if "import { TeamMomentum }" not in content:
    content = content.replace(
        "import FilterBar from '../components/FilterBar';",
        "import FilterBar from '../components/FilterBar';\nimport { TeamMomentum } from '../components/TeamMomentum';"
    )

# 2. Update activeTab type
content = content.replace(
    '| "activeSkills">("gallery");',
    '| "activeSkills" | "momentum">("gallery");'
)

# 3. Add Button
button_str = """</button><button
onClick={() => setActiveTab("momentum")}
className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === "momentum" ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
><Flame size={15} /> Termômetro</button><button
onClick={() => setActiveTab("mapStats")}"""
# Flatten the button string to match minified style if needed, but it's fine.
button_str = button_str.replace('\n', '')

content = content.replace(
    '</button><buttononClick={() => setActiveTab("mapStats")}',
    button_str
)

# 4. Add Render logic
render_str = """) : activeTab === "momentum" ? (
<TeamMomentum data={data} />
) : activeTab === "mapStats" ? (""".replace('\n', '')

content = content.replace(
    ') : activeTab === "mapStats" ? (',
    render_str
)

with open("pages/Teams.tsx", "w") as f:
    f.write(content)

print("Patch applied")
