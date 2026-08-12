import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');

const p1Select = `
                          <select 
                              value={comparePlayers.p1} 
                              onChange={(e) => setComparePlayers(prev => ({...prev, p1: e.target.value}))}
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-yellow-500 outline-none transition-all mb-4"
                          >
                              <option value="">Selecione um jogador...</option>
                              {allPlayersList.map(p => (
                                  <option key={p.name} value={p.name}>{p.name}</option>
                              ))}
                          </select>
                          <select 
                              value={comparePlayers.p1Hab} 
                              onChange={(e) => setComparePlayers(prev => ({...prev, p1Hab: e.target.value}))}
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-yellow-500 outline-none transition-all text-sm"
                          >
                              <option value="All">Com Qualquer Habilidade</option>
                              {filterOptions.activeHabs.map(h => <option key={h} value={h}>Com {h}</option>)}
                          </select>
`;

const oldP1Select = `
                          <select 
                              value={comparePlayers.p1} 
                              onChange={(e) => setComparePlayers(prev => ({...prev, p1: e.target.value}))}
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-yellow-500 outline-none transition-all"
                          >
                              <option value="">Selecione um jogador...</option>
                              {allPlayersList.map(p => (
                                  <option key={p.name} value={p.name}>{p.name}</option>
                              ))}
                          </select>
`;

const p2Select = `
                          <select 
                              value={comparePlayers.p2} 
                              onChange={(e) => setComparePlayers(prev => ({...prev, p2: e.target.value}))}
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-yellow-500 outline-none transition-all mb-4"
                          >
                              <option value="">Selecione um jogador...</option>
                              {allPlayersList.map(p => (
                                  <option key={p.name} value={p.name}>{p.name}</option>
                              ))}
                          </select>
                          <select 
                              value={comparePlayers.p2Hab} 
                              onChange={(e) => setComparePlayers(prev => ({...prev, p2Hab: e.target.value}))}
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-blue-500 outline-none transition-all text-sm"
                          >
                              <option value="All">Com Qualquer Habilidade</option>
                              {filterOptions.activeHabs.map(h => <option key={h} value={h}>Com {h}</option>)}
                          </select>
`;

const oldP2Select = `
                          <select 
                              value={comparePlayers.p2} 
                              onChange={(e) => setComparePlayers(prev => ({...prev, p2: e.target.value}))}
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-yellow-500 outline-none transition-all"
                          >
                              <option value="">Selecione um jogador...</option>
                              {allPlayersList.map(p => (
                                  <option key={p.name} value={p.name}>{p.name}</option>
                              ))}
                          </select>
`;

content = content.replace(oldP1Select.trim(), p1Select.trim());
content = content.replace(oldP2Select.trim(), p2Select.trim());

fs.writeFileSync('pages/Players.tsx', content);
console.log("Patched UI");
