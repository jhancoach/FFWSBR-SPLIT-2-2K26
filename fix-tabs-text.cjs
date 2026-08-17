const fs = require("fs");
const file = "pages/Banners.tsx";
let code = fs.readFileSync(file, "utf8");

code = code.replace(/Equipes<\/span>/, 'Top 3 (Stories)</span>');
code = code.replace(/Jogadores<\/span>/, 'Top Jogadores (Stories)</span>');
code = code.replace(/>\\s*Por Equipe\\s*<\/button>/, '>Desempenho (Stories)</button>');
code = code.replace(/>\\s*Reis do Mapa\\s*<\/button>/, '>Reis do Mapa (Feed)</button>');
code = code.replace(/>\\s*Reis da Queda\\s*<\/button>/, '>Reis da Queda (Feed)</button>');

fs.writeFileSync(file, code);
