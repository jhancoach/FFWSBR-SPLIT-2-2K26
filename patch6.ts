import fs from 'fs';
let content = fs.readFileSync('pages/Banners.tsx', 'utf-8');

const mapUI = `
                {/* Desempenho por Mapa */}
                {bannerTeamPerfData.maps && bannerTeamPerfData.maps.length > 0 && (
                  <div className="bg-black/50 p-8 rounded-3xl border border-white/10 backdrop-blur-sm flex-1">
                    <h3 className="text-white font-black text-3xl uppercase tracking-widest italic mb-8 flex items-center gap-4">
                      <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                      Desempenho por Mapa
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                      {bannerTeamPerfData.maps.map((map, idx) => (
                        <div key={map.mapName} className="flex items-center gap-6 bg-white/5 border border-white/5 rounded-2xl p-4 shadow-lg">
                           <div className="w-48 shrink-0 border-r border-white/10 pr-6">
                             <h4 className="text-white font-black text-3xl uppercase truncate">{map.mapName}</h4>
                             <div className="text-gray-400 font-bold text-lg mt-1">{map.matches} Quedas</div>
                           </div>
                           
                           <div className="flex-1 flex gap-6 text-center justify-between">
                             <div className="flex-1 bg-black/40 px-4 py-3 rounded-xl border border-white/5">
                               <div className="text-gray-500 font-bold text-sm uppercase mb-1">Pts Totais</div>
                               <div className="text-white font-black text-2xl">{map.pts} <span className="text-gray-500 text-base">({map.avgPts})</span></div>
                             </div>
                             <div className="flex-1 bg-black/40 px-4 py-3 rounded-xl border border-white/5">
                               <div className="text-gray-500 font-bold text-sm uppercase mb-1">Colocação</div>
                               <div className="text-yellow-400 font-black text-2xl">{map.ptsc} <span className="text-gray-500 text-base">({map.avgPtsc})</span></div>
                             </div>
                             <div className="flex-1 bg-black/40 px-4 py-3 rounded-xl border border-white/5">
                               <div className="text-gray-500 font-bold text-sm uppercase mb-1">Abates</div>
                               <div className="text-red-400 font-black text-2xl">{map.abts} <span className="text-gray-500 text-base">({map.avgAbts})</span></div>
                             </div>
                             <div className="flex-1 bg-black/40 px-4 py-3 rounded-xl border border-white/5">
                               <div className="text-gray-500 font-bold text-sm uppercase mb-1">Booyahs</div>
                               <div className="text-blue-400 font-black text-2xl">{map.booyahs} <span className="text-gray-500 text-base">({map.avgBooyahs})</span></div>
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
`;

content = content.replace(/\{\/\* Desempenho por Mapa \*\/\}\n                \{bannerTeamPerfData\.maps && bannerTeamPerfData\.maps\.length > 0 && \([\s\S]*?<\/[dD]iv>\n                  <\/div>\n                \)\}/, mapUI.trim());

fs.writeFileSync('pages/Banners.tsx', content);
