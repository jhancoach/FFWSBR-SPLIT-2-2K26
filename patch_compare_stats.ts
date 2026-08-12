import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');

const targetStr = `
        const stats = {
            name: pName,
            team: '',
            kills: 0,
            damage: 0,
            hs: 0,
            knocks: 0,
            assists: 0,
            gelos: 0,
            gelosDestruidos: 0,
            reviveu: 0,
            aliadosRevividos: 0,
            mvp: 0,
            matches: 0,
            zeroKills: 0,
            withKills: 0,
        };
`;

const replaceStr = `
        const stats = {
            name: pName,
            team: '',
            kills: 0,
            damage: 0,
            hs: 0,
            knocks: 0,
            assists: 0,
            gelos: 0,
            gelosDestruidos: 0,
            reviveu: 0,
            aliadosRevividos: 0,
            mvp: 0,
            matches: 0,
            zeroKills: 0,
            withKills: 0,
            mapKills: {} as Record<string, number>,
        };
`;

content = content.replace(targetStr.trim(), replaceStr.trim());

const targetStr2 = `
        filtered.forEach(p => {
            stats.team = p.TIME;
            stats.matches++;
            stats.kills += parseNumber(p.Abates);
            stats.damage += parseNumber(p.Dano);
            stats.hs += parseNumber(p.HS);
            stats.knocks += parseNumber(p.Deitados);
            stats.assists += parseNumber(p.Assistencias);
            stats.gelos += parseNumber(p.Gelos);
            stats.gelosDestruidos += parseNumber(p.GelosDestruidos);
            stats.reviveu += parseNumber(p.Reviveu);
            stats.aliadosRevividos += parseNumber(p.AliadosRevividos);
            stats.mvp += parseNumber(p.MVP);
        });
`;

const replaceStr2 = `
        filtered.forEach(p => {
            stats.team = p.TIME;
            stats.matches++;
            const pKills = parseNumber(p.Abates);
            stats.kills += pKills;
            stats.damage += parseNumber(p.Dano);
            stats.hs += parseNumber(p.HS);
            stats.knocks += parseNumber(p.Deitados);
            stats.assists += parseNumber(p.Assistencias);
            stats.gelos += parseNumber(p.Gelos);
            stats.gelosDestruidos += parseNumber(p.GelosDestruidos);
            stats.reviveu += parseNumber(p.Reviveu);
            stats.aliadosRevividos += parseNumber(p.AliadosRevividos);
            stats.mvp += parseNumber(p.MVP);
            const m = normalize(p.MAPA) || 'N/A';
            stats.mapKills[m] = (stats.mapKills[m] || 0) + pKills;
        });
`;

content = content.replace(targetStr2.trim(), replaceStr2.trim());

fs.writeFileSync('pages/Players.tsx', content);
console.log("Patched getStats mapKills successfully");
