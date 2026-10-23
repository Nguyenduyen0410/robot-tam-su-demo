# Deploy Myka Care Companion lên Cloudflare

## Thành phần demo

- Frontend tĩnh được phục vụ bởi Cloudflare Pages.
- API nằm trong `functions/api/[[path]].js` và chạy bằng Pages Functions.
- Dữ liệu demo lưu trong Cloudflare D1, binding có tên `MYKA_DB`.
- `migrations/0001_myka_demo.sql` tạo schema và dữ liệu tổng hợp giả; `0002_family_preferences.sql` bổ sung cài đặt người thân; `0003_conversation_logs.sql` tạo nhật ký hội thoại.
- Push lên nhánh `main` sẽ kích hoạt Pages Git integration tự build và deploy.

## Cấu hình D1

Trong Cloudflare Pages → Settings → Functions → Bindings, tạo binding loại **D1 database**, tên biến `MYKA_DB`, chọn database `myka-care-db` cho môi trường Production. Với database mới, chạy migration bằng D1 Console:

```sh
wrangler d1 execute myka-care-db --remote --file=migrations/0001_myka_demo.sql
wrangler d1 execute myka-care-db --remote --file=migrations/0002_family_preferences.sql
wrangler d1 execute myka-care-db --remote --file=migrations/0003_conversation_logs.sql
```

Sau khi thêm binding, cần có một deployment mới để Function nhận binding.

## Phạm vi Agent

Agent demo chạy theo luồng nhận phép đo → áp dụng ngưỡng cấu hình → lưu vào D1 → tạo cảnh báo khi vượt ngưỡng → cung cấp trạng thái cho người thân. Đây là xử lý theo quy tắc, không phải mô hình chẩn đoán hoặc tư vấn. App không có hội thoại sức khỏe hay chat riêng bác sĩ–người thân; trao đổi tư vấn dùng nhóm Telegram chung đã được cấu hình.

Các thao tác Wi-Fi/Bluetooth và ghi phép đo hiện chỉ mô phỏng dữ liệu qua API; chưa kết nối thiết bị thật. Trang Telegram sẽ chỉ mở nhóm khi có URL nhóm được cấu hình.

## Cài đặt người thân

`GET/PUT /api/family/settings/{elder_id}` lưu lựa chọn Không làm phiền (2 giờ, 5 giờ hoặc đến khi bật lại), kiểu giọng và tên robot tùy chọn. Đây là cấu hình hồ sơ demo: app chưa có push notification để tắt rung/âm thanh thực tế; giọng và tên chỉ được áp dụng khi tích hợp phần cứng.

`GET /api/family/conversation-history/{elder_id}?date=YYYY-MM-DD` trả nhật ký chỉ đọc. Bản demo tự tạo một số tin nhắn tổng hợp cho hồ sơ E001; chưa nhận lịch sử từ Telegram hoặc robot.

## Dùng thử và giới hạn

- Tài khoản giao diện demo: `nguoithan@demo.com` / `123456`.
- Dữ liệu trong migration là dữ liệu tổng hợp giả, không phải hồ sơ bệnh nhân.
- Demo hiện chưa có xác thực/ủy quyền server-side; đăng nhập giao diện không bảo vệ API. Chỉ dùng dữ liệu giả, không đưa thông tin sức khỏe, danh tính, mật khẩu Wi-Fi hoặc thiết bị thật lên bản public.
- Trước khi triển khai thật cần bổ sung xác thực server-side, phân quyền theo hồ sơ, bảo vệ API thiết bị và quy trình bảo mật dữ liệu.
