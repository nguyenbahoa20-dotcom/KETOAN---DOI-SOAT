# Phần mềm đối soát kế toán

Ứng dụng chạy trên trình duyệt để so sánh hai bộ chứng từ và xuất kết quả đối soát Excel. Dữ liệu tệp được đọc trong trình duyệt; chỉ khi người dùng chọn gửi mẫu phân tích AI thì tên tệp, thống kê và tối đa 10 dòng sai lệch mới được gửi đến Gemini.

## Định dạng được hỗ trợ

- Excel: `.xlsx`, `.xls`
- CSV: `.csv`
- Hóa đơn XML: `.xml`
- Word: `.docx`
- Văn bản thuần: `.txt`

Tệp PDF và Word `.doc` chưa được hỗ trợ.

## Chạy ứng dụng

Yêu cầu Node.js tương thích với Vite 6.

```sh
npm install
npm run dev
``

Mở `http://localhost:3000`. Có thể dùng các bộ dữ liệu mẫu mà không cần khóa AI.

## Phân tích bằng Gemini

Đặt `GEMINI_API_KEY` trong biến môi trường hoặc tệp `.env` ở thư mục dự án. Không đưa khóa thật vào Git. Báo cáo quy tắc ngoại tuyến hoạt động mà không cần gửi dữ liệu ra ngoài.

## Build và chạy production

```sh
npm run build
npm start
``

Mặc định máy chủ dùng cổng `3000`; có thể đổi bằng biến môi trường `PORT`.
