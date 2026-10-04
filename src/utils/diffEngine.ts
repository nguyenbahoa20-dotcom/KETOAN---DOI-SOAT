import * as diff from 'diff';
import {
  CellDiff,
  DiffStatus,
  DiffSummary,
  NormalizationOptions,
  RowDiffResult,
  TextClauseDiff,
} from '../types';
import { areValuesEqual, normalizeValue } from './dataNormalizer';

/**
 * Core Reconciliation Algorithm for Tabular Data (Excel, XML, Structured Lists)
 */
export function reconcileTabularData(
  rowsA: Record<string, any>[],
  rowsB: Record<string, any>[],
  primaryKeyCol: string | null,
  options: NormalizationOptions
): { results: RowDiffResult[]; summary: DiffSummary } {
  const results: RowDiffResult[] = [];

  let matchedCount = 0;
  let mismatchedCount = 0;
  let orphanACount = 0;
  let orphanBCount = 0;
  let totalValAAmount = 0;
  let totalValBAmount = 0;
  let taxAlertCount = 0;

  // Determine common union of header columns
  const keysA = rowsA.length > 0 ? Object.keys(rowsA[0]) : [];
  const keysB = rowsB.length > 0 ? Object.keys(rowsB[0]) : [];
  const allColumns = Array.from(new Set([...keysA, ...keysB])).filter(
    (c) => !c.startsWith('__EMPTY')
  );

  // Auto-detect key if not provided
  const effectiveKey = primaryKeyCol || detectPrimaryKey(keysA, keysB);

  if (effectiveKey && effectiveKey !== 'row_by_row_index') {
    // ----------------------------------------------------
    // STRATEGY A: PRIMARY KEY / REFERENCE COLUMN MATCHING
    // ----------------------------------------------------
    const mapA = new Map<string, Record<string, any>>();
    const mapB = new Map<string, Record<string, any>>();

    rowsA.forEach((row, idx) => {
      const rawKey = row[effectiveKey];
      const normKey = String(normalizeValue(rawKey, options));
      const keyVal = normKey || `ROW_A_${idx + 1}`;
      mapA.set(keyVal, row);
    });

    rowsB.forEach((row, idx) => {
      const rawKey = row[effectiveKey];
      const normKey = String(normalizeValue(rawKey, options));
      const keyVal = normKey || `ROW_B_${idx + 1}`;
      mapB.set(keyVal, row);
    });

    // Process all keys from A
    const processedKeys = new Set<string>();

    mapA.forEach((rowA, keyVal) => {
      processedKeys.add(keyVal);
      const rowB = mapB.get(keyVal);

      if (!rowB) {
        // Orphan in A (Missing in B)
        orphanACount++;
        const amountA = getRowAmount(rowA);
        totalValAAmount += amountA;

        results.push({
          id: `diff_a_${keyVal}`,
          keyVal,
          status: 'orphan_a',
          rowA,
          rowB: undefined,
          auditVerificationNote: 'Thiếu ở File B (Chỉ có trong File A)',
          taxAlert: 'Chưa đối ứng ở File B - Cần kiểm tra hóa đơn/chứng từ bỏ sót',
          severity: 'medium',
        });
      } else {
        // Both exist -> Compare all cell values
        const amountA = getRowAmount(rowA);
        const amountB = getRowAmount(rowB);
        totalValAAmount += amountA;
        totalValBAmount += amountB;

        const cellDiffs: Record<string, CellDiff> = {};
        let hasCellDiscrepancy = false;
        let taxAlertMsg: string | undefined = undefined;

        allColumns.forEach((col) => {
          const valA = rowA[col];
          const valB = rowB[col];
          const isSame = areValuesEqual(valA, valB, options);

          let delta: number | undefined = undefined;
          let deltaPercent: number | undefined = undefined;

          const numA = Number(String(valA).replace(/,/g, ''));
          const numB = Number(String(valB).replace(/,/g, ''));

          if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
            delta = numB - numA;
            if (numA !== 0) deltaPercent = (delta / Math.abs(numA)) * 100;
          }

          if (!isSame) {
            hasCellDiscrepancy = true;
          }

          cellDiffs[col] = {
            valA,
            valB,
            isDiff: !isSame,
            delta,
            deltaPercent,
            diffType: typeof numA === 'number' && !isNaN(numA) ? 'numeric' : 'text',
          };
        });

        // Detect Tax & Financial Specific Anomalies
        taxAlertMsg = detectTaxAlerts(rowA, rowB, cellDiffs);
        if (taxAlertMsg) taxAlertCount++;

        let status: DiffStatus = 'matched';
        let verificationNote = 'Khớp 100%';
        let severity: 'none' | 'low' | 'medium' | 'high' = 'none';

        if (hasCellDiscrepancy) {
          status = 'mismatched';
          mismatchedCount++;
          const diffsList: string[] = [];
          Object.keys(cellDiffs).forEach((c) => {
            if (cellDiffs[c].isDiff) {
              const vA = formatValForNote(cellDiffs[c].valA);
              const vB = formatValForNote(cellDiffs[c].valB);
              diffsList.push(`${c}: ${vA} -> ${vB}`);
            }
          });
          verificationNote = diffsList.join('; ') || 'Có sai lệch giá trị';
          severity = taxAlertMsg ? 'high' : 'medium';
        } else {
          matchedCount++;
        }

        results.push({
          id: `diff_match_${keyVal}`,
          keyVal,
          status,
          rowA,
          rowB,
          cellDiffs,
          auditVerificationNote: verificationNote,
          taxAlert: taxAlertMsg,
          severity,
        });
      }
    });

    // Process keys in B that were not in A (Orphan in B)
    mapB.forEach((rowB, keyVal) => {
      if (!processedKeys.has(keyVal)) {
        orphanBCount++;
        const amountB = getRowAmount(rowB);
        totalValBAmount += amountB;

        results.push({
          id: `diff_b_${keyVal}`,
          keyVal,
          status: 'orphan_b',
          rowA: undefined,
          rowB,
          auditVerificationNote: 'Thiếu ở File A (Chỉ có trong File B)',
          taxAlert: 'Chưa kê khai trong File A - Cảnh báo bỏ sót chứng từ',
          severity: 'high',
        });
      }
    });
  } else {
    // ----------------------------------------------------
    // STRATEGY B: STRUCTURAL ROW-BY-ROW CELL-BY-CELL
    // ----------------------------------------------------
    const maxLen = Math.max(rowsA.length, rowsB.length);

    for (let i = 0; i < maxLen; i++) {
      const rowA = rowsA[i];
      const rowB = rowsB[i];
      const keyVal = `Dòng #${i + 1}`;

      if (rowA && !rowB) {
        orphanACount++;
        totalValAAmount += getRowAmount(rowA);
        results.push({
          id: `diff_row_${i}`,
          keyVal,
          status: 'orphan_a',
          rowA,
          auditVerificationNote: 'Dòng dư ở File A',
          severity: 'low',
        });
      } else if (!rowA && rowB) {
        orphanBCount++;
        totalValBAmount += getRowAmount(rowB);
        results.push({
          id: `diff_row_${i}`,
          keyVal,
          status: 'orphan_b',
          rowB,
          auditVerificationNote: 'Dòng dư ở File B',
          severity: 'low',
        });
      } else {
        totalValAAmount += getRowAmount(rowA);
        totalValBAmount += getRowAmount(rowB);

        const cellDiffs: Record<string, CellDiff> = {};
        let hasCellDiscrepancy = false;

        allColumns.forEach((col) => {
          const valA = rowA[col];
          const valB = rowB[col];
          const isSame = areValuesEqual(valA, valB, options);

          if (!isSame) hasCellDiscrepancy = true;

          cellDiffs[col] = {
            valA,
            valB,
            isDiff: !isSame,
          };
        });

        const taxAlertMsg = detectTaxAlerts(rowA, rowB, cellDiffs);
        if (taxAlertMsg) taxAlertCount++;

        let status: DiffStatus = 'matched';
        let note = 'Khớp 100%';
        if (hasCellDiscrepancy) {
          status = 'mismatched';
          mismatchedCount++;
          const diffsList: string[] = [];
          Object.keys(cellDiffs).forEach((c) => {
            if (cellDiffs[c].isDiff) {
              const vA = formatValForNote(cellDiffs[c].valA);
              const vB = formatValForNote(cellDiffs[c].valB);
              diffsList.push(`${c}: ${vA} -> ${vB}`);
            }
          });
          note = diffsList.join('; ') || 'Có sai lệch giá trị ô';
        } else {
          matchedCount++;
        }

        results.push({
          id: `diff_row_${i}`,
          keyVal,
          status,
          rowA,
          rowB,
          cellDiffs,
          auditVerificationNote: note,
          taxAlert: taxAlertMsg,
          severity: hasCellDiscrepancy ? (taxAlertMsg ? 'high' : 'medium') : 'none',
        });
      }
    }
  }

  const summary: DiffSummary = {
    totalRows: results.length,
    matchedCount,
    mismatchedCount,
    orphanACount,
    orphanBCount,
    totalValAAmount,
    totalValBAmount,
    totalAmountDiff: Math.abs(totalValAAmount - totalValBAmount),
    taxAlertCount,
  };

  return { results, summary };
}

/**
 * Detect Primary Key Column automatically from column lists
 */
export function detectPrimaryKey(keysA: string[], keysB: string[]): string | null {
  const commonKeys = keysA.filter((k) => keysB.includes(k));
  if (commonKeys.length === 0) return null;

  // Candidates for Primary Reference Key in Accounting / Tax Systems
  const keyKeywords = [
    'số hóa đơn',
    'shdon',
    'invoiceno',
    'so hdon',
    'số hd',
    'mã chứng từ',
    'mactt',
    'so ctt',
    'số giaodich',
    'ref',
    'reference',
    'mã kh',
    'mã hàng',
    'mst',
    'mã định danh',
    'id',
  ];

  for (const kw of keyKeywords) {
    const matched = commonKeys.find((k) => k.toLowerCase().includes(kw));
    if (matched) return matched;
  }

  return commonKeys[0] || null;
}

/**
 * Extract total amount or primary currency figure from row
 */
export function getRowAmount(row: Record<string, any>): number {
  if (!row) return 0;
  const amountKeys = [
    'Thành tiền',
    'TgTTToan',
    'TotalAmount',
    'Số tiền',
    'Giá trị',
    'Thành tiền trước thuế',
    'Tiền thuế VAT',
    'Doanh thu',
    'Phát sinh Nợ',
    'Phát sinh Có',
  ];

  for (const k of amountKeys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
      const num = Number(String(row[k]).replace(/[,_ ]/g, ''));
      if (!isNaN(num)) return num;
    }
  }

  // Fallback: search any key with 'tiền' or 'amount'
  for (const k in row) {
    if (k.toLowerCase().includes('tiền') || k.toLowerCase().includes('amount')) {
      const num = Number(String(row[k]).replace(/[,_ ]/g, ''));
      if (!isNaN(num)) return num;
    }
  }

  return 0;
}

/**
 * Detect specific tax anomalies (VAT rate differences, tax code typos, rounding vs data error)
 */
export function detectTaxAlerts(
  rowA: Record<string, any>,
  rowB: Record<string, any>,
  cellDiffs: Record<string, CellDiff>
): string | undefined {
  const alerts: string[] = [];

  // Check Tax Rate (8% vs 10%)
  const vatA = findFieldValue(rowA, ['Thuế suất VAT', 'TSuat', 'VATRate', 'Thuế suất']);
  const vatB = findFieldValue(rowB, ['Thuế suất VAT', 'TSuat', 'VATRate', 'Thuế suất']);

  if (vatA && vatB && vatA !== vatB) {
    alerts.push(`⚠️ Lệch Thuế Suất VAT (${vatA} vs ${vatB}) - Cần kiểm tra Nghị định giảm thuế 8%`);
  }

  // Check Tax Code (MST)
  const mstA = findFieldValue(rowA, ['MST', 'MST NBM', 'MST NMua', 'Mã số thuế', 'SellerTaxCode']);
  const mstB = findFieldValue(rowB, ['MST', 'MST NBM', 'MST NMua', 'Mã số thuế', 'SellerTaxCode']);

  if (mstA && mstB && mstA.replace(/\D/g, '') !== mstB.replace(/\D/g, '')) {
    alerts.push(`❌ Sai lệch Mã Số Thuế (${mstA} vs ${mstB}) - Rủi ro hóa đơn không hợp lệ`);
  }

  // Check Tax Amount vs Total Amount
  const taxAmtA = findFieldValue(rowA, ['Tiền thuế VAT', 'TgTThue', 'TaxAmount']);
  const taxAmtB = findFieldValue(rowB, ['Tiền thuế VAT', 'TgTThue', 'TaxAmount']);

  if (taxAmtA !== undefined && taxAmtB !== undefined) {
    const numTaxA = Number(taxAmtA);
    const numTaxB = Number(taxAmtB);
    if (!isNaN(numTaxA) && !isNaN(numTaxB) && Math.abs(numTaxA - numTaxB) > 1) {
      alerts.push(`⚠️ Chênh lệch tiền thuế VAT: ${new Intl.NumberFormat('vi-VN').format(Math.abs(numTaxA - numTaxB))} VNĐ`);
    }
  }

  return alerts.length > 0 ? alerts.join(' | ') : undefined;
}

function findFieldValue(row: Record<string, any>, possibleKeys: string[]): any {
  if (!row) return undefined;
  for (const k of possibleKeys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
      return row[k];
    }
  }
  return undefined;
}

/**
 * Text & Word Document Clause-by-Clause Diff
 */
export function diffTextClauses(textA: string, textB: string): TextClauseDiff[] {
  const diffs = diff.diffWords(textA || '', textB || '');
  const result: TextClauseDiff[] = [];

  diffs.forEach((part) => {
    let type: 'equal' | 'insert' | 'delete' = 'equal';
    if (part.added) type = 'insert';
    else if (part.removed) type = 'delete';

    result.push({
      type,
      value: part.value,
    });
  });

  return result;
}

function formatValForNote(val: any): string {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'number') {
    return new Intl.NumberFormat('vi-VN').format(val);
  }
  return String(val);
}

