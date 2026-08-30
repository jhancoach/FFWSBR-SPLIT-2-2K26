with open("pages/Teams.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'import FilterBar from "../components/FilterBar";',
    'import FilterBar from "../components/FilterBar";\nimport { TeamMomentum } from "../components/TeamMomentum";'
)

with open("pages/Teams.tsx", "w") as f:
    f.write(content)

print("Import patched")
