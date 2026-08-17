const fs = require("fs");
const files = ["pages/Banners.tsx", "components/InstagramPostModal.tsx"];

files.forEach(file => {
    let code = fs.readFileSync(file, "utf8");
    code = code.replace(
        /<div className="flex-1 flex flex-col justify-center">\\n\\s*<span className=\{\`font-black uppercase italic leading-none \$\{idx === 0/g,
        `<div className="flex-1 flex flex-col justify-center min-w-0">\n                                        <span className={\`font-black uppercase italic leading-none truncate \${idx === 0`
    );
    
    // Check right side as well (the value)
    code = code.replace(
        /<div className="flex-1 flex flex-col justify-center">\\n\\s*<span className="text-\\[20px\\] font-black text-gray-500/g,
        `<div className="flex-1 flex flex-col justify-center min-w-0">\n                                            <span className="text-[20px] font-black text-gray-500`
    );
    // Add truncate to the player name in the right side
    code = code.replace(
        /<span className="text-\\[35px\\] font-black text-white italic uppercase leading-none">\{h\.player\?\.name \|\| "-"\}/g,
        `<span className="text-[35px] font-black text-white italic uppercase leading-none truncate">{h.player?.name || "-"}</span>`
    );
    // Add truncate to the title in the right side
    code = code.replace(
        /<span className="text-\\[20px\\] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">\{h\.title\}/g,
        `<span className="text-[20px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1 truncate">{h.title}</span>`
    );

    fs.writeFileSync(file, code);
});
console.log("Truncate added.");
