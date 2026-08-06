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
  
  const cleanSearch = teamName.toLowerCase().trim();

  // 1. Search in dynamic teamsReference from spreadsheet
  const match = teamsReference.find(t => {
    if (!t.TIME) return false;
    const name = t.TIME.toLowerCase().trim();
    return name === cleanSearch || name.includes(cleanSearch) || cleanSearch.includes(name);
  });

  if (match && match.IMG) {
    return match.IMG;
  }

  // 2. Check fallback default logos
  for (const [key, logoUrl] of Object.entries(DEFAULT_TEAM_LOGOS)) {
    if (cleanSearch.includes(key.toLowerCase())) {
      return logoUrl;
    }
  }

  return '';
};
