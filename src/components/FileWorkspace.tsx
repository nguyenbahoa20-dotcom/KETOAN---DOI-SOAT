import React, { useRef } from 'react';
import { FileDataInfo } from '../types';
import { Upload, FileSpreadsheet, FileCode, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface FileWorkspaceProps {
  fileA: FileDataInfo | null;
  fileB: FileDataInfo | null;
  onFileUploadA: (file: File) => void;
  onFileUploadB: (file: File) => void;
  onSelectSheetA?: (sheet: string) => void;
  onSelectSheetB?: (sheet: string) => void;
  isLoadingA: boolean;
  isLoadingB: boolean;
  errorA?: string;
  errorB?: string;
}

export const FileWorkspace: React.FC<FileWorkspaceProps> = ({
  fileA,
  fileB,
  onFileUploadA,
  onFileUploadB,
  onSelectSheetA,
  onSelectSheetB,
  isLoadingA,
  isLoadingB,
  errorA,
  errorB,
}) => {
  const inputRefA = useRef<HTMLInputElement>(null);
  const inputRefB = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, isZoneA: boolean) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (isZoneA) onFileUploadA(file);
      else onFileUploadB(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-2">
      {/* ----------------- ZONE A: FILE GỐC / NỘI BỘ ----------------- */}
      <div
        id="file-zone-a"
        onDrop={(e) => handleDrop(e, true)}
        onDragOver={handleDragOver}
        className={`relative rounded-lg border transition-all p-2.5 ${
          fileA
            ? 'bg-white border-emerald-600/40 shadow-sm'
            : 'bg-white border-dashed border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-700 text-white font-bold text-[11px]">
              A
            </span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              File A: Gốc / Gửi Đi / Nội Bộ
            </h3>
          </div>
          {fileA && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Đã nạp ({fileA.rawRows?.length || 0} dòng)
            </span>
          )}
        </div>

        {isLoadingA ? (
          <div className="flex items-center justify-center py-3 text-emerald-700 space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-xs font-semibold">Đang xử lý File A...</span>
          </div>
        ) : fileA ? (
          <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
            <div className="flex items-center space-x-2.5">
              {getFormatIcon(fileA.format)}
              <div>
                <p className="text-xs font-bold text-slate-800 truncate max-w-[220px]" title={fileA.name}>
                  {fileA.name}
                </p>
                <p className="text-[11px] text-slate-500">
                  {fileA.isSample ? 'Dữ liệu mẫu' : `${(fileA.size / 1024).toFixed(1)} KB`} • {fileA.format.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {fileA.sheets && fileA.sheets.length > 1 && (
                <select
                  value={fileA.selectedSheet}
                  onChange={(e) => onSelectSheetA && onSelectSheetA(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-800 rounded px-1.5 py-0.5 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                >
                  {fileA.sheets.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => inputRefA.current?.click()}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold underline px-1"
              >
                Đổi File
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => inputRefA.current?.click()}
            className="flex items-center justify-center py-3 cursor-pointer text-center group space-x-2"
          >
            <Upload className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            <p className="text-xs font-semibold text-slate-600 group-hover:text-emerald-700">
              Bấm hoặc kéo thả để tải File A (Excel, XML, DOCX, CSV, TXT)
            </p>
          </div>
        )}

        <input
          ref={inputRefA}
          type="file"
          accept=".xlsx,.xls,.csv,.xml,.docx,.txt"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileUploadA(file);
            e.currentTarget.value = '';
          }}
          className="hidden"
        />
        {errorA && <p role="alert" className="mt-1 text-xs text-rose-700">{errorA}</p>}
      </div>

      {/* ----------------- ZONE B: FILE ĐỐI ỨNG / THUẾ / NGÂN HÀNG ----------------- */}
      <div
        id="file-zone-b"
        onDrop={(e) => handleDrop(e, false)}
        onDragOver={handleDragOver}
        className={`relative rounded-lg border transition-all p-2.5 ${
          fileB
            ? 'bg-white border-blue-600/40 shadow-sm'
            : 'bg-white border-dashed border-slate-300 hover:border-blue-500 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-white font-bold text-[11px]">
              B
            </span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              File B: Đối Ứng / Cơ Quan Thuế / Ngân Hàng
            </h3>
          </div>
          {fileB && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              <CheckCircle2 className="w-3 h-3 mr-1 text-blue-600" /> Đã nạp ({fileB.rawRows?.length || 0} dòng)
            </span>
          )}
        </div>

        {isLoadingB ? (
          <div className="flex items-center justify-center py-3 text-blue-700 space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-xs font-semibold">Đang xử lý File B...</span>
          </div>
        ) : fileB ? (
          <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
            <div className="flex items-center space-x-2.5">
              {getFormatIcon(fileB.format)}
              <div>
                <p className="text-xs font-bold text-slate-800 truncate max-w-[220px]" title={fileB.name}>
                  {fileB.name}
                </p>
                <p className="text-[11px] text-slate-500">
                  {fileB.isSample ? 'Dữ liệu mẫu' : `${(fileB.size / 1024).toFixed(1)} KB`} • {fileB.format.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {fileB.sheets && fileB.sheets.length > 1 && (
                <select
                  value={fileB.selectedSheet}
                  onChange={(e) => onSelectSheetB && onSelectSheetB(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-800 rounded px-1.5 py-0.5 text-xs font-medium focus:ring-1 focus:ring-blue-500"
                >
                  {fileB.sheets.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => inputRefB.current?.click()}
                className="text-xs text-blue-700 hover:text-blue-800 font-bold underline px-1"
              >
                Đổi File
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => inputRefB.current?.click()}
            className="flex items-center justify-center py-3 cursor-pointer text-center group space-x-2"
          >
            <Upload className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            <p className="text-xs font-semibold text-slate-600 group-hover:text-blue-700">
              Bấm hoặc kéo thả để tải File B (Excel, XML, DOCX, CSV, TXT)
            </p>
          </div>
        )}

        <input
          ref={inputRefB}
          type="file"
          accept=".xlsx,.xls,.csv,.xml,.docx,.txt"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileUploadB(file);
            e.currentTarget.value = '';
          }}
          className="hidden"
        />
        {errorB && <p role="alert" className="mt-1 text-xs text-rose-700">{errorB}</p>}
      </div>
    </div>
  );
};

function getFormatIcon(format: string) {
  switch (format) {
    case 'excel':
      return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
    case 'xml':
      return <FileCode className="w-6 h-6 text-amber-400" />;
    case 'word':
      return <FileText className="w-6 h-6 text-blue-400" />;
    default:
      return <AlertCircle className="w-6 h-6 text-slate-400" />;
  }
}

