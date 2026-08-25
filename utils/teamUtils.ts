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
  'FX': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Fluxo_logo.png/600px-Fluxo_logo.png',
  'W7M': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Fluxo_logo.png/600px-Fluxo_logo.png',
  'LOUD': 'https://i.ibb.co/L5w2J5N/loud-logo.png',
  'PAIN': 'https://i.ibb.co/YyYkP4H/pain-gaming-logo.png',
  'KEYD': 'https://i.ibb.co/b3j620y/vivo-keyd-stars-logo.png',
  'VKS': 'https://i.ibb.co/b3j620y/vivo-keyd-stars-logo.png',
  'VIVO KEYD': 'https://i.ibb.co/b3j620y/vivo-keyd-stars-logo.png',
  'LOS': 'https://i.ibb.co/3WqP7Vz/los-grandes-logo.png',
  'LOS GRANDES': 'https://i.ibb.co/3WqP7Vz/los-grandes-logo.png',
  'MAGIC': 'https://i.ibb.co/x7R4CqM/magic-squad-logo.png',
  'MAGIC SQUAD': 'https://i.ibb.co/x7R4CqM/magic-squad-logo.png',
  'MGS': 'https://i.ibb.co/x7R4CqM/magic-squad-logo.png',
  'E1': 'https://i.ibb.co/xS2kG3n/e1-sports-logo.png',
  'E1 SPORTS': 'https://i.ibb.co/xS2kG3n/e1-sports-logo.png',
  'CORINTHIANS': 'https://i.ibb.co/2dG8c4R/corinthians-esports-logo.png',
  'SCCP': 'https://i.ibb.co/2dG8c4R/corinthians-esports-logo.png',
  'MINERS': 'https://i.ibb.co/C3j4f87/netshoes-miners-logo.png',
  'NETSHOES MINERS': 'https://i.ibb.co/C3j4f87/netshoes-miners-logo.png',
  'NTS': 'https://i.ibb.co/C3j4f87/netshoes-miners-logo.png',
  'ALFA': 'https://i.ibb.co/JqjN0sK/alfa-34-logo.png',
  'ALFA 34': 'https://i.ibb.co/JqjN0sK/alfa-34-logo.png',
  'INCO': 'https://i.ibb.co/Yf4T7jR/inco-gaming-logo.png',
  'INCO GAMING': 'https://i.ibb.co/Yf4T7jR/inco-gaming-logo.png',
  'FLAMENGO': 'https://i.ibb.co/QcYV1R3/flamengo-esports-logo.png',
  'FLA': 'https://i.ibb.co/QcYV1R3/flamengo-esports-logo.png',
  'MIBR': 'https://i.ibb.co/v4gH5bC/mibr-logo.png'
};

export const findTeamLogo = (teamName: string, teamsReference: Array<{ TIME?: string; IMG?: string; [key: string]: any }> = []): string => {
  if (!teamName) return '';

  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetNorm = clean(teamName);

  if (!targetNorm) return '';

  const safeRefs = Array.isArray(teamsReference) ? teamsReference : [];

  // 1. Direct match in reference
  for (const ref of safeRefs) {
    const refName = (ref.TIME || ref.Time || ref.Name || ref.Equipe || ref.team || '') as string;
    const refImg = (ref.IMG || ref.Img || ref.LOGO || ref.Logo || ref.Image || ref.image || ref.url || '') as string;
    if (!refName || !refImg) continue;
    const refNorm = clean(refName);
    if (refNorm === targetNorm) return refImg;
  }

  // 2. Normalized / Contains match in reference
  for (const ref of safeRefs) {
    const refName = (ref.TIME || ref.Time || ref.Name || ref.Equipe || ref.team || '') as string;
    const refImg = (ref.IMG || ref.Img || ref.LOGO || ref.Logo || ref.Image || ref.image || ref.url || '') as string;
    if (!refName || !refImg) continue;
    const refNorm = clean(refName);
    if (refNorm && targetNorm && (refNorm.includes(targetNorm) || targetNorm.includes(refNorm))) {
      return refImg;
    }
  }

  // 3. Match from predefined fallback logos dictionary
  for (const key of Object.keys(DEFAULT_TEAM_LOGOS)) {
    const cleanKey = clean(key);
    if (targetNorm === cleanKey || targetNorm.includes(cleanKey) || cleanKey.includes(targetNorm)) {
      return DEFAULT_TEAM_LOGOS[key];
    }
  }

  return '';
};


