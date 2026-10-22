# Đưa Myka Care Companion lên điện thoại

## Deploy frontend bằng Cloudflare Pages

Frontend là ứng dụng tĩnh HTML/CSS/JavaScript. Trong Cloudflare Pages, nối tài khoản GitHub rồi chọn repository `robot-tam-su-demo`; đặt production branch là `main`, để trống **Build command**, đặt **Build output directory** là `/` (thư mục gốc). Sau khi deploy, Cloudflare cấp URL HTTPS `*.pages.dev`; mở URL trên điện thoại và chọn **Thêm vào màn hình chính**.

Git integration tự tạo deployment khi có push; branch khác có URL preview. Tài liệu: https://developers.cloudflare.com/pages/get-started/git-integration/.

## Giới hạn bản public hiện tại

- Tài khoản demo: `nguoithan@demo.com` / `123456`.
- Giao diện dùng dữ liệu mẫu khi không có API. Agent demo hiện xử lý theo quy tắc/ngưỡng, không tư vấn hay chẩn đoán.
- Inbox mô phỏng đã được bỏ. Tư vấn chỉ mở nhóm Telegram chung đã cấu hình.
- Màn hình Wi-Fi/Bluetooth hiện chỉ mô phỏng thao tác qua API; chưa kết nối phần cứng thật.
- Backend hiện ở thư mục riêng `robot-myka-backend`, dùng SQLite và chưa có xác thực server-side. Cloudflare Pages chỉ deploy frontend; không đặt mật khẩu Wi-Fi hoặc dữ liệu người bệnh thật trong bản public.

Muốn Agent, dữ liệu lưu bền vững và API thiết bị chạy từ điện thoại, cần deploy FastAPI riêng, chuyển SQLite sang PostgreSQL, cấu hình CORS và xác thực/ủy quyền API trước khi đưa backend lên Internet. Chỉ đặt URL API công khai trong `api-config.js`; database URL và service key không được đưa vào frontend.
