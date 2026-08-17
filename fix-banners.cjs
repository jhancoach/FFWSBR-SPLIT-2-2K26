const fs = require("fs");
const file = "pages/Banners.tsx";
let code = fs.readFileSync(file, "utf8");

const mapDropKingsRender = `
            ) : (activeTab === 'map_kings' || activeTab === 'drop_kings') && kingsData.length > 0 && selectedMapOrDrop ? (
              (() => {
                const group = kingsData.find(g => g.name === selectedMapOrDrop);
                if (!group) return null;
                const type = activeTab === 'map_kings' ? 'map' : 'drop';
                const top10 = group.players.slice(0, 10);
                return (
                  <div className="w-full h-full flex flex-col relative z-10 -mx-20 -my-20">
                    <div className="pt-24 px-16 z-10 flex flex-col items-center">
                        <h1 className="text-[80px] font-black text-white uppercase italic tracking-tighter leading-none text-center">
                            TOP 10 REIS DO {type === 'map' ? 'MAPA' : 'QUEDA'}
                        </h1>
                        <div className="mt-4 px-10 py-3 bg-yellow-500 rounded-2xl">
                            <span className="text-[50px] font-black text-black uppercase tracking-widest">{group.name}</span>
                        </div>
                    </div>

                    <div className="flex-1 flex gap-12 px-16 pt-16 z-10">
                        {/* Left Side: Top 10 Ranking */}
                        <div className="flex-1 flex flex-col gap-4">
                            <h2 className="text-[35px] font-black text-yellow-500 uppercase tracking-widest border-b-4 border-yellow-500/30 pb-4 mb-2">Ranking de Abates</h2>
                            {top10.map((p, idx) => (
                                <div key={idx} className="flex items-center gap-6 bg-white/5 rounded-2xl p-4 border border-white/10">
                                    <div className="w-[60px] h-[60px] bg-black/50 rounded-xl flex items-center justify-center font-black text-[30px] text-gray-500 border border-white/5">
                                        {idx === 0 ? <Crown size={36} className="text-yellow-500" /> : idx + 1}
                                    </div>
                                    {p.playerImg ? (
                                        <img src={p.playerImg} alt="" crossOrigin="anonymous" className="w-[80px] h-[80px] rounded-full border-4 border-gray-800 object-cover" />
                                    ) : (
                                        <div className="w-[80px] h-[80px] rounded-full bg-gray-900 border-4 border-gray-800 flex items-center justify-center">
                                            <span className="text-gray-600">N/A</span>
                                        </div>
                                    )}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <span className="text-[40px] font-black text-white uppercase italic leading-none">{p.name}</span>
                                        <div className="flex items-center gap-3 mt-1">
                                            {p.teamImg && <img src={p.teamImg} alt="" crossOrigin="anonymous" className="w-8 h-8 object-contain opacity-70" />}
                                            <span className="text-[22px] font-bold text-gray-400 uppercase tracking-widest">{p.team}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center w-[120px]">
                                        <span className="text-[45px] font-black text-yellow-500 leading-none">{p.kills}</span>
                                        <span className="text-[18px] font-bold text-gray-500 uppercase">Kills</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right Side: Highlights Grid */}
                        <div className="w-[450px] flex flex-col gap-6">
                            <h2 className="text-[35px] font-black text-yellow-500 uppercase tracking-widest border-b-4 border-yellow-500/30 pb-4 mb-2">Destaques</h2>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { title: "Maior Dano", player: group.topDamage, value: group.topDamage?.damage, icon: <Flame className="text-red-500" size={32} />, color: "bg-red-500/10 border-red-500/20 text-red-500" },
                                    { title: "Média Kills", player: group.topAvgKills, value: group.topAvgKills?.avgKills.toFixed(2), icon: <Crosshair className="text-green-500" size={32} />, color: "bg-green-500/10 border-green-500/20 text-green-500" },
                                    { title: "Mais Derruba", player: group.topKnocks, value: group.topKnocks?.knocks, icon: <AlertTriangle className="text-orange-500" size={32} />, color: "bg-orange-500/10 border-orange-500/20 text-orange-500" },
                                    { title: "Mais HS", player: group.topHs, value: group.topHs?.hs, icon: <TargetIcon className="text-yellow-500" size={32} />, color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" },
                                    { title: "Mais Zera", player: group.topZero, value: \`\${group.topZero?.zeroKills}\`, icon: <Skull className="text-gray-400" size={32} />, color: "bg-gray-500/10 border-gray-500/20 text-gray-400" },
                                    { title: "Mais Revive", player: group.topRevives, value: group.topRevives?.reviveu, icon: <Activity className="text-cyan-500" size={32} />, color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500" },
                                    { title: "Aliados Rev", player: group.topAlliesRevived, value: group.topAlliesRevived?.aliadosRevividos, icon: <Shield className="text-emerald-500" size={32} />, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" },
                                    { title: "Mais MVP", player: group.topMvp, value: group.topMvp?.mvp, icon: <Star className="text-purple-500" size={32} />, color: "bg-purple-500/10 border-purple-500/20 text-purple-500" },
                                ].map((h, i) => (
                                    <div key={i} className={\`flex items-center gap-6 p-5 rounded-3xl border border-white/5 bg-black/40\`}>
                                        <div className={\`p-4 rounded-2xl \${h.color} border\`}>
                                            {h.icon}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <span className="text-[20px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">{h.title}</span>
                                            <span className="text-[35px] font-black text-white italic uppercase leading-none">{h.player?.name || "-"}</span>
                                        </div>
                                        <span className={\`text-[45px] font-black italic \${h.color.split(' ')[2]}\`}>
                                            {h.value || 0}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                  </div>
                );
              })()
            ) : null}
`;

if (code.includes("          ) : null}")) {
    code = code.replace(
        /            \) : null\}/,
        mapDropKingsRender
    );
}

// Hide the header logic
const headerCode = `            {/* Header */}
            <div className="text-center mb-12 relative z-10">
              <h1 className="text-[60px] font-black text-white uppercase tracking-[0.2em] italic mb-4">
                {activeTab === 'team_perf' ? 'Desempenho' : 'Rodada'} <span className="text-yellow-500">{activeTab === 'team_perf' ? (selectedRd === 'all' ? 'Geral' : 'Rodada ' + selectedRd) : selectedRd}</span>
              </h1>
              <div className="h-1 w-32 bg-yellow-500 mx-auto rounded-full"></div>
            </div>`;
const newHeaderCode = `            {/* Header */}
            {activeTab !== 'map_kings' && activeTab !== 'drop_kings' && (
              <div className="text-center mb-12 relative z-10">
                <h1 className="text-[60px] font-black text-white uppercase tracking-[0.2em] italic mb-4">
                  {activeTab === 'team_perf' ? 'Desempenho' : 'Rodada'} <span className="text-yellow-500">{activeTab === 'team_perf' ? (selectedRd === 'all' ? 'Geral' : 'Rodada ' + selectedRd) : selectedRd}</span>
                </h1>
                <div className="h-1 w-32 bg-yellow-500 mx-auto rounded-full"></div>
              </div>
            )}`;
code = code.replace(headerCode, newHeaderCode);

const oldScaleWrap = `<div className="relative origin-top transform scale-[0.4] sm:scale-[0.5] md:scale-[0.6] lg:scale-[0.7] -mb-[1152px] sm:-mb-[960px] md:-mb-[768px] lg:-mb-[576px]">`;
const newScaleWrap = `<div className={\`relative origin-top transform scale-[0.4] sm:scale-[0.5] md:scale-[0.6] lg:scale-[0.7] \${(activeTab === 'map_kings' || activeTab === 'drop_kings') ? '-mb-[810px] sm:-mb-[675px] md:-mb-[540px] lg:-mb-[405px]' : '-mb-[1152px] sm:-mb-[960px] md:-mb-[768px] lg:-mb-[576px]'}\`}>`;

const oldBannerRef = `            className="bg-gradient-to-br from-[#1a1a1a] to-black w-[1080px] h-[1920px] relative overflow-hidden flex flex-col font-display border border-white/5"`;
const newBannerRef = `            className={\`bg-gradient-to-br from-[#1a1a1a] to-black w-[1080px] \${(activeTab === 'map_kings' || activeTab === 'drop_kings') ? 'h-[1350px]' : 'h-[1920px]'} relative overflow-hidden flex flex-col font-display border border-white/5\`}`;

code = code.replace(oldScaleWrap, newScaleWrap);
code = code.replace(oldBannerRef, newBannerRef);

fs.writeFileSync(file, code);
