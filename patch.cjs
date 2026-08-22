const fs = require('fs');
let code = fs.readFileSync('pages/Schedule.tsx', 'utf8');
const replacement = `
const normalize = (val: string | undefined | number) => String(val || '').trim().toUpperCase();

const getTeamCharacteristic = (percentAbts: number, percentPos: number) => {
  const diff = Math.abs(percentAbts - percentPos);
  if (diff <= 5) return { label: 'Equilibrado', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' }; 
  if (percentAbts > percentPos) return { label: 'Agressivo', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' }; 
  return { label: 'Posicional', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' }; 
};

const getTeamMapStyles = (teamName: string, details: any[]) => {
    const normName = normalize(teamName);
    const teamMatches = details.filter((d: any) => normalize(d.TIME) === normName || normalize(d.TIME).includes(normName) || normName.includes(normalize(d.TIME)));
    const mapsSet = new Set<string>();
    teamMatches.forEach((m: any) => { if (m.MAPA) mapsSet.add(m.MAPA.trim()); });
    
    const sortedMaps = Array.from(mapsSet).sort((a, b) => a.localeCompare(b));
    
    return sortedMaps.map(mapName => {
      const mapFilteredMatches = teamMatches.filter((d: any) => normalize(d.MAPA) === normalize(mapName));
      let totalPts = 0;
      let totalAbates = 0;
      let totalPtsColocacao = 0;
      
      mapFilteredMatches.forEach((m: any) => {
          const abts = typeof m.ABTS === 'number' ? m.ABTS : parseFloat(String(m.ABTS || '0').replace(',', '.'));
          const ptsc = typeof m.PTSC === 'number' ? m.PTSC : parseFloat(String(m.PTSC || '0').replace(',', '.'));
          const pts = typeof m.PTS === 'number' ? m.PTS : parseFloat(String(m.PTS || '0').replace(',', '.'));
          
          totalAbates += isNaN(abts) ? 0 : abts;
          totalPtsColocacao += isNaN(ptsc) ? 0 : ptsc;
          totalPts += isNaN(pts) ? 0 : pts;
      });
      
      const percentAbts = totalPts > 0 ? Math.round((totalAbates / totalPts) * 100) : 0;
      const percentPos = totalPts > 0 ? Math.round((totalPtsColocacao / totalPts) * 100) : 0;
      
      const characteristic = getTeamCharacteristic(percentAbts, percentPos);
      
      return {
          mapName,
          characteristic
      };
    });
};

interface ScheduleProps`;
code = code.replace('interface ScheduleProps', replacement);
fs.writeFileSync('pages/Schedule.tsx', code);
