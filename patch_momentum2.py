with open("components/TeamMomentum.tsx", "r") as f:
    content = f.read()

# Fix allRounds logic
old_rounds_logic = "const allRounds = Array.from(new Set(data.details.map(d => d.RD))).filter(Boolean) as string[];"
new_rounds_logic = "const allRounds = Array.from(new Set(data.details.filter(d => d.MAPA && d.MAPA.trim() !== '').map(d => d.RD))).filter(Boolean) as string[];"

content = content.replace(old_rounds_logic, new_rounds_logic)

with open("components/TeamMomentum.tsx", "w") as f:
    f.write(content)

print("Patched allRounds logic")
