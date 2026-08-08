import fs from 'fs';
let content = fs.readFileSync('pages/Banners.tsx', 'utf-8');

const startIndex = content.indexOf(") : activeTab === 'team_perf' && bannerTeamPerfData ? (");
const endIndex = content.indexOf("            {/* Footer */}");

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `) : activeTab === 'team_perf' && bannerTeamPerfData ? (
              <div className="flex-1 flex flex-col justify-start gap-4 relative z-10 w-full">
                
                {/* Cabeçalho da Equipe e Resumo Coletivo */}
                <div className="bg-black/50 p-6 rounded-3xl border border-yellow-500/30 backdrop-blur-sm flex items-center justify-between shadow-[0_10px_30px_rgba(234,179,8,0.2)]">
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 rounded-full border-4 border-yellow-400 bg-black overflow-hidden p-4 shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center justify-center">
                      {bannerTeamPerfData.teamImg ? (
                        <img src={bannerTeamPerfData.teamImg} alt={bannerTeamPerfData.teamName} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-white text-4xl font-black uppercase">{bannerTeamPerfData.teamName.substring(0,3)}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-white font-black text-4xl uppercase tracking-wider">{bannerTeamPerfData.teamName}</h2>
                      <div className="text-gray-400 font-bold text-xl mt-1 uppercase tracking-widest">{bannerTeamPerfData.matches} Quedas Jogadas</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-8 text-center">
                     <div>
                       <p className="text-gray-400 font-bold text-lg uppercase mb-1">Pts Totais</p>
                       <p className="text-white font-black text-4xl">{bannerTeamPerfData.pts}</p>
                     </div>
                     <div>
                       <p className="text-gray-400 font-bold text-lg uppercase mb-1">Colocação</p>
                       <p className="text-yellow-400 font-black text-4xl">{bannerTeamPerfData.ptsc}</p>
                     </div>
                     <div>
                       <p className="text-gray-400 font-bold text-lg uppercase mb-1">Abates</p>
                       <p className="text-red-400 font-black text-4xl">{bannerTeamPerfData.abts}</p>
                     </div>
                     <div>
                       <p className="text-gray-400 font-bold text-lg uppercase mb-1">Booyahs</p>
                       <p className="text-blue-400 font-black text-4xl">{bannerTeamPerfData.booyahs}</p>
                     </div>
                  </div>
                </div>

                {/* Desempenho Individual (Grid) */}
                <div className="bg-black/50 p-6 rounded-3xl border border-white/10 backdrop-blur-sm flex-1 flex flex-col">
                  <h3 className="text-white font-black text-2xl uppercase tracking-widest italic mb-4 flex items-center gap-4 shrink-0">
                    <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>
                    Desempenho Individual
                  </h3>
                  
                  <div className="flex flex-col gap-3 flex-1 overflow-hidden justify-center">
                    {bannerTeamPerfData.players.slice(0, 5).map((player, idx) => (
                      <div key={player.name} className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-3">
                         <div className="text-gray-500 font-black text-2xl w-10 text-right">#{idx + 1}</div>
                         <div className="w-16 h-16 rounded-full border-2 border-white/20 bg-black overflow-hidden flex items-center justify-center shrink-0">
                            {player.img ? (
                              <img src={player.img} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-lg font-black uppercase">{player.name.substring(0,3)}</span>
                            )}
                         </div>
                         <div className="flex-1 min-w-0">
                           <h4 className="text-white font-black text-2xl uppercase truncate">{player.name}</h4>
                           <div className="text-gray-400 font-bold text-base">{player.matches} Quedas</div>
                         </div>
                         
                         <div className="flex gap-4 text-center shrink-0 pr-4">
                           <div className="w-28">
                             <p className="text-gray-500 font-bold text-xs uppercase mb-0.5">Abates</p>
                             <p className="text-white font-black text-2xl">{player.kills} <span className="text-gray-500 text-xs">({player.avgKills})</span></p>
                           </div>
                           <div className="w-28">
                             <p className="text-gray-500 font-bold text-xs uppercase mb-0.5">Dano</p>
                             <p className="text-white font-black text-2xl">{player.dmg} <span className="text-gray-500 text-xs">({player.avgDmg})</span></p>
                           </div>
                           <div className="w-28">
                             <p className="text-gray-500 font-bold text-xs uppercase mb-0.5">Deitados</p>
                             <p className="text-white font-black text-2xl">{player.knocks} <span className="text-gray-500 text-xs">({player.avgKnocks})</span></p>
                           </div>
                           <div className="w-28">
                             <p className="text-gray-500 font-bold text-xs uppercase mb-0.5">HS</p>
                             <p className="text-white font-black text-2xl">{player.hs} <span className="text-gray-500 text-xs">({player.avgHs})</span></p>
                           </div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desempenho por Mapa */}
                {bannerTeamPerfData.maps && bannerTeamPerfData.maps.length > 0 && (
                  <div className="bg-black/50 p-6 rounded-3xl border border-white/10 backdrop-blur-sm flex-1 flex flex-col">
                    <h3 className="text-white font-black text-2xl uppercase tracking-widest italic mb-4 flex items-center gap-4 shrink-0">
                      <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                      Desempenho por Mapa
                    </h3>
                    
                    <div className="flex flex-col gap-3 flex-1 overflow-hidden justify-center">
                      {bannerTeamPerfData.maps.slice(0, 5).map((map, idx) => (
                        <div key={map.mapName} className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-3 shadow-lg">
                           <div className="w-40 shrink-0 border-r border-white/10 pr-4">
                             <h4 className="text-white font-black text-2xl uppercase truncate">{map.mapName}</h4>
                             <div className="text-gray-400 font-bold text-base">{map.matches} Quedas</div>
                           </div>
                           
                           <div className="flex-1 flex gap-4 text-center justify-between">
                             <div className="flex-1 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                               <div className="text-gray-500 font-bold text-xs uppercase mb-0.5">Pts Totais</div>
                               <div className="text-white font-black text-xl">{map.pts} <span className="text-gray-500 text-xs">({map.avgPts})</span></div>
                             </div>
                             <div className="flex-1 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                               <div className="text-gray-500 font-bold text-xs uppercase mb-0.5">Colocação</div>
                               <div className="text-yellow-400 font-black text-xl">{map.ptsc} <span className="text-gray-500 text-xs">({map.avgPtsc})</span></div>
                             </div>
                             <div className="flex-1 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                               <div className="text-gray-500 font-bold text-xs uppercase mb-0.5">Abates</div>
                               <div className="text-red-400 font-black text-xl">{map.abts} <span className="text-gray-500 text-xs">({map.avgAbts})</span></div>
                             </div>
                             <div className="flex-1 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                               <div className="text-gray-500 font-bold text-xs uppercase mb-0.5">Booyahs</div>
                               <div className="text-blue-400 font-black text-xl">{map.booyahs} <span className="text-gray-500 text-xs">({map.avgBooyahs})</span></div>
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

`;

  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('pages/Banners.tsx', content);
} else {
  console.log("Could not find start or end index");
}
