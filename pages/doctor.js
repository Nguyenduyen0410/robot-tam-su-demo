// ============================================================
// pages/doctor.js - Doctor Dashboard
// ============================================================
(function () {
  function DoctorSidebar({ activeTab, setActiveTab, user, onLogout }) {
    const tabs = [
      { id: 'patients', icon: '👥', label: 'Bệnh nhân' },
      { id: 'analysis', icon: '📈', label: 'Phân tích BP' },
      { id: 'notifications', icon: '🔔', label: 'Thông báo Robot' },
      { id: 'robot_chat', icon: '🤖', label: 'Trò chuyện Robot' },
      { id: 'alerts', icon: '⚠️', label: 'Cảnh báo AI' },
      { id: 'schedule', icon: '📅', label: 'Lịch điều trị' },
      { id: 'telegram_consult', icon: '💬', label: 'Tư vấn Telegram' },
    ];
    return (
      <div className="w-56 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{user.avatar}</span>
            <div>
              <div className="font-bold text-slate-800 text-sm">{user.name}</div>
              <div className="text-blue-500 text-xs font-medium">{user.department}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`sidebar-link w-full text-left text-sm ${activeTab === t.id ? 'active' : ''}`}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button onClick={onLogout} className="sidebar-link w-full text-left text-sm text-red-500">🚪 Đăng xuất</button>
        </div>
      </div>
    );
  }

  function RiskBadge({ level }) {
    const cfg = {
      'Cao': 'bg-red-100 text-red-700 border-red-200',
      'Trung bình': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Thấp': 'bg-green-100 text-green-700 border-green-200',
    };
    const icons = { 'Cao': '🔴', 'Trung bình': '🟡', 'Thấp': '🟢' };
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${cfg[level] || cfg['Thấp']}`}>
        {icons[level]} Rủi ro: {level}
      </span>
    );
  }

  function DoctorDashboard({ user, onLogout }) {
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } = window.Recharts || {};
    const [activeTab, setActiveTab] = React.useState('patients');
    const [selectedElder, setSelectedElder] = React.useState('E001');
    const [allBP, setAllBP] = React.useState({});
    const [alerts, setAlerts] = React.useState([]);
    const elders = RTS.getElders();

    React.useEffect(() => {
      const bp = {};
      elders.forEach(e => { bp[e.id] = RTS.getBP(e.id); });
      setAllBP(bp);
      setAlerts(RTS.getAlerts());
    }, []);

    function getRiskLevel(elderId) {
      const bp = (allBP[elderId] || []).slice(-3);
      if (bp.length === 0) return 'Thấp';
      const critCount = bp.filter(r => r.status === 'critical').length;
      const warnCount = bp.filter(r => r.status === 'warning').length;
      if (critCount >= 2) return 'Cao';
      if (critCount >= 1 || warnCount >= 2) return 'Trung bình';
      return 'Thấp';
    }

    function getElderTrend(elderId) {
      const bp = (allBP[elderId] || []).slice(-7);
      if (bp.length < 2) return 'stable';
      const avg1 = bp.slice(0, 3).reduce((a, b) => a + b.systolic, 0) / 3;
      const avg2 = bp.slice(-3).reduce((a, b) => a + b.systolic, 0) / 3;
      if (avg2 > avg1 + 5) return 'rising';
      if (avg2 < avg1 - 5) return 'falling';
      return 'stable';
    }

    const currentElder = elders.find(e => e.id === selectedElder);
    const currentBP = allBP[selectedElder] || [];
    const chart7 = currentBP.slice(-7).map(r => ({
      date: new Date(r.timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      'Tâm thu': r.systolic,
      'Tâm trương': r.diastolic,
      'Nhịp tim': r.heartRate,
    }));
    const avgSystolic = currentBP.length > 0 ? Math.round(currentBP.slice(-7).reduce((a, b) => a + b.systolic, 0) / Math.min(currentBP.length, 7)) : 0;

    return (
      <div className="flex h-screen bg-slate-100 overflow-hidden">
        <DoctorSidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={onLogout} />

        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {activeTab === 'patients' ? '👥 Tổng quan Bệnh nhân' :
                 activeTab === 'analysis' ? '📈 Phân tích Huyết áp' :
                 activeTab === 'notifications' ? '🔔 Thông báo trực tiếp từ Robot' :
                 activeTab === 'robot_chat' ? '🤖 Lịch sử Trò chuyện Robot' :
                 activeTab === 'alerts' ? '⚠️ Cảnh báo & AI Dự đoán' :
                 activeTab === 'schedule' ? '📅 Lịch Điều trị' : '💬 Nhóm Chăm sóc'}
              </h1>
              <div className="text-slate-400 text-sm">{user.department} • Bác sĩ phụ trách chính của: Bà Nguyễn Thị Hoa (P101)</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {activeTab === 'patients' && (
              <div className="grid grid-cols-1 gap-4">
                {/* Summary row */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Bệnh nhân', value: elders.length, icon: '👥', color: 'text-blue-600' },
                    { label: 'Cần theo dõi', value: elders.filter(e => getRiskLevel(e.id) !== 'Thấp').length, icon: '⚠️', color: 'text-yellow-600' },
                    { label: 'Cảnh báo mới', value: alerts.filter(a => a.status === 'pending').length, icon: '🚨', color: 'text-red-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
                      <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
                      <div className="text-slate-500 text-sm mt-1">{s.icon} {s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Patient cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {elders.map(e => {
                    const latestBP = (allBP[e.id] || []).slice(-1)[0];
                    const risk = getRiskLevel(e.id);
                    const trend = getElderTrend(e.id);
                    return (
                      <div key={e.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition cursor-pointer"
                           onClick={() => { setSelectedElder(e.id); setActiveTab('analysis'); }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">{e.avatar}</div>
                            <div>
                              <div className="font-bold text-slate-800 text-sm">{e.name}</div>
                              <div className="text-slate-400 text-xs">{e.age} tuổi • {e.room}</div>
                            </div>
                          </div>
                          <RiskBadge level={risk} />
                        </div>
                        {latestBP ? (
                          <div className="space-y-1">
                            <div className={`text-xl font-extrabold ${latestBP.status === 'normal' ? 'bp-normal' : latestBP.status === 'warning' ? 'bp-warning' : 'bp-critical'}`}>
                              {latestBP.systolic}/{latestBP.diastolic} <span className="text-xs text-slate-400 font-normal">mmHg</span>
                            </div>
                            <div className="text-slate-500 text-xs">💗 Nhịp tim: {latestBP.heartRate} bpm</div>
                            <div className="text-xs text-slate-400">{RTS.timeAgo(latestBP.timestamp)}</div>
                          </div>
                        ) : <div className="text-slate-400 text-sm">Chưa có dữ liệu</div>}
                        <div className={`mt-2 text-xs font-medium ${trend === 'rising' ? 'text-red-500' : trend === 'falling' ? 'text-green-500' : 'text-slate-400'}`}>
                          {trend === 'rising' ? '↑ Xu hướng tăng' : trend === 'falling' ? '↓ Xu hướng giảm' : '→ Ổn định'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="space-y-4">
                {/* Elder selector */}
                <div className="flex gap-2">
                  {elders.map(e => (
                    <button key={e.id} onClick={() => setSelectedElder(e.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition ${selectedElder === e.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
                      {e.name}
                    </button>
                  ))}
                </div>

                {currentElder && (
                  <>
                    {/* Summary stats */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'TB Tâm thu', value: avgSystolic + ' mmHg', color: avgSystolic >= 140 ? 'text-red-600' : avgSystolic >= 130 ? 'text-yellow-600' : 'text-green-600' },
                        { label: 'Tâm thu max', value: Math.max(...currentBP.slice(-7).map(r => r.systolic)) + ' mmHg', color: 'text-red-500' },
                        { label: 'Tâm thu min', value: Math.min(...currentBP.slice(-7).map(r => r.systolic)) + ' mmHg', color: 'text-green-500' },
                        { label: 'Mức độ rủi ro', value: getRiskLevel(selectedElder), color: getRiskLevel(selectedElder) === 'Cao' ? 'text-red-600' : getRiskLevel(selectedElder) === 'Trung bình' ? 'text-yellow-600' : 'text-green-600' },
                      ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
                          <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                          <div className="text-slate-400 text-xs mt-1">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* 7-day chart */}
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-4">📈 Biểu đồ Huyết áp 7 ngày - {currentElder.name}</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={chart7} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis domain={[60, 170]} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Ngưỡng cao', fill: '#ef4444', fontSize: 11 }} />
                          <ReferenceLine y={130} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Cần theo dõi', fill: '#f59e0b', fontSize: 11 }} />
                          <Line type="monotone" dataKey="Tâm thu" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="Tâm trương" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="Nhịp tim" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* BP Detail Table */}
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-3">📋 Chi tiết đo huyết áp</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-500 text-left">
                              <th className="py-2 font-medium">Thời gian</th>
                              <th className="py-2 font-medium text-center">Tâm thu</th>
                              <th className="py-2 font-medium text-center">Tâm trương</th>
                              <th className="py-2 font-medium text-center">Nhịp tim</th>
                              <th className="py-2 font-medium text-center">Phân loại</th>
                              <th className="py-2 font-medium text-center">Nguy cơ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentBP.slice(-7).reverse().map(r => (
                              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                                <td className="py-2 text-slate-500">{RTS.formatDateTime(r.timestamp)}</td>
                                <td className={`py-2 text-center font-bold text-base ${r.status === 'normal' ? 'bp-normal' : r.status === 'warning' ? 'bp-warning' : 'bp-critical'}`}>{r.systolic}</td>
                                <td className="py-2 text-center text-slate-700">{r.diastolic}</td>
                                <td className="py-2 text-center text-slate-700">{r.heartRate}</td>
                                <td className="py-2 text-center">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'normal' ? 'status-badge-normal' : r.status === 'warning' ? 'status-badge-warning' : 'status-badge-critical'}`}>
                                    {RTS.bpLabel(r.systolic)}
                                  </span>
                                </td>
                                <td className="py-2 text-center">
                                  <RiskBadge level={r.status === 'critical' ? 'Cao' : r.status === 'warning' ? 'Trung bình' : 'Thấp'} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4 max-w-4xl">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📡</span>
                    <div>
                      <div className="font-bold text-blue-900 text-sm">Hệ thống thông báo y tế tức thì</div>
                      <div className="text-blue-700 text-xs">Kết quả đo huyết áp, cảnh báo nguy cơ và sự kiện khẩn cấp từ Robot của người già được gửi thẳng đến Bác sĩ.</div>
                    </div>
                  </div>
                  <button onClick={() => location.reload()} className="px-3 py-1 bg-white text-blue-600 rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-50">Làm mới</button>
                </div>

                <div className="space-y-3">
                  {RTS.getNotifications(user.id).length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-slate-400">Không có thông báo mới</div>
                  ) : RTS.getNotifications(user.id).map(n => {
                    const icons = { bp_result: '💓', sos: '🚨', bp_alert: '⚠️', chat_summary: '💬', schedule_missed: '📋' };
                    const bg = n.type === 'sos' ? 'bg-red-50 border-red-300' : n.type === 'bp_alert' ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200';
                    return (
                      <div key={n.id} className={`p-4 rounded-xl border shadow-sm flex items-start gap-3 ${bg}`}>
                        <span className="text-2xl flex-shrink-0">{icons[n.type] || '🔔'}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-sm">{n.title}</span>
                            <span className="text-xs text-slate-400">{RTS.timeAgo(n.timestamp)}</span>
                          </div>
                          <div className="text-slate-600 text-sm mt-1">{n.detail}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'robot_chat' && (
              <div className="space-y-4 max-w-4xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-slate-600">Chọn bệnh nhân để xem lời tâm sự với Robot:</span>
                  {elders.map(e => (
                    <button key={e.id} onClick={() => setSelectedElder(e.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${selectedElder === e.id ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}>
                      {e.avatar} {e.name}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <div className="font-bold text-slate-800 text-sm">Ghi nhận ngôn ngữ & tâm lý từ AI Robot ({currentElder ? currentElder.name : ''})</div>
                    <div className="text-slate-500 text-xs">Hỗ trợ Bác sĩ đánh giá các triệu chứng cơ năng (đau đầu, chóng mặt, mất ngủ, trầm cảm...) qua tương tác thoại hàng ngày.</div>
                  </div>

                  <div className="p-5 space-y-3 max-h-96 overflow-y-auto scrollbar-thin bg-slate-50">
                    {RTS.getChatHistory(selectedElder).length === 0 ? (
                      <div className="text-center text-slate-400 py-8">Chưa có dữ liệu trò chuyện ghi nhận cho bệnh nhân này</div>
                    ) : RTS.getChatHistory(selectedElder).map(c => (
                      <div key={c.id} className={`flex ${c.sender === 'elder' ? 'justify-end' : 'justify-start'} gap-2`}>
                        {c.sender === 'robot' && <span className="text-xl flex-shrink-0 mt-1">🤖</span>}
                        <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${c.sender === 'elder' ? 'chat-bubble-user' : 'chat-bubble-robot'}`}>
                          <div className="font-semibold text-xs mb-1 opacity-75">{c.sender === 'elder' ? (currentElder ? currentElder.name : 'Người cao tuổi') : 'Robot Tâm Sự'}</div>
                          <div>{c.text}</div>
                          <div className={`text-xs mt-1 ${c.sender === 'elder' ? 'text-blue-200' : 'text-slate-400'}`}>{RTS.timeAgo(c.timestamp)}</div>
                        </div>
                        {c.sender === 'elder' && <span className="text-xl flex-shrink-0 mt-1">{currentElder ? currentElder.avatar : '👵'}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-3 max-w-4xl">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <div className="font-bold text-blue-700">AI Dự đoán Rủi ro</div>
                    <div className="text-blue-600 text-sm">Hệ thống AI phân tích xu hướng huyết áp và đưa ra cảnh báo sớm dựa trên dữ liệu 7 ngày gần nhất.</div>
                  </div>
                </div>

                {elders.map(e => {
                  const risk = getRiskLevel(e.id);
                  const trend = getElderTrend(e.id);
                  if (risk === 'Thấp' && trend === 'stable') return null;
                  return (
                    <div key={e.id} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${risk === 'Cao' ? 'border-red-500' : 'border-yellow-500'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <span className="text-3xl">{e.avatar}</span>
                          <div>
                            <div className="font-bold text-slate-800">{e.name}</div>
                            <div className="text-slate-500 text-sm">{e.age} tuổi • {e.room}</div>
                            <div className="flex gap-2 mt-2">
                              <RiskBadge level={risk} />
                              <span className={`text-xs px-2 py-1 rounded-full border font-medium ${trend === 'rising' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                🤖 AI: {trend === 'rising' ? 'Xu hướng tăng - Cần can thiệp' : 'Cần theo dõi thêm'}
                              </span>
                            </div>
                            <div className="text-slate-600 text-sm mt-2">
                              {risk === 'Cao' ? '⚠️ Khuyến nghị: Điều chỉnh phác đồ điều trị, tăng tần suất đo huyết áp.' :
                               '💊 Khuyến nghị: Tiếp tục theo dõi, kiểm tra tuân thủ dùng thuốc.'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => { setSelectedElder(e.id); setActiveTab('analysis'); }}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex-shrink-0"
                        >
                          Xem phân tích
                        </button>
                      </div>
                    </div>
                  );
                }).filter(Boolean)}

                {alerts.map(a => (
                  <div key={a.id} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${a.severity === 'critical' ? 'border-red-500' : 'border-yellow-500'}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{a.severity === 'critical' ? '🚨' : '⚠️'}</span>
                      <div>
                        <div className="font-bold text-slate-800">{a.title}</div>
                        <div className="text-slate-500 text-sm">{a.elderName} • {a.detail}</div>
                        <div className="text-slate-400 text-xs mt-1">{RTS.timeAgo(a.timestamp)}</div>
                        <RiskBadge level={a.riskLevel} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-4 max-w-3xl">
                {elders.map(e => {
                  const s = RTS.getSchedules(e.id);
                  return (
                    <div key={e.id} className="bg-white rounded-xl shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{e.avatar}</span>
                        <div>
                          <div className="font-bold text-slate-800">{e.name}</div>
                          <div className="text-slate-400 text-xs">{e.room} • <RiskBadge level={getRiskLevel(e.id)} /></div>
                        </div>
                      </div>
                      {s.length === 0 ? (
                        <div className="text-slate-400 text-sm">Không có lịch hôm nay</div>
                      ) : (
                        <div className="space-y-2">
                          {s.map(sch => (
                            <div key={sch.id} className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${sch.confirmed ? 'bg-green-50' : 'bg-slate-50'}`}>
                              <span>{sch.icon}</span>
                              <div className="flex-1">
                                <span className={sch.confirmed ? 'line-through text-slate-400' : 'text-slate-700'}>{sch.title}</span>
                                {sch.detail && <div className="text-slate-400 text-xs">{sch.detail}</div>}
                              </div>
                              <span className="text-slate-400 text-xs">{RTS.formatTime(sch.time)}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${sch.confirmed ? 'status-badge-normal' : 'bg-slate-200 text-slate-600'}`}>
                                {sch.confirmed ? '✓ Xong' : '⏳ Chờ'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'telegram_consult' && (
              <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl border border-slate-200">
                <div className="text-center space-y-4">
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto">💬</div>
                  <h3 className="text-xl font-bold text-slate-800">Kênh Tư Vấn Y Tế Chính Thức qua Telegram</h3>
                  <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl p-3 text-xs text-left leading-relaxed">
                    <span className="font-bold">⚠️ Quy định bảo mật & Y tế: </span>
                    Ứng dụng hoạt động ở chế độ <b>Chỉ Giám sát (Read-Only)</b> đối với chỉ số lâm sàng. 
                    Nhằm tuân thủ quy chuẩn pháp lý và lưu trữ hồ sơ y tế, Bác sĩ không trao đổi riêng lẻ với người thân trong ứng dụng này. 
                    Mọi hoạt động tư vấn, hướng dẫn phác đồ thuốc hoặc hội chẩn cùng Điều dưỡng được thực hiện qua Nhóm Telegram chính thức.
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left text-xs space-y-2">
                    <div><b>Bệnh nhân phụ trách:</b> Bà Nguyễn Thị Hoa (72 tuổi, phòng P101)</div>
                    <div><b>Kênh Telegram:</b> @myka_care_p101_bot</div>
                    <div><b>Thành viên nhóm:</b> BS. Phạm Minh Tuấn, ĐD. Nguyễn Thị Lan, Chị Duyên</div>
                  </div>
                  <div className="pt-2">
                    <a
                      href="https://t.me/myka_care_p101_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition"
                    >
                      🚀 Mở Kênh Tư Vấn Telegram (@myka_care_p101_bot)
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  window.DoctorDashboard = DoctorDashboard;
})();
