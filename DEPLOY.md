# Deploy Myka Care Companion lên Cloudflare

## Thành phần demo

- Frontend tĩnh được phục vụ bởi Cloudflare Pages.
- API nằm trong `functions/api/[[path]].js` và chạy bằng Pages Functions.
- Dữ liệu demo lưu trong Cloudflare D1, binding có tên `MYKA_DB`.
- `migrations/0001_myka_demo.sql` tạo schema và dữ liệu tổng hợp giả; `0002_family_preferences.sql` bổ sung cài đặt người thân; `0003_conversation_logs.sql` tạo nhật ký hội thoại; `0004_elder_profile_demo.sql` thêm hồ sơ người cao tuổi giả.
- Push lên nhánh `main` sẽ kích hoạt Pages Git integration tự build và deploy.

## Dữ liệu demo từ backend FastAPI trong `robot-myka-backend`

Các mẫu huyết áp, lịch chăm sóc, bảo trì, trạng thái thiết bị mô phỏng và hội thoại được đưa vào D1 khi API gia đình đọc hồ sơ E001 lần đầu. Các bản ghi này được dựng từ hàm `seed_data()`/`seed_family_app_data()` của FastAPI; đây là dữ liệu kiểm thử, không phải dữ liệu robot thật. Luồng demo không sao chép mật khẩu Wi-Fi hoặc địa chỉ IP riêng từ SQLite. Khoản thanh toán cũ trong backend mẫu không được nhập vì app dùng mức giá đã thống nhất: thiết bị 2.000.000đ và thuê bao 100.000đ/tháng.

## Cấu hình D1

Trong Cloudflare Pages → Settings → Functions → Bindings, tạo binding loại **D1 database**, tên biến `MYKA_DB`, chọn database `myka-care-db` cho môi trường Production. Với database mới, chạy migration bằng D1 Console:

```sh
wrangler d1 execute myka-care-db --remote --file=migrations/0001_myka_demo.sql
wrangler d1 execute myka-care-db --remote --file=migrations/0002_family_preferences.sql
wrangler d1 execute myka-care-db --remote --file=migrations/0003_conversation_logs.sql
wrangler d1 execute myka-care-db --remote --file=migrations/0004_elder_profile_demo.sql
```

Sau khi thêm binding, cần có một deployment mới để Function nhận binding.

## Phạm vi Agent

Mục **Trạng thái** giữ thông tin kết nối máy chủ, thiết bị và lần cập nhật gần nhất; nút **Tải dữ liệu mới** gửi một số đo mô phỏng qua luồng ghi nhận hiện có. Backend kiểm tra số đo, áp dụng ngưỡng cấu hình, lưu vào `blood_pressure` và tạo bản ghi `alerts` nếu vượt ngưỡng cao. Số đo mẫu được đánh dấu bằng tiền tố `APP-SYNC-DEMO:`; API `GET /api/family/health-summary/{elder_id}` gộp chúng với dữ liệu hướng dẫn để mục Sức khỏe cập nhật biểu đồ và lịch sử ngay sau khi tải lại. Không có trang Agent hoặc nhật ký Agent tách riêng.

Trong **Cài đặt**, người thân có thể bật/tắt lịch tạo hai số đo giả mỗi ngày lúc **09:00** và **19:00** (múi giờ `Asia/Ho_Chi_Minh`). GitHub Actions chạy `.github/workflows/scheduled-demo-bp.yml` theo lịch UTC 02:00/12:00 và gọi `POST /api/demo-scheduler/tick/E001?slot=morning|evening`; Pages Function chỉ ghi dữ liệu nếu lịch đang bật, chỉ ghi một lần cho mỗi ngày/khung giờ và lưu trực tiếp vào D1. GitHub Actions chạy lịch trên nhánh mặc định; thời gian bắt đầu có thể trễ khi hệ thống hàng đợi bận. Đây chỉ là số đo mô phỏng để demo, không đại diện cho máy đo hoặc dữ liệu bệnh nhân thật.

Luồng thiết bị `POST /api/device/bp-record/{elder_id}` vẫn phân loại số đo gửi vào, lưu lịch sử huyết áp và tạo cảnh báo khi vượt ngưỡng cao. Đây là Agent demo theo quy tắc cấu hình, không phải mô hình học máy, chẩn đoán hay tư vấn điều trị. Kịch bản trình diễn không kết nối thiết bị thật và không gửi thông báo đẩy. App không có chat riêng bác sĩ–người thân; trao đổi tư vấn dùng nhóm Telegram chung đã được cấu hình.

Các thao tác Wi-Fi/Bluetooth và ghi phép đo hiện chỉ mô phỏng dữ liệu qua API; chưa kết nối thiết bị thật. Trang Telegram sẽ chỉ mở nhóm khi có URL nhóm được cấu hình.

## Cài đặt người thân

`GET/PUT /api/family/elder-profile/{elder_id}` đọc và lưu thông tin bổ sung của hồ sơ người cao tuổi đã liên kết: tuổi, địa chỉ và ghi chú sức khỏe. Người thân mở Hồ sơ, chọn Thêm thông tin hoặc Chỉnh sửa rồi Lưu thay đổi. API kiểm tra giới hạn dữ liệu, lưu vào D1 và trả hồ sơ đã cập nhật. Bản public hiện là demo dùng dữ liệu minh họa theo giới hạn bên dưới.

`GET/PUT /api/family/settings/{elder_id}` lưu lựa chọn Không làm phiền (thời lượng tùy chỉnh tối đa 24 giờ hoặc đến khi bật lại), kiểu giọng, tên robot và trạng thái lịch số đo mô phỏng. Lịch được lưu trong bảng D1 `bp_demo_schedules` do API tự tạo khi đọc cài đặt, không cần chạy migration thủ công. Đây là cấu hình hồ sơ demo: app chưa có push notification để tắt rung/âm thanh thực tế; giọng và tên chỉ được áp dụng khi tích hợp phần cứng.

`GET/POST /api/family/schedules/{elder_id}` đọc và tạo lịch thuốc/tái khám trong D1. Hàm `scheduleNotification()` hiện chỉ là điểm nối minh họa, chưa gửi push notification.

Onboarding chỉ mở Dashboard khi hồ sơ có thiết bị Bluetooth trong trạng thái đã ghép. Camera QR và Web Bluetooth được bật theo khả năng trình duyệt; Wi-Fi gần đó không thể được quét bởi một trang web, nên danh sách hiện tại là mẫu. Lưu thiết bị/mạng ở onboarding chỉ cập nhật dữ liệu demo; kết nối thiết bị thật cần app/gateway và firmware Myka.

CTA đăng ký/gia hạn mở luồng chuyển khoản ngân hàng minh họa. Tên ngân hàng, số tài khoản, mã tham chiếu và hình QR trong luồng đều là dữ liệu giả, không dùng để chuyển tiền; thao tác demo không tạo giao dịch hoặc đổi trạng thái hóa đơn. Tài khoản người thân demo được xem là đã thanh toán 2.000.000đ tiền thiết bị và 100.000đ thuê bao tháng đầu; các tháng sau chỉ gia hạn thuê bao 100.000đ/tháng.

`GET /api/family/conversation-history/{elder_id}?date=YYYY-MM-DD` trả nhật ký chỉ đọc. Bản demo tự tạo một số tin nhắn tổng hợp cho hồ sơ E001; chưa nhận lịch sử từ Telegram hoặc robot.

## Dùng thử và giới hạn

- Tài khoản demo đã ghép thiết bị: `nguoithan@demo.com` / `123456`.
- Tài khoản demo trải nghiệm thiết lập lần đầu: `caidat@demo.com` / `123456` (trạng thái mô phỏng ở giao diện; không phải tài khoản xác thực server-side).
- Dữ liệu trong migration là dữ liệu tổng hợp giả, không phải hồ sơ bệnh nhân.
- Demo hiện chưa có xác thực/ủy quyền server-side; đăng nhập giao diện không bảo vệ API. Chỉ dùng dữ liệu giả, không đưa thông tin sức khỏe, danh tính, mật khẩu Wi-Fi hoặc thiết bị thật lên bản public.
- Trước khi triển khai thật cần bổ sung xác thực server-side, phân quyền theo hồ sơ, bảo vệ API thiết bị và quy trình bảo mật dữ liệu.
