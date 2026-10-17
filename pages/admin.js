// ============================================================
// pages/admin.js - Admin Portal
// ============================================================
(function () {
  function AdminSidebar({ activeTab, setActiveTab, user, onLogout }) {
    const tabs = [
      { id: 'dashboard', icon: '📊', label: 'Tổng quan' },
      { id: 'tenants', icon: '🏢', label: 'Quản lý Tổ chức' },
      { id: 'users', icon: '👤', label: 'Quản lý Người dùng' },
      { id: 'devices', icon: '🤖', label: 'Thiết bị' },
      { id: 'reports', icon: '📋', label: 'Báo cáo' },
      { id: 'audit', icon: '📜', label: 'Nhật ký hệ thống' },
    ];
    return (
      <div className="w-56 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🤖</span>
            <div>
              <div className="font-bold text-sm">Robot Tâm Sự</div>
              <div className="text-slate-400 text-xs">Admin Portal</div>
            </div>
          </div>
        </div>
        <div className="p-3 border-b border-slate-700">
          <div className="flex items-center gap-2 px-2 py-2">
            <span className="text-xl">{user.avatar}</span>
            <div>
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-slate-400 text-xs">Quản trị viên</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === t.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-sm">
            🚪 <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    );
  }

  function StatCard({ icon, label, value, sub, color }) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-slate-400 text-sm">{label}</div>
            <div className={`text-3xl font-extrabold mt-1 ${color || 'text-slate-800'}`}>{value}</div>
            {sub && <div className="text-slate-400 text-xs mt-1">{sub}</div>}
          </div>
          <div className="text-3xl">{icon}</div>
        </div>
      </div>
    );
  }

  function AdminDashboard({ user, onLogout }) {
    const [activeTab, setActiveTab] = React.useState('dashboard');
    const [tenants, setTenants] = React.useState([]);
    const [devices, setDevices] = React.useState([]);
    const [auditLog, setAuditLog] = React.useState([]);
    const [allUsers, setAllUsers] = React.useState([]);
    const [elders, setElders] = React.useState([]);

    React.useEffect(() => {
      setTenants(RTS.getTenants());
      setDevices(RTS.getDevices());
      setAuditLog(RTS.getAuditLog());
      setAllUsers(RTS.getUsers());
      setElders(RTS.getElders());
    }, []);

    const alerts = RTS.getAlerts();
    const sos = RTS.getSOS();
    const totalElders = elders.length + tenants.reduce((a, t) => a + t.elders, 0) - 3;
    const totalDevices = devices.length + tenants.reduce((a, t) => a + t.devices, 0) - 4;

    const DEVICE_STATUS_COLOR = {
      'Active': 'status-badge-normal',
      'Maintenance': 'status-badge-warning',
      'Offline': 'status-badge-critical',
    };

    const ROLE_LABELS = {
      elder: 'Người cao tuổi', family: 'Người thân', caregiver: 'Điều dưỡng',
      doctor: 'Bác sĩ', admin: 'Quản trị viên', operator: 'Điều hành viên',
    };

    return (
      <div className="flex h-screen bg-slate-100 overflow-hidden">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={onLogout} />

        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <h1 className="text-xl font-bold text-slate-800">
              {activeTab === 'dashboard' ? '📊 Tổng quan Hệ thống' :
               activeTab === 'tenants' ? '🏢 Quản lý Tổ chức' :
               activeTab === 'users' ? '👤 Quản lý Người dùng' :
               activeTab === 'devices' ? '🤖 Quản lý Thiết bị' :
               activeTab === 'reports' ? '📋 Báo cáo' : '📜 Nhật ký Hệ thống'}
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
              Hệ thống hoạt động bình thường
            </div>
          </div>

          <div className="p-6 space-y-5">
            {activeTab === 'dashboard' && (
              <div className="space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon="👴" label="Tổng Người cao tuổi" value={totalElders + 3} sub="Toàn hệ thống" color="text-blue-600" />
                  <StatCard icon="🤖" label="Tổng Thiết bị" value={totalDevices + 4} sub={`${devices.filter(d => d.status === 'Active').length} đang hoạt động`} color="text-green-600" />
                  <StatCard icon="⚠️" label="Cảnh báo đang mở" value={alerts.filter(a => a.status === 'pending').length} sub="Cần xử lý" color="text-yellow-600" />
                  <StatCard icon="🆘" label="SOS hôm nay" value={sos.length} sub="Sự kiện khẩn cấp" color="text-red-600" />
                </div>

                {/* Tenant summary */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="font-bold text-slate-800 mb-4">🏢 Tổ chức đang sử dụng</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-slate-500">
                          <th className="py-2 font-medium">Tên tổ chức</th>
                          <th className="py-2 font-medium text-center">Người dùng</th>
                          <th className="py-2 font-medium text-center">Thiết bị</th>
                          <th className="py-2 font-medium text-center">Gói</th>
                          <th className="py-2 font-medium text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenants.map(t => (
                          <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-2 font-medium text-slate-800">{t.name}</td>
                            <td className="py-2 text-center text-slate-600">{t.elders}</td>
                            <td className="py-2 text-center text-slate-600">{t.devices}</td>
                            <td className="py-2 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${t.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{t.plan}</span>
                            </td>
                            <td className="py-2 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'Active' ? 'status-badge-normal' : 'status-badge-warning'}`}>{t.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent activity */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3 className="font-bold text-slate-800 mb-4">🕐 Hoạt động gần đây</h3>
                  <div className="space-y-2">
                    {auditLog.slice(0, 5).map(a => (
                      <div key={a.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">👤</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-700">{a.action}</div>
                          <div className="text-xs text-slate-400">{a.userName} • {a.detail}</div>
                        </div>
                        <div className="text-xs text-slate-400">{RTS.timeAgo(a.timestamp)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tenants' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-slate-500 text-sm">{tenants.length} tổ chức</div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">➕ Thêm tổ chức</button>
                </div>
                {tenants.map(t => (
                  <div key={t.id} className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-lg">{t.name}</div>
                        <div className="text-slate-400 text-sm">Mã: {t.code} • {t.contactEmail}</div>
                        <div className="text-slate-400 text-sm">☎️ {t.phone}</div>
                        <div className="flex gap-3 mt-3">
                          <div className="text-center"><div className="font-bold text-blue-600">{t.elders}</div><div className="text-xs text-slate-400">Người dùng</div></div>
                          <div className="text-center"><div className="font-bold text-green-600">{t.devices}</div><div className="text-xs text-slate-400">Thiết bị</div></div>
                          <div className="text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${t.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{t.plan}</span>
                            <div className="text-xs text-slate-400">Gói</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <span className={`text-xs px-2 py-1 rounded-full ${t.status === 'Active' ? 'status-badge-normal' : 'status-badge-warning'}`}>{t.status === 'Active' ? '● Hoạt động' : '● Dùng thử'}</span>
                        <button className="text-xs text-blue-600 hover:underline">Chỉnh sửa</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Danh sách người dùng ({allUsers.length})</h3>
                    <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">➕ Thêm</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-left text-slate-500">
                          <th className="py-3 px-5 font-medium">Người dùng</th>
                          <th className="py-3 px-3 font-medium">Email</th>
                          <th className="py-3 px-3 font-medium text-center">Vai trò</th>
                          <th className="py-3 px-3 font-medium text-center">Trạng thái</th>
                          <th className="py-3 px-3 font-medium text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.map(u => (
                          <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{u.avatar}</span>
                                <span className="font-medium text-slate-800">{u.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-500">{u.email}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{ROLE_LABELS[u.role] || u.role}</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-xs status-badge-normal px-2 py-0.5 rounded-full">Hoạt động</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button className="text-xs text-blue-600 hover:underline mr-2">Sửa</button>
                              <button className="text-xs text-red-500 hover:underline">Vô hiệu</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'devices' && (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Đang hoạt động', value: devices.filter(d => d.status === 'Active').length, color: 'text-green-600' },
                    { label: 'Bảo trì', value: devices.filter(d => d.status === 'Maintenance').length, color: 'text-yellow-600' },
                    { label: 'Offline', value: devices.filter(d => d.status === 'Offline').length, color: 'text-red-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-4 text-center shadow-sm">
                      <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-slate-400 text-sm">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Danh sách thiết bị Robot ({devices.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-left text-slate-500">
                          <th className="py-3 px-5 font-medium">ID Thiết bị</th>
                          <th className="py-3 px-3 font-medium">Model</th>
                          <th className="py-3 px-3 font-medium">Người dùng</th>
                          <th className="py-3 px-3 font-medium">Vị trí</th>
                          <th className="py-3 px-3 font-medium text-center">Pin</th>
                          <th className="py-3 px-3 font-medium text-center">Kết nối</th>
                          <th className="py-3 px-3 font-medium text-center">Trạng thái</th>
                          <th className="py-3 px-3 font-medium text-center">Kiểm tra lần cuối</th>
                        </tr>
                      </thead>
                      <tbody>
                        {devices.map(d => (
                          <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-3 px-5 font-mono font-bold text-slate-700">{d.id}</td>
                            <td className="py-3 px-3 text-slate-600">{d.model}</td>
                            <td className="py-3 px-3">
                              {d.elderName ? (
                                <span className="text-slate-700">{d.elderName}</span>
                              ) : <span className="text-slate-400 text-xs">Chưa gán</span>}
                            </td>
                            <td className="py-3 px-3 text-slate-500 text-xs">{d.location}</td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <div className="w-16 bg-slate-200 rounded-full h-2">
                                  <div className={`h-2 rounded-full ${d.battery > 50 ? 'bg-green-500' : d.battery > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: d.battery + '%' }}></div>
                                </div>
                                <span className="text-xs text-slate-500">{d.battery}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center text-xs text-slate-500">{d.connectivity}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${DEVICE_STATUS_COLOR[d.status]}`}>
                                {d.status === 'Active' ? '● Hoạt động' : d.status === 'Maintenance' ? '● Bảo trì' : '● Offline'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center text-xs text-slate-400">{RTS.timeAgo(d.lastPing)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                {[
                  {
                    title: '📊 Báo cáo Huyết áp Tháng 10/2024',
                    rows: [
                      ['Bà Nguyễn Thị Hoa', '127/82', '68 lần', '2 lần cao', 'Ổn định'],
                      ['Ông Trần Văn Nam', '141/89', '54 lần', '8 lần cao', 'Cần theo dõi'],
                      ['Bà Lê Thị Mai', '122/78', '60 lần', '1 lần cao', 'Ổn định'],
                    ],
                    headers: ['Bệnh nhân', 'TB Huyết áp', 'Số lần đo', 'Lần vượt ngưỡng', 'Đánh giá'],
                  },
                  {
                    title: '💊 Báo cáo Tuân thủ Uống thuốc Tháng 10/2024',
                    rows: [
                      ['Bà Nguyễn Thị Hoa', '145/150', '96.7%', 'Tốt'],
                      ['Ông Trần Văn Nam', '132/150', '88%', 'Khá'],
                      ['Bà Lê Thị Mai', '148/150', '98.7%', 'Xuất sắc'],
                    ],
                    headers: ['Bệnh nhân', 'Đã uống/Tổng', 'Tỷ lệ tuân thủ', 'Đánh giá'],
                  },
                ].map(r => (
                  <div key={r.title} className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800">{r.title}</h3>
                      <button className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">📥 Xuất Excel</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 text-left text-slate-500">
                            {r.headers.map(h => <th key={h} className="py-2 font-medium">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {r.rows.map((row, i) => (
                            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                              {row.map((cell, j) => <td key={j} className="py-2 text-slate-700">{cell}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Nhật ký hoạt động hệ thống</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-left text-slate-500">
                        <th className="py-3 px-5 font-medium">Thời gian</th>
                        <th className="py-3 px-3 font-medium">Người dùng</th>
                        <th className="py-3 px-3 font-medium">Hành động</th>
                        <th className="py-3 px-3 font-medium">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLog.map(a => (
                        <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-2.5 px-5 text-slate-400 text-xs">{RTS.formatDateTime(a.timestamp)}</td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">{a.userName}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{a.action}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-xs">{a.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  window.AdminDashboard = AdminDashboard;
})();
