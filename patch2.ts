import fs from 'fs';
let content = fs.readFileSync('pages/Banners.tsx', 'utf-8');

const mapUI = `                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Desempenho por Mapa */}
                {bannerTeamPerfData.maps && bannerTeamPerfData.maps.length > 0 && (
                  <div className="bg-black/50 p-8 rounded-3xl border border-white/10 backdrop-blur-sm flex-1">
                    <h3 className="text-white font-black text-3xl uppercase tracking-widest italic mb-8 flex items-center gap-4">
                      <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                      Desempenho por Mapa
                    </h3>
                    
                    <div className="flex gap-4 overflow-x-auto pb-4">
                      {bannerTeamPerfData.maps.map((map, idx) => (
                        <div key={map.mapName} className="flex-1 min-w-[200px] bg-white/5 border border-white/5 rounded-2xl p-6 text-center shadow-lg">
                           <h4 className="text-white font-black text-2xl uppercase mb-1">{map.mapName}</h4>
                           <div className="text-gray-400 font-bold text-sm mb-4">{map.matches} Quedas</div>
                           
                           <div className="flex flex-col gap-3">
                             <div className="flex justify-between items-center bg-black/40 px-4 py-2 rounded-lg">
                               <span className="text-gray-500 font-bold text-sm uppercase">Pontos</span>
                               <span className="text-yellow-400 font-black text-xl">{map.ptsc}</span>
                             </div>
                             <div className="flex justify-between items-center bg-black/40 px-4 py-2 rounded-lg">
                               <span className="text-gray-500 font-bold text-sm uppercase">Abates</span>
                               <span className="text-red-400 font-black text-xl">{map.abts}</span>
                             </div>
                             <div className="flex justify-between items-center bg-black/40 px-4 py-2 rounded-lg">
                               <span className="text-gray-500 font-bold text-sm uppercase">Booyahs</span>
                               <span className="text-blue-400 font-black text-xl">{map.booyahs}</span>
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>`;

content = content.replace(/                        <\/div>\n                      <\/div>\n                    \}\)\}\n                  <\/div>\n                <\/div>\n\n              <\/div>/, mapUI);

// Fix preview container overflow
content = content.replace(/className="flex justify-center bg-black\/40 p-4 md:p-8 rounded-3xl border border-white\/5 overflow-hidden"/, 'className="flex md:justify-center bg-black/40 p-4 md:p-8 rounded-3xl border border-white/5 overflow-x-auto"');

fs.writeFileSync('pages/Banners.tsx', content);
