const fs = require('fs');
let code = fs.readFileSync('components/TeamVsTeamCombatCompare.tsx', 'utf-8');

// Section 1
code = code.replace(
    /(<button\s+onClick=\{\(\) => setShowAllVictimTeams\(prev => !prev\)\}.*?<\/button>)/s,
    `<div className="flex items-center gap-4">
            $1
            <button
              onClick={() => setShowSection1(prev => !prev)}
              className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10"
            >
              {showSection1 ? 'Ocultar Seção' : 'Mostrar Seção'}
              {showSection1 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>`
);
code = code.replace(
    /<div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">/,
    `{showSection1 && (<div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">`
);
// Find the end of Section 1 and add )}
code = code.replace(
    /(<\/div>\s*<\/div>\s*\{\/\* ========================================================================= \*\/\s*\{\/\* SEÇÃO 2: TIMES QUE MAIS MATAM \(EQUIPES ALGOZES\) \*\/\})/,
    `</div>\n        )}\n      </div>\n\n      {/* ========================================================================= */}\n      {/* SEÇÃO 2: TIMES QUE MAIS MATAM (EQUIPES ALGOZES) */}`
);

// Section 2
code = code.replace(
    /(<button\s+onClick=\{\(\) => setShowAllKillerTeams\(prev => !prev\)\}.*?<\/button>)/s,
    `<div className="flex items-center gap-4">
            $1
            <button
              onClick={() => setShowSection2(prev => !prev)}
              className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10"
            >
              {showSection2 ? 'Ocultar Seção' : 'Mostrar Seção'}
              {showSection2 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>`
);
// The content of section 2 has `<div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">`
let parts = code.split('{/* SEÇÃO 2: TIMES QUE MAIS MATAM (EQUIPES ALGOZES) */}');
parts[1] = parts[1].replace(
    /<div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">/,
    `{showSection2 && (<div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">`
);
code = parts.join('{/* SEÇÃO 2: TIMES QUE MAIS MATAM (EQUIPES ALGOZES) */}');

code = code.replace(
    /(<\/div>\s*<\/div>\s*\{\/\* ========================================================================= \*\/\s*\{\/\* SEÇÃO 3: JOGADORES QUE MAIS MORREM \(VÍTIMAS FREQUENTES\) \*\/\})/,
    `</div>\n        )}\n      </div>\n\n      {/* ========================================================================= */}\n      {/* SEÇÃO 3: JOGADORES QUE MAIS MORREM (VÍTIMAS FREQUENTES) */}`
);

// Section 3
code = code.replace(
    /(<button\s+onClick=\{\(\) => setShowAllVictimPlayers\(prev => !prev\)\}.*?<\/button>)/s,
    `<div className="flex items-center gap-4">
            $1
            <button
              onClick={() => setShowSection3(prev => !prev)}
              className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10"
            >
              {showSection3 ? 'Ocultar Seção' : 'Mostrar Seção'}
              {showSection3 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>`
);
parts = code.split('{/* SEÇÃO 3: JOGADORES QUE MAIS MORREM (VÍTIMAS FREQUENTES) */}');
parts[1] = parts[1].replace(
    /<div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">/,
    `{showSection3 && (<div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">`
);
code = parts.join('{/* SEÇÃO 3: JOGADORES QUE MAIS MORREM (VÍTIMAS FREQUENTES) */}');

code = code.replace(
    /(<\/div>\s*<\/div>\s*\{\/\* ========================================================================= \*\/\s*\{\/\* SEÇÃO 4: JOGADORES QUE MAIS MATAM \(MAIORES ALGOZES\) \*\/\})/,
    `</div>\n        )}\n      </div>\n\n      {/* ========================================================================= */}\n      {/* SEÇÃO 4: JOGADORES QUE MAIS MATAM (MAIORES ALGOZES) */}`
);


// Section 4
code = code.replace(
    /(<button\s+onClick=\{\(\) => setShowAllKillerPlayers\(prev => !prev\)\}.*?<\/button>)/s,
    `<div className="flex items-center gap-4">
            $1
            <button
              onClick={() => setShowSection4(prev => !prev)}
              className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10"
            >
              {showSection4 ? 'Ocultar Seção' : 'Mostrar Seção'}
              {showSection4 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>`
);
parts = code.split('{/* SEÇÃO 4: JOGADORES QUE MAIS MATAM (MAIORES ALGOZES) */}');
parts[1] = parts[1].replace(
    /<div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">/,
    `{showSection4 && (<div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">`
);
code = parts.join('{/* SEÇÃO 4: JOGADORES QUE MAIS MATAM (MAIORES ALGOZES) */}');

code = code.replace(
    /(<\/div>\s*<\/div>\s*\{\/\* ========================================================================= \*\/\s*\{\/\* SEÇÃO X: ANÁLISE DE ARMAS \*\/\})/,
    `</div>\n        )}\n      </div>\n\n      {/* ========================================================================= */}\n      {/* SEÇÃO X: ANÁLISE DE ARMAS */}`
);

fs.writeFileSync('components/TeamVsTeamCombatCompare.tsx', code);
