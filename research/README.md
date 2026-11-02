# Bộ dữ liệu phân tích Myka E03

Bộ mô phỏng phiên bản E03-20261102, seed 20261102, 20 hồ sơ DEMO-01–20, 60 ngày cố định 04/09–02/11/2026. Dữ liệu không phải log robot hay hồ sơ người bệnh thật. Bốn kịch bản: ổn định; giảm ngủ/vận động; thiếu nhật ký; tín hiệu vòng bít giả định và giảm ngủ. Vòng bít 70% là giả định của bộ sinh, không là kết quả đo Omron.

Nguồn dùng chung: assets/research/dataset.json và bản module functions/lib/research-data.js được cùng script teacher_revision/build_research_dataset.py tạo. API seed chỉ nạp bộ cố định vào research_raw và health_measurements với cờ is_synthetic=1, không đụng dữ liệu E001. Mỗi lô 200 dòng, id cố định; gọi lại không nhân bản. research_raw giữ dòng lỗi/trùng để phân tích; health_measurements chỉ giữ dòng hợp lệ và khóa duy nhất theo hồ sơ/chỉ số/ngày/khung. POST measurements là kênh thiết bị mô phỏng, chỉ nhận DEMO-*, server gán received_at. Dữ liệu lịch sử seed dùng cả hai thời điểm mô phỏng, không gọi là độ trễ thiết bị thật.

API /api/research/: GET meta; POST seed?offset=0; GET analysis[?profile=DEMO-01]; GET measurements?profile=DEMO-01&metric=spo2&days=7|30|60; POST measurements; POST feedback. Không có form nhập đè số đo của người thân; phản hồi cảnh báo chỉ cập nhật alert_feedback. Chưa có xác thực production; chỉ dùng dữ liệu tổng hợp cố định.

Chỉ số mở rộng: weight kg 20–250; spo2 % 50–100; glucose mmol/L 0,5–40, context fasting; temperature Cel 25–45; respiratory_rate /min 1–80. Đây là miền nhập kỹ thuật thí nghiệm, không phải khoảng bình thường hoặc ngưỡng y tế. Tham khảo cấu trúc chỉ số/đơn vị HL7 FHIR: https://hl7.org/fhir/R5/observation-vitalsigns.html; không tuyên bố app tuân thủ FHIR hoặc HL7 chứng nhận các ngưỡng trên.

Phân tích: kiểm tra miền/đơn vị/thời gian; khử trùng khóa và giữ received_at sớm nhất; hoàn thành = khóa hợp lệ có trong danh sách dự kiến / số khung dự kiến. Không điền dữ liệu thiếu bằng 0. Độ trễ chỉ trên kênh thiết bị (BP, SpO2, glucose, nhiệt độ, nhịp thở), P95 hạng gần nhất. Xác nhận thuốc = lần value=1 / số lần dự kiến trong 7 ngày; không chứng minh thuốc đã được uống.

Baseline lấy 14 ngày đầu mỗi hồ sơ. Trung vị và 1,4826 × MAD; sàn scale lần lượt 0,3 giờ, 3 phút, 0,5 điểm. z < −3 trên một chỉ số ngủ/vận động/sắc thái lời nói tạo cờ đề nghị hỏi thăm. So sánh A/B là các ngưỡng tự chọn trong thiết kế, không là hướng dẫn y tế. Nhãn true_anomaly chỉ chấm điểm, không làm đầu vào tính z. Kết quả bị ảnh hưởng bởi bước giảm rõ và hồ sơ nền thấp được tạo có chủ đích.

Sắc thái lời nói: từ điển/luật phủ định, không xử lý âm thanh. mood.js được kiểm tra nhãn/điểm trùng Python trên 90 câu. Nhãn ban đầu và lần rà đều có AI hỗ trợ; không gọi là gán nhãn tay hoặc chuyên gia. Điểm 1–5 và confidence là quy ước chưa hiệu chỉnh, không xác định tâm trạng lâm sàng. Không có từ khóa thì không đủ dữ liệu. Không có LLM hoặc dự báo bệnh.

Biểu đồ dùng SVG; đã bỏ script Recharts không được sử dụng gây ForwardRef. Kết quả kiểm thử cụ thể phải dẫn nhật ký đợt E03, không nâng trạng thái local thành public khi chưa chạy thật.

DEF-03: So sánh z < −3 sử dụng dung sai 1e-9 để không gắn cờ điểm bằng −3 nhưng IEEE-754 biểu diễn −3,000000000000001. Dung sai chỉ xử lý sai số số học, không thay ngưỡng nghiệp vụ. Có ca kiểm tra đúng biên.

## Giao diện người thân E04 ngày 03/11/2026

Màn hình gia đình chỉ có Chỉ số & lịch sử và Điều cần quan tâm, dùng diễn giải dễ hiểu. Đã bỏ bảng đối chứng, P95, z/MAD, phiên bản/seed, liên kết dữ liệu thô và ô thử phân loại lời nói khỏi luồng người thân. Các phép tính và bộ dữ liệu vẫn phục vụ kiểm thử/nghiên cứu, được bàn giao trong bằng chứng và báo cáo. Không có trang nghiên cứu/admin mới hoặc chế độ ẩn công khai thay thế.


## E05 03/11/2026 — phạm vi robot đồng hành
E05 thay thế E03/E04 làm bộ demo hiện tại. Không dùng các tổng số 13.200/13.000 và F1 97,84% của E03 cho E05. Myka gửi huyết áp/mạch; sleep/activity phải là lời tự báo có confirmed=true và utterance; interaction_minutes tính từ sessions started_at/ended_at; reminder_response pending không sinh activity. Cân nặng/SpO₂/đường huyết chỉ nhập từ thiết bị ngoài qua caregiver_entry, có recorder, measurement_provider và ngày đo. Không còn temperature/respiratory_rate trong tập hiện tại hoặc API nhận dữ liệu. Số đo bên ngoài không nằm trong expected lịch Myka.
Bộ dữ liệu 20 hồ sơ, 60 ngày, 9.085 dòng thô; 7.200 khung theo lịch (BP 2, phản hồi lời nhắc 1, sleep/activity 1 mỗi loại, thuốc 1 mỗi ngày). 9.065 dòng hợp lệ duy nhất gồm cả bản ngoài lịch và nhật ký; chỉ 6.685 khung thuộc lịch được phủ. Không dùng 9065/7200 để tính hoàn thành.
Chức năng rút thông tin giọng nói thật và gửi tự động cho bác sĩ chưa triển khai. Demo dùng lời tự báo đã xác nhận tạo sẵn. Bản tổng hợp chỉ tải xuống để người thân kiểm tra/chủ động chia sẻ. Các tập E03 còn giữ trong D1 theo version, không trộn vào truy vấn E05.
