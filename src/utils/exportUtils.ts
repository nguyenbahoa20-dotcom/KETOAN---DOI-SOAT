import * as XLSX from 'xlsx';
import { RowDiffResult, DiffSummary } from '../types';

/**
 * Export Reconciliation Diff Results to formatted Excel Workbook
 */
export function exportDiffToExcel(
  results: RowDiffResult[],
  summary: DiffSummary,
  fileAName: string,
  fileBName: string
) {
  // Build export rows
  const exportData: Record<string, any>[] = [];

  results.forEach((item, idx) => {
    const rowObj: Record<string, any> = {
      'STT': idx + 1,
      'Mã Tham Chiếu / Khóa': item.keyVal,
      'Trạng Thái Đối Soát': translateStatus(item.status),
      'Cột Kiểm Chứng (Audit Note)': item.auditVerificationNote,
      'Cảnh Báo Thuế / Kế Toán': item.taxAlert || 'Bình thường',
    };

    // Combine row A & B fields for comparison view
    const rowA = item.rowA || {};
    const rowB = item.rowB || {};
    const allKeys = Array.from(new Set([...Object.keys(rowA), ...Object.keys(rowB)]));

    allKeys.forEach((k) => {
      const valA = rowA[k] !== undefined ? rowA[k] : '(Thiếu File A)';
      const valB = rowB[k] !== undefined ? rowB[k] : '(Thiếu File B)';
      
      rowObj[`File A - ${k}`] = valA;
      rowObj[`File B - ${k}`] = valB;
      if (valA !== valB) {
        rowObj[`Chênh lệch - ${k}`] = item.cellDiffs?.[k]?.delta !== undefined
          ? item.cellDiffs[k].delta
          : 'Sai lệch nội dung';
      }
    });

    exportData.push(rowObj);
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Add Summary sheet
  const summaryData = [
    { 'Chỉ Số Kế Toán - Thuế': 'Tên File Gốc (A)', 'Giá Trị / Kết Quả': fileAName },
    { 'Chỉ Số Kế Toán - Thuế': 'Tên File Đối Ứng (B)', 'Giá Trị / Kết Quả': fileBName },
    { 'Chỉ Số Kế Toán - Thuế': 'Tổng Số Dòng Kiểm Tra', 'Giá Trị / Kết Quả': summary.totalRows },
    { 'Chỉ Số Kế Toán - Thuế': 'Khớp Hoàn Toàn (Matched)', 'Giá Trị / Kết Quả': summary.matchedCount },
    { 'Chỉ Số Kế Toán - Thuế': 'Lệch Chi Tiết (Mismatched)', 'Giá Trị / Kết Quả': summary.mismatchedCount },
    { 'Chỉ Số Kế Toán - Thuế': 'Chỉ Có Trong File A', 'Giá Trị / Kết Quả': summary.orphanACount },
    { 'Chỉ Số Kế Toán - Thuế': 'Chỉ Có Trong File B', 'Giá Trị / Kết Quả': summary.orphanBCount },
    { 'Chỉ Số Kế Toán - Thuế': 'Tổng Chênh Lệch Giá Trị (VNĐ)', 'Giá Trị / Kết Quả': summary.totalAmountDiff },
    { 'Chỉ Số Kế Toán - Thuế': 'Số Dòng Cảnh Báo Rủi Ro Thuế', 'Giá Trị / Kết Quả': summary.taxAlertCount },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Báo Cáo Tổng Quan');
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Chi Tiết Đối Soát');

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Bao_Cao_Doi_Soat_Ke_Toan_${timestamp}.xlsx`);
}

function translateStatus(status: string): string {
  switch (status) {
    case 'matched':
      return '✅ Khớp Hoàn Toàn';
    case 'mismatched':
      return '⚠️ Lệch Chi Tiết';
    case 'orphan_a':
      return '🔵 Chỉ Có Ở File A';
    case 'orphan_b':
      return '🔴 Chỉ Có Ở File B';
    default:
      return status;
  }
}
