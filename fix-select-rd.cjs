const fs = require("fs");
const file = "pages/Banners.tsx";
let code = fs.readFileSync(file, "utf8");

const oldSelect = `          <select
            value={selectedRd}
            onChange={(e) => setSelectedRd(e.target.value)}
            className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-yellow-500 outline-none w-full md:w-48"
          >
            <option value="" disabled>Selecione a Rodada</option>
            <option value="all">Geral (Todas)</option>
            {availableRds.map(rd => (
              <option key={rd} value={rd}>Rodada {rd}</option>
            ))}
          </select>`;
          
const newSelect = `          {activeTab !== 'map_kings' && activeTab !== 'drop_kings' && (
            <select
              value={selectedRd}
              onChange={(e) => setSelectedRd(e.target.value)}
              className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-yellow-500 outline-none w-full md:w-48"
            >
              <option value="" disabled>Selecione a Rodada</option>
              <option value="all">Geral (Todas)</option>
              {availableRds.map(rd => (
                <option key={rd} value={rd}>Rodada {rd}</option>
              ))}
            </select>
          )}`;

code = code.replace(oldSelect, newSelect);
fs.writeFileSync(file, code);
