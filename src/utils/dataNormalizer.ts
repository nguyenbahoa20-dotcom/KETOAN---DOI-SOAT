import { NormalizationOptions } from '../types';

/**
 * Standardize strings and numbers according to accounting normalization rules
 */
export function normalizeValue(val: any, options: NormalizationOptions): any {
  if (val === null || val === undefined) return '';
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return `${val.getFullYear()}-${String(val.getMonth() + 1).padStart(2, '0')}-${String(val.getDate()).padStart(2, '0')}`;
  }

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

  // 4. Try parsing as Number for financial comparison. Do not round here:
  // areValuesEqual applies the selected tolerance once, after normalization.
  const sourceValue = String(val).trim();
  const isZeroPaddedIdentifier = typeof val === 'string' && /^[+-]?0\d+$/.test(sourceValue);
  const numVal = typeof val === 'number'
    ? val
    : isZeroPaddedIdentifier ? Number.NaN : parseFinancialNumber(sourceValue);

  if (Number.isFinite(numVal) && sourceValue !== '') {
    return numVal;
  }

  // 5. Standardize Dates if enabled
  if (options.standardizeDates) {
    const formattedDate = tryFormatDate(strVal);
    if (formattedDate) return formattedDate;
  }

  return strVal;
}

export function parseFinancialNumber(value: string): number {
  let cleaned = value.trim().replace(/^\((.*)\)$/, '-$1');
  cleaned = cleaned.replace(/VNĐ|VND|đồng|[₫đĐ$€£¥]/gi, '').replace(/[\s\u00a0]/g, '');
  if (!cleaned) return Number.NaN;

  // Vietnamese exports commonly use 1.234,56; English exports use 1,234.56.
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized = cleaned;
  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const groupingSeparator = decimalSeparator === ',' ? '.' : ',';
    normalized = cleaned.split(groupingSeparator).join('');
    if (decimalSeparator === ',') normalized = normalized.replace(',', '.');
  } else if (lastComma >= 0) {
    const decimals = cleaned.length - lastComma - 1;
    normalized = decimals > 0 && decimals <= 2
      ? cleaned.replace(',', '.')
      : cleaned.split(',').join('');
  } else if ((cleaned.match(/\./g) || []).length > 1) {
    normalized = cleaned.split('.').join('');
  }

  return Number(normalized);
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
    return validDate(year, month, day) ? `${year}-${month}-${day}` : null;
  }

  const yyyymmddMatch = str.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})$/);
  if (yyyymmddMatch) {
    const year = yyyymmddMatch[1];
    const month = yyyymmddMatch[2].padStart(2, '0');
    const day = yyyymmddMatch[3].padStart(2, '0');
    return validDate(year, month, day) ? `${year}-${month}-${day}` : null;
  }

  return null;
}

function validDate(year: string, month: string, day: string): boolean {
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getFullYear() === Number(year)
    && date.getMonth() === Number(month) - 1
    && date.getDate() === Number(day);
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
    return diff <= Math.max(0, options.numericTolerance);
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

