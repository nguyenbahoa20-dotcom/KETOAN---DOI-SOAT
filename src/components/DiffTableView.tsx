import React, { useState, useMemo } from 'react';
import { RowDiffResult } from '../types';
import { CheckCircle2, AlertTriangle, HelpCircle, ShieldAlert, Edit2, Check } from 'lucide-react';

interface DiffTableViewProps {
  results: RowDiffResult[];
  onUpdateAuditNote: (id: string, note: string) => void;
}

export const DiffTableView: React.FC<DiffTableViewProps> = ({ results, onUpdateAuditNote }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');

  // Collect all unique columns, strictly excluding __EMPTY headers
  const columns = useMemo(() => {
    const colSet = new Set<string>();
    results.forEach((r) => {
      if (r.rowA) Object.keys(r.rowA).forEach((k) => colSet.add(k));
      if (r.rowB) Object.keys(r.rowB).forEach((k) => colSet.add(k));
    });
    return Array.from(colSet).filter((col) => !col.startsWith('__EMPTY'));
  }, [results]);

  if (results.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center my-3 shadow-sm">
        <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-800 font-bold text-sm">Không có dữ liệu chênh lệch theo bộ lọc hiện tại.</p>
        <p className="text-slate-500 text-xs mt-1">
          Tất cả dữ liệu có thể đang ở trạng thái <strong>"Khớp 100%"</strong>. Bấm nút <strong className="text-emerald-700">"Hiện Khớp"</strong> hoặc <strong className="text-slate-700">"Tất Cả"</strong> nếu bạn muốn xem toàn bộ dòng.
        </p>
      </div>
    );
  }

  const handleStartEdit = (item: RowDiffResult) => {
    setEditingId(item.id);
    setEditNoteText(item.auditVerificationNote);
  };

  const handleSaveEdit = (id: string) => {
    onUpdateAuditNote(id, editNoteText);
    setEditingId(null);
  };

  return (
    <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden my-3">
      {/* HEADER BAR */}
      <div className="p-2.5 bg-slate-100 border-b border-slate-300 flex items-center justify-between text-xs text-slate-700 font-medium">
        <div className="flex items-center space-x-2 font-bold text-slate-900">
          <span>BẢNG CHI TIẾT KẾT QUẢ ĐỐI SOÁT</span>
          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 font-semibold">
            {results.length} dòng
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-semibold">
          <span className="flex items-center text-red-700">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 mr-1"></span> Lệch Chi Tiết (Tô đỏ)
          </span>
          <span className="flex items-center text-blue-800">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1"></span> Thiếu ở B
          </span>
          <span className="flex items-center text-rose-800">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1"></span> Thiếu ở A
          </span>
          <span className="flex items-center text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1"></span> Khớp 100%
          </span>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[680px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wide sticky top-0 z-20 border-b border-slate-300 shadow-sm">
            <tr>
              <th className="p-2.5 border-r border-slate-300 w-10 text-center bg-slate-200/80">STT</th>
              <th className="p-2.5 border-r border-slate-300 min-w-[130px] bg-slate-200/80">Khóa Đối Soát</th>
              <th className="p-2.5 border-r border-slate-300 w-32 text-center bg-slate-200/80">Trạng Thái</th>
              
              {/* CỘT KIỂM CHỨNG / AUDIT TRACK FORMAT */}
              <th className="p-2.5 border-r border-slate-300 min-w-[240px] bg-amber-100/90 text-amber-900 font-bold">
                Chi Tiết Lỗi (Audit Track)
              </th>

              {/* DYNAMIC DATA COLUMNS */}
              {columns.map((col) => (
                <th key={col} className="p-2.5 border-r border-slate-300 min-w-[140px] whitespace-nowrap bg-slate-100 text-slate-800 font-bold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-slate-800 font-medium">
            {results.map((item, idx) => {
              const statusStyle = getStatusRowStyle(item.status);
              const formattedNote = getConciseAuditNote(item);

              return (
                <tr key={item.id} className={`hover:bg-slate-50 transition ${statusStyle.rowBg}`}>
                  {/* STT */}
                  <td className="p-2.5 border-r border-slate-200 text-center font-mono text-slate-500">
                    {idx + 1}
                  </td>

                  {/* KEY VAL */}
                  <td className="p-2.5 border-r border-slate-200 font-bold text-slate-900 whitespace-nowrap">
                    <div>{item.keyVal}</div>
                    {item.taxAlert && (
                      <div className="mt-0.5 inline-flex items-center text-[10px] font-bold text-purple-900 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-300">
                        <ShieldAlert className="w-3 h-3 mr-1 text-purple-700" />
                        {item.taxAlert}
                      </div>
                    )}
                  </td>

                  {/* STATUS BADGE */}
                  <td className="p-2.5 border-r border-slate-200 text-center whitespace-nowrap">
                    <StatusBadge status={item.status} />
                  </td>

                  {/* CỘT KIỂM CHỨNG */}
                  <td className="p-2.5 border-r border-slate-200 bg-slate-50/80 font-mono text-[11px]">
                    {editingId === item.id ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={editNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          className="bg-white border border-blue-500 text-slate-900 rounded px-2 py-0.5 text-xs w-full focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="p-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="group flex items-center justify-between space-x-2">
                        <span className="text-slate-800 font-semibold leading-tight">
                          {formattedNote}
                        </span>
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition"
                          title="Sửa ghi chú"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* CELL DATA COLUMNS */}
                  {columns.map((col) => {
                    const cellDiff = item.cellDiffs?.[col];
                    const valA = item.rowA?.[col];
                    const valB = item.rowB?.[col];

                    // Orphan A (Missing in B): Data present in A shown in gray text (text-slate-500)
                    if (item.status === 'orphan_a') {
                      const displayVal = formatValueDisplay(valA);
                      return (
                        <td key={col} className="p-2.5 border-r border-slate-200 text-slate-500 font-medium whitespace-nowrap">
                          {displayVal}
                        </td>
                      );
                    }

                    // Orphan B (Missing in A): Data present in B shown in gray text (text-slate-500)
                    if (item.status === 'orphan_b') {
                      const displayVal = formatValueDisplay(valB);
                      return (
                        <td key={col} className="p-2.5 border-r border-slate-200 text-slate-500 font-medium whitespace-nowrap">
                          {displayVal}
                        </td>
                      );
                    }

                    // Mismatched Cell: Highlight in Bold Red (text-red-600 font-bold), format: <Giá File Gốc> -> <Giá File Đối Chiếu>
                    if (cellDiff && cellDiff.isDiff) {
                      const displayA = formatValueDisplay(cellDiff.valA);
                      const displayB = formatValueDisplay(cellDiff.valB);
                      return (
                        <td
                          key={col}
                          className="p-2.5 border-r border-slate-200 bg-red-50 text-red-600 font-bold text-xs whitespace-nowrap font-mono"
                        >
                          {displayA} -&gt; {displayB}
                        </td>
                      );
                    }

                    // Matched Cell: Print normal value (black text)
                    const valDisplay = formatValueDisplay(valA !== undefined && valA !== '' ? valA : valB);
                    return (
                      <td key={col} className="p-2.5 border-r border-slate-200 text-slate-900 whitespace-nowrap">
                        {valDisplay}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function getConciseAuditNote(item: RowDiffResult): string {
  if (item.status === 'orphan_a') return 'Thiếu ở File B';
  if (item.status === 'orphan_b') return 'Thiếu ở File A';
  if (item.status === 'matched') return 'Khớp 100%';

  if (item.cellDiffs) {
    const diffParts: string[] = [];
    Object.keys(item.cellDiffs).forEach((col) => {
      if (!col.startsWith('__EMPTY') && item.cellDiffs![col].isDiff) {
        const vA = formatValueDisplay(item.cellDiffs![col].valA);
        const vB = formatValueDisplay(item.cellDiffs![col].valB);
        diffParts.push(`${col}: ${vA} -> ${vB}`);
      }
    });
    if (diffParts.length > 0) return diffParts.join('; ');
  }

  return item.auditVerificationNote.replace(/^Sai lệch chi tiết ở các cột:\s*/i, '');
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'matched':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-700" /> Khớp 100%
        </span>
      );
    case 'mismatched':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
          <AlertTriangle className="w-3 h-3 mr-1 text-red-700" /> Lệch Chi Tiết
        </span>
      );
    case 'orphan_a':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
          Thiếu ở File B
        </span>
      );
    case 'orphan_b':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
          Thiếu ở File A
        </span>
      );
    default:
      return null;
  }
}

function getStatusRowStyle(status: string) {
  switch (status) {
    case 'mismatched':
      return { rowBg: 'bg-red-50/30' };
    case 'orphan_a':
      return { rowBg: 'bg-blue-50/40' };
    case 'orphan_b':
      return { rowBg: 'bg-rose-50/40' };
    default:
      return { rowBg: '' };
  }
}

function formatValueDisplay(val: any): string {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'number') {
    return new Intl.NumberFormat('vi-VN').format(val);
  }
  return String(val);
}
