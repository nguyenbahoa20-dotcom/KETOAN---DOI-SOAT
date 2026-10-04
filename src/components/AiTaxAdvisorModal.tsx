import React, { useState, useEffect } from 'react';
import { DiffSummary, RowDiffResult } from '../types';
import { Sparkles, X, ShieldAlert, FileText, CheckCircle, RefreshCw } from 'lucide-react';

interface AiTaxAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: DiffSummary;
  results: RowDiffResult[];
  fileAName: string;
  fileBName: string;
}

export const AiTaxAdvisorModal: React.FC<AiTaxAdvisorModalProps> = ({
  isOpen,
  onClose,
  summary,
  results,
  fileAName,
  fileBName,
}) => {
  const [analysisText, setAnalysisText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !analysisText) {
      runAnalysis();
    }
  }, [isOpen]);

  const runAnalysis = async () => {
    setLoading(true);
    setErrorMsg(null);

    // Pick top 10 discrepancy sample
    const discrepanciesSample = results
      .filter((r) => r.status !== 'matched' || r.taxAlert)
      .slice(0, 10)
      .map((r) => ({
        keyVal: r.keyVal,
        status: r.status,
        auditNote: r.auditVerificationNote,
        taxAlert: r.taxAlert,
        rowA: r.rowA,
        rowB: r.rowB,
      }));

    try {
      const resp = await fetch('/api/gemini/analyze-diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summaryStats: summary,
          discrepanciesSample,
          fileAName,
          fileBName,
        }),
      });

      const data = await resp.json();

      if (resp.ok && data.analysis) {
        setAnalysisText(data.analysis);
      } else {
        // Fallback offline expert rules
        generateOfflineAnalysis(summary, discrepanciesSample);
      }
    } catch (err) {
      // Fallback offline expert rules
      generateOfflineAnalysis(summary, discrepanciesSample);
    } finally {
      setLoading(false);
    }
  };

  const generateOfflineAnalysis = (sum: DiffSummary, sample: any[]) => {
    const report = `### 📋 BÁO CÁO PHÂN TÍCH VÀ KHUYẾN NGHỊ RỦI RO THUẾ & KẾ TOÁN (OFFLINE SPECIALIST)

**Chuyên gia:** Kế toán trưởng & Đội ngũ Kiểm toán Thuế
**Tài liệu đối soát:** ${fileAName} ↔ ${fileBName}

---

#### 1. ⚠️ Tóm Tắt Mức Độ Rủi Ro
- **Tổng số dòng kiểm tra:** ${sum.totalRows}
- **Tỷ lệ trùng khớp:** ${sum.totalRows > 0 ? Math.round((sum.matchedCount / sum.totalRows) * 100) : 0}% (${sum.matchedCount} bản ghi)
- **Số dòng chênh lệch / sai lệch:** ${sum.mismatchedCount} bản ghi
- **Số chứng từ bỏ sót / lệch bên:** ${sum.orphanACount + sum.orphanBCount} bản ghi
- **Tổng chênh lệch giá trị tài chính:** ${new Intl.NumberFormat('vi-VN').format(sum.totalAmountDiff)} VNĐ

#### 2. 🔍 Phân Tích Nguyên Nhân Sai Lệch Tiêu Biểu
1. **Rủi ro Thuế suất VAT (8% vs 10%):** Do áp dụng Nghị định giảm thuế GTGT giữa các mặt hàng/kỳ kê khai.
2. **Lệch Mã Số Thuế (MST):** Nhập liệu thủ công dẫn tới sai định dạng MST của người bán/người mua.
3. **Lệch tiền do làm tròn số:** Chênh lệch vài đồng lẻ giữa XML Tổng cục Thuế và phần mềm MISA/FAST/Excel.
4. **Chứng từ phát sinh thiếu đối ứng:** Hóa đơn đã xuất nhưng đối tác chưa kê khai hoặc ngược lại.

#### 3. 📝 Hướng Dẫn Kế Toán Xử Lý Chi Tiết (Thông tư 78/2021 & Nghị định 123/2020)
- **Bước 1:** Đối với các dòng lệch VAT hoặc Mã số thuế, thực hiện lập **Biên bản điều chỉnh hóa đơn** hoặc hóa đơn thay thế.
- **Bước 2:** Lập tờ khai bổ sung **KHBS (Thuế GTGT/TNDN)** nếu sai lệch dẫn đến thiếu số thuế phải nộp.
- **Bước 3:** Cập nhật kết quả xử lý vào **Cột kiểm chứng** trên bảng đối soát để trình Kế toán trưởng phê duyệt.`;

    setAnalysisText(report);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Tư Vấn Rủi Ro Thuế & Kế Toán Chi Tiết (AI Auditor)
              </h2>
              <p className="text-xs text-slate-400">
                Phân tích theo Thông tư 78/2021/TT-BTC, Nghị định 123/2020/NĐ-CP & Luật Quản lý Thuế
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-200 text-xs leading-relaxed space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-purple-400">
              <RefreshCw className="w-10 h-10 animate-spin mb-3" />
              <p className="font-semibold text-sm">Đang quét rủi ro & tổng hợp khuyến nghị kế toán...</p>
            </div>
          ) : (
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 font-sans whitespace-pre-wrap">
              {analysisText}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            <span>Phân tích độc lập dựa trên luật thuế & báo cáo đối soát</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            Đóng Báo Cáo
          </button>
        </div>
      </div>
    </div>
  );
};
