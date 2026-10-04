import React, { useState, useEffect } from 'react';
import { DiffSummary, RowDiffResult } from '../types';
import { Sparkles, X, ShieldAlert, RefreshCw } from 'lucide-react';

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
    if (isOpen) {
      setAnalysisText('');
      setErrorMsg(null);
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
        setErrorMsg(data.error || 'Không thể hoàn thành phân tích AI.');
      }
    } catch {
      setErrorMsg('Không thể kết nối dịch vụ AI. Bạn có thể tạo báo cáo quy tắc ngay trên thiết bị.');
    } finally {
      setLoading(false);
    }
  };

  const generateOfflineAnalysis = (sum: DiffSummary, sample: any[]) => {
    const report = `### BÁO CÁO SÀNG LỌC ĐỐI SOÁT (TẠO NGOẠI TUYẾN)

**Tài liệu đối soát:** ${fileAName} ↔ ${fileBName}

---

#### 1. ⚠️ Tóm Tắt Mức Độ Rủi Ro
- **Tổng số dòng kiểm tra:** ${sum.totalRows}
- **Tỷ lệ trùng khớp:** ${sum.totalRows > 0 ? Math.round((sum.matchedCount / sum.totalRows) * 100) : 0}% (${sum.matchedCount} bản ghi)
- **Số dòng chênh lệch / sai lệch:** ${sum.mismatchedCount} bản ghi
- **Số chứng từ bỏ sót / lệch bên:** ${sum.orphanACount + sum.orphanBCount} bản ghi
- **Tổng chênh lệch giá trị tài chính:** ${new Intl.NumberFormat('vi-VN').format(sum.totalAmountDiff)} VNĐ

#### 2. Dữ liệu cần kiểm tra
${sample.length ? sample.map((item, index) => `${index + 1}. ${item.keyVal}: ${item.auditNote || item.status}${item.taxAlert ? ` — ${item.taxAlert}` : ''}`).join('\n') : 'Không có dòng sai lệch trong mẫu gửi phân tích.'}

#### 3. Bước kiểm tra tiếp theo
- Đối chiếu chứng từ gốc và xác nhận nguyên nhân từng chênh lệch với bên liên quan.
- Ghi kết quả xác minh và chứng từ xử lý vào cột kiểm chứng.
- Chuyển vấn đề có thể ảnh hưởng kê khai cho kế toán trưởng hoặc chuyên gia thuế kiểm tra theo quy định hiện hành.

Đây là báo cáo sàng lọc dựa trên dữ liệu đã đối soát, không phải kết luận pháp lý hay tư vấn thuế.`;

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
                Phân tích tham khảo dựa trên dữ liệu đối soát
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
          ) : analysisText ? (
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 font-sans whitespace-pre-wrap">
              {analysisText}
            </div>
          ) : (
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <p>Dữ liệu kế toán có thể chứa thông tin nhạy cảm. Chỉ tiếp tục nếu bạn được phép chia sẻ dữ liệu này.</p>
              <p>Nếu chọn AI, tên hai tệp, thống kê đối soát và tối đa 10 dòng sai lệch (bao gồm giá trị từng ô) sẽ được gửi đến Google Gemini.</p>
              {errorMsg && <p role="alert" className="text-rose-300">{errorMsg}</p>}
              <div className="flex flex-wrap gap-2">
                <button onClick={runAnalysis} className="px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg font-semibold">Gửi mẫu đến Gemini để phân tích</button>
                <button onClick={() => generateOfflineAnalysis(summary, results.filter((r) => r.status !== 'matched' || r.taxAlert).slice(0, 10).map((r) => ({ keyVal: r.keyVal, auditNote: r.auditVerificationNote, status: r.status, taxAlert: r.taxAlert })))} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold">Tạo báo cáo ngoại tuyến</button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            <span>Kết quả chỉ mang tính tham khảo; cần xác minh trước khi xử lý nghiệp vụ</span>
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

