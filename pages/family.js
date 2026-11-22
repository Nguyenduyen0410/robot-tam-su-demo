// Myka Care Companion App — family-facing views defined by the approved report.
(function () {
  function FamilyDashboard({ user, onLogout }) {
    const elderId = 'E001';
    const familyUserName = user?.id === 'U-DEMO-SETUP' ? 'Chị Duyên' : user?.name || 'Chị Duyên';
    const apiBase = String(window.MYKA_API_BASE || '').replace(/\/$/, '');
    const apiUrl = path => `${apiBase}/api${path}`;
    const [tab, setTab] = React.useState(() => window.matchMedia('(max-width: 767px)').matches ? 'home' : 'health');
    const [moreOpen, setMoreOpen] = React.useState(false);
    const [highlightTarget, setHighlightTarget] = React.useState('');
    const [highlightRequest, setHighlightRequest] = React.useState(0);
    const [days, setDays] = React.useState(7);
    const [readings, setReadings] = React.useState(() => RTS.getBP(elderId) || []);
    const [schedules, setSchedules] = React.useState(() => RTS.getSchedules(elderId) || []);
    const [maintenance, setMaintenance] = React.useState([
      { id: 'MNT-DEMO-01', title: 'Kiểm tra máy đo huyết áp', detail: 'Đến hạn kiểm tra định kỳ thiết bị đo huyết áp.', status: 'pending', due_at: '2026-10-30' },
    ]);
    const [connectivity, setConnectivity] = React.useState(null);
    const setupCompleteKey = `myka_setup_complete_${user?.id || 'family'}`;
    const [setupMode, setSetupMode] = React.useState(() => Boolean(user?.demoSetupMode && !RTS.LS.get(setupCompleteKey)));
    const [setupFinished, setSetupFinished] = React.useState(() => Boolean(RTS.LS.get(setupCompleteKey)));
    const [newDeviceName, setNewDeviceName] = React.useState('');
    const [deviceMessage, setDeviceMessage] = React.useState('');
    const [showScheduleEditor, setShowScheduleEditor] = React.useState(false);
    const [editingSchedule, setEditingSchedule] = React.useState(null);
    const [showPaymentCheckout, setShowPaymentCheckout] = React.useState(false);
    const [editingDeviceId, setEditingDeviceId] = React.useState('');
    const [statusUpdatedAt, setStatusUpdatedAt] = React.useState(null);
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
    const [measurementSyncBusy, setMeasurementSyncBusy] = React.useState(false);
    const [measurementSyncMessage, setMeasurementSyncMessage] = React.useState('');
    const [measurementSyncTone, setMeasurementSyncTone] = React.useState('info');
    const defaultTgUrl = window.MYKA_TELEGRAM_GROUP_URL || 'https://web.telegram.org/a/#-1004358354552';
    const [telegramLinks, setTelegramLinks] = React.useState({
      group_chat_url: defaultTgUrl,
      group_name: 'Chat Group Myka · Hỏi lịch sử trò chuyện của Ngoại',
      bot_username: '@myka_care_p101_bot'
    });
    const [chartFilter, setChartFilter] = React.useState('all');
    const normalizeReading = row => {
      if (!row) return null;
      const sys = Number(row.systolic ?? row.sys ?? 0);
      const dia = Number(row.diastolic ?? row.dia ?? 0);
      const hr = Number(row.heart_rate ?? row.heartRate ?? row.pulse ?? row.pul ?? 0);
      const rawTs = row.measured_at || row.timestamp || new Date().toISOString();
      const isoTs = typeof rawTs === 'number' ? new Date(rawTs * 1000).toISOString() : String(rawTs).replace(' ', 'T');
      return {
        ...row,
        id: row.id || `bpm-${isoTs}`,
        systolic: sys,
        diastolic: dia,
        heart_rate: hr,
        heartRate: hr,
        timestamp: isoTs,
        received_at: row.received_at || isoTs,
        status_vi: row.status_vi || (sys >= 140 || dia >= 90 ? 'Cần lưu ý (Vượt ngưỡng)' : 'Huyết áp bình thường (Tối ưu)'),
        advice: row.advice || row.note || ''
      };
    };
    const [apiAvailable, setApiAvailable] = React.useState(false);
    const [healthDataSource, setHealthDataSource] = React.useState('app_demo');
    const [preferences, setPreferences] = React.useState({ dnd_mode: 'off', dnd_until: null, voice_profile: 'female_young_sweet', robot_name: '', bp_demo_schedule_enabled: false, bp_demo_morning_time: '09:00', bp_demo_evening_time: '19:00' });
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
    const [dndClock, setDndClock] = React.useState(Date.now());

    React.useEffect(() => {
      const timer = window.setInterval(() => setDndClock(Date.now()), 30000);
      return () => window.clearInterval(timer);
    }, []);

    React.useEffect(() => {
      if (!highlightTarget) return undefined;
      const target = document.getElementById(highlightTarget === 'settings-dnd' ? 'family-settings-dnd' : `family-section-${highlightTarget}`);
      target?.classList.remove('myka-focus-highlight');
      if (target) {
        void target.offsetWidth;
        target.classList.add('myka-focus-highlight');
      }
      const frame = window.requestAnimationFrame(() => {
        if (!target) return;
        const headerOffset = document.querySelector('.myka-family>header')?.getBoundingClientRect().height || 72;
        const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset - 14;
        window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
      });
      const timer = window.setTimeout(() => { target?.classList.remove('myka-focus-highlight'); setHighlightTarget(''); }, 2200);
      return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); target?.classList.remove('myka-focus-highlight'); };
    }, [tab, highlightTarget, highlightRequest]);

    React.useEffect(() => {
      let active = true;
      Promise.all([
        fetch(apiUrl(`/family/health-summary/${elderId}?days=${days}`)).then(r => r.ok ? r.json() : Promise.reject()),
        fetch(apiUrl(`/family/schedules/${elderId}`)).then(r => r.ok ? r.json() : Promise.reject()),
        fetch(apiUrl(`/family/maintenance-notifications/${elderId}`)).then(r => r.ok ? r.json() : Promise.reject()),
        fetch(apiUrl(`/family/subscription/${elderId}`)).then(r => r.ok ? r.json() : Promise.reject()),
      ]).then(([health, plan, notices, payments]) => {
        if (!active) return;
        const hData = health?.data || health || {};
        const rawReadings = hData.daily_readings || [];
        setReadings(rawReadings.map(normalizeReading).filter(Boolean).slice().reverse());
        setHealthDataSource(hData.data_source || 'robot');
        const sData = Array.isArray(plan) ? plan : (Array.isArray(plan?.data) ? plan.data : []);
        setSchedules(sData);
        setMaintenance(Array.isArray(notices) ? notices : (notices?.data || []));
        setSubscription(payments?.data || payments || { current_plan: null, payments: [], pricing: null });
        setApiAvailable(true);
      }).catch(() => {
        if (active) setApiAvailable(false);
      });
      fetch(apiUrl(`/family/telegram-consultation/${elderId}`))
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
          const tg = data?.data || data || {};
          if (active) setTelegramLinks({
            group_chat_url: tg.group_chat_url || defaultTgUrl,
            group_name: tg.group_name || 'Chat Group Myka · Hỏi lịch sử trò chuyện của Ngoại',
            bot_username: tg.bot_username || '@myka_care_p101_bot'
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
        .then(data => { const prof = data?.data || data; if (active) { setCareProfile({ ...prof, address: prof.address || prof.room || '', health_notes: prof.health_notes || (Array.isArray(prof.medical_conditions) ? prof.medical_conditions.join(', ') : '') }); setCareProfileMessage('Đã tải hồ sơ người cao tuổi.'); } })
        .catch(() => { if (active) { setCareProfile(null); setCareProfileMessage('Chưa tải được hồ sơ. Vui lòng kiểm tra kết nối.'); } });
      return () => { active = false; };
    }, [days]);

    React.useEffect(() => {
      let active = true;
      const refreshOperationalStatus = () => Promise.all([
        fetch(apiUrl(`/family/agent-status/${elderId}`)).then(response => response.ok ? response.json() : Promise.reject()),
        fetch(apiUrl(`/device/connectivity/${elderId}`)).then(response => response.ok ? response.json() : Promise.reject()),
        fetch(apiUrl(`/family/health-summary/${elderId}?days=${days}`)).then(response => response.ok ? response.json() : Promise.reject()),
      ]).then(([agent, device, health]) => {
        if (!active) return;
        setAgentStatus(agent?.data || agent);
        setConnectivity(device?.data || device);
        const hData = health?.data || health || {};
        setReadings((hData.daily_readings || []).map(normalizeReading).filter(Boolean).slice().reverse());
        setHealthDataSource(hData.data_source || 'robot');
        setApiAvailable(true);
        setStatusUpdatedAt(new Date());
      }).catch(() => {
        if (!active) return;
        setApiAvailable(false);
        setStatusUpdatedAt(new Date());
      });
      refreshOperationalStatus();
      const timer = window.setInterval(refreshOperationalStatus, 30000);
      return () => { active = false; window.clearInterval(timer); };
    }, [days]);

    React.useEffect(() => {
      let active = true;
      setConversationLoading(true);
      setConversationError('');
      fetch(apiUrl(`/family/conversation-history/${elderId}?date=${encodeURIComponent(conversationDate)}`))
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => { const cData = data?.data || data || {}; if (active) setConversationData({ ...cData, messages: cData.messages || [] }); })
        .catch(() => { if (active) setConversationError('Chưa tải được nhật ký từ máy chủ.'); })
        .finally(() => { if (active) setConversationLoading(false); });
      return () => { active = false; };
    }, [conversationDate]);

    const elder = RTS.getElders().find(e => e.id === elderId);
    const fallbackReadings = RTS.getBP(elderId) || [];
    const endDay = window.MykaCareJournal.today();
    const firstDay = window.MykaCareJournal.dayAt(endDay, 1 - days);
    const visibleReadings = (apiAvailable ? readings : fallbackReadings).filter(row => {
      if (!Number.isFinite(Date.parse(row.timestamp))) return false;
      const day = window.MykaCareJournal.today(new Date(row.timestamp));
      return day >= firstDay && day <= endDay;
    }).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    const latest = visibleReadings[visibleReadings.length - 1];
    const avg = key => {
      const values = visibleReadings.map(row => Number(key === 'heart_rate' ? row.heart_rate ?? row.heartRate : row[key]))
        .filter(value => Number.isFinite(value) && value > 0);
      return values.length ? Math.round(values.reduce((sum, n) => sum + n, 0) / values.length) : '—';
    };
    const avgHeartRate = avg('heart_rate');
    const dateLabel = value => {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
    };
    const receiptLabel = value => value && Number.isFinite(Date.parse(value))
      ? new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'medium' })
      : 'Chưa ghi nhận giờ nhận';
    const scheduleRows = apiAvailable ? schedules : schedules.map(s => ({
      ...s, scheduled_at: s.scheduled_at || s.time, type: s.type === 'appointment' ? 'checkup' : s.type,
    })).filter(s => ['medication', 'checkup'].includes(s.type));
    const scheduleState = row => {
      const scheduleTime = Date.parse(row.scheduled_at || row.time || '');
      if (!Number.isFinite(scheduleTime)) return { label: 'Chưa rõ giờ', classes: 'bg-slate-100 text-slate-700' };
      if (scheduleTime > Date.now()) return { label: 'Sắp đến', classes: 'bg-blue-100 text-blue-800' };
      return { label: 'Đã qua giờ lịch', classes: 'bg-slate-100 text-slate-700' };
    };
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
      const url = editingDeviceId
        ? apiUrl(`/device/bluetooth/${elderId}/${encodeURIComponent(editingDeviceId)}`)
        : apiUrl(`/device/bluetooth/pair/${elderId}`);
      fetch(url, {
        method: editingDeviceId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device_name, device_type: 'sphygmomanometer' }),
      }).then(r => r.ok ? r.json() : Promise.reject())
        .then(() => { setNewDeviceName(''); setEditingDeviceId(''); setDeviceMessage(editingDeviceId ? 'Đã cập nhật tên thiết bị.' : 'Đã thêm thiết bị vào hồ sơ.'); return refreshConnectivity(); })
        .catch(() => setDeviceMessage('Không kết nối được API backend.'));
    };
    const persistScheduleLocally = row => {
      const stored = RTS.LS.get('rts_schedules') || [];
      const localRow = { ...row, elderId, time: row.scheduled_at };
      RTS.LS.set('rts_schedules', [...stored.filter(item => item.id !== row.id), localRow]);
    };
    const saveSchedule = row => {
      const editingId = editingSchedule?.id;
      const url = editingId
        ? apiUrl(`/family/schedules/${elderId}/${encodeURIComponent(editingId)}`)
        : apiUrl(`/family/schedules/${elderId}`);
      fetch(url, {
        method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row),
      }).then(response => response.ok ? response.json() : Promise.reject())
        .then(savedRes => {
          const saved = savedRes?.data || savedRes;
          persistScheduleLocally(saved);
          setSchedules(current => [...current.filter(item => item.id !== saved.id), saved].sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at))));
          setShowScheduleEditor(false); setEditingSchedule(null);
        })
        .catch(() => {
          const localRow = { ...row, id: editingId || row.id, elder_id: elderId };
          persistScheduleLocally(localRow);
          setSchedules(current => [...current.filter(item => item.id !== localRow.id), localRow].sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at))));
          setShowScheduleEditor(false); setEditingSchedule(null);
          window.alert('Lịch đã được lưu trên thiết bị này nhưng chưa đồng bộ lên máy chủ.');
        });
    };
    const deleteSchedule = row => {
      if (!window.confirm(`Xóa lịch “${row.title}”?`)) return;
      fetch(apiUrl(`/family/schedules/${elderId}/${encodeURIComponent(row.id)}`), { method: 'DELETE' })
        .then(response => response.ok ? response.json() : Promise.reject())
        .then(() => {
          const stored = RTS.LS.get('rts_schedules') || [];
          RTS.LS.set('rts_schedules', stored.filter(item => item.id !== row.id));
          setSchedules(current => current.filter(item => item.id !== row.id));
        })
        .catch(() => {
          const stored = RTS.LS.get('rts_schedules') || [];
          RTS.LS.set('rts_schedules', stored.filter(item => item.id !== row.id));
          setSchedules(current => current.filter(item => item.id !== row.id));
          window.alert('Lịch đã được xóa trên thiết bị này nhưng chưa đồng bộ lên máy chủ.');
        });
    };
    const unpairDevice = deviceId => fetch(apiUrl(`/device/bluetooth/${elderId}/${encodeURIComponent(deviceId)}`), { method: 'DELETE' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => { setDeviceMessage('Đã xóa thiết bị khỏi hồ sơ.'); return refreshConnectivity(); })
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
      } catch { setCareProfileMessage('Chưa lưu được hồ sơ. Dữ liệu nháp vẫn được giữ nguyên để bạn thử lại.'); }
      finally { setProfileSaving(false); }
    };
    const recoverScheduledMeasurements = async () => {
      if (measurementSyncBusy) return;
      setMeasurementSyncBusy(true);
      setMeasurementSyncTone('info');
      setMeasurementSyncMessage('Đang kiểm tra các khung giờ và yêu cầu đồng bộ lại…');
      try {
        const response = await fetch(apiUrl(`/family/bp-sync/${elderId}`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Chưa đồng bộ được số đo.');
        const healthResponse = await fetch(apiUrl(`/family/health-summary/${elderId}?days=${days}`));
        if (!healthResponse.ok) throw new Error('Đã kiểm tra đồng bộ nhưng chưa tải lại được lịch sử. Bạn có thể thử lại.');
        const health = await healthResponse.json();
        setReadings((health.daily_readings || []).slice().reverse());
        setHealthDataSource(health.data_source || 'app_demo');
        setAgentStatus(result.agent || null);
        setApiAvailable(true); setStatusUpdatedAt(new Date());
        const slots = result.slots || [];
        if (result.received_count > 0) {
          setMeasurementSyncTone('success');
          const times = slots.filter(row => !row.skipped).map(row => row.slot === 'morning' ? '09:00' : '19:00').join(' và ');
          setMeasurementSyncMessage(`Đã đồng bộ bù ${result.received_count} số đo của khung ${times}. Lịch sử giữ giờ đo theo lịch; bấm lại không tạo bản ghi trùng.`);
        } else if (slots.every(row => row.reason === 'schedule_disabled')) {
          setMeasurementSyncMessage('Lịch mô phỏng đang tắt. Không thêm số đo hoặc tự bật lịch; bạn có thể kiểm tra cấu hình trong Cài đặt.');
        } else if (slots.some(row => row.reason === 'robot_no_measurement')) {
          setMeasurementSyncMessage('Chưa nhận được số đo của khung đã đến giờ. Cần có kết quả đo từ Myka trước khi đồng bộ; app không tạo số thay thế.');
        } else if (slots.every(row => row.reason === 'outside_schedule_window')) {
          setMeasurementSyncMessage('Chưa đến khung đo 09:00 hoặc 19:00 hôm nay. Không có số đo theo lịch để đồng bộ bù.');
        } else {
          setMeasurementSyncMessage('Các số đo đã đến lịch hôm nay đã có trong lịch sử. Không có số đo mới để bổ sung.');
        }
      } catch (error) {
        setMeasurementSyncTone('error');
        setMeasurementSyncMessage(error.message || 'Chưa đồng bộ được dữ liệu. Vui lòng thử lại.');
      } finally { setMeasurementSyncBusy(false); }
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
      { id: 'status', label: 'Trạng thái', icon: 'sync' },
      { id: 'conversations', label: 'Nhật ký Myka', icon: 'forum' },
      { id: 'settings', label: 'Cài đặt', icon: 'tune' },
      { id: 'profile', label: 'Hồ sơ', icon: 'account_circle' },
    ];
    const dailyVitals = window.MykaCareJournal.summarizeVitals(visibleReadings);
    const pressureSeries = [
      { key: 'systolic', label: 'Tâm thu', color: '#2348a0' },
      { key: 'diastolic', label: 'Tâm trương', color: '#36a0bd' }
    ];
    const pulseSeries = [{ key: 'pulse', label: 'Nhịp tim', color: '#ad4e16' }];
    const observedDays = dailyVitals.length;
    const range = key => {
      const values = dailyVitals.map(row => row[key]).filter(Number.isFinite);
      if (!values.length) return '—';
      const min = Math.round(Math.min(...values)), max = Math.round(Math.max(...values));
      return min === max ? String(min) : `${min}–${max}`;
    };

    function vitalBars(title, unit, series) {
      const rows = dailyVitals.filter(row => series.some(field => Number.isFinite(row[field.key])));
      if (!rows.length) return <p className="py-5 text-sm text-slate-600">Chưa có số đo {title.toLocaleLowerCase('vi')} trong khoảng này.</p>;
      const chartWidth = Math.max(660, rows.length * 50 + 72);
      const spacing = (chartWidth - 70) / rows.length;
      const barWidth = Math.min(32, (spacing - 8) / series.length);
      const max = Math.ceil(Math.max(...rows.flatMap(row => series.map(field => row[field.key] || 0))) / 40) * 40;
      const y = value => 208 - value / max * 164;
      return <div className="mb-5">
        <h4 className="font-semibold text-slate-900">{title} ({unit})</h4>
        <div className="mt-2 overflow-x-auto">
          <svg viewBox={`0 0 ${chartWidth} 246`} style={{ minWidth: chartWidth }} className="w-full"
            role="img" aria-label={`Biểu đồ cột ${title} trung bình theo ngày`}>
            {[0, 1, 2, 3, 4].map(tick => {
              const value = max * tick / 4;
              return <g key={tick}><line x1="44" x2={chartWidth - 12} y1={y(value)} y2={y(value)} stroke="#e2e8f0" />
                <text x="36" y={y(value) + 4} textAnchor="end" fontSize="12" fill="#475569">{value}</text></g>;
            })}
            {rows.map((row, index) => {
              const center = 48 + (index + 0.5) * spacing;
              return <g key={row.day}>
                {series.map((field, j) => Number.isFinite(row[field.key]) &&
                  <rect key={field.key} x={center - barWidth * series.length / 2 + j * barWidth + 1}
                    y={y(row[field.key])} width={barWidth - 2} height={208 - y(row[field.key])} rx="3" fill={field.color}>
                    <title>{row.day}: {field.label} {Math.round(row[field.key])} {unit}, trung bình ngày</title>
                  </rect>)}
                <text x={center} y="230" textAnchor="middle" fontSize="12" fill="#475569">
                  {row.day.slice(5).split('-').reverse().join('/')}
                </text>
              </g>;
            })}
          </svg>
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-700">
          {series.map(field => <span key={field.key} className="inline-flex items-center gap-2">
            <i className="h-3 w-3 rounded-sm" style={{ backgroundColor: field.color }} />{field.label}
          </span>)}
        </div>
      </div>;
    }

    const devicePaired = Boolean(connectivity?.paired_devices?.length);
    const focusSection = section => { setTab(section); setMoreOpen(false); setHighlightTarget(section); setHighlightRequest(current => current + 1); };
    const dndEnabled = preferences.dnd_mode !== 'off' && (!preferences.dnd_until || Date.parse(preferences.dnd_until) > dndClock);
    const dndUntilLabel = dndEnabled && preferences.dnd_until
      ? new Date(preferences.dnd_until).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
      : '';
    if (connectivity === null) return <div className="min-h-screen grid place-items-center bg-slate-50"><p className="text-slate-600">Đang kiểm tra trạng thái thiết bị Myka…</p></div>;
    if (setupMode || (!devicePaired && !setupFinished)) return <DeviceSetupScreen apiUrl={apiUrl} demoMode={Boolean(user?.demoSetupMode)} onPaired={() => {
      RTS.LS.set(setupCompleteKey, true);
      RTS.LS.set(`myka_device_paired_${user?.id}`, true);
      setSetupMode(false);
      setSetupFinished(true);
      refreshConnectivity();
    }} />;

    return (
      <div className="myka-family min-h-screen bg-[#f8f7f4] text-slate-800">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-blue-100 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img src="assets/avatar-family.png" alt={`Ảnh đại diện ${familyUserName}`} className="w-12 h-12 shrink-0 rounded-full object-cover ring-2 ring-blue-100" />
            <div className="min-w-0"><div className="truncate font-bold text-base sm:text-lg">{familyUserName}</div><div className="truncate text-xs sm:text-sm text-blue-700">Người thân của {elder?.name || 'Ngoại'}</div></div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => focusSection('profile')} title="Hồ sơ tài khoản" aria-label="Hồ sơ tài khoản" className="grid h-11 w-11 place-items-center rounded-full border border-blue-200 bg-white text-blue-800 hover:bg-blue-50"><span className="material-symbols-rounded">account_circle</span></button>
            <button type="button" onClick={() => focusSection('health')} title="Sức khỏe" aria-label="Sức khỏe" className="grid h-11 w-11 place-items-center rounded-full border border-blue-200 bg-white text-blue-800 hover:bg-blue-50"><span className="material-symbols-rounded">favorite</span></button>
            <button type="button" onClick={onLogout} title="Đăng xuất" aria-label="Đăng xuất" className="grid h-11 w-11 place-items-center rounded-full border border-blue-200 bg-blue-50 text-rose-500 hover:bg-rose-50"><span className="material-symbols-rounded">power_settings_new</span></button>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 pb-28 pt-4 sm:px-6 sm:pb-28 sm:pt-6 md:p-8 md:pb-8">
          <section className="relative mb-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1f5ba7] via-[#357eb8] to-[#70a3cf] p-5 sm:p-8 text-white shadow-xl shadow-blue-900/10">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[28px] border-white/10" aria-hidden="true" />
            <div className="relative">
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
                <img src="assets/avatar-elder.png" alt="Ảnh đại diện của Ngoại" className="h-28 w-28 shrink-0 rounded-full border-4 border-white/90 object-cover shadow-lg sm:h-24 sm:w-24" />
                <div className="mt-4 min-w-0 sm:mt-0"><p className="text-[11px] font-bold uppercase tracking-wider text-blue-200">ỨNG DỤNG HỖ TRỢ NGƯỜI THÂN · HỆ THỐNG AI CARE COMPANION</p><p className="mt-0.5 text-xs font-bold tracking-[.16em] text-blue-50">HỒ SƠ CHĂM SÓC · {elder?.id || elderId}</p><h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{elder?.name || 'Bà Nguyễn Thị Hoa'}</h1><p className="mt-1 text-sm text-blue-50">{careProfile?.age ?? elder?.age ?? 72} tuổi</p><p className="mx-auto mt-1 flex max-w-2xl items-start justify-center gap-1 text-sm text-blue-50 sm:mx-0 sm:justify-start"><span className="material-symbols-rounded text-base" aria-hidden="true">location_on</span><span>{careProfile?.address || elder?.address || 'Chưa cập nhật địa chỉ'}</span></p></div>
              </div>
              <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-blue-50 sm:mx-0 sm:text-left">Cùng gia đình chăm sóc Ngoại mỗi ngày. Số đo, lịch chăm sóc và thông tin cần thiết được gom tại đây.</p>
              <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3 sm:p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-blue-50/80 sm:text-xs">Thiết bị</p><p className="mt-1 truncate text-sm font-bold sm:text-lg">{preferences.robot_name?.trim() || elder?.deviceName || 'Myka'}</p><p className="mt-0.5 text-[10px] text-blue-50/80 sm:text-xs">Hồ sơ đã ghép</p></div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3 sm:p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-blue-50/80 sm:text-xs">Tuổi</p><p className="mt-1 text-2xl font-extrabold sm:text-3xl">{careProfile?.age || elder?.age || 72}</p></div>
                <button type="button" onClick={() => focusSection('health')} className="rounded-2xl border border-white/20 bg-white/10 p-3 text-left transition hover:bg-white/20 sm:p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-blue-50/80 sm:text-xs">Số đo gần nhất</p><p className="mt-1 truncate text-lg font-extrabold sm:text-2xl">{latest ? `${latest.systolic}/${latest.diastolic}` : 'Xem sức khỏe'}</p><p className="mt-0.5 text-[10px] text-blue-50/80 sm:text-xs">{latest ? 'Huyết áp · mmHg' : 'Mở lịch sử số đo'}</p></button>
              </div>
            </div>
          </section>
          <section id="family-section-home" className="scroll-mt-24 mb-5 rounded-3xl border border-[#eee6d9] bg-[#fffdf8] p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700"><span className="material-symbols-rounded" aria-hidden="true">sunny</span></span><div><p className="text-[11px] font-bold tracking-[.12em] text-blue-700">CHĂM SÓC HÔM NAY</p><h2 className="mt-0.5 font-bold">Một chút quan tâm mỗi ngày</h2></div></div>
              <span className="hidden rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 sm:inline">{new Date().toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>
            <button type="button" onClick={() => { focusSection('settings'); setHighlightTarget('settings-dnd'); }} aria-label={`Không làm phiền ${dndEnabled ? 'đang bật' : 'đang tắt'}, mở cài đặt`} className={`mt-4 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-4 ${dndEnabled ? 'border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100/80 focus-visible:ring-amber-200' : 'border-blue-100 bg-white text-slate-800 hover:bg-blue-50/60 focus-visible:ring-blue-200'}`}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${dndEnabled ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'}`}><span className="material-symbols-rounded" aria-hidden="true">{dndEnabled ? 'notifications_paused' : 'notifications_active'}</span></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold">Không làm phiền: {dndEnabled ? 'Đang bật' : 'Đang tắt'}</span><span className={`mt-0.5 block text-xs ${dndEnabled ? 'text-amber-800' : 'text-slate-500'}`}>{dndEnabled ? (dndUntilLabel ? `Tự bật thông báo lại lúc ${dndUntilLabel}` : 'Tiếp tục đến khi người thân bật lại') : 'Chế độ yên lặng chưa bật'}</span></span>
              <span className="shrink-0 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold">Cài đặt</span>
            </button>
            <button type="button" onClick={() => focusSection('schedule')} className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-blue-100 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/50">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff4e9] text-orange-700"><span className="material-symbols-rounded text-2xl" aria-hidden="true">{upcomingSchedule?.type === 'checkup' ? 'event' : 'medication'}</span></span>
              <span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{upcomingSchedule ? (upcomingSchedule.type === 'checkup' ? 'Lịch hẹn tiếp theo' : 'Lịch chăm sóc tiếp theo') : 'Lịch chăm sóc'}</span><span className="mt-0.5 block truncate font-bold text-slate-800">{upcomingSchedule?.title || 'Chưa có lịch sắp tới'}</span><span className="mt-0.5 block truncate text-sm text-slate-500">{upcomingSchedule ? `${dateLabel(upcomingSchedule.scheduled_at)} · ${upcomingSchedule.detail || 'Chạm để xem lịch'}` : 'Gia đình có thể thêm lịch thuốc hoặc lịch hẹn.'}</span></span>
              <span className="material-symbols-rounded shrink-0 text-blue-500" aria-hidden="true">chevron_right</span>
            </button>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => focusSection('health')} className="rounded-2xl bg-blue-50/80 p-3 text-left transition hover:bg-blue-100/80"><span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><span className="material-symbols-rounded text-base text-blue-700" aria-hidden="true">favorite</span> Huyết áp gần nhất</span><span className="mt-1 block text-lg font-extrabold text-slate-800">{latest ? `${latest.systolic}/${latest.diastolic}` : 'Chưa có số đo'}</span><span className="text-xs text-slate-500">{latest ? `mmHg · ${dateLabel(latest.timestamp)}` : 'Chạm để mở sức khỏe'}</span></button>
              <button type="button" onClick={() => focusSection('health')} className="rounded-2xl bg-[#fff4e9] p-3 text-left transition hover:bg-[#ffecd8]"><span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><span className="material-symbols-rounded text-base text-orange-700" aria-hidden="true">ecg_heart</span> Nhịp tim gần nhất</span><span className="mt-1 block text-lg font-extrabold text-slate-800">{latest ? (latest.heart_rate || latest.heartRate || '—') : '—'}<span className="ml-1 text-xs font-medium text-slate-500">lần/phút</span></span><span className="text-xs text-slate-500">{latest ? dateLabel(latest.timestamp) : 'Chưa có bản ghi gần đây'}</span></button>
            </div>
          </section>
          <section className="bg-gradient-to-r from-sky-50 via-[#fffefa] to-blue-50 border border-sky-200 rounded-3xl p-4 mb-6 shadow-sm sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-600 text-white shadow-sm">
                  <span className="material-symbols-rounded" aria-hidden="true">forum</span>
                </span>
                <div>
                  <span className="inline-block rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">KÊNH TELEGRAM GIA ĐÌNH & ROBOT MYKA</span>
                  <h3 className="mt-1 text-base font-extrabold text-slate-900">Chat Group Telegram · Hỏi Myka việc Ngoại đã trò chuyện</h3>
                  <p className="mt-0.5 text-xs sm:text-sm text-slate-600">Người thân vào Chat Group để hỏi trực tiếp Myka ({telegramLinks.bot_username || '@myka_care_p101_bot'}) xem hôm nay Ngoại đã tâm sự những gì với robot và trao đổi chăm sóc.</p>
                </div>
              </div>
              <a href={telegramLinks.group_chat_url || defaultTgUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700">
                <span className="material-symbols-rounded" aria-hidden="true">send</span>
                Chat Group Telegram ↗
              </a>
            </div>
          </section>
          <nav aria-label="Các chức năng Myka Care" className="hidden md:grid md:grid-cols-5 xl:grid-cols-9 gap-3 mb-3">
            {tabs.map(item => <button key={item.id} type="button" onClick={() => focusSection(item.id)} aria-label={item.label} title={item.label} aria-current={tab === item.id ? 'page' : undefined} className={`min-h-[92px] rounded-2xl border px-2 py-3 flex flex-col items-center justify-center gap-2 text-center transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${tab === item.id ? 'bg-blue-700 border-blue-700 text-white shadow-lg shadow-blue-900/15 -translate-y-0.5' : 'bg-white border-blue-100 text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:-translate-y-0.5'}`}><span className={`grid h-11 w-11 place-items-center rounded-2xl ${tab === item.id ? 'bg-white/15 text-white' : 'bg-blue-50 text-blue-800'}`}><span className="material-symbols-rounded" aria-hidden="true">{item.icon}</span></span><span className="text-xs leading-tight font-semibold">{item.label}</span></button>)}
          </nav>
          <p className="mb-6 hidden text-xs text-slate-500 md:block">Chọn một mục để xem thông tin chăm sóc tương ứng.</p>

          <nav aria-label="Điều hướng Myka trên điện thoại" className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e9e8e2] bg-[#fffefa]/95 px-3 pt-2 shadow-[0_-8px_24px_rgba(31,61,91,.08)] backdrop-blur-md md:hidden" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
            {moreOpen && <div className="absolute bottom-full left-3 right-3 mb-3 grid grid-cols-3 gap-2 rounded-3xl border border-[#ebeef1] bg-[#fffefa] p-3 shadow-xl">
              {tabs.filter(item => !['health', 'schedule'].includes(item.id)).map(item => <button key={item.id} type="button" onClick={() => focusSection(item.id)} aria-current={tab === item.id ? 'page' : undefined} className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center text-xs font-semibold ${tab === item.id ? 'bg-blue-50 text-blue-800' : 'bg-white text-slate-700 hover:bg-blue-50'}`}><span className="material-symbols-rounded text-blue-700" aria-hidden="true">{item.icon}</span><span>{item.label}</span></button>)}
            </div>}
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'home', label: 'Trang chủ', icon: 'home' },
                ...tabs.filter(item => ['health', 'schedule'].includes(item.id)),
                { id: 'more', label: 'Thêm', icon: 'apps' },
              ].map(item => item.id === 'more'
                ? <button key={item.id} type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen(open => !open)} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold ${moreOpen || !['home', 'health', 'schedule'].includes(tab) ? 'text-blue-800' : 'text-slate-500'}`}><span className="material-symbols-rounded" aria-hidden="true">{item.icon}</span><span>{item.label}</span></button>
                : <button key={item.id} type="button" onClick={() => focusSection(item.id)} aria-label={item.label} aria-current={tab === item.id ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold ${tab === item.id ? 'bg-blue-50 text-blue-800' : 'text-slate-500'}`}><span className="material-symbols-rounded" aria-hidden="true">{item.icon}</span><span>{item.label}</span></button>)}
            </div>
          </nav>

          {tab === 'profile' && <section id="family-section-profile" className="scroll-mt-24 space-y-5">
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

          {tab === 'health' && <section id="family-section-health" className="scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Theo dõi sức khỏe</h2>
              <label className="flex items-center gap-2 text-sm">Khoảng thời gian
                <select value={days} onChange={e => setDays(Number(e.target.value))} className="rounded-lg border border-slate-300 bg-white px-3 py-2">
                  <option value={7}>7 ngày gần đây</option><option value={30}>30 ngày gần đây</option>
                </select>
              </label>
            </div>
            <CareJournal key={elderId} elderId={elderId} days={days} />
            <div className="mb-4"><h2 className="text-xl font-bold">Huyết áp và nhịp tim</h2>
              <p className="text-sm text-slate-500">{apiAvailable ? 'Số đo trả về từ API Myka.' : 'Dữ liệu lưu trên trình duyệt khi chưa kết nối API.'} Thông tin tham khảo.</p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {[["Lần đo gần nhất", latest ? `${latest.systolic}/${latest.diastolic}` : '—', 'mmHg'], ['Tâm thu trung bình', avg('systolic'), 'mmHg'], ['Tâm trương trung bình', avg('diastolic'), 'mmHg'], ['Nhịp tim trung bình', avgHeartRate, 'lần/phút']].map(([label, value, unit]) => <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold mt-2 text-slate-800">{value} <span className="text-sm font-normal text-slate-500">{unit}</span></p></div>)}
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 mb-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Biểu đồ cột theo ngày ({days} ngày)</h3>
                  <p className="text-sm text-slate-600">Mỗi cột là trung bình các lần đo hợp lệ trong một ngày có dữ liệu. Huyết áp và nhịp tim dùng hai thang đo riêng.</p>
                </div>
                <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                  {[['all', 'Tất cả'], ['bp', 'Huyết áp'], ['hr', 'Nhịp tim']].map(([key, label]) => (
                    <button key={key} type="button" aria-pressed={chartFilter === key} onClick={() => setChartFilter(key)}
                      className={`rounded-lg px-3 py-1.5 ${chartFilter === key ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-600'}`}>{label}</button>
                  ))}
                </div>
              </div>
              {chartFilter !== 'hr' && vitalBars('Huyết áp', 'mmHg', pressureSeries)}
              {chartFilter !== 'bp' && vitalBars('Nhịp tim', 'lần/phút', pulseSeries)}
            </div>
            <article className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <h3 className="font-bold">Mức dao động trong các ngày có số đo</h3>
              <p className="mt-1 text-sm text-slate-700">Có {observedDays} ngày ghi nhận trong kỳ đang xem. Khoảng dưới đây tính trên các giá trị trung bình ngày.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {[['Tâm thu', 'systolic', 'mmHg'], ['Tâm trương', 'diastolic', 'mmHg'], ['Nhịp tim', 'pulse', 'lần/phút']].map(([label, key, unit]) =>
                  <div key={key}><p className="text-sm text-slate-700">{label}</p><p className="text-xl font-bold">{range(key)} <span className="text-sm font-normal">{unit}</span></p></div>)}
              </div>
              <p className="mt-3 text-sm text-slate-700">Xem lại lần đo và hỏi thăm Ngoại nếu thấy số đo hoặc sinh hoạt thay đổi so với thường ngày.</p>
              <button type="button" onClick={() => focusSection('conversations')} className="mt-2 text-sm font-semibold text-blue-800">Mở nhật ký trò chuyện để xem bối cảnh</button>
            </article>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"><h3 className="font-semibold p-4">Lịch sử đo huyết áp</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="text-left p-3">Giờ nhận số đo</th><th className="text-left p-3">Huyết áp</th><th className="text-left p-3">Nhịp tim</th><th className="text-left p-3">Nguồn ghi nhận</th><th className="text-left p-3">Ghi chú</th></tr></thead><tbody>{visibleReadings.slice().reverse().map(row => {
              return <tr key={row.id} className="border-t border-slate-100"><td className="p-3 whitespace-nowrap">{receiptLabel(row.received_at)}</td><td className="p-3 font-semibold whitespace-nowrap">{row.systolic}/{row.diastolic} mmHg</td><td className="p-3 whitespace-nowrap">{row.heart_rate || row.heartRate} bpm</td><td className="p-3 whitespace-nowrap"><span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">Robot Myka</span></td><td className="p-3 text-slate-500">{row.id?.startsWith('BP-SCHEDULE-') ? 'Robot mô phỏng · gửi theo lịch hằng ngày' : row.note?.startsWith('APP-SYNC-DEMO:') ? 'Đã cập nhật từ mục Trạng thái.' : row.note || '—'}</td></tr>;
            })}</tbody></table>{!visibleReadings.length && <p className="p-6 text-center text-slate-500">Chưa có bản ghi trong khoảng thời gian này.</p>}</div></div>
          </section>}

          {tab === 'schedule' && <section id="family-section-schedule" className="scroll-mt-24"><div className="flex flex-wrap items-start justify-between gap-3 mb-4"><div><h2 className="text-xl font-bold mb-1">Lịch uống thuốc và tái khám</h2><p className="text-sm text-slate-500">Lịch nhắc dự kiến của Ngoại. Trạng thái dựa trên giờ đã đặt.</p></div><button onClick={() => { setEditingSchedule(null); setShowScheduleEditor(true); }} className="rounded-xl bg-blue-600 text-white px-4 py-2.5 font-bold shadow-md shadow-blue-200">＋ Thêm lịch</button></div><div className="space-y-3">{scheduleRows.map(row => <article key={row.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-4 items-start"><span className="text-2xl">{row.type === 'checkup' ? '🏥' : '💊'}</span><div className="flex-1 min-w-[12rem]"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{row.title}</h3><span className="text-sm text-slate-500">{dateLabel(row.scheduled_at)}</span></div><p className="text-sm text-slate-600 mt-1">{row.detail || '—'}</p></div><span className={`text-xs px-2 py-1 rounded-full ${scheduleState(row).classes}`}>{scheduleState(row).label}</span><div className="ml-auto flex gap-2"><button type="button" onClick={() => { setEditingSchedule(row); setShowScheduleEditor(true); }} className="rounded-lg border px-3 py-2 text-sm font-semibold text-blue-700">Chỉnh sửa</button><button type="button" onClick={() => deleteSchedule(row)} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700">Xóa</button></div></article>)}{!scheduleRows.length && <p className="bg-white rounded-xl p-6 text-slate-500">Chưa có lịch chăm sóc.</p>}</div></section>}

          {tab === 'device' && <section id="family-section-device" className="scroll-mt-24"><h2 className="text-xl font-bold mb-1">Thông báo bảo trì thiết bị</h2><p className="text-sm text-slate-500 mb-4">Các nhắc nhở vận hành thiết bị được gửi từ hệ thống.</p><div className="space-y-3">{maintenance.map(item => <article key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4"><span className="text-2xl">🛠️</span><div className="flex-1"><h3 className="font-semibold">{item.title}</h3><p className="text-sm text-slate-600 mt-1">{item.detail}</p><p className="text-xs text-slate-500 mt-2">Hạn: {item.due_at || 'Chưa xác định'}</p></div><span className="text-xs px-2 py-1 h-fit rounded-full bg-amber-100 text-amber-800">{item.status === 'pending' ? 'Cần chú ý' : 'Đã xử lý'}</span></article>)}{!maintenance.length && <p className="bg-white rounded-xl p-6 text-slate-500">Hiện chưa có thông báo bảo trì.</p>}</div></section>}
          {tab === 'connectivity' && <section id="family-section-connectivity" className="scroll-mt-24">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4"><div><h2 className="text-xl font-bold">Kết nối Robot Myka và máy đo</h2><p className="text-sm text-slate-500">Xem trạng thái Wi-Fi và thiết bị Bluetooth đã ghép.</p></div><span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">TRẠNG THÁI THIẾT BỊ</span></div>
            {connectivity ? <>
              <div className="grid sm:grid-cols-2 gap-3 mb-5"><article className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="font-semibold">Wi-Fi trong nhà</h3><p className="mt-2 text-sm">Mạng: {connectivity.wifi_ssid || 'Chưa cấu hình'}</p><p className="text-sm text-slate-500">Trạng thái: {connectivity.wifi_status || 'Chưa xác định'}{connectivity.wifi_signal ? ` · tín hiệu ${connectivity.wifi_signal}%` : ''}</p></article><article className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="font-semibold">Bluetooth</h3><p className="mt-2 text-sm">Trạng thái: {connectivity.bluetooth_status || 'Chưa xác định'}</p><p className="text-sm text-slate-500">Thiết bị đã ghép: {connectivity.paired_devices?.length || 0}</p></article></div>
              <div className="space-y-2 mb-5">{(connectivity.paired_devices || []).map(item => <article key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{item.name}</p><p className="text-sm text-slate-500">{item.type} · {item.status === 'demo' ? 'Đã ghép hồ sơ' : item.status}</p></div><div className="flex gap-2"><button onClick={() => { setEditingDeviceId(item.id); setNewDeviceName(item.name); setDeviceMessage(''); }} disabled={!apiAvailable} className="px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:opacity-50">Đổi tên</button><button onClick={() => unpairDevice(item.id)} disabled={!apiAvailable} className="px-3 py-2 rounded-lg border border-rose-200 text-sm text-rose-700 disabled:opacity-50">Gỡ thiết bị</button></div></article>)}</div>
              <div className="grid md:grid-cols-2 gap-4"><WifiNetworkPicker currentSsid={connectivity.wifi_ssid} onSaved={saveWifiNetwork} /><form onSubmit={pairDevice} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"><h3 className="font-semibold">{editingDeviceId ? 'Đổi tên thiết bị' : 'Ghép máy đo Bluetooth'}</h3><input required value={newDeviceName} onChange={e => setNewDeviceName(e.target.value)} placeholder="Tên thiết bị đo huyết áp" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /><div className="flex gap-2"><button disabled={!apiAvailable} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">{editingDeviceId ? 'Lưu thay đổi' : 'Thêm thiết bị'}</button>{editingDeviceId && <button type="button" onClick={() => { setEditingDeviceId(''); setNewDeviceName(''); }} className="px-4 py-2 rounded-lg border text-sm">Hủy</button>}</div></form></div>
              {deviceMessage && <p role="status" className="text-sm text-blue-700 mt-3">{deviceMessage}</p>}
            </> : <div className="bg-white border border-slate-200 rounded-xl p-5"><p className="font-semibold">Chưa kết nối được API thiết bị.</p><p className="text-sm text-slate-500 mt-1">Vui lòng thử lại sau. Wi-Fi/Bluetooth sẽ hoạt động khi gateway Myka được kết nối.</p></div>}
          </section>}

          {tab === 'service' && <section id="family-section-service" className="scroll-mt-24">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[.14em] text-blue-700">MYKA CARE COMPANION</p><h2 className="mt-1 text-2xl font-extrabold">Gói dịch vụ & thanh toán</h2><p className="mt-1 text-sm text-slate-500">Xem quyền lợi, kỳ gia hạn và hướng dẫn thanh toán.</p></div></div>
            <div className="grid gap-4 md:grid-cols-[1.15fr_.85fr]">
              <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1f5ba7] via-[#357eb8] to-[#70a3cf] p-5 text-white shadow-lg shadow-blue-900/10 sm:p-6"><span className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full border-[22px] border-white/10" aria-hidden="true" /><div className="relative"><div className="flex items-center justify-between gap-3"><span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold">GÓI HÀNG THÁNG</span><span className="material-symbols-rounded" aria-hidden="true">volunteer_activism</span></div><h3 className="mt-4 text-xl font-extrabold">Myka Care Companion</h3><p className="mt-1 text-sm text-blue-50">Đồng hành cùng gia đình trong việc chăm sóc Ngoại.</p><p className="mt-5 text-3xl font-extrabold">{Number(pricing.monthly_fee).toLocaleString('vi-VN')} <span className="text-base font-semibold">đ/tháng</span></p><p className="mt-1 text-sm text-blue-50">Gia hạn vào ngày {pricing.renewal_day} mỗi tháng</p><ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2"><li className="flex items-center gap-2"><span className="material-symbols-rounded text-lg" aria-hidden="true">check_circle</span>Số đo & lịch sử sức khỏe</li><li className="flex items-center gap-2"><span className="material-symbols-rounded text-lg" aria-hidden="true">check_circle</span>Lịch chăm sóc</li><li className="flex items-center gap-2"><span className="material-symbols-rounded text-lg" aria-hidden="true">check_circle</span>Hồ sơ người thân</li><li className="flex items-center gap-2"><span className="material-symbols-rounded text-lg" aria-hidden="true">check_circle</span>Nhật ký Myka</li></ul></div></article>
              <article className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-800"><span className="material-symbols-rounded" aria-hidden="true">smart_toy</span></span><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">MUA MỘT LẦN</p><h3 className="font-bold">Thiết bị Myka</h3></div></div><p className="mt-5 text-2xl font-extrabold text-slate-900">{Number(pricing.device_price).toLocaleString('vi-VN')} <span className="text-sm font-semibold text-slate-500">đ</span></p><p className="mt-1 text-sm leading-relaxed text-slate-600">Gia đình sở hữu thiết bị sau khi mua. Khoản này đã được thanh toán ở lần đăng ký đầu.</p><div className="mt-5 rounded-2xl bg-blue-50 p-4"><p className="flex items-center gap-2 text-sm font-bold text-blue-900"><span className="material-symbols-rounded text-lg" aria-hidden="true">check_circle</span>Đã thanh toán khi mua</p><div className="mt-2 flex justify-between gap-3 text-sm text-slate-700"><span>Thiết bị + tháng dịch vụ đầu</span><strong className="shrink-0 text-slate-900">{Number(pricing.first_payment_total).toLocaleString('vi-VN')} đ</strong></div><p className="mt-1 text-xs text-slate-600">Từ các tháng sau chỉ gia hạn thuê bao.</p></div></article>
            </div>
            <article className="mt-4 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{pendingPayment ? 'HÓA ĐƠN GIA HẠN CẦN THANH TOÁN' : 'KỲ GIA HẠN TIẾP THEO'}</p><p className="mt-1 text-2xl font-extrabold text-slate-900">{Number(pendingPayment?.amount || pricing.monthly_fee).toLocaleString('vi-VN')} đ</p><p className="mt-1 text-sm text-slate-500">{pendingPayment ? (pendingPayment.service_name || 'Myka Care Companion') : 'Myka Care Companion · 1 tháng dịch vụ'}</p></div><div className="rounded-2xl bg-blue-50 px-4 py-3"><p className="text-xs font-bold text-blue-700">{pendingPayment ? 'HẠN THANH TOÁN' : 'NGÀY GIA HẠN TIẾP THEO'}</p><p className="mt-1 font-bold text-blue-950">{pendingPayment?.due_at || pricing.next_renewal_date}</p><p className="mt-1 text-xs text-blue-800">Mức gia hạn {Number(pricing.monthly_fee).toLocaleString('vi-VN')} đ/tháng</p></div></div><div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs leading-relaxed text-slate-500">Khoản thiết bị và thuê bao tháng đầu đã thanh toán. Từ kỳ sau, gia đình chỉ gia hạn 100.000đ/tháng.</p><button type="button" onClick={() => setShowPaymentCheckout(true)} className="mt-4 w-full rounded-2xl bg-blue-700 px-5 py-3.5 font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-800 sm:w-auto">{pendingPayment ? 'Tiếp tục thanh toán' : 'Gia hạn tháng'}</button></div></article>
            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5"><div><h3 className="font-bold">Lịch sử thanh toán</h3><p className="mt-1 text-xs text-slate-500">Các giao dịch gần đây.</p></div><span className="material-symbols-rounded text-blue-700" aria-hidden="true">receipt_long</span></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3 text-left">Nội dung</th><th className="p-3 text-left">Số tiền</th><th className="p-3 text-left">Kỳ</th><th className="p-3 text-left">Trạng thái</th></tr></thead><tbody>{paymentRows.map(row => { const paid = row.status === 'paid'; const isInitial = Number(row.amount) === Number(pricing.first_payment_total); return <tr key={row.id} className="border-t border-slate-100"><td className="p-3 font-medium">{row.service_name}</td><td className="p-3 font-bold">{Number(row.amount).toLocaleString('vi-VN')} {row.currency || 'VND'}</td><td className="p-3">{isInitial ? 'Lần đầu' : `Ngày ${pricing.renewal_day} hằng tháng`}</td><td className="p-3"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${paid ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{paid ? '✓ Đã thanh toán' : '● Chờ thanh toán'}</span></td></tr>; })}</tbody></table></div></div>
          </section>}
          {tab === 'status' && (() => {
            const newestMeasurement = latest || agentStatus?.latest_measurement;
            const measurementTime = newestMeasurement?.timestamp ? new Date(newestMeasurement.timestamp) : null;
            const measurementAgeMinutes = measurementTime && Number.isFinite(measurementTime.getTime()) ? Math.max(0, Math.floor((Date.now() - measurementTime.getTime()) / 60000)) : null;
            const measurementFreshness = measurementAgeMinutes === null ? 'Chưa có số đo' : measurementAgeMinutes <= 30 ? 'Đã có số đo gần đây' : 'Số đo gần nhất đã nhận';
            const measurementFreshnessDetail = measurementAgeMinutes === null ? 'Chờ máy đo gửi bản ghi đầu tiên.' : `${measurementAgeMinutes < 60 ? `${measurementAgeMinutes} phút` : `${Math.floor(measurementAgeMinutes / 60)} giờ`} kể từ thời điểm đo.`;
            const pairedCount = connectivity?.paired_devices?.length || 0;
            const deviceStatus = pairedCount ? `${pairedCount} thiết bị trong hồ sơ` : 'Chưa thêm thiết bị';
            return <section id="family-section-status" className="scroll-mt-24">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-blue-700">THEO DÕI HỆ THỐNG</p><h2 className="mt-1 text-2xl font-extrabold">Trạng thái thiết bị & dữ liệu</h2><p className="mt-1 max-w-2xl text-sm text-slate-600">Kiểm tra kết nối, thời điểm đo gần nhất và yêu cầu đồng bộ bù số đo theo lịch.</p></div><span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${apiAvailable ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}><span className={`h-2 w-2 rounded-full ${apiAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />{apiAvailable ? 'Máy chủ đã kết nối' : 'Máy chủ chưa kết nối'}</span></div>
              <div className="grid gap-3 sm:grid-cols-3">
                <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Kết nối máy chủ</p><p className={`mt-2 text-lg font-extrabold ${apiAvailable ? 'text-emerald-700' : 'text-rose-700'}`}>{apiAvailable ? 'Máy chủ đã phản hồi' : 'Đang gián đoạn'}</p><p className="mt-1 text-xs text-slate-500">{statusUpdatedAt ? `Kiểm tra lúc ${statusUpdatedAt.toLocaleTimeString('vi-VN')}` : 'Đang kiểm tra kết nối…'}</p></article>
                <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Thiết bị trong hồ sơ</p><p className="mt-2 text-lg font-extrabold text-slate-800">{deviceStatus}</p><p className="mt-1 text-xs text-slate-500">Lần truyền dữ liệu gần nhất sẽ được hiển thị tại mục Sức khỏe.</p></article>
                <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Số đo gần nhất</p><p className={`mt-2 text-lg font-extrabold ${measurementAgeMinutes === null || measurementAgeMinutes > 30 ? 'text-amber-700' : 'text-emerald-700'}`}>{measurementFreshness}</p><p className="mt-1 text-xs text-slate-500">{measurementTime ? `${newestMeasurement.systolic}/${newestMeasurement.diastolic} mmHg · ${measurementFreshnessDetail}` : measurementFreshnessDetail}</p></article>
              </div>
              <article className="mt-4 rounded-3xl border border-[#e9dfcf] bg-[#fffaf2] p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#17428f] text-white"><span className="material-symbols-rounded" aria-hidden="true">monitor_heart</span></span><div><h3 className="font-extrabold text-slate-900">Đồng bộ lại số đo từ Myka</h3><p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">Dùng khi chưa thấy số đo của khung 09:00 hoặc 19:00. Chỉ bổ sung khung đã đến giờ còn thiếu; số đo đã có sẽ không được ghi thêm.</p></div></div><button type="button" onClick={recoverScheduledMeasurements} disabled={measurementSyncBusy} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#17428f] px-5 py-3 font-bold text-white shadow-md transition hover:bg-[#103673] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-55"><span className={`material-symbols-rounded ${measurementSyncBusy ? 'animate-spin' : ''}`} aria-hidden="true">{measurementSyncBusy ? 'progress_activity' : 'sync'}</span>{measurementSyncBusy ? 'Đang đồng bộ…' : 'Kiểm tra & đồng bộ'}</button></div>
                {measurementSyncMessage && <p role="status" aria-live="polite" className={`mt-4 rounded-2xl border p-3 text-sm font-medium ${measurementSyncTone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : measurementSyncTone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>{measurementSyncMessage}</p>}
                {!apiAvailable && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Chưa xác nhận được kết nối máy chủ. Bạn có thể bấm kiểm tra lại; nếu chưa kết nối được thì số đo không được thêm.</p>}
                <p className="mt-3 text-xs leading-relaxed text-slate-500">Bản minh họa dùng cùng nguồn số đo mô phỏng với lịch tự động, chưa lấy trực tiếp từ robot thật. Nút không yêu cầu đo lại; nếu Myka chưa có kết quả đo thì không thể đồng bộ thay thế.</p>
              </article>
            </section>;
          })()}
          {tab === 'conversations' && <section id="family-section-conversations" className="scroll-mt-24">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5"><div><p className="text-sm text-blue-700 font-semibold">THEO DÕI GIA ĐÌNH</p><h2 className="text-xl font-bold mt-1">Nhật ký trò chuyện với Myka</h2><p className="text-sm text-slate-500 mt-1">Hồ sơ Bà Hoa · Cách xưng hô trong hội thoại: Ngoại – con. Nhật ký chỉ đọc hoặc hỏi lại Myka qua Chat Group Telegram.</p></div><div className="flex flex-wrap items-center gap-2"><a href={telegramLinks.group_chat_url || defaultTgUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700"><span className="material-symbols-rounded text-base" aria-hidden="true">send</span>Chat Group hỏi Myka ↗</a><span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${conversationData.source === 'telegram' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'}`}>{conversationData.source === 'telegram' ? 'Telegram' : conversationData.source === 'guide_demo' ? 'Nhật ký mẫu' : 'Nhật ký Myka'}</span></div></div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex flex-wrap items-center justify-between gap-3"><div><label htmlFor="conversation-date" className="block text-sm font-semibold">Chọn ngày</label><p className="text-xs text-slate-500 mt-1">Mặc định là hôm nay</p></div><input id="conversation-date" type="date" value={conversationDate} onChange={event => setConversationDate(event.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            {conversationData.review_needed_count > 0 && <article className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4"><p className="font-semibold text-amber-900">Có {conversationData.review_needed_count} lời nhắn được đánh dấu để gia đình xem lại</p><p className="text-sm text-amber-800 mt-1">Nhãn này giúp gia đình lưu ý nội dung cần xem lại; đây không phải đánh giá hay chẩn đoán sức khỏe.</p></article>}
            <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="font-semibold">Nội dung trong ngày</h3>
                <span className="text-xs text-slate-500">{conversationData.messages.length} tin nhắn</span>
              </div>
              {conversationLoading ? <p className="py-10 text-center text-sm text-slate-500">Đang tải nhật ký…</p>
                : conversationError ? <p role="status" className="py-10 text-center text-sm text-rose-700">{conversationError}</p>
                  : conversationData.messages.length ? <ConversationHistory messages={conversationData.messages} />
                  : <p className="py-10 text-center text-sm text-slate-500">Chưa có hội thoại cho ngày này. Bạn có thể chọn ngày khác hoặc hỏi Myka qua Telegram.</p>}
            </div>
            <p className="text-xs text-slate-500 mt-3">Chọn ngày để xem lại các trao đổi đã ghi nhận.</p>
          </section>}
          {tab === 'settings' && <section id="family-section-settings" className="scroll-mt-24">
            <div className="mb-5"><p className="text-sm text-blue-700 font-semibold">TÙY CHỈNH CHO GIA ĐÌNH</p><h2 className="text-xl font-bold mt-1">Cài đặt Myka</h2><p className="text-sm text-slate-500 mt-1">Lựa chọn được lưu theo hồ sơ người thân.</p></div>
            <form onSubmit={savePreferences} className="space-y-5">
              <article id="family-settings-dnd" className="bg-white border border-slate-200 rounded-xl p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Chế độ Không làm phiền</h3><p className="text-sm text-slate-500 mt-1">Chọn khoảng thời gian tạm tắt thông báo trên ứng dụng.</p></div><span className={`text-xs font-semibold rounded-full px-3 py-1.5 ${preferences.dnd_mode === 'off' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{preferences.dnd_mode === 'off' ? 'Thông báo đang bật' : 'Không làm phiền đã chọn'}</span></div>
                <div className="flex flex-wrap gap-3 mt-4"><button type="button" onClick={() => { setPreferences({ ...preferences, dnd_mode: 'off', dnd_until: null }); setSettingsMessage(''); }} className={`rounded-xl border px-4 py-3 font-semibold ${preferences.dnd_mode === 'off' ? 'bg-blue-50 border-blue-400 text-blue-800' : 'border-slate-200'}`}>Bật thông báo lại</button><DndDurationPicker onSelect={(hours, minutes) => { const until = new Date(Date.now() + hours * 3600000 + minutes * 60000); setPreferences({ ...preferences, dnd_mode: 'custom', dnd_until: until.toISOString() }); setSettingsMessage(''); }} /><button type="button" onClick={() => { setPreferences({ ...preferences, dnd_mode: 'until_off', dnd_until: null }); setSettingsMessage(''); }} className={`rounded-xl border px-4 py-3 font-semibold ${preferences.dnd_mode === 'until_off' ? 'bg-amber-50 border-amber-400 text-amber-900' : 'border-slate-200'}`}>Đến khi tôi bật lại</button></div>
                {preferences.dnd_mode === 'custom' && preferences.dnd_until && <p className="text-sm text-amber-800 mt-3">Tự bật lại lúc {new Date(preferences.dnd_until).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}.</p>}
                <p className="text-xs text-slate-500 mt-4">Hiện app chưa gửi thông báo đẩy; lựa chọn này được lưu để dùng khi tích hợp thông báo. Khi đó, chế độ này sẽ tắt âm thanh và rung theo cấu hình ứng dụng.</p>
              </article>

              <article className="rounded-xl border border-blue-100 bg-[#fffaf2] p-4 md:p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-semibold text-slate-900">Lịch cập nhật số đo</h3><p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">Mô phỏng robot gửi huyết áp và nhịp tim lúc 09:00 và 19:00 mỗi ngày lên máy chủ. Số đo được lưu vào lịch sử kể cả khi người thân không mở app.</p></div><label className="inline-flex cursor-pointer items-center gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3 font-semibold text-blue-900"><input type="checkbox" checked={Boolean(preferences.bp_demo_schedule_enabled)} onChange={event => { setPreferences({ ...preferences, bp_demo_schedule_enabled: event.target.checked }); setSettingsMessage(''); }} className="h-5 w-5 accent-blue-700" />{preferences.bp_demo_schedule_enabled ? 'Đang bật' : 'Đang tắt'}</label></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="rounded-xl border border-[#e9dfcf] bg-white p-3 text-sm"><span className="block font-semibold text-slate-700">Buổi sáng · giờ Việt Nam</span><input type="time" value={preferences.bp_demo_morning_time || '09:00'} readOnly className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-800" /></label><label className="rounded-xl border border-[#e9dfcf] bg-white p-3 text-sm"><span className="block font-semibold text-slate-700">Buổi tối · giờ Việt Nam</span><input type="time" value={preferences.bp_demo_evening_time || '19:00'} readOnly className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-800" /></label></div><p className="mt-3 text-xs leading-relaxed text-slate-500">Mỗi khung giờ chỉ lưu một số đo. Lịch sử hiển thị giờ hệ thống nhận được số đo. Nếu chưa thấy số đo sau giờ hẹn, chọn Kiểm tra & đồng bộ trong mục Trạng thái. App đang mở tự cập nhật mỗi 30 giây. Đây là dữ liệu mô phỏng, chưa kết nối robot thật. Bật lịch rồi chọn Lưu cài đặt để áp dụng.</p></article>

              <article className="bg-white border border-slate-200 rounded-xl p-4 md:p-5"><h3 className="font-semibold">Tùy chỉnh giọng nói</h3><p className="text-sm text-slate-500 mt-1">Chọn phong cách giọng mà người cao tuổi cảm thấy dễ nghe.</p><div className="grid sm:grid-cols-2 gap-3 mt-4">{voiceOptions.map(voice => <label key={voice.id} className={`cursor-pointer rounded-xl border p-4 transition ${preferences.voice_profile === voice.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-300' : 'border-slate-200 hover:border-blue-300'}`}><span className="flex items-center gap-3"><input type="radio" name="voice_profile" value={voice.id} checked={preferences.voice_profile === voice.id} onChange={() => { setPreferences({ ...preferences, voice_profile: voice.id }); setSettingsMessage(''); }} className="accent-blue-600" /><span><span className="block font-semibold">{voice.label}</span><span className="block text-sm text-slate-500">Giọng {voice.detail.toLowerCase()}</span></span></span></label>)}</div><p className="text-xs text-slate-500 mt-4">Cài đặt giọng sẽ được lưu trong hồ sơ; hiện chưa đổi giọng phát ra từ robot vì chưa kết nối phần cứng.</p></article>

              <article className="bg-white border border-slate-200 rounded-xl p-4 md:p-5"><h3 className="font-semibold">Đổi tên robot</h3><p className="text-sm text-slate-500 mt-1">Không bắt buộc. Để trống nếu muốn tiếp tục dùng tên Myka.</p><label className="block text-sm font-medium mt-4" htmlFor="robot-name">Tên robot hiển thị</label><input id="robot-name" maxLength="40" value={preferences.robot_name || ''} onChange={event => { setPreferences({ ...preferences, robot_name: event.target.value }); setSettingsMessage(''); }} placeholder="Myka" className="mt-1 w-full sm:max-w-md border border-slate-300 rounded-lg px-3 py-2 text-sm" /><p className="text-xs text-slate-500 mt-2">Tên hiện tại: {preferences.robot_name?.trim() || 'Myka'}. Tên này chưa được đồng bộ tới phần cứng.</p></article>

              <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={!apiAvailable || settingsSaving} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">{settingsSaving ? 'Đang lưu…' : 'Lưu cài đặt'}</button>{settingsMessage && <p role="status" className="text-sm text-blue-700">{settingsMessage}</p>}</div>
            </form>
          </section>}
          <footer className="text-xs text-slate-400 mt-8 text-center pb-6 border-t border-slate-200/60 pt-4">
            <p className="font-medium text-slate-500">Đề tài: Phân tích nghiệp vụ ứng dụng hỗ trợ người thân trong hệ thống AI Care Companion</p>
            <p className="mt-1 text-[11px] text-slate-400">Báo cáo thực tập chuyên ngành Khoa học Dữ liệu & Phân tích Kinh doanh (DSBA) · SV: Nguyễn Phạm Kiều Duyên (48K29.1)</p>
          </footer>
        </main>
          {showScheduleEditor && <ScheduleEditor initialSchedule={editingSchedule} onClose={() => { setShowScheduleEditor(false); setEditingSchedule(null); }} onSave={saveSchedule} />}
        {showPaymentCheckout && <PaymentCheckout amount={pendingPayment?.amount || pricing.monthly_fee} purpose={checkoutPurpose} cycleLabel={initialPaymentPending ? 'Thanh toán lần đầu' : (pendingPayment ? 'Hóa đơn chờ thanh toán' : `${pricing.next_renewal_date} · 1 tháng`)} onClose={() => setShowPaymentCheckout(false)} />}
      </div>
    );
  }
  window.FamilyDashboard = FamilyDashboard;
})();
