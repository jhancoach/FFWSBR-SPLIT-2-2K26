// A robust CSV parser that handles quoted fields, BOM, and automatic delimiter detection (comma, semicolon, tab)
export const parseCSV = <T>(text: string): T[] => {
  if (!text) return [];
  const cleanText = text.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  const lines = cleanText.split(/\r\n|\n/);
  if (lines.length === 0) return [];

  // Detect delimiter from header line
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
  else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

  // Parse header
  const headers = splitLine(firstLine, delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
  if (headers.length === 0) return [];

  const result: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine || !rawLine.trim()) continue;

    const fields = splitLine(rawLine, delimiter);
    const row: any = {};

    let hasSomeValue = false;
    headers.forEach((header, index) => {
      const val = fields[index] !== undefined ? fields[index].trim() : '';
      row[header] = val;
      if (val) hasSomeValue = true;
    });

    if (hasSomeValue) {
      result.push(row as T);
    }
  }

  return result;
};

function splitLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}
