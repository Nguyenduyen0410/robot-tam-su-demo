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

Mục **Trạng thái** có nút **Kiểm tra & đồng bộ**, gửi yêu cầu rỗng tới `POST /api/family/bp-sync/E001`. Backend chỉ lấy bù khung đã đến giờ còn thiếu khi lịch bật và nguồn mô phỏng có số đo; không tạo số đo tùy ý theo lần bấm. Khóa hồ sơ/ngày/khung chống trùng giữa đồng bộ thủ công và tự động. Số đo mẫu giữ tiền tố `APP-SYNC-DEMO:` và được API sức khỏe đọc lại từ D1.

Trong **Cài đặt**, người thân bật/tắt lịch mô phỏng **09:00/19:00** theo giờ Việt Nam. Từ 05/11/2026, Worker `myka-bp-scheduler` dùng Durable Object Alarm để gửi từng khung, tự đặt lịch tiếp theo; Cron 5 phút chỉ khởi tạo/sửa alarm còn thiếu. Alarm dự kiến chạy sau mốc đo 20–30 giây, chừa thời gian gọi API cho mục tiêu nhận sau 20–35 giây. Đây là mục tiêu thử nghiệm, không phải bảo đảm mọi lần đều đạt. GitHub Actions 20 phút/lần giữ vai trò đồng bộ bù dự phòng. Khi có lỗi, thời gian nhận thực tế vẫn được lưu, không cắt xuống ngưỡng mục tiêu.

`blood_pressure.timestamp` giữ giờ đo nguồn; `received_at` mới do máy chủ gán khi chấp nhận ghi. API áp dụng bổ sung cột nullable cho cơ sở dữ liệu cũ; không chạy lại migration 0006 nếu cột đã tồn tại, không điền giả giờ nhận của bản ghi cũ. Luồng device có thể gửi `measured_at` hợp lệ không ở tương lai; nếu không có, timestamp vẫn là mốc tiếp nhận tương thích cũ và không đủ để kết luận độ trễ từ thiết bị. UI lịch sử chỉ hiện giờ nhận theo giờ Việt Nam, chưa có thì ghi chưa ghi nhận; công thức/thống kê thuộc báo cáo.

Triển khai Worker riêng bằng `wrangler deploy --config workers/bp-scheduler/wrangler.jsonc`. `PROBE_TOKEN` chỉ dùng tạm cho kiểm thử có kiểm soát; ba Alarm thử ghi hồ sơ giả riêng `E-TIMING-TEST`, không sửa E001. Xóa secret sau kiểm tra để vô hiệu hóa endpoint thử.

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


## Lịch sử cấu hình trước 05/11/2026

Trước bản sửa, GitHub Actions kiểm tra khoảng 20 phút/lần và có thể chạy muộn; quan sát E11 ghi nhận đồng bộ bù khung 19:00 vào khoảng 20:30. Bằng chứng này được giữ nguyên. Bản sửa dùng Alarm làm lịch chính, lưu giờ nhận và kiểm tra lại bằng E12; chưa nghiệm thu vận hành tự nhiên qua nhiều ngày hoặc truyền từ robot thật. App đang mở tự tải lại mỗi 30 giây, nên thời điểm nhìn thấy trên màn hình có thể muộn hơn thời điểm máy chủ đã nhận.
