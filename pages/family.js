// ============================================================
// pages/family.js - Family Dashboard (Chị Duyên)
// Tuân thủ nghiêm ngặt quy định y tế:
// 1. App dùng để MÔ TẢ & LƯU DỮ LIỆU (Read-only cho người thân xem kết quả)
// 2. Lịch sử trò chuyện giữa người già và AI được đồng bộ từ Telegram
// 3. Tư vấn y khoa qua Kênh Telegram chính thức (Không chat riêng bác sĩ trong app)
// 4. Quản lý RUD kết nối Bluetooth và Wi-Fi trong nhà cho Robot
// 5. Trợ lý AI Gia đình hỗ trợ tra cứu (Có miễn trừ trách nhiệm y tế)
// ============================================================

(function () {
  function FamilyDashboard({ user, onLogout }) {
    const myElderId = 'E001';
    const [activeTab, setActiveTab] = React.useState('health_summary');
    const [alerts, setAlerts] = React.useState([]);
    const [connectivity, setConnectivity] = React.useState(() => RTS.getConnectivity(myElderId));
    const [telegramChats, setTelegramChats] = React.useState(() => RTS.getTelegramChatHistory(myElderId));
    const [telegramConsult, setTelegramConsult] = React.useState(() => RTS.getTelegramConsultation());
    const [calls, setCalls] = React.useState([]);
    const [messagesLog, setMessagesLog] = React.useState([]);

    // Wi-Fi RUD state
    const [wifiSSID, setWifiSSID] = React.useState(connectivity.wifi_ssid || 'Nha_Ngoai_2.4G');
    const [wifiPass, setWifiPass] = React.useState('');
    const [wifiMsg, setWifiMsg] = React.useState('');

    // Bluetooth Pair modal
    const [showPairModal, setShowPairModal] = React.useState(false);
    const [newDeviceName, setNewDeviceName] = React.useState('');

    // Family AI Assistant state
    const [aiQuery, setAiQuery] = React.useState('');
    const [aiChatHistory, setAiChatHistory] = React.useState([
      {
        sender: 'ai',
        text: '👋 Chào Chị Duyên! Tôi là Trợ lý AI Chăm sóc Gia đình. Tôi có thể giúp chị tóm tắt kết quả đo huyết áp của Ngoại, xem lịch sử trò chuyện trên Telegram, hoặc hướng dẫn cài đặt Wi-Fi/Bluetooth cho Robot. (Lưu ý: Tôi không có thẩm quyền tư vấn y khoa hay chẩn đoán bệnh theo quy định pháp lý).'
      }
    ]);
    const [aiLoading, setAiLoading] = React.useState(false);

    React.useEffect(() => {
      setAlerts(RTS.getAlerts().filter(a => a.elderId === myElderId));
      setCalls(RTS.getCalls(myElderId));
      setMessagesLog(RTS.getMessages(myElderId));

      // Try fetching live data from FastAPI backend if online
      fetch('http://127.0.0.1:8000/api/device/connectivity/' + myElderId)
        .then(res => res.json())
        .then(data => { if (data && data.wifi_ssid) setConnectivity(data); })
        .catch(() => {});

      fetch('http://127.0.0.1:8000/api/family/telegram-chat-history/' + myElderId)
        .then(res => res.json())
        .then(data => { if (data && data.messages) setTelegramChats(data.messages); })
        .catch(() => {});
    }, []);

    const elder = RTS.getElders().find(e => e.id === myElderId);
    const bpList = RTS.getBP(myElderId) || [];
    const latestBP = bpList[bpList.length - 1];

    // Calculate health summary stats
    const avgSys = bpList.length ? Math.round(bpList.reduce((acc, r) => acc + r.systolic, 0) / bpList.length) : 0;
    const avgDia = bpList.length ? Math.round(bpList.reduce((acc, r) => acc + r.diastolic, 0) / bpList.length) : 0;
    const avgHR = bpList.length ? Math.round(bpList.reduce((acc, r) => acc + r.heartRate, 0) / bpList.length) : 0;

    // Chart setup
    const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = window.Recharts || {};
    const chartData = bpList.slice(-7).map(r => ({
      date: RTS.formatTime(r.timestamp),
      'Tâm thu': r.systolic,
      'Tâm trương': r.diastolic,
      'Nhịp tim': r.heartRate,
    }));

    // [U - UPDATE HOME WI-FI]
    function handleUpdateWifi(e) {
      e.preventDefault();
      if (!wifiSSID.trim()) return;

      const updated = {
        ...connectivity,
        wifi_ssid: wifiSSID.trim(),
        wifi_password: wifiPass ? '••••••••' : connectivity.wifi_password,
        wifi_status: 'connected',
        wifi_signal: 95,
        last_updated: new Date().toISOString()
      };
      setConnectivity(updated);
      RTS.saveConnectivity(myElderId, updated);

      // Call backend API
      fetch('http://127.0.0.1:8000/api/device/wifi/' + myElderId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid: wifiSSID.trim(), password: wifiPass, frequency: '2.4GHz' })
      }).catch(() => {});

      setWifiMsg(`✅ Đã cập nhật và lưu cấu hình Wi-Fi nhà "${wifiSSID}" cho Robot Myka!`);
      setTimeout(() => setWifiMsg(''), 4000);
      setWifiPass('');
    }

    // [D - DELETE / RESET WI-FI]
    function handleDeleteWifi() {
      if (!confirm('Bạn có chắc chắn muốn ngắt kết nối và xóa Wi-Fi của Robot Myka?')) return;
      const updated = {
        ...connectivity,
        wifi_ssid: null,
        wifi_password: null,
        wifi_ip: null,
        wifi_status: 'disconnected',
        wifi_signal: 0,
        last_updated: new Date().toISOString()
      };
      setConnectivity(updated);
      setWifiSSID('');
      RTS.saveConnectivity(myElderId, updated);

      fetch('http://127.0.0.1:8000/api/device/wifi/' + myElderId, { method: 'DELETE' }).catch(() => {});
      setWifiMsg('⚠️ Đã xóa thông tin Wi-Fi. Robot Myka hiện ở chế độ Offline.');
      setTimeout(() => setWifiMsg(''), 4000);
    }

    // [U - UPDATE / PAIR BLUETOOTH]
    function handlePairBluetooth(e) {
      e.preventDefault();
      if (!newDeviceName.trim()) return;
      const newDev = {
        id: 'DEV-BLE-0' + (connectivity.paired_devices.length + 1),
        name: newDeviceName.trim(),
        type: 'sphygmomanometer',
        status: 'connected',
        signal: -58
      };
      const updated = {
        ...connectivity,
        paired_devices: [...connectivity.paired_devices, newDev],
        last_updated: new Date().toISOString()
      };
      setConnectivity(updated);
      RTS.saveConnectivity(myElderId, updated);

      fetch('http://127.0.0.1:8000/api/device/bluetooth/pair/' + myElderId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_name: newDeviceName.trim(), device_type: 'sphygmomanometer' })
      }).catch(() => {});

      setNewDeviceName('');
      setShowPairModal(false);
      alert(`Đã ghép đôi thành công thiết bị: ${newDev.name}`);
    }

    // [D - DELETE / UNPAIR BLUETOOTH]
    function handleUnpairBluetooth(devId) {
      if (!confirm('Hủy ghép đôi thiết bị Bluetooth này?')) return;
      const updated = {
        ...connectivity,
        paired_devices: connectivity.paired_devices.filter(d => d.id !== devId),
        last_updated: new Date().toISOString()
      };
      setConnectivity(updated);
      RTS.saveConnectivity(myElderId, updated);

      fetch(`http://127.0.0.1:8000/api/device/bluetooth/${myElderId}/${devId}`, { method: 'DELETE' }).catch(() => {});
    }

    // Family AI Assistant query handler
    function handleAskAI(e) {
      e.preventDefault();
      if (!aiQuery.trim() || aiLoading) return;
      const q = aiQuery.trim();
      setAiQuery('');
      setAiChatHistory(prev => [...prev, { sender: 'user', text: q }]);
      setAiLoading(true);

      // Call Backend API
      fetch('http://127.0.0.1:8000/api/chat/family-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elder_id: myElderId, question: q })
      })
      .then(res => res.json())
      .then(data => {
        setAiChatHistory(prev => [...prev, {
          sender: 'ai',
          text: data.answer,
          isRefused: data.is_medical_refused,
          telegramLink: data.telegram_link
        }]);
      })
      .catch(() => {
        // Fallback local logic
        const lower = q.toLowerCase();
        let ans = '';
        let isRef = false;
        if (['thuốc', 'chẩn đoán', 'bệnh gì', 'uống thuốc', 'kê đơn'].some(k => lower.includes(k))) {
          ans = '⚠️ MIỄN TRỪ TRÁCH NHIỆM Y KHOA: Tôi là AI Trợ lý Gia đình, theo quy định pháp lý tôi KHÔNG ĐƯỢC PHÉP tư vấn y tế hay chẩn đoán bệnh tật. Xin vui lòng liên hệ Bác sĩ Tuấn qua Kênh Telegram chính thức!';
          isRef = true;
        } else {
          ans = `📋 Tóm tắt cho Chị Duyên: Lần đo gần nhất của Ngoại là ${latestBP.systolic}/${latestBP.diastolic} mmHg (Ổn định). Robot Myka đang kết nối Wi-Fi nhà tốt.`;
        }
        setAiChatHistory(prev => [...prev, { sender: 'ai', text: ans, isRefused: isRef, telegramLink: isRef ? 'https://t.me/myka_care_p101_bot' : null }]);
      })
      .finally(() => setAiLoading(false));
    }

    const TABS = [
      { id: 'health_summary', label: '📊 Bảng Sức khỏe & Lịch sử đo (Read-only)' },
      { id: 'telegram_chat',  label: `🤖 Lịch sử chat Myka (Telegram)` },
      { id: 'connectivity',   label: '📶 Cấu hình Robot (Wi-Fi & Bluetooth RUD)' },
      { id: 'telegram_consult', label: '💬 Kênh Tư Vấn Y Tế (Telegram)' },
      { id: 'calls',          label: `📞 Cuộc gọi Myka (${calls.length})` },
      { id: 'alerts',         label: `⚠️ Cảnh báo & SOS${alerts.length > 0 ? ` (${alerts.length})` : ''}` },
      { id: 'ai_assistant',   label: '💡 Trợ lý AI Gia đình' },
    ];

    return (
      <div className="min-h-screen bg-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{user.avatar}</span>
            <div>
              <div className="font-bold text-xl">{user.name}</div>
              <div className="text-purple-200 text-xs flex items-center gap-2">
                <span>Người thân • {elder ? elder.name : 'Bà Nguyễn Thị Hoa'} (Phòng P101)</span>
                <span className="bg-green-500 bg-opacity-30 border border-green-300 text-white px-2 py-0.5 rounded-full text-[11px]">
                  ✓ Robot Online (Wi-Fi nhà)
                </span>
              </div>
            </div>
          </div>
          <button onClick={onLogout} className="text-purple-200 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white hover:bg-opacity-10 transition">
            Đăng xuất
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-slate-200 px-4 overflow-x-auto shadow-sm">
          <div className="flex gap-1 min-w-max">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === t.id ? 'border-purple-600 text-purple-700 bg-purple-50 bg-opacity-50' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-5xl mx-auto px-4 py-6">

          {/* TAB 1: BẢNG KẾT QUẢ SỨC KHỎE & LỊCH SỬ ĐO MỖI NGÀY (READ-ONLY) */}
          {activeTab === 'health_summary' && (
            <div className="space-y-5">
              {/* Notice Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">ℹ️</span>
                <div className="text-sm text-blue-900">
                  <span className="font-bold">Chế độ Giám sát (Read-Only): </span>
                  Người cao tuổi đo huyết áp trực tiếp bằng máy đo và Robot Myka tại nhà. 
                  Dữ liệu được tự động lưu trữ và đồng bộ về ứng dụng này để Người thân và Bác sĩ theo dõi liên tục.
                </div>
              </div>

              {/* 3 Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                  <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Huyết áp gần nhất</div>
                  {latestBP ? (
                    <div>
                      <div className={`text-4xl font-extrabold ${latestBP.systolic >= 140 ? 'text-red-600' : latestBP.systolic >= 130 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {latestBP.systolic}/{latestBP.diastolic} <span className="text-sm font-normal text-slate-400">mmHg</span>
                      </div>
                      <div className="text-slate-500 text-xs mt-1">💓 Nhịp tim: <span className="font-semibold text-slate-700">{latestBP.heartRate} bpm</span></div>
                      <div className="text-slate-400 text-xs mt-1">🕒 {RTS.formatDateTime(latestBP.timestamp)}</div>
                    </div>
                  ) : <div className="text-slate-400 text-sm">Chưa có dữ liệu</div>}
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                  <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Chỉ số trung bình (7 ngày)</div>
                  <div className="text-3xl font-extrabold text-indigo-700">
                    {avgSys}/{avgDia} <span className="text-sm font-normal text-slate-400">mmHg</span>
                  </div>
                  <div className="text-slate-500 text-xs mt-1">Nhịp tim TB: <span className="font-semibold text-slate-700">{avgHR} bpm</span></div>
                  <div className="text-slate-400 text-xs mt-1">Tổng số lần đo: <span className="font-semibold text-slate-700">{bpList.length} lần</span></div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                  <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Đánh giá tổng quát</div>
                  <div className="text-lg font-bold text-green-700 flex items-center gap-1.5 mt-1">
                    <span>✅</span> Ổn định tốt
                  </div>
                  <div className="text-slate-500 text-xs mt-1">Chỉ số kiểm soát trong ngưỡng an toàn theo hướng dẫn tim mạch.</div>
                  <div className="text-xs text-purple-700 font-medium mt-2 bg-purple-50 p-2 rounded-lg">
                    Bác sĩ theo dõi: BS. Phạm Minh Tuấn
                  </div>
                </div>
              </div>

              {/* 7-Day Trend Chart */}
              <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                  <span>📈 Biểu đồ biến thiên Huyết áp 7 ngày gần nhất</span>
                  <span className="text-xs text-slate-400 font-normal">(Đồng bộ tự động từ Robot Myka)</span>
                </h3>
                {LineChart ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis domain={[50, 160]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Tâm thu" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Tâm trương" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Nhịp tim" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="text-slate-400 text-center py-8">Đang tải biểu đồ...</div>}
              </div>

              {/* Daily Measurement Table */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-base">📋 Bảng lịch sử đo huyết áp mỗi ngày</h3>
                  <span className="text-xs text-slate-400">Dữ liệu chỉ xem (Read-only)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-left border-b border-slate-100">
                        <th className="py-3 px-4 font-semibold">Thời gian</th>
                        <th className="py-3 px-4 font-semibold text-center">Tâm thu (mmHg)</th>
                        <th className="py-3 px-4 font-semibold text-center">Tâm trương (mmHg)</th>
                        <th className="py-3 px-4 font-semibold text-center">Nhịp tim (bpm)</th>
                        <th className="py-3 px-4 font-semibold text-center">Đánh giá</th>
                        <th className="py-3 px-4 font-semibold">Ghi chú ngữ cảnh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bpList.slice().reverse().map(r => (
                        <tr key={r.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 text-slate-600 font-medium">{RTS.formatDateTime(r.timestamp)}</td>
                          <td className={`py-3 px-4 text-center font-bold text-base ${r.systolic >= 140 ? 'text-red-600' : r.systolic >= 130 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {r.systolic}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-700 font-medium">{r.diastolic}</td>
                          <td className="py-3 px-4 text-center text-slate-600 font-medium">{r.heartRate}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                              r.status === 'normal' ? 'bg-green-100 text-green-700' :
                              r.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {r.status === 'normal' ? 'Bình thường' : r.status === 'warning' ? 'Hơi cao' : 'Nguy hiểm'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-xs">{r.note || 'Đo tự động từ Robot Myka'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LỊCH SỬ CHAT MYKA (ĐẨY TỪ TELEGRAM) */}
          {activeTab === 'telegram_chat' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <span>🤖 Lịch sử trò chuyện giữa Bà Hoa và Robot Myka</span>
                      <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full">Đẩy từ Telegram</span>
                    </h2>
                    <p className="text-slate-500 text-xs mt-1">
                      Ngoại trò chuyện bằng giọng nói với Robot Myka tại nhà. Hệ thống tự động chuyển thành văn bản (STT) và đồng bộ qua kênh Telegram Bot 
                      <span className="font-semibold text-blue-600"> @myka_care_p101_bot</span>.
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    Cập nhật thời gian thực
                  </span>
                </div>

                {/* Conversation List */}
                <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                  {telegramChats.map(c => {
                    const isElder = c.sender === 'elder';
                    return (
                      <div key={c.id} className={`flex gap-3 ${isElder ? 'justify-end' : 'justify-start'}`}>
                        {!isElder && <div className="text-2xl flex-shrink-0 mt-1">🤖</div>}
                        <div className={`max-w-md rounded-2xl p-4 text-sm ${
                          isElder ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                        }`}>
                          <div className={`text-xs font-bold mb-1 flex items-center gap-2 ${isElder ? 'text-purple-200' : 'text-slate-500'}`}>
                            <span>{c.sender_name}</span>
                            <span className="font-normal opacity-80">({c.source || 'Telegram'})</span>
                          </div>
                          <div className="leading-relaxed">{c.message}</div>
                          <div className={`text-[11px] mt-2 text-right ${isElder ? 'text-purple-200' : 'text-slate-400'}`}>
                            {RTS.formatDateTime(c.timestamp)}
                          </div>
                        </div>
                        {isElder && <div className="text-2xl flex-shrink-0 mt-1">👵</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CẤU HÌNH KẾT NỐI ROBOT (BLUETOOTH & HOME WI-FI - RUD) */}
          {activeTab === 'connectivity' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <span>📶 Cấu hình kết nối Robot Myka (RUD)</span>
                      <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full">Wi-Fi & Bluetooth</span>
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Người thân dùng ứng dụng để Đọc (Read), Cập nhật (Update) hoặc Xóa (Delete) kết nối mạng Wi-Fi và thiết bị Bluetooth cho Robot tại nhà.
                    </p>
                  </div>
                </div>

                {wifiMsg && (
                  <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2.5 rounded-xl mb-4">
                    {wifiMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Wi-Fi Setup (RUD) */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <span>📡 Mạng Wi-Fi trong nhà</span>
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${connectivity.wifi_status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {connectivity.wifi_status === 'connected' ? '● Đã kết nối' : '○ Chưa kết nối'}
                      </span>
                    </div>

                    {/* [R - Read Wi-Fi] */}
                    <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs space-y-1 mb-4">
                      <div><span className="text-slate-400">Tên mạng hiện tại:</span> <span className="font-bold text-slate-800">{connectivity.wifi_ssid || 'Chưa cài đặt'}</span></div>
                      <div><span className="text-slate-400">Địa chỉ IP Robot:</span> <span className="font-mono text-slate-700">{connectivity.wifi_ip || '-'}</span></div>
                      <div><span className="text-slate-400">Cường độ sóng:</span> <span className="text-green-600 font-semibold">{connectivity.wifi_signal}% (Rất mạnh)</span> • Băng tần 2.4GHz</div>
                    </div>

                    {/* [U - Update Wi-Fi] */}
                    <form onSubmit={handleUpdateWifi} className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Tên Wi-Fi nhà (SSID):</label>
                        <input
                          type="text"
                          value={wifiSSID}
                          onChange={(e) => setWifiSSID(e.target.value)}
                          placeholder="Ví dụ: Nha_Ngoai_2.4G"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Mật khẩu Wi-Fi:</label>
                        <input
                          type="password"
                          value={wifiPass}
                          onChange={(e) => setWifiPass(e.target.value)}
                          placeholder="Nhập mật khẩu Wi-Fi nhà..."
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                          Lưu & Kết nối Wi-Fi (Update)
                        </button>
                        {/* [D - Delete Wi-Fi] */}
                        <button
                          type="button"
                          onClick={handleDeleteWifi}
                          className="px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition"
                        >
                          Xóa Wi-Fi (Delete)
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Bluetooth BLE Devices (RUD) */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <span>🔵 Thiết bị Bluetooth (BLE)</span>
                      </span>
                      <button
                        onClick={() => setShowPairModal(true)}
                        className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-lg font-semibold hover:bg-indigo-700"
                      >
                        + Ghép đôi mới
                      </button>
                    </div>

                    {/* [R - Read Bluetooth devices] */}
                    <div className="space-y-2">
                      {connectivity.paired_devices && connectivity.paired_devices.length > 0 ? (
                        connectivity.paired_devices.map(dev => (
                          <div key={dev.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                <span>{dev.type === 'robot' ? '🤖' : '💓'}</span>
                                <span>{dev.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">Mã: {dev.id} • Tín hiệu: {dev.signal} dBm</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                Đã kết nối
                              </span>
                              {/* [D - Delete / Unpair] */}
                              <button
                                onClick={() => handleUnpairBluetooth(dev.id)}
                                className="text-red-500 hover:text-red-700 text-xs px-1.5 py-0.5"
                                title="Hủy ghép đôi"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 text-xs py-4 text-center">Chưa có thiết bị Bluetooth nào ghép đôi</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KÊNH TƯ VẤN Y TẾ QUA TELEGRAM (CHÍNH THỨC - KHÔNG CHAT RIÊNG TRONG APP) */}
          {activeTab === 'telegram_consult' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
              <div className="max-w-2xl mx-auto text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto">
                  💬
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{telegramConsult.group_name}</h2>
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs text-left leading-relaxed">
                  <span className="font-bold">⚠️ Quy định pháp lý & Y tế: </span>
                  Ứng dụng chỉ phục vụ mục đích theo dõi, lưu trữ chỉ số sinh tồn và không cho phép nhắn tin tư vấn riêng lẻ giữa Bác sĩ và Người thân trong ứng dụng. 
                  Mọi hoạt động tư vấn chuyên môn y khoa, hỏi đáp triệu chứng hoặc hướng dẫn phác đồ đều được chuyển tiếp qua Kênh Telegram chính thức có sự tham gia đồng thời của Bác sĩ chuyên khoa, Điều dưỡng và Người thân.
                </div>

                {/* Telegram Channel Info */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left space-y-3">
                  <div className="font-bold text-sm text-slate-700">Các thành viên phụ trách kênh tư vấn:</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {telegramConsult.members.map((m, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2">
                        <span className="text-2xl">{m.avatar}</span>
                        <div>
                          <div className="font-bold text-xs text-slate-800">{m.name}</div>
                          <div className="text-[11px] text-slate-500">{m.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-slate-500">Kênh bot Telegram: <span className="font-bold text-blue-600">{telegramConsult.bot_username}</span></div>
                      <div className="text-xs text-slate-400 mt-0.5">Hỗ trợ nhận tin nhắn thoại và cảnh báo trực tiếp từ Robot Myka</div>
                    </div>
                    <a
                      href={telegramConsult.telegram_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center gap-2"
                    >
                      🚀 Mở Nhóm Tư Vấn Telegram
                    </a>
                  </div>
                </div>

                {/* QR Code */}
                <div className="pt-2">
                  <div className="text-xs text-slate-500 mb-2">Quét mã QR bằng điện thoại để tham gia nhóm Telegram ngay:</div>
                  <img
                    src={telegramConsult.qr_code_url}
                    alt="Telegram QR Code"
                    className="w-40 h-40 mx-auto rounded-xl border border-slate-200 shadow-sm p-1 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CUỘC GỌI MYKA (TC-034 ~ TC-053) */}
          {activeTab === 'calls' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">📞 Lịch sử cuộc gọi đàm thoại qua Robot Myka</h3>
                    <p className="text-slate-500 text-xs">Cuộc gọi thoại hai chiều giữa Ngoại (loa Robot) và Con gái (Chị Duyên).</p>
                  </div>
                  <button
                    onClick={() => alert('Đang kết nối cuộc gọi thoại tới loa Robot Myka phòng P101 của Ngoại...')}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700"
                  >
                    📞 Gọi về Robot của Ngoại
                  </button>
                </div>
                <div className="divide-y divide-slate-100 mt-3">
                  {calls.map(c => (
                    <div key={c.id} className="py-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{c.direction === 'outgoing' ? '↗️' : '↙️'}</span>
                        <div>
                          <div className="font-bold text-slate-800 text-xs">{c.caller} ➔ {c.receiver}</div>
                          <div className="text-slate-500 text-xs">{c.note}</div>
                          <div className="text-slate-400 text-[11px]">{RTS.formatDateTime(c.timestamp)} • Thời lượng: {c.duration}</div>
                        </div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Thành công</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CẢNH BÁO & SOS */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                <h3 className="font-bold text-slate-800 text-base mb-3">⚠️ Danh sách sự kiện SOS và cảnh báo huyết áp</h3>
                <div className="space-y-3">
                  {alerts.map(a => (
                    <div key={a.id} className="p-4 rounded-xl border border-red-200 bg-red-50 flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">🚨</span>
                      <div>
                        <div className="font-bold text-red-800 text-sm">{a.title}</div>
                        <div className="text-slate-600 text-xs mt-0.5">{a.detail}</div>
                        <div className="text-slate-400 text-[11px] mt-1">{RTS.formatDateTime(a.timestamp)} • Đã chuyển tiếp điều dưỡng</div>
                      </div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-center text-slate-400 py-6 text-sm">Hiện không có cảnh báo nguy kịch nào.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: TRỢ LÝ AI GIA ĐÌNH (CHATBOX AI CHO NGƯỜI THÂN - CÓ MIỄN TRỪ PHÁP LÝ) */}
          {activeTab === 'ai_assistant' && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💡</span>
                  <div>
                    <h2 className="font-bold text-slate-800 text-base">Trợ lý AI Hỗ trợ Chăm sóc Gia đình</h2>
                    <p className="text-slate-500 text-xs">Giải đáp thông tin sinh hoạt, tóm tắt lịch sử đo và hướng dẫn kết nối Robot.</p>
                  </div>
                </div>
                <div className="mt-3 bg-red-50 border border-red-200 text-red-800 text-xs p-2.5 rounded-xl leading-relaxed">
                  <span className="font-bold">⚠️ Ranh giới pháp lý: </span>
                  AI Trợ lý KHÔNG có thẩm quyền chẩn đoán bệnh hay tư vấn dùng thuốc. Mọi câu hỏi y tế sẽ được từ chối và hướng dẫn sang nhóm Bác sĩ trên Telegram.
                </div>
              </div>

              {/* Chat messages */}
              <div className="p-5 space-y-3 max-h-96 overflow-y-auto scrollbar-thin bg-slate-50">
                {aiChatHistory.map((m, idx) => (
                  <div key={idx} className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.sender === 'ai' && <span className="text-2xl mt-1">💡</span>}
                    <div className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'user' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                    }`}>
                      <div className="whitespace-pre-line">{m.text}</div>
                      {m.telegramLink && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <a href={m.telegramLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                            <span>💬 Mở Kênh Telegram Bác sĩ Tuấn</span> →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="text-xs text-slate-400 italic">Trợ lý AI đang tra cứu...</div>
                )}
              </div>

              {/* Query form */}
              <form onSubmit={handleAskAI} className="p-3 border-t border-slate-100 bg-white flex gap-2">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Hỏi AI: 'Tóm tắt sức khỏe hôm nay', 'Lịch sử chat Telegram', v.v."
                  className="flex-1 text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Gửi hỏi
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Modal Pair Bluetooth */}
        {showPairModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="font-bold text-slate-800 text-base mb-2">Ghép đôi thiết bị Bluetooth mới</h3>
              <p className="text-slate-500 text-xs mb-4">Nhập tên thiết bị đo y tế BLE hoặc cảm biến để Robot Myka quét và kết nối.</p>
              <form onSubmit={handlePairBluetooth} className="space-y-3">
                <input
                  type="text"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="Ví dụ: Máy đo Huyết Áp Omron-BLE #9901"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">
                    Ghép đôi (Pair)
                  </button>
                  <button type="button" onClick={() => setShowPairModal(false)} className="px-3 py-2 border border-slate-200 text-slate-600 text-xs rounded-xl hover:bg-slate-50">
                    Huỷ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  window.FamilyDashboard = FamilyDashboard;
})();
