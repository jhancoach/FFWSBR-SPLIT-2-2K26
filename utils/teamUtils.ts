export const formatTeamName = (name: string): string => {
  if (!name) return '';
  return name.trim();
};

export const formatTeamShortTag = (name: string): string => {
  if (!name) return '';
  return name.trim();
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

  if (!targetNorm) return '';

  // 1. Direct match in reference
  for (const ref of teamsReference) {
    if (!ref.TIME || !ref.IMG) continue;
    const refNorm = clean(ref.TIME);
    if (refNorm === targetNorm) return ref.IMG;
  }

  // 2. Normalized / Contains match in reference
  for (const ref of teamsReference) {
    if (!ref.TIME || !ref.IMG) continue;
    const refNorm = clean(ref.TIME);
    if (refNorm && targetNorm && (refNorm.includes(targetNorm) || targetNorm.includes(refNorm))) {
      return ref.IMG;
    }
  }

  // 3. Fallback logos
  for (const key of Object.keys(DEFAULT_TEAM_LOGOS)) {
    if (targetNorm.includes(clean(key))) {
      return DEFAULT_TEAM_LOGOS[key];
    }
  }

  return '';
};


