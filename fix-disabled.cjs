const fs = require("fs");
const file = "pages/Banners.tsx";
let code = fs.readFileSync(file, "utf8");

code = code.replace(
    /disabled=\{isGenerating \|\| \!selectedRd \|\| \(activeTab === \x27team_perf\x27 && \!selectedTeam\)\}/,
    `disabled={isGenerating || ((activeTab !== 'map_kings' && activeTab !== 'drop_kings') && !selectedRd) || (activeTab === 'team_perf' && !selectedTeam) || ((activeTab === 'map_kings' || activeTab === 'drop_kings') && !selectedMapOrDrop)}`
);

fs.writeFileSync(file, code);
