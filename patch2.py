with open("pages/Teams.tsx", "r") as f:
    content = f.read()

# Fix activeTab type
if '"momentum"' not in content:
    content = content.replace(
        '| "activeSkills">("gallery");',
        '| "activeSkills" | "momentum">("gallery");'
    )

# Insert the button
target_btn = 'onClick={() => setActiveTab("mapStats")}'
btn = """onClick={() => setActiveTab("momentum")}
className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === "momentum" ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
><Flame size={15} /> Termômetro</button>
<button
"""

if "Termômetro" not in content:
    content = content.replace(target_btn, btn + target_btn)

# Insert the render logic
target_render = ') : activeTab === "mapStats" ? ('
render_code = ') : activeTab === "momentum" ? (\n<TeamMomentum data={data} />\n) : activeTab === "mapStats" ? ('

if "<TeamMomentum" not in content:
    content = content.replace(target_render, render_code)

with open("pages/Teams.tsx", "w") as f:
    f.write(content)

print("Patch 2 applied")
