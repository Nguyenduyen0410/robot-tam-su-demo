// Myka Care Companion App — family-facing views defined by the approved report.
(function () {
  function FamilyDashboard({ user, onLogout }) {
    const elderId = 'E001';
    const familyUserName = user?.id === 'U-DEMO-SETUP' ? 'Chị Duyên' : user?.name || 'Chị Duyên';
    const apiBase = String(window.MYKA_API_BASE || '').replace(/\/$/, '');
    const apiUrl = path => `${apiBase}/api${path}`;
    const [tab, setTab] = React.useState(() => window.matchMedia('(max-width: 767px)').matches ? 'home' : 'health');
    const [moreOpen, setMoreOpen] = React.useState(false);
    const [days, setDays] = React.useState(7);
    const [readings, setReadings] = React.useState(() => RTS.getBP(elderId) || []);
    const [schedules, setSchedules] = React.useState(() => RTS.getSchedules(elderId) || []);
    const [maintenance, setMaintenance] = React.useState([
      { id: 'MNT-DEMO-01', title: 'Kiểm tra máy đo huyết áp', detail: 'Đến hạn kiểm tra định kỳ thiết bị đo huyết áp.', status: 'pending', due_at: '2026-10-30' },
    ]);
    const [connectivity, setConnectivity] = React.useState(null);
    const setupCompleteKey = `myka_setup_complete_${user?.id || 'family'}`;
    const [setupMode, setSetupMode] = React.useState(() => Boolean(user?.demoSetupMode && !RTS.LS.get(setupCompleteKey)));
    const [newDeviceName, setNewDeviceName] = React.useState('');
    const [deviceMessage, setDeviceMessage] = React.useState('');
    const [showScheduleEditor, setShowScheduleEditor] = React.useState(false);
    const [showPaymentCheckout, setShowPaymentCheckout] = React.useState(false);
    const localToday = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const localMonthStart = new Date(Date.UTC(localToday.getUTCFullYear(), localToday.getUTCMonth(), 1)).toISOString().slice(0, 10);
    const previousMonthStart = new Date(Date.UTC(localToday.getUTCFullYear(), localToday.getUTCMonth() - 1, 1)).toISOString().slice(0, 10);
    const previousMonthEnd = new Date(Date.UTC(localToday.getUTCFullYear(), localToday.getUTCMonth(), 0)).toISOString().slice(0, 10);
    const nextMonthStart = new Date(Date.UTC(localToday.getUTCFullYear(), localToday.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
    const currentMonthEnd = new Date(Date.UTC(localToday.getUTCFullYear(), localToday.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
    const demoPayment = { id: 'PAY-INITIAL-E001', service_name: 'Thiết bị Myka + thuê bao tháng đầu', amount: 2100000, currency: 'VND', status: 'paid', period_start: previousMonthStart, period_end: previousMonthEnd, due_at: previousMonthStart, paid_at: `${previousMonthStart}T09:00:00+07:00` };
    const demoMonthlyPayment = { id: 'PAY-RENEWAL-E001', service_name: 'Myka Care Companion · kỳ hiện tại', amount: 100000, currency: 'VND', status: 'paid', period_start: localMonthStart, period_end: currentMonthEnd, due_at: localMonthStart, paid_at: `${localMonthStart}T09:00:00+07:00` };
    const [subscription, setSubscription] = React.useState({ current_plan: null, payments: [], pricing: null });
    const [agentStatus, setAgentStatus] = React.useState(null);
    const [telegramLinks, setTelegramLinks] = React.useState({ group_chat_url: '' });
    const [apiAvailable, setApiAvailable] = React.useState(false);
    const [healthDataSource, setHealthDataSource] = React.useState('app_demo');
    const [preferences, setPreferences] = React.useState({ dnd_mode: 'off', dnd_until: null, voice_profile: 'female_young_sweet', robot_name: '' });
    const [careProfile, setCareProfile] = React.useState(null);
    const [careProfileMessage, setCareProfileMessage] = React.useState('Đang tải hồ sơ người cao tuổi…');
    const [profileEditing, setProfileEditing] = React.useState(false);
    const [profileSaving, setProfileSaving] = React.useState(false);
    const [profileDraft, setProfileDraft] = React.useState({ age: '', address: '', health_notes: '' });
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
        setHealthDataSource(health.data_source || 'app_demo');
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
        .then(data => { if (active) { setConnectivity(data); if (data.paired_devices?.length) RTS.LS.set(`myka_device_paired_${user?.id}`, true); } })
        .catch(() => { if (active) setConnectivity({ paired_devices: [] }); });
      fetch(apiUrl(`/family/settings/${elderId}`))
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => { if (active) setPreferences(data); })
        .catch(() => { if (active) setSettingsMessage('Chưa tải được cài đặt từ máy chủ.'); });
      fetch(apiUrl(`/family/elder-profile/${elderId}`))
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => { if (active) { setCareProfile(data); setCareProfileMessage('Đã tải hồ sơ người cao tuổi.'); } })
        .catch(() => { if (active) { setCareProfile(null); setCareProfileMessage('Chưa tải được hồ sơ. Vui lòng kiểm tra kết nối.'); } });
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
    const upcomingSchedule = scheduleRows
      .filter(row => row.scheduled_at && new Date(row.scheduled_at).getTime() >= Date.now())
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))[0];
    const paymentRows = subscription.payments.length ? subscription.payments : [demoMonthlyPayment, demoPayment];
    const pricing = subscription.pricing || { device_price: 2000000, monthly_fee: 100000, first_payment_total: 2100000, renewal_day: 1, next_renewal_date: nextMonthStart, auto_renew: true };
    const pendingPayment = paymentRows.find(row => row.status === 'pending');
    const initialPaymentPending = pendingPayment && Number(pendingPayment.amount) === Number(pricing.first_payment_total);
    const checkoutPurpose = pendingPayment ? (initialPaymentPending ? 'Đăng ký dịch vụ' : 'Thanh toán hóa đơn') : 'Gia hạn dịch vụ';
    const refreshConnectivity = () => fetch(apiUrl(`/device/connectivity/${elderId}`))
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setConnectivity);
    const saveWifiNetwork = async ({ ssid, password }) => {
      const response = await fetch(apiUrl(`/device/wifi/${elderId}`), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ssid, password }),
      });
      if (!response.ok) throw new Error('Không lưu được cấu hình Wi-Fi vào API.');
      await refreshConnectivity();
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
    const startProfileEdit = () => {
      setProfileDraft({ age: careProfile?.age ?? '', address: careProfile?.address || '', health_notes: careProfile?.health_notes || '' });
      setProfileEditing(true);
      setCareProfileMessage('Nhập thông tin rồi chọn Lưu thay đổi.');
    };
    const saveCareProfile = async event => {
      event.preventDefault();
      setProfileSaving(true);
      try {
        const response = await fetch(apiUrl(`/family/elder-profile/${elderId}`), {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...profileDraft, age: profileDraft.age === '' ? null : Number(profileDraft.age) }),
        });
        if (!response.ok) throw new Error();
        const saved = await response.json();
        setCareProfile(saved); setProfileEditing(false);
        setCareProfileMessage('Đã lưu thay đổi hồ sơ người cao tuổi.');
      } catch { setCareProfileMessage('Chưa lưu được hồ sơ. Thông tin đang nhập được giữ lại để thử lại.'); }
      finally { setProfileSaving(false); }
    };
    const voiceOptions = [
      { id: 'male_young_warm', label: 'Nam thành niên', detail: 'Ấm áp' },
      { id: 'male_middle_steady', label: 'Nam trung niên', detail: 'Vững chãi' },
      { id: 'female_young_sweet', label: 'Nữ thành niên', detail: 'Ngọt ngào' },
      { id: 'female_middle_calm', label: 'Nữ trung niên', detail: 'Trầm ổn' },
    ];
    const tabs = [
      { id: 'health', label: 'Sức khỏe', icon: 'favorite' },
      { id: 'schedule', label: 'Lịch chăm sóc', icon: 'calendar_month' },
      { id: 'device', label: 'Bảo trì', icon: 'build' },
      { id: 'connectivity', label: 'Kết nối thiết bị', icon: 'devices' },
      { id: 'service', label: 'Gói & thanh toán', icon: 'credit_card' },
      { id: 'agent', label: 'AI Agent', icon: 'auto_awesome' },
      { id: 'conversations', label: 'Nhật ký Myka', icon: 'forum' },
      { id: 'settings', label: 'Cài đặt', icon: 'tune' },
      { id: 'profile', label: 'Hồ sơ', icon: 'account_circle' },
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
    if (setupMode || !devicePaired) return <DeviceSetupScreen apiUrl={apiUrl} onPaired={() => {
      if (setupMode) RTS.LS.set(setupCompleteKey, true);
      RTS.LS.set(`myka_device_paired_${user?.id}`, true);
      setSetupMode(false);
      refreshConnectivity();
    }} />;

    return (
      <div className="min-h-screen bg-[#f8f7f4] text-slate-800">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-blue-100 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img src="assets/avatar-family.png" alt={`Ảnh đại diện ${familyUserName}`} className="w-12 h-12 shrink-0 rounded-full object-cover ring-2 ring-blue-100" />
            <div className="min-w-0"><div className="truncate font-bold text-base sm:text-lg">{familyUserName}</div><div className="truncate text-xs sm:text-sm text-blue-700">Người thân của {elder?.name || 'Ngoại'}</div></div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => setTab('profile')} title="Hồ sơ tài khoản" aria-label="Hồ sơ tài khoản" className="grid h-11 w-11 place-items-center rounded-full border border-blue-200 bg-white text-blue-800 hover:bg-blue-50"><span className="material-symbols-rounded">account_circle</span></button>
            <button type="button" onClick={() => setTab('health')} title="Sức khỏe" aria-label="Sức khỏe" className="grid h-11 w-11 place-items-center rounded-full border border-blue-200 bg-white text-blue-800 hover:bg-blue-50"><span className="material-symbols-rounded">favorite</span></button>
            <button type="button" onClick={onLogout} title="Đăng xuất" aria-label="Đăng xuất" className="grid h-11 w-11 place-items-center rounded-full border border-blue-200 bg-blue-50 text-rose-500 hover:bg-rose-50"><span className="material-symbols-rounded">power_settings_new</span></button>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 pb-28 pt-4 sm:px-6 sm:pb-28 sm:pt-6 md:p-8 md:pb-8">
          <section className="relative mb-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1f5ba7] via-[#357eb8] to-[#70a3cf] p-5 sm:p-8 text-white shadow-xl shadow-blue-900/10">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[28px] border-white/10" aria-hidden="true" />
            <div className="relative">
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
                <img src="assets/avatar-elder.png" alt="Ảnh đại diện minh họa Ngoại" className="h-28 w-28 shrink-0 rounded-full border-4 border-white/90 object-cover shadow-lg sm:h-24 sm:w-24" />
                <div className="mt-4 min-w-0 sm:mt-0"><p className="text-xs font-bold tracking-[.16em] text-blue-50">HỒ SƠ CHĂM SÓC · {elder?.id || elderId}</p><h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{elder?.name || 'Bà Nguyễn Thị Hoa'}</h1><p className="mt-1 text-sm text-blue-50">{elder?.age || careProfile?.age || 72} tuổi</p><p className="mx-auto mt-1 flex max-w-2xl items-start justify-center gap-1 text-sm text-blue-50 sm:mx-0 sm:justify-start"><span className="material-symbols-rounded text-base" aria-hidden="true">location_on</span><span>{elder?.address || '12 Đường Hoa Mai, Phường Hòa Xuân, Đà Nẵng (địa chỉ giả)'}</span></p></div>
              </div>
              <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-blue-50 sm:mx-0 sm:text-left">Cùng gia đình chăm sóc Ngoại mỗi ngày. Số đo, lịch chăm sóc và thông tin cần thiết được gom tại đây.</p>
              <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3 sm:p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-blue-50/80 sm:text-xs">Thiết bị</p><p className="mt-1 truncate text-sm font-bold sm:text-lg">{preferences.robot_name?.trim() || elder?.deviceName || 'Myka'}</p><p className="mt-0.5 text-[10px] text-blue-50/80 sm:text-xs">Hồ sơ đã ghép</p></div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3 sm:p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-blue-50/80 sm:text-xs">Tuổi</p><p className="mt-1 text-2xl font-extrabold sm:text-3xl">{careProfile?.age || elder?.age || 72}</p><p className="mt-0.5 text-[10px] text-blue-50/80 sm:text-xs">Thông tin mẫu</p></div>
                <button type="button" onClick={() => setTab('health')} className="rounded-2xl border border-white/20 bg-white/10 p-3 text-left transition hover:bg-white/20 sm:p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-blue-50/80 sm:text-xs">Số đo gần nhất</p><p className="mt-1 truncate text-lg font-extrabold sm:text-2xl">{latest ? `${latest.systolic}/${latest.diastolic}` : 'Xem sức khỏe'}</p><p className="mt-0.5 text-[10px] text-blue-50/80 sm:text-xs">{latest ? 'Huyết áp · mmHg' : 'Mở lịch sử số đo'}</p></button>
              </div>
            </div>
          </section>
          <section className="mb-5 rounded-3xl border border-[#eee6d9] bg-[#fffdf8] p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700"><span className="material-symbols-rounded" aria-hidden="true">sunny</span></span><div><p className="text-[11px] font-bold tracking-[.12em] text-blue-700">CHĂM SÓC HÔM NAY</p><h2 className="mt-0.5 font-bold">Một chút quan tâm mỗi ngày</h2></div></div>
              <span className="hidden rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 sm:inline">{new Date().toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>
            <button type="button" onClick={() => setTab('schedule')} className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-blue-100 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/50">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff4e9] text-orange-700"><span className="material-symbols-rounded text-2xl" aria-hidden="true">{upcomingSchedule?.type === 'checkup' ? 'event' : 'medication'}</span></span>
              <span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{upcomingSchedule ? (upcomingSchedule.type === 'checkup' ? 'Lịch hẹn tiếp theo' : 'Lịch chăm sóc tiếp theo') : 'Lịch chăm sóc'}</span><span className="mt-0.5 block truncate font-bold text-slate-800">{upcomingSchedule?.title || 'Chưa có lịch sắp tới'}</span><span className="mt-0.5 block truncate text-sm text-slate-500">{upcomingSchedule ? `${dateLabel(upcomingSchedule.scheduled_at)} · ${upcomingSchedule.detail || 'Chạm để xem lịch'}` : 'Gia đình có thể thêm lịch thuốc hoặc lịch hẹn.'}</span></span>
              <span className="material-symbols-rounded shrink-0 text-blue-500" aria-hidden="true">chevron_right</span>
            </button>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setTab('health')} className="rounded-2xl bg-blue-50/80 p-3 text-left transition hover:bg-blue-100/80"><span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><span className="material-symbols-rounded text-base text-blue-700" aria-hidden="true">favorite</span> Huyết áp gần nhất</span><span className="mt-1 block text-lg font-extrabold text-slate-800">{latest ? `${latest.systolic}/${latest.diastolic}` : 'Chưa có số đo'}</span><span className="text-xs text-slate-500">{latest ? `mmHg · ${dateLabel(latest.timestamp)}` : 'Chạm để mở sức khỏe'}</span></button>
              <button type="button" onClick={() => setTab('health')} className="rounded-2xl bg-[#fff4e9] p-3 text-left transition hover:bg-[#ffecd8]"><span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><span className="material-symbols-rounded text-base text-orange-700" aria-hidden="true">ecg_heart</span> Nhịp tim gần nhất</span><span className="mt-1 block text-lg font-extrabold text-slate-800">{latest ? (latest.heart_rate || latest.heartRate || '—') : '—'}<span className="ml-1 text-xs font-medium text-slate-500">lần/phút</span></span><span className="text-xs text-slate-500">{latest ? dateLabel(latest.timestamp) : 'Chưa có bản ghi gần đây'}</span></button>
            </div>
          </section>
          <section className="bg-[#fffefa] border border-[#ebeef1] rounded-3xl p-4 mb-6 shadow-sm sm:p-5">
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
          <nav aria-label="Các chức năng Myka Care" className="hidden md:grid md:grid-cols-5 xl:grid-cols-9 gap-3 mb-3">
            {tabs.map(item => <button key={item.id} type="button" onClick={() => setTab(item.id)} aria-label={item.label} title={item.label} aria-current={tab === item.id ? 'page' : undefined} className={`min-h-[92px] rounded-2xl border px-2 py-3 flex flex-col items-center justify-center gap-2 text-center transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${tab === item.id ? 'bg-blue-700 border-blue-700 text-white shadow-lg shadow-blue-900/15 -translate-y-0.5' : 'bg-white border-blue-100 text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:-translate-y-0.5'}`}><span className={`grid h-11 w-11 place-items-center rounded-2xl ${tab === item.id ? 'bg-white/15 text-white' : 'bg-blue-50 text-blue-800'}`}><span className="material-symbols-rounded" aria-hidden="true">{item.icon}</span></span><span className="text-xs leading-tight font-semibold">{item.label}</span></button>)}
          </nav>
          <p className="mb-6 hidden text-xs text-slate-500 md:block">Chọn một mục để xem thông tin chăm sóc tương ứng.</p>

          <nav aria-label="Điều hướng Myka trên điện thoại" className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e9e8e2] bg-[#fffefa]/95 px-3 pt-2 shadow-[0_-8px_24px_rgba(31,61,91,.08)] backdrop-blur-md md:hidden" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
            {moreOpen && <div className="absolute bottom-full left-3 right-3 mb-3 grid grid-cols-3 gap-2 rounded-3xl border border-[#ebeef1] bg-[#fffefa] p-3 shadow-xl">
              {tabs.filter(item => !['health', 'schedule'].includes(item.id)).map(item => <button key={item.id} type="button" onClick={() => { setTab(item.id); setMoreOpen(false); }} aria-current={tab === item.id ? 'page' : undefined} className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center text-xs font-semibold ${tab === item.id ? 'bg-blue-50 text-blue-800' : 'bg-white text-slate-700 hover:bg-blue-50'}`}><span className="material-symbols-rounded text-blue-700" aria-hidden="true">{item.icon}</span><span>{item.label}</span></button>)}
            </div>}
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'home', label: 'Trang chủ', icon: 'home' },
                ...tabs.filter(item => ['health', 'schedule'].includes(item.id)),
                { id: 'more', label: 'Thêm', icon: 'apps' },
              ].map(item => item.id === 'more'
                ? <button key={item.id} type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen(open => !open)} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold ${moreOpen || !['home', 'health', 'schedule'].includes(tab) ? 'text-blue-800' : 'text-slate-500'}`}><span className="material-symbols-rounded" aria-hidden="true">{item.icon}</span><span>{item.label}</span></button>
                : <button key={item.id} type="button" onClick={() => { setTab(item.id === 'home' ? 'home' : item.id); setMoreOpen(false); }} aria-label={item.label} aria-current={tab === item.id ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold ${tab === item.id ? 'bg-blue-50 text-blue-800' : 'text-slate-500'}`}><span className="material-symbols-rounded" aria-hidden="true">{item.icon}</span><span>{item.label}</span></button>)}
            </div>
          </nav>

          {tab === 'profile' && <section className="space-y-5">
            <div><p className="text-sm text-blue-700 font-semibold">THÔNG TIN TÀI KHOẢN</p><h2 className="text-2xl font-bold mt-1">Hồ sơ gia đình</h2><p className="text-sm text-slate-500 mt-1">Thông tin dùng để cá nhân hóa trải nghiệm chăm sóc Myka.</p></div>
            <article className="rounded-3xl bg-gradient-to-br from-blue-800 to-teal-700 p-6 text-white shadow-lg shadow-blue-900/10">
              <div className="flex items-center gap-4"><img src="assets/avatar-family.png" alt={`Ảnh đại diện ${familyUserName}`} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/70" /><div><p className="text-2xl font-bold">{familyUserName}</p><p className="text-blue-50/80">Người thân · Tài khoản Myka Care</p></div></div>
              <div className="mt-6 grid sm:grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-blue-50/70">EMAIL ĐĂNG NHẬP</p><p className="mt-1 font-semibold break-all">{user?.email || 'Chưa có email'}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-blue-50/70">MÃ HỒ SƠ NGƯỜI THÂN</p><p className="mt-1 font-semibold">{user?.id || 'Tài khoản gia đình'}</p></div></div>
            </article>
            <article className="rounded-3xl border border-blue-100 bg-white p-5 md:p-6">
              <div className="flex items-center justify-between gap-3"><div><h3 className="font-bold text-lg">Hồ sơ người cao tuổi</h3><p className="text-sm text-slate-500">{elder?.name || elderId} · Mã hồ sơ {elderId}</p></div>
              {!profileEditing && <button type="button" onClick={startProfileEdit} className="rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white">{careProfile?.updated_at ? 'Chỉnh sửa' : 'Thêm'}</button>}</div>
              {!profileEditing && <button type="button" onClick={startProfileEdit} className="mt-3 text-sm font-semibold text-blue-700">Thêm thông tin</button>}
              {profileEditing ? <form onSubmit={saveCareProfile} className="mt-5 space-y-4">
                <label className="block text-sm font-semibold">Tuổi<input type="number" min="1" max="130" step="1" value={profileDraft.age} onChange={e => setProfileDraft({ ...profileDraft, age: e.target.value })} className="mt-1 block w-full rounded-xl border border-slate-300 p-3" /></label>
                <label className="block text-sm font-semibold">Địa chỉ<input maxLength="500" value={profileDraft.address} onChange={e => setProfileDraft({ ...profileDraft, address: e.target.value })} className="mt-1 block w-full rounded-xl border border-slate-300 p-3" /></label>
                <label className="block text-sm font-semibold">Tình trạng sức khỏe và tiền sử<textarea maxLength="2000" rows="3" value={profileDraft.health_notes} onChange={e => setProfileDraft({ ...profileDraft, health_notes: e.target.value })} className="mt-1 block w-full rounded-xl border border-slate-300 p-3" /></label>
                <div className="flex gap-3"><button disabled={profileSaving} className="rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{profileSaving ? 'Đang lưu…' : 'Lưu thay đổi'}</button><button type="button" disabled={profileSaving} onClick={() => setProfileEditing(false)} className="rounded-xl border px-4 py-2">Hủy</button></div>
              </form> : <dl className="mt-5 grid sm:grid-cols-2 gap-4"><div><dt>Tuổi</dt><dd className="font-semibold">{careProfile?.age ?? 'Chưa cập nhật'}</dd></div><div><dt>Địa chỉ</dt><dd className="font-semibold">{careProfile?.address || 'Chưa cập nhật'}</dd></div><div className="sm:col-span-2"><dt>Tình trạng sức khỏe và tiền sử</dt><dd className="font-semibold">{careProfile?.health_notes || 'Chưa cập nhật'}</dd></div></dl>}
              <p role="status" className="mt-4 text-sm text-blue-800">{careProfileMessage}</p>
            </article>
          </section>}

          {tab === 'health' && <section>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4"><div><h2 className="text-xl font-bold">Huyết áp và nhịp tim</h2><p className="text-sm text-slate-500">{healthDataSource === 'third_party_guide_demo' ? 'Dữ liệu ví dụ chuyển đổi từ 3rd_party_api_guide.md · chưa phải kết nối máy đo thật.' : 'Thông tin theo dõi, không thay thế tư vấn y tế.'}</p></div><select value={days} onChange={e => setDays(Number(e.target.value))} className="bg-white border border-slate-300 rounded-lg px-3 py-2"><option value={7}>7 ngày gần đây</option><option value={30}>30 ngày gần đây</option></select></div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {[["Lần đo gần nhất", latest ? `${latest.systolic}/${latest.diastolic}` : '—', 'mmHg'], ['Tâm thu trung bình', avg('systolic'), 'mmHg'], ['Tâm trương trung bình', avg('diastolic'), 'mmHg'], ['Nhịp tim trung bình', avgHeartRate, 'lần/phút']].map(([label, value, unit]) => <div key={label} className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold mt-2">{value} <span className="text-sm font-normal text-slate-500">{unit}</span></p></div>)}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5"><h3 className="font-semibold mb-3">Xu hướng chỉ số</h3>{chartData.length ? <><svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={`Biểu đồ xu hướng huyết áp và nhịp tim ${days} ngày`} className="w-full h-64"><title>{`Xu hướng huyết áp và nhịp tim ${days} ngày`}</title>{[0, 1, 2, 3].map(index => { const value = chartMin + (chartMax - chartMin) * index / 3; const y = chartY(value); return <g key={index}><line x1={chartLeft} x2={chartWidth - chartRight} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" /><text x={chartLeft - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">{Math.round(value)}</text></g>; })}{chartLines.map(line => <g key={line.key}><polyline fill="none" stroke={line.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={chartData.map((point, index) => `${chartX(index)},${chartY(Number(point[line.key]))}`).join(' ')} />{chartData.map((point, index) => <circle key={`${line.key}-${index}`} cx={chartX(index)} cy={chartY(Number(point[line.key]))} r="3.5" fill={line.color}><title>{`${point.time}: ${line.key} ${point[line.key]}`}</title></circle>)}</g>)}{chartData.map((point, index) => <text key={`date-${index}`} x={chartX(index)} y={chartHeight - 10} textAnchor="middle" fontSize="10" fill="#64748b">{point.time}</text>)}</svg><div className="flex flex-wrap gap-4 justify-center text-xs text-slate-600">{chartLines.map(line => <span key={line.key} className="inline-flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: line.color }} />{line.key}</span>)}</div></> : <p className="text-sm text-slate-500 py-8 text-center">Chưa có dữ liệu để hiển thị biểu đồ.</p>}</div>
            <article className={`rounded-xl border p-4 mb-5 ${trendSummary.tone === 'rose' ? 'bg-rose-50 border-rose-200' : trendSummary.tone === 'amber' ? 'bg-amber-50 border-amber-200' : trendSummary.tone === 'emerald' ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}><h3 className="font-semibold">Tóm tắt xu hướng {days} ngày</h3><p className="font-semibold mt-2">{trendSummary.title}</p><p className="text-sm text-slate-700 mt-1">{trendSummary.detail}</p><p className="text-xs text-slate-500 mt-3">Tóm tắt tự động theo ngưỡng demo đã cấu hình; không phải kết luận sức khỏe hay tư vấn y tế.</p></article>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><h3 className="font-semibold p-4">Lịch sử đo</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="text-left p-3">Thời gian</th><th className="text-left p-3">Huyết áp</th><th className="text-left p-3">Nhịp tim</th><th className="text-left p-3">Ghi chú</th></tr></thead><tbody>{visibleReadings.slice().reverse().map(row => <tr key={row.id} className="border-t border-slate-100"><td className="p-3">{dateLabel(row.timestamp)}</td><td className="p-3 font-semibold">{row.systolic}/{row.diastolic} mmHg</td><td className="p-3">{row.heart_rate || row.heartRate} bpm</td><td className="p-3 text-slate-500">{row.note || '—'}</td></tr>)}</tbody></table>{!visibleReadings.length && <p className="p-6 text-center text-slate-500">Chưa có bản ghi trong khoảng thời gian này.</p>}</div></div>
          </section>}

          {tab === 'schedule' && <section><div className="flex flex-wrap items-start justify-between gap-3 mb-4"><div><h2 className="text-xl font-bold mb-1">Lịch uống thuốc và tái khám</h2><p className="text-sm text-slate-500">Lịch được lưu vào backend demo; thông báo đẩy chưa được bật.</p></div><button onClick={() => setShowScheduleEditor(true)} className="rounded-xl bg-blue-600 text-white px-4 py-2.5 font-bold shadow-md shadow-blue-200">＋ Thêm lịch</button></div><div className="space-y-3">{scheduleRows.map(row => <article key={row.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-start"><span className="text-2xl">{row.type === 'checkup' ? '🏥' : '💊'}</span><div className="flex-1"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{row.title}</h3><span className="text-sm text-slate-500">{dateLabel(row.scheduled_at)}</span></div><p className="text-sm text-slate-600 mt-1">{row.detail || '—'}</p></div><span className={`text-xs px-2 py-1 rounded-full ${row.confirmed ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{row.confirmed ? 'Đã xác nhận' : 'Theo lịch'}</span></article>)}{!scheduleRows.length && <p className="bg-white rounded-xl p-6 text-slate-500">Chưa có lịch chăm sóc.</p>}</div></section>}

          {tab === 'device' && <section><h2 className="text-xl font-bold mb-1">Thông báo bảo trì thiết bị</h2><p className="text-sm text-slate-500 mb-4">Các nhắc nhở vận hành thiết bị được gửi từ hệ thống.</p><div className="space-y-3">{maintenance.map(item => <article key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4"><span className="text-2xl">🛠️</span><div className="flex-1"><h3 className="font-semibold">{item.title}</h3><p className="text-sm text-slate-600 mt-1">{item.detail}</p><p className="text-xs text-slate-500 mt-2">Hạn: {item.due_at || 'Chưa xác định'}</p></div><span className="text-xs px-2 py-1 h-fit rounded-full bg-amber-100 text-amber-800">{item.status === 'pending' ? 'Cần chú ý' : 'Đã xử lý'}</span></article>)}{!maintenance.length && <p className="bg-white rounded-xl p-6 text-slate-500">Hiện chưa có thông báo bảo trì.</p>}</div></section>}
          {tab === 'connectivity' && <section>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4"><div><h2 className="text-xl font-bold">Kết nối Robot Myka và máy đo</h2><p className="text-sm text-slate-500">Xem trạng thái Wi-Fi và thiết bị Bluetooth đã ghép.</p></div><span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">DEMO API · CHƯA KẾT NỐI PHẦN CỨNG THẬT</span></div>
            {connectivity ? <>
              <div className="grid sm:grid-cols-2 gap-3 mb-5"><article className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="font-semibold">Wi-Fi trong nhà</h3><p className="mt-2 text-sm">Mạng: {connectivity.wifi_ssid || 'Chưa cấu hình'}</p><p className="text-sm text-slate-500">Trạng thái: {connectivity.wifi_status || 'Chưa xác định'}{connectivity.wifi_signal ? ` · tín hiệu ${connectivity.wifi_signal}%` : ''}</p></article><article className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="font-semibold">Bluetooth</h3><p className="mt-2 text-sm">Trạng thái: {connectivity.bluetooth_status || 'Chưa xác định'}</p><p className="text-sm text-slate-500">Thiết bị đã ghép: {connectivity.paired_devices?.length || 0}</p></article></div>
              <div className="space-y-2 mb-5">{(connectivity.paired_devices || []).map(item => <article key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{item.name}</p><p className="text-sm text-slate-500">{item.type} · {item.status}</p></div><button onClick={() => unpairDevice(item.id)} disabled={!apiAvailable} className="px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:opacity-50">Gỡ thiết bị</button></article>)}</div>
              <div className="grid md:grid-cols-2 gap-4"><WifiNetworkPicker currentSsid={connectivity.wifi_ssid} onSaved={saveWifiNetwork} /><form onSubmit={pairDevice} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"><h3 className="font-semibold">Ghép Bluetooth (RUD demo)</h3><input required value={newDeviceName} onChange={e => setNewDeviceName(e.target.value)} placeholder="Tên thiết bị đo huyết áp" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /><button disabled={!apiAvailable} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Thêm thiết bị</button></form></div>
              {deviceMessage && <p role="status" className="text-sm text-blue-700 mt-3">{deviceMessage}</p>}
            </> : <div className="bg-white border border-slate-200 rounded-xl p-5"><p className="font-semibold">Chưa kết nối được API thiết bị.</p><p className="text-sm text-slate-500 mt-1">Mở backend demo để đọc và cập nhật trạng thái. Wi-Fi/Bluetooth hiện được mô phỏng qua API; để kết nối thiết bị thật cần firmware hoặc gateway phần cứng.</p></div>}
          </section>}

          {tab === 'service' && <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[.14em] text-blue-700">MYKA CARE COMPANION</p><h2 className="mt-1 text-2xl font-extrabold">Gói dịch vụ & thanh toán</h2><p className="mt-1 text-sm text-slate-500">Xem quyền lợi, kỳ gia hạn và hướng dẫn thanh toán.</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800"><span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" /> BẢN DEMO</span></div>
            <div className="grid gap-4 md:grid-cols-[1.15fr_.85fr]">
              <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1f5ba7] via-[#357eb8] to-[#70a3cf] p-5 text-white shadow-lg shadow-blue-900/10 sm:p-6"><span className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full border-[22px] border-white/10" aria-hidden="true" /><div className="relative"><div className="flex items-center justify-between gap-3"><span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold">GÓI HÀNG THÁNG</span><span className="material-symbols-rounded" aria-hidden="true">volunteer_activism</span></div><h3 className="mt-4 text-xl font-extrabold">Myka Care Companion</h3><p className="mt-1 text-sm text-blue-50">Đồng hành cùng gia đình trong việc chăm sóc Ngoại.</p><p className="mt-5 text-3xl font-extrabold">{Number(pricing.monthly_fee).toLocaleString('vi-VN')} <span className="text-base font-semibold">đ/tháng</span></p><p className="mt-1 text-sm text-blue-50">Gia hạn vào ngày {pricing.renewal_day} mỗi tháng</p><ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2"><li className="flex items-center gap-2"><span className="material-symbols-rounded text-lg" aria-hidden="true">check_circle</span>Số đo & lịch sử sức khỏe</li><li className="flex items-center gap-2"><span className="material-symbols-rounded text-lg" aria-hidden="true">check_circle</span>Lịch chăm sóc</li><li className="flex items-center gap-2"><span className="material-symbols-rounded text-lg" aria-hidden="true">check_circle</span>Hồ sơ người thân</li><li className="flex items-center gap-2"><span className="material-symbols-rounded text-lg" aria-hidden="true">check_circle</span>Nhật ký Myka</li></ul></div></article>
              <article className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-800"><span className="material-symbols-rounded" aria-hidden="true">smart_toy</span></span><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">MUA MỘT LẦN</p><h3 className="font-bold">Thiết bị Myka</h3></div></div><p className="mt-5 text-2xl font-extrabold text-slate-900">{Number(pricing.device_price).toLocaleString('vi-VN')} <span className="text-sm font-semibold text-slate-500">đ</span></p><p className="mt-1 text-sm leading-relaxed text-slate-600">Gia đình sở hữu thiết bị sau khi mua. Khoản này đã được thanh toán ở lần đăng ký đầu.</p><div className="mt-5 rounded-2xl bg-blue-50 p-4"><p className="flex items-center gap-2 text-sm font-bold text-blue-900"><span className="material-symbols-rounded text-lg" aria-hidden="true">check_circle</span>Đã thanh toán khi mua</p><div className="mt-2 flex justify-between gap-3 text-sm text-slate-700"><span>Thiết bị + tháng dịch vụ đầu</span><strong className="shrink-0 text-slate-900">{Number(pricing.first_payment_total).toLocaleString('vi-VN')} đ</strong></div><p className="mt-1 text-xs text-slate-600">Từ các tháng sau chỉ gia hạn thuê bao.</p></div></article>
            </div>
            <article className="mt-4 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{pendingPayment ? 'HÓA ĐƠN GIA HẠN CẦN THANH TOÁN' : 'KỲ GIA HẠN TIẾP THEO'}</p><p className="mt-1 text-2xl font-extrabold text-slate-900">{Number(pendingPayment?.amount || pricing.monthly_fee).toLocaleString('vi-VN')} đ</p><p className="mt-1 text-sm text-slate-500">{pendingPayment ? (pendingPayment.service_name || 'Myka Care Companion') : 'Myka Care Companion · 1 tháng dịch vụ'}</p></div><div className="rounded-2xl bg-blue-50 px-4 py-3"><p className="text-xs font-bold text-blue-700">{pendingPayment ? 'HẠN THANH TOÁN' : 'NGÀY GIA HẠN TIẾP THEO'}</p><p className="mt-1 font-bold text-blue-950">{pendingPayment?.due_at || pricing.next_renewal_date}</p><p className="mt-1 text-xs text-blue-800">Mức gia hạn {Number(pricing.monthly_fee).toLocaleString('vi-VN')} đ/tháng</p></div></div><div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs leading-relaxed text-slate-500">Khoản thiết bị và thuê bao tháng đầu đã thanh toán. Từ kỳ sau, gia đình chỉ gia hạn 100.000đ/tháng. Thanh toán bên dưới đang ở chế độ minh họa.</p><button type="button" onClick={() => setShowPaymentCheckout(true)} className="mt-4 w-full rounded-2xl bg-blue-700 px-5 py-3.5 font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-800 sm:w-auto">{pendingPayment ? 'Tiếp tục thanh toán' : 'Gia hạn tháng'}</button></div></article>
            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5"><div><h3 className="font-bold">Lịch sử thanh toán</h3><p className="mt-1 text-xs text-slate-500">Thông tin mẫu để minh họa màn hình hóa đơn.</p></div><span className="material-symbols-rounded text-blue-700" aria-hidden="true">receipt_long</span></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3 text-left">Nội dung</th><th className="p-3 text-left">Số tiền</th><th className="p-3 text-left">Kỳ</th><th className="p-3 text-left">Trạng thái</th></tr></thead><tbody>{paymentRows.map(row => { const paid = row.status === 'paid'; const isInitial = Number(row.amount) === Number(pricing.first_payment_total); return <tr key={row.id} className="border-t border-slate-100"><td className="p-3 font-medium">{row.service_name}</td><td className="p-3 font-bold">{Number(row.amount).toLocaleString('vi-VN')} {row.currency || 'VND'}</td><td className="p-3">{isInitial ? 'Lần đầu' : `Ngày ${pricing.renewal_day} hằng tháng`}</td><td className="p-3"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${paid ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{paid ? '✓ Đã thanh toán' : '● Chờ thanh toán'}</span></td></tr>; })}</tbody></table></div></div>
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
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4"><div><h2 className="text-xl font-bold">AI Agent theo dõi tự động</h2><p className="text-sm text-slate-500">Agent nhận dữ liệu, xử lý theo quy tắc, lưu kết quả và tạo cảnh báo mà không cần người dùng chat với AI.</p></div><span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">{agentStatus?.agent_name || 'MYKA CARE AGENT · DEMO'}</span></div>
              <div className="grid md:grid-cols-3 gap-3 mb-5">
                <article className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-sm text-slate-500">Trạng thái dịch vụ</p><p className="text-lg font-bold mt-2 text-green-700">{agentStatus?.service_status || 'Đang theo dõi dữ liệu demo'}</p></article>
                <article className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-sm text-slate-500">Kết quả xử lý gần nhất</p><p className="text-lg font-bold mt-2">{levelLabel}</p></article>
                <article className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-sm text-slate-500">Nguồn dữ liệu</p><p className="text-lg font-bold mt-2">{agentStatus?.data_source || (apiAvailable ? 'API backend / thiết bị' : 'Dữ liệu mẫu trong ứng dụng')}</p></article>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="font-semibold mb-4">Luồng xử lý tự động</h3><ol className="space-y-3">{activities.map((item, index) => <li key={index} className="flex gap-3"><span className="w-8 h-8 shrink-0 rounded-full bg-blue-100 text-blue-800 font-bold grid place-items-center">{index + 1}</span><div><p className="font-semibold">{item.title}</p><p className="text-sm text-slate-600 mt-0.5">{item.detail}</p></div></li>)}</ol></div>
              <p className="text-xs text-slate-500 mt-3">Bản demo minh họa Agent xử lý theo quy tắc/ngưỡng cấu hình; không chẩn đoán, không tư vấn y tế và không thay thế nhân viên y tế. Khi cần trao đổi, người thân mở kênh Telegram đã cấu hình.</p>
            </section>;
          })()}
          {tab === 'conversations' && <section>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5"><div><p className="text-sm text-blue-700 font-semibold">THEO DÕI GIA ĐÌNH</p><h2 className="text-xl font-bold mt-1">Nhật ký trò chuyện với Myka</h2><p className="text-sm text-slate-500 mt-1">Hồ sơ Bà Hoa · Cách xưng hô trong hội thoại: Ngoại – con. Nhật ký chỉ đọc.</p></div><span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${conversationData.source === 'telegram' ? 'bg-sky-100 text-sky-800' : ['demo', 'guide_demo'].includes(conversationData.source) ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{conversationData.source === 'telegram' ? 'Nguồn Telegram' : conversationData.source === 'guide_demo' ? 'Ví dụ theo API guide' : conversationData.source === 'demo' ? 'Dữ liệu minh họa' : 'Chưa có bản ghi'}</span></div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex flex-wrap items-center justify-between gap-3"><div><label htmlFor="conversation-date" className="block text-sm font-semibold">Chọn ngày</label><p className="text-xs text-slate-500 mt-1">Mặc định là hôm nay</p></div><input id="conversation-date" type="date" value={conversationDate} onChange={event => setConversationDate(event.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            {conversationData.review_needed_count > 0 && <article className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4"><p className="font-semibold text-amber-900">Có {conversationData.review_needed_count} lời nhắn được đánh dấu để gia đình xem lại</p><p className="text-sm text-amber-800 mt-1">Trong dữ liệu demo, đây là lời nhắn người thân cần xem lại. Nhãn này không phải đánh giá hay chẩn đoán sức khỏe.</p></article>}
            <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5"><div className="flex items-center justify-between gap-3 mb-4"><h3 className="font-semibold">Nội dung trong ngày</h3><span className="text-xs text-slate-500">{conversationData.messages?.length || 0} tin nhắn</span></div>
              {conversationLoading ? <p className="py-10 text-center text-sm text-slate-500">Đang tải nhật ký…</p>
                : conversationError ? <p role="status" className="py-10 text-center text-sm text-rose-700">{conversationError}</p>
                  : conversationData.messages?.length ? <ConversationHistory messages={conversationData.messages} loading={false} robotName={preferences.robot_name} />
                    : <p className="py-10 text-center text-sm text-slate-500">{conversationLoading ? 'Đang tải…' : 'Ngày này chưa có bản ghi trò chuyện.'}</p>}
            </div>
            <p className="text-xs text-slate-500 mt-3">Nội dung hiện là ví dụ trong 3rd_party_api_guide.md để minh họa cách hiển thị. Nhật ký thật chỉ được kết nối sau khi API có HTTPS, token chỉ đọc và ứng dụng có xác thực/phân quyền người thân.</p>
          </section>}
          {tab === 'settings' && <section>
            <div className="mb-5"><p className="text-sm text-blue-700 font-semibold">TÙY CHỈNH CHO GIA ĐÌNH</p><h2 className="text-xl font-bold mt-1">Cài đặt Myka</h2><p className="text-sm text-slate-500 mt-1">Lựa chọn được lưu theo hồ sơ người thân.</p></div>
            <form onSubmit={savePreferences} className="space-y-5">
              <article className="bg-white border border-slate-200 rounded-xl p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Chế độ Không làm phiền</h3><p className="text-sm text-slate-500 mt-1">Chọn khoảng thời gian tạm tắt thông báo trên ứng dụng.</p></div><span className={`text-xs font-semibold rounded-full px-3 py-1.5 ${preferences.dnd_mode === 'off' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{preferences.dnd_mode === 'off' ? 'Thông báo đang bật' : 'Không làm phiền đã chọn'}</span></div>
                <div className="flex flex-wrap gap-3 mt-4"><button type="button" onClick={() => { setPreferences({ ...preferences, dnd_mode: 'off', dnd_until: null }); setSettingsMessage(''); }} className={`rounded-xl border px-4 py-3 font-semibold ${preferences.dnd_mode === 'off' ? 'bg-blue-50 border-blue-400 text-blue-800' : 'border-slate-200'}`}>Bật thông báo lại</button><DndDurationPicker onSelect={(hours, minutes) => { const until = new Date(Date.now() + hours * 3600000 + minutes * 60000); setPreferences({ ...preferences, dnd_mode: 'custom', dnd_until: until.toISOString() }); setSettingsMessage(''); }} /><button type="button" onClick={() => { setPreferences({ ...preferences, dnd_mode: 'until_off', dnd_until: null }); setSettingsMessage(''); }} className={`rounded-xl border px-4 py-3 font-semibold ${preferences.dnd_mode === 'until_off' ? 'bg-amber-50 border-amber-400 text-amber-900' : 'border-slate-200'}`}>Đến khi tôi bật lại</button></div>
                {preferences.dnd_mode === 'custom' && preferences.dnd_until && <p className="text-sm text-amber-800 mt-3">Tự bật lại lúc {new Date(preferences.dnd_until).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}.</p>}
                <p className="text-xs text-slate-500 mt-4">Hiện app chưa gửi thông báo đẩy; lựa chọn này được lưu để dùng khi tích hợp thông báo. Khi đó, chế độ này sẽ tắt âm thanh và rung theo cấu hình ứng dụng.</p>
              </article>

              <article className="bg-white border border-slate-200 rounded-xl p-4 md:p-5"><h3 className="font-semibold">Tùy chỉnh giọng nói</h3><p className="text-sm text-slate-500 mt-1">Chọn phong cách giọng mà người cao tuổi cảm thấy dễ nghe.</p><div className="grid sm:grid-cols-2 gap-3 mt-4">{voiceOptions.map(voice => <label key={voice.id} className={`cursor-pointer rounded-xl border p-4 transition ${preferences.voice_profile === voice.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-300' : 'border-slate-200 hover:border-blue-300'}`}><span className="flex items-center gap-3"><input type="radio" name="voice_profile" value={voice.id} checked={preferences.voice_profile === voice.id} onChange={() => { setPreferences({ ...preferences, voice_profile: voice.id }); setSettingsMessage(''); }} className="accent-blue-600" /><span><span className="block font-semibold">{voice.label}</span><span className="block text-sm text-slate-500">Giọng {voice.detail.toLowerCase()}</span></span></span></label>)}</div><p className="text-xs text-slate-500 mt-4">Cài đặt giọng sẽ được lưu trong hồ sơ; hiện chưa đổi giọng phát ra từ robot vì chưa kết nối phần cứng.</p></article>

              <article className="bg-white border border-slate-200 rounded-xl p-4 md:p-5"><h3 className="font-semibold">Đổi tên robot</h3><p className="text-sm text-slate-500 mt-1">Không bắt buộc. Để trống nếu muốn tiếp tục dùng tên Myka.</p><label className="block text-sm font-medium mt-4" htmlFor="robot-name">Tên robot hiển thị</label><input id="robot-name" maxLength="40" value={preferences.robot_name || ''} onChange={event => { setPreferences({ ...preferences, robot_name: event.target.value }); setSettingsMessage(''); }} placeholder="Myka" className="mt-1 w-full sm:max-w-md border border-slate-300 rounded-lg px-3 py-2 text-sm" /><p className="text-xs text-slate-500 mt-2">Tên hiện tại: {preferences.robot_name?.trim() || 'Myka'}. Tên này chưa được đồng bộ tới phần cứng.</p></article>

              <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={!apiAvailable || settingsSaving} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">{settingsSaving ? 'Đang lưu…' : 'Lưu cài đặt'}</button>{settingsMessage && <p role="status" className="text-sm text-blue-700">{settingsMessage}</p>}</div>
            </form>
          </section>}
          <footer className="text-xs text-slate-400 mt-8">Myka Care Companion là phân hệ đọc và theo dõi dành cho người thân. Trao đổi tư vấn diễn ra trên Telegram, không có chat bác sĩ–người thân trong ứng dụng.</footer>
        </main>
        {showScheduleEditor && <ScheduleEditor onClose={() => setShowScheduleEditor(false)} onSave={createSchedule} />}
        {showPaymentCheckout && <PaymentCheckout amount={pendingPayment?.amount || pricing.monthly_fee} purpose={checkoutPurpose} cycleLabel={initialPaymentPending ? 'Thanh toán lần đầu' : (pendingPayment ? 'Hóa đơn chờ thanh toán' : `${pricing.next_renewal_date} · 1 tháng`)} onClose={() => setShowPaymentCheckout(false)} />}
      </div>
    );
  }
  window.FamilyDashboard = FamilyDashboard;
})();
