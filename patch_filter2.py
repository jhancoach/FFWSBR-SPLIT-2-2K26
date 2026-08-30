import re
with open("pages/Teams.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '<FilterBar\nfilters={filters}\nsetFilters={setFilters}\noptions={filterOptions}\n/>',
    '<FilterBar\nfilters={filters}\nsetFilters={setFilters}\noptions={filterOptions}\ndefaultOpen={false}\n/>'
)

# Also try without newlines just in case
content = content.replace(
    '<FilterBarfilters={filters}setFilters={setFilters}options={filterOptions}/>',
    '<FilterBar filters={filters} setFilters={setFilters} options={filterOptions} defaultOpen={false} />'
)

with open("pages/Teams.tsx", "w") as f:
    f.write(content)

print("Patched Teams.tsx")
