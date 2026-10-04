export type FileFormat = 'excel' | 'xml' | 'word' | 'text';

export type DiffMode = 'auto' | 'primary_key' | 'row_by_row' | 'text_clause';

export interface NormalizationOptions {
  trimWhitespace: boolean;
  ignoreCase: boolean;
  standardizeDates: boolean;
  roundNumbers: boolean;
  numericTolerance: number; // e.g. 0.01 or 1 for VND rounding
  ignoreSpecialChars: boolean;
}

export type DiffStatus = 'matched' | 'mismatched' | 'orphan_a' | 'orphan_b';

export interface CellDiff {
  valA: any;
  valB: any;
  isDiff: boolean;
  delta?: number;
  deltaPercent?: number;
  diffType?: 'text' | 'numeric' | 'missing' | 'tax_rate';
}

export interface RowDiffResult {
  id: string;
  keyVal: string;
  status: DiffStatus;
  rowA?: Record<string, any>;
  rowB?: Record<string, any>;
  cellDiffs?: Record<string, CellDiff>;
  auditVerificationNote: string; // Cột kiểm chứng
  taxAlert?: string; // e.g. "Lệch VAT 8% vs 10%", "Sai MST"
  severity: 'none' | 'low' | 'medium' | 'high';
}

export interface DiffSummary {
  totalRows: number;
  matchedCount: number;
  mismatchedCount: number;
  orphanACount: number;
  orphanBCount: number;
  totalValAAmount: number;
  totalValBAmount: number;
  totalAmountDiff: number;
  taxAlertCount: number;
}

export interface TextClauseDiff {
  type: 'equal' | 'insert' | 'delete';
  value: string;
  lineNumberA?: number;
  lineNumberB?: number;
}

export interface FileDataInfo {
  name: string;
  size: number;
  format: FileFormat;
  sheets?: string[];
  selectedSheet?: string;
  headers?: string[];
  rawRows?: Record<string, any>[];
  rawText?: string;
  xmlParsedData?: any;
  sourceFile?: File;
  isSample?: boolean;
}

export interface SamplePreset {
  id: string;
  title: string;
  subtitle: string;
  category: 'VAT_TAX' | 'BANK_RECON' | 'CONTRACT_WORD' | 'SALARY_EXCEL';
  fileA: { name: string; format: FileFormat; data: any };
  fileB: { name: string; format: FileFormat; data: any };
  suggestedKey?: string;
  description: string;
}

