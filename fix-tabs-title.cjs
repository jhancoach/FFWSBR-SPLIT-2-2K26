const fs = require("fs");
const file = "pages/Banners.tsx";
let code = fs.readFileSync(file, "utf8");

code = code.replace(/Gerador de Stories/, 'Gerador de Banners (Stories & Feed)');
code = code.replace(/Gere banners verticais para o Instagram com os TOP 3 da rodada ou da equipe\./, 'Gere banners para Instagram Stories e Feed com os destaques.');

code = code.replace(
    /              Equipes\n            <\/button>/,
    '              Top 3 (Stories)\n            </button>'
);

code = code.replace(
    /              Jogadores\n            <\/button>/,
    '              Top Jogadores (Stories)\n            </button>'
);

code = code.replace(
    /              Por Equipe\n            <\/button>/,
    '              Por Equipe (Stories)\n            </button>'
);

code = code.replace(
    /              Reis do Mapa\n            <\/button>/,
    '              Reis do Mapa (Feed)\n            </button>'
);

code = code.replace(
    /              Reis da Queda\n            <\/button>/,
    '              Reis da Queda (Feed)\n            </button>'
);

fs.writeFileSync(file, code);
