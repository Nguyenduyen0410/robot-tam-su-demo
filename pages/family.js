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
    const [showScheduleEditor, setShowScheduleEditor] = React.useState(false);
    const [showPaymentCheckout, setShowPaymentCheckout] = React.useState(false);
    const localToday = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const nextMonthStart = new Date(Date.UTC(localToday.getUTCFullYear(), localToday.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(Date.UTC(localToday.getUTCFullYear(), localToday.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
    const demoPayment = { id: 'PAY-INITIAL-E001', service_name: 'Thiết bị Myka (mua đứt) + thuê bao tháng đầu', amount: 2100000, currency: 'VND', status: 'pending', period_start: localToday.toISOString().slice(0, 10), period_end: currentMonthEnd, due_at: localToday.toISOString().slice(0, 10), paid_at: null };
    const [subscription, setSubscription] = React.useState({ current_plan: null, payments: [], pricing: null });
    const [agentStatus, setAgentStatus] = React.useState(null);
    const [telegramLinks, setTelegramLinks] = React.useState({ group_chat_url: '' });
    const [apiAvailable, setApiAvailable] = React.useState(false);
    const [preferences, setPreferences] = React.useState({ dnd_mode: 'off', dnd_until: null, voice_profile: 'female_young_sweet', robot_name: '' });
    const [settingsSaving, setSettingsSaving] = React.useState(false);
    const [settingsMessage, setSettingsMessage] = React.useState('');
    const [conversationDate, setConversationDate] = React.useState(new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10));
    const [conversationData, setConversationData] = React.useState({ messages: [], review_needed_count: 0, source: 'none' });
    const [conversationLoading, setConversationLoading] = React.useState(false);
    const [conversationError, setConversationError] = React.useState('');

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
        .catch(() => { if (active) setConnectivity({ paired_devices: [] }); });
      fetch(apiUrl(`/family/settings/${elderId}`))
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => { if (active) setPreferences(data); })
        .catch(() => { if (active) setSettingsMessage('Chưa tải được cài đặt từ máy chủ.'); });
      return () => { active = false; };
    }, [days]);

    React.useEffect(() => {
      let active = true;
      setConversationLoading(true);
      setConversationError('');
      fetch(apiUrl(`/family/conversation-history/${elderId}?date=${encodeURIComponent(conversationDate)}`))
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => { if (active) setConversationData(data); })
        .catch(() => { if (active) setConversationError('Chưa tải được nhật ký từ máy chủ.'); })
        .finally(() => { if (active) setConversationLoading(false); });
      return () => { active = false; };
    }, [conversationDate]);

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
    const pricing = subscription.pricing || { device_price: 2000000, monthly_fee: 100000, first_payment_total: 2100000, renewal_day: 1, next_renewal_date: nextMonthStart, auto_renew: true };
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
    const createSchedule = row => {
      fetch(apiUrl(`/family/schedules/${elderId}`), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row),
      }).then(response => response.ok ? response.json() : Promise.reject())
        .then(saved => { setSchedules(current => [...current, saved].sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at)))); setShowScheduleEditor(false); })
        .catch(() => {
          setSchedules(current => [...current, row].sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at))));
          setShowScheduleEditor(false);
          window.alert('Đã thêm lịch trong phiên demo trên thiết bị này. Chưa lưu được lên máy chủ.');
        });
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
      { id: 'health', label: 'Sức khỏe', icon: '💓' },
      { id: 'schedule', label: 'Lịch chăm sóc', icon: '📅' },
      { id: 'device', label: 'Bảo trì', icon: '🛠️' },
      { id: 'connectivity', label: 'Kết nối thiết bị', icon: '📶' },
      { id: 'service', label: 'Gói & thanh toán', icon: '💳' },
      { id: 'agent', label: 'AI Agent', icon: '✨' },
      { id: 'conversations', label: 'Nhật ký Myka', icon: '💬' },
      { id: 'settings', label: 'Cài đặt', icon: '⚙️' },
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

    const devicePaired = Boolean(connectivity?.paired_devices?.length);
    if (connectivity === null) return <div className="min-h-screen grid place-items-center bg-slate-50"><p className="text-slate-600">Đang kiểm tra trạng thái thiết bị Myka…</p></div>;
    if (!devicePaired) return <DeviceSetupScreen apiUrl={apiUrl} onPaired={refreshConnectivity} />;

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
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-violet-600 to-sky-600 text-white p-6 md:p-8 mb-6 shadow-lg shadow-violet-200/60">
            <div className="absolute -right-12 -top-16 w-64 h-64 rounded-full bg-white/10" aria-hidden="true" />
            <div className="relative flex items-center justify-between gap-5">
              <div className="max-w-xl"><p className="text-sm font-semibold tracking-wider text-violet-100">MYKA CARE COMPANION</p><h1 className="text-2xl md:text-3xl font-bold mt-2">Chăm sóc Ngoại mỗi ngày</h1><p className="text-violet-100 mt-2">Xin chào {user.name}. Cùng theo dõi sức khỏe và những điều cần quan tâm của {elder?.name || 'Bà Hoa'}.</p><span className={`inline-flex mt-4 text-xs font-semibold px-3 py-1.5 rounded-full ${apiAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-white/20 text-white'}`}>{apiAvailable ? '● Dữ liệu demo từ backend' : '● Bản demo'}</span></div>
              <svg className="hidden sm:block w-36 md:w-48 h-36 md:h-44 shrink-0" viewBox="0 0 200 180" role="img" aria-label="Minh họa Myka đồng hành cùng người cao tuổi">
                <circle cx="102" cy="91" r="77" fill="white" fillOpacity=".14"/><path d="M48 133c7-24 23-36 48-36s41 12 48 36" fill="#FDE68A"/><circle cx="96" cy="70" r="31" fill="#F5C9A5"/><path d="M65 68c2-25 17-39 36-39 18 0 31 13 32 34-13-2-24-11-29-20-7 13-20 22-39 25Z" fill="#64748B"/><path d="M67 63c-5 20 1 39 11 48" fill="none" stroke="#64748B" strokeWidth="8" strokeLinecap="round"/><path d="M132 60h33a12 12 0 0 1 12 12v23a12 12 0 0 1-12 12h-7l-10 11v-11h-16a12 12 0 0 1-12-12V72a12 12 0 0 1 12-12Z" fill="#fff"/><circle cx="139" cy="84" r="3" fill="#7C3AED"/><circle cx="151" cy="84" r="3" fill="#7C3AED"/><path d="M139 94c4 5 9 5 13 0" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round"/><path d="M42 46c0-7 9-10 13-3 4-7 13-4 13 3 0 6-13 15-13 15S42 52 42 46Z" fill="#FCA5A5"/>
              </svg>
            </div>
          </section>
          <section className="flex flex-wrap items-end justify-between gap-4 mb-6"><div><p className="text-sm text-violet-700 font-semibold mb-1">HỒ SƠ ĐANG THEO DÕI</p><h2 className="text-xl md:text-2xl font-bold">{elder?.name || 'Bà Nguyễn Thị Hoa'}</h2><p className="text-slate-500 mt-1">Thông tin chăm sóc và sức khỏe</p></div></section>
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
          <nav aria-label="Các chức năng Myka Care" className="grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3 mb-6">
            {tabs.map(item => <button key={item.id} type="button" onClick={() => setTab(item.id)} aria-label={item.label} aria-current={tab === item.id ? 'page' : undefined} className={`min-h-[78px] sm:min-h-[92px] rounded-2xl border p-2 sm:p-3 flex flex-col items-center justify-center gap-1.5 text-center transition-all ${tab === item.id ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200 -translate-y-0.5' : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:-translate-y-0.5'}`}><span className="text-xl sm:text-2xl leading-none" aria-hidden="true">{item.icon}</span><span className="text-[10px] leading-tight sm:text-xs font-semibold">{item.label}</span></button>)}
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

          {tab === 'schedule' && <section><div className="flex flex-wrap items-start justify-between gap-3 mb-4"><div><h2 className="text-xl font-bold mb-1">Lịch uống thuốc và tái khám</h2><p className="text-sm text-slate-500">Lịch được lưu vào backend demo; thông báo đẩy chưa được bật.</p></div><button onClick={() => setShowScheduleEditor(true)} className="rounded-xl bg-violet-600 text-white px-4 py-2.5 font-bold shadow-md shadow-violet-200">＋ Thêm lịch</button></div><div className="space-y-3">{scheduleRows.map(row => <article key={row.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-start"><span className="text-2xl">{row.type === 'checkup' ? '🏥' : '💊'}</span><div className="flex-1"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{row.title}</h3><span className="text-sm text-slate-500">{dateLabel(row.scheduled_at)}</span></div><p className="text-sm text-slate-600 mt-1">{row.detail || '—'}</p></div><span className={`text-xs px-2 py-1 rounded-full ${row.confirmed ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{row.confirmed ? 'Đã xác nhận' : 'Theo lịch'}</span></article>)}{!scheduleRows.length && <p className="bg-white rounded-xl p-6 text-slate-500">Chưa có lịch chăm sóc.</p>}</div></section>}

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

          {tab === 'service' && <section>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5"><div><p className="text-sm font-semibold text-violet-700">GÓI DỊCH VỤ MYKA</p><h2 className="text-2xl font-bold mt-1">Thiết bị và thuê bao</h2><p className="text-sm text-slate-500 mt-1">Thiết bị thanh toán một lần; thuê bao được gia hạn theo tháng.</p></div><div className="rounded-2xl bg-violet-50 border border-violet-100 px-4 py-3 text-center"><span className="text-2xl" aria-hidden="true">💜</span><p className="text-xs font-semibold text-violet-800">Đồng hành cùng Ngoại</p></div></div>
            <div className="grid md:grid-cols-2 gap-4 mb-5">
              <article className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-5 shadow-md shadow-violet-200"><span className="absolute -right-5 -top-8 text-8xl opacity-15" aria-hidden="true">🤖</span><div className="relative"><p className="text-sm text-violet-100">MUA MỘT LẦN</p><h3 className="text-lg font-bold mt-1">Thiết bị Myka</h3><p className="text-3xl font-extrabold mt-3">{Number(pricing.device_price).toLocaleString('vi-VN')} <span className="text-base font-semibold">đ</span></p><p className="text-sm text-violet-100 mt-2">Thanh toán một lần ở kỳ đầu. Thiết bị thuộc sở hữu gia đình sau khi mua.</p></div></article>
              <article className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white p-5 shadow-md shadow-sky-200"><span className="absolute -right-4 -top-7 text-8xl opacity-15" aria-hidden="true">🔄</span><div className="relative"><p className="text-sm text-sky-100">THUÊ BAO HÀNG THÁNG</p><h3 className="text-lg font-bold mt-1">Myka Care Companion</h3><p className="text-3xl font-extrabold mt-3">{Number(pricing.monthly_fee).toLocaleString('vi-VN')} <span className="text-base font-semibold">đ/tháng</span></p><p className="text-sm text-sky-100 mt-2">Gia hạn định kỳ vào ngày {pricing.renewal_day} mỗi tháng.</p></div></article>
            </div>
            <article className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-slate-500">Thanh toán lần đầu</p><p className="text-2xl font-extrabold text-slate-900 mt-1">{Number(pricing.first_payment_total).toLocaleString('vi-VN')} đ</p><p className="text-sm text-slate-500 mt-1">2.000.000đ thiết bị + 100.000đ thuê bao tháng đầu</p></div><div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3"><p className="text-xs font-semibold text-violet-700">KỲ GIA HẠN TIẾP THEO</p><p className="font-bold text-violet-900 mt-1">{pricing.next_renewal_date}</p><p className="text-sm text-violet-700">100.000đ vào ngày 1</p></div></div><p className="text-xs text-slate-500 mt-4">Ứng dụng minh họa lịch gia hạn. Tự động thu tiền cần tích hợp cổng thanh toán và phương thức thanh toán của gia đình.</p><button onClick={() => setShowPaymentCheckout(true)} className="w-full mt-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white py-3.5 font-bold shadow-md shadow-violet-200">{paymentRows.some(row => row.status === 'pending') ? 'Thanh toán ngay' : 'Gia hạn gói'}</button></article>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"><div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100"><div><h3 className="font-semibold">Lịch sử và trạng thái thanh toán</h3><p className="text-xs text-slate-500 mt-1">Trạng thái đỏ: cần thanh toán · xanh: đã thanh toán</p></div><span className="text-xl" aria-hidden="true">🧾</span></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="text-left p-3">Nội dung</th><th className="text-left p-3">Số tiền</th><th className="text-left p-3">Kỳ thanh toán</th><th className="text-left p-3">Trạng thái</th></tr></thead><tbody>{paymentRows.map(row => { const paid = row.status === 'paid'; const isInitial = Number(row.amount) === Number(pricing.first_payment_total); return <tr key={row.id} className="border-t border-slate-100"><td className="p-3 font-medium">{row.service_name}</td><td className="p-3 font-bold">{Number(row.amount).toLocaleString('vi-VN')} {row.currency || 'VND'}</td><td className="p-3">{isInitial ? 'Thanh toán lần đầu' : `Gia hạn ngày ${pricing.renewal_day}`}</td><td className="p-3"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${paid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>{paid ? '✓ Đã thanh toán' : '● Cần thanh toán'}</span></td></tr>; })}</tbody></table></div></div>
          </section>}
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
          {tab === 'conversations' && <section>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5"><div><p className="text-sm text-violet-700 font-semibold">THEO DÕI GIA ĐÌNH</p><h2 className="text-xl font-bold mt-1">Nhật ký trò chuyện với Myka</h2><p className="text-sm text-slate-500 mt-1">Hồ sơ Bà Hoa · Cách xưng hô trong hội thoại: Ngoại – con. Nhật ký chỉ đọc.</p></div><span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${conversationData.source === 'telegram' ? 'bg-sky-100 text-sky-800' : conversationData.source === 'demo' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{conversationData.source === 'telegram' ? 'Nguồn Telegram' : conversationData.source === 'demo' ? 'Dữ liệu minh họa' : 'Chưa có bản ghi'}</span></div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex flex-wrap items-center justify-between gap-3"><div><label htmlFor="conversation-date" className="block text-sm font-semibold">Chọn ngày</label><p className="text-xs text-slate-500 mt-1">Mặc định là hôm nay</p></div><input id="conversation-date" type="date" value={conversationDate} onChange={event => setConversationDate(event.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            {conversationData.review_needed_count > 0 && <article className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4"><p className="font-semibold text-amber-900">Có {conversationData.review_needed_count} lời nhắn được đánh dấu để gia đình xem lại</p><p className="text-sm text-amber-800 mt-1">Trong dữ liệu demo, đây là lời nhắn người thân cần xem lại. Nhãn này không phải đánh giá hay chẩn đoán sức khỏe.</p></article>}
            <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5"><div className="flex items-center justify-between gap-3 mb-4"><h3 className="font-semibold">Nội dung trong ngày</h3><span className="text-xs text-slate-500">{conversationData.messages?.length || 0} tin nhắn</span></div>
              {conversationLoading ? <p className="py-10 text-center text-sm text-slate-500">Đang tải nhật ký…</p>
                : conversationError ? <p role="status" className="py-10 text-center text-sm text-rose-700">{conversationError}</p>
                  : conversationData.messages?.length ? <ConversationHistory messages={conversationData.messages} loading={false} robotName={preferences.robot_name} />
                    : <p className="py-10 text-center text-sm text-slate-500">{conversationLoading ? 'Đang tải…' : 'Ngày này chưa có bản ghi trò chuyện.'}</p>}
            </div>
            <p className="text-xs text-slate-500 mt-3">Hiện chỉ có hội thoại tổng hợp để minh họa giao diện. Link Telegram Web không cung cấp quyền lấy lịch sử; để xem hội thoại thật, robot hoặc bot cần gửi bản ghi mới vào backend sau khi thiết lập quyền truy cập và chia sẻ phù hợp.</p>
          </section>}
          {tab === 'settings' && <section>
            <div className="mb-5"><p className="text-sm text-violet-700 font-semibold">TÙY CHỈNH CHO GIA ĐÌNH</p><h2 className="text-xl font-bold mt-1">Cài đặt Myka</h2><p className="text-sm text-slate-500 mt-1">Lựa chọn được lưu theo hồ sơ người thân.</p></div>
            <form onSubmit={savePreferences} className="space-y-5">
              <article className="bg-white border border-slate-200 rounded-xl p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Chế độ Không làm phiền</h3><p className="text-sm text-slate-500 mt-1">Chọn khoảng thời gian tạm tắt thông báo trên ứng dụng.</p></div><span className={`text-xs font-semibold rounded-full px-3 py-1.5 ${preferences.dnd_mode === 'off' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{preferences.dnd_mode === 'off' ? 'Thông báo đang bật' : 'Không làm phiền đã chọn'}</span></div>
                <div className="flex flex-wrap gap-3 mt-4"><button type="button" onClick={() => { setPreferences({ ...preferences, dnd_mode: 'off', dnd_until: null }); setSettingsMessage(''); }} className={`rounded-xl border px-4 py-3 font-semibold ${preferences.dnd_mode === 'off' ? 'bg-emerald-50 border-emerald-400 text-emerald-800' : 'border-slate-200'}`}>Bật thông báo lại</button><DndDurationPicker onSelect={(hours, minutes) => { const until = new Date(Date.now() + hours * 3600000 + minutes * 60000); setPreferences({ ...preferences, dnd_mode: 'custom', dnd_until: until.toISOString() }); setSettingsMessage(''); }} /><button type="button" onClick={() => { setPreferences({ ...preferences, dnd_mode: 'until_off', dnd_until: null }); setSettingsMessage(''); }} className={`rounded-xl border px-4 py-3 font-semibold ${preferences.dnd_mode === 'until_off' ? 'bg-amber-50 border-amber-400 text-amber-900' : 'border-slate-200'}`}>Đến khi tôi bật lại</button></div>
                {preferences.dnd_mode === 'custom' && preferences.dnd_until && <p className="text-sm text-amber-800 mt-3">Tự bật lại lúc {new Date(preferences.dnd_until).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}.</p>}
                <p className="text-xs text-slate-500 mt-4">Hiện app chưa gửi thông báo đẩy; lựa chọn này được lưu để dùng khi tích hợp thông báo. Khi đó, chế độ này sẽ tắt âm thanh và rung theo cấu hình ứng dụng.</p>
              </article>

              <article className="bg-white border border-slate-200 rounded-xl p-4 md:p-5"><h3 className="font-semibold">Tùy chỉnh giọng nói</h3><p className="text-sm text-slate-500 mt-1">Chọn phong cách giọng mà người cao tuổi cảm thấy dễ nghe.</p><div className="grid sm:grid-cols-2 gap-3 mt-4">{voiceOptions.map(voice => <label key={voice.id} className={`cursor-pointer rounded-xl border p-4 transition ${preferences.voice_profile === voice.id ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-300' : 'border-slate-200 hover:border-violet-300'}`}><span className="flex items-center gap-3"><input type="radio" name="voice_profile" value={voice.id} checked={preferences.voice_profile === voice.id} onChange={() => { setPreferences({ ...preferences, voice_profile: voice.id }); setSettingsMessage(''); }} className="accent-violet-600" /><span><span className="block font-semibold">{voice.label}</span><span className="block text-sm text-slate-500">Giọng {voice.detail.toLowerCase()}</span></span></span></label>)}</div><p className="text-xs text-slate-500 mt-4">Cài đặt giọng sẽ được lưu trong hồ sơ; hiện chưa đổi giọng phát ra từ robot vì chưa kết nối phần cứng.</p></article>

              <article className="bg-white border border-slate-200 rounded-xl p-4 md:p-5"><h3 className="font-semibold">Đổi tên robot</h3><p className="text-sm text-slate-500 mt-1">Không bắt buộc. Để trống nếu muốn tiếp tục dùng tên Myka.</p><label className="block text-sm font-medium mt-4" htmlFor="robot-name">Tên robot hiển thị</label><input id="robot-name" maxLength="40" value={preferences.robot_name || ''} onChange={event => { setPreferences({ ...preferences, robot_name: event.target.value }); setSettingsMessage(''); }} placeholder="Myka" className="mt-1 w-full sm:max-w-md border border-slate-300 rounded-lg px-3 py-2 text-sm" /><p className="text-xs text-slate-500 mt-2">Tên hiện tại: {preferences.robot_name?.trim() || 'Myka'}. Tên này chưa được đồng bộ tới phần cứng.</p></article>

              <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={!apiAvailable || settingsSaving} className="px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50">{settingsSaving ? 'Đang lưu…' : 'Lưu cài đặt'}</button>{settingsMessage && <p role="status" className="text-sm text-violet-700">{settingsMessage}</p>}</div>
            </form>
          </section>}
          <footer className="text-xs text-slate-400 mt-8">Myka Care Companion là phân hệ đọc và theo dõi dành cho người thân. Trao đổi tư vấn diễn ra trên Telegram, không có chat bác sĩ–người thân trong ứng dụng.</footer>
        </main>
        {showScheduleEditor && <ScheduleEditor onClose={() => setShowScheduleEditor(false)} onSave={createSchedule} />}
        {showPaymentCheckout && <PaymentCheckout amount={paymentRows.find(row => row.status === 'pending')?.amount || pricing.monthly_fee} onClose={() => setShowPaymentCheckout(false)} />}
      </div>
    );
  }
  window.FamilyDashboard = FamilyDashboard;
})();
