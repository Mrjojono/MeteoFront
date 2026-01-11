const AnimatedBackground = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-100">

            {/* --- 1. SOLEIL STYLISÉ (Haut Centre) --- */}
            <div className="absolute -top-12.5 left-1/2 -translate-x-1/2 w-64 h-64 opacity-20">
                <div className="absolute inset-0 border-[3px] border-dashed border-yellow-400 rounded-full animate-spin-slow"></div>
                <div className="absolute inset-8 bg-yellow-200 rounded-full blur-3xl"></div>
            </div>

            {/* --- 2. BLOBS / NUAGES (Plus nombreux) --- */}
            {/* Nuage Bleu (Haut Gauche) */}
            <svg className="absolute top-0 left-0 w-[500px] h-[500px] -ml-32 -mt-32 opacity-30 animate-blob-custom" viewBox="0 0 200 200">
                <path fill="#BFDBFE" d="M50,150 Q0,130 0,80 Q0,50 20,30 Q50,0 90,0 Q120,0 140,20 Q160,40 160,70 Q180,80 180,100 Q180,140 150,160 Q120,180 80,180 Q40,180 20,160 Q0,150 0,120 L50,150Z" />
            </svg>

            {/* Nuage Gris (Haut Droite) */}
            <svg className="absolute top-20 right-[-100px] w-96 h-96 opacity-20 animate-blob-custom animation-delay-2000" viewBox="0 0 200 200">
                <path fill="#94A3B8" d="M80,20 Q120,0 140,30 Q160,50 160,80 Q180,100 180,130 Q160,160 120,180 Q80,200 40,190 Q10,170 0,140 Q0,100 20,70 Q40,30 80,20Z" />
            </svg>

            {/* Nuage de Fond (Bas Gauche) */}
            <svg className="absolute bottom-[-100px] left-[-50px] w-[600px] h-[400px] opacity-25 animate-blob-custom animation-delay-4000" viewBox="0 0 200 100">
                <path fill="#BAE6FD" d="M0,100 C0,30 50,0 100,0 C150,0 200,30 200,100 Z" />
            </svg>

            {/* --- 3. ÉCLAIRS (Flash intermittents) --- */}
            <svg className="absolute top-[15%] right-[20%] w-8 h-16 text-yellow-400 opacity-0 animate-lightning" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <svg className="absolute top-[40%] right-[10%] w-6 h-12 text-yellow-400 opacity-0 animate-lightning animation-delay-3000" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>

            {/* --- 4. LIGNES DE VENT (Gusts) --- */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent opacity-30 -rotate-6 animate-wind-line"></div>
            <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-20 rotate-3 animate-wind-line animation-delay-2000"></div>

            {/* --- 5. EFFETS DE PRÉCIPITATION --- */}
            {/* Pluie */}
            <div className="absolute top-[20%] right-[15%] opacity-40">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="absolute w-[1px] h-6 bg-blue-400 rounded-full animate-fall"
                         style={{ left: `${i * 25}px`, animationDuration: `${1.2 + i * 0.1}s`, animationDelay: `${i * 0.2}s` }}
                    ></div>
                ))}
            </div>

            {/* Flocons */}
            <div className="absolute top-[60%] left-[15%] opacity-30">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="absolute text-blue-300 text-xl animate-fall"
                         style={{ left: `${i * 50}px`, animationDuration: `${4 + i * 0.5}s`, animationDelay: `${i * 0.4}s` }}
                    > ❄️ </div>
                ))}
            </div>

            {/* --- 6. DESSINS TECHNIQUES --- */}
            {/* Échelle latérale (Baromètre) */}
            <div className="absolute left-4 top-1/4 bottom-1/4 w-8 flex flex-col justify-between items-start opacity-20 border-l border-slate-400 pl-1">
                {[1030, 1020, 1010, 1000, 990].map(val => (
                    <div key={val} className="text-[10px] font-mono flex items-center gap-2">
                        <span className="w-2 h-[1px] bg-slate-400"></span> {val}
                    </div>
                ))}
            </div>

            {/* Isobares */}
            <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
                <pattern id="isobars" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                    <path d="M0,100 Q50,80 100,100 T200,100" stroke="#60A5FA" strokeWidth="1" fill="none" />
                    <path d="M0,150 Q50,130 100,150 T200,150" stroke="#94A3B8" strokeWidth="0.5" fill="none" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#isobars)" />
            </svg>

            {/* Spirale (Bas Droite) */}
            <svg className="absolute bottom-[-50px] right-[-50px] w-80 h-80 opacity-20 animate-spin-very-slow" viewBox="0 0 200 200">
                {[80, 65, 50, 35, 20].map((r, i) => (
                    <circle key={i} cx="100" cy="100" r={r} stroke={i % 2 === 0 ? "#60A5FA" : "#94A3B8"} strokeWidth="1" fill="none" strokeDasharray={i === 0 ? "5,5" : "0"} />
                ))}
            </svg>

            <style>{`
                @keyframes blob-custom {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(40px, -60px) scale(1.1); }
                    66% { transform: translate(-30px, 30px) scale(0.9); }
                }

                @keyframes fall {
                    0% { transform: translateY(-100px); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translateY(400px); opacity: 0; }
                }

                @keyframes lightning {
                    0%, 90%, 100% { opacity: 0; }
                    92%, 95% { opacity: 0.8; }
                }

                @keyframes wind-line {
                    0% { transform: translateX(-100%) rotate(-6deg); opacity: 0; }
                    50% { opacity: 0.3; }
                    100% { transform: translateX(100%) rotate(-6deg); opacity: 0; }
                }

                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .animate-blob-custom { animation: blob-custom 12s infinite ease-in-out; }
                .animate-fall { animation: fall linear infinite; }
                .animate-lightning { animation: lightning 5s infinite; }
                .animate-wind-line { animation: wind-line 8s infinite linear; }
                .animate-spin-slow { animation: spin-slow 15s linear infinite; }
                .animate-spin-very-slow { animation: spin-slow 40s linear infinite; }
                
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-3000 { animation-delay: 3s; }
                .animation-delay-4000 { animation-delay: 4s; }
            `}</style>
        </div>
    );
};

export default AnimatedBackground;