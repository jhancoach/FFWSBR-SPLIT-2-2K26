import os

with open('pages/Players.tsx', 'r') as f:
    content = f.read()

target_header = """                                        <th className="px-2 py-4 text-center text-yellow-500 border-b border-gray-800 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRankingSort('avg')}>
                                            <div className="flex items-center justify-center gap-1">
                                                AVG K
                                                {rankingSort.field === 'avg' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>"""

replacement_header = """                                        <th className="px-2 py-4 text-center text-yellow-500 border-b border-gray-800 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRankingSort('avg')}>
                                            <div className="flex items-center justify-center gap-1">
                                                AVG K
                                                {rankingSort.field === 'avg' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center text-emerald-500 border-b border-gray-800 cursor-pointer hover:text-emerald-400 transition-colors" onClick={() => handleRankingSort('kpm')}>
                                            <div className="flex items-center justify-center gap-1">
                                                KPM
                                                {rankingSort.field === 'kpm' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>"""

target_body = """                                            <td className="px-2 py-3 text-center text-yellow-500 font-black italic bg-yellow-500/5">{player.avg}</td>"""

replacement_body = """                                            <td className="px-2 py-3 text-center text-yellow-500 font-black italic bg-yellow-500/5">{player.avg}</td>
                                            <td className="px-2 py-3 text-center text-emerald-500 font-black italic bg-emerald-500/5">{player.kpm || 0}</td>"""

content = content.replace(target_header, replacement_header)
content = content.replace(target_body, replacement_body)

with open('pages/Players.tsx', 'w') as f:
    f.write(content)
