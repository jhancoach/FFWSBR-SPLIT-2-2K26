import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');

const targetStr = `
    const arr = Array.from(playerMap.values());
    arr.sort((a, b) => {
        let valA = a[activeHabSort.field as keyof typeof a];
        let valB = b[activeHabSort.field as keyof typeof b];
        
        // Handling edge cases where val is a string (like name or team)
        if (typeof valA === 'string' && typeof valB === 'string') {
             return activeHabSort.direction === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
        }
        
        // Number comparison
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
        return activeHabSort.direction === 'desc' ? valB - valA : valA - valB;
    });
`;

const replaceStr = `
    const arr = Array.from(playerMap.values());
    arr.sort((a, b) => {
        if (activeHabSort.field.startsWith('safe_')) {
            const safeName = activeHabSort.field.replace('safe_', '');
            const sA = a.safeKills?.[safeName] || 0;
            const sB = b.safeKills?.[safeName] || 0;
            return activeHabSort.direction === 'desc' ? sB - sA : sA - sB;
        }

        let valA = a[activeHabSort.field as keyof typeof a] as any;
        let valB = b[activeHabSort.field as keyof typeof b] as any;
        
        // Handling edge cases where val is a string (like name or team)
        if (typeof valA === 'string' && typeof valB === 'string') {
             return activeHabSort.direction === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
        }
        
        // Number comparison
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
        return activeHabSort.direction === 'desc' ? valB - valA : valA - valB;
    });
`;

if (content.includes(targetStr.trim())) {
    content = content.replace(targetStr.trim(), replaceStr.trim());
    console.log("Patched sort successfully");
} else {
    console.log("Could not find sort target");
}

fs.writeFileSync('pages/Players.tsx', content);
