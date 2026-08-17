const fs = require("fs");
const file = "components/InstagramPostModal.tsx";
let code = fs.readFileSync(file, "utf8");

// 1. Fix the wrapper logic that causes padding squishing in Banners.tsx
const oldWrapper = `<div className="w-full h-full flex flex-col relative z-10 -mx-20 -my-20">`;
const newWrapper = `<div className="absolute inset-0 z-10 flex flex-col bg-[#0a0a0a]">`;
code = code.replace(oldWrapper, newWrapper);

// 2. Adjust spacing to give more width to columns
code = code.replace(/<div className="flex-1 flex gap-12 px-16 pt-16 z-10">/, `<div className="flex-1 flex justify-between px-10 pt-16 pb-10 z-10">`);

// 3. Set explicit width for left and right side
code = code.replace(/<div className="flex-1 flex flex-col gap-8 justify-center pb-8">/, `<div className="w-[540px] flex flex-col gap-8 justify-center pb-0">`);
code = code.replace(/<div className="w-\\[450px\\] flex flex-col gap-6">/, `<div className="w-[440px] flex flex-col gap-6">`);

// 4. Adjust left column items to fit better
const oldLeftCard = `<div key={idx} className="flex items-center gap-6 bg-white/5 rounded-2xl p-4 border border-white/10">`;
const newLeftCard = `<div key={idx} className="flex items-center gap-4 bg-white/5 rounded-2xl py-3 px-4 border border-white/10">`;
code = code.replace(oldLeftCard, newLeftCard);

// 5. Shrink top 1 image slightly and normal images
code = code.replace(/w-\\[100px\\] h-\\[100px\\]/, `w-[90px] h-[90px]`);
code = code.replace(/w-\\[80px\\] h-\\[80px\\]/g, `w-[70px] h-[70px]`);

// 6. Reduce Name font sizes
code = code.replace(/text-\\[60px\\]/, `text-[48px]`);
code = code.replace(/text-\\[40px\\]/, `text-[35px]`);

// 7. Right column card padding shrink
const oldRightCard = `<div key={i} className={\`flex items-center gap-6 p-5 rounded-3xl border border-white/5 bg-black/40\`}>`;
const newRightCard = `<div key={i} className={\`flex items-center gap-4 py-3 px-5 rounded-3xl border border-white/5 bg-black/40\`}>`;
code = code.replace(oldRightCard, newRightCard);

fs.writeFileSync(file, code);
console.log("Modal layout adjusted.");
