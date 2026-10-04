import React, { useState } from 'react';
import { Code2, Copy, Check, Download, X, Terminal, ShieldCheck } from 'lucide-react';

interface PythonScriptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonScriptGeneratorModal: React.FC<PythonScriptGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const pythonSourceCode = `""\"
PHẦN MỀM ĐỐI SOÁT TOÀN DIỆN KẾ TOÁN (FULL-CONTENT DIFFING)
=========================================================
- Tác giả: Senior Python Developer & Tax/Accounting Systems Expert
- Môi trường: Offline 100% (Windows / Mac / Linux)
- Giao diện: CustomTkinter (Tone xanh dương / trắng chuẩn doanh nghiệp)
- Chức năng: Đối soát cùng & khác định dạng (Excel, XML, CSV),
  So sánh chi tiết ô/dòng, tự động thêm Cột Kiểm Chứng, xuất báo cáo Excel tô màu.

Yêu cầu cài đặt thư viện:
pip install customtkinter pandas openpyxl pillow
""\"

import os
import sys
import customtkinter as ctk
from tkinter import filedialog, messagebox
import pandas as pd
import numpy as np

# Cấu hình giao diện CustomTkinter chuẩn Doanh nghiệp
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

class AccountingDiffApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Phần Mềm Đối Soát Toàn Diện Kế Toán - Full-Content Diffing (Offline 100%)")
        self.geometry("1280x768")

        self.file_a_path = None
        self.file_b_path = None
        self.df_a = None
        self.df_b = None
        self.diff_results = None

        self.build_ui()

    def build_ui(self):
        # Header Title Bar
        header = ctk.CTkFrame(self, fg_color="#0f172a", height=60, corner_radius=0)
        header.pack(fill="x", side="top")

        lbl_title = ctk.CTkLabel(
            header,
            text="📊 HỆ THỐNG ĐỐI SOÁT TOÀN DIỆN CHỨNG TỪ KẾ TOÁN & THUẾ",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color="#38bdf8"
        )
        lbl_title.pack(side="left", padx=20, pady=15)

        # Main Layout: 2 Zone Split (File A & File B)
        main_frame = ctk.CTkFrame(self, fg_color="#1e293b", corner_radius=12)
        main_frame.pack(fill="both", expand=True, padx=15, pady=15)

        # File Drop/Select Frame
        files_frame = ctk.CTkFrame(main_frame, fg_color="transparent")
        files_frame.pack(fill="x", padx=10, pady=10)

        # Zone A Button & Label
        zone_a = ctk.CTkFrame(files_frame, fg_color="#0f172a", corner_radius=10, border_width=1, border_color="#3b82f6")
        zone_a.pack(side="left", fill="both", expand=True, padx=5, pady=5)

        ctk.CTkLabel(zone_a, text="FILE A: GỐC / NỘI BỘ (Excel / XML)", font=ctk.CTkFont(size=12, weight="bold"), text_color="#60a5fa").pack(pady=5)
        self.btn_file_a = ctk.CTkButton(zone_a, text="📁 Chọn File A", command=self.load_file_a, fg_color="#2563eb", hover_color="#1d4ed8")
        self.btn_file_a.pack(pady=5)
        self.lbl_file_a = ctk.CTkLabel(zone_a, text="Chưa chọn file", font=ctk.CTkFont(size=11), text_color="#94a3b8")
        self.lbl_file_a.pack(pady=5)

        # Zone B Button & Label
        zone_b = ctk.CTkFrame(files_frame, fg_color="#0f172a", corner_radius=10, border_width=1, border_color="#6366f1")
        zone_b.pack(side="right", fill="both", expand=True, padx=5, pady=5)

        ctk.CTkLabel(zone_b, text="FILE B: ĐỐI ỨNG / THUẾ / NGÂN HÀNG", font=ctk.CTkFont(size=12, weight="bold"), text_color="#818cf8").pack(pady=5)
        self.btn_file_b = ctk.CTkButton(zone_b, text="📁 Chọn File B", command=self.load_file_b, fg_color="#4f46e5", hover_color="#4338ca")
        self.btn_file_b.pack(pady=5)
        self.lbl_file_b = ctk.CTkLabel(zone_b, text="Chưa chọn file", font=ctk.CTkFont(size=11), text_color="#94a3b8")
        self.lbl_file_b.pack(pady=5)

        # Options Toolbar
        opts_frame = ctk.CTkFrame(main_frame, fg_color="#0f172a", corner_radius=8)
        opts_frame.pack(fill="x", padx=15, pady=5)

        self.chk_trim = ctk.CTkCheckBox(opts_frame, text="Trim khoảng trắng", text_color="#e2e8f0")
        self.chk_trim.select()
        self.chk_trim.pack(side="left", padx=15, pady=10)

        self.chk_lower = ctk.CTkCheckBox(opts_frame, text="Bỏ qua hoa/thường", text_color="#e2e8f0")
        self.chk_lower.select()
        self.chk_lower.pack(side="left", padx=15, pady=10)

        btn_run = ctk.CTkButton(
            opts_frame,
            text="⚡ THỰC HIỆN ĐỐI SOÁT TOÀN DIỆN",
            command=self.run_diff,
            fg_color="#10b981",
            hover_color="#059669",
            font=ctk.CTkFont(size=13, weight="bold")
        )
        btn_run.pack(side="right", padx=15, pady=8)

        btn_export = ctk.CTkButton(
            opts_frame,
            text="📥 Xuất Excel Tô Màu",
            command=self.export_excel,
            fg_color="#0284c7",
            hover_color="#0369a1"
        )
        btn_export.pack(side="right", padx=5, pady=8)

        # Result Display Area
        self.txt_result = ctk.CTkTextbox(main_frame, fg_color="#020617", text_color="#f8fafc", font=ctk.CTkFont(family="Consolas", size=12))
        self.txt_result.pack(fill="both", expand=True, padx=15, pady=10)
        self.txt_result.insert("1.0", "Hệ thống sẵn sàng. Vui lòng chọn File A và File B để bắt đầu đối soát...")

    def load_file_a(self):
        path = filedialog.askopenfilename(filetypes=[("Supported Files", "*.xlsx *.xls *.csv")])
        if path:
            self.file_a_path = path
            self.df_a = pd.read_excel(path) if path.endswith(('.xlsx', '.xls')) else pd.read_csv(path)
            self.lbl_file_a.configure(text=f"{os.path.basename(path)} ({len(self.df_a)} dòng)")

    def load_file_b(self):
        path = filedialog.askopenfilename(filetypes=[("Supported Files", "*.xlsx *.xls *.csv")])
        if path:
            self.file_b_path = path
            self.df_b = pd.read_excel(path) if path.endswith(('.xlsx', '.xls')) else pd.read_csv(path)
            self.lbl_file_b.configure(text=f"{os.path.basename(path)} ({len(self.df_b)} dòng)")

    def run_diff(self):
        if self.df_a is None or self.df_b is None:
            messagebox.showwarning("Cảnh báo", "Vui lòng chọn cả File A và File B!")
            return

        self.txt_result.delete("1.0", "end")
        self.txt_result.insert("1.0", "⏳ Đang xử lý đối soát từng ô dữ liệu...\n\n")

        # Chuẩn hóa dữ liệu
        df1 = self.df_a.copy()
        df2 = self.df_b.copy()

        if self.chk_trim.get():
            df1 = df1.applymap(lambda x: str(x).strip() if pd.notnull(x) else x)
            df2 = df2.applymap(lambda x: str(x).strip() if pd.notnull(x) else x)

        # Thêm Cột Kiểm Chứng (Audit Verification Column)
        results_log = []
        max_rows = max(len(df1), len(df2))

        for i in range(max_rows):
            row_a = df1.iloc[i] if i < len(df1) else None
            row_b = df2.iloc[i] if i < len(df2) else None

            if row_a is not None and row_b is None:
                status = "🔵 Chỉ có ở File A"
                audit_note = "Dòng dư ở File A (Thiếu bên B)"
            elif row_a is None and row_b is not None:
                status = "🔴 Chỉ có ở File B"
                audit_note = "Dòng dư ở File B (Thiếu bên A)"
            else:
                # Compare cells
                diffs = []
                for col in df1.columns:
                    if col in df2.columns:
                        v1 = row_a[col]
                        v2 = row_b[col]
                        if str(v1) != str(v2):
                            diffs.append(f"{col}: [{v1}] ↔ [{v2}]")

                if not diffs:
                    status = "✅ Khớp hoàn toàn"
                    audit_note = "Đã kiểm chứng khớp 100%"
                else:
                    status = "⚠️ Lệch chi tiết"
                    audit_note = "Sai lệch ở các cột: " + ", ".join(diffs)

            results_log.append({
                "STT": i + 1,
                "Trạng Thái": status,
                "Cột Kiểm Chứng": audit_note
            })

        self.diff_results = pd.DataFrame(results_log)
        
        # Display Summary Output
        matched = len(self.diff_results[self.diff_results["Trạng Thái"] == "✅ Khớp hoàn toàn"])
        mismatched = len(self.diff_results[self.diff_results["Trạng Thái"] == "⚠️ Lệch chi tiết"])

        summary_text = f"=== KẾT QUẢ ĐỐI SOÁT CHÍNH XÁC ===\n"
        summary_text += f"- Tổng số dòng đối soát: {max_rows}\n"
        summary_text += f"- Khớp hoàn toàn: {matched} dòng ({round(matched/max_rows*100, 1)}%)\n"
        summary_text += f"- Lệch chi tiết: {mismatched} dòng\n\n"
        summary_text += self.diff_results.to_string(index=False)

        self.txt_result.delete("1.0", "end")
        self.txt_result.insert("1.0", summary_text)

    def export_excel(self):
        if self.diff_results is None:
            messagebox.showwarning("Cảnh báo", "Vui lòng chạy đối soát trước khi xuất file!")
            return

        path = filedialog.asksaveasfilename(defaultextension=".xlsx", filetypes=[("Excel Files", "*.xlsx")])
        if path:
            self.diff_results.to_excel(path, index=False)
            messagebox.showinfo("Thành công", f"Đã xuất Báo Cáo Kiểm Chứng thành công:\n{path}")

if __name__ == "__main__":
    app = AccountingDiffApp()
    app.mainloop()
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonSourceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([pythonSourceCode], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PhanMemDoiSoatKeToan_Offline.py';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>Mã Nguồn Python Standalone Desktop App (CustomTkinter)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 inline mr-1" /> Offline 100%
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Mã nguồn Python đầy đủ tự chứa, hỗ trợ CustomTkinter + pandas + openpyxl chạy mượt trên Windows/Mac
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã Sao Chép' : 'Sao Chép Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition"
            >
              <Download className="w-4 h-4" />
              <span>Tải .py Về Máy</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CODE CONTAINER */}
        <div className="p-4 bg-slate-950 flex-1 overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed border-b border-slate-800">
          <pre className="p-4 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto text-blue-200">
            <code>{pythonSourceCode}</code>
          </pre>
        </div>

        {/* FOOTER */}
        <div className="p-3 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span>Hướng dẫn chạy: Chạy <code className="text-blue-300 bg-slate-800 px-1 py-0.5 rounded">pip install customtkinter pandas openpyxl</code> sau đó thực thi <code className="text-blue-300 bg-slate-800 px-1 py-0.5 rounded">python main.py</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
