const MORSE_URL = "https://i.ibb.co/vxyycXym/morse.png";

const cleanKey = (s: string) => 
  s ? s.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim() : "";

const SKILL_FALLBACKS: Record<string, string> = {
  'morse': MORSE_URL,
  'morsedrone': MORSE_URL,
  'dronemorse': MORSE_URL,
  'homer': MORSE_URL,
  'morfeu': MORSE_URL,
};

// Cache para acelerar buscas repetidas de imagens
const imgLookupCache = new Map<string, string | undefined>();

export const findDimImg = (dims: any[] = [], name: string = ''): string | undefined => {
  if (!name || typeof name !== 'string' || !name.trim()) return undefined;
  const target = cleanKey(name);
  if (!target) return undefined;

  const dimsLength = Array.isArray(dims) ? dims.length : 0;
  const cacheKey = `${dimsLength}_${target}`;
  if (imgLookupCache.has(cacheKey)) {
    return imgLookupCache.get(cacheKey);
  }

  let result: string | undefined = undefined;

  // 1. Direct match in dimension table
  if (Array.isArray(dims) && dims.length > 0) {
    const getItemName = (d: any) => d?.Name || d?.Safe || d?.Arma || d?.Mapa || d?.MAPA || '';

    const directMatch = dims.find(d => d && getItemName(d) && cleanKey(getItemName(d)) === target);
    if (directMatch?.IMG && typeof directMatch.IMG === 'string' && directMatch.IMG.trim() !== '') {
      result = directMatch.IMG.trim();
    } else {
      // 2. Partial / substring match in dimension table
      const partialMatch = dims.find(d => {
        if (!d) return false;
        const ck = cleanKey(getItemName(d));
        return ck && (ck.includes(target) || target.includes(ck));
      });
      if (partialMatch?.IMG && typeof partialMatch.IMG === 'string' && partialMatch.IMG.trim() !== '') {
        result = partialMatch.IMG.trim();
      }
    }
  }

  // 3. Fallback dictionary (e.g. Morse)
  if (!result) {
    if (SKILL_FALLBACKS[target]) {
      result = SKILL_FALLBACKS[target];
    } else {
      for (const key of Object.keys(SKILL_FALLBACKS)) {
        if (target.includes(key) || key.includes(target)) {
          result = SKILL_FALLBACKS[key];
          break;
        }
      }
    }
  }

  imgLookupCache.set(cacheKey, result);
  return result;
};
