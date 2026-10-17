// ============================================================
// data.js - Mock data, localStorage helpers, initial seed
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
    { id: 'E001', name: 'Bà Nguyễn Thị Hoa', age: 72, room: 'P101', avatar: '👵', linkedFamily: 'F001', assignedNurse: 'N001', assignedDoctor: 'D001', deviceId: 'RB-001' },
    { id: 'E002', name: 'Ông Trần Văn Nam',   age: 68, room: 'P102', avatar: '👴', linkedFamily: 'F002', assignedNurse: 'N001', assignedDoctor: 'D001', deviceId: 'RB-002' },
    { id: 'E003', name: 'Bà Lê Thị Mai',      age: 75, room: 'P103', avatar: '👵', linkedFamily: 'F003', assignedNurse: 'N001', assignedDoctor: 'D001', deviceId: 'RB-003' },
  ];

  // ---- generate BP readings for elder ----
  function genBP(elderId, days) {
    const readings = [];
    for (let i = days; i >= 0; i--) {
      const systolic  = Math.floor(Math.random() * 35) + 110;  // 110-145
      const diastolic = Math.floor(Math.random() * 22) + 70;   // 70-92
      const heartRate = Math.floor(Math.random() * 22) + 63;   // 63-85
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(9, 0, 0, 0);
      readings.push({
        id: `BP-${elderId}-${i}`,
        elderId,
        systolic,
        diastolic,
        heartRate,
        timestamp: date.toISOString(),
        status: systolic >= 140 ? 'critical' : systolic >= 130 ? 'warning' : 'normal',
        recordedBy: 'device',
      });
    }
    return readings;
  }

  // ---- BP for E002 - force one high reading ----
  function genBPE002() {
    const readings = genBP('E002', 6);
    // yesterday reading high
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(14, 0, 0, 0);
    readings.push({
      id: 'BP-E002-HIGH',
      elderId: 'E002',
      systolic: 158,
      diastolic: 96,
      heartRate: 88,
      timestamp: yesterday.toISOString(),
      status: 'critical',
      recordedBy: 'device',
    });
    return readings;
  }

  // ---- schedules ----
  const SCHEDULES = [
    { id: 'SCH001', elderId: 'E001', type: 'medication', time: todayAt(8, 0),  title: 'Uống thuốc huyết áp', detail: 'Amlodipine 5mg - 1 viên', icon: '💊', confirmed: false },
    { id: 'SCH002', elderId: 'E001', type: 'bp',         time: todayAt(9, 0),  title: 'Đo huyết áp buổi sáng', detail: 'Đo và ghi kết quả', icon: '💓', confirmed: false },
    { id: 'SCH003', elderId: 'E001', type: 'medication', time: todayAt(12, 0), title: 'Uống thuốc tiểu đường', detail: 'Metformin 500mg - 1 viên', icon: '💊', confirmed: false },
    { id: 'SCH004', elderId: 'E001', type: 'bp',         time: todayAt(14, 0), title: 'Đo huyết áp buổi chiều', detail: 'Đo và ghi kết quả', icon: '💓', confirmed: false },
    { id: 'SCH005', elderId: 'E001', type: 'medication', time: todayAt(20, 0), title: 'Uống thuốc ngủ', detail: 'Melatonin 3mg - 1 viên', icon: '💊', confirmed: false },
    { id: 'SCH006', elderId: 'E002', type: 'medication', time: todayAt(8, 30), title: 'Uống thuốc huyết áp', detail: 'Losartan 50mg - 1 viên', icon: '💊', confirmed: false },
    { id: 'SCH007', elderId: 'E002', type: 'bp',         time: todayAt(9, 30), title: 'Đo huyết áp', detail: 'Đo và ghi kết quả', icon: '💓', confirmed: false },
    { id: 'SCH008', elderId: 'E003', type: 'appointment',time: todayAt(10, 0), title: 'Khám định kỳ', detail: 'BS. Phạm Minh Tuấn - Phòng khám 2', icon: '🏥', confirmed: false },
  ];

  // ---- SOS events ----
  const SOS_EVENTS = [
    {
      id: 'SOS001',
      elderId: 'E001',
      elderName: 'Bà Nguyễn Thị Hoa',
      timestamp: minutesAgo(30),
      status: 'responded',
      respondedBy: 'N001',
      respondedName: 'Nguyễn Thị Lan (Điều dưỡng)',
      respondedAt: minutesAgo(27),
      note: 'Bà bị chóng mặt nhẹ, đã được kiểm tra và ổn định.',
    },
  ];

  // ---- alerts ----
  const ALERTS = [
    {
      id: 'ALT001',
      elderId: 'E002',
      elderName: 'Ông Trần Văn Nam',
      type: 'bp_high',
      title: 'Huyết áp cao bất thường',
      detail: 'Huyết áp tâm thu 158 mmHg - Vượt ngưỡng an toàn',
      timestamp: daysAgo(1),
      severity: 'critical',
      status: 'pending',
      riskLevel: 'Cao',
    },
    {
      id: 'ALT002',
      elderId: 'E001',
      elderName: 'Bà Nguyễn Thị Hoa',
      type: 'medication_missed',
      title: 'Bỏ lỡ uống thuốc',
      detail: 'Chưa xác nhận uống Amlodipine 5mg lúc 08:00',
      timestamp: daysAgo(0),
      severity: 'warning',
      status: 'pending',
      riskLevel: 'Trung bình',
    },
  ];

  // ---- users ----
  const USERS = [
    { id: 'U001', role: 'elder',    email: 'nguoicaotuoi@demo.com', password: '123456', name: 'Bà Nguyễn Thị Hoa', elderId: 'E001', avatar: '👵' },
    { id: 'U002', role: 'family',   email: 'nguoithan@demo.com',    password: '123456', name: 'Chị Nguyễn Thu Hương', elderId: 'E001', familyId: 'F001', avatar: '👩' },
    { id: 'U003', role: 'caregiver',email: 'dieuduong@demo.com',    password: '123456', name: 'Nguyễn Thị Lan', nurseId: 'N001', avatar: '👩‍⚕️', department: 'Điều dưỡng tổng hợp' },
    { id: 'U004', role: 'doctor',   email: 'bacsi@demo.com',        password: '123456', name: 'BS. Phạm Minh Tuấn', doctorId: 'D001', avatar: '👨‍⚕️', department: 'Tim mạch - Huyết áp' },
    { id: 'U005', role: 'admin',    email: 'admin@demo.com',        password: '123456', name: 'Trần Quốc Bảo', avatar: '🧑‍💼', department: 'Quản trị hệ thống' },
    { id: 'U006', role: 'operator', email: 'operator@demo.com',     password: '123456', name: 'Lê Minh Khoa', avatar: '🧑‍💻', department: 'Vận hành & Kỹ thuật' },
  ];

  // ---- devices ----
  const DEVICES = [
    { id: 'RB-001', model: 'RobotCare Pro 2024', elderId: 'E001', elderName: 'Bà Nguyễn Thị Hoa', status: 'Active', battery: 82, connectivity: 'WiFi', lastPing: minutesAgo(2), firmwareVersion: 'v2.4.1', location: 'Phòng P101' },
    { id: 'RB-002', model: 'RobotCare Pro 2024', elderId: 'E002', elderName: 'Ông Trần Văn Nam', status: 'Active', battery: 65, connectivity: 'WiFi', lastPing: minutesAgo(5), firmwareVersion: 'v2.4.1', location: 'Phòng P102' },
    { id: 'RB-003', model: 'RobotCare Pro 2024', elderId: 'E003', elderName: 'Bà Lê Thị Mai', status: 'Maintenance', battery: 20, connectivity: 'Offline', lastPing: minutesAgo(120), firmwareVersion: 'v2.3.9', location: 'Phòng P103' },
    { id: 'RB-004', model: 'RobotCare Pro 2024', elderId: null, elderName: null, status: 'Offline', battery: 100, connectivity: 'Offline', lastPing: daysAgo(3), firmwareVersion: 'v2.4.1', location: 'Kho thiết bị' },
  ];

  // ---- tenants ----
  const TENANTS = [
    { id: 'T001', name: 'Trung tâm Dưỡng lão Hà Nội', code: 'DYLN-HN', status: 'Active', elders: 45, devices: 48, plan: 'Enterprise', contactEmail: 'admin@dyln-hn.vn', phone: '024.3456.7890' },
    { id: 'T002', name: 'Viện Dưỡng lão Thành phố HCM', code: 'VDL-HCM', status: 'Active', elders: 120, devices: 125, plan: 'Enterprise', contactEmail: 'admin@vdl-hcm.vn', phone: '028.3456.7890' },
    { id: 'T003', name: 'Nhà dưỡng lão Đà Nẵng', code: 'NDL-DN', status: 'Trial', elders: 15, devices: 15, plan: 'Standard', contactEmail: 'admin@ndl-dn.vn', phone: '0236.3456.789' },
  ];

  // ---- care groups ----
  const CARE_GROUPS = [
    {
      id: 'CG001',
      elderId: 'E001',
      elderName: 'Bà Nguyễn Thị Hoa',
      members: [
        { id: 'U002', name: 'Chị Nguyễn Thu Hương', role: 'family', avatar: '👩' },
        { id: 'U003', name: 'Nguyễn Thị Lan', role: 'caregiver', avatar: '👩‍⚕️' },
        { id: 'U004', name: 'BS. Phạm Minh Tuấn', role: 'doctor', avatar: '👨‍⚕️' },
      ],
      messages: [
        { id: 'M001', userId: 'U002', userName: 'Chị Nguyễn Thu Hương', role: 'family', avatar: '👩', text: 'Chào buổi sáng! Hôm nay mẹ tôi có ổn không ạ? Huyết áp của mẹ hôm qua hơi cao.', timestamp: daysAgo(0), type: 'message' },
        { id: 'M002', userId: 'U003', userName: 'Nguyễn Thị Lan', role: 'caregiver', avatar: '👩‍⚕️', text: 'Chào chị! Sáng nay bà Hoa khỏe, đã uống thuốc đúng giờ. Huyết áp 8 giờ là 122/78, bình thường ạ.', timestamp: daysAgo(0), type: 'message' },
        { id: 'M003', userId: 'U004', userName: 'BS. Phạm Minh Tuấn', role: 'doctor', avatar: '👨‍⚕️', text: 'Tôi đã xem kết quả huyết áp 7 ngày gần đây. Bà Hoa ổn định, tiếp tục dùng thuốc hiện tại. Hẹn khám định kỳ tuần sau.', timestamp: daysAgo(0), type: 'message' },
        { id: 'M004', userId: 'U002', userName: 'Chị Nguyễn Thu Hương', role: 'family', avatar: '👩', text: 'Cảm ơn bác sĩ và điều dưỡng đã chăm sóc mẹ tôi ạ! 🙏', timestamp: daysAgo(0), type: 'message' },
      ],
    },
    {
      id: 'CG002',
      elderId: 'E002',
      elderName: 'Ông Trần Văn Nam',
      members: [
        { id: 'U_F002', name: 'Anh Trần Văn Minh', role: 'family', avatar: '👨' },
        { id: 'U003', name: 'Nguyễn Thị Lan', role: 'caregiver', avatar: '👩‍⚕️' },
        { id: 'U004', name: 'BS. Phạm Minh Tuấn', role: 'doctor', avatar: '👨‍⚕️' },
      ],
      messages: [
        { id: 'M005', userId: 'U003', userName: 'Nguyễn Thị Lan', role: 'caregiver', avatar: '👩‍⚕️', text: '⚠️ Báo cáo: Huyết áp ông Nam chiều qua đo được 158/96 mmHg - vượt ngưỡng an toàn. Đã thông báo bác sĩ.', timestamp: daysAgo(1), type: 'alert' },
        { id: 'M006', userId: 'U004', userName: 'BS. Phạm Minh Tuấn', role: 'doctor', avatar: '👨‍⚕️', text: 'Đã nhận thông tin. Tôi sẽ điều chỉnh phác đồ điều trị. Điều dưỡng theo dõi chặt và đo lại 2 tiếng/lần.', timestamp: daysAgo(1), type: 'message' },
      ],
    },
  ];

  // ---- audit log ----
  const AUDIT_LOG = [
    { id: 'A001', userId: 'U003', userName: 'Nguyễn Thị Lan', action: 'Xác nhận SOS', detail: 'Xử lý cảnh báo SOS của Bà Nguyễn Thị Hoa', timestamp: minutesAgo(27) },
    { id: 'A002', userId: 'U004', userName: 'BS. Phạm Minh Tuấn', action: 'Cập nhật đơn thuốc', detail: 'Điều chỉnh liều Amlodipine cho Bà Nguyễn Thị Hoa', timestamp: daysAgo(1) },
    { id: 'A003', userId: 'U005', userName: 'Trần Quốc Bảo', action: 'Thêm thiết bị', detail: 'Kích hoạt thiết bị RB-003 cho Bà Lê Thị Mai', timestamp: daysAgo(2) },
    { id: 'A004', userId: 'U006', userName: 'Lê Minh Khoa', action: 'Bảo trì thiết bị', detail: 'Đưa thiết bị RB-003 vào chế độ bảo trì', timestamp: minutesAgo(90) },
    { id: 'A005', userId: 'U003', userName: 'Nguyễn Thị Lan', action: 'Ghi nhận huyết áp', detail: 'Ghi nhận huyết áp cao 158/96 của Ông Trần Văn Nam', timestamp: daysAgo(1) },
  ];

  // ---- operator tasks ----
  const OPERATOR_TASKS = [
    { id: 'OT001', type: 'maintenance', deviceId: 'RB-003', title: 'Bảo trì pin thiết bị RB-003', status: 'In Progress', priority: 'high', assignedTo: 'Lê Minh Khoa', createdAt: minutesAgo(90), dueAt: daysAgo(-1) },
    { id: 'OT002', type: 'setup', deviceId: 'RB-004', title: 'Cài đặt thiết bị RB-004 cho người dùng mới', status: 'Pending', priority: 'medium', assignedTo: 'Lê Minh Khoa', createdAt: daysAgo(1), dueAt: daysAgo(-2) },
    { id: 'OT003', type: 'update', deviceId: 'RB-002', title: 'Cập nhật firmware RB-002 lên v2.4.2', status: 'Pending', priority: 'low', assignedTo: 'Lê Minh Khoa', createdAt: daysAgo(0), dueAt: daysAgo(-3) },
  ];

  // ---- channels ----
  const CHANNELS = [
    { id: 'CH001', type: 'Zalo', name: 'Thông báo chăm sóc', status: 'Active', linked: 'Nhóm gia đình Bà Nguyễn Thị Hoa', messages: 127 },
    { id: 'CH002', type: 'Zalo', name: 'Cảnh báo khẩn cấp', status: 'Active', linked: 'Toàn bộ điều dưỡng', messages: 34 },
    { id: 'CH003', type: 'SMS',  name: 'Nhắc nhở uống thuốc', status: 'Active', linked: 'Tất cả người cao tuổi', messages: 892 },
    { id: 'CH004', type: 'Email', name: 'Báo cáo hàng tuần', status: 'Inactive', linked: 'Bác sĩ & Quản trị', messages: 12 },
  ];

  // ---- seed if not already done ----
  function seedData() {
    if (LS.get('rts_seeded')) return;

    const bp = [
      ...genBP('E001', 6),
      ...genBPE002(),
      ...genBP('E003', 6),
    ];

    LS.set('rts_users', USERS);
    LS.set('rts_elders', ELDERS);
    LS.set('rts_bp_readings', bp);
    LS.set('rts_schedules', SCHEDULES);
    LS.set('rts_sos_events', SOS_EVENTS);
    LS.set('rts_alerts', ALERTS);
    LS.set('rts_devices', DEVICES);
    LS.set('rts_tenants', TENANTS);
    LS.set('rts_care_groups', CARE_GROUPS);
    LS.set('rts_audit_log', AUDIT_LOG);
    LS.set('rts_operator_tasks', OPERATOR_TASKS);
    LS.set('rts_channels', CHANNELS);
    LS.set('rts_seeded', true);
  }

  seedData();

  // ---- expose globals ----
  window.RTS = {
    LS,
    // helpers
    getUsers:    () => LS.get('rts_users')    || [],
    getElders:   () => LS.get('rts_elders')   || [],
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
    bpLabel: (systolic) => {
      if (systolic >= 140) return 'Cao - Nguy hiểm';
      if (systolic >= 130) return 'Cao - Cần theo dõi';
      return 'Bình thường';
    },
    genId: () => 'ID' + Math.random().toString(36).substr(2, 9).toUpperCase(),
  };
})();
