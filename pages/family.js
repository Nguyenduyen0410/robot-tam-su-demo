// Myka Care Companion App — family-facing views defined by the approved report.
(function () {
  function FamilyDashboard({ user, onLogout }) {
    const elderId = 'E001';
    const apiBase = String(window.MYKA_API_BASE || '').replace(/\/$/, '');
    const apiUrl = path => `${apiBase}/api${path}`;
    const [tab, setTab] = React.useState('health');
    const [days, setDays] = React.useState(7);
    const [readings, setReadings] = React.useState(() => RTS.getBP(elderId) || []);
    const [schedules, setSchedules] = React.useState(() => RTS.getSchedules(elderId) || []);
    const [maintenance, setMaintenance] = React.useState([
      { id: 'MNT-DEMO-01', title: 'Kiểm tra máy đo huyết áp', detail: 'Đến hạn kiểm tra định kỳ thiết bị đo huyết áp.', status: 'pending', due_at: '2026-10-30' },
    ]);
    const [connectivity, setConnectivity] = React.useState(null);
    const [wifiForm, setWifiForm] = React.useState({ ssid: '', password: '' });
    const [newDeviceName, setNewDeviceName] = React.useState('');
    const [deviceMessage, setDeviceMessage] = React.useState('');
    const demoPayment = { id: 'PAY-DEMO-01', service_name: 'Myka Care · Gói tháng', amount: 299000, currency: 'VND', status: 'paid', period_start: '2026-09-22', period_end: '2026-10-22', paid_at: '2026-09-22' };
    const [subscription, setSubscription] = React.useState({ current_plan: demoPayment, payments: [] });
    const [agentStatus, setAgentStatus] = React.useState(null);
    const [telegramLinks, setTelegramLinks] = React.useState({ group_chat_url: '' });
    const [apiAvailable, setApiAvailable] = React.useState(false);

    React.useEffect(() => {
      let active = true;
      Promise.all([
        fetch(apiUrl(`/family/health-summary/${elderId}?days=${days}`)).then(r => r.ok ? r.json() : Promise.reject()),
        fetch(apiUrl(`/family/schedules/${elderId}`)).then(r => r.ok ? r.json() : Promise.reject()),
        fetch(apiUrl(`/family/maintenance-notifications/${elderId}`)).then(r => r.ok ? r.json() : Promise.reject()),
        fetch(apiUrl(`/family/subscription/${elderId}`)).then(r => r.ok ? r.json() : Promise.reject()),
      ]).then(([health, plan, notices, payments]) => {
        if (!active) return;
        setReadings((health.daily_readings || []).slice().reverse());
        setSchedules(plan);
        setMaintenance(notices);
        setSubscription(payments);
        setApiAvailable(true);
      }).catch(() => {
        if (active) setApiAvailable(false);
      });
      fetch(apiUrl(`/family/telegram-consultation/${elderId}`))
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
          if (active) setTelegramLinks({
            group_chat_url: data.group_chat_url || '',
          });
        }).catch(() => {});
      fetch(apiUrl(`/family/agent-status/${elderId}`))
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => { if (active) setAgentStatus(data); })
        .catch(() => { if (active) setAgentStatus(null); });
      fetch(apiUrl(`/device/connectivity/${elderId}`))
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => { if (active) setConnectivity(data); })
        .catch(() => { if (active) setConnectivity(null); });
      return () => { active = false; };
    }, [days]);

    const elder = RTS.getElders().find(e => e.id === elderId);
    const fallbackReadings = RTS.getBP(elderId) || [];
    const visibleReadings = apiAvailable ? readings : fallbackReadings.slice(-days);
    const latest = visibleReadings[visibleReadings.length - 1];
    const avg = (key) => visibleReadings.length
      ? Math.round(visibleReadings.reduce((sum, row) => sum + Number(row[key] || 0), 0) / visibleReadings.length)
      : '—';
    const avgHeartRate = visibleReadings.some(row => row.heart_rate !== undefined)
      ? avg('heart_rate') : avg('heartRate');
    const dateLabel = value => {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
    };
    const scheduleRows = apiAvailable ? schedules : schedules.map(s => ({
      ...s, scheduled_at: s.scheduled_at || s.time, type: s.type === 'appointment' ? 'checkup' : s.type,
    })).filter(s => ['medication', 'checkup'].includes(s.type));
    const paymentRows = subscription.payments.length ? subscription.payments : [demoPayment];
    const refreshConnectivity = () => fetch(apiUrl(`/device/connectivity/${elderId}`))
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setConnectivity);
    const saveWifi = event => {
      event.preventDefault();
      setDeviceMessage('');
      fetch(apiUrl(`/device/wifi/${elderId}`), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(wifiForm),
      }).then(r => r.ok ? r.json() : Promise.reject())
        .then(() => { setWifiForm({ ssid: '', password: '' }); setDeviceMessage('Đã cập nhật cấu hình Wi-Fi demo.'); return refreshConnectivity(); })
        .catch(() => setDeviceMessage('Không kết nối được API backend.'));
    };
    const pairDevice = event => {
      event.preventDefault();
      const device_name = newDeviceName.trim();
      if (!device_name) return;
      fetch(apiUrl(`/device/bluetooth/pair/${elderId}`), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device_name, device_type: 'sphygmomanometer' }),
      }).then(r => r.ok ? r.json() : Promise.reject())
        .then(() => { setNewDeviceName(''); setDeviceMessage('Đã ghép thiết bị trong dữ liệu demo.'); return refreshConnectivity(); })
        .catch(() => setDeviceMessage('Không kết nối được API backend.'));
    };
    const unpairDevice = deviceId => fetch(apiUrl(`/device/bluetooth/${elderId}/${encodeURIComponent(deviceId)}`), { method: 'DELETE' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => { setDeviceMessage('Đã gỡ thiết bị khỏi dữ liệu demo.'); return refreshConnectivity(); })
      .catch(() => setDeviceMessage('Không kết nối được API backend.'));
    const tabs = [
      { id: 'health', label: 'Sức khỏe' },
      { id: 'schedule', label: 'Lịch chăm sóc' },
      { id: 'device', label: 'Bảo trì' },
      { id: 'connectivity', label: 'Kết nối thiết bị' },
      { id: 'service', label: 'Gói dịch vụ & thanh toán' },
      { id: 'agent', label: 'AI Agent' },
    ];
    const Chart = window.Recharts || {};
    const chartData = visibleReadings.map(row => ({
      time: new Date(row.timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      'Tâm thu': row.systolic,
      'Tâm trương': row.diastolic,
      'Nhịp tim': row.heart_rate || row.heartRate,
    }));

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <header className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-700 grid place-items-center text-2xl">♥</div>
            <div><div className="font-bold text-lg">Myka Care Companion</div><div className="text-sm text-slate-500">Không gian chăm sóc gia đình</div></div>
          </div>
          <div className="flex items-center gap-4"><span className="text-sm text-slate-600">{user.name}</span><button onClick={onLogout} className="text-sm text-violet-700 hover:underline">Đăng xuất</button></div>
        </header>
        <main className="max-w-6xl mx-auto p-5 md:p-8">
          <section className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div><p className="text-sm text-violet-700 font-semibold mb-1">HỒ SƠ NGƯỜI THÂN</p><h1 className="text-2xl md:text-3xl font-bold">{elder?.name || 'Bà Nguyễn Thị Hoa'}</h1><p className="text-slate-500 mt-1">Theo dõi thông tin chăm sóc và sức khỏe</p></div>
            <span className={`text-sm px-3 py-1.5 rounded-full ${apiAvailable ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{apiAvailable ? 'Dữ liệu từ máy chủ' : 'Dữ liệu demo'}</span>
          </section>
          <section className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="font-semibold">Kênh trao đổi qua Telegram</h2><p className="text-sm text-slate-500">Trao đổi với đội chăm sóc trong kênh Telegram đã cấu hình.</p></div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Vào nhóm Telegram', href: telegramLinks.group_chat_url },
                ].map(link => link.href
                  ? <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700">{link.label} ↗</a>
                  : <button key={link.label} type="button" disabled title="Chưa cấu hình đường dẫn Telegram" className="px-3 py-2 rounded-lg bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed">{link.label} · chưa cấu hình</button>)}
              </div>
            </div>
          </section>
          <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 mb-6">
            {tabs.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`px-4 py-3 whitespace-nowrap border-b-2 text-sm font-semibold ${tab === item.id ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{item.label}</button>)}
          </nav>

          {tab === 'health' && <section>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4"><div><h2 className="text-xl font-bold">Huyết áp và nhịp tim</h2><p className="text-sm text-slate-500">Thông tin theo dõi, không thay thế tư vấn y tế.</p></div><select value={days} onChange={e => setDays(Number(e.target.value))} className="bg-white border border-slate-300 rounded-lg px-3 py-2"><option value={7}>7 ngày gần đây</option><option value={30}>30 ngày gần đây</option></select></div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {[["Lần đo gần nhất", latest ? `${latest.systolic}/${latest.diastolic}` : '—', 'mmHg'], ['Tâm thu trung bình', avg('systolic'), 'mmHg'], ['Tâm trương trung bình', avg('diastolic'), 'mmHg'], ['Nhịp tim trung bình', avgHeartRate, 'lần/phút']].map(([label, value, unit]) => <div key={label} className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold mt-2">{value} <span className="text-sm font-normal text-slate-500">{unit}</span></p></div>)}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5"><h3 className="font-semibold mb-3">Xu hướng chỉ số</h3>{Chart.ResponsiveContainer && chartData.length ? <Chart.ResponsiveContainer width="100%" height={260}><Chart.LineChart data={chartData}><Chart.CartesianGrid strokeDasharray="3 3" /><Chart.XAxis dataKey="time" /><Chart.YAxis /><Chart.Tooltip /><Chart.Legend /><Chart.Line type="monotone" dataKey="Tâm thu" stroke="#7c3aed" /><Chart.Line type="monotone" dataKey="Tâm trương" stroke="#0ea5e9" /><Chart.Line type="monotone" dataKey="Nhịp tim" stroke="#f59e0b" /></Chart.LineChart></Chart.ResponsiveContainer> : <p className="text-sm text-slate-500 py-8 text-center">Chưa có đủ dữ liệu để hiển thị biểu đồ.</p>}</div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><h3 className="font-semibold p-4">Lịch sử đo</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="text-left p-3">Thời gian</th><th className="text-left p-3">Huyết áp</th><th className="text-left p-3">Nhịp tim</th><th className="text-left p-3">Ghi chú</th></tr></thead><tbody>{visibleReadings.slice().reverse().map(row => <tr key={row.id} className="border-t border-slate-100"><td className="p-3">{dateLabel(row.timestamp)}</td><td className="p-3 font-semibold">{row.systolic}/{row.diastolic} mmHg</td><td className="p-3">{row.heart_rate || row.heartRate} bpm</td><td className="p-3 text-slate-500">{row.note || '—'}</td></tr>)}</tbody></table>{!visibleReadings.length && <p className="p-6 text-center text-slate-500">Chưa có bản ghi trong khoảng thời gian này.</p>}</div></div>
          </section>}

          {tab === 'schedule' && <section><h2 className="text-xl font-bold mb-1">Lịch uống thuốc và tái khám</h2><p className="text-sm text-slate-500 mb-4">Lịch được lập cho người cao tuổi; ứng dụng gia đình hiển thị để theo dõi.</p><div className="space-y-3">{scheduleRows.map(row => <article key={row.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-start"><span className="text-2xl">{row.type === 'checkup' ? '🏥' : '💊'}</span><div className="flex-1"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{row.title}</h3><span className="text-sm text-slate-500">{dateLabel(row.scheduled_at)}</span></div><p className="text-sm text-slate-600 mt-1">{row.detail}</p></div><span className={`text-xs px-2 py-1 rounded-full ${row.confirmed ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{row.confirmed ? 'Đã xác nhận' : 'Theo lịch'}</span></article>)}{!scheduleRows.length && <p className="bg-white rounded-xl p-6 text-slate-500">Chưa có lịch chăm sóc.</p>}</div></section>}

          {tab === 'device' && <section><h2 className="text-xl font-bold mb-1">Thông báo bảo trì thiết bị</h2><p className="text-sm text-slate-500 mb-4">Các nhắc nhở vận hành thiết bị được gửi từ hệ thống.</p><div className="space-y-3">{maintenance.map(item => <article key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4"><span className="text-2xl">🛠️</span><div className="flex-1"><h3 className="font-semibold">{item.title}</h3><p className="text-sm text-slate-600 mt-1">{item.detail}</p><p className="text-xs text-slate-500 mt-2">Hạn: {item.due_at || 'Chưa xác định'}</p></div><span className="text-xs px-2 py-1 h-fit rounded-full bg-amber-100 text-amber-800">{item.status === 'pending' ? 'Cần chú ý' : 'Đã xử lý'}</span></article>)}{!maintenance.length && <p className="bg-white rounded-xl p-6 text-slate-500">Hiện chưa có thông báo bảo trì.</p>}</div></section>}
          {tab === 'connectivity' && <section>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4"><div><h2 className="text-xl font-bold">Kết nối Robot Myka và máy đo</h2><p className="text-sm text-slate-500">Xem trạng thái Wi-Fi và thiết bị Bluetooth đã ghép.</p></div><span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">DEMO API · CHƯA KẾT NỐI PHẦN CỨNG THẬT</span></div>
            {connectivity ? <>
              <div className="grid sm:grid-cols-2 gap-3 mb-5"><article className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="font-semibold">Wi-Fi trong nhà</h3><p className="mt-2 text-sm">Mạng: {connectivity.wifi_ssid || 'Chưa cấu hình'}</p><p className="text-sm text-slate-500">Trạng thái: {connectivity.wifi_status || 'Chưa xác định'}{connectivity.wifi_signal ? ` · tín hiệu ${connectivity.wifi_signal}%` : ''}</p></article><article className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="font-semibold">Bluetooth</h3><p className="mt-2 text-sm">Trạng thái: {connectivity.bluetooth_status || 'Chưa xác định'}</p><p className="text-sm text-slate-500">Thiết bị đã ghép: {connectivity.paired_devices?.length || 0}</p></article></div>
              <div className="space-y-2 mb-5">{(connectivity.paired_devices || []).map(item => <article key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{item.name}</p><p className="text-sm text-slate-500">{item.type} · {item.status}</p></div><button onClick={() => unpairDevice(item.id)} disabled={!apiAvailable} className="px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:opacity-50">Gỡ thiết bị</button></article>)}</div>
              <div className="grid md:grid-cols-2 gap-4"><form onSubmit={saveWifi} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"><h3 className="font-semibold">Cập nhật Wi-Fi (RUD demo)</h3><input required value={wifiForm.ssid} onChange={e => setWifiForm({ ...wifiForm, ssid: e.target.value })} placeholder="Tên mạng Wi-Fi" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /><input type="password" value={wifiForm.password} onChange={e => setWifiForm({ ...wifiForm, password: e.target.value })} placeholder="Mật khẩu Wi-Fi mới (không bắt buộc)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /><button disabled={!apiAvailable} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold disabled:opacity-50">Lưu cấu hình</button></form><form onSubmit={pairDevice} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"><h3 className="font-semibold">Ghép Bluetooth (RUD demo)</h3><input required value={newDeviceName} onChange={e => setNewDeviceName(e.target.value)} placeholder="Tên thiết bị đo huyết áp" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /><button disabled={!apiAvailable} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold disabled:opacity-50">Thêm thiết bị</button></form></div>
              {deviceMessage && <p role="status" className="text-sm text-violet-700 mt-3">{deviceMessage}</p>}
            </> : <div className="bg-white border border-slate-200 rounded-xl p-5"><p className="font-semibold">Chưa kết nối được API thiết bị.</p><p className="text-sm text-slate-500 mt-1">Mở backend demo để đọc và cập nhật trạng thái. Wi-Fi/Bluetooth hiện được mô phỏng qua API; để kết nối thiết bị thật cần firmware hoặc gateway phần cứng.</p></div>}
          </section>}

          {tab === 'service' && <section><h2 className="text-xl font-bold mb-1">Gói dịch vụ và thanh toán</h2><p className="text-sm text-slate-500 mb-4">Thông tin gói đang sử dụng và lịch sử giao dịch.</p>{subscription.current_plan && <article className="bg-violet-50 border border-violet-200 rounded-xl p-5 mb-5"><p className="text-sm text-violet-700 font-semibold">GÓI ĐANG SỬ DỤNG</p><h3 className="text-xl font-bold mt-1">{subscription.current_plan.service_name}</h3><p className="mt-2">{Number(subscription.current_plan.amount).toLocaleString('vi-VN')} {subscription.current_plan.currency}</p><p className="text-sm text-slate-600 mt-1">Thời hạn: {subscription.current_plan.period_start} – {subscription.current_plan.period_end}</p></article>}<div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><h3 className="font-semibold p-4">Lịch sử thanh toán</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="text-left p-3">Mã giao dịch</th><th className="text-left p-3">Gói dịch vụ</th><th className="text-left p-3">Số tiền</th><th className="text-left p-3">Ngày thanh toán</th><th className="text-left p-3">Trạng thái</th></tr></thead><tbody>{paymentRows.map(row => <tr key={row.id} className="border-t border-slate-100"><td className="p-3">{row.id}</td><td className="p-3">{row.service_name}</td><td className="p-3">{Number(row.amount).toLocaleString('vi-VN')} {row.currency}</td><td className="p-3">{row.paid_at || '—'}</td><td className="p-3 text-green-700">{row.status === 'paid' ? 'Đã thanh toán' : row.status}</td></tr>)}</tbody></table></div></div></section>}
          {tab === 'agent' && (() => {
            const measured = agentStatus?.latest_measurement || latest;
            const level = measured?.status || 'unknown';
            const levelLabel = ({ normal: 'Trong ngưỡng theo dõi', warning: 'Cần người chăm sóc lưu ý', critical: 'Đã phát hiện chỉ số vượt ngưỡng', unknown: 'Chưa có dữ liệu' })[level] || 'Chưa có dữ liệu';
            const activities = agentStatus?.activities || [
              { title: 'Thu thập dữ liệu', detail: measured ? `Đã nhận chỉ số huyết áp ${measured.systolic}/${measured.diastolic} mmHg và nhịp tim ${measured.heart_rate || measured.heartRate} bpm.` : 'Đang chờ dữ liệu từ máy đo/robot.' },
              { title: 'Đối chiếu quy tắc cảnh báo', detail: measured ? levelLabel : 'Chưa có phép đo để đối chiếu.' },
              { title: 'Lưu lịch sử và cập nhật trạng thái', detail: 'Kết quả được lưu qua API backend để người thân xem lại.' },
              { title: level === 'critical' || level === 'warning' ? 'Tạo cảnh báo cho người thân' : 'Tiếp tục theo dõi', detail: level === 'critical' || level === 'warning' ? 'Thông tin được chuyển thành cảnh báo; phần tư vấn cần trao đổi với nhân viên y tế qua Telegram.' : 'Không tự đưa ra tư vấn hoặc chẩn đoán sức khỏe.' },
            ];
            return <section>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4"><div><h2 className="text-xl font-bold">AI Agent theo dõi tự động</h2><p className="text-sm text-slate-500">Agent nhận dữ liệu, xử lý theo quy tắc, lưu kết quả và tạo cảnh báo mà không cần người dùng chat với AI.</p></div><span className="px-3 py-1.5 rounded-full bg-violet-100 text-violet-800 text-xs font-semibold">{agentStatus?.agent_name || 'MYKA CARE AGENT · DEMO'}</span></div>
              <div className="grid md:grid-cols-3 gap-3 mb-5">
                <article className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-sm text-slate-500">Trạng thái dịch vụ</p><p className="text-lg font-bold mt-2 text-green-700">{agentStatus?.service_status || 'Đang theo dõi dữ liệu demo'}</p></article>
                <article className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-sm text-slate-500">Kết quả xử lý gần nhất</p><p className="text-lg font-bold mt-2">{levelLabel}</p></article>
                <article className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-sm text-slate-500">Nguồn dữ liệu</p><p className="text-lg font-bold mt-2">{agentStatus?.data_source || (apiAvailable ? 'API backend / thiết bị' : 'Dữ liệu mẫu trong ứng dụng')}</p></article>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="font-semibold mb-4">Luồng xử lý tự động</h3><ol className="space-y-3">{activities.map((item, index) => <li key={index} className="flex gap-3"><span className="w-8 h-8 shrink-0 rounded-full bg-violet-100 text-violet-800 font-bold grid place-items-center">{index + 1}</span><div><p className="font-semibold">{item.title}</p><p className="text-sm text-slate-600 mt-0.5">{item.detail}</p></div></li>)}</ol></div>
              <p className="text-xs text-slate-500 mt-3">Bản demo minh họa Agent xử lý theo quy tắc/ngưỡng cấu hình; không chẩn đoán, không tư vấn y tế và không thay thế nhân viên y tế. Khi cần trao đổi, người thân mở kênh Telegram đã cấu hình.</p>
            </section>;
          })()}
          <footer className="text-xs text-slate-400 mt-8">Myka Care Companion là phân hệ đọc và theo dõi dành cho người thân. Trao đổi tư vấn diễn ra trên Telegram, không có chat bác sĩ–người thân trong ứng dụng.</footer>
        </main>
      </div>
    );
  }
  window.FamilyDashboard = FamilyDashboard;
})();
