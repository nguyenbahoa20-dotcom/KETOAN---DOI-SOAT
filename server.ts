import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "Phần Mềm Đối Soát Toàn Diện Kế Toán" });
  });

  // Gemini API route for AI Accounting & Tax Expert Analysis
  app.post("/api/gemini/analyze-diff", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "GEMINI_API_KEY chưa được cấu hình.",
          advice: "Hãy cấu hình GEMINI_API_KEY trong file .env hoặc tab Secrets để sử dụng tính năng phân tích tư vấn thuế AI."
        });
      }

      const { summaryStats, discrepanciesSample, fileAName, fileBName } = req.body;

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Bạn là Chuyên gia Kế toán - Thuế cấp cao (Senior Tax & Accounting Auditor) với hơn 10 năm kinh nghiệm xử lý hóa đơn, chứng từ và thanh kiểm tra thuế theo Luật Quản lý Thuế Việt Nam, Thông tư 78/2021/TT-BTC, Nghị định 123/2020/NĐ-CP.

Nhiệm vụ: Phân tích kết quả đối soát dữ liệu giữa 2 tài liệu sau và đưa ra nhận xét, cảnh báo rủi ro thuế/kế toán, cùng hướng xử lý cụ thể.

Tệp A (Gốc/Nội bộ): ${fileAName || "File A"}
Tệp B (Đối ứng/Cơ quan thuế/Ngân hàng): ${fileBName || "File B"}

Thống kê đối soát:
- Tổng số dòng kiểm tra: ${summaryStats?.total || 0}
- Khớp hoàn toàn: ${summaryStats?.matched || 0}
- Lệch chi tiết (Chênh lệch): ${summaryStats?.mismatched || 0}
- Chỉ có ở File A (Thiếu bên B): ${summaryStats?.orphanA || 0}
- Chỉ có ở File B (Thiếu bên A): ${summaryStats?.orphanB || 0}

Danh sách các dòng lệch/chênh lệch tiêu biểu (tối đa 10 dòng mẫu):
${JSON.stringify(discrepanciesSample || [], null, 2)}

Yêu cầu phản hồi (trình bày Markdown đẹp, chuyên nghiệp, rõ ràng):
1. **Tóm tắt rủi ro chính**: Đánh giá mức độ nghiêm trọng (Cao / Trung bình / Thấp) đối với các chênh lệch này.
2. **Phân tích chi tiết nguyên nhân tiềm ẩn**: (ví dụ: Lệch VAT 8% vs 10%, Lệch làm tròn tiền, Sai lệch MST do nhập liệu thủ công, Hóa đơn bỏ sót chưa kê khai, Sai lệch khớp kỳ kê khai thuế...).
3. **Khuyến nghị xử lý Kế toán & Thuế**: Các bước điều chỉnh chứng từ, kê khai bổ sung (KHBS), biên bản điều chỉnh/thay thế hóa đơn hoặc đối chiếu lại với đối tác/ngân hàng.
4. **Cột kiểm chứng & Ghi chú kiểm toán**: Hướng dẫn kế toán viên điền vào cột kiểm chứng để trình Kế toán trưởng/Cơ quan thuế.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({
        error: "Lỗi trong quá trình phân tích AI.",
        details: err?.message || String(err)
      });
    }
  });

  // Vite development mode vs production static
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Phần Mềm Đối Soát Kế Toán running on http://localhost:${PORT}`);
  });
}

startServer();
