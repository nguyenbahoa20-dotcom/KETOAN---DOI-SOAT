import React, { useState, useEffect, useMemo } from 'react';
import {
  FileDataInfo,
  NormalizationOptions,
  RowDiffResult,
  DiffSummary,
} from './types';
import { SAMPLE_DATASETS } from './data/sampleDatasets';
import { parseExcelFile, parseUploadedFile } from './utils/fileParsers';
import { reconcileTabularData } from './utils/diffEngine';
import { exportDiffToExcel } from './utils/exportUtils';
import { Navbar } from './components/Navbar';
import { FileWorkspace } from './components/FileWorkspace';
import { NormalizationToolbar } from './components/NormalizationToolbar';
import { DiffTableView } from './components/DiffTableView';
import { TextWordDiffView } from './components/TextWordDiffView';
import { AiTaxAdvisorModal } from './components/AiTaxAdvisorModal';
import { PythonScriptGeneratorModal } from './components/PythonScriptGeneratorModal';
import { FileCheck2, Info, Layers } from 'lucide-react';

export default function App() {
  const [fileA, setFileA] = useState<FileDataInfo | null>(null);
  const [fileB, setFileB] = useState<FileDataInfo | null>(null);
  const [isLoadingA, setIsLoadingA] = useState(false);
  const [isLoadingB, setIsLoadingB] = useState(false);
  const [uploadErrorA, setUploadErrorA] = useState('');
  const [uploadErrorB, setUploadErrorB] = useState('');

  const [selectedKey, setSelectedKey] = useState<string | null>('auto_detect');
  const [activePresetId, setActivePresetId] = useState<string>('xml_vs_excel_vat');

  // Normalization Options
  const [options, setOptions] = useState<NormalizationOptions>({
    trimWhitespace: true,
    ignoreCase: true,
    standardizeDates: true,
    roundNumbers: true,
    numericTolerance: 0.01,
    ignoreSpecialChars: false,
  });

  // Filter & Search - Default statusFilter is 'discrepancies' (Hides 'matched' by default)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('discrepancies');

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);

  // Auto-load initial sample dataset on mount
  useEffect(() => {
    loadPresetDataset('xml_vs_excel_vat');
  }, []);

  const loadPresetDataset = (presetId: string) => {
    const preset = SAMPLE_DATASETS.find((p) => p.id === presetId);
    if (!preset) return;

    setActivePresetId(presetId);

    const infoA: FileDataInfo = {
      name: preset.fileA.name,
      size: 15420,
      format: preset.fileA.format,
      isSample: true,
      headers: preset.fileA.data.length > 0 ? Object.keys(preset.fileA.data[0]) : [],
      rawRows: preset.fileA.data,
      rawText: preset.fileA.format === 'word' ? preset.fileA.data.map((d: any) => d['Nội dung điều khoản / Đoạn văn']).join('\n') : undefined,
    };

    const infoB: FileDataInfo = {
      name: preset.fileB.name,
      size: 18200,
      format: preset.fileB.format,
      isSample: true,
      headers: preset.fileB.data.length > 0 ? Object.keys(preset.fileB.data[0]) : [],
      rawRows: preset.fileB.data,
      rawText: preset.fileB.format === 'word' ? preset.fileB.data.map((d: any) => d['Nội dung điều khoản / Đoạn văn']).join('\n') : undefined,
    };

    setFileA(infoA);
    setFileB(infoB);
    setSelectedKey(preset.suggestedKey || 'auto_detect');
    setSearchQuery('');
    setStatusFilter('discrepancies');
    setCustomAuditNotes({});
    setUploadErrorA('');
    setUploadErrorB('');
  };

  // Upload Handlers
  const handleFileUploadA = async (file: File) => {
    setIsLoadingA(true);
    try {
      const parsed = await parseUploadedFile(file);
      setFileA(parsed);
      setSelectedKey('auto_detect');
      setActivePresetId('');
      setCustomAuditNotes({});
      setUploadErrorA('');
    } catch (err) {
      console.error("Error parsing File A:", err);
      setUploadErrorA(err instanceof Error ? err.message : 'Không thể đọc File A.');
    } finally {
      setIsLoadingA(false);
    }
  };

  const handleFileUploadB = async (file: File) => {
    setIsLoadingB(true);
    try {
      const parsed = await parseUploadedFile(file);
      setFileB(parsed);
      setSelectedKey('auto_detect');
      setActivePresetId('');
      setCustomAuditNotes({});
      setUploadErrorB('');
    } catch (err) {
      console.error("Error parsing File B:", err);
      setUploadErrorB(err instanceof Error ? err.message : 'Không thể đọc File B.');
    } finally {
      setIsLoadingB(false);
    }
  };

  const handleSelectSheetA = async (sheet: string) => {
    if (!fileA?.sourceFile) return;
    try {
      setFileA(await parseExcelFile(fileA.sourceFile, sheet));
      setSelectedKey('auto_detect');
      setCustomAuditNotes({});
      setUploadErrorA('');
    } catch (err) {
      setUploadErrorA(err instanceof Error ? err.message : 'Không thể đọc trang tính này.');
    }
  };

  const handleSelectSheetB = async (sheet: string) => {
    if (!fileB?.sourceFile) return;
    try {
      setFileB(await parseExcelFile(fileB.sourceFile, sheet));
      setSelectedKey('auto_detect');
      setCustomAuditNotes({});
      setUploadErrorB('');
    } catch (err) {
      setUploadErrorB(err instanceof Error ? err.message : 'Không thể đọc trang tính này.');
    }
  };

  // Available common keys between File A & File B
  const availableKeys = useMemo(() => {
    const keysA = (fileA?.headers || []).filter((k) => !k.startsWith('__EMPTY'));
    const keysB = (fileB?.headers || []).filter((k) => !k.startsWith('__EMPTY'));
    const common = keysA.filter((k) => keysB.includes(k));
    return common.length > 0 ? common : Array.from(new Set([...keysA, ...keysB]));
  }, [fileA, fileB]);

  // Core Reconciliation Execution
  const { reconciliationResults, summary } = useMemo(() => {
    if (!fileA?.rawRows || !fileB?.rawRows) {
      return {
        reconciliationResults: [] as RowDiffResult[],
        summary: {
          totalRows: 0,
          matchedCount: 0,
          mismatchedCount: 0,
          orphanACount: 0,
          orphanBCount: 0,
          totalValAAmount: 0,
          totalValBAmount: 0,
          totalAmountDiff: 0,
          taxAlertCount: 0,
        } as DiffSummary,
      };
    }

    const { results, summary } = reconcileTabularData(
      fileA.rawRows,
      fileB.rawRows,
      selectedKey,
      options
    );

    return { reconciliationResults: results, summary };
  }, [fileA, fileB, selectedKey, options]);

  // State update for Audit Verification Column notes
  const [customAuditNotes, setCustomAuditNotes] = useState<Record<string, string>>({});

  const handleUpdateAuditNote = (id: string, note: string) => {
    setCustomAuditNotes((prev) => ({ ...prev, [id]: note }));
  };

  // Filtered Results for UI Table (Hides "Khớp 100%" rows by default when statusFilter is 'discrepancies')
  const filteredResults = useMemo(() => {
    return reconciliationResults
      .map((item) => ({
        ...item,
        auditVerificationNote: customAuditNotes[item.id] || item.auditVerificationNote,
      }))
      .filter((item) => {
        // Status filter logic
        if (statusFilter === 'discrepancies' && item.status === 'matched') return false;
        if (statusFilter === 'matched' && item.status !== 'matched') return false;
        if (statusFilter === 'mismatched' && item.status !== 'mismatched') return false;
        if (statusFilter === 'orphan_a' && item.status !== 'orphan_a') return false;
        if (statusFilter === 'orphan_b' && item.status !== 'orphan_b') return false;
        if (statusFilter === 'tax_alert' && !item.taxAlert) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchKey = item.keyVal.toLowerCase().includes(q);
          const matchNote = item.auditVerificationNote.toLowerCase().includes(q);
          const matchTax = item.taxAlert?.toLowerCase().includes(q) || false;
          const matchRowA = JSON.stringify(item.rowA || {}).toLowerCase().includes(q);
          const matchRowB = JSON.stringify(item.rowB || {}).toLowerCase().includes(q);

          return matchKey || matchNote || matchTax || matchRowA || matchRowB;
        }

        return true;
      });
  }, [reconciliationResults, statusFilter, searchQuery, customAuditNotes]);

  const handleExportExcel = () => {
    if (filteredResults.length === 0) return;
    exportDiffToExcel(
      filteredResults,
      summary,
      fileA?.name || 'File A',
      fileB?.name || 'File B'
    );
  };

  const handleReset = () => {
    setFileA(null);
    setFileB(null);
    setSelectedKey('auto_detect');
    setSearchQuery('');
    setStatusFilter('discrepancies');
    setCustomAuditNotes({});
    setActivePresetId('');
    setUploadErrorA('');
    setUploadErrorB('');
  };

  const isWordContractMode = fileA?.format === 'word' || fileB?.format === 'word';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white flex flex-col">
      {/* NAVBAR */}
      <Navbar
        onSelectPreset={loadPresetDataset}
        onOpenPythonCode={() => setIsPythonModalOpen(true)}
        onOpenAiAnalysis={() => setIsAiModalOpen(true)}
        onExportExcel={handleExportExcel}
        onReset={handleReset}
        hasData={!!fileA && !!fileB}
        selectedPresetId={activePresetId}
      />

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-full w-full mx-auto px-3 sm:px-4 py-2">
        {/* ACTIVE PRESET INFOBAR */}
        {activePresetId && (
          <div className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-sm my-1">
            <div className="flex items-center space-x-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {SAMPLE_DATASETS.find((p) => p.id === activePresetId)?.title}
                </p>
                <p className="text-[11px] text-slate-500">
                  {SAMPLE_DATASETS.find((p) => p.id === activePresetId)?.description}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-medium">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Chế độ đối soát chi tiết toàn bộ nội dung cell-by-cell</span>
            </div>
          </div>
        )}

        {/* WORKSPACE FILE UPLOAD DUAL ZONE */}
        <FileWorkspace
          fileA={fileA}
          fileB={fileB}
          onFileUploadA={handleFileUploadA}
          onFileUploadB={handleFileUploadB}
          isLoadingA={isLoadingA}
          isLoadingB={isLoadingB}
          onSelectSheetA={handleSelectSheetA}
          onSelectSheetB={handleSelectSheetB}
          errorA={uploadErrorA}
          errorB={uploadErrorB}
        />

        {/* NORMALIZATION & FILTER TOOLBAR */}
        {fileA && fileB && (
          <>
            <NormalizationToolbar
              availableKeys={availableKeys}
              selectedKey={selectedKey}
              onSelectKey={setSelectedKey}
              options={options}
              onOptionsChange={setOptions}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              matchedCount={summary.matchedCount}
              mismatchedCount={summary.mismatchedCount}
              orphanACount={summary.orphanACount}
              orphanBCount={summary.orphanBCount}
              taxAlertCount={summary.taxAlertCount}
              totalRows={summary.totalRows}
            />

            {/* TABULAR DIFF OR WORD DIFF */}
            {isWordContractMode ? (
              <TextWordDiffView
                textA={fileA.rawText || ''}
                textB={fileB.rawText || ''}
                fileAName={fileA.name}
                fileBName={fileB.name}
              />
            ) : (
              <DiffTableView
                results={filteredResults}
                onUpdateAuditNote={handleUpdateAuditNote}
              />
            )}
          </>
        )}

        {(!fileA || !fileB) && (
          <div className="my-8 p-6 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
            <Layers className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Vui lòng chọn hoặc nạp đủ cả 2 File (A và B)</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
              Hoặc bấm nút <strong className="text-emerald-700">"Nạp Mẫu Chứng Từ"</strong> ở góc trên thanh công cụ để trải nghiệm ngay mẫu XML Hóa đơn, Sao kê Ngân hàng, hoặc Hợp đồng Word.
            </p>
          </div>
        )}
      </main>

      {/* AI TAX ADVISOR MODAL */}
      <AiTaxAdvisorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        summary={summary}
        results={reconciliationResults}
        fileAName={fileA?.name || 'File A'}
        fileBName={fileB?.name || 'File B'}
      />

      {/* PYTHON SCRIPT GENERATOR MODAL */}
      <PythonScriptGeneratorModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-2.5 text-center text-xs text-slate-500">
        <p>Phần Mềm Đối Soát Toàn Diện Kế Toán - Full-Content Reconciliation & Tax Audit System © 2026</p>
      </footer>
    </div>
  );
}

