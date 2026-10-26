# Phạm vi hệ thống và AI Agent Myka Care

## Phân hệ

AI Care Companion là hệ thống tổng thể. Myka Care Companion App là ứng dụng dành cho **người thân**; người thân đăng nhập để đọc và theo dõi dữ liệu của người cao tuổi. Robot/thiết bị và backend cung cấp dữ liệu, còn kênh trao đổi tư vấn nằm ngoài app.

## AI Agent trong bản demo

Trong mục **Trạng thái**, người thân có thể chọn **Tải dữ liệu mới** để minh họa việc nhận một số đo mô phỏng từ thiết bị. Backend kiểm tra dữ liệu, đối chiếu ngưỡng cấu hình, lưu số đo vào lịch sử huyết áp và tạo cảnh báo nếu vượt ngưỡng cao. Giao diện sau đó tải lại dữ liệu để biểu đồ và lịch sử trong mục **Sức khỏe** phản ánh bản ghi mới. Đây là một luồng sử dụng thông thường của app; các bước xử lý Agent diễn ra phía máy chủ, không có trang Agent hoặc nhật ký chạy riêng.

Luồng tiếp nhận số đo dùng `POST /api/device/bp-record/{elder_id}`; app đánh dấu mẫu minh họa bằng tiền tố `APP-SYNC-DEMO:` để API tổng hợp có thể gộp bản ghi vào dữ liệu biểu đồ vốn đọc từ nguồn hướng dẫn chỉ đọc. `GET /api/family/health-summary/{elder_id}` trả danh sách đã gộp và sắp xếp theo thời gian. `GET /api/family/agent-status/{elder_id}` cung cấp trạng thái mới nhất cho mục Trạng thái.

Đây là Agent giám sát theo quy tắc cấu hình, không phải mô hình học máy hoặc AI chẩn đoán. Kịch bản demo không chứng minh kết nối máy đo thật, gửi thông báo đẩy hay phân tích lâm sàng. Agent không khuyến nghị điều trị và không thay thế bác sĩ. Nội dung tư vấn và trao đổi chăm sóc chuyển sang **nhóm Telegram chung**; app không có chat riêng bác sĩ–người thân.

## Phạm vi app

- Đọc lịch sử huyết áp/nhịp tim, tóm tắt theo khoảng thời gian.
- Đọc lịch uống thuốc, lịch tái khám, nhắc bảo trì, gói dịch vụ và lịch sử thanh toán.
- Xem trạng thái máy chủ, thiết bị và lần cập nhật gần nhất; tải số đo mô phỏng để theo dõi luồng tự động.
- Bật/tắt lịch tự ghi số đo mô phỏng lúc 09:00 và 19:00 giờ Việt Nam trong Cài đặt; bản ghi được gửi thẳng đến backend, không phụ thuộc app đang mở.
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
- Cài đặt hồ sơ/lịch số đo mẫu: `GET/PUT /api/family/settings/{elder_id}`; lịch tự động gọi `POST /api/demo-scheduler/tick/E001?slot=morning|evening`.
- Nhật ký đọc theo ngày: `GET /api/family/conversation-history/{elder_id}?date=YYYY-MM-DD`.

## Lưu ý trước khi public

Backend hiện là demo SQLite, chưa có xác thực/ủy quyền server-side cho người dùng hoặc thiết bị. Các API thay đổi cấu hình cần được bảo vệ trước khi đưa dữ liệu hoặc thiết bị thật lên Internet. Không dùng dữ liệu/mật khẩu Wi-Fi thật trong bản demo public; API đọc kết nối không trả lại trường mật khẩu.

## Hồ sơ người cao tuổi

Người thân bổ sung thông tin hồ sơ đã liên kết sau đăng nhập, qua Thêm thông tin hoặc Chỉnh sửa và Lưu thay đổi. GET/PUT `/api/family/elder-profile/{elder_id}` đọc và lưu tuổi, địa chỉ, ghi chú sức khỏe vào backend. Thao tác không tạo hồ sơ liên kết mới và không sửa phép đo. API hiện vẫn thuộc demo chưa có xác thực server-side, chỉ sử dụng dữ liệu minh họa cho tới khi hoàn thiện phân quyền.
