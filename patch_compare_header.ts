import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');

const p1NameBlock = \`
                                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">{compareData.p1.name}</h4>
                                  {comparePlayers.p1Hab !== 'All' && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full font-black uppercase tracking-widest mt-1 border border-yellow-500/30">Com {comparePlayers.p1Hab}</span>}
                                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest mt-2">{compareData.p1.team}</span>
\`;
content = content.replace(/<h4 className="text-xl font-black text-white uppercase italic tracking-tighter">\\{compareData\\.p1\\.name\\}<\\/h4>\\s*<span className="text-xs font-black text-gray-500 uppercase tracking-widest">\\{compareData\\.p1\\.team\\}<\\/span>/m, p1NameBlock.trim());

const p2NameBlock = \`
                                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">{compareData.p2.name}</h4>
                                  {comparePlayers.p2Hab !== 'All' && <span className="text-[10px] bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full font-black uppercase tracking-widest mt-1 border border-blue-500/30">Com {comparePlayers.p2Hab}</span>}
                                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest mt-2">{compareData.p2.team}</span>
\`;
content = content.replace(/<h4 className="text-xl font-black text-white uppercase italic tracking-tighter">\\{compareData\\.p2\\.name\\}<\\/h4>\\s*<span className="text-xs font-black text-gray-500 uppercase tracking-widest">\\{compareData\\.p2\\.team\\}<\\/span>/m, p2NameBlock.trim());

fs.writeFileSync('pages/Players.tsx', content);
console.log("Patched headers");
