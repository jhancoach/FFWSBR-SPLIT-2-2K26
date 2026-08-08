import fs from 'fs';

let content = fs.readFileSync('pages/Banners.tsx', 'utf-8');

const newButtons = `<button
              onClick={() => setActiveTab('team_perf')}
              className={\`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all \${
                activeTab === 'team_perf' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
              }\`}
            >
              Por Equipe
            </button>
          </div>`;

content = content.replace("</button>\n          </div>", newButtons);

const newSelect = `<option value="all">Geral (Todas)</option>
            {availableRds.map(rd => (`;

content = content.replace("{availableRds.map(rd => (", newSelect);

const teamSelect = `{activeTab === 'team_perf' && (
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-yellow-500 outline-none w-full md:w-48"
            >
              <option value="" disabled>Selecione a Equipe</option>
              {availableTeams.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}`;

content = content.replace("<select\n            value={selectedRd}", teamSelect + "\n          <select\n            value={selectedRd}");

fs.writeFileSync('pages/Banners.tsx', content);
