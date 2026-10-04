import * as XLSX from 'xlsx';
import { XMLParser } from 'fast-xml-parser';
import mammoth from 'mammoth';
import { FileDataInfo, FileFormat } from '../types';

/**
 * Parses uploaded files based on their extension / format
 */
export async function parseUploadedFile(file: File): Promise<FileDataInfo> {
  const fileName = file.name;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return parseExcelFile(file);
  } else if (ext === 'xml') {
    return parseXmlInvoiceFile(file);
  } else if (ext === 'docx') {
    return parseWordFile(file);
  } else if (['txt'].includes(ext)) {
    return parseTextFile(file);
  }
  throw new Error(`Định dạng .${ext || 'không xác định'} chưa được hỗ trợ. Hãy dùng XLSX, XLS, CSV, XML, DOCX hoặc TXT.`);
}

/**
 * Excel Parser (.xlsx, .xls, .csv)
 */
export async function parseExcelFile(file: File, sheetName?: string): Promise<FileDataInfo> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;
  if (sheetNames.length === 0) throw new Error('Tệp Excel không có trang tính để đọc.');
  const activeSheetName = sheetName && sheetNames.includes(sheetName) ? sheetName : sheetNames[0];

  const worksheet = workbook.Sheets[activeSheetName];
  const rawRowsJson: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  // Filter out keys starting with __EMPTY and remove blank rows
  const cleanedRows: Record<string, any>[] = [];
  for (const row of rawRowsJson) {
    const cleanRow: Record<string, any> = {};
    let hasData = false;
    for (const key of Object.keys(row)) {
      if (!key.startsWith('__EMPTY')) {
        cleanRow[key] = row[key];
        if (row[key] !== '' && row[key] !== null && row[key] !== undefined) {
          hasData = true;
        }
      }
    }
    if (hasData) {
      cleanedRows.push(cleanRow);
    }
  }

  let headers: string[] = [];
  if (cleanedRows.length > 0) {
    headers = Object.keys(cleanedRows[0]).filter((k) => !k.startsWith('__EMPTY'));
  }

  return {
    name: file.name,
    size: file.size,
    format: 'excel',
    sheets: sheetNames,
    selectedSheet: activeSheetName,
    headers,
    rawRows: cleanedRows,
    sourceFile: file,
  };
}

/**
 * XML E-Invoice Parser (Vietnam General Dept of Taxation HĐĐT format: HDon -> DLHDon -> NDHDon)
 */
export async function parseXmlInvoiceFile(file: File): Promise<FileDataInfo> {
  const text = await file.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const parsedXml = parser.parse(text);

  // Flatten electronic invoice XML or generic XML into tabular rows
  const extractedRows = extractRowsFromXml(parsedXml);
  const headers = extractedRows.length > 0 ? Object.keys(extractedRows[0]) : [];

  return {
    name: file.name,
    size: file.size,
    format: 'xml',
    rawText: text,
    xmlParsedData: parsedXml,
    headers,
    rawRows: extractedRows,
  };
}

/**
 * Flattens General Dept of Taxation (TCT) E-Invoice XML structure into tabular array
 */
function extractRowsFromXml(xmlObj: any): Record<string, any>[] {
  const rows: Record<string, any>[] = [];

  // Look for TCT invoice root <HDon> or <DLHDon> or <Invoice>
  const hdon = xmlObj?.HDon || xmlObj?.Invoice || xmlObj;
  const dlHdon = hdon?.DLHDon || hdon;
  const ttinChung = dlHdon?.NDHDon?.TTinChung || dlHdon?.TTinChung || {};
  const nban = dlHdon?.NDHDon?.NBan || dlHdon?.NBan || {};
  const nmua = dlHdon?.NDHDon?.NMua || dlHdon?.NMua || {};
  const tttToan = dlHdon?.NDHDon?.TToan || dlHdon?.TToan || {};
  const dshhDVu = dlHdon?.NDHDon?.DSHHDVu?.HHDVu || dlHdon?.DSHHDVu?.HHDVu || [];

  const invoiceHeaderMeta = {
    'Số hóa đơn': ttinChung?.SHDon || ttinChung?.InvoiceNo || '',
    'Ký hiệu HĐ': ttinChung?.KHHDon || ttinChung?.SerialNo || '',
    'Mẫu số HĐ': ttinChung?.MS || ttinChung?.FormNo || '',
    'Ngày lập': ttinChung?.NLap || ttinChung?.InvoiceDate || '',
    'MST Người Bán': nban?.MST || nban?.SellerTaxCode || '',
    'Tên Người Bán': nban?.Ten || nban?.SellerName || '',
    'MST Người Mua': nmua?.MST || nmua?.BuyerTaxCode || '',
    'Tên Người Mua': nmua?.Ten || nmua?.BuyerName || '',
    'Tổng chưa thuế': tttToan?.TgTCThue || tttToan?.TotalBeforeTax || 0,
    'Tiền thuế VAT': tttToan?.TgTThue || tttToan?.TotalTaxAmount || 0,
    'Thành tiền': tttToan?.TgTTToan || tttToan?.TotalAmount || 0,
  };

  if (Array.isArray(dshhDVu) && dshhDVu.length > 0) {
    dshhDVu.forEach((item: any, idx: number) => {
      rows.push({
        'STT Line': idx + 1,
        ...invoiceHeaderMeta,
        'Tên hàng hóa/dịch vụ': item?.THHDVu || item?.ItemName || '',
        'Đơn vị tính': item?.DVTinh || item?.Unit || '',
        'Số lượng': Number(item?.SLuong || item?.Quantity || 0),
        'Đơn giá': Number(item?.DGia || item?.UnitPrice || 0),
        'Thành tiền trước thuế': Number(item?.ThTien || item?.Amount || 0),
        'Thuế suất VAT': item?.TSuat || item?.TaxRate || '',
        'Tiền thuế Line': Number(item?.TThue || item?.TaxAmount || 0),
      });
    });
  } else if (typeof dshhDVu === 'object' && dshhDVu !== null) {
    rows.push({
      'STT Line': 1,
      ...invoiceHeaderMeta,
      'Tên hàng hóa/dịch vụ': dshhDVu?.THHDVu || dshhDVu?.ItemName || '',
      'Đơn vị tính': dshhDVu?.DVTinh || dshhDVu?.Unit || '',
      'Số lượng': Number(dshhDVu?.SLuong || 0),
      'Đơn giá': Number(dshhDVu?.DGia || 0),
      'Thành tiền trước thuế': Number(dshhDVu?.ThTien || 0),
      'Thuế suất VAT': dshhDVu?.TSuat || '',
      'Tiền thuế Line': Number(dshhDVu?.TThue || 0),
    });
  } else {
    // Single header summary row
    rows.push(invoiceHeaderMeta);
  }

  return rows.length > 0 ? rows : [flattenObject(xmlObj)];
}

/**
 * Helper to flatten nested object for arbitrary XML
 */
function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      const flat = flattenObject(obj[key], `${prefix}${key}_`);
      Object.assign(result, flat);
    } else {
      result[`${prefix}${key}`] = obj[key];
    }
  }
  return result;
}

/**
 * Word Parser (.docx)
 */
export async function parseWordFile(file: File): Promise<FileDataInfo> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const rawText = result.value;

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rawRows = lines.map((line, idx) => ({
    'Dòng STT': idx + 1,
    'Nội dung điều khoản / Đoạn văn': line,
  }));

  return {
    name: file.name,
    size: file.size,
    format: 'word',
    rawText,
    headers: ['Dòng STT', 'Nội dung điều khoản / Đoạn văn'],
    rawRows,
  };
}

/**
 * Plain Text / PDF Text Parser
 */
export async function parseTextFile(file: File): Promise<FileDataInfo> {
  const text = await file.text();
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rawRows = lines.map((line, idx) => ({
    'Dòng STT': idx + 1,
    'Nội dung Dòng': line,
  }));

  return {
    name: file.name,
    size: file.size,
    format: 'text',
    rawText: text,
    headers: ['Dòng STT', 'Nội dung Dòng'],
    rawRows,
  };
}

