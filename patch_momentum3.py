with open("components/TeamMomentum.tsx", "r") as f:
    content = f.read()

old_filter = "const mapMatches = data.details.filter(d => normalize(d.MAPA) === normalize(mapConfig.name));"
new_filter = "const mapMatches = data.details.filter(d => normalize(d.MAPA) === normalize(mapConfig.id) || normalize(d.MAPA) === normalize(mapConfig.name) || normalize(d.MAPA).startsWith(normalize(mapConfig.id)));"

content = content.replace(old_filter, new_filter)

with open("components/TeamMomentum.tsx", "w") as f:
    f.write(content)

print("Patched map logic")
