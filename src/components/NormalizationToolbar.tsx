import React from 'react';
import { NormalizationOptions } from '../types';
import { Settings, Search, Filter, Key, Check, AlertTriangle, Layers } from 'lucide-react';

interface NormalizationToolbarProps {
  availableKeys: string[];
  selectedKey: string | null;
  onSelectKey: (key: string | null) => void;
  options: NormalizationOptions;
  onOptionsChange: (opts: NormalizationOptions) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  matchedCount: number;
  mismatchedCount: number;
  orphanACount: number;
  orphanBCount: number;
  taxAlertCount: number;
  totalRows: number;
}

export const NormalizationToolbar: React.FC<NormalizationToolbarProps> = ({
  availableKeys,
  selectedKey,
  onSelectKey,
  options,
  onOptionsChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  matchedCount,
  mismatchedCount,
  orphanACount,
  orphanBCount,
  taxAlertCount,
  totalRows,
}) => {
  const discrepancyCount = mismatchedCount + orphanACount + orphanBCount;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 my-3 space-y-3 shadow-sm text-slate-800">
      {/* TOP ROW: Key Column Selection, Run Button & Data Normalization Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
        {/* Key Column Picker & Run Button */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-xs font-bold text-slate-700">
            <Key className="w-4 h-4 mr-1 text-emerald-700" />
            <span>Khóa Đối Chiếu:</span>
          </div>
          <select
            id="primary-key-selector"
            value={selectedKey || 'row_by_row_index'}
            onChange={(e) =>
              onSelectKey(e.target.value === 'row_by_row_index' ? null : e.target.value)
            }
            className="bg-slate-50 border border-slate-300 text-slate-900 font-semibold rounded-md px-2.5 py-1 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          >
            <option value="row_by_row_index">⚡ Tự động so sánh dòng theo dòng (Row-by-Row)</option>
            {availableKeys.map((k) => (
              <option key={k} value={k}>
                🔑 Theo cột: {k}
              </option>
            ))}
          </select>

          <button
            onClick={() => onSelectKey(selectedKey)}
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-md shadow-sm transition flex items-center space-x-1"
          >
            <span>Chạy Đối Soát</span>
          </button>
        </div>

        {/* Normalization Toggles */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold text-slate-700">Chuẩn Hóa Dữ Liệu:</span>
          </div>

          <label className="flex items-center space-x-1 cursor-pointer text-slate-700 hover:text-slate-900 font-medium">
            <input
              type="checkbox"
              checked={options.trimWhitespace}
              onChange={(e) => onOptionsChange({ ...options, trimWhitespace: e.target.checked })}
              className="rounded bg-white border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span>Xóa Khoảng Trắng Thừa</span>
          </label>

          <label className="flex items-center space-x-1 cursor-pointer text-slate-700 hover:text-slate-900 font-medium">
            <input
              type="checkbox"
              checked={options.ignoreCase}
              onChange={(e) => onOptionsChange({ ...options, ignoreCase: e.target.checked })}
              className="rounded bg-white border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span>Không Phân Biệt Hoa/Thường</span>
          </label>

          <label className="flex items-center space-x-1 cursor-pointer text-slate-700 hover:text-slate-900 font-medium">
            <input
              type="checkbox"
              checked={options.standardizeDates}
              onChange={(e) => onOptionsChange({ ...options, standardizeDates: e.target.checked })}
              className="rounded bg-white border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span>Chuẩn Hóa Ngày Tháng</span>
          </label>

          {/* Numeric Rounding Tolerance */}
          <div className="flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            <span className="text-slate-600 text-[11px] font-medium">Dung sai số:</span>
            <select
              value={options.numericTolerance}
              onChange={(e) =>
                onOptionsChange({ ...options, numericTolerance: Number(e.target.value) })
              }
              className="bg-transparent text-emerald-800 font-bold text-xs focus:outline-none"
            >
              <option value="0" className="bg-white text-slate-800">0 (Tuyệt đối)</option>
              <option value="0.01" className="bg-white text-slate-800">0.01</option>
              <option value="1" className="bg-white text-slate-800">1 VNĐ</option>
              <option value="1000" className="bg-white text-slate-800">1,000 VNĐ</option>
            </select>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Search Bar & Result Filter Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã, Tiền, Số hóa đơn, Nội dung..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-md pl-8 pr-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder-slate-400"
          />
        </div>

        {/* Filter Badges Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {/* Default recommended filter: Discrepancies Only */}
          <button
            onClick={() => onStatusFilterChange('discrepancies')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center ${
              statusFilter === 'discrepancies'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            <span>Chỉ Lệch & Thiếu ({discrepancyCount})</span>
          </button>

          <button
            onClick={() => onStatusFilterChange('mismatched')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
              statusFilter === 'mismatched'
                ? 'bg-amber-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-amber-800 border border-slate-200'
            }`}
          >
            <span>Lệch Cột ({mismatchedCount})</span>
          </button>

          <button
            onClick={() => onStatusFilterChange('orphan_a')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
              statusFilter === 'orphan_a'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-blue-800 border border-slate-200'
            }`}
          >
            <span>Thiếu B ({orphanACount})</span>
          </button>

          <button
            onClick={() => onStatusFilterChange('orphan_b')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
              statusFilter === 'orphan_b'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-rose-800 border border-slate-200'
            }`}
          >
            <span>Thiếu A ({orphanBCount})</span>
          </button>

          {taxAlertCount > 0 && (
            <button
              onClick={() => onStatusFilterChange('tax_alert')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                statusFilter === 'tax_alert'
                  ? 'bg-purple-700 text-white'
                  : 'bg-purple-50 text-purple-900 border border-purple-300 hover:bg-purple-100'
              }`}
            >
              <span>⚠️ Rủi Ro Thuế ({taxAlertCount})</span>
            </button>
          )}

          <button
            onClick={() => onStatusFilterChange('matched')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center ${
              statusFilter === 'matched'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-emerald-800 border border-slate-200'
            }`}
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            <span>Hiện Khớp ({matchedCount})</span>
          </button>

          <button
            onClick={() => onStatusFilterChange('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 mr-1" />
            <span>Tất Cả ({totalRows})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
