// ============================================================
// pages/family.js - Family Dashboard
// ============================================================
(function () {
  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = Recharts;

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
              <select
                value={form.type}
                onChange={e => {
                  const icons = { medication: '💊', bp: '💓', appointment: '🏥', activity: '🏃' };
                  setForm(f => ({ ...f, type: e.target.value, icon: icons[e.target.value] || '📌' }));
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-400"
              >
                <option value="medication">💊 Uống thuốc</option>
                <option value="bp">💓 Đo huyết áp</option>
                <option value="appointment">🏥 Lịch hẹn khám</option>
                <option value="activity">🏃 Hoạt động</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Tên hoạt động..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-400" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chi tiết</label>
              <input type="text" value={form.detail} onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
                placeholder="Liều lượng, địa điểm..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Giờ</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-400" required />
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
    const [activeTab, setActiveTab] = React.useState('overview');
    const [bpData, setBpData] = React.useState([]);
    const [schedules, setSchedules] = React.useState([]);
    const [alerts, setAlerts] = React.useState([]);
    const [sos, setSos] = React.useState([]);
    const [showAddSchedule, setShowAddSchedule] = React.useState(false);
    const [showService, setShowService] = React.useState(false);
    const [showCall, setShowCall] = React.useState(false);

    React.useEffect(() => {
      const bp = RTS.getBP('E001').slice(-7).map(r => ({
        date: new Date(r.timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        'Tâm thu': r.systolic,
        'Tâm trương': r.diastolic,
        'Nhịp tim': r.heartRate,
      }));
      setBpData(bp);
      setSchedules(RTS.getSchedules('E001'));
      setAlerts(RTS.getAlerts().filter(a => a.elderId === 'E001'));
      setSos(RTS.getSOS().filter(s => s.elderId === 'E001'));
    }, []);

    function refreshSchedules() { setSchedules(RTS.getSchedules('E001')); }

    const latestBP = RTS.getBP('E001').slice(-1)[0];
    const elder = RTS.getElders().find(e => e.id === 'E001');

    const TABS = [
      { id: 'overview', label: '🏠 Tổng quan' },
      { id: 'health', label: '💓 Sức khỏe' },
      { id: 'schedule', label: '📅 Lịch' },
      { id: 'alerts', label: `⚠️ Cảnh báo${alerts.length > 0 ? ` (${alerts.length})` : ''}` },
      { id: 'caregroup', label: '👥 Nhóm chăm sóc' },
    ];

    return (
      <div className="min-h-screen bg-slate-100">
        {/* Header */}
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

        {/* Tab bar */}
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
              {/* Elder status card */}
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
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">💓 Pin: 82%</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCall(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 text-sm"
                  >📞 Gọi điện</button>
                </div>
              </div>

              {/* Latest BP */}
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

              {/* Today tasks */}
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

              {/* SOS events */}
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

              {/* Service package */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-5">
                <div className="text-blue-200 text-sm mb-1">Gói dịch vụ hiện tại</div>
                <div className="text-2xl font-bold mb-1">📦 Gói Nâng cao</div>
                <div className="text-blue-200 text-sm mb-4">Hết hạn: 31/12/2024</div>
                <button onClick={() => setShowService(true)} className="w-full py-2 bg-white text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-50">
                  ⬆️ Nâng cấp gói
                </button>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="font-bold text-slate-800 text-lg mb-4">📈 Biểu đồ Huyết áp 7 ngày</h3>
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
              </div>

              {/* BP History Table */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="font-bold text-slate-800 text-lg mb-4">📋 Lịch sử đo huyết áp</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 text-slate-500 font-medium">Thời gian</th>
                        <th className="text-center py-2 text-slate-500 font-medium">Tâm thu</th>
                        <th className="text-center py-2 text-slate-500 font-medium">Tâm trương</th>
                        <th className="text-center py-2 text-slate-500 font-medium">Nhịp tim</th>
                        <th className="text-center py-2 text-slate-500 font-medium">Trạng thái</th>
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
                <button onClick={() => setShowAddSchedule(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                  ➕ Thêm lịch
                </button>
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
                      {s.confirmed ? '✓ Đã thực hiện' : '⏳ Chờ thực hiện'}
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

          {activeTab === 'caregroup' && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <CareGroup elderId="E001" currentUser={user} />
            </div>
          )}
        </div>

        {/* Call modal */}
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
