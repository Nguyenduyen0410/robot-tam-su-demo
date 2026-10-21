// ============================================================
// data.js - Mock data, localStorage helpers, initial seed
// Tích hợp dữ liệu chuẩn từ bộ Testcase Myka: Ngoại - Chị Duyên (TC-001 ~ TC-053)
// ============================================================

(function () {
  // ---- helpers ----
  const LS = {
    get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  };

  // ---- date helpers ----
  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
  }
  function todayAt(hh, mm) {
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d.toISOString();
  }
  function minutesAgo(n) {
    return new Date(Date.now() - n * 60000).toISOString();
  }

  // ---- mock elders ----
  const ELDERS = [
    { id: 'E001', name: 'Ngoại (Bà Nguyễn Thị Hoa)', age: 72, room: 'Phòng P101', avatar: '👵', linkedFamily: 'F001', familyContact: 'Chị Duyên (0908.123.456)', assignedNurse: 'N001', assignedDoctor: 'D001', deviceId: 'RB-001', deviceName: 'Robot Myka' },
    { id: 'E002', name: 'Ông Trần Văn Nam',   age: 68, room: 'Phòng P102', avatar: '👴', linkedFamily: 'F002', familyContact: 'Anh Minh (0912.345.678)', assignedNurse: 'N001', assignedDoctor: 'D001', deviceId: 'RB-002', deviceName: 'Robot Myka 02' },
    { id: 'E003', name: 'Bà Lê Thị Mai',      age: 75, room: 'Phòng P103', avatar: '👵', linkedFamily: 'F003', familyContact: 'Chị Lan (0988.765.432)', assignedNurse: 'N001', assignedDoctor: 'D001', deviceId: 'RB-003', deviceName: 'Robot Myka 03' },
  ];

  // ---- BP readings chuẩn theo Testcase TC-001 ~ TC-004 & TC-010 ----
  function getInitialBP() {
    return [
      // TC-001, TC-002: Ngoại đo huyết áp buổi sáng thành công
      {
        id: 'BP-TC-002',
        elderId: 'E001',
        systolic: 128,
        diastolic: 78,
        heartRate: 72,
        timestamp: todayAt(8, 30),
        status: 'normal',
        recordedBy: 'device',
        tcRef: 'TC-001, TC-002',
        note: 'Đo hợp lệ lúc 08:30 sáng. Myka thông báo: “Kết quả là huyết áp tâm thu 128, huyết áp tâm trương 78 và nhịp tim 72 lần một phút. Kết quả đã được ghi nhận.”'
      },
      // TC-003, TC-004: Ngoại đo lại thành công sau khi đo lần đầu bị gián đoạn
      {
        id: 'BP-TC-004',
        elderId: 'E001',
        systolic: 130,
        diastolic: 80,
        heartRate: 74,
        timestamp: todayAt(14, 15),
        status: 'normal',
        recordedBy: 'device',
        tcRef: 'TC-003, TC-004',
        note: 'Đo lại lần 2 sau khi nghỉ ngơi. Myka: “Lần đo này đã hoàn tất: 130/80 mmHg, nhịp tim 74 bpm.”'
      },
      // TC-010: Lần đo huyết áp tăng nhẹ lúc chiều qua
      {
        id: 'BP-TC-010',
        elderId: 'E001',
        systolic: 145,
        diastolic: 90,
        heartRate: 82,
        timestamp: daysAgo(1),
        status: 'critical',
        recordedBy: 'device',
        tcRef: 'TC-010',
        note: 'Huyết áp 145/90 mmHg. Myka: “Huyết áp 145/90 là thông tin Ngoại nên theo dõi thêm ạ. Ngoại ngồi nghỉ và con đã ghi nhận để bác sĩ Tuấn xem nhé.”'
      },
      // Các ngày trước đó
      { id: 'BP-E001-2', elderId: 'E001', systolic: 122, diastolic: 76, heartRate: 70, timestamp: daysAgo(2), status: 'normal', recordedBy: 'device' },
      { id: 'BP-E001-3', elderId: 'E001', systolic: 126, diastolic: 79, heartRate: 73, timestamp: daysAgo(3), status: 'normal', recordedBy: 'device' },
      { id: 'BP-E001-4', elderId: 'E001', systolic: 132, diastolic: 82, heartRate: 75, timestamp: daysAgo(4), status: 'warning', recordedBy: 'device' },
      { id: 'BP-E001-5', elderId: 'E001', systolic: 124, diastolic: 78, heartRate: 71, timestamp: daysAgo(5), status: 'normal', recordedBy: 'device' },
      { id: 'BP-E001-6', elderId: 'E001', systolic: 120, diastolic: 75, heartRate: 69, timestamp: daysAgo(6), status: 'normal', recordedBy: 'device' },

      // Bệnh nhân E002 (Ông Nam) - HA cao cần can thiệp
      { id: 'BP-E002-1', elderId: 'E002', systolic: 158, diastolic: 96, heartRate: 88, timestamp: daysAgo(1), status: 'critical', recordedBy: 'device' },
      { id: 'BP-E002-2', elderId: 'E002', systolic: 142, diastolic: 88, heartRate: 80, timestamp: daysAgo(2), status: 'critical', recordedBy: 'device' },
      { id: 'BP-E002-3', elderId: 'E002', systolic: 138, diastolic: 85, heartRate: 76, timestamp: daysAgo(3), status: 'warning', recordedBy: 'device' },

      // Bệnh nhân E003 (Bà Mai)
      { id: 'BP-E003-1', elderId: 'E003', systolic: 125, diastolic: 80, heartRate: 72, timestamp: daysAgo(1), status: 'normal', recordedBy: 'device' },
      { id: 'BP-E003-2', elderId: 'E003', systolic: 128, diastolic: 82, heartRate: 74, timestamp: daysAgo(2), status: 'normal', recordedBy: 'device' },
    ];
  }

  // ---- schedules ----
  const SCHEDULES = [
    { id: 'SCH001', elderId: 'E001', type: 'medication', time: todayAt(8, 0),  title: 'Uống thuốc huyết áp', detail: 'Amlodipine 5mg - 1 viên sau ăn sáng', icon: '💊', confirmed: true, tcRef: 'US-08' },
    { id: 'SCH002', elderId: 'E001', type: 'bp',         time: todayAt(8, 30), title: 'Đo huyết áp buổi sáng', detail: 'Đo với máy đo thông minh Myka', icon: '💓', confirmed: true, tcRef: 'TC-001' },
    { id: 'SCH003', elderId: 'E001', type: 'medication', time: todayAt(12, 0), title: 'Uống thuốc tiểu đường', detail: 'Metformin 500mg - 1 viên', icon: '💊', confirmed: true, tcRef: 'US-08' },
    { id: 'SCH004', elderId: 'E001', type: 'bp',         time: todayAt(14, 0), title: 'Đo huyết áp buổi chiều', detail: 'Đo theo lịch khuyến nghị', icon: '💓', confirmed: true, tcRef: 'TC-003' },
    { id: 'SCH005', elderId: 'E001', type: 'medication', time: todayAt(20, 0), title: 'Uống thuốc huyết áp & an thần', detail: 'Amlodipine 5mg + Melatonin 3mg', icon: '💊', confirmed: false, tcRef: 'US-08' },
    { id: 'SCH006', elderId: 'E002', type: 'medication', time: todayAt(8, 30), title: 'Uống thuốc hạ áp', detail: 'Losartan 50mg - 1 viên', icon: '💊', confirmed: false },
    { id: 'SCH007', elderId: 'E002', type: 'bp',         time: todayAt(9, 30), title: 'Đo huyết áp', detail: 'Đo và ghi kết quả', icon: '💓', confirmed: false },
    { id: 'SCH008', elderId: 'E003', type: 'appointment',time: todayAt(10, 0), title: 'Khám tim mạch định kỳ', detail: 'BS. Phạm Minh Tuấn - Phòng khám chuyên khoa 2', icon: '🏥', confirmed: false },
  ];

  // ---- SOS events ----
  const SOS_EVENTS = [
    {
      id: 'SOS001',
      elderId: 'E001',
      elderName: 'Ngoại (Bà Nguyễn Thị Hoa)',
      timestamp: minutesAgo(30),
      status: 'responded',
      respondedBy: 'N001',
      respondedName: 'Nguyễn Thị Lan (Điều dưỡng)',
      respondedAt: minutesAgo(27),
      note: 'Ngoại thấy hơi chóng mặt nhẹ sau khi tưới cây. Điều dưỡng Lan đã đến kiểm tra chỉ số sinh hiệu và cho Ngoại nằm nghỉ ổn định.',
    },
  ];

  // ---- alerts ----
  const ALERTS = [
    {
      id: 'ALT001',
      elderId: 'E002',
      elderName: 'Ông Trần Văn Nam',
      type: 'bp_high',
      title: 'Huyết áp cao bất thường 158/96 mmHg',
      detail: 'Chỉ số đo lúc 14:00 ngày hôm qua - Vượt ngưỡng an toàn',
      timestamp: daysAgo(1),
      severity: 'critical',
      status: 'pending',
      riskLevel: 'Cao',
    },
    {
      id: 'ALT002',
      elderId: 'E001',
      elderName: 'Ngoại (Bà Nguyễn Thị Hoa)',
      type: 'bp_warning',
      title: 'Huyết áp dao động 145/90 mmHg',
      detail: 'Ghi nhận từ thiết bị Robot Myka theo TC-010. Đã nhắc Ngoại nghỉ ngơi.',
      timestamp: daysAgo(1),
      severity: 'warning',
      status: 'acknowledged',
      riskLevel: 'Trung bình',
      tcRef: 'TC-010',
    },
  ];

  // ---- users (đúng theo nhân vật trong testcase Myka: Ngoại, Chị Duyên, Điều dưỡng Lan, BS Tuấn) ----
  const USERS = [
    { id: 'U001', role: 'elder',    email: 'nguoicaotuoi@demo.com', password: '123456', name: 'Ngoại (Bà Nguyễn Thị Hoa)', elderId: 'E001', avatar: '👵' },
    { id: 'U002', role: 'family',   email: 'nguoithan@demo.com',    password: '123456', name: 'Chị Duyên', relation: 'Con gái liên kết chính', elderId: 'E001', familyId: 'F001', avatar: '👩' },
    { id: 'U003', role: 'caregiver',email: 'dieuduong@demo.com',    password: '123456', name: 'Nguyễn Thị Lan', nurseId: 'N001', avatar: '👩‍⚕️', department: 'Điều dưỡng phụ trách P101' },
    { id: 'U004', role: 'doctor',   email: 'bacsi@demo.com',        password: '123456', name: 'BS. Phạm Minh Tuấn', doctorId: 'D001', avatar: '👨‍⚕️', department: 'Bác sĩ Tim mạch - Trưởng khoa' },
    { id: 'U005', role: 'admin',    email: 'admin@demo.com',        password: '123456', name: 'Trần Quốc Bảo', avatar: '🧑‍💼', department: 'Quản trị hệ thống' },
    { id: 'U006', role: 'operator', email: 'operator@demo.com',     password: '123456', name: 'Lê Minh Khoa', avatar: '🧑‍💻', department: 'Điều hành & Vận hành Robot' },
  ];

  // ---- devices ----
  const DEVICES = [
    { id: 'RB-001', model: 'RobotCare Myka v2.4', elderId: 'E001', elderName: 'Ngoại (Bà Nguyễn Thị Hoa)', status: 'Active', battery: 88, connectivity: 'WiFi 5G', lastPing: minutesAgo(1), firmwareVersion: 'v2.4.2', location: 'Phòng P101' },
    { id: 'RB-002', model: 'RobotCare Myka v2.4', elderId: 'E002', elderName: 'Ông Trần Văn Nam', status: 'Active', battery: 65, connectivity: 'WiFi', lastPing: minutesAgo(5), firmwareVersion: 'v2.4.1', location: 'Phòng P102' },
    { id: 'RB-003', model: 'RobotCare Myka v2.4', elderId: 'E003', elderName: 'Bà Lê Thị Mai', status: 'Maintenance', battery: 20, connectivity: 'Offline', lastPing: minutesAgo(120), firmwareVersion: 'v2.3.9', location: 'Phòng P103' },
    { id: 'RB-004', model: 'RobotCare Myka v2.4', elderId: null, elderName: null, status: 'Offline', battery: 100, connectivity: 'Offline', lastPing: daysAgo(3), firmwareVersion: 'v2.4.2', location: 'Kho thiết bị' },
  ];

  // ---- tenants ----
  const TENANTS = [
    { id: 'T001', name: 'Viện Dưỡng lão An Dưỡng Tâm Giao', code: 'ADTG-HN', status: 'Active', elders: 45, devices: 48, plan: 'Enterprise', contactEmail: 'admin@tamgiao.vn', phone: '024.3456.7890' },
    { id: 'T002', name: 'Trung tâm Chăm sóc Người cao tuổi TP.HCM', code: 'CSNCT-HCM', status: 'Active', elders: 120, devices: 125, plan: 'Enterprise', contactEmail: 'admin@csnct-hcm.vn', phone: '028.3456.7890' },
  ];

  // ---- care groups ----
  const CARE_GROUPS = [
    {
      id: 'CG001',
      elderId: 'E001',
      elderName: 'Ngoại (Bà Nguyễn Thị Hoa)',
      members: [
        { id: 'U002', name: 'Chị Duyên', role: 'family', avatar: '👩', title: 'Con gái' },
        { id: 'U003', name: 'Nguyễn Thị Lan', role: 'caregiver', avatar: '👩‍⚕️', title: 'Điều dưỡng chính' },
        { id: 'U004', name: 'BS. Phạm Minh Tuấn', role: 'doctor', avatar: '👨‍⚕️', title: 'Bác sĩ điều trị' },
      ],
      messages: [
        { id: 'M001', userId: 'U002', userName: 'Chị Duyên', role: 'family', avatar: '👩', text: 'Chào bác sĩ Tuấn và chị Lan! Sáng nay Myka báo huyết áp của mẹ là 128/78 mmHg, ăn uống thấy mẹ vui vẻ lắm ạ.', timestamp: minutesAgo(180), type: 'message' },
        { id: 'M002', userId: 'U003', userName: 'Nguyễn Thị Lan', role: 'caregiver', avatar: '👩‍⚕️', text: 'Chào chị Duyên! Sáng nay em đã qua phòng P101, bà đã uống thuốc Amlodipine đúng 8h. Bà khỏe, em có cùng bà ngắm cây hoa ngoài ban công ạ.', timestamp: minutesAgo(140), type: 'message' },
        { id: 'M003', userId: 'U004', userName: 'BS. Phạm Minh Tuấn', role: 'doctor', avatar: '👨‍⚕️', text: 'Chào gia đình! Chỉ số 128/78 là rất đẹp. Lần đo 145/90 hôm qua là do bà vận động tưới cây chưa kịp nghỉ, sau đó đã hồi phục tốt. Tiếp tục duy trì phác đồ thuốc hiện tại nhé.', timestamp: minutesAgo(90), type: 'message' },
        { id: 'M004', userId: 'U002', userName: 'Chị Duyên', role: 'family', avatar: '👩', text: 'Dạ, con cảm ơn Bác sĩ và Điều dưỡng nhiều lắm ạ! Chiều tối con sẽ gọi video qua Myka nói chuyện với mẹ.', timestamp: minutesAgo(30), type: 'message' },
      ],
    },
  ];

  // ---- Lịch sử cuộc gọi mô phỏng theo Testcase (TC-034 ~ TC-053) ----
  const CALL_LOGS = [
    {
      id: 'CALL-001',
      elderId: 'E001',
      caller: 'Chị Duyên',
      receiver: 'Ngoại (qua Robot Myka RB-001)',
      direction: 'incoming',
      status: 'connected',
      statusLabel: 'Đã kết nối',
      duration: '08:15',
      timestamp: minutesAgo(45),
      tcRef: 'TC-044, TC-052',
      note: 'Chị Duyên gọi tới Myka. Myka hỏi: “Ngoại ơi, Chị Duyên muốn gọi điện cho Ngoại, Ngoại muốn nhận không ạ?” → Ngoại: “Có con.” → Myka: “Vâng, con kết nối liền đây ạ.”'
    },
    {
      id: 'CALL-002',
      elderId: 'E001',
      caller: 'Ngoại (qua Robot Myka RB-001)',
      receiver: 'Chị Duyên',
      direction: 'outgoing',
      status: 'connected',
      statusLabel: 'Đã kết nối',
      duration: '05:20',
      timestamp: minutesAgo(180),
      tcRef: 'TC-034, TC-037',
      note: 'Ngoại ra lệnh thoại: “Myka ơi, gọi cho con gái tôi.” → Myka nhận diện: “Ngoại muốn gọi cho Chị Duyên đúng không ạ?” → Ngoại: “Ừ đúng rồi.” → Kết nối thành công.'
    },
    {
      id: 'CALL-003',
      elderId: 'E001',
      caller: 'Anh Trà',
      receiver: 'Ngoại (qua Robot Myka RB-001)',
      direction: 'incoming',
      status: 'connected',
      statusLabel: 'Đã kết nối',
      duration: '03:40',
      timestamp: daysAgo(1),
      tcRef: 'TC-045, TC-052',
      note: 'Anh Trà gọi tới Myka RB-001. Myka hỏi Ngoại đồng ý và thực hiện kết nối đàm thoại 2 chiều qua loa ngoài.'
    },
    {
      id: 'CALL-004',
      elderId: 'E001',
      caller: 'Chị Duyên',
      receiver: 'Ngoại (qua Robot Myka RB-001)',
      direction: 'incoming',
      status: 'rejected',
      statusLabel: 'Ngoại từ chối (Đang nghỉ)',
      duration: '00:00',
      timestamp: daysAgo(1),
      tcRef: 'TC-046, TC-052',
      note: 'Chị Duyên gọi tới Myka. Myka hỏi nhưng Ngoại từ chối: “Ngoại đang mệt, để lát nữa con.” → Myka gửi tin nhắn báo cho Chị Duyên: Ngoại đang nghỉ ngơi.'
    },
    {
      id: 'CALL-005',
      elderId: 'E001',
      caller: 'Chị Duyên',
      receiver: 'Ngoại (qua Robot Myka RB-001)',
      direction: 'incoming',
      status: 'missed',
      statusLabel: 'Cuộc gọi nhỡ',
      duration: '00:00',
      timestamp: daysAgo(2),
      tcRef: 'TC-047',
      note: 'Cuộc gọi không kết nối được sau 30 giây đổ chuông vì Ngoại không ở trong phòng.'
    },
    {
      id: 'CALL-006',
      elderId: 'E001',
      caller: 'Ngoại (qua Robot Myka RB-001)',
      receiver: 'Chị Duyên',
      direction: 'cancelled',
      status: 'cancelled',
      statusLabel: 'Ngoại hủy lệnh gọi',
      duration: '00:00',
      timestamp: daysAgo(2),
      tcRef: 'TC-038',
      note: 'Ngoại yêu cầu gọi nhưng khi Myka hỏi lại thì Ngoại đổi ý: “Không, thôi con.” → Myka hủy lệnh gọi an toàn.'
    }
  ];

  // ---- Lịch sử tin nhắn thoại & văn bản mô phỏng theo Testcase (TC-025 ~ TC-033 & TC-048 ~ TC-052) ----
  const MESSAGES_LOG = [
    {
      id: 'MSG-001',
      elderId: 'E001',
      sender: 'Ngoại (qua Robot Myka)',
      receiver: 'Chị Duyên',
      channel: 'Zalo / Telegram',
      type: 'voice',
      audioDuration: '00:06',
      text: '“Duyên ơi, hôm nay Ngoại khỏe. Khi nào rảnh con gọi cho Ngoại nhé.”',
      timestamp: minutesAgo(90),
      status: 'sent',
      statusLabel: 'Đã gửi qua Zalo',
      tcRef: 'TC-025, TC-028',
      note: 'Ngoại ra lệnh thoại: “Myka ơi, gửi tin nhắn cho con gái tôi.” → Myka bíp phát tín hiệu ghi âm → gửi trực tiếp tới điện thoại Chị Duyên.'
    },
    {
      id: 'MSG-002',
      elderId: 'E001',
      sender: 'Chị Duyên',
      receiver: 'Ngoại (qua Robot Myka)',
      channel: 'Telegram / Zalo',
      type: 'text',
      text: '“Mẹ ơi, tối nay con gọi lại nhé. Mẹ nhớ uống thuốc huyết áp lúc 8 giờ tối nghen mẹ!”',
      timestamp: minutesAgo(75),
      status: 'read_by_robot',
      statusLabel: 'Myka đã đọc cho Ngoại',
      tcRef: 'TC-048, TC-052',
      note: 'Myka thông báo bằng giọng nói: “Ngoại ơi, Chị Duyên vừa gửi tin nhắn cho Ngoại, Ngoại muốn nghe không ạ?” → Ngoại đồng ý và Myka đọc to nội dung.'
    },
    {
      id: 'MSG-003',
      elderId: 'E001',
      sender: 'Anh Trà',
      receiver: 'Ngoại (qua Robot Myka)',
      channel: 'Telegram',
      type: 'text',
      text: '“Ngoại ơi, cuối tuần này con và bé Bắp qua thăm Ngoại nhé! Ngoại thích ăn bánh gì con mua qua.”',
      timestamp: minutesAgo(120),
      status: 'stored_pending',
      statusLabel: 'Đã lưu vào Myka',
      tcRef: 'TC-049',
      note: 'Myka thông báo tin nhắn mới từ Anh Trà và lưu vào hộp thư để Ngoại nghe bất kỳ lúc nào.'
    },
    {
      id: 'MSG-004',
      elderId: 'E001',
      sender: 'Ngoại (qua Robot Myka)',
      receiver: 'Chị Duyên',
      channel: 'Zalo / Telegram',
      type: 'voice',
      audioDuration: '00:08',
      text: '“Con ơi, trưa nay Ngoại ăn cơm với canh rau ngót ngon lắm, con đừng lo cho Ngoại nhé.”',
      timestamp: daysAgo(1),
      status: 'sent',
      statusLabel: 'Đã gửi qua Zalo',
      tcRef: 'TC-031',
      note: 'Ghi âm từ micro Robot Myka và chuyển tiếp vào kênh trò chuyện gia đình.'
    },
    {
      id: 'MSG-005',
      elderId: 'E001',
      sender: 'Chị Duyên',
      receiver: 'Ngoại (qua Robot Myka)',
      channel: 'Telegram / Zalo',
      type: 'text',
      text: '“Mẹ ơi, con gửi ít sữa dinh dưỡng và trà thảo mộc, chiều chú giao hàng mang đến lễ tân nhé mẹ.”',
      timestamp: daysAgo(1),
      status: 'read_by_robot',
      statusLabel: 'Myka đã đọc cho Ngoại',
      tcRef: 'TC-052',
      note: 'Myka phát âm rõ ràng, tốc độ vừa phải phù hợp với thính lực người cao tuổi.'
    }
  ];

  // ---- Lịch sử trò chuyện chi tiết với Robot Myka trích từ Testcase TC-005 ~ TC-024 ----
  const CHAT_HISTORY = [
    {
      id: 'TC-005-1',
      elderId: 'E001',
      sender: 'elder',
      text: 'Myka ơi, hôm nay Ngoại thấy hơi buồn, con nói chuyện với Ngoại một chút được không?',
      timestamp: minutesAgo(65),
      tcRef: 'TC-005',
      note: 'Ngoại mở đầu trò chuyện bộc lộ cảm xúc buồn.'
    },
    {
      id: 'TC-005-2',
      elderId: 'E001',
      sender: 'robot',
      text: 'Dạ được ạ. Hôm nay Ngoại có muốn kể cho con nghe điều gì làm Ngoại buồn không?',
      timestamp: minutesAgo(64),
      tcRef: 'TC-005',
      note: 'Myka phản hồi ấm áp, khuyến khích tâm sự.'
    },
    {
      id: 'TC-005-3',
      elderId: 'E001',
      sender: 'elder',
      text: 'Ngoại ở nhà một mình nên thấy hơi buồn.',
      timestamp: minutesAgo(63),
      tcRef: 'TC-005'
    },
    {
      id: 'TC-005-4',
      elderId: 'E001',
      sender: 'robot',
      text: 'Con hiểu ạ. Ngoại có thể kể cho con nghe về ngày hôm nay của Ngoại. Hôm nay Ngoại đã làm những gì rồi ạ?',
      timestamp: minutesAgo(62),
      tcRef: 'TC-005'
    },
    {
      id: 'TC-005-5',
      elderId: 'E001',
      sender: 'elder',
      text: 'Sáng nay Ngoại có tưới cây rồi nấu cơm.',
      timestamp: minutesAgo(61),
      tcRef: 'TC-005'
    },
    {
      id: 'TC-005-6',
      elderId: 'E001',
      sender: 'robot',
      text: 'Nghe vui quá ạ. Ngoại chăm cây chắc cây xanh tốt lắm. Ngoại có muốn kể cho con nghe về những cây Ngoại đang trồng không?',
      timestamp: minutesAgo(60),
      tcRef: 'TC-005'
    },
    {
      id: 'TC-006-1',
      elderId: 'E001',
      sender: 'elder',
      text: 'Sáng nay Ngoại tưới cây xong thấy hơi mệt mỏi trong người con à.',
      timestamp: minutesAgo(55),
      tcRef: 'TC-006'
    },
    {
      id: 'TC-006-2',
      elderId: 'E001',
      sender: 'robot',
      text: 'Dạ, Ngoại chăm cây tốt quá ạ. Ngoại thấy mệt như vậy có chóng mặt hay khó thở không ạ? Ngoại ngồi nghỉ ngơi một chút và uống chút nước ấm nhé.',
      timestamp: minutesAgo(54),
      tcRef: 'TC-006'
    },
    {
      id: 'TC-007-1',
      elderId: 'E001',
      sender: 'elder',
      text: 'Myka ơi, hôm nay tôi thấy đau đầu quá.',
      timestamp: minutesAgo(50),
      tcRef: 'TC-007'
    },
    {
      id: 'TC-007-2',
      elderId: 'E001',
      sender: 'robot',
      text: 'Ngoại ơi, Ngoại đau đầu chỗ nào ạ? Ngoại nghỉ ngơi một chút nhé, con thương Ngoại lắm. Nếu đau nhiều hơn Ngoại nhấn nút SOS để gọi điều dưỡng Lan đến hỗ trợ ngay nhé.',
      timestamp: minutesAgo(49),
      tcRef: 'TC-007'
    },
    {
      id: 'TC-008-1',
      elderId: 'E001',
      sender: 'elder',
      text: 'Myka ơi, hôm nay trời đẹp quá. Con kể tôi nghe một câu chuyện vui đi.',
      timestamp: minutesAgo(40),
      tcRef: 'TC-008'
    },
    {
      id: 'TC-008-2',
      elderId: 'E001',
      sender: 'robot',
      text: 'Dạ được ạ! Con kể Ngoại nghe chuyện vui này nhé: Một ông lão 80 tuổi đi khám bệnh, bác sĩ khen: “Huyết áp và sức khỏe cụ tốt thật đấy, nhờ đâu vậy ạ?” Ông lão cười: “Dạ, nhờ mỗi ngày tôi đều cười thật nhiều và nghe lời con cháu ạ!” Chúc Ngoại luôn vui tươi như thế nhé! 🌸',
      timestamp: minutesAgo(39),
      tcRef: 'TC-008'
    },
    {
      id: 'TC-009-1',
      elderId: 'E001',
      sender: 'elder',
      text: 'Lâu rồi con trai tôi không gọi. Tôi ở nhà một mình nhớ con quá...',
      timestamp: minutesAgo(35),
      tcRef: 'TC-009'
    },
    {
      id: 'TC-009-2',
      elderId: 'E001',
      sender: 'robot',
      text: 'Dạ, con hiểu cảm giác nhớ con mà không dám gọi ạ. Ngoại có muốn con bấm máy gọi cho Chị Duyên hoặc con trai của Ngoại ngay bây giờ không ạ?',
      timestamp: minutesAgo(34),
      tcRef: 'TC-009'
    },
    {
      id: 'TC-014-1',
      elderId: 'E001',
      sender: 'elder',
      text: 'Myka ơi, tôi đau ngực, con kết luận giúp tôi bị bệnh gì?',
      timestamp: minutesAgo(20),
      tcRef: 'TC-014, TC-015'
    },
    {
      id: 'TC-014-2',
      elderId: 'E001',
      sender: 'robot',
      text: 'Dạ, con không thể tự chẩn đoán bệnh hay kê thuốc cho Ngoại ạ. Với triệu chứng đau ngực, con khuyên Ngoại ngồi nghỉ tĩnh tâm và con xin phép gửi thông báo khẩn cấp tới Bác sĩ Tuấn và Điều dưỡng Lan ngay ạ!',
      timestamp: minutesAgo(19),
      tcRef: 'TC-014, TC-015'
    },
    {
      id: 'TC-021-1',
      elderId: 'E001',
      sender: 'elder',
      text: 'Myka ơi, kết quả đo huyết áp gần nhất của tôi là bao nhiêu?',
      timestamp: minutesAgo(10),
      tcRef: 'TC-021'
    },
    {
      id: 'TC-021-2',
      elderId: 'E001',
      sender: 'robot',
      text: 'Dạ, kết quả đo gần nhất của Ngoại lúc 8 giờ 30 sáng là: Huyết áp tâm thu 128, huyết áp tâm trương 78 mmHg và nhịp tim 72 lần/phút. Chỉ số rất tốt và bình thường ạ!',
      timestamp: minutesAgo(9),
      tcRef: 'TC-021'
    }
  ];

  // ---- notifications đồng bộ từ các testcase ----
  const NOTIFICATIONS = [
    { id: 'NTF001', toUserId: 'U002', type: 'bp_result', title: '💓 Đo huyết áp thành công (TC-002)', detail: 'Bà Nguyễn Thị Hoa vừa hoàn thành đo: 128/78 mmHg, nhịp tim 72 bpm (Bình thường)', elderId: 'E001', timestamp: todayAt(8, 30), read: true },
    { id: 'NTF002', toUserId: 'U002', type: 'chat_summary', title: '💬 Dấu hiệu tâm lý từ Robot (TC-005, TC-009)', detail: 'Bà Hoa chia sẻ nhớ con và thấy hơi buồn. Myka đã động viên và an ủi bà.', elderId: 'E001', timestamp: minutesAgo(35), read: false },
    { id: 'NTF003', toUserId: 'U003', type: 'sos', title: '🚨 Cảnh báo khẩn cấp SOS (P101)', detail: 'Ngoại bấm nút SOS trên Myka lúc ' + new Date(Date.now() - 30*60000).toLocaleTimeString('vi-VN') + '. Điều dưỡng Lan đã xử lý ổn định.', elderId: 'E001', timestamp: minutesAgo(30), read: true },
    { id: 'NTF004', toUserId: 'U004', type: 'bp_alert', title: '⚠️ Bệnh nhân có huyết áp dao động (TC-010)', detail: 'Bà Nguyễn Thị Hoa: 145/90 mmHg. Bác sĩ Tuấn đã ghi nhận theo dõi thêm.', elderId: 'E001', timestamp: daysAgo(1), read: true },
    { id: 'NTF005', toUserId: 'U002', type: 'call_summary', title: '📞 Cuộc gọi thoại thành công (TC-034)', detail: 'Cuộc gọi 2 chiều giữa Chị Duyên và Ngoại qua Myka kéo dài 8 phút 15 giây.', elderId: 'E001', timestamp: minutesAgo(45), read: false },
    { id: 'NTF006', toUserId: 'U002', type: 'voice_msg', title: '🎙️ Tin nhắn thoại mới từ Ngoại (TC-025)', detail: 'Ngoại gửi tin nhắn thoại 6s qua Zalo: “Duyên ơi, hôm nay Ngoại khỏe...”', elderId: 'E001', timestamp: minutesAgo(90), read: true },
  ];

  // ---- audit log ----
  const AUDIT_LOG = [
    { id: 'A001', userId: 'U003', userName: 'Nguyễn Thị Lan', action: 'Xác nhận SOS', detail: 'Xử lý cảnh báo SOS của Bà Nguyễn Thị Hoa tại P101', timestamp: minutesAgo(27) },
    { id: 'A002', userId: 'U004', userName: 'BS. Phạm Minh Tuấn', action: 'Đánh giá huyết áp', detail: 'Xem xét kết quả đo 145/90 và hướng dẫn điều dưỡng Lan', timestamp: daysAgo(1) },
    { id: 'A003', userId: 'U001', userName: 'Ngoại (Bà Nguyễn Thị Hoa)', action: 'Đo huyết áp', detail: 'Đo trên thiết bị Myka: 128/78 mmHg, nhịp tim: 72 bpm', timestamp: todayAt(8, 30) },
    { id: 'A004', userId: 'U002', userName: 'Chị Duyên', action: 'Gọi điện qua Myka', detail: 'Thực hiện cuộc gọi 8 phút 15 giây tới phòng P101', timestamp: minutesAgo(45) },
  ];

  // ---- operator tasks ----
  const OPERATOR_TASKS = [
    { id: 'OT001', type: 'maintenance', deviceId: 'RB-003', title: 'Bảo trì pin thiết bị Myka RB-003', status: 'In Progress', priority: 'high', assignedTo: 'Lê Minh Khoa', createdAt: minutesAgo(90), dueAt: daysAgo(-1) },
    { id: 'OT002', type: 'setup', deviceId: 'RB-004', title: 'Cài đặt thiết bị Myka RB-004 cho phòng mới', status: 'Pending', priority: 'medium', assignedTo: 'Lê Minh Khoa', createdAt: daysAgo(1), dueAt: daysAgo(-2) },
    { id: 'OT003', type: 'update', deviceId: 'RB-001', title: 'Kiểm tra độ nhạy mic thoại Myka RB-001', status: 'Completed', priority: 'low', assignedTo: 'Lê Minh Khoa', createdAt: daysAgo(2), dueAt: daysAgo(1) },
  ];

  // ---- channels ----
  const CHANNELS = [
    { id: 'CH001', type: 'Zalo / Telegram', name: 'Kênh kết nối gia đình Ngoại (Chị Duyên)', status: 'Active', linked: 'Myka RB-001 • P101', messages: 142 },
    { id: 'CH002', type: 'Zalo', name: 'Kênh cảnh báo Điều dưỡng trực viện', status: 'Active', linked: 'Toàn bộ điều dưỡng ca trực', messages: 45 },
    { id: 'CH003', type: 'SMS',  name: 'Kênh nhắc uống thuốc & đo huyết áp', status: 'Active', linked: 'Tất cả người cao tuổi', messages: 920 },
  ];

  // ---- seedData với version tag mới để tự động cập nhật dữ liệu testcase ----
  const SEED_VERSION = 'rts_seeded_tc001_053_v2';
  function seedData(force) {
    if (!force && LS.get('rts_seed_ver') === SEED_VERSION) return;

    LS.set('rts_users', USERS);
    LS.set('rts_elders', ELDERS);
    LS.set('rts_bp_readings', getInitialBP());
    LS.set('rts_schedules', SCHEDULES);
    LS.set('rts_sos_events', SOS_EVENTS);
    LS.set('rts_alerts', ALERTS);
    LS.set('rts_devices', DEVICES);
    LS.set('rts_tenants', TENANTS);
    LS.set('rts_care_groups', CARE_GROUPS);
    LS.set('rts_audit_log', AUDIT_LOG);
    LS.set('rts_operator_tasks', OPERATOR_TASKS);
    LS.set('rts_channels', CHANNELS);
    LS.set('rts_chat_history', CHAT_HISTORY);
    LS.set('rts_notifications', NOTIFICATIONS);
    LS.set('rts_call_logs', CALL_LOGS);
    LS.set('rts_messages_log', MESSAGES_LOG);
    LS.set('rts_seed_ver', SEED_VERSION);
    LS.set('rts_seeded', true);
  }

  seedData();

  // ---- expose globals ----
  window.RTS = {
    LS,
    getUsers:    () => LS.get('rts_users')    || [],
    getElders:   () => LS.get('rts_elders')   || [],
    resetSeed:   () => { localStorage.clear(); seedData(true); location.reload(); },
    getBP:       (elderId) => (LS.get('rts_bp_readings') || []).filter(r => r.elderId === elderId),
    getAllBP:    () => LS.get('rts_bp_readings') || [],
    addBP:      (r) => { const all = LS.get('rts_bp_readings') || []; all.push(r); LS.set('rts_bp_readings', all); },
    getSchedules:(elderId) => (LS.get('rts_schedules') || []).filter(s => s.elderId === elderId),
    getAllSchedules: () => LS.get('rts_schedules') || [],
    updateSchedule: (id, data) => {
      const all = LS.get('rts_schedules') || [];
      const idx = all.findIndex(s => s.id === id);
      if (idx >= 0) { all[idx] = { ...all[idx], ...data }; LS.set('rts_schedules', all); }
    },
    addSchedule: (s) => { const all = LS.get('rts_schedules') || []; all.push(s); LS.set('rts_schedules', all); },
    getSOS:      () => LS.get('rts_sos_events') || [],
    addSOS:      (e) => { const all = LS.get('rts_sos_events') || []; all.unshift(e); LS.set('rts_sos_events', all); },
    getAlerts:   () => LS.get('rts_alerts') || [],
    addAlert:    (a) => { const all = LS.get('rts_alerts') || []; all.unshift(a); LS.set('rts_alerts', all); },
    updateAlert: (id, data) => {
      const all = LS.get('rts_alerts') || [];
      const idx = all.findIndex(a => a.id === id);
      if (idx >= 0) { all[idx] = { ...all[idx], ...data }; LS.set('rts_alerts', all); }
    },
    getDevices:  () => LS.get('rts_devices') || [],
    getTenants:  () => LS.get('rts_tenants') || [],
    getCareGroups: () => LS.get('rts_care_groups') || [],
    getCareGroup: (elderId) => (LS.get('rts_care_groups') || []).find(g => g.elderId === elderId),
    addCareGroupMessage: (groupId, msg) => {
      const all = LS.get('rts_care_groups') || [];
      const idx = all.findIndex(g => g.id === groupId);
      if (idx >= 0) { all[idx].messages.push(msg); LS.set('rts_care_groups', all); }
    },
    getAuditLog: () => LS.get('rts_audit_log') || [],
    addAuditLog: (entry) => { const all = LS.get('rts_audit_log') || []; all.unshift(entry); LS.set('rts_audit_log', all); },
    getOperatorTasks: () => LS.get('rts_operator_tasks') || [],
    getChannels: () => LS.get('rts_channels') || [],
    getChatHistory: (elderId) => (LS.get('rts_chat_history') || []).filter(c => c.elderId === elderId),
    addChatHistory: (msg) => { const all = LS.get('rts_chat_history') || []; all.push(msg); LS.set('rts_chat_history', all); },
    getNotifications: (userId) => (LS.get('rts_notifications') || []).filter(n => !userId || n.toUserId === userId || n.toRole === userId),
    addNotification: (notif) => { const all = LS.get('rts_notifications') || []; all.unshift(notif); LS.set('rts_notifications', all); },
    
    // ---- Calls (TC-034 ~ TC-053) ----
    getCalls: (elderId) => (LS.get('rts_call_logs') || []).filter(c => !elderId || c.elderId === elderId),
    addCall: (call) => { const all = LS.get('rts_call_logs') || []; all.unshift(call); LS.set('rts_call_logs', all); },

    // ---- Messages & Voice messages (TC-025 ~ TC-033, TC-048 ~ TC-052) ----
    getMessages: (elderId) => (LS.get('rts_messages_log') || []).filter(m => !elderId || m.elderId === elderId),
    addMessage: (msg) => { const all = LS.get('rts_messages_log') || []; all.unshift(msg); LS.set('rts_messages_log', all); },

    // Role-based elder access: returns array of elders this user can see
    getAccessibleElders: (user) => {
      const allElders = LS.get('rts_elders') || [];
      if (!user) return [];
      if (user.role === 'elder') return allElders.filter(e => e.id === user.elderId);
      if (user.role === 'family') return allElders.filter(e => e.id === user.elderId);
      if (user.role === 'caregiver') return allElders.filter(e => e.assignedNurse === user.nurseId);
      if (user.role === 'doctor') return allElders.filter(e => e.assignedDoctor === user.doctorId);
      if (user.role === 'admin' || user.role === 'operator') return allElders;
      return [];
    },
    // format helpers
    formatTime: (iso) => {
      if (!iso) return '-';
      const d = new Date(iso);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    },
    formatDateTime: (iso) => {
      if (!iso) return '-';
      const d = new Date(iso);
      return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },
    formatDate: (iso) => {
      if (!iso) return '-';
      const d = new Date(iso);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },
    timeAgo: (iso) => {
      if (!iso) return '-';
      const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
      if (diff < 1) return 'Vừa xong';
      if (diff < 60) return `${diff} phút trước`;
      const h = Math.floor(diff / 60);
      if (h < 24) return `${h} giờ trước`;
      return `${Math.floor(h / 24)} ngày trước`;
    },
    bpStatus: (systolic) => {
      if (systolic >= 140) return 'critical';
      if (systolic >= 130) return 'warning';
      return 'normal';
    },
    // ---- Backend API & Configuration ----
    API_URL: 'http://127.0.0.1:8000/api',

    // Connectivity state helper (Bluetooth & Wi-Fi RUD)
    getConnectivity: (elderId) => {
      const saved = LS.get('rts_connectivity_' + elderId);
      if (saved) return saved;
      return {
        wifi_ssid: 'Nha_Ngoai_2.4G',
        wifi_password: '••••••••',
        wifi_ip: '192.168.1.88',
        wifi_signal: 95,
        wifi_frequency: '2.4GHz',
        wifi_status: 'connected',
        bluetooth_status: 'connected',
        paired_devices: [
          { id: 'DEV-BLE-01', name: 'Robot Myka Companion #P101', type: 'robot', status: 'connected', signal: -52 },
          { id: 'DEV-BLE-02', name: 'Máy đo Huyết Áp Omron BLE-8821', type: 'sphygmomanometer', status: 'connected', signal: -64 }
        ],
        last_updated: new Date().toISOString()
      };
    },
    saveConnectivity: (elderId, data) => {
      LS.set('rts_connectivity_' + elderId, data);
    },

    // Telegram chat history helper (synced from Telegram)
    getTelegramChatHistory: (elderId) => {
      const saved = LS.get('rts_telegram_chats_' + elderId);
      if (saved) return saved;
      return [
        { id: "TGC-001", sender: "elder", sender_name: "Bà Hoa (Ngoại)", message: "Myka ơi, hôm nay thời tiết thế nào con?", source: "telegram_voice_stt", timestamp: "2026-10-20T08:00:00Z" },
        { id: "TGC-002", sender: "robot", sender_name: "Robot Myka", message: "Dạ chào Ngoại! Hôm nay trời mát mẻ 27 độ C, gió nhẹ. Ngoại nhớ ăn sáng và uống đủ nước nha Ngoại! 😊", source: "telegram_bot", timestamp: "2026-10-20T08:00:15Z" },
        { id: "TGC-003", sender: "elder", sender_name: "Bà Hoa (Ngoại)", message: "Trưa nay con Duyên có ghé ăn cơm với Ngoại không?", source: "telegram_voice_stt", timestamp: "2026-10-20T09:30:00Z" },
        { id: "TGC-004", sender: "robot", sender_name: "Robot Myka", message: "Dạ có ạ! Chị Duyên vừa gửi tin nhắn qua kênh Telegram báo trưa nay 11h30 sẽ về ăn cơm và mang bánh cho Ngoại ạ! ❤️", source: "telegram_bot", timestamp: "2026-10-20T09:30:20Z" },
        { id: "TGC-005", sender: "elder", sender_name: "Bà Hoa (Ngoại)", message: "Hôm nay Ngoại hơi mệt trong người, chóng mặt nhẹ...", source: "telegram_voice_stt", timestamp: "2026-10-20T10:15:00Z" },
        { id: "TGC-006", sender: "robot", sender_name: "Robot Myka", message: "Dạ Ngoại ơi, Ngoại ngồi nghỉ ngơi trên giường giúp Myka nhé! Myka đã gửi thông báo đến Chị Duyên và Điều dưỡng Lan rồi ạ. Nếu Ngoại cần gấp, bấm nút SOS đỏ ngay nha Ngoại!", source: "telegram_bot", timestamp: "2026-10-20T10:15:25Z" },
        { id: "TGC-007", sender: "elder", sender_name: "Bà Hoa (Ngoại)", message: "Kể chuyện vui ngày xưa cho Ngoại nghe đỡ buồn đi Myka.", source: "telegram_voice_stt", timestamp: "2026-10-21T08:30:00Z" },
        { id: "TGC-008", sender: "robot", sender_name: "Robot Myka", message: "Dạ, để Myka kể chuyện ngày mùa ở quê cho Ngoại nghe nhé... Ngoại thấy vui hơn chưa ạ? 😊", source: "telegram_bot", timestamp: "2026-10-21T08:30:30Z" }
      ];
    },

    // Telegram medical consultation info (Official Telegram Channel)
    getTelegramConsultation: () => {
      return {
        group_name: "Kênh Tư Vấn Y Tế - Bà Nguyễn Thị Hoa (P101)",
        telegram_link: "https://t.me/myka_care_p101_bot",
        qr_code_url: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://t.me/myka_care_p101_bot",
        bot_username: "@myka_care_p101_bot",
        members: [
          { role: "Bác sĩ tim mạch", name: "BS. Phạm Minh Tuấn", avatar: "👨‍⚕️" },
          { role: "Điều dưỡng P101", name: "ĐD. Nguyễn Thị Lan", avatar: "👩‍⚕️" },
          { role: "Người thân trực tiếp", name: "Chị Duyên", avatar: "👩" }
        ],
        guidelines: "Kênh tư vấn y khoa chính thức. Không trao đổi riêng tư trong app nhằm bảo đảm bảo mật hồ sơ và quy định pháp lý y tế."
      };
    },

    genId: () => 'ID' + Math.random().toString(36).substr(2, 9).toUpperCase(),
  };
})();
