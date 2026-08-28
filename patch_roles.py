import os

with open('pages/Players.tsx', 'r') as f:
    content = f.read()

target = """            avgKnocks: stats?.avgKnocks || '0.00',
            matches: stats?.matches || 0,"""

replacement = """            avgKnocks: stats?.avgKnocks || '0.00',
            matches: stats?.matches || 0,
            kpm: stats?.kpm || 0,"""

content = content.replace(target, replacement)

target_sort_kpm = """        const vA = (a as any)[rolesSort.field] || 0;
        const vB = (b as any)[rolesSort.field] || 0;"""

# Add kpm to sorting headers in roles tab
target_header_roles = """                                                  <th className="px-4 py-4 text-center border-b border-gray-800 text-yellow-500 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRolesSort('avg')}>
                                                      <div className="flex items-center justify-center gap-1">
                                                          AVG
                                                          {rolesSort.field === 'avg' && (rolesSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>"""

replacement_header_roles = """                                                  <th className="px-4 py-4 text-center border-b border-gray-800 text-yellow-500 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRolesSort('avg')}>
                                                      <div className="flex items-center justify-center gap-1">
                                                          AVG
                                                          {rolesSort.field === 'avg' && (rolesSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>
                                                  <th className="px-4 py-4 text-center border-b border-gray-800 text-emerald-500 cursor-pointer hover:text-emerald-400 transition-colors" onClick={() => handleRolesSort('kpm')}>
                                                      <div className="flex items-center justify-center gap-1">
                                                          KPM
                                                          {rolesSort.field === 'kpm' && (rolesSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>"""

target_body_roles = """                                                      <td className="px-4 py-3 text-center text-yellow-500 font-black italic bg-yellow-500/5">{p.avg}</td>"""

replacement_body_roles = """                                                      <td className="px-4 py-3 text-center text-yellow-500 font-black italic bg-yellow-500/5">{p.avg}</td>
                                                      <td className="px-4 py-3 text-center text-emerald-500 font-black italic bg-emerald-500/5">{p.kpm}</td>"""


content = content.replace(target_header_roles, replacement_header_roles)
content = content.replace(target_body_roles, replacement_body_roles)

with open('pages/Players.tsx', 'w') as f:
    f.write(content)
