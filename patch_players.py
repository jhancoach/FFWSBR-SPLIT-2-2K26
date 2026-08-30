with open("pages/Players.tsx", "r") as f:
    content = f.read()

# 1. Add import
if "import PlayerMomentum" not in content:
    content = content.replace(
        "import FilterBar from '../components/FilterBar';",
        "import FilterBar from '../components/FilterBar';\nimport PlayerMomentum from '../components/PlayerMomentum';"
    )

# 2. Update activeTab type
content = content.replace(
    "useState<'ranking' | 'kpmSafes' | 'playerRounds'",
    "useState<'ranking' | 'momentum' | 'kpmSafes' | 'playerRounds'"
)

# 3. Add momentum to tabs list
old_tab_list = '{ id: "ranking", label: "Ranking Geral", icon: <Trophy size={18} /> },'
new_tab_list = '{ id: "ranking", label: "Ranking Geral", icon: <Trophy size={18} /> },\n            { id: "momentum", label: "Termômetro", icon: <Flame size={18} /> },'

if '{ id: "momentum"' not in content:
    content = content.replace(old_tab_list, new_tab_list)

# 4. Add render block
old_render_block = "{activeTab === 'playerRounds' && ("
new_render_block = """{activeTab === 'momentum' && (
            <PlayerMomentum 
              data={data} 
              onSelectPlayer={(pName) => {
                setFilters(prev => ({ ...prev, players: [pName] }));
                setActiveTab('report');
              }}
            />
          )}

          {activeTab === 'playerRounds' && ("""

if "{activeTab === 'momentum' &&" not in content:
    content = content.replace(old_render_block, new_render_block)

with open("pages/Players.tsx", "w") as f:
    f.write(content)

print("Players.tsx patched successfully!")
