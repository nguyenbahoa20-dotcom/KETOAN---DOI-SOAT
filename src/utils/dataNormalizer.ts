import { NormalizationOptions } from '../types';

/**
 * Standardize strings and numbers according to accounting normalization rules
 */
export function normalizeValue(val: any, options: NormalizationOptions): any {
  if (val === null || val === undefined) return '';

  let strVal = String(val);

  // 1. Trim whitespace
  if (options.trimWhitespace) {
    strVal = strVal.trim().replace(/\s+/g, ' ');
  }

  // 2. Ignore Case
  if (options.ignoreCase) {
    strVal = strVal.toLowerCase();
  }

  // 3. Ignore special characters if enabled
  if (options.ignoreSpecialChars) {
    strVal = strVal.replace(/[^\w\s\dđĐàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/gi, '');
  }

  // 4. Try parsing as Number for financial comparison
  const cleanNumberStr = String(val).replace(/[,_ ]/g, '').trim();
  const numVal = Number(cleanNumberStr);

  if (!isNaN(numVal) && cleanNumberStr !== '') {
    if (options.roundNumbers) {
      // Round to tolerance level or 2 decimal places
      return Math.round(numVal / (options.numericTolerance || 0.01)) * (options.numericTolerance || 0.01);
    }
    return Number(numVal.toFixed(4));
  }

  // 5. Standardize Dates if enabled
  if (options.standardizeDates) {
    const formattedDate = tryFormatDate(strVal);
    if (formattedDate) return formattedDate;
  }

  return strVal;
}

/**
 * Attempts to parse and standardize dates into YYYY-MM-DD format
 */
function tryFormatDate(str: string): string | null {
  if (!str) return null;

  // DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = ddmmyyyyMatch[1].padStart(2, '0');
    const month = ddmmyyyyMatch[2].padStart(2, '0');
    const year = ddmmyyyyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const yyyymmddMatch = str.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})$/);
  if (yyyymmddMatch) {
    const year = yyyymmddMatch[1];
    const month = yyyymmddMatch[2].padStart(2, '0');
    const day = yyyymmddMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Check if two values match based on normalization rules & tolerance
 */
export function areValuesEqual(valA: any, valB: any, options: NormalizationOptions): boolean {
  if (valA === undefined || valA === null) valA = '';
  if (valB === undefined || valB === null) valB = '';

  const normA = normalizeValue(valA, options);
  const normB = normalizeValue(valB, options);

  if (typeof normA === 'number' && typeof normB === 'number') {
    const diff = Math.abs(normA - normB);
    return diff <= (options.numericTolerance || 0.01);
  }

  return String(normA) === String(normB);
}

/**
 * Format currency in VND / USD
 */
export function formatCurrency(num: number | undefined | null, currency: string = 'VND'): string {
  if (num === undefined || num === null || isNaN(num)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format date for display in Vietnamese style
 */
export function formatDateDisplay(dateStr: string | number | Date | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('vi-VN');
}
