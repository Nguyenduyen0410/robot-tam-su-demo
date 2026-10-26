# Phạm vi hệ thống và AI Agent Myka Care

## Phân hệ

AI Care Companion là hệ thống tổng thể. Myka Care Companion App là ứng dụng dành cho **người thân**; người thân đăng nhập để đọc và theo dõi dữ liệu của người cao tuổi. Robot/thiết bị và backend cung cấp dữ liệu, còn kênh trao đổi tư vấn nằm ngoài app.

## AI Agent trong bản demo

Mục **AI Agent** trong app người thân trình bày rõ luồng tự động **nhận dữ liệu → đối chiếu quy tắc → lưu nhật ký → cập nhật trạng thái cho gia đình**. Người xem chọn một trong ba kịch bản số đo tổng hợp (ổn định, cần lưu ý, vượt ngưỡng); giao diện chạy từng bước và hiển thị kết quả, hành động tiếp theo cùng năm lần chạy gần nhất. Backend lưu các lần chạy tại bảng `agent_demo_runs`, tách khỏi lịch sử huyết áp và bảng cảnh báo sức khỏe để dữ liệu minh họa không bị hiểu nhầm là số đo thật.

Luồng tiếp nhận số đo thiết bị được mô tả bởi `POST /api/device/bp-record/{elder_id}`: kiểm tra dữ liệu, phân loại theo ngưỡng cấu hình, lưu lịch sử và ghi cảnh báo khi vượt ngưỡng cao. `GET /api/family/agent-status/{elder_id}` trả trạng thái xử lý cho app. Kịch bản trình diễn riêng dùng `GET/POST /api/family/agent-demo/{elder_id}` để ghi nhật ký minh họa tách biệt.

Đây là Agent giám sát theo quy tắc cấu hình, không phải mô hình học máy hoặc AI chẩn đoán. Kịch bản demo không chứng minh kết nối máy đo thật, gửi thông báo đẩy hay phân tích lâm sàng. Agent không khuyến nghị điều trị và không thay thế bác sĩ. Nội dung tư vấn và trao đổi chăm sóc chuyển sang **nhóm Telegram chung**; app không có chat riêng bác sĩ–người thân.

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
