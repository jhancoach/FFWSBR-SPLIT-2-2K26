export const formatTeamName = (name: string): string => {
  if (!name) return '';
  const upper = name.trim().toUpperCase();
  if (upper.includes('SOLID') || upper === 'TS') {
    return 'Team Solid (TS)';
  }
  if (upper.includes('FLUXO') || upper.includes('W7M') || upper === 'FX') {
    return 'Fluxo W7M (FX)';
  }
  return name;
};

export const formatTeamShortTag = (name: string): string => {
  if (!name) return '';
  const upper = name.trim().toUpperCase();
  if (upper.includes('SOLID') || upper === 'TS') return 'TS';
  if (upper.includes('FLUXO') || upper.includes('W7M') || upper === 'FX') return 'FX';
  return name;
};

// Fallback high quality logos if missing from reference sheet
export const DEFAULT_TEAM_LOGOS: Record<string, string> = {
  'SOLID': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Team_Solid_2023_allmode.png/600px-Team_Solid_2023_allmode.png',
  'TS': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Team_Solid_2023_allmode.png/600px-Team_Solid_2023_allmode.png',
  'FLUXO': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Fluxo_logo.png/600px-Fluxo_logo.png',
  'W7M': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Fluxo_logo.png/600px-Fluxo_logo.png',
  'FX': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Fluxo_logo.png/600px-Fluxo_logo.png',
};

export const findTeamLogo = (teamName: string, teamsReference: Array<{ TIME: string; IMG?: string }> = []): string => {
  if (!teamName) return '';

  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetNorm = clean(teamName);

  // 1. Direct match in reference
  for (const ref of teamsReference) {
    if (!ref.TIME || !ref.IMG) continue;
    const refNorm = clean(ref.TIME);
    if (refNorm === targetNorm) return ref.IMG;
  }

  // 2. Normalized / Alias match in reference
  const isSolid = targetNorm.includes('solid') || targetNorm.includes('ts');
  const isFluxo = targetNorm.includes('fluxo') || targetNorm.includes('w7m') || targetNorm.includes('fx');

  for (const ref of teamsReference) {
    if (!ref.TIME || !ref.IMG) continue;
    const refNorm = clean(ref.TIME);
    if (isSolid && (refNorm.includes('solid') || refNorm.includes('ts'))) return ref.IMG;
    if (isFluxo && (refNorm.includes('fluxo') || refNorm.includes('w7m') || refNorm.includes('fx'))) return ref.IMG;
    if (refNorm && (refNorm.includes(targetNorm) || targetNorm.includes(refNorm))) return ref.IMG;
  }

  // 3. Fallback logos for TS / FX
  if (isSolid) {
    return DEFAULT_TEAM_LOGOS['SOLID'];
  }
  if (isFluxo) {
    return DEFAULT_TEAM_LOGOS['FLUXO'];
  }

  return '';
};

