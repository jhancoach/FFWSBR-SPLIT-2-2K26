import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { X, Download, Flame, Crosshair, AlertTriangle, Target as TargetIcon, Skull, Activity, Shield, Star, Crown } from 'lucide-react';
import { PlayerData } from '../types';

interface GroupData {
    name: string;
    players: any[];
    topDamage: any;
    topAvgKills: any;
    topKnocks: any;
    topHs: any;
    topZero: any;
    topRevives: any;
    topAlliesRevived: any;
    topMvp: any;
}

interface InstagramPostModalProps {
    group: GroupData;
    type: 'map' | 'drop';
    onClose: () => void;
}

const InstagramPostModal: React.FC<InstagramPostModalProps> = ({ group, type, onClose }) => {
    const postRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (!postRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(postRef.current, {
                scale: 2, // High resolution
                useCORS: true,
                backgroundColor: '#0a0a0a',
            });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `Top10_${type}_${group.name.replace(/\s+/g, '_')}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const top5 = group.players.slice(0, 5);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#121215] rounded-3xl border border-gray-800 w-full max-w-[600px] flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-black/40">
                    <h2 className="text-lg font-black text-white uppercase italic">Gerar Post Instagram</h2>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-[#0a0a0a]">
                    
                    {/* The Instagram Post Canvas (1080x1350 Aspect Ratio scaled down via CSS) */}
                    {/* using a wrapper to scale down */}
                    <div className="relative w-full max-w-[400px] flex-shrink-0" style={{ aspectRatio: '4/5' }}>
                        {/* Actual content to capture - forced to 1080x1350 */}
                        <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.37037)', transformOrigin: 'top left' }}>
                            <div 
                                ref={postRef}
                                className="w-[1080px] h-[1350px] bg-[#0a0a0a] flex flex-col"
                            >
                            {/* Header Background */}
                            <div className="h-[250px] bg-gradient-to-br from-yellow-500/20 to-black w-full absolute top-0 left-0 pointer-events-none"></div>

                            {/* Header Content */}
                            <div className="pt-24 px-16 z-10 flex flex-col items-center">
                                <h1 className="text-[80px] font-black text-white uppercase italic tracking-tighter leading-none text-center">
                                    TOP 5 REIS DO {type === 'map' ? 'MAPA' : 'QUEDA'}
                                </h1>
                                <div className="mt-4 px-10 py-3 bg-yellow-500 rounded-2xl">
                                    <span className="text-[50px] font-black text-black uppercase tracking-widest">{group.name}</span>
                                </div>
                            </div>

                            <div className="flex-1 flex justify-between px-10 pt-16 pb-10 z-10">
                                {/* Left Side: Top 10 Ranking */}
                                <div className="w-[540px] flex flex-col gap-8 justify-center pb-0">
                                    <h2 className="text-[35px] font-black text-yellow-500 uppercase tracking-widest border-b-4 border-yellow-500/30 pb-4 mb-2">Ranking de Abates</h2>
                                    {top5.map((p, idx) => (
                                        <div key={idx} className="flex items-center gap-4 bg-white/5 rounded-2xl py-3 px-4 border border-white/10">
                                            <div className="w-[60px] h-[60px] flex-shrink-0 bg-black/50 rounded-xl flex items-center justify-center font-black text-[30px] text-gray-500 border border-white/5">
                                                {idx === 0 ? <Crown size={36} className="text-yellow-500" /> : idx + 1}
                                            </div>
                                            {p.playerImg ? (
                                                <img src={p.playerImg} alt="" crossOrigin="anonymous" className={`${idx === 0 ? 'w-[100px] h-[100px] border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'w-[80px] h-[80px] border-gray-800'} flex-shrink-0 rounded-full border-4 object-cover`} />
                                            ) : (
                                                <div className="w-[80px] h-[80px] flex-shrink-0 rounded-full bg-gray-900 border-4 border-gray-800 flex items-center justify-center">
                                                    <span className="text-gray-600">N/A</span>
                                                </div>
                                            )}
                                            <div className="flex-1 flex flex-col justify-center">
                                                <span className={`font-black uppercase italic leading-none ${idx === 0 ? 'text-yellow-500 text-[60px] drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'text-white text-[40px]'}`}>{p.name}</span>
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
                                            { title: "Mais Zera", player: group.topZero, value: `${group.topZero?.zeroKills}`, icon: <Skull className="text-gray-400" size={32} />, color: "bg-gray-500/10 border-gray-500/20 text-gray-400" },
                                            { title: "Mais Revive", player: group.topRevives, value: group.topRevives?.reviveu, icon: <Activity className="text-cyan-500" size={32} />, color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500" },
                                            { title: "Aliados Rev", player: group.topAlliesRevived, value: group.topAlliesRevived?.aliadosRevividos, icon: <Shield className="text-emerald-500" size={32} />, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" },
                                            { title: "Mais MVP", player: group.topMvp, value: group.topMvp?.mvp, icon: <Star className="text-purple-500" size={32} />, color: "bg-purple-500/10 border-purple-500/20 text-purple-500" },
                                        ].map((h, i) => (
                                            <div key={i} className={`flex items-center gap-4 py-3 px-5 rounded-3xl border border-white/5 bg-black/40`}>
                                                <div className={`p-4 rounded-2xl ${h.color} border`}>
                                                    {h.icon}
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <span className="text-[20px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">{h.title}</span>
                                                    <span className="text-[35px] font-black text-white italic uppercase leading-none">{h.player?.name || "-"}</span>
                                                </div>
                                                <span className={`text-[45px] font-black italic ${h.color.split(' ')[2]}`}>
                                                    {h.value || 0}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Footer */}
                            <div className="h-[80px] mt-auto w-full flex items-center justify-center opacity-30">
                                <span className="text-[25px] font-black tracking-[0.5em] text-white uppercase">FFWSBR 2026 SPLIT 2</span>
                            </div>
                          </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 border-t border-white/5 bg-black/40 flex justify-end">
                    <button 
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="flex items-center gap-3 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase rounded-xl transition-colors disabled:opacity-50"
                    >
                        {isGenerating ? 'Gerando Imagem...' : (
                            <>
                                <Download size={20} />
                                Baixar Imagem (Instagram)
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstagramPostModal;
