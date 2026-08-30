with open("pages/Teams.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '<FilterBar\n              filters={filters}\n              setFilters={setFilters}\n              options={filterOptions}\n            />',
    '<FilterBar\n              filters={filters}\n              setFilters={setFilters}\n              options={filterOptions}\n              defaultOpen={false}\n            />'
)

with open("pages/Teams.tsx", "w") as f:
    f.write(content)

with open("pages/Players.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '<FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />',
    '<FilterBar filters={filters} setFilters={setFilters} options={filterOptions} defaultOpen={false} />'
)

with open("pages/Players.tsx", "w") as f:
    f.write(content)

with open("pages/KillFeedPage.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '<FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />',
    '<FilterBar filters={filters} setFilters={setFilters} options={filterOptions} defaultOpen={false} />'
)

with open("pages/KillFeedPage.tsx", "w") as f:
    f.write(content)

print("Patched defaultOpen=false")
