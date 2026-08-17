const fs = require("fs");
const file = "pages/Banners.tsx";
let code = fs.readFileSync(file, "utf8");

code = code.replace(
    /link\.download = \`Stories_Banner_\$\{activeTab\}_\$\{selectedRd\}\.png\`;/,
    `link.download = (activeTab === 'map_kings' || activeTab === 'drop_kings') ? \`Post_Instagram_\${activeTab}_\${selectedMapOrDrop.replace(/\\//g, '-')}.png\` : \`Stories_Banner_\${activeTab}_\${selectedRd}.png\`;`
);

fs.writeFileSync(file, code);
