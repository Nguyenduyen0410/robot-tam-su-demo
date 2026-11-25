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

## Phạm vi nguồn số đo và lời nhắc

App hiển thị snapshot cố định gồm 28 bản ghi được trích xuất từ API lịch sử Myka ngày 23/11/2026. Timestamp trong biểu đồ và bảng là giờ đo do nguồn trả về; app không gán giờ đo mới và không làm mới snapshot thành số đo trực tiếp.

**09:00 và 19:00 là lời nhắc người thân mở app để xem số đo trong ngày.** Chúng không điều khiển robot, không gọi API thiết bị theo giờ, không tạo bản ghi đo và không làm thay đổi timestamp. Lời nhắc được xử lý ở trình duyệt khi trang app đang mở; thông báo hệ thống cần quyền do người thân cấp và không hoạt động nền khi app đã đóng.

Worker lịch gửi số đo mô phỏng đã được ngừng; cấu hình hiện tại không còn cron. Endpoint cũ `/api/demo-scheduler/tick` và `/api/family/bp-sync` trả mã 410 để không sinh số đo giả. Các ca kiểm chứng lịch gửi trước đây chỉ là bằng chứng lịch sử của một cơ chế mô phỏng, không mô tả hành vi app hiện hành.

`blood_pressure.timestamp` giữ giờ đo nguồn; `received_at` mới do máy chủ gán khi chấp nhận ghi. API áp dụng bổ sung cột nullable cho cơ sở dữ liệu cũ; không chạy lại migration 0006 nếu cột đã tồn tại, không điền giả giờ nhận của bản ghi cũ. Luồng device có thể gửi `measured_at` hợp lệ không ở tương lai; nếu không có, timestamp vẫn là mốc tiếp nhận tương thích cũ và không đủ để kết luận độ trễ từ thiết bị. UI lịch sử chỉ hiện giờ nhận theo giờ Việt Nam, chưa có thì ghi chưa ghi nhận; công thức/thống kê thuộc báo cáo.

Triển khai Worker riêng bằng `wrangler deploy --config workers/bp-scheduler/wrangler.jsonc`. `PROBE_TOKEN` chỉ dùng tạm cho kiểm thử có kiểm soát; ba Alarm thử ghi hồ sơ giả riêng `E-TIMING-TEST`, không sửa E001. Xóa secret sau kiểm tra để vô hiệu hóa endpoint thử.

Luồng thiết bị `POST /api/device/bp-record/{elder_id}` vẫn phân loại số đo gửi vào, lưu lịch sử huyết áp và tạo cảnh báo khi vượt ngưỡng cao. Đây là Agent demo theo quy tắc cấu hình, không phải mô hình học máy, chẩn đoán hay tư vấn điều trị. Kịch bản trình diễn không kết nối thiết bị thật và không gửi thông báo đẩy. App không có chat riêng bác sĩ–người thân; trao đổi tư vấn dùng nhóm Telegram chung đã được cấu hình.

Các thao tác Wi-Fi/Bluetooth và ghi phép đo hiện chỉ mô phỏng dữ liệu qua API; chưa kết nối thiết bị thật. Trang Telegram sẽ chỉ mở nhóm khi có URL nhóm được cấu hình.

## Cài đặt người thân

`GET/PUT /api/family/elder-profile/{elder_id}` đọc và lưu thông tin bổ sung của hồ sơ người cao tuổi đã liên kết: tuổi, địa chỉ và ghi chú sức khỏe. Người thân mở Hồ sơ, chọn Thêm thông tin hoặc Chỉnh sửa rồi Lưu thay đổi. API kiểm tra giới hạn dữ liệu, lưu vào D1 và trả hồ sơ đã cập nhật. Bản public hiện là demo dùng dữ liệu minh họa theo giới hạn bên dưới.

`GET/PUT /api/family/settings/{elder_id}` lưu lựa chọn Không làm phiền, kiểu giọng và tên robot. Lời nhắc người thân xem số đo được lưu trong localStorage của trình duyệt hiện tại, tách khỏi hồ sơ thiết bị và dữ liệu đo. Kiểu giọng và tên robot chưa được đồng bộ tới phần cứng.

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


## Tư liệu kiểm chứng lịch mô phỏng đã ngừng

Các bằng chứng E11/E12 ghi lại một thử nghiệm lập lịch gửi số đo mô phỏng trước đây. Cơ chế đó đã được tắt và không còn đại diện cho hành vi hiện hành của app. Ứng dụng hiện dùng 09:00/19:00 để nhắc người thân xem số đo; timestamp đo trên biểu đồ vẫn lấy từ snapshot API Myka.
