// ============================================================
// pages/family.js - Family Dashboard (fixed Recharts access)
// ============================================================
(function () {

  function AddScheduleModal({ onClose, onAdd }) {
    const [form, setForm] = React.useState({ type: 'medication', title: '', detail: '', time: '08:00', icon: '💊' });
    function handleSubmit(e) {
      e.preventDefault();
      const today = new Date();
      const [h, m] = form.time.split(':');
      today.setHours(parseInt(h), parseInt(m), 0, 0);
      const s = { id: RTS.genId(), elderId: 'E001', ...form, time: today.toISOString(), confirmed: false };
      RTS.addSchedule(s);
      onAdd();
      onClose();
    }
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 fade-in">
          <h3 className="text-xl font-bold text-slate-800 mb-5">➕ Thêm lịch chăm sóc</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Loại</label>
              <select value={form.type} onChange={e => {
                const icons = { medication: '💊', bp: '💓', appointment: '🏥', activity: '🏃' };
                setForm(f => ({ ...f, type: e.target.value, icon: icons[e.target.value] || '📌' }));
              }} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-400">
                <option value="medication">💊 Uống thuốc</option>
                <option value="bp">💓 Đo huyết áp</option>
                <option value="appointment">🏥 Lịch hẹn khám</option>
                <option value="activity">🏃 Hoạt động</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Tên hoạt động..." className="w-full px-3 py-2 border border-slate-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chi tiết</label>
              <input type="text" value={form.detail} onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
                placeholder="Liều lượng, địa điểm..." className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Giờ</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" required />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50">Huỷ</button>
              <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">Thêm lịch</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function ServiceModal({ onClose }) {
    const plans = ['Tiêu chuẩn', 'Nâng cao', 'Cao cấp'];
    const [selected, setSelected] = React.useState('Nâng cao');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 fade-in">
          <h3 className="text-xl font-bold text-slate-800 mb-2">💎 Nâng cấp gói dịch vụ</h3>
          <p className="text-slate-500 text-sm mb-4">Gói hiện tại: <strong>Tiêu chuẩn</strong></p>
          <div className="space-y-3 mb-5">
            {plans.map(p => (
              <label key={p} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer ${selected === p ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                <input type="radio" name="plan" value={p} checked={selected === p} onChange={() => setSelected(p)} />
                <span className="font-medium text-slate-700">{p}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl">Huỷ</button>
            <button onClick={onClose} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium">Xác nhận nâng cấp</button>
          </div>
        </div>
      </div>
    );
  }

  function FamilyDashboard({ user, onLogout }) {
    // Recharts accessed inside component - safe
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = window.Recharts || {};

    // Use elderId from logged-in user (1:1 relationship)
    const myElderId = user.elderId || 'E001';

    const [activeTab, setActiveTab] = React.useState('overview');
    const [bpData, setBpData] = React.useState([]);
    const [schedules, setSchedules] = React.useState([]);
    const [alerts, setAlerts] = React.useState([]);
    const [sos, setSos] = React.useState([]);
    const [notifications, setNotifications] = React.useState([]);
    const [chatHistory, setChatHistory] = React.useState([]);
    const [showAddSchedule, setShowAddSchedule] = React.useState(false);
    const [showService, setShowService] = React.useState(false);
    const [showCall, setShowCall] = React.useState(false);

    const [calls, setCalls] = React.useState([]);
    const [messagesLog, setMessagesLog] = React.useState([]);
    const [newMsgText, setNewMsgText] = React.useState('');

    React.useEffect(() => {
      const bp = RTS.getBP(myElderId).slice(-7).map(r => ({
        date: new Date(r.timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        'Tâm thu': r.systolic,
        'Tâm trương': r.diastolic,
        'Nhịp tim': r.heartRate,
        status: r.status,
        tcRef: r.tcRef,
        note: r.note,
      }));
      setBpData(bp);
      setSchedules(RTS.getSchedules(myElderId));
      setAlerts(RTS.getAlerts().filter(a => a.elderId === myElderId));
      setSos(RTS.getSOS().filter(s => s.elderId === myElderId));
      setNotifications(RTS.getNotifications(user.id));
      setChatHistory(RTS.getChatHistory(myElderId));
      setCalls(RTS.getCalls(myElderId));
      setMessagesLog(RTS.getMessages(myElderId));
    }, []);

    function refreshSchedules() { setSchedules(RTS.getSchedules(myElderId)); }
    function refreshCalls() { setCalls(RTS.getCalls(myElderId)); }
    function refreshMessages() { setMessagesLog(RTS.getMessages(myElderId)); }

    function handleSendMsgToRobot(e) {
      e.preventDefault();
      if (!newMsgText.trim()) return;
      const m = {
        id: RTS.genId(),
        elderId: myElderId,
        sender: 'Chị Duyên',
        receiver: 'Ngoại (qua Robot Myka)',
        channel: 'Telegram / Zalo',
        type: 'text',
        text: `“${newMsgText.trim()}”`,
        timestamp: new Date().toISOString(),
        status: 'read_by_robot',
        statusLabel: 'Myka đã phát âm cho Ngoại',
        tcRef: 'TC-048, TC-052',
        note: 'Tin nhắn gửi từ App Chị Duyên. Robot Myka phát âm: “Ngoại ơi, Chị Duyên vừa gửi tin nhắn, con đọc Ngoại nghe nhé!”'
      };
      RTS.addMessage(m);
      setNewMsgText('');
      refreshMessages();
      alert('Đã gửi tin nhắn tới Robot Myka! Myka sẽ đọc to cho Ngoại nghe.');
    }

    const latestBP = RTS.getBP(myElderId).slice(-1)[0];
    const elder = RTS.getElders().find(e => e.id === myElderId);
    const unreadNotifs = notifications.filter(n => !n.read).length;

    const TABS = [
      { id: 'overview', label: '🏠 Tổng quan' },
      { id: 'calls', label: `📞 Cuộc gọi Myka (${calls.length})` },
      { id: 'messages', label: `✉️ Tin nhắn & Thoại (${messagesLog.length})` },
      { id: 'health',   label: '💓 Sức khỏe & HA' },
      { id: 'schedule', label: '📅 Lịch' },
      { id: 'alerts',   label: `⚠️ Cảnh báo${alerts.length > 0 ? ` (${alerts.length})` : ''}` },
      { id: 'robot_chat', label: `💬 Chat Robot (${chatHistory.length})` },
      { id: 'notifications', label: `🔔 Thông báo${unreadNotifs > 0 ? ` (${unreadNotifs})` : ''}` },
      { id: 'caregroup',label: '👥 Nhóm chăm sóc' },
    ];

    return (
      <div className="min-h-screen bg-slate-100">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{user.avatar}</span>
            <div>
              <div className="font-bold text-xl">{user.name}</div>
              <div className="text-purple-200 text-sm">Người thân • Bà Nguyễn Thị Hoa</div>
            </div>
          </div>
          <button onClick={onLogout} className="text-purple-200 hover:text-white text-sm px-3 py-1 rounded-lg hover:bg-purple-600">Thoát</button>
        </div>

        <div className="bg-white border-b border-slate-200 px-4 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === t.id ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm p-5 col-span-full">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-3xl">{elder ? elder.avatar : '👵'}</div>
                  <div className="flex-1">
                    <div className="text-xl font-bold text-slate-800">Bà Nguyễn Thị Hoa</div>
                    <div className="text-slate-500">72 tuổi • Phòng P101</div>
                    <div className="flex gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>Robot Online
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">🔋 Pin: 82%</span>
                    </div>
                  </div>
                  <button onClick={() => setShowCall(true)} className="px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 text-sm">📞 Gọi điện</button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="text-slate-500 text-sm mb-2">💓 Huyết áp gần nhất</div>
                {latestBP ? (
                  <div>
                    <div className={`text-4xl font-extrabold mb-1 ${latestBP.status === 'normal' ? 'text-green-600' : latestBP.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {latestBP.systolic}/{latestBP.diastolic}
                    </div>
                    <div className="text-slate-400 text-sm">mmHg • {RTS.timeAgo(latestBP.timestamp)}</div>
                    <div className={`mt-2 inline-block text-xs px-2 py-1 rounded-full ${latestBP.status === 'normal' ? 'status-badge-normal' : latestBP.status === 'warning' ? 'status-badge-warning' : 'status-badge-critical'}`}>
                      {RTS.bpLabel(latestBP.systolic)}
                    </div>
                  </div>
                ) : <div className="text-slate-400">Chưa có dữ liệu</div>}
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="text-slate-500 text-sm mb-2">📅 Lịch hôm nay</div>
                <div className="space-y-2">
                  {schedules.slice(0, 3).map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-sm">
                      <span>{s.icon}</span>
                      <span className={`flex-1 ${s.confirmed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{s.title}</span>
                      <span className="text-slate-400">{RTS.formatTime(s.time)}</span>
                      {s.confirmed && <span className="text-green-500 text-xs">✓</span>}
                    </div>
                  ))}
                </div>
              </div>

              {sos.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <div className="text-red-700 font-bold mb-2">🆘 Sự kiện SOS gần đây</div>
                  {sos.slice(0, 2).map(s => (
                    <div key={s.id} className="bg-white rounded-xl p-3 mb-2 text-sm">
                      <div className="font-medium text-slate-800">{RTS.timeAgo(s.timestamp)}</div>
                      <div className="text-slate-500">{s.status === 'responded' ? `✅ Đã xử lý - ${s.respondedName}` : '⏳ Đang chờ'}</div>
                      {s.note && <div className="text-slate-600 mt-1">{s.note}</div>}
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-5">
                <div className="text-blue-200 text-sm mb-1">Gói dịch vụ hiện tại</div>
                <div className="text-2xl font-bold mb-1">📦 Gói Nâng cao</div>
                <div className="text-blue-200 text-sm mb-4">Hết hạn: 31/12/2024</div>
                <button onClick={() => setShowService(true)} className="w-full py-2 bg-white text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-50">⬆️ Nâng cấp gói</button>
              </div>
            </div>
          )}

          {activeTab === 'calls' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    📞 Lịch sử cuộc gọi qua Robot Myka
                    <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2.5 py-0.5 rounded-full">TC-034 ~ TC-053</span>
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">Cuộc gọi thoại hai chiều giữa Ngoại (Bà Hoa) và Gia đình (Chị Duyên, Anh Trà) thông qua Robot Myka.</p>
                </div>
                <button
                  onClick={() => {
                    setShowCall(true);
                    RTS.addCall({
                      elderId: 'E001',
                      direction: 'outgoing',
                      caller: 'Chị Duyên (Con gái)',
                      receiver: 'Ngoại (Bà Nguyễn Thị Hoa)',
                      phone: '0903.123.456',
                      duration: 'Đang kết nối...',
                      status: 'completed',
                      note: '[TC-042/TC-044] Chị Duyên gọi tới Robot Myka nói chuyện với Ngoại',
                      testcase: 'TC-042',
                      timestamp: new Date().toISOString()
                    });
                    refreshCalls();
                  }}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 shadow-sm flex items-center gap-2"
                >
                  📞 Gọi cho Ngoại qua Myka
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
                  <div className="text-2xl font-bold text-slate-800">{calls.length}</div>
                  <div className="text-slate-500 text-xs mt-1">Tổng cuộc gọi</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
                  <div className="text-2xl font-bold text-green-600">{calls.filter(c => c.status === 'completed').length}</div>
                  <div className="text-slate-500 text-xs mt-1">Kết nối thành công</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
                  <div className="text-2xl font-bold text-orange-500">{calls.filter(c => c.status !== 'completed').length}</div>
                  <div className="text-slate-500 text-xs mt-1">Nhỡ / Máy bận</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 font-bold text-slate-700">
                  Danh sách cuộc gọi gần đây
                </div>
                <div className="divide-y divide-slate-100">
                  {calls.map(c => {
                    const isOutgoing = c.direction === 'outgoing';
                    const isCompleted = c.status === 'completed';
                    const isMissed = c.status === 'missed';
                    return (
                      <div key={c.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                            isCompleted ? (isOutgoing ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600') : 'bg-red-100 text-red-600'
                          }`}>
                            {isOutgoing ? '↗️' : '↙️'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 text-sm">
                                {isOutgoing ? `Bạn ➔ ${c.receiver}` : `${c.caller} ➔ Bạn`}
                              </span>
                              {c.testcase && (
                                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                                  {c.testcase}
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-xs mt-0.5">{c.note}</div>
                            <div className="text-slate-400 text-xs mt-1">
                              {RTS.formatDateTime(c.timestamp)} • Thời lượng: <span className="font-medium text-slate-600">{c.duration}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${
                            isCompleted ? 'bg-green-100 text-green-700' :
                            isMissed ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {isCompleted ? 'Thành công' : isMissed ? 'Cuộc gọi nhỡ' : 'Từ chối / Bận'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-4">
                  <div>
                    <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      ✉️ Tin nhắn & Tin nhắn thoại qua Robot Myka
                      <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2.5 py-0.5 rounded-full">TC-025 ~ TC-052</span>
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Tin nhắn văn bản của người thân gửi tới Robot Myka để đọc cho Ngoại nghe, hoặc lời nhắn thoại Ngoại gửi qua Myka.</p>
                  </div>
                </div>

                <form onSubmit={handleSendMsgToRobot} className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="font-semibold text-purple-900 text-sm mb-2 flex items-center gap-2">
                    <span>📢 Gửi lời nhắn đến Robot Myka (Myka sẽ phát giọng nói cho Ngoại nghe)</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMsgText}
                      onChange={(e) => setNewMsgText(e.target.value)}
                      placeholder="Ví dụ: Ngoại ơi trưa nay con về ăn cơm với Ngoại nha! (TC-048)..."
                      className="flex-1 px-4 py-2.5 text-sm border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 flex-shrink-0"
                    >
                      🚀 Gửi tới Myka
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 items-center">
                    <span className="text-xs text-purple-700 font-medium">Mẫu testcase nhanh:</span>
                    <button
                      type="button"
                      onClick={() => setNewMsgText('Ngoại ơi trưa nay con về ăn cơm với Ngoại nha!')}
                      className="text-xs bg-white text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg hover:bg-purple-100"
                    >
                      [TC-048] Báo về ăn trưa
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMsgText('Ngoại nhớ uống thuốc huyết áp lúc 2 giờ nha Ngoại!')}
                      className="text-xs bg-white text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg hover:bg-purple-100"
                    >
                      [TC-049] Nhắc uống thuốc
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMsgText('Con đã đặt sữa chua gửi về phòng P101 cho Ngoại rồi nha!')}
                      className="text-xs bg-white text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg hover:bg-purple-100"
                    >
                      [TC-050] Gửi quà vặt
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 font-bold text-slate-700 flex items-center justify-between">
                  <span>Hộp thư thoại & Tin nhắn ({messagesLog.length})</span>
                  <span className="text-xs text-slate-400">Đồng bộ hai chiều với Robot Myka</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {messagesLog.map(m => {
                    const isElderSender = m.sender === 'elder';
                    return (
                      <div key={m.id} className="p-4 hover:bg-slate-50 flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0 mt-0.5">
                          {isElderSender ? '👵' : '👩'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800 text-sm">
                              {m.senderName} ➔ {m.receiverName}
                            </span>
                            <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                              m.type === 'voice' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {m.type === 'voice' ? '🎙️ Tin nhắn thoại' : '📝 Tin nhắn văn bản'}
                            </span>
                            {m.testcase && (
                              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                                {m.testcase}
                              </span>
                            )}
                          </div>

                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 my-2 text-sm text-slate-800">
                            {m.type === 'voice' && (
                              <div className="flex items-center gap-2 text-xs text-orange-600 font-semibold mb-1">
                                <span>▶️ 0:12 / 0:12</span>
                                <div className="h-1.5 bg-orange-200 rounded-full flex-1 overflow-hidden">
                                  <div className="w-full h-full bg-orange-500"></div>
                                </div>
                                <span>Đã chuyển văn bản (STT)</span>
                              </div>
                            )}
                            <div className="italic">"{m.content}"</div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>{m.note}</span>
                            <div className="flex items-center gap-2">
                              <span>{RTS.formatDateTime(m.timestamp)}</span>
                              <span className="text-green-600 font-medium">✓ Đã chuyển phát</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="font-bold text-slate-800 text-lg mb-4">📈 Biểu đồ Huyết áp 7 ngày</h3>
                {LineChart ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={bpData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={[60, 160]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Tâm thu" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Tâm trương" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Nhịp tim" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="text-slate-400 text-center py-10">Đang tải biểu đồ...</div>}
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="font-bold text-slate-800 text-lg mb-4">📋 Lịch sử đo huyết áp</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-500 text-left">
                        <th className="py-2 font-medium">Thời gian</th>
                        <th className="py-2 font-medium text-center">Tâm thu</th>
                        <th className="py-2 font-medium text-center">Tâm trương</th>
                        <th className="py-2 font-medium text-center">Nhịp tim</th>
                        <th className="py-2 font-medium text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RTS.getBP('E001').slice(-7).reverse().map(r => (
                        <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-2 text-slate-600">{RTS.formatDateTime(r.timestamp)}</td>
                          <td className={`text-center py-2 font-bold ${r.status === 'normal' ? 'bp-normal' : r.status === 'warning' ? 'bp-warning' : 'bp-critical'}`}>{r.systolic}</td>
                          <td className="text-center py-2 text-slate-700">{r.diastolic}</td>
                          <td className="text-center py-2 text-slate-700">{r.heartRate}</td>
                          <td className="text-center py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'normal' ? 'status-badge-normal' : r.status === 'warning' ? 'status-badge-warning' : 'status-badge-critical'}`}>
                              {r.status === 'normal' ? 'Bình thường' : r.status === 'warning' ? 'Cần theo dõi' : 'Nguy hiểm'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-800 text-lg">📅 Lịch chăm sóc</h2>
                <button onClick={() => setShowAddSchedule(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">➕ Thêm lịch</button>
              </div>
              {schedules.map(s => (
                <div key={s.id} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${s.confirmed ? 'border-green-500' : 'border-blue-500'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{s.icon}</span>
                      <div>
                        <div className="font-medium text-slate-800">{s.title}</div>
                        <div className="text-slate-500 text-sm">{s.detail}</div>
                        <div className="text-blue-600 text-sm font-medium">{RTS.formatTime(s.time)}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${s.confirmed ? 'status-badge-normal' : 'status-badge-warning'}`}>
                      {s.confirmed ? '✓ Đã thực hiện' : '⏳ Chờ'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-3">
              <h2 className="font-bold text-slate-800 text-lg">⚠️ Cảnh báo sức khỏe</h2>
              {sos.map(s => (
                <div key={s.id} className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🆘</span>
                    <div>
                      <div className="font-bold text-red-700">Sự kiện SOS</div>
                      <div className="text-slate-600 text-sm">{RTS.formatDateTime(s.timestamp)}</div>
                      {s.note && <div className="text-slate-700 text-sm mt-1">{s.note}</div>}
                      <div className={`text-xs mt-1 font-medium ${s.status === 'responded' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {s.status === 'responded' ? `✅ Đã xử lý bởi ${s.respondedName}` : '⏳ Đang xử lý'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.map(a => (
                <div key={a.id} className={`rounded-xl p-4 border ${a.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{a.severity === 'critical' ? '🚨' : '⚠️'}</span>
                    <div>
                      <div className={`font-bold ${a.severity === 'critical' ? 'text-red-700' : 'text-yellow-700'}`}>{a.title}</div>
                      <div className="text-slate-600 text-sm">{a.detail}</div>
                      <div className="text-slate-400 text-xs mt-1">{RTS.timeAgo(a.timestamp)}</div>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && sos.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <div className="text-green-700 font-medium">Không có cảnh báo nào</div>
                  <div className="text-green-600 text-sm">Bà Hoa đang ổn định tốt</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'robot_chat' && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <div className="font-bold text-slate-800">Lịch sử trò chuyện Robot</div>
                  <div className="text-slate-500 text-xs">Cuộc hội thoại giữa Robot và {elder ? elder.name : 'Người cao tuổi'} — đồng bộ từ thiết bị</div>
                </div>
              </div>
              <div className="p-5 space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                {chatHistory.length === 0 && (
                  <div className="text-center text-slate-400 py-8">Chưa có lịch sử trò chuyện</div>
                )}
                {chatHistory.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'elder' ? 'justify-end' : 'justify-start'} gap-2`}>
                    {msg.sender === 'robot' && <span className="text-xl flex-shrink-0 mt-1">🤖</span>}
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${msg.sender === 'elder' ? 'chat-bubble-user' : 'chat-bubble-robot'}`}>
                      <div>{msg.text}</div>
                      <div className={`text-xs mt-1 ${msg.sender === 'elder' ? 'text-blue-200' : 'text-slate-400'}`}>{RTS.timeAgo(msg.timestamp)}</div>
                    </div>
                    {msg.sender === 'elder' && <span className="text-xl flex-shrink-0 mt-1">{elder ? elder.avatar : '👵'}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-700">🔔 Thông báo từ hệ thống</h3>
                <span className="text-xs text-slate-400">Cập nhật tự động khi Robot ghi nhận dữ liệu</span>
              </div>
              {notifications.length === 0 && (
                <div className="bg-white rounded-xl p-8 text-center text-slate-400">Không có thông báo</div>
              )}
              {notifications.map(n => {
                const icons = { bp_result: '💓', sos: '🚨', bp_alert: '⚠️', chat_summary: '💬', schedule_missed: '📋' };
                const colors = { bp_result: 'border-blue-200 bg-blue-50', sos: 'border-red-200 bg-red-50', bp_alert: 'border-orange-200 bg-orange-50', chat_summary: 'border-purple-200 bg-purple-50', schedule_missed: 'border-yellow-200 bg-yellow-50' };
                return (
                  <div key={n.id} className={`rounded-xl p-4 border flex items-start gap-3 ${colors[n.type] || 'border-slate-200 bg-white'} ${!n.read ? 'ring-2 ring-blue-300' : ''}`}>
                    <span className="text-2xl flex-shrink-0">{icons[n.type] || '🔔'}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800 text-sm">{n.title}</div>
                      <div className="text-slate-600 text-sm mt-0.5">{n.detail}</div>
                      <div className="text-slate-400 text-xs mt-1">{RTS.timeAgo(n.timestamp)}</div>
                    </div>
                    {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'caregroup' && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <CareGroup elderId={myElderId} currentUser={user} />
            </div>
          )}
        </div>

        {showCall && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-xs w-full">
              <div className="text-6xl mb-4 animate-pulse">📞</div>
              <div className="text-xl font-bold mb-2">Đang gọi cho Bà Hoa...</div>
              <div className="text-slate-500 text-sm mb-6">Kết nối qua Robot Tâm Sự</div>
              <button onClick={() => setShowCall(false)} className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600">📵 Kết thúc</button>
            </div>
          </div>
        )}
        {showAddSchedule && <AddScheduleModal onClose={() => setShowAddSchedule(false)} onAdd={refreshSchedules} />}
        {showService && <ServiceModal onClose={() => setShowService(false)} />}
      </div>
    );
  }

  window.FamilyDashboard = FamilyDashboard;
})();
