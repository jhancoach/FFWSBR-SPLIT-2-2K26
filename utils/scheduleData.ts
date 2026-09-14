import { findTeamLogo } from './teamUtils';

export interface TeamSchedule {
  name: string;
  isLoud?: boolean;
  rounds: { [key: number]: boolean }; // true = plays, false = rests
}

export const OFFICIAL_SCHEDULE: TeamSchedule[] = [
  {
    name: 'SX TET',
    rounds: { 1: false, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: true, 13: true, 14: false, 15: true, 16: true, 17: true, 18: true, 19: true, 20: true, 21: true, 22: true }
  },
  {
    name: 'INTZ',
    rounds: { 1: false, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: true, 13: false, 14: true, 15: true, 16: true, 17: true, 18: true, 19: true, 20: true, 21: true, 22: true }
  },
  
  {
    name: 'CPT Vox',
    rounds: { 1: true, 2: false, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: false, 12: true, 13: true, 14: true, 15: true, 16: true, 17: true, 18: true, 19: true, 20: true, 21: true, 22: true }
  },
  {
    name: 'Rush Gaming',
    rounds: { 1: true, 2: true, 3: false, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: true, 13: false, 14: true, 15: true, 16: true, 17: true, 18: true, 19: true, 20: true, 21: true, 22: true }
  },
  {
    name: 'Loud Snickers',
    isLoud: true,
    rounds: { 1: true, 2: true, 3: false, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: false, 11: true, 12: true, 13: true, 14: true, 15: true, 16: true, 17: true, 18: true, 19: true, 20: true, 21: true, 22: true }
  },
  {
    name: 'AfroGames',
    rounds: { 1: true, 2: true, 3: true, 4: false, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: false, 12: true, 13: true, 14: true, 15: true, 16: true, 17: true, 18: true, 19: true, 20: true, 21: true, 22: true }
  },
  {
    name: 'LOS',
    rounds: { 1: true, 2: true, 3: true, 4: false, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: true, 13: true, 14: false, 15: true, 16: true, 17: true, 18: true, 19: true, 20: true, 21: true, 22: true }
  },
  {
    name: 'Alpha7',
    rounds: { 1: true, 2: true, 3: true, 4: true, 5: false, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: false, 13: true, 14: true, 15: true, 16: true, 17: true, 18: true, 19: true, 20: true, 21: true, 22: true }
  },
  {
    name: 'Team Solid (TS)',
    rounds: { 1: true, 2: true, 3: true, 4: true, 5: false, 6: true, 7: true, 8: true, 9: false, 10: true, 11: true, 12: true, 13: true, 14: true, 15: true, 16: true, 17: true, 18: true, 19: true, 20: true, 21: true, 22: true }
  },
  
  {
    name: 'Fluxo W7M (FX)',
    rounds: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: false, 7: true, 8: false, 9: true, 10: true, 11: true, 12: true, 13: true, 14: true, 15: true, 16: true, 17: true, 18: true, 19: true, 20: true, 21: true, 22: true }
  },
  {
    name: 'Influence Rage',
    rounds: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: false, 8: false, 9: true, 10: true, 11: true, 12: true, 13: true, 14: true, 15: true, 16: true, 17: true, 18: true, 19: true, 20: true, 21: true, 22: true }
  },
  {
    name: 'Rise Gaming',
    rounds: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: false, 8: true, 9: false, 10: true, 11: true, 12: true, 13: true, 14: true, 15: true, 16: true, 17: true, 18: true, 19: true, 20: true, 21: true, 22: true }
  }
,  {
    name: 'Civis',
    rounds: { 1: true, 2: false, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: false, 11: true, 12: true, 13: true, 14: true, 15: false, 16: false, 17: false, 18: false, 19: false, 20: false, 21: false, 22: false }
  },  {
    name: 'Loops',
    rounds: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: false, 7: true, 8: true, 9: true, 10: true, 11: true, 12: false, 13: true, 14: true, 15: false, 16: false, 17: false, 18: false, 19: false, 20: false, 21: false, 22: false }
  }
];

export const getRestedTeamsInRound = (r: number): string[] => {
  return OFFICIAL_SCHEDULE.filter(t => t.rounds[r] === false).map(t => t.name);
};

export const getPlayingTeamsInRound = (r: number): string[] => {
  return OFFICIAL_SCHEDULE.filter(t => t.rounds[r] === true).map(t => t.name);
};

export const parseRoundNumber = (rodadaStr: string | undefined): number | null => {
  if (!rodadaStr) return null;
  const match = rodadaStr.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (num >= 1 && num <= 22) return num;
  }
  return null;
};
