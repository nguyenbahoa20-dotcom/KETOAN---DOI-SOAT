import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Code2,
  Sparkles,
  Download,
  RotateCcw,
  FileCheck,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  onSelectPreset: (presetId: string) => void;
  onOpenPythonCode: () => void;
  onOpenAiAnalysis: () => void;
  onExportExcel: () => void;
  onReset: () => void;
  hasData: boolean;
  selectedPresetId?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSelectPreset,
  onOpenPythonCode,
  onOpenAiAnalysis,
  onExportExcel,
  onReset,
  hasData,
}) => {
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const selectPreset = (presetId: string) => {
    onSelectPreset(presetId);
    setIsPresetMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-md bg-emerald-700 flex items-center justify-center text-white shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Đối Soát Kế Toán
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-700" /> Standard Excel
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Hệ thống kiểm tra & đối chiếu chứng từ thuế, sổ cái, hóa đơn
              </p>
            </div>
          </div>

          {/* Quick Preset Selector & Actions */}
          <div className="flex items-center space-x-2">
            {/* Sample Dataset Button Dropdown */}
            <div className="relative group">
              <button
                id="preset-sample-btn"
                aria-expanded={isPresetMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsPresetMenuOpen((open) => !open)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-300 transition"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Nạp Mẫu Chứng Từ</span>
              </button>
              <div role="menu" className={`absolute right-0 mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-50 ${isPresetMenuOpen ? 'block' : 'hidden'}`}>
                <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Chọn kịch bản mẫu:
                </div>
                <button
                  onClick={() => selectPreset('xml_vs_excel_vat')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 text-xs text-slate-800 flex items-start space-x-2"
                >
                  <FileCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-emerald-800">1. Hóa đơn XML vs Bảng kê VAT Excel</div>
                    <div className="text-[11px] text-slate-500">Lệch VAT 8% vs 10%, sai MST, bỏ sót hóa đơn</div>
                  </div>
                </button>

                <button
                  onClick={() => selectPreset('bank_recon_vcb')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 text-xs text-slate-800 flex items-start space-x-2 mt-1"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-blue-800">2. Sổ Cái TK 112 vs Sao Kê Ngân Hàng</div>
                    <div className="text-[11px] text-slate-500">Chênh lệch dòng tiền, phí duy trì tài khoản</div>
                  </div>
                </button>

                <button
                  onClick={() => selectPreset('contract_word_diff')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 text-xs text-slate-800 flex items-start space-x-2 mt-1"
                >
                  <FileCheck className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-purple-800">3. Hợp Đồng Word v1 vs Word v2</div>
                    <div className="text-[11px] text-slate-500">So sánh điều khoản, lịch phạt & thanh toán</div>
                  </div>
                </button>

                <button
                  onClick={() => selectPreset('salary_excel_diff')}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 text-xs text-slate-800 flex items-start space-x-2 mt-1"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-amber-800">4. Bảng Lương Excel Tháng 6 vs Tháng 7</div>
                    <div className="text-[11px] text-slate-500">Biến động lương cơ bản, phụ cấp, BHXH</div>
                  </div>
                </button>
              </div>
            </div>

            {/* AI Advisor Button */}
            <button
              id="ai-tax-advisor-btn"
              onClick={onOpenAiAnalysis}
              disabled={!hasData}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition shadow-sm ${
                hasData
                  ? 'bg-purple-700 hover:bg-purple-800 text-white'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              <span>Tư Vấn Thuế AI</span>
            </button>

            {/* Export Excel Report Button */}
            <button
              id="export-excel-btn"
              onClick={onExportExcel}
              disabled={!hasData}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition shadow-sm ${
                hasData
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Báo Cáo Excel</span>
            </button>

            {/* Python Desktop Code Button */}
            <button
              id="python-code-btn"
              onClick={onOpenPythonCode}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold transition"
              title="Mã nguồn Python Offline 100%"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">Code Python</span>
            </button>

            {/* Reset Button */}
            {hasData && (
              <button
                id="reset-diff-btn"
                onClick={onReset}
                className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition"
                title="Làm mới đối soát"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

