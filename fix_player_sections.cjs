const fs = require('fs');
let code = fs.readFileSync('components/PlayerVsPlayerCompare.tsx', 'utf-8');

// Add state variables
code = code.replace(
    /const \[showWeaponsSection, setShowWeaponsSection\] = useState\(true\);/,
    `const [showWeaponsSection, setShowWeaponsSection] = useState(true);
  const [showSection1, setShowSection1] = useState(true);
  const [showSection2, setShowSection2] = useState(true);
  const [showSection3, setShowSection3] = useState(true);
  const [showSection4, setShowSection4] = useState(true);
  const [showSection5, setShowSection5] = useState(true);
  const [showSection6, setShowSection6] = useState(true);
  const [showSection7, setShowSection7] = useState(true);
  const [showSection8, setShowSection8] = useState(true);
  const [showSection9, setShowSection9] = useState(true);`
);

// We need a helper to wrap sections. 
// A section starts with `<div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">` (or similar ID ones)
// and ends with `</div>` right before the next `/* =================... */`

function addToggleToSection(sectionRegex, stateName) {
    let parts = code.split(sectionRegex);
    if(parts.length < 2) return;
    
    let sectionCode = parts[1];
    
    // Find the header div. It usually has `bg-gradient-to-r` or `bg-black/40` and ends with `</div>` before the content `div`.
    // It's safer to find the inner content div. Usually it is `<div className="p-6 md:p-8 grid..."` or `<div className="p-8 space-y-6">`
    let contentDivMatch = sectionCode.match(/<div className="p-[^>]+>/);
    if(contentDivMatch) {
        let contentDiv = contentDivMatch[0];
        
        // Add toggle button to header
        // If there's a button already in a flex gap, wrap it, else just add it.
        // Look for `<div className="flex items-center justify-between` or similar in the header.
        
        // Let's just append the button before the content div. Wait, we want it in the header.
        // The header usually ends with `</div>` right before the content div.
        let headerEndIndex = sectionCode.indexOf(contentDiv);
        let header = sectionCode.substring(0, headerEndIndex);
        
        // Try to inject the button at the end of the flex container in the header
        // Usually `justify-between` is there.
        // We can just add it before the last closing `</div>` of the header.
        
        // Actually, it's safer to just wrap the whole section body
        sectionCode = sectionCode.replace(contentDiv, `{${stateName} && (${contentDiv}`);
        
        // Find end of section (right before next section comment or end of file)
        // Since we split by the section comment, the sectionCode contains everything up to the next section or EOF.
        // We need to find the matching closing div for the main container.
        
        // BUT `parts[1]` is everything after the section comment! We need to split by the NEXT section comment!
    }
}

// Instead of parsing HTML, let's use regex for specific sections.

// SEÇÃO 1
code = code.replace(
    /(SEÇÃO 1[\s\S]*?<div className="bg-gradient-[^>]+>)([\s\S]*?)<\/div>\s*(<div className="p-6 md:p-8 grid)/,
    `$1$2<button onClick={() => setShowSection1(prev => !prev)} className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10">{showSection1 ? 'Ocultar Seção' : 'Mostrar Seção'}{showSection1 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button></div>\n            {showSection1 && ($3`
);
code = code.replace(
    /(<\/div>\s*<\/div>\s*\{\/\* ========================================================================= \*\/\s*\{\/\* SEÇÃO 2)/,
    `</div>\n        )}\n      </div>\n\n      {/* ========================================================================= */}\n      {/* SEÇÃO 2`
);

// SEÇÃO 2
code = code.replace(
    /(SEÇÃO 2[\s\S]*?<div className="bg-gradient-[^>]+>)([\s\S]*?)<\/div>\s*(<div className="p-6 md:p-8 grid)/,
    `$1$2<button onClick={() => setShowSection2(prev => !prev)} className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10">{showSection2 ? 'Ocultar Seção' : 'Mostrar Seção'}{showSection2 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button></div>\n            {showSection2 && ($3`
);
code = code.replace(
    /(<\/div>\s*<\/div>\s*\{\/\* ========================================================================= \*\/\s*\{\/\* SEÇÃO 3)/,
    `</div>\n        )}\n      </div>\n\n      {/* ========================================================================= */}\n      {/* SEÇÃO 3`
);

// SEÇÃO 3
code = code.replace(
    /(SEÇÃO 3[\s\S]*?<div className="bg-gradient-[^>]+>)([\s\S]*?)<\/div>\s*(<div className="p-6 md:p-8 grid)/,
    `$1$2<button onClick={() => setShowSection3(prev => !prev)} className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10">{showSection3 ? 'Ocultar Seção' : 'Mostrar Seção'}{showSection3 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button></div>\n            {showSection3 && ($3`
);
code = code.replace(
    /(<\/div>\s*<\/div>\s*\{\/\* ========================================================================= \*\/\s*\{\/\* SEÇÃO 4)/,
    `</div>\n        )}\n      </div>\n\n      {/* ========================================================================= */}\n      {/* SEÇÃO 4`
);

// SEÇÃO 4
code = code.replace(
    /(SEÇÃO 4[\s\S]*?<div className="bg-gradient-[^>]+>)([\s\S]*?)<\/div>\s*(<div className="p-6 md:p-8 grid)/,
    `$1$2<button onClick={() => setShowSection4(prev => !prev)} className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10">{showSection4 ? 'Ocultar Seção' : 'Mostrar Seção'}{showSection4 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button></div>\n            {showSection4 && ($3`
);
code = code.replace(
    /(<\/div>\s*<\/div>\s*\{\/\* ========================================================================= \*\/\s*\{\/\* SEÇÃO X)/,
    `</div>\n        )}\n      </div>\n\n      {/* ========================================================================= */}\n      {/* SEÇÃO X`
);

// SEÇÃO 5
code = code.replace(
    /(SEÇÃO 5[\s\S]*?<div className="bg-gradient-[^>]+>)([\s\S]*?)<\/div>\s*(<div className="p-8 grid)/,
    `$1$2<button onClick={() => setShowSection5(prev => !prev)} className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10">{showSection5 ? 'Ocultar Seção' : 'Mostrar Seção'}{showSection5 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button></div>\n            {showSection5 && ($3`
);
code = code.replace(
    /(<\/div>\s*<\/div>\s*\{\/\* ========================================================================= \*\/\s*\{\/\* SEÇÃO 6)/,
    `</div>\n        )}\n      </div>\n\n      {/* ========================================================================= */}\n      {/* SEÇÃO 6`
);

// SEÇÃO 6
code = code.replace(
    /(SEÇÃO 6[\s\S]*?<div className="bg-black\/40[^>]+>)([\s\S]*?)<\/div>\s*(<div className="p-8 grid)/,
    `$1$2<button onClick={() => setShowSection6(prev => !prev)} className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10 absolute right-4 top-4">{showSection6 ? 'Ocultar' : 'Mostrar'}</button></div>\n            {showSection6 && ($3`
);
code = code.replace(
    /(<\/div>\s*<\/div>\s*\{\/\* ========================================================================= \*\/\s*\{\/\* SEÇÃO 7)/,
    `</div>\n        )}\n      </div>\n\n      {/* ========================================================================= */}\n      {/* SEÇÃO 7`
);

// SEÇÃO 7
code = code.replace(
    /(SEÇÃO 7[\s\S]*?<div className="bg-black\/40[^>]+>)([\s\S]*?)<\/div>\s*(<div className="p-8 space-y-6)/,
    `$1$2<button onClick={() => setShowSection7(prev => !prev)} className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10 absolute right-4 top-4">{showSection7 ? 'Ocultar' : 'Mostrar'}</button></div>\n            {showSection7 && ($3`
);
code = code.replace(
    /(<\/div>\s*<\/div>\s*\{\/\* ========================================================================= \*\/\s*\{\/\* SEÇÃO 8)/,
    `</div>\n        )}\n      </div>\n\n      {/* ========================================================================= */}\n      {/* SEÇÃO 8`
);

// SEÇÃO 8
code = code.replace(
    /(SEÇÃO 8[\s\S]*?<div className="bg-black\/40[^>]+>)([\s\S]*?)<\/div>\s*(<div className="p-8 space-y-6)/,
    `$1$2<button onClick={() => setShowSection8(prev => !prev)} className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10 absolute right-4 top-4">{showSection8 ? 'Ocultar' : 'Mostrar'}</button></div>\n            {showSection8 && ($3`
);
code = code.replace(
    /(<\/div>\s*<\/div>\s*\{\/\* ========================================================================= \*\/\s*\{\/\* SEÇÃO 9)/,
    `</div>\n        )}\n      </div>\n\n      {/* ========================================================================= */}\n      {/* SEÇÃO 9`
);

// SEÇÃO 9
code = code.replace(
    /(SEÇÃO 9[\s\S]*?<div className="bg-black\/40[^>]+>)([\s\S]*?)<\/div>\s*(<div className="p-8 space-y-6)/,
    `$1$2<button onClick={() => setShowSection9(prev => !prev)} className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10 absolute right-4 top-4">{showSection9 ? 'Ocultar' : 'Mostrar'}</button></div>\n            {showSection9 && ($3`
);
code = code.replace(
    /(<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\s*\}\s*<\/div>\s*\);\s*};)/,
    `</div>\n        )}\n      </div>\n\n          </div>\n        </div>\n      )}\n    </div>\n  );\n};\n`
);


fs.writeFileSync('components/PlayerVsPlayerCompare.tsx', code);
