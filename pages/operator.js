// ============================================================
// pages/operator.js - Operator Dashboard
// ============================================================
(function () {
  function OperatorSidebar({ activeTab, setActiveTab, user, onLogout }) {
    const tabs = [
      { id: 'robots', icon: '🤖', label: 'Robot Status' },
      { id: 'tasks', icon: '📋', label: 'Nhiệm vụ' },
      { id: 'channels', icon: '📡', label: 'Kênh thông báo' },
      { id: 'escalation', icon: '🆘', label: 'Xử lý khẩn cấp' },
      { id: 'caregroups', icon: '👥', label: 'Nhóm chăm sóc' },
    ];
    return (
      <div className="w-56 bg-teal-900 text-white flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b border-teal-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <div>
              <div className="font-bold text-sm">Robot Tâm Sự</div>
              <div className="text-teal-300 text-xs">Operator Portal</div>
            </div>
          </div>
        </div>
        <div className="p-3 border-b border-teal-700">
          <div className="flex items-center gap-2 px-2 py-2">
            <span className="text-xl">{user.avatar}</span>
            <div>
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-teal-300 text-xs">Điều hành viên</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === t.id ? 'bg-teal-600 text-white' : 'text-teal-200 hover:bg-teal-800 hover:text-white'}`}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-teal-700">
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-teal-300 hover:bg-teal-800 hover:text-white text-sm">
            🚪 <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    );
  }

  function DeviceStatusBadge({ status }) {
    const cfg = {
      'Active': 'bg-green-100 text-green-700 border-green-200',
      'Maintenance': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Offline': 'bg-red-100 text-red-700 border-red-200',
    };
    const dots = { 'Active': 'bg-green-500', 'Maintenance': 'bg-yellow-500', 'Offline': 'bg-red-500' };
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg[status] || cfg['Offline']}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || dots['Offline']}`}></span>
        {status === 'Active' ? 'Online' : status === 'Maintenance' ? 'Bảo trì' : 'Offline'}
      </span>
    );
  }

  function OperatorDashboard({ user, onLogout }) {
    const [activeTab, setActiveTab] = React.useState('robots');
    const [devices, setDevices] = React.useState([]);
    const [tasks, setTasks] = React.useState([]);
    const [channels, setChannels] = React.useState([]);
    const [careGroups, setCareGroups] = React.useState([]);
    const [sos, setSos] = React.useState([]);
    const [showNewTask, setShowNewTask] = React.useState(false);
    const [showNewGroup, setShowNewGroup] = React.useState(false);
    const [newTaskTitle, setNewTaskTitle] = React.useState('');
    const [newTaskPriority, setNewTaskPriority] = React.useState('medium');

    React.useEffect(() => {
      setDevices(RTS.getDevices());
      setTasks(RTS.getOperatorTasks());
      setChannels(RTS.getChannels());
      setCareGroups(RTS.getCareGroups());
      setSos(RTS.getSOS());
    }, []);

    function addTask() {
      if (!newTaskTitle.trim()) return;
      const t = {
        id: RTS.genId(),
        type: 'manual',
        deviceId: null,
        title: newTaskTitle.trim(),
        status: 'Pending',
        priority: newTaskPriority,
        assignedTo: user.name,
        createdAt: new Date().toISOString(),
        dueAt: new Date(Date.now() + 86400000 * 3).toISOString(),
      };
      const all = RTS.LS.get('rts_operator_tasks') || [];
      all.push(t);
      RTS.LS.set('rts_operator_tasks', all);
      setTasks([...tasks, t]);
      setNewTaskTitle('');
      setShowNewTask(false);
    }

    function updateTaskStatus(id, status) {
      const all = RTS.LS.get('rts_operator_tasks') || [];
      const idx = all.findIndex(t => t.id === id);
      if (idx >= 0) { all[idx].status = status; RTS.LS.set('rts_operator_tasks', all); }
      setTasks(RTS.getOperatorTasks());
    }

    const PRIORITY_COLOR = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-slate-100 text-slate-600',
    };
    const PRIORITY_LABEL = { high: '🔴 Cao', medium: '🟡 Trung bình', low: '⚪ Thấp' };
    const TASK_STATUS_COLOR = {
      'In Progress': 'status-badge-warning',
      'Pending': 'bg-slate-100 text-slate-600',
      'Done': 'status-badge-normal',
    };

    const elders = RTS.getElders();

    return (
      <div className="flex h-screen bg-slate-100 overflow-hidden">
        <OperatorSidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={onLogout} />

        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <h1 className="text-xl font-bold text-slate-800">
              {activeTab === 'robots' ? '🤖 Bảng điều khiển Robot' :
               activeTab === 'tasks' ? '📋 Quản lý Nhiệm vụ' :
               activeTab === 'channels' ? '📡 Kênh Thông báo' :
               activeTab === 'escalation' ? '🆘 Hàng đợi Khẩn cấp' : '👥 Quản lý Nhóm Chăm sóc'}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1.5 rounded-full font-medium">
                {devices.filter(d => d.status === 'Active').length}/{devices.length} Robot Online
              </span>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {activeTab === 'robots' && (
              <div className="space-y-4">
                {/* Status overview */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Online', count: devices.filter(d => d.status === 'Active').length, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
                    { label: 'Bảo trì', count: devices.filter(d => d.status === 'Maintenance').length, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
                    { label: 'Offline', count: devices.filter(d => d.status === 'Offline').length, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-4 border text-center ${s.bg}`}>
                      <div className={`text-3xl font-extrabold ${s.color}`}>{s.count}</div>
                      <div className="text-slate-600 text-sm mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Device cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {devices.map(d => (
                    <div key={d.id} className="bg-white rounded-xl shadow-sm p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${d.status === 'Active' ? 'bg-green-100' : d.status === 'Maintenance' ? 'bg-yellow-100' : 'bg-slate-100'}`}>🤖</div>
                          <div>
                            <div className="font-bold text-slate-800 font-mono">{d.id}</div>
                            <div className="text-slate-400 text-xs">{d.model} • {d.firmwareVersion}</div>
                          </div>
                        </div>
                        <DeviceStatusBadge status={d.status} />
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">👤 Người dùng:</span>
                          <span className="text-slate-700 font-medium">{d.elderName || 'Chưa gán'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">📍 Vị trí:</span>
                          <span className="text-slate-600">{d.location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">📶 Kết nối:</span>
                          <span className={`text-xs font-medium ${d.connectivity === 'WiFi' ? 'text-green-600' : 'text-slate-400'}`}>{d.connectivity}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">🔋 Pin:</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-200 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${d.battery > 50 ? 'bg-green-500' : d.battery > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: d.battery + '%' }}></div>
                            </div>
                            <span className={`text-xs font-medium ${d.battery <= 20 ? 'text-red-500' : 'text-slate-600'}`}>{d.battery}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">🕐 Ping cuối:</span>
                          <span className="text-slate-500 text-xs">{RTS.timeAgo(d.lastPing)}</span>
                        </div>
                      </div>

                      {d.battery <= 20 && (
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                          ⚠️ Pin yếu! Cần sạc hoặc thay pin.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4 max-w-3xl">
                <div className="flex justify-between items-center">
                  <div className="text-slate-500 text-sm">{tasks.length} nhiệm vụ</div>
                  <button onClick={() => setShowNewTask(!showNewTask)} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700">
                    ➕ Tạo nhiệm vụ
                  </button>
                </div>

                {showNewTask && (
                  <div className="bg-white rounded-xl shadow-sm p-5 border-2 border-teal-300">
                    <h3 className="font-bold text-slate-800 mb-3">Nhiệm vụ mới</h3>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      placeholder="Mô tả nhiệm vụ..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3 focus:border-teal-400"
                    />
                    <div className="flex gap-3">
                      <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm flex-1">
                        <option value="high">🔴 Ưu tiên Cao</option>
                        <option value="medium">🟡 Ưu tiên Trung bình</option>
                        <option value="low">⚪ Ưu tiên Thấp</option>
                      </select>
                      <button onClick={addTask} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">Tạo</button>
                      <button onClick={() => setShowNewTask(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Huỷ</button>
                    </div>
                  </div>
                )}

                {tasks.map(t => (
                  <div key={t.id} className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[t.priority]}`}>{PRIORITY_LABEL[t.priority]}</span>
                          {t.deviceId && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">{t.deviceId}</span>}
                        </div>
                        <div className="font-medium text-slate-800">{t.title}</div>
                        <div className="text-slate-400 text-xs mt-1">
                          Giao cho: {t.assignedTo} • Tạo: {RTS.timeAgo(t.createdAt)}
                          {t.dueAt && ` • Hạn: ${RTS.formatDate(t.dueAt)}`}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${TASK_STATUS_COLOR[t.status]}`}>{t.status}</span>
                        {t.status === 'Pending' && (
                          <button onClick={() => updateTaskStatus(t.id, 'In Progress')} className="text-xs text-teal-600 hover:underline">▶ Bắt đầu</button>
                        )}
                        {t.status === 'In Progress' && (
                          <button onClick={() => updateTaskStatus(t.id, 'Done')} className="text-xs text-green-600 hover:underline">✓ Hoàn thành</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'channels' && (
              <div className="space-y-4 max-w-3xl">
                {channels.map(c => (
                  <div key={c.id} className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${c.type === 'Zalo' ? 'bg-blue-100' : c.type === 'SMS' ? 'bg-green-100' : 'bg-purple-100'}`}>
                          {c.type === 'Zalo' ? '💬' : c.type === 'SMS' ? '📱' : '📧'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{c.name}</div>
                          <div className="text-slate-400 text-sm">{c.type} • {c.linked}</div>
                          <div className="text-slate-400 text-xs mt-0.5">📨 {c.messages} tin nhắn đã gửi</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${c.status === 'Active' ? 'status-badge-normal' : 'bg-slate-100 text-slate-500'}`}>
                          {c.status === 'Active' ? '● Hoạt động' : '○ Không hoạt động'}
                        </span>
                        <button className="text-xs text-blue-600 hover:underline">Cấu hình</button>
                      </div>
                    </div>
                  </div>
                ))}

                <button className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-teal-400 hover:text-teal-600 transition-colors text-sm font-medium">
                  ➕ Thêm kênh thông báo
                </button>
              </div>
            )}

            {activeTab === 'escalation' && (
              <div className="space-y-4 max-w-3xl">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="font-bold text-amber-700">Hàng đợi xử lý khẩn cấp</div>
                    <div className="text-amber-600 text-sm">Các sự kiện cần xử lý ngay lập tức từ điều dưỡng và người cao tuổi</div>
                  </div>
                </div>

                {sos.map(s => (
                  <div key={s.id} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${s.status === 'pending' ? 'border-red-500' : 'border-green-500'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">🆘</span>
                          <span className="font-bold text-slate-800">SOS - {s.elderName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'pending' ? 'status-badge-critical' : 'status-badge-normal'}`}>
                            {s.status === 'pending' ? '⏳ Đang xử lý' : '✅ Đã xử lý'}
                          </span>
                        </div>
                        <div className="text-slate-500 text-sm">{RTS.formatDateTime(s.timestamp)}</div>
                        {s.status === 'responded' && (
                          <div className="text-green-600 text-sm mt-1">
                            ✅ {s.respondedName} • {RTS.timeAgo(s.respondedAt)}
                            {s.note && <div className="text-slate-600">{s.note}</div>}
                          </div>
                        )}
                      </div>
                      {s.status === 'pending' && (
                        <button className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 flex-shrink-0">
                          📞 Điều phối ngay
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Unresponsive alerts */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="font-bold text-slate-800 mb-3">🔔 Thông báo chưa được phản hồi</h3>
                  {RTS.getAlerts().filter(a => a.status === 'pending').map(a => (
                    <div key={a.id} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
                      <span className="text-xl">{a.severity === 'critical' ? '🚨' : '⚠️'}</span>
                      <div className="flex-1">
                        <div className="font-medium text-slate-800 text-sm">{a.title}</div>
                        <div className="text-slate-500 text-xs">{a.elderName} • {RTS.timeAgo(a.timestamp)}</div>
                      </div>
                      <button className="text-xs text-blue-600 hover:underline flex-shrink-0">Xử lý</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'caregroups' && (
              <div className="space-y-5 max-w-3xl">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-slate-800">Quản lý Nhóm Chăm sóc ({careGroups.length})</h2>
                  <button onClick={() => setShowNewGroup(!showNewGroup)} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700">
                    ➕ Tạo nhóm mới
                  </button>
                </div>

                {showNewGroup && (
                  <div className="bg-white rounded-xl shadow-sm p-5 border-2 border-teal-300">
                    <h3 className="font-bold text-slate-800 mb-3">Tạo nhóm chăm sóc mới</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-slate-600 mb-1">Chọn người cao tuổi</label>
                        <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-teal-400">
                          {elders.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowNewGroup(false)}
                          className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
                        >
                          Tạo nhóm
                        </button>
                        <button onClick={() => setShowNewGroup(false)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Huỷ</button>
                      </div>
                    </div>
                  </div>
                )}

                {careGroups.map(g => (
                  <div key={g.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">👥</span>
                        <div>
                          <span className="font-bold text-teal-800">{g.elderName}</span>
                          <div className="text-teal-600 text-xs">{g.members.length} thành viên • {g.messages.length} tin nhắn</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {g.members.map(m => (
                          <span key={m.id} title={m.name} className="text-xl cursor-help">{m.avatar}</span>
                        ))}
                        <button className="text-xs text-teal-600 hover:underline ml-2">Chỉnh sửa</button>
                      </div>
                    </div>
                    <div className="p-3 text-sm text-slate-500 bg-slate-50">
                      {g.messages.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span>{g.messages.slice(-1)[0].avatar}</span>
                          <div>
                            <span className="font-medium text-slate-700">{g.messages.slice(-1)[0].userName}: </span>
                            <span className="text-slate-500">{g.messages.slice(-1)[0].text.slice(0, 80)}{g.messages.slice(-1)[0].text.length > 80 ? '...' : ''}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  window.OperatorDashboard = OperatorDashboard;
})();
