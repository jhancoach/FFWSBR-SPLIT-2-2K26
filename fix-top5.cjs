const fs = require("fs");
const file = "pages/Banners.tsx";
let code = fs.readFileSync(file, "utf8");

// Change top10 to top5
code = code.replace(/const top10 = group\.players\.slice\(0, 10\);/, "const top5 = group.players.slice(0, 5);");

// Change "TOP 10" in the header to "TOP 5"
code = code.replace(/TOP 10 REIS DO \{type === \x27map\x27 \? \x27MAPA\x27 : \x27QUEDA\x27\}/, "TOP 5 REIS DO {type === 'map' ? 'MAPA' : 'QUEDA'}");

// Change top10.map to top5.map
code = code.replace(/top10\.map\(\(p, idx\) => \(/, "top5.map((p, idx) => (");

// Add flex-shrink-0 to rank box and image to prevent misalignment
const oldRankBox = `className="w-[60px] h-[60px] bg-black/50 rounded-xl flex items-center justify-center font-black text-[30px] text-gray-500 border border-white/5"`;
const newRankBox = `className="w-[60px] h-[60px] flex-shrink-0 bg-black/50 rounded-xl flex items-center justify-center font-black text-[30px] text-gray-500 border border-white/5"`;
code = code.replace(oldRankBox, newRankBox);

// The N/A image placeholder
const oldNaImg = `className="w-[80px] h-[80px] rounded-full bg-gray-900 border-4 border-gray-800 flex items-center justify-center"`;
const newNaImg = `className="w-[80px] h-[80px] flex-shrink-0 rounded-full bg-gray-900 border-4 border-gray-800 flex items-center justify-center"`;
code = code.replace(oldNaImg, newNaImg);

// The actual image - we need to make sure it has flex-shrink-0
code = code.replace(/rounded-full border-4 object-cover\`/g, "flex-shrink-0 rounded-full border-4 object-cover`");

// Let's also increase the vertical gap between the 5 players slightly so it fills the space better
code = code.replace(/<div className="flex-1 flex flex-col gap-4">/, `<div className="flex-1 flex flex-col gap-8 justify-center pb-8">`);

fs.writeFileSync(file, code);
console.log("Top 10 converted to Top 5 and layouts aligned.");
