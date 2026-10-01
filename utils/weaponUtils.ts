import { WeaponData } from '../types';

export interface MasterWeaponInfo {
  Arma: string;
  TipoArm: string;
  IMG: string;
}

export const MASTER_WEAPONS: MasterWeaponInfo[] = [
  { Arma: "M4A1", TipoArm: "AR", IMG: "https://i.ibb.co/YknyWs2/M4A1.png" },
  { Arma: "AK", TipoArm: "AR", IMG: "https://i.ibb.co/CHrSq9Y/AK.png" },
  { Arma: "M14", TipoArm: "AR", IMG: "https://i.ibb.co/GMZKxJx/M14.png" },
  { Arma: "SCAR", TipoArm: "AR", IMG: "https://i.ibb.co/VVg6QvR/SCAR.png" },
  { Arma: "GROZA", TipoArm: "AR", IMG: "https://i.ibb.co/5st0M9r/GROZA.png" },
  { Arma: "FAMAS", TipoArm: "AR", IMG: "https://i.ibb.co/yVnfp8w/FAMAS.png" },
  { Arma: "XM8", TipoArm: "AR", IMG: "https://i.ibb.co/7vf4BBJ/XM8.png" },
  { Arma: "AN94", TipoArm: "AR", IMG: "https://i.ibb.co/qDhGt30/AN94.png" },
  { Arma: "PLASMA", TipoArm: "AR", IMG: "https://i.ibb.co/HXhG12L/PLASMA.png" },
  { Arma: "AUG", TipoArm: "AR", IMG: "https://i.ibb.co/ZHRVJY8/AUG.png" },
  { Arma: "PARAFAL", TipoArm: "AR", IMG: "https://i.ibb.co/8YryTQK/PARAFAL.png" },
  { Arma: "ATIRADEIRA", TipoArm: "AR", IMG: "https://i.ibb.co/XV8zj2t/ATIRADEIRA.png" },
  { Arma: "G36", TipoArm: "AR", IMG: "https://i.ibb.co/ZJ5kDMs/G36.png" },
  { Arma: "SKS", TipoArm: "1 TIRO", IMG: "https://i.ibb.co/cw21Hgt/SKS.png" },
  { Arma: "SVD", TipoArm: "1 TIRO", IMG: "https://i.ibb.co/kSKwZzd/SVD.png" },
  { Arma: "CARAPINA", TipoArm: "1 TIRO", IMG: "https://i.ibb.co/w0kjNmc/CARAPINA.png" },
  { Arma: "AC80", TipoArm: "1 TIRO", IMG: "https://i.ibb.co/j8C8JZv/AC80.png" },
  { Arma: "M249", TipoArm: "METRALHADORA", IMG: "https://i.ibb.co/Pctz5RD/M249.png" },
  { Arma: "M60", TipoArm: "METRALHADORA", IMG: "https://i.ibb.co/YyDKB6Z/m60.png" },
  { Arma: "KORD", TipoArm: "METRALHADORA", IMG: "https://i.ibb.co/FsbcZng/KORD.png" },
  { Arma: "UMP", TipoArm: "SMG", IMG: "https://i.ibb.co/VwTZwq6/UMP.png" },
  { Arma: "MP5", TipoArm: "SMG", IMG: "https://i.ibb.co/jgnzj1R/MP5.png" },
  { Arma: "VSS", TipoArm: "SMG", IMG: "https://i.ibb.co/m41yXHd/VSS.png" },
  { Arma: "P90", TipoArm: "SMG", IMG: "https://i.ibb.co/5M76DmJ/P90.png" },
  { Arma: "CG15", TipoArm: "SMG", IMG: "https://i.ibb.co/Bw7CScp/CG15.png" },
  { Arma: "THOMPSON", TipoArm: "SMG", IMG: "https://i.ibb.co/c1q7D62/THOMPSON.png" },
  { Arma: "VECTOR", TipoArm: "SMG", IMG: "https://i.ibb.co/r3Fvv0y/VECTOR.png" },
  { Arma: "MAC10", TipoArm: "SMG", IMG: "https://i.ibb.co/Nm3BQ2W/MAC10.png" },
  { Arma: "BISÃO", TipoArm: "SMG", IMG: "https://i.ibb.co/6RFyZ11/BIS-O.png" },
  { Arma: "M1014", TipoArm: "ESPINGARDA", IMG: "https://i.ibb.co/gDQQyPw/M1014.png" },
  { Arma: "SPAS12", TipoArm: "ESPINGARDA", IMG: "https://i.ibb.co/37FW55M/SPAS12.png" },
  { Arma: "BAUBAU", TipoArm: "ESPINGARDA", IMG: "https://i.ibb.co/4Kn66N5/BAUBAU.png" },
  { Arma: "MAG-7", TipoArm: "ESPINGARDA", IMG: "https://i.ibb.co/10NQDRC/MAG7.png" },
  { Arma: "CARGA", TipoArm: "ESPINGARDA", IMG: "https://i.ibb.co/BZt6m29/CARGA.png" },
  { Arma: "TROGON", TipoArm: "ESPINGARDA", IMG: "https://i.ibb.co/Tmr1ZB2/TROGON.png" },
  { Arma: "AWM", TipoArm: "SNIPER", IMG: "https://i.ibb.co/QPHGbCV/AWM.png" },
  { Arma: "KAR98K", TipoArm: "SNIPER", IMG: "https://i.ibb.co/pZc80Fs/KAR98K.png" },
  { Arma: "BARRET", TipoArm: "SNIPER", IMG: "https://i.ibb.co/c1ZWWCh/BARRET.png" },
  { Arma: "M24", TipoArm: "SNIPER", IMG: "https://i.ibb.co/zG534Bs/M24.png" },
  { Arma: "FZT", TipoArm: "SNIPER", IMG: "https://i.ibb.co/9ZXYbzp/FP-TRATAMENTO.png" },
  { Arma: "USP", TipoArm: "PISTOLA", IMG: "https://i.ibb.co/2YpZy7HK/image.png" },
  { Arma: "G18", TipoArm: "PISTOLA", IMG: "https://i.ibb.co/WwJ9zWP/image.png" },
  { Arma: "M1873", TipoArm: "PISTOLA", IMG: "https://i.ibb.co/SdmdcdD/M1873.png" },
  { Arma: "M500", TipoArm: "PISTOLA", IMG: "https://i.ibb.co/gZHwwCwV/image.png" },
  { Arma: "M1917", TipoArm: "PISTOLA", IMG: "https://i.ibb.co/hC6Lvk5/M1917.png" },
  { Arma: "MINI UZI", TipoArm: "PISTOLA", IMG: "https://i.ibb.co/M8pzm5C/MINI-UZI.png" },
  { Arma: "PISTOLA DE TRATAMENTO", TipoArm: "PISTOLA", IMG: "https://i.ibb.co/d4q8LjF2/image.png" },
  { Arma: "CANHÃO DE MÃO", TipoArm: "PISTOLA", IMG: "https://i.ibb.co/6cctYHg9/image.png" },
  { Arma: "AR DE ESCUDO", TipoArm: "AR", IMG: "https://i.ibb.co/svPgk5Sp/image.png" },
  { Arma: "PANELA", TipoArm: "Arm Contato", IMG: "https://i.ibb.co/5L2rqDL/PANELA.png" },
  { Arma: "MACHETE", TipoArm: "Arm Contato", IMG: "https://i.ibb.co/DkJrB6j/MACHETE.png" },
  { Arma: "BASTÃO", TipoArm: "Arm Contato", IMG: "https://i.ibb.co/n78CT1N/BAST-O.png" },
  { Arma: "KATANA", TipoArm: "Arm Contato", IMG: "https://i.ibb.co/7JYL2G4/KATANA.png" },
  { Arma: "FOICE", TipoArm: "Arm Contato", IMG: "https://i.ibb.co/4fgYmvR/FOICE.png" },
  { Arma: "FACA FF", TipoArm: "Arm Contato", IMG: "https://i.ibb.co/XLPfrWX/FACA-FF.png" },
  { Arma: "PUNHO", TipoArm: "PUNHO", IMG: "https://i.ibb.co/RSR364k/PUNHO.png" },
  { Arma: "GRANADA", TipoArm: "EXPLOSÃO", IMG: "https://i.ibb.co/WKGyjKj/GRANADA.png" },
  { Arma: "CONGELANTE", TipoArm: "EXPLOSÃO", IMG: "https://i.ibb.co/zVnzvWHh/CONGELANTE.png" },
  { Arma: "CORROSIVA", TipoArm: "EXPLOSÃO", IMG: "https://i.ibb.co/Pjv8BbL/CORROSIVA.png" },
  { Arma: "LANÇA", TipoArm: "EXPLOSÃO", IMG: "https://i.ibb.co/N2S7RZx/LAN-A.png" },
  { Arma: "FOGUETE", TipoArm: "EXPLOSÃO", IMG: "https://i.ibb.co/MgyP29w/FOGUETE.png" },
  { Arma: "BALESTRA", TipoArm: "EXPLOSÃO", IMG: "https://i.ibb.co/PZHW34YX/image.png" },
  { Arma: "MP40", TipoArm: "SMG", IMG: "https://i.ibb.co/C1PnG0D/MP40.png" },
  { Arma: "USP-2", TipoArm: "PISTOLA", IMG: "https://i.ibb.co/2YpZy7HK/image.png" },
  { Arma: "MINA", TipoArm: "EXPLOSÃO", IMG: "https://i.ibb.co/7GgMNRJ/MINA.png" },
  { Arma: "CARRO", TipoArm: "VEICULO", IMG: "https://i.ibb.co/23P6HwK/CARRO.png" },
  { Arma: "ABATE", TipoArm: "Arm Contato", IMG: "https://i.ibb.co/TLg0jQd/KILL-FF-removebg-preview.png" },
  { Arma: "FG", TipoArm: "PISTOLA", IMG: "https://i.ibb.co/DkFRr1D/FG.png" },
  { Arma: "VSK", TipoArm: "SNIPER", IMG: "https://i.ibb.co/fCdNDYD/vk.png" },
  { Arma: "M590", TipoArm: "ESPINGARDA", IMG: "https://i.ibb.co/1MRDkQj/m590.png" },
  { Arma: "GÁS", TipoArm: "ABATIDO", IMG: "https://i.ibb.co/Vgf7RPX/G-S.png" },
  { Arma: "TORRE", TipoArm: "EXPLOSÃO", IMG: "https://i.ibb.co/hkX0Mcf/TORRE.png" },
  { Arma: "HAB", TipoArm: "HABILIDADES", IMG: "https://i.ibb.co/y2bjbxN/Habs.png" },
  { Arma: "Dragão", TipoArm: "EXPLOSÃO", IMG: "https://i.ibb.co/FbP8JVFb/Granada-Drag-o.png" },
  { Arma: "WINCHESTER", TipoArm: "1 TIRO", IMG: "https://i.ibb.co/6Rt0TTVR/winchester.png" },
  { Arma: "MR", TipoArm: "EXPLOSÃO", IMG: "https://i.ibb.co/sp1njpr5/MESTRE-DOS-RAIOS.png" },
  { Arma: "GERA RAIO", TipoArm: "EXPLOSÃO", IMG: "https://i.ibb.co/sp1njpr5/MESTRE-DOS-RAIOS.png" },
  { Arma: "DESERT", TipoArm: "PISTOLA", IMG: "https://i.ibb.co/0jL3YrPs/image.png" },
  { Arma: "M7", TipoArm: "AR", IMG: "https://i.ibb.co/Y4hVVqDD/image.png" },
  { Arma: "SKORP", TipoArm: "SMG", IMG: "https://i.ibb.co/gpN26Ww/image.png" },
  { Arma: "HAWK", TipoArm: "SNIPER", IMG: "https://i.ibb.co/XNVS7B8/image.png" },
  { Arma: "RPK", TipoArm: "METRALHADORA", IMG: "https://i.ibb.co/yFdB692c/image.png" }
];

export interface WeaponCategoryConfig {
  label: string;
  name: string;
  color: string;
  bg: string;
  border: string;
  text: string;
  glow?: string;
}

export const WEAPON_CATEGORY_CONFIG: Record<string, WeaponCategoryConfig> = {
  'AR': {
    label: 'AR (Fuzil de Assalto)',
    name: 'AR',
    color: '#f97316',
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/40',
    text: 'text-orange-400',
    glow: 'shadow-[0_0_10px_rgba(249,115,22,0.2)]'
  },
  'SMG': {
    label: 'SMG (Submetralhadora)',
    name: 'SMG',
    color: '#06b6d4',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/40',
    text: 'text-cyan-400',
    glow: 'shadow-[0_0_10px_rgba(6,182,212,0.2)]'
  },
  '1 TIRO': {
    label: '1 TIRO (DMR)',
    name: '1 TIRO',
    color: '#ef4444',
    bg: 'bg-red-500/15',
    border: 'border-red-500/40',
    text: 'text-red-400',
    glow: 'shadow-[0_0_10px_rgba(239,68,68,0.2)]'
  },
  'ESPINGARDA': {
    label: 'Espingarda (Shotgun)',
    name: 'ESPINGARDA',
    color: '#10b981',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_10px_rgba(16,185,129,0.2)]'
  },
  'SNIPER': {
    label: 'Sniper (Precisão)',
    name: 'SNIPER',
    color: '#a855f7',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
    glow: 'shadow-[0_0_10px_rgba(168,85,247,0.2)]'
  },
  'METRALHADORA': {
    label: 'Metralhadora Leve',
    name: 'METRALHADORA',
    color: '#eab308',
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-500/40',
    text: 'text-yellow-400',
    glow: 'shadow-[0_0_10px_rgba(234,179,8,0.2)]'
  },
  'PISTOLA': {
    label: 'Pistola',
    name: 'PISTOLA',
    color: '#ec4899',
    bg: 'bg-pink-500/15',
    border: 'border-pink-500/40',
    text: 'text-pink-400',
    glow: 'shadow-[0_0_10px_rgba(236,72,153,0.2)]'
  },
  'Arm Contato': {
    label: 'Arma de Contato',
    name: 'Arm Contato',
    color: '#94a3b8',
    bg: 'bg-slate-500/15',
    border: 'border-slate-400/40',
    text: 'text-slate-300'
  },
  'PUNHO': {
    label: 'Punho',
    name: 'PUNHO',
    color: '#78716c',
    bg: 'bg-stone-500/15',
    border: 'border-stone-400/40',
    text: 'text-stone-300'
  },
  'EXPLOSÃO': {
    label: 'Explosão & Arremesso',
    name: 'EXPLOSÃO',
    color: '#ea580c',
    bg: 'bg-amber-600/15',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_10px_rgba(234,88,12,0.2)]'
  },
  'HABILIDADES': {
    label: 'Habilidades',
    name: 'HABILIDADES',
    color: '#6366f1',
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/40',
    text: 'text-indigo-400',
    glow: 'shadow-[0_0_10px_rgba(99,102,241,0.2)]'
  },
  'VEICULO': {
    label: 'Veículo',
    name: 'VEICULO',
    color: '#84cc16',
    bg: 'bg-lime-500/15',
    border: 'border-lime-500/40',
    text: 'text-lime-400'
  },
  'ABATIDO': {
    label: 'Ambiente / Gás',
    name: 'ABATIDO',
    color: '#6b7280',
    bg: 'bg-gray-500/15',
    border: 'border-gray-500/40',
    text: 'text-gray-400'
  },
};

export const EXCLUDED_WEAPON_NAMES = new Set(['orion', 'homero', 'a124', 'aguia', 'águia']);

export const WEAPON_IMAGE_OVERRIDES: Record<string, string> = {
  'ar de escudo': 'https://i.ibb.co/svPgk5Sp/image.png',
  'balestra': 'https://i.ibb.co/PZHW34YX/image.png',
  'g18': 'https://i.ibb.co/WwJ9zWP/image.png',
  'pistola de tratamento': 'https://i.ibb.co/d4q8LjF2/image.png',
  'usp': 'https://i.ibb.co/2YpZy7HK/image.png',
  'usp-2': 'https://i.ibb.co/2YpZy7HK/image.png',
  'm500': 'https://i.ibb.co/gZHwwCwV/image.png',
  'canhao de mao': 'https://i.ibb.co/6cctYHg9/image.png',
  'canhão de mão': 'https://i.ibb.co/6cctYHg9/image.png',
  'gas': 'https://i.ibb.co/Vgf7RPX/G-S.png',
  'gás': 'https://i.ibb.co/Vgf7RPX/G-S.png',
};

const normalizeStr = (s: string) =>
  s ? s.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim() : "";

// Map for quick canonical lookup
const MASTER_MAP = new Map<string, MasterWeaponInfo>();
MASTER_WEAPONS.forEach(w => {
  const norm = normalizeStr(w.Arma);
  if (!EXCLUDED_WEAPON_NAMES.has(norm)) {
    const override = WEAPON_IMAGE_OVERRIDES[norm];
    MASTER_MAP.set(norm, {
      ...w,
      IMG: override || w.IMG
    });
  }
});

export const getWeaponInfo = (name: string, customWeapons?: WeaponData[]): {
  name: string;
  tipo: string;
  img?: string;
  config: WeaponCategoryConfig;
} => {
  if (!name) {
    return {
      name: '',
      tipo: 'OUTROS',
      config: {
        label: 'Outros',
        name: 'OUTROS',
        color: '#9ca3af',
        bg: 'bg-gray-500/10',
        border: 'border-gray-500/20',
        text: 'text-gray-400'
      }
    };
  }

  const clean = normalizeStr(name);
  const overrideImg = WEAPON_IMAGE_OVERRIDES[clean];

  // 1. Check customWeapons if provided
  if (Array.isArray(customWeapons) && customWeapons.length > 0) {
    const match = customWeapons.find(w => w?.Arma && normalizeStr(w.Arma) === clean);
    if (match) {
      const tipo = match.TipoArm || match.tipo || match.categoria || getWeaponCategoryByName(name);
      let img = overrideImg || ((match.IMG && match.IMG.trim() !== '') ? match.IMG : MASTER_MAP.get(clean)?.IMG);
      if (overrideImg) img = overrideImg;
      const config = getCategoryConfig(tipo);
      return {
        name: match.Arma || name,
        tipo,
        img,
        config
      };
    }
  }

  // 2. Check master map
  const master = MASTER_MAP.get(clean);
  if (master) {
    const config = getCategoryConfig(master.TipoArm);
    return {
      name: master.Arma,
      tipo: master.TipoArm,
      img: overrideImg || master.IMG || undefined,
      config
    };
  }

  // 3. Fallback: derive category from name
  const fallbackTipo = getWeaponCategoryByName(name);
  const config = getCategoryConfig(fallbackTipo);
  return {
    name,
    tipo: fallbackTipo,
    img: overrideImg || undefined,
    config
  };
};

export const getWeaponCategoryByName = (name: string): string => {
  if (!name) return 'OUTROS';
  const clean = normalizeStr(name);
  const master = MASTER_MAP.get(clean);
  if (master && master.TipoArm) return master.TipoArm;

  if (clean.includes('granada') || clean.includes('congelante') || clean.includes('corrosiva') || clean.includes('lan') || clean.includes('mina') || clean.includes('dragao') || clean.includes('raio')) {
    return 'EXPLOSÃO';
  }
  if (clean.includes('panela') || clean.includes('machete') || clean.includes('bastao') || clean.includes('katana') || clean.includes('foice') || clean.includes('faca') || clean.includes('abate')) {
    return 'Arm Contato';
  }
  if (clean.includes('punho')) return 'PUNHO';
  if (clean.includes('carro') || clean.includes('moto') || clean.includes('jeep') || clean.includes('veiculo')) return 'VEICULO';
  if (clean.includes('gas') || clean.includes('queda') || clean.includes('zona')) return 'ABATIDO';
  if (clean.includes('orion') || clean.includes('a124') || clean.includes('homero') || clean.includes('hab')) return 'HABILIDADES';
  if (clean.includes('awm') || clean.includes('kar98') || clean.includes('barret') || clean.includes('m24') || clean.includes('vsk') || clean.includes('hawk')) return 'SNIPER';
  if (clean.includes('m1014') || clean.includes('spas') || clean.includes('baubau') || clean.includes('mag7') || clean.includes('carga') || clean.includes('trogon') || clean.includes('m590')) return 'ESPINGARDA';
  if (clean.includes('ump') || clean.includes('mp5') || clean.includes('mp40') || clean.includes('vss') || clean.includes('p90') || clean.includes('cg15') || clean.includes('thompson') || clean.includes('vector') || clean.includes('mac10') || clean.includes('bisao') || clean.includes('skorp')) return 'SMG';
  if (clean.includes('sks') || clean.includes('svd') || clean.includes('carapina') || clean.includes('ac80') || clean.includes('winchester')) return '1 TIRO';
  if (clean.includes('m249') || clean.includes('m60') || clean.includes('kord') || clean.includes('rpk')) return 'METRALHADORA';
  if (clean.includes('usp') || clean.includes('aguia') || clean.includes('g18') || clean.includes('m1873') || clean.includes('m500') || clean.includes('m1917') || clean.includes('uzi') || clean.includes('desert') || clean.includes('fg')) return 'PISTOLA';

  return 'AR';
};

export const getCategoryConfig = (tipo?: string): WeaponCategoryConfig => {
  if (!tipo) {
    return {
      label: 'Geral',
      name: 'GERAL',
      color: '#9ca3af',
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/20',
      text: 'text-gray-400'
    };
  }

  // Exact match
  if (WEAPON_CATEGORY_CONFIG[tipo]) {
    return WEAPON_CATEGORY_CONFIG[tipo];
  }

  // Case insensitive / normalized match
  const clean = normalizeStr(tipo);
  for (const [k, v] of Object.entries(WEAPON_CATEGORY_CONFIG)) {
    if (normalizeStr(k) === clean) return v;
  }

  if (clean.includes('contato')) return WEAPON_CATEGORY_CONFIG['Arm Contato'];
  if (clean.includes('tiro') || clean.includes('dmr')) return WEAPON_CATEGORY_CONFIG['1 TIRO'];
  if (clean.includes('espingarda') || clean.includes('shotgun') || clean.includes('doze')) return WEAPON_CATEGORY_CONFIG['ESPINGARDA'];
  if (clean.includes('sniper')) return WEAPON_CATEGORY_CONFIG['SNIPER'];
  if (clean.includes('metralhadora')) return WEAPON_CATEGORY_CONFIG['METRALHADORA'];
  if (clean.includes('pistola')) return WEAPON_CATEGORY_CONFIG['PISTOLA'];
  if (clean.includes('explos')) return WEAPON_CATEGORY_CONFIG['EXPLOSÃO'];
  if (clean.includes('habil') || clean.includes('hab')) return WEAPON_CATEGORY_CONFIG['HABILIDADES'];
  if (clean.includes('veic')) return WEAPON_CATEGORY_CONFIG['VEICULO'];
  if (clean.includes('abat') || clean.includes('gas')) return WEAPON_CATEGORY_CONFIG['ABATIDO'];

  return {
    label: tipo,
    name: tipo,
    color: '#9ca3af',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    text: 'text-gray-400'
  };
};

/**
 * Retorna todas as categorias únicas de armas presentes na lista de armas ou de abates
 */
export const getAllWeaponCategories = (weapons: WeaponData[] = []): string[] => {
  const categoriesSet = new Set<string>();
  
  // Categorias padrão do jogo
  Object.keys(WEAPON_CATEGORY_CONFIG).forEach(c => categoriesSet.add(c));

  weapons.forEach(w => {
    const tipo = w.TipoArm || w.tipo || w.categoria;
    if (tipo && tipo.trim() !== '') {
      categoriesSet.add(tipo.trim());
    }
  });

  return Array.from(categoriesSet);
};
