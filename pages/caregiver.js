// ============================================================
// pages/caregiver.js - Caregiver / Nurse Dashboard
// ============================================================
(function () {

  function Sidebar({ activeTab, setActiveTab, user, onLogout }) {
    const tabs = [
      { id: 'patients', icon: '👥', label: 'Bệnh nhân' },
      { id: 'notifications', icon: '🔔', label: 'Thông báo Robot' },
      { id: 'robot_chat', icon: '🤖', label: 'Trò chuyện Robot' },
      { id: 'alerts', icon: '⚠️', label: 'Cảnh báo' },
      { id: 'schedule', icon: '📅', label: 'Lịch chăm sóc' },
      { id: 'caregroup', icon: '💬', label: 'Nhóm chăm sóc' },
    ];
    return (
      <div className="w-56 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{user.avatar}</span>
            <div>
              <div className="font-bold text-slate-800 text-sm">{user.name}</div>
              <div className="text-slate-500 text-xs">Điều dưỡng</div>
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

  function PatientCard({ elder, bpData, onClick, selected }) {
    const latestBP = bpData.slice(-1)[0];
    const status = latestBP ? latestBP.status : 'normal';
    return (
      <div
        onClick={onClick}
        className={`bg-white rounded-xl p-4 cursor-pointer border-2 transition-all ${selected ? 'border-blue-500 shadow-md' : 'border-slate-100 hover:border-slate-300'}`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${
            status === 'normal' ? 'bg-green-100' : status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
          }`}>{elder.avatar}</div>
          <div className="flex-1">
            <div className="font-bold text-slate-800">{elder.name}</div>
            <div className="text-slate-400 text-xs">{elder.age} tuổi • {elder.room}</div>
            {latestBP ? (
              <div className={`text-sm font-semibold mt-1 ${status === 'normal' ? 'bp-normal' : status === 'warning' ? 'bp-warning' : 'bp-critical'}`}>
                💓 {latestBP.systolic}/{latestBP.diastolic} mmHg
              </div>
            ) : <div className="text-slate-400 text-xs">Chưa có dữ liệu</div>}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
            status === 'normal' ? 'status-badge-normal' : status === 'warning' ? 'status-badge-warning' : 'status-badge-critical'
          }`}>
            {status === 'normal' ? '✓ Bình thường' : status === 'warning' ? '⚠ Cần theo dõi' : '🚨 Nguy hiểm'}
          </span>
        </div>
      </div>
    );
  }

  function CaregiverDashboard({ user, onLogout }) {
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = window.Recharts || {};
    const [activeTab, setActiveTab] = React.useState('patients');
    const [selectedElder, setSelectedElder] = React.useState('E001');
    const [alerts, setAlerts] = React.useState([]);
    const [allBP, setAllBP] = React.useState({});
    const elders = RTS.getElders();

    React.useEffect(() => {
      const bp = {};
      elders.forEach(e => { bp[e.id] = RTS.getBP(e.id); });
      setAllBP(bp);
      setAlerts(RTS.getAlerts());
    }, []);

    function acknowledgeAlert(id) {
      RTS.updateAlert(id, { status: 'acknowledged' });
      setAlerts(RTS.getAlerts());
    }

    const criticalElders = elders.filter(e => {
      const bp = (allBP[e.id] || []).slice(-1)[0];
      return bp && bp.status === 'critical';
    });

    const currentElder = elders.find(e => e.id === selectedElder);
    const currentBP = allBP[selectedElder] || [];
    const chartData = currentBP.slice(-7).map(r => ({
      date: new Date(r.timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      'Tâm thu': r.systolic,
      'Tâm trương': r.diastolic,
    }));
    const schedules = RTS.getSchedules(selectedElder);

    return (
      <div className="flex h-screen bg-slate-100 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={onLogout} />

        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {activeTab === 'patients' ? '👥 Danh sách Bệnh nhân' :
                 activeTab === 'notifications' ? '🔔 Thông báo trực tiếp từ Robot' :
                 activeTab === 'robot_chat' ? '🤖 Lịch sử Trò chuyện Robot' :
                 activeTab === 'alerts' ? '⚠️ Quản lý Cảnh báo' :
                 activeTab === 'schedule' ? '📅 Lịch Chăm sóc' : '💬 Nhóm Chăm sóc'}
              </h1>
              <div className="text-slate-400 text-sm">{user.department} • Gắn trực tiếp 1-1 với: Bà Nguyễn Thị Hoa (P101)</div>
            </div>
            <div className="text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}
            </div>
          </div>

          <div className="p-6 space-y-4">
            {activeTab === 'patients' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: Patient list */}
                <div className="space-y-3">
                  {/* Critical alerts */}
                  {criticalElders.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <div className="text-red-700 font-bold text-sm mb-2">🚨 Bệnh nhân cần ưu tiên!</div>
                      {criticalElders.map(e => (
                        <div key={e.id} className="bg-red-100 rounded-lg px-3 py-2 text-sm text-red-800 mb-1">
                          {e.name} - Huyết áp nguy hiểm!
                        </div>
                      ))}
                    </div>
                  )}

                  <h3 className="font-semibold text-slate-600 text-sm">Tất cả bệnh nhân ({elders.length})</h3>
                  {elders.map(e => (
                    <PatientCard
                      key={e.id}
                      elder={e}
                      bpData={allBP[e.id] || []}
                      onClick={() => setSelectedElder(e.id)}
                      selected={selectedElder === e.id}
                    />
                  ))}
                </div>

                {/* Right: Patient detail */}
                <div className="lg:col-span-2 space-y-4">
                  {currentElder && (
                    <>
                      <div className="bg-white rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-3xl">{currentElder.avatar}</div>
                          <div>
                            <div className="font-bold text-xl text-slate-800">{currentElder.name}</div>
                            <div className="text-slate-500 text-sm">{currentElder.age} tuổi • {currentElder.room}</div>
                          </div>
                        </div>
                        {chartData.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-slate-600 mb-2">📈 Xu hướng huyết áp 7 ngày</div>
                            <ResponsiveContainer width="100%" height={180}>
                              <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis domain={[60, 165]} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="Tâm thu" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="Tâm trương" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>

                      {/* BP table */}
                      <div className="bg-white rounded-xl p-5 shadow-sm">
                        <h3 className="font-semibold text-slate-800 mb-3">📋 Lịch sử đo huyết áp</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-100 text-left text-slate-500">
                                <th className="py-2 font-medium">Thời gian</th>
                                <th className="py-2 font-medium text-center">Tâm thu</th>
                                <th className="py-2 font-medium text-center">Tâm trương</th>
                                <th className="py-2 font-medium text-center">Nhịp tim</th>
                                <th className="py-2 font-medium text-center">Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentBP.slice(-5).reverse().map(r => (
                                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                                  <td className="py-2 text-slate-500">{RTS.formatDateTime(r.timestamp)}</td>
                                  <td className={`py-2 text-center font-bold ${r.status === 'normal' ? 'bp-normal' : r.status === 'warning' ? 'bp-warning' : 'bp-critical'}`}>{r.systolic}</td>
                                  <td className="py-2 text-center text-slate-600">{r.diastolic}</td>
                                  <td className="py-2 text-center text-slate-600">{r.heartRate}</td>
                                  <td className="py-2 text-center">
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

                      {/* Schedule */}
                      <div className="bg-white rounded-xl p-5 shadow-sm">
                        <h3 className="font-semibold text-slate-800 mb-3">📅 Lịch hôm nay</h3>
                        <div className="space-y-2">
                          {schedules.map(s => (
                            <div key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border ${s.confirmed ? 'border-green-200 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
                              <span className="text-xl">{s.icon}</span>
                              <div className="flex-1">
                                <div className={`font-medium text-sm ${s.confirmed ? 'text-green-700 line-through' : 'text-slate-700'}`}>{s.title}</div>
                                <div className="text-slate-400 text-xs">{s.detail}</div>
                              </div>
                              <div className="text-xs text-slate-500">{RTS.formatTime(s.time)}</div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${s.confirmed ? 'status-badge-normal' : 'status-badge-warning'}`}>
                                {s.confirmed ? '✓ Xong' : 'Chờ'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4 max-w-4xl">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📡</span>
                    <div>
                      <div className="font-bold text-blue-900 text-sm">Đồng bộ dữ liệu thời gian thực từ Robot Companion</div>
                      <div className="text-blue-700 text-xs">Các sự kiện đo huyết áp, SOS, bỏ lỡ lịch thuốc và lời nói của người già được chuyển tức thì về đây.</div>
                    </div>
                  </div>
                  <button onClick={() => location.reload()} className="px-3 py-1 bg-white text-blue-600 rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-50">Làm mới</button>
                </div>

                <div className="space-y-3">
                  {RTS.getNotifications(user.id).length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-slate-400">Chưa có thông báo nào</div>
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
                  <span className="text-sm font-medium text-slate-600">Xem trò chuyện của người già:</span>
                  {elders.map(e => (
                    <button key={e.id} onClick={() => setSelectedElder(e.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${selectedElder === e.id ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}>
                      {e.avatar} {e.name}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🤖</span>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">Nhật ký trò chuyện với Robot Companion</div>
                        <div className="text-slate-500 text-xs">Dữ liệu ghi âm / chuyển thành văn bản từ micro Robot tại phòng {currentElder ? currentElder.room : ''}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-3 max-h-96 overflow-y-auto scrollbar-thin bg-slate-50">
                    {RTS.getChatHistory(selectedElder).length === 0 ? (
                      <div className="text-center text-slate-400 py-8">Chưa có bản ghi trò chuyện cho {currentElder ? currentElder.name : 'người này'}</div>
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
              <div className="space-y-3 max-w-3xl">
                {alerts.length === 0 ? (
                  <div className="bg-white rounded-xl p-10 text-center text-slate-400">
                    <div className="text-5xl mb-3">✅</div>
                    <div>Không có cảnh báo nào cần xử lý</div>
                  </div>
                ) : alerts.map(a => (
                  <div key={a.id} className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${a.severity === 'critical' ? 'border-red-500' : 'border-yellow-500'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <span className="text-2xl">{a.severity === 'critical' ? '🚨' : '⚠️'}</span>
                        <div>
                          <div className="font-bold text-slate-800">{a.title}</div>
                          <div className="text-slate-500 text-sm">{a.elderName} • {a.detail}</div>
                          <div className="text-slate-400 text-xs mt-1">{RTS.timeAgo(a.timestamp)}</div>
                          <div className={`text-xs mt-1 font-medium ${a.riskLevel === 'Cao' ? 'text-red-600' : 'text-yellow-600'}`}>
                            🎯 Mức độ rủi ro: {a.riskLevel}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {a.status === 'pending' ? (
                          <button onClick={() => acknowledgeAlert(a.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                            ✓ Xác nhận đã xử lý
                          </button>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full status-badge-normal">✓ Đã xử lý</span>
                        )}
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
                      <div className="font-bold text-slate-800 mb-3">{e.avatar} {e.name} - {e.room}</div>
                      {s.length === 0 ? (
                        <div className="text-slate-400 text-sm">Không có lịch hôm nay</div>
                      ) : (
                        <div className="space-y-2">
                          {s.map(sch => (
                            <div key={sch.id} className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${sch.confirmed ? 'bg-green-50' : 'bg-slate-50'}`}>
                              <span>{sch.icon}</span>
                              <div className="flex-1">
                                <span className={sch.confirmed ? 'line-through text-slate-400' : 'text-slate-700'}>{sch.title}</span>
                                <div className="text-slate-400 text-xs">{sch.detail}</div>
                              </div>
                              <span className="text-slate-400 text-xs">{RTS.formatTime(sch.time)}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${sch.confirmed ? 'status-badge-normal' : 'bg-slate-200 text-slate-600'}`}>
                                {sch.confirmed ? '✓' : '⏳'}
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

            {activeTab === 'caregroup' && (
              <div className="space-y-4 max-w-3xl">
                {elders.map(e => (
                  <div key={e.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                      <span className="font-semibold text-slate-700">{e.avatar} {e.name}</span>
                    </div>
                    <CareGroup elderId={e.id} currentUser={user} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  window.CaregiverDashboard = CaregiverDashboard;
})();
