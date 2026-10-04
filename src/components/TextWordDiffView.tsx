import React from 'react';
import { diffTextClauses } from '../utils/diffEngine';
import { FileText, ArrowRight } from 'lucide-react';

interface TextWordDiffViewProps {
  textA: string;
  textB: string;
  fileAName: string;
  fileBName: string;
}

export const TextWordDiffView: React.FC<TextWordDiffViewProps> = ({
  textA,
  textB,
  fileAName,
  fileBName,
}) => {
  const clauseDiffs = diffTextClauses(textA, textB);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 my-3 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-emerald-700" />
          <h3 className="text-xs font-bold text-slate-800 uppercase">
            ĐỐI SOÁT CHI TIẾT ĐIỀU KHOẢN VĂN BẢN WORD / CONTRACT
          </h3>
        </div>
        <div className="flex items-center space-x-4 text-xs font-semibold">
          <span className="flex items-center text-rose-800">
            <span className="w-3 h-3 bg-rose-100 border border-rose-300 rounded mr-1"></span> Nội dung bị xóa (File A)
          </span>
          <span className="flex items-center text-emerald-800">
            <span className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded mr-1"></span> Nội dung mới / sửa (File B)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
          <p className="text-xs font-bold text-emerald-800 mb-1">FILE A: {fileAName}</p>
          <div className="text-xs font-mono text-slate-700 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {textA || '(Nội dung trống)'}
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
          <p className="text-xs font-bold text-blue-800 mb-1">FILE B: {fileBName}</p>
          <div className="text-xs font-mono text-slate-700 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {textB || '(Nội dung trống)'}
          </div>
        </div>
      </div>

      {/* MERGED INLINE DIFF VIEW */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
        <p className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center">
          <ArrowRight className="w-4 h-4 mr-1 text-emerald-700" />
          Kết quả So Sánh Từng Đoạn Văn / Điều Khoản:
        </p>
        <div className="text-sm leading-relaxed p-3 bg-white rounded border border-slate-300 text-slate-800 font-sans whitespace-pre-wrap">
          {clauseDiffs.map((part, idx) => {
            if (part.type === 'delete') {
              return (
                <span
                  key={idx}
                  className="bg-rose-100 text-rose-900 line-through px-1 rounded mx-0.5 border border-rose-300 font-medium"
                  title="Nội dung bị xóa / sửa ở File B"
                >
                  {part.value}
                </span>
              );
            }
            if (part.type === 'insert') {
              return (
                <span
                  key={idx}
                  className="bg-emerald-100 text-emerald-900 font-bold px-1 rounded mx-0.5 border border-emerald-300"
                  title="Nội dung mới thêm ở File B"
                >
                  {part.value}
                </span>
              );
            }
            return <span key={idx}>{part.value}</span>;
          })}
        </div>
      </div>
    </div>
  );
};
