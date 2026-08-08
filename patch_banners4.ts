import fs from 'fs';

let content = fs.readFileSync('pages/Banners.tsx', 'utf-8');

const newHeader = `            {/* Header */}
            <div className="text-center mb-12 relative z-10">
              <h1 className="text-[60px] font-black text-white uppercase tracking-[0.2em] italic mb-4">
                {activeTab === 'team_perf' ? 'Desempenho' : 'Rodada'} <span className="text-yellow-500">{activeTab === 'team_perf' ? (selectedRd === 'all' ? 'Geral' : 'Rodada ' + selectedRd) : selectedRd}</span>
              </h1>
              <div className="h-1 w-32 bg-yellow-500 mx-auto rounded-full"></div>
            </div>`;

content = content.replace(/\{\/\* Header \*\/\}[\s\S]*?<div className="h-1 w-32 bg-yellow-500 mx-auto rounded-full"><\/div>\s*<\/div>/, newHeader);


const teamPerfUI = `) : activeTab === 'team_perf' && bannerTeamPerfData ? (
              <div className="flex-1 flex flex-col justify-start gap-8 relative z-10 w-full">
                
                {/* Cabeçalho da Equipe e Resumo Coletivo */}
                <div className="bg-black/50 p-8 rounded-3xl border border-yellow-500/30 backdrop-blur-sm flex items-center justify-between shadow-[0_10px_30px_rgba(234,179,8,0.2)]">
                  <div className="flex items-center gap-8">
                    <div className="w-40 h-40 rounded-full border-4 border-yellow-400 bg-black overflow-hidden p-6 shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center justify-center">
                      {bannerTeamPerfData.teamImg ? (
                        <img src={bannerTeamPerfData.teamImg} alt={bannerTeamPerfData.teamName} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-white text-5xl font-black uppercase">{bannerTeamPerfData.teamName.substring(0,3)}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-white font-black text-5xl uppercase tracking-wider">{bannerTeamPerfData.teamName}</h2>
                      <div className="text-gray-400 font-bold text-2xl mt-2 uppercase tracking-widest">{bannerTeamPerfData.matches} Quedas Jogadas</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-12 text-center">
                     <div>
                       <p className="text-gray-400 font-bold text-xl uppercase mb-1">Pontos</p>
                       <p className="text-yellow-400 font-black text-5xl">{bannerTeamPerfData.ptsc}</p>
                     </div>
                     <div>
                       <p className="text-gray-400 font-bold text-xl uppercase mb-1">Abates</p>
                       <p className="text-red-400 font-black text-5xl">{bannerTeamPerfData.abts}</p>
                     </div>
                     <div>
                       <p className="text-gray-400 font-bold text-xl uppercase mb-1">Booyahs</p>
                       <p className="text-blue-400 font-black text-5xl">{bannerTeamPerfData.booyahs}</p>
                     </div>
                  </div>
                </div>

                {/* Desempenho Individual (Grid) */}
                <div className="bg-black/50 p-8 rounded-3xl border border-white/10 backdrop-blur-sm flex-1">
                  <h3 className="text-white font-black text-3xl uppercase tracking-widest italic mb-8 flex items-center gap-4">
                    <span className="w-2 h-8 bg-yellow-500 rounded-full"></span>
                    Desempenho Individual
                  </h3>
                  
                  <div className="flex flex-col gap-4">
                    {bannerTeamPerfData.players.slice(0, 6).map((player, idx) => (
                      <div key={player.name} className="flex items-center gap-6 bg-white/5 border border-white/5 rounded-2xl p-4">
                         <div className="text-gray-500 font-black text-3xl w-12 text-right">#{idx + 1}</div>
                         <div className="w-20 h-20 rounded-full border-2 border-white/20 bg-black overflow-hidden flex items-center justify-center shrink-0">
                            {player.img ? (
                              <img src={player.img} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-xl font-black uppercase">{player.name.substring(0,3)}</span>
                            )}
                         </div>
                         <div className="flex-1 min-w-0">
                           <h4 className="text-white font-black text-3xl uppercase truncate">{player.name}</h4>
                           <div className="text-gray-400 font-bold text-lg mt-1">{player.matches} Quedas</div>
                         </div>
                         
                         <div className="flex gap-8 text-center shrink-0 pr-8">
                           <div className="w-32">
                             <p className="text-gray-500 font-bold text-sm uppercase mb-1">Abates</p>
                             <p className="text-white font-black text-3xl">{player.kills} <span className="text-gray-500 text-sm">({player.avgKills})</span></p>
                           </div>
                           <div className="w-32">
                             <p className="text-gray-500 font-bold text-sm uppercase mb-1">Dano</p>
                             <p className="text-white font-black text-3xl">{player.dmg} <span className="text-gray-500 text-sm">({player.avgDmg})</span></p>
                           </div>
                           <div className="w-32">
                             <p className="text-gray-500 font-bold text-sm uppercase mb-1">Deitados</p>
                             <p className="text-white font-black text-3xl">{player.knocks} <span className="text-gray-500 text-sm">({player.avgKnocks})</span></p>
                           </div>
                           <div className="w-32">
                             <p className="text-gray-500 font-bold text-sm uppercase mb-1">HS</p>
                             <p className="text-white font-black text-3xl">{player.hs} <span className="text-gray-500 text-sm">({player.avgHs})</span></p>
                           </div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>`;

content = content.replace("            )}", teamPerfUI + "\n            )}");

fs.writeFileSync('pages/Banners.tsx', content);
