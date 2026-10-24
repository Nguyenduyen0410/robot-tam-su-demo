# Phạm vi hệ thống và AI Agent Myka Care

## Phân hệ

AI Care Companion là hệ thống tổng thể. Myka Care Companion App là ứng dụng dành cho **người thân**; người thân đăng nhập để đọc và theo dõi dữ liệu của người cao tuổi. Robot/thiết bị và backend cung cấp dữ liệu, còn kênh trao đổi tư vấn nằm ngoài app.

## AI Agent trong bản demo

Agent được trình bày như một tiến trình tự động theo luồng **nhận dữ liệu → xử lý theo quy tắc cấu hình → lưu kết quả → tạo trạng thái/cảnh báo để người thân xem**. Ví dụ backend nhận phép đo qua `POST /api/device/bp-record/{elder_id}`, đánh dấu trạng thái theo ngưỡng cấu hình, lưu vào lịch sử và ghi cảnh báo khi thuộc trường hợp được cấu hình. `GET /api/family/agent-status/{elder_id}` cung cấp trạng thái và các bước xử lý gần nhất cho màn hình Agent.

Đây là demo Agent theo quy tắc, không phải mô hình AI chẩn đoán. Agent không trả lời hội thoại sức khỏe, không khuyến nghị điều trị và không thay thế bác sĩ. Nội dung tư vấn và trao đổi chăm sóc chuyển sang **nhóm Telegram chung**; app không có chat riêng bác sĩ–người thân. Không hiển thị link chat riêng đội chăm sóc.

## Phạm vi app

- Đọc lịch sử huyết áp/nhịp tim, tóm tắt theo khoảng thời gian.
- Đọc lịch uống thuốc, lịch tái khám, nhắc bảo trì, gói dịch vụ và lịch sử thanh toán.
- Xem trạng thái Agent và cảnh báo do backend ghi nhận.
- Mở nhóm Telegram chung để trao đổi với đội chăm sóc.
- Xem nhật ký trò chuyện Myka theo ngày ở chế độ chỉ đọc để người thân xem lại nội dung.
- Đọc/cập nhật/xóa cấu hình Wi-Fi demo; đọc/ghép/gỡ thiết bị Bluetooth demo qua API.
- Lưu tùy chọn Không làm phiền theo thời hạn, kiểu giọng dự kiến và tên robot hiển thị tùy chọn.

Các thao tác Wi-Fi/Bluetooth hiện chỉ cập nhật dữ liệu qua API giả lập. Chúng chưa dò mạng Wi-Fi, quét Bluetooth hay điều khiển robot thật. Cần tích hợp firmware hoặc gateway phần cứng để thực hiện kết nối thiết bị thật. Người dùng app chỉ được thao tác cấu hình thiết bị ở mức demo; các màn hình sức khỏe khác chủ yếu read-only.

Không làm phiền hiện chỉ lưu lựa chọn và thời hạn; app chưa có push notification nên chưa thể thực sự tắt rung/âm thanh của thông báo. Kiểu giọng và tên robot cũng mới là tùy chọn hồ sơ, chưa đồng bộ tới robot.

Nhật ký trò chuyện hiện dùng dữ liệu tổng hợp minh họa. Chưa có bot/robot chuyển hội thoại Telegram hoặc phần cứng thật vào backend; URL Telegram Web không cấp quyền đọc lịch sử. Bản demo cũng chưa phân tích hội thoại tự động để phát hiện vấn đề sức khỏe.

## API hiện có

- Đọc: `GET /api/family/health-summary/{elder_id}`, `/schedules/{elder_id}`, `/maintenance-notifications/{elder_id}`, `/subscription/{elder_id}`, `/alerts/{elder_id}`, `/agent-status/{elder_id}`.
- Telegram: `GET /api/family/telegram-consultation/{elder_id}` chỉ trả link nhóm dùng bởi app.
- Kết nối demo: `GET /api/device/connectivity/{elder_id}`, `PUT` và `DELETE /api/device/wifi/{elder_id}`, `POST /api/device/bluetooth/pair/{elder_id}`, `DELETE /api/device/bluetooth/{elder_id}/{device_id}`.
- Thiết bị ghi phép đo: `POST /api/device/bp-record/{elder_id}`.
- Cài đặt hồ sơ: `GET/PUT /api/family/settings/{elder_id}`.
- Nhật ký đọc theo ngày: `GET /api/family/conversation-history/{elder_id}?date=YYYY-MM-DD`.

## Lưu ý trước khi public

Backend hiện là demo SQLite, chưa có xác thực/ủy quyền server-side cho người dùng hoặc thiết bị. Các API thay đổi cấu hình cần được bảo vệ trước khi đưa dữ liệu hoặc thiết bị thật lên Internet. Không dùng dữ liệu/mật khẩu Wi-Fi thật trong bản demo public; API đọc kết nối không trả lại trường mật khẩu.

## Hồ sơ người cao tuổi

Người thân bổ sung thông tin hồ sơ đã liên kết sau đăng nhập, qua Thêm thông tin hoặc Chỉnh sửa và Lưu thay đổi. GET/PUT `/api/family/elder-profile/{elder_id}` đọc và lưu tuổi, địa chỉ, ghi chú sức khỏe vào backend. Thao tác không tạo hồ sơ liên kết mới và không sửa phép đo. API hiện vẫn thuộc demo chưa có xác thực server-side, chỉ sử dụng dữ liệu minh họa cho tới khi hoàn thiện phân quyền.
