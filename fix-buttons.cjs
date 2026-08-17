const fs = require("fs");
const file = "pages/Banners.tsx";
let code = fs.readFileSync(file, "utf8");

const oldButtons = `              Por Equipe
            </button>
          </div>`;
          
const newButtons = `              Por Equipe
            </button>
            <button
              onClick={() => setActiveTab('map_kings')}
              className={\`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all \${
                activeTab === 'map_kings' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
              }\`}
            >
              Reis do Mapa
            </button>
            <button
              onClick={() => setActiveTab('drop_kings')}
              className={\`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all \${
                activeTab === 'drop_kings' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
              }\`}
            >
              Reis da Queda
            </button>
          </div>`;

code = code.replace(oldButtons, newButtons);
fs.writeFileSync(file, code);
