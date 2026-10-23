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
    const [preferences, setPreferences] = React.useState({ dnd_mode: 'off', dnd_until: null, voice_profile: 'female_young_sweet', robot_name: '' });
    const [settingsSaving, setSettingsSaving] = React.useState(false);
    const [settingsMessage, setSettingsMessage] = React.useState('');

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
      fetch(apiUrl(`/family/settings/${elderId}`))
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => { if (active) setPreferences(data); })
        .catch(() => { if (active) setSettingsMessage('Chưa tải được cài đặt từ máy chủ.'); });
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
    const savePreferences = event => {
      event.preventDefault();
      setSettingsSaving(true);
      setSettingsMessage('');
      fetch(apiUrl(`/family/settings/${elderId}`), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(preferences),
      }).then(r => r.ok ? r.json() : Promise.reject())
        .then(data => { setPreferences(data); setSettingsMessage('Đã lưu cài đặt vào hồ sơ gia đình.'); })
        .catch(() => setSettingsMessage('Chưa lưu được cài đặt. Vui lòng thử lại khi kết nối máy chủ ổn định.'))
        .finally(() => setSettingsSaving(false));
    };
    const voiceOptions = [
      { id: 'male_young_warm', label: 'Nam thành niên', detail: 'Ấm áp' },
      { id: 'male_middle_steady', label: 'Nam trung niên', detail: 'Vững chãi' },
      { id: 'female_young_sweet', label: 'Nữ thành niên', detail: 'Ngọt ngào' },
      { id: 'female_middle_calm', label: 'Nữ trung niên', detail: 'Trầm ổn' },
    ];
    const tabs = [
      { id: 'health', label: 'Sức khỏe' },
      { id: 'schedule', label: 'Lịch chăm sóc' },
      { id: 'device', label: 'Bảo trì' },
      { id: 'connectivity', label: 'Kết nối thiết bị' },
      { id: 'service', label: 'Gói dịch vụ & thanh toán' },
      { id: 'agent', label: 'AI Agent' },
      { id: 'settings', label: 'Cài đặt' },
    ];
    const chartData = visibleReadings.map(row => ({
      time: new Date(row.timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      'Tâm thu': row.systolic,
      'Tâm trương': row.diastolic,
      'Nhịp tim': row.heart_rate || row.heartRate,
    }));
    const chartWidth = 720, chartHeight = 260, chartLeft = 42, chartRight = 16, chartTop = 16, chartBottom = 36;
    const chartValues = chartData.flatMap(point => [point['Tâm thu'], point['Tâm trương'], point['Nhịp tim']]).filter(Number.isFinite);
    const chartMin = chartValues.length ? Math.floor((Math.min(...chartValues) - 5) / 10) * 10 : 0;
    const chartMax = chartValues.length ? Math.ceil((Math.max(...chartValues) + 5) / 10) * 10 : 100;
    const chartX = index => chartLeft + (chartData.length <= 1 ? 0 : index * (chartWidth - chartLeft - chartRight) / (chartData.length - 1));
    const chartY = value => chartTop + (chartMax - value) * (chartHeight - chartTop - chartBottom) / Math.max(1, chartMax - chartMin);
    const chartLines = [
      { key: 'Tâm thu', color: '#7c3aed' },
      { key: 'Tâm trương', color: '#0ea5e9' },
      { key: 'Nhịp tim', color: '#f59e0b' },
    ];
    const dailyTrend = new Map();
    visibleReadings.forEach(row => {
      const day = new Date(row.timestamp).toISOString().slice(0, 10);
      const systolic = Number(row.systolic), diastolic = Number(row.diastolic);
      const level = systolic >= 140 || diastolic >= 90 ? 'critical' : systolic >= 130 || diastolic >= 85 ? 'warning' : 'normal';
      const priority = { normal: 0, warning: 1, critical: 2 };
      const current = dailyTrend.get(day);
      if (!current || priority[level] > priority[current]) dailyTrend.set(day, level);
    });
    const orderedDays = [...dailyTrend.entries()].sort(([a], [b]) => a.localeCompare(b));
    let warningStreak = 0, maxWarningStreak = 0;
    let previousDay = null;
    orderedDays.forEach(([day, level]) => {
      const consecutive = previousDay && (Date.parse(`${day}T00:00:00Z`) - Date.parse(`${previousDay}T00:00:00Z`)) === 86400000;
      warningStreak = level === 'normal' ? 0 : (consecutive ? warningStreak : 0) + 1;
      maxWarningStreak = Math.max(maxWarningStreak, warningStreak);
      previousDay = day;
    });
    const criticalDays = orderedDays.filter(([, level]) => level === 'critical').length;
    const warningDays = orderedDays.filter(([, level]) => level !== 'normal').length;
    const trendSummary = !orderedDays.length
      ? { tone: 'slate', title: 'Chưa có đủ số đo', detail: 'Khi có dữ liệu, ứng dụng sẽ tổng hợp các lần đo đã ghi nhận trong khoảng thời gian này.' }
      : criticalDays
        ? { tone: 'rose', title: 'Có bản ghi vượt ngưỡng cảnh báo cấu hình', detail: `Ghi nhận ${criticalDays} ngày có ít nhất một lần đo ở mức cảnh báo cao. Gia đình hãy xem lại bản ghi và trao đổi với nhân viên y tế.` }
        : maxWarningStreak >= 3
          ? { tone: 'amber', title: `Có chỉ số vượt ngưỡng theo dõi ${maxWarningStreak} ngày liên tiếp`, detail: 'Gia đình nên xem lại các lần đo trong chuỗi này và trao đổi với nhân viên y tế qua kênh chăm sóc.' }
          : warningDays
            ? { tone: 'amber', title: `Ghi nhận ${warningDays} ngày có chỉ số vượt ngưỡng theo dõi`, detail: 'Hiện chưa ghi nhận chuỗi vượt ngưỡng từ 3 ngày liên tiếp. Gia đình có thể xem lại từng lần đo trong lịch sử.' }
            : { tone: 'emerald', title: 'Chưa ghi nhận lần đo vượt ngưỡng cấu hình', detail: 'Các số đo đã lưu trong khoảng thời gian này đều nằm trong ngưỡng theo dõi demo.' };

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
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5"><h3 className="font-semibold mb-3">Xu hướng chỉ số</h3>{chartData.length ? <><svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={`Biểu đồ xu hướng huyết áp và nhịp tim ${days} ngày`} className="w-full h-64"><title>{`Xu hướng huyết áp và nhịp tim ${days} ngày`}</title>{[0, 1, 2, 3].map(index => { const value = chartMin + (chartMax - chartMin) * index / 3; const y = chartY(value); return <g key={index}><line x1={chartLeft} x2={chartWidth - chartRight} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" /><text x={chartLeft - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">{Math.round(value)}</text></g>; })}{chartLines.map(line => <g key={line.key}><polyline fill="none" stroke={line.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={chartData.map((point, index) => `${chartX(index)},${chartY(Number(point[line.key]))}`).join(' ')} />{chartData.map((point, index) => <circle key={`${line.key}-${index}`} cx={chartX(index)} cy={chartY(Number(point[line.key]))} r="3.5" fill={line.color}><title>{`${point.time}: ${line.key} ${point[line.key]}`}</title></circle>)}</g>)}{chartData.map((point, index) => <text key={`date-${index}`} x={chartX(index)} y={chartHeight - 10} textAnchor="middle" fontSize="10" fill="#64748b">{point.time}</text>)}</svg><div className="flex flex-wrap gap-4 justify-center text-xs text-slate-600">{chartLines.map(line => <span key={line.key} className="inline-flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: line.color }} />{line.key}</span>)}</div></> : <p className="text-sm text-slate-500 py-8 text-center">Chưa có dữ liệu để hiển thị biểu đồ.</p>}</div>
            <article className={`rounded-xl border p-4 mb-5 ${trendSummary.tone === 'rose' ? 'bg-rose-50 border-rose-200' : trendSummary.tone === 'amber' ? 'bg-amber-50 border-amber-200' : trendSummary.tone === 'emerald' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}><h3 className="font-semibold">Tóm tắt xu hướng {days} ngày</h3><p className="font-semibold mt-2">{trendSummary.title}</p><p className="text-sm text-slate-700 mt-1">{trendSummary.detail}</p><p className="text-xs text-slate-500 mt-3">Tóm tắt tự động theo ngưỡng demo đã cấu hình; không phải kết luận sức khỏe hay tư vấn y tế.</p></article>
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
          {tab === 'settings' && <section>
            <div className="mb-5"><p className="text-sm text-violet-700 font-semibold">TÙY CHỈNH CHO GIA ĐÌNH</p><h2 className="text-xl font-bold mt-1">Cài đặt Myka</h2><p className="text-sm text-slate-500 mt-1">Lựa chọn được lưu theo hồ sơ người thân.</p></div>
            <form onSubmit={savePreferences} className="space-y-5">
              <article className="bg-white border border-slate-200 rounded-xl p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Chế độ Không làm phiền</h3><p className="text-sm text-slate-500 mt-1">Chọn khoảng thời gian tạm tắt thông báo trên ứng dụng.</p></div><span className={`text-xs font-semibold rounded-full px-3 py-1.5 ${preferences.dnd_mode === 'off' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{preferences.dnd_mode === 'off' ? 'Thông báo đang bật' : 'Không làm phiền đã chọn'}</span></div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">{[
                  { id: 'off', label: 'Bật thông báo lại', detail: 'Tắt Không làm phiền' },
                  { id: '2h', label: 'Tắt trong 2 giờ', detail: 'Tự bật lại sau 2 giờ' },
                  { id: '5h', label: 'Tắt trong 5 giờ', detail: 'Tự bật lại sau 5 giờ' },
                  { id: 'until_off', label: 'Đến khi tôi bật lại', detail: 'Không tự bật lại' },
                ].map(option => <label key={option.id} className={`cursor-pointer rounded-xl border p-3 transition ${preferences.dnd_mode === option.id ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-300' : 'border-slate-200 hover:border-violet-300'}`}><span className="flex items-start gap-2"><input type="radio" name="dnd_mode" value={option.id} checked={preferences.dnd_mode === option.id} onChange={() => { setPreferences({ ...preferences, dnd_mode: option.id }); setSettingsMessage(''); }} className="mt-1 accent-violet-600" /><span><span className="block text-sm font-semibold">{option.label}</span><span className="block text-xs text-slate-500 mt-1">{option.detail}</span></span></span></label>)}</div>
                {['2h', '5h'].includes(preferences.dnd_mode) && preferences.dnd_until && <p className="text-sm text-amber-800 mt-3">Tự bật lại lúc {new Date(preferences.dnd_until).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}.</p>}
                <p className="text-xs text-slate-500 mt-4">Hiện app chưa gửi thông báo đẩy; lựa chọn này được lưu để dùng khi tích hợp thông báo. Khi đó, chế độ này sẽ tắt âm thanh và rung theo cấu hình ứng dụng.</p>
              </article>

              <article className="bg-white border border-slate-200 rounded-xl p-4 md:p-5"><h3 className="font-semibold">Tùy chỉnh giọng nói</h3><p className="text-sm text-slate-500 mt-1">Chọn phong cách giọng mà người cao tuổi cảm thấy dễ nghe.</p><div className="grid sm:grid-cols-2 gap-3 mt-4">{voiceOptions.map(voice => <label key={voice.id} className={`cursor-pointer rounded-xl border p-4 transition ${preferences.voice_profile === voice.id ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-300' : 'border-slate-200 hover:border-violet-300'}`}><span className="flex items-center gap-3"><input type="radio" name="voice_profile" value={voice.id} checked={preferences.voice_profile === voice.id} onChange={() => { setPreferences({ ...preferences, voice_profile: voice.id }); setSettingsMessage(''); }} className="accent-violet-600" /><span><span className="block font-semibold">{voice.label}</span><span className="block text-sm text-slate-500">Giọng {voice.detail.toLowerCase()}</span></span></span></label>)}</div><p className="text-xs text-slate-500 mt-4">Cài đặt giọng sẽ được lưu trong hồ sơ; hiện chưa đổi giọng phát ra từ robot vì chưa kết nối phần cứng.</p></article>

              <article className="bg-white border border-slate-200 rounded-xl p-4 md:p-5"><h3 className="font-semibold">Đổi tên robot</h3><p className="text-sm text-slate-500 mt-1">Không bắt buộc. Để trống nếu muốn tiếp tục dùng tên Myka.</p><label className="block text-sm font-medium mt-4" htmlFor="robot-name">Tên robot hiển thị</label><input id="robot-name" maxLength="40" value={preferences.robot_name || ''} onChange={event => { setPreferences({ ...preferences, robot_name: event.target.value }); setSettingsMessage(''); }} placeholder="Myka" className="mt-1 w-full sm:max-w-md border border-slate-300 rounded-lg px-3 py-2 text-sm" /><p className="text-xs text-slate-500 mt-2">Tên hiện tại: {preferences.robot_name?.trim() || 'Myka'}. Tên này chưa được đồng bộ tới phần cứng.</p></article>

              <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={!apiAvailable || settingsSaving} className="px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50">{settingsSaving ? 'Đang lưu…' : 'Lưu cài đặt'}</button>{settingsMessage && <p role="status" className="text-sm text-violet-700">{settingsMessage}</p>}</div>
            </form>
          </section>}
          <footer className="text-xs text-slate-400 mt-8">Myka Care Companion là phân hệ đọc và theo dõi dành cho người thân. Trao đổi tư vấn diễn ra trên Telegram, không có chat bác sĩ–người thân trong ứng dụng.</footer>
        </main>
      </div>
    );
  }
  window.FamilyDashboard = FamilyDashboard;
})();
