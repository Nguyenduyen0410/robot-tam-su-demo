import { getReadOnlyBpm, getReadOnlyChat } from '../lib/third-party-myka.js';

const corsHeaders = (request) => {
  const origin = request.headers.get('Origin') || '';
  const allowed = new Set([
    'https://myka-care-companion.pages.dev',
    'http://localhost:8765',
    'http://127.0.0.1:8765',
  ]);
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
  if (allowed.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
};

const json = (request, data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(request) },
});

const nowIso = () => new Date().toISOString();
const newId = (prefix) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
let familyPreferencesSchemaReady = false;
let elderProfilesSchemaReady = false;
let conversationLogsSchemaReady = false;

async function ensureBackendDemoData(db, elderId) {
  if (elderId !== 'E001') return;
  const imported = await db.prepare("SELECT id FROM blood_pressure WHERE elder_id = ? AND id = 'BP-001'").bind(elderId).first();
  if (imported) return;

  // Port the synthetic FastAPI/SQLite examples into D1. Never copy its Wi-Fi password or private IP.
  const utcNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const dateOffset = (daysAgo, time) => {
    const date = new Date(utcNow.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return new Date(`${date}T${time}+07:00`).toISOString();
  };
  const deviceList = JSON.stringify([
    { id: 'DEV-BLE-01', name: 'Robot Myka Companion (mô phỏng)', type: 'robot', status: 'mô phỏng', signal: -52 },
    { id: 'DEV-BLE-02', name: 'Máy đo huyết áp BLE (mô phỏng)', type: 'sphygmomanometer', status: 'mô phỏng', signal: -64 },
  ]);
  await db.batch([
    db.prepare("DELETE FROM blood_pressure WHERE elder_id = ? AND id LIKE 'DEMO-%'").bind(elderId),
    ...[
      ['BP-001', 128, 78, 72, 'normal', 'Đo huyết áp buổi sáng sau ăn', dateOffset(5, '09:05:00')],
      ['BP-002', 130, 80, 75, 'normal', 'Đo huyết áp buổi chiều', dateOffset(5, '14:15:00')],
      ['BP-003', 126, 76, 70, 'normal', 'Đo định kỳ buổi sáng', dateOffset(4, '09:00:00')],
      ['BP-004', 128, 79, 74, 'normal', 'Đo định kỳ buổi chiều', dateOffset(4, '14:00:00')],
      ['BP-005', 145, 90, 88, 'critical', 'Tình huống mô phỏng có chỉ số vượt ngưỡng', dateOffset(3, '09:10:00')],
      ['BP-006', 128, 78, 72, 'normal', 'Phép đo mô phỏng tiếp theo', dateOffset(3, '14:30:00')],
      ['BP-007', 125, 75, 71, 'normal', 'Đo huyết áp buổi sáng', dateOffset(2, '09:00:00')],
    ].map(([id, sys, dia, pulse, status, note, timestamp]) => db.prepare(`INSERT OR IGNORE INTO blood_pressure
      (id, elder_id, systolic, diastolic, heart_rate, status, note, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, elderId, sys, dia, pulse, status, note, timestamp)),
    db.prepare("DELETE FROM care_schedule WHERE elder_id = ? AND id LIKE 'SCH-DEMO-%'").bind(elderId),
    ...[
      ['SCH-001', 'medication', 'Uống thuốc huyết áp', 'Lịch dùng thuốc minh họa; đối chiếu với đơn thuốc thực tế.', dateOffset(0, '08:00:00'), 1],
      ['SCH-002', 'medication', 'Uống thuốc buổi trưa', 'Lịch chăm sóc minh họa; không thay thế hướng dẫn của nhân viên y tế.', dateOffset(0, '12:00:00'), 0],
      ['SCH-003', 'checkup', 'Lịch tái khám', 'Lịch hẹn minh họa.', dateOffset(-5, '09:00:00'), 0],
    ].map(([id, type, title, detail, scheduledAt, confirmed]) => db.prepare(`INSERT OR REPLACE INTO care_schedule
      (id, elder_id, type, title, detail, scheduled_at, confirmed) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, elderId, type, title, detail, scheduledAt, confirmed)),
    db.prepare("DELETE FROM maintenance_notifications WHERE elder_id = ? AND id LIKE 'MNT-DEMO-%'").bind(elderId),
    db.prepare(`INSERT OR REPLACE INTO maintenance_notifications
      (id, elder_id, title, detail, status, due_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind('MNT-001', elderId, 'Kiểm tra máy đo huyết áp', 'Nhắc bảo trì thiết bị minh họa.', 'pending', dateOffset(-7, '00:00:00').slice(0, 10), nowIso()),
    db.prepare(`INSERT INTO device_connectivity
      (elder_id, wifi_ssid, wifi_ip, wifi_signal, wifi_frequency, wifi_status, bluetooth_status, paired_devices, last_updated)
      VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(elder_id) DO UPDATE SET
      wifi_ssid = CASE WHEN device_connectivity.wifi_ssid IS NULL OR device_connectivity.wifi_ssid = 'Wi-Fi minh họa' THEN excluded.wifi_ssid ELSE device_connectivity.wifi_ssid END,
      wifi_ip = NULL,
      wifi_signal = CASE WHEN device_connectivity.wifi_signal = 0 THEN excluded.wifi_signal ELSE device_connectivity.wifi_signal END,
      wifi_frequency = COALESCE(device_connectivity.wifi_frequency, excluded.wifi_frequency),
      wifi_status = excluded.wifi_status, bluetooth_status = excluded.bluetooth_status,
      paired_devices = excluded.paired_devices, last_updated = excluded.last_updated`)
      .bind(elderId, 'Wi-Fi mô phỏng nhà Ngoại', 92, '2.4GHz', 'mô phỏng', 'mô phỏng', deviceList, nowIso()),
    db.prepare(`INSERT OR IGNORE INTO alerts
      (id, elder_id, type, title, detail, severity, status, responded_by, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)`)
      .bind('ALT-DEMO-01', elderId, 'bp_alert', 'Bản ghi mô phỏng có chỉ số vượt ngưỡng', 'Tình huống minh họa luồng Agent; không phải dữ liệu đo từ người thật.', 'warning', 'pending', dateOffset(3, '09:12:00')),
  ]);
}

async function latestFor(db, elderId) {
  return db.prepare('SELECT * FROM blood_pressure WHERE elder_id = ? ORDER BY timestamp DESC LIMIT 1').bind(elderId).first();
}

async function agentStatus(db, elderId) {
  const [measurement, alert] = await Promise.all([
    latestFor(db, elderId),
    db.prepare('SELECT * FROM alerts WHERE elder_id = ? ORDER BY timestamp DESC LIMIT 1').bind(elderId).first(),
  ]);
  const status = measurement?.status || 'unknown';
  const statusLabel = ({ normal: 'Trong ngưỡng theo dõi', warning: 'Cần người chăm sóc lưu ý', critical: 'Đã phát hiện chỉ số vượt ngưỡng' })[status] || 'Chưa có dữ liệu';
  return {
    agent_name: 'MYKA CARE AGENT · DEMO',
    service_status: measurement ? 'Đang hoạt động' : 'Đang chờ dữ liệu',
    data_source: 'Cloudflare Pages API / cơ sở dữ liệu D1',
    latest_measurement: measurement,
    latest_alert: alert,
    activities: [
      { title: 'Thu thập dữ liệu', detail: measurement ? `Đã nhận phép đo ${measurement.systolic}/${measurement.diastolic} mmHg, nhịp tim ${measurement.heart_rate} bpm lúc ${measurement.timestamp}.` : 'Chưa có phép đo được gửi từ thiết bị/API.' },
      { title: 'Đối chiếu quy tắc cấu hình', detail: statusLabel },
      { title: 'Lưu kết quả vào lịch sử', detail: 'Kết quả phép đo được ghi vào cơ sở dữ liệu để người thân xem lại.' },
      { title: 'Ghi nhận cảnh báo', detail: alert ? `Có cảnh báo gần nhất: ${alert.title} (${alert.status}).` : 'Không có cảnh báo đã ghi nhận gần đây.' },
    ],
  };
}

async function ensureFamilyPreferences(db, elderId) {
  if (!familyPreferencesSchemaReady) {
    await db.prepare(`CREATE TABLE IF NOT EXISTS family_preferences (
      elder_id TEXT PRIMARY KEY,
      dnd_mode TEXT NOT NULL DEFAULT 'off',
      dnd_until TEXT,
      voice_profile TEXT NOT NULL DEFAULT 'female_young_sweet',
      robot_name TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    )`).run();
    familyPreferencesSchemaReady = true;
  }
  await db.prepare(`INSERT OR IGNORE INTO family_preferences (elder_id, dnd_mode, dnd_until, voice_profile, robot_name, updated_at)
    VALUES (?, 'off', NULL, 'female_young_sweet', '', ?)`).bind(elderId, nowIso()).run();
}

async function ensureElderProfiles(db, elderId) {
  if (!elderProfilesSchemaReady) {
    await db.prepare(`CREATE TABLE IF NOT EXISTS elder_profiles (
      elder_id TEXT PRIMARY KEY,
      age INTEGER,
      address TEXT NOT NULL DEFAULT '',
      health_notes TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    )`).run();
    elderProfilesSchemaReady = true;
  }
  if (elderId === 'E001') {
    await db.prepare(`INSERT OR IGNORE INTO elder_profiles (elder_id, age, address, health_notes, updated_at)
      VALUES ('E001', 72, '12 Đường Hoa Mai, Phường Hòa Xuân, Đà Nẵng (địa chỉ giả)',
      'Tăng huyết áp (tình trạng minh họa)', ?)`).bind(nowIso()).run();
  }
}

async function ensureConversationLogs(db, elderId) {
  if (!conversationLogsSchemaReady) {
    await db.prepare(`CREATE TABLE IF NOT EXISTS conversation_logs (
      id TEXT PRIMARY KEY,
      elder_id TEXT NOT NULL,
      speaker TEXT NOT NULL,
      message_text TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'demo',
      review_flag TEXT NOT NULL DEFAULT 'none'
    )`).run();
    conversationLogsSchemaReady = true;
  }
  if (elderId === 'E001') {
    const imported = await db.prepare('SELECT id FROM conversation_logs WHERE id = ? AND elder_id = ?').bind('TGC-001', elderId).first();
    if (!imported) {
      const localDate = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const at = time => new Date(`${localDate}T${time}+07:00`).toISOString();
      const samples = [
        ['TGC-001', 'elder', 'Myka ơi, hôm nay thời tiết thế nào con?', '08:00:00', 'none'],
        ['TGC-002', 'myka', 'Dạ, hôm nay trời mát mẻ ạ. Ngoại muốn con trò chuyện thêm điều gì không?', '08:00:15', 'none'],
        ['TGC-003', 'elder', 'Trưa nay con Duyên có ghé ăn cơm với Ngoại không?', '09:30:00', 'none'],
        ['TGC-004', 'myka', 'Dạ, đây là đoạn hội thoại minh họa trong dữ liệu backend demo ạ.', '09:30:20', 'none'],
        ['TGC-005', 'elder', 'Hôm nay Ngoại hơi mệt trong người, chóng mặt nhẹ...', '10:15:00', 'family_followup'],
        ['TGC-006', 'myka', 'Dạ, con nghe Ngoại chia sẻ. Con ghi nhận lời nhắn này để gia đình xem lại ạ.', '10:15:25', 'none'],
        ['TGC-007', 'elder', 'Con kể chuyện vui ngày xưa cho Ngoại nghe đỡ buồn đi Myka.', '15:30:00', 'none'],
        ['TGC-008', 'myka', 'Dạ, con kể Ngoại nghe một câu chuyện vui nhé…', '15:30:30', 'none'],
      ];
      await db.batch([
        db.prepare("DELETE FROM conversation_logs WHERE elder_id = ? AND source = 'demo' AND id LIKE 'CHAT-DEMO-%'").bind(elderId),
        ...samples.map(([id, speaker, message, time, flag]) => db.prepare(`INSERT OR IGNORE INTO conversation_logs
          (id, elder_id, speaker, message_text, timestamp, source, review_flag) VALUES (?, ?, ?, ?, ?, 'demo', ?)`)
          .bind(id, elderId, speaker, message, at(time), flag)),
      ]);
    }
  }
}

export async function onRequest({ request, env, params }) {
  const headers = corsHeaders(request);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!env.MYKA_DB) return json(request, { error: 'Thiếu binding cơ sở dữ liệu MYKA_DB trong Cloudflare Pages.' }, 503);

  const rawPath = Array.isArray(params.path) ? params.path : [params.path || ''];
  const parts = rawPath.flatMap(segment => String(segment).split('/')).filter(Boolean).map(decodeURIComponent);
  const [area, section, resource, extra] = parts;
  const db = env.MYKA_DB;
  const elderId = resource;

  try {
    if (request.method === 'GET' && parts.join('/') === 'health') {
      return json(request, { status: 'ok', timestamp: nowIso(), database: 'connected' });
    }

    if (request.method === 'GET' && area === 'family' && section === 'health-summary' && elderId) {
      if (elderId !== 'E001') return json(request, { error: 'Bản mẫu API guide hiện chỉ được gán cho hồ sơ E001 (Bà Hoa).' }, 404);
      const days = Math.min(30, Math.max(7, Number(new URL(request.url).searchParams.get('days') || 7)));
      const { rows: results, source } = await getReadOnlyBpm(env, days);
      if (!results.length) return json(request, { elder_id: elderId, summary: null, daily_readings: [], data_source: source, demo: source !== 'third_party_api' });
      const latest = results[0];
      const avg = (key) => Math.round(results.reduce((sum, row) => sum + Number(row[key] || 0), 0) / results.length * 10) / 10;
      const status = Number(latest.systolic) >= 140 || Number(latest.diastolic) >= 90 ? 'critical' : Number(latest.systolic) >= 130 || Number(latest.diastolic) >= 85 ? 'warning' : 'normal';
      return json(request, {
        elder_id: elderId, period_days: days, elder_name: 'Bà Nguyễn Thị Hoa', data_source: source, demo: source !== 'third_party_api',
        latest_reading: latest,
        statistics: { total_measurements: results.length, avg_systolic: avg('systolic'), avg_diastolic: avg('diastolic'), avg_heart_rate: avg('heart_rate'), overall_status: status, overall_label: status === 'normal' ? 'Trong ngưỡng theo dõi' : status === 'warning' ? 'Cần người chăm sóc lưu ý' : 'Đã phát hiện chỉ số vượt ngưỡng' },
        daily_readings: results,
      });
    }

    if (request.method === 'GET' && area === 'family' && section === 'elder-profile' && elderId) {
      await ensureElderProfiles(db, elderId);
      const profile = await db.prepare('SELECT elder_id, age, address, health_notes, updated_at FROM elder_profiles WHERE elder_id = ?').bind(elderId).first();
      if (!profile) return json(request, { elder_id: elderId, age: null, address: '', health_notes: '' });
      return json(request, profile);
    }

    if (request.method === 'GET' && area === 'family' && section === 'settings' && elderId) {
      await ensureFamilyPreferences(db, elderId);
      const settings = await db.prepare('SELECT dnd_mode, dnd_until, voice_profile, robot_name, updated_at FROM family_preferences WHERE elder_id = ?').bind(elderId).first();
      if (!settings) return json(request, { error: 'Chưa có cài đặt cho hồ sơ này.' }, 404);
      if (settings.dnd_until && Date.parse(settings.dnd_until) <= Date.now()) {
        await db.prepare("UPDATE family_preferences SET dnd_mode = 'off', dnd_until = NULL, updated_at = ? WHERE elder_id = ?").bind(nowIso(), elderId).run();
        settings.dnd_mode = 'off';
        settings.dnd_until = null;
        settings.updated_at = nowIso();
      }
      return json(request, { ...settings, dnd_enabled: settings.dnd_mode !== 'off' });
    }

    if (request.method === 'PUT' && area === 'family' && section === 'settings' && elderId) {
      await ensureFamilyPreferences(db, elderId);
      const body = await request.json();
      const allowedModes = new Set(['off', '2h', '5h', 'custom', 'until_off']);
      const allowedVoices = new Set(['male_young_warm', 'male_middle_steady', 'female_young_sweet', 'female_middle_calm']);
      const mode = String(body.dnd_mode || 'off');
      const voice = String(body.voice_profile || 'female_young_sweet');
      const robotName = String(body.robot_name || '').trim().slice(0, 40);
      if (!allowedModes.has(mode)) return json(request, { error: 'Lựa chọn Không làm phiền không hợp lệ.' }, 422);
      if (!allowedVoices.has(voice)) return json(request, { error: 'Lựa chọn giọng nói không hợp lệ.' }, 422);
      const requestedDndUntil = Date.parse(body.dnd_until || '');
      const dndUntil = mode === '2h' ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        : mode === '5h' ? new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
          : mode === 'custom' && Number.isFinite(requestedDndUntil) && requestedDndUntil > Date.now() && requestedDndUntil <= Date.now() + 24 * 60 * 60 * 1000 ? new Date(requestedDndUntil).toISOString() : null;
      if (mode === 'custom' && !dndUntil) return json(request, { error: 'Thời lượng Không làm phiền không hợp lệ.' }, 422);
      const updatedAt = nowIso();
      await db.prepare(`INSERT INTO family_preferences (elder_id, dnd_mode, dnd_until, voice_profile, robot_name, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(elder_id) DO UPDATE SET dnd_mode = excluded.dnd_mode, dnd_until = excluded.dnd_until,
        voice_profile = excluded.voice_profile, robot_name = excluded.robot_name, updated_at = excluded.updated_at`)
        .bind(elderId, mode, dndUntil, voice, robotName, updatedAt).run();
      return json(request, { success: true, dnd_mode: mode, dnd_until: dndUntil, dnd_enabled: mode !== 'off', voice_profile: voice, robot_name: robotName, updated_at: updatedAt });
    }

    if (request.method === 'GET' && area === 'family' && section === 'conversation-history' && elderId) {
      if (elderId !== 'E001') return json(request, { error: 'Bản mẫu API guide hiện chỉ được gán cho hồ sơ E001 (Bà Hoa).' }, 404);
      const requestedDate = new URL(request.url).searchParams.get('date') || new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) return json(request, { error: 'Ngày không hợp lệ.' }, 422);
      const { messages, source } = await getReadOnlyChat(env, requestedDate);
      return json(request, {
        elder_id: elderId, date: requestedDate,
        source: messages.length ? 'guide_demo' : 'none',
        demo: source !== 'third_party_api', review_needed_count: 0, messages,
      });
    }

    if (request.method === 'GET' && area === 'family' && section === 'schedules' && elderId) {
      await ensureBackendDemoData(db, elderId);
      const { results } = await db.prepare("SELECT * FROM care_schedule WHERE elder_id = ? AND scheduled_at >= datetime('now', '-30 days') ORDER BY scheduled_at ASC").bind(elderId).all();
      return json(request, results);
    }
    if (request.method === 'POST' && area === 'family' && section === 'schedules' && elderId) {
      const body = await request.json();
      const type = String(body.type || '');
      const title = String(body.title || '').trim().slice(0, 120);
      const detail = String(body.detail || '').trim().slice(0, 500);
      const scheduledAt = String(body.scheduled_at || '');
      if (!['medication', 'checkup'].includes(type) || !title || !Number.isFinite(Date.parse(scheduledAt))) {
        return json(request, { error: 'Loại lịch, tên lịch hoặc thời điểm không hợp lệ.' }, 422);
      }
      const id = newId('SCH');
      await db.prepare('INSERT INTO care_schedule (id, elder_id, type, title, detail, scheduled_at, confirmed) VALUES (?, ?, ?, ?, ?, ?, 0)')
        .bind(id, elderId, type, title, detail, scheduledAt).run();
      return json(request, { id, elder_id: elderId, type, title, detail, scheduled_at: scheduledAt, confirmed: 0 }, 201);
    }
    if (request.method === 'GET' && area === 'family' && section === 'maintenance-notifications' && elderId) {
      await ensureBackendDemoData(db, elderId);
      const { results } = await db.prepare('SELECT * FROM maintenance_notifications WHERE elder_id = ? ORDER BY COALESCE(due_at, created_at) ASC').bind(elderId).all();
      return json(request, results);
    }
    if (request.method === 'GET' && area === 'family' && section === 'subscription' && elderId) {
      const { results } = await db.prepare('SELECT * FROM service_payments WHERE elder_id = ? ORDER BY period_start DESC').bind(elderId).all();
      const nowLocal = new Date(Date.now() + 7 * 60 * 60 * 1000);
      const today = nowLocal.toISOString().slice(0, 10);
      const nextRenewal = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
      const monthEnd = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
      const payments = results.filter(row => row.status !== 'demo');
      const displayPayments = payments.length ? payments : [{
        id: `PAY-INITIAL-${elderId}`, elder_id: elderId,
        service_name: 'Thiết bị Myka (mua đứt) + thuê bao tháng đầu',
        amount: 2100000, currency: 'VND', status: 'pending',
        period_start: today, period_end: monthEnd, due_at: today, paid_at: null,
      }];
      const current = payments.find(row => row.status === 'paid' && row.period_start <= today && row.period_end >= today) || null;
      return json(request, {
        elder_id: elderId,
        current_plan: current,
        payments: displayPayments,
        pricing: {
          device_price: 2000000,
          monthly_fee: 100000,
          first_payment_total: 2100000,
          renewal_day: 1,
          next_renewal_date: nextRenewal,
          auto_renew: true,
        },
      });
    }
    if (request.method === 'GET' && area === 'family' && section === 'alerts' && elderId) {
      await ensureBackendDemoData(db, elderId);
      const { results } = await db.prepare('SELECT * FROM alerts WHERE elder_id = ? ORDER BY timestamp DESC').bind(elderId).all();
      return json(request, results);
    }
    if (request.method === 'GET' && area === 'family' && section === 'agent-status' && elderId) {
      await ensureBackendDemoData(db, elderId);
      return json(request, await agentStatus(db, elderId));
    }
    if (request.method === 'GET' && area === 'family' && section === 'telegram-consultation' && elderId) {
      const row = await db.prepare('SELECT group_name, members_summary, is_active, group_chat_url FROM telegram_consultation WHERE elder_id = ?').bind(elderId).first();
      return row ? json(request, row) : json(request, { error: 'Chưa cấu hình nhóm Telegram.' }, 404);
    }
    if (request.method === 'GET' && area === 'device' && section === 'connectivity' && elderId) {
      await ensureBackendDemoData(db, elderId);
      const row = await db.prepare('SELECT elder_id, wifi_ssid, wifi_ip, wifi_signal, wifi_frequency, wifi_status, bluetooth_status, paired_devices, last_updated FROM device_connectivity WHERE elder_id = ?').bind(elderId).first();
      if (!row) return json(request, { error: 'Chưa cấu hình thiết bị.' }, 404);
      return json(request, { ...row, paired_devices: JSON.parse(row.paired_devices || '[]') });
    }
    if (area === 'device' && section === 'wifi' && elderId && request.method === 'PUT') {
      const body = await request.json();
      const ssid = String(body.ssid || '').trim().slice(0, 80);
      if (!ssid) return json(request, { error: 'Tên mạng Wi-Fi không được để trống.' }, 422);
      // This demo records only the network name; never persist the submitted password.
      await db.prepare(`UPDATE device_connectivity SET wifi_ssid = ?, wifi_status = 'demo', last_updated = ? WHERE elder_id = ?`)
        .bind(ssid, nowIso(), elderId).run();
      return json(request, { success: true, demo: true });
    }
    if (area === 'device' && section === 'wifi' && elderId && request.method === 'DELETE') {
      await db.prepare(`UPDATE device_connectivity SET wifi_ssid = NULL, wifi_ip = NULL, wifi_signal = 0, wifi_status = 'demo', last_updated = ? WHERE elder_id = ?`)
        .bind(nowIso(), elderId).run();
      return json(request, { success: true, demo: true });
    }
    if (area === 'device' && section === 'bluetooth' && resource === 'pair' && extra && request.method === 'POST') {
      const body = await request.json();
      const deviceName = String(body.device_name || '').trim().slice(0, 80);
      if (!deviceName) return json(request, { error: 'Tên thiết bị không được để trống.' }, 422);
      const row = await db.prepare('SELECT paired_devices FROM device_connectivity WHERE elder_id = ?').bind(extra).first();
      if (!row) return json(request, { error: 'Chưa cấu hình thiết bị.' }, 404);
      const devices = JSON.parse(row.paired_devices || '[]');
      const device = { id: newId('BT'), name: deviceName, type: String(body.device_type || 'device').slice(0, 40), status: 'demo' };
      devices.push(device);
      await db.prepare(`UPDATE device_connectivity SET paired_devices = ?, bluetooth_status = 'demo', last_updated = ? WHERE elder_id = ?`)
        .bind(JSON.stringify(devices), nowIso(), extra).run();
      return json(request, { success: true, demo: true, device }, 201);
    }
    if (area === 'device' && section === 'bluetooth' && resource && extra && request.method === 'DELETE') {
      const row = await db.prepare('SELECT paired_devices FROM device_connectivity WHERE elder_id = ?').bind(resource).first();
      if (!row) return json(request, { error: 'Chưa cấu hình thiết bị.' }, 404);
      const devices = JSON.parse(row.paired_devices || '[]').filter(device => device.id !== extra);
      await db.prepare(`UPDATE device_connectivity SET paired_devices = ?, bluetooth_status = 'demo', last_updated = ? WHERE elder_id = ?`)
        .bind(JSON.stringify(devices), nowIso(), resource).run();
      return json(request, { success: true, demo: true });
    }
    if (request.method === 'GET' && area === 'family' && section === 'bp-history' && elderId) {
      const limit = Math.min(100, Math.max(1, Number(new URL(request.url).searchParams.get('limit') || 30)));
      const { results } = await db.prepare('SELECT * FROM blood_pressure WHERE elder_id = ? ORDER BY timestamp DESC LIMIT ?').bind(elderId, limit).all();
      return json(request, results);
    }

    if (request.method === 'POST' && area === 'device' && section === 'bp-record' && elderId) {
      const origin = request.headers.get('Origin') || '';
      if (!['https://myka-care-companion.pages.dev', 'http://localhost:8765', 'http://127.0.0.1:8765'].includes(origin)) return json(request, { error: 'Nguồn gửi không được phép.' }, 403);
      const body = await request.json();
      const systolic = Number(body.systolic), diastolic = Number(body.diastolic), heartRate = Number(body.heart_rate);
      if (!Number.isInteger(systolic) || systolic < 60 || systolic > 240 || !Number.isInteger(diastolic) || diastolic < 40 || diastolic > 140 || !Number.isInteger(heartRate) || heartRate < 40 || heartRate > 200) return json(request, { error: 'Chỉ số không hợp lệ.' }, 422);
      const status = systolic >= 140 || diastolic >= 90 ? 'critical' : systolic >= 130 || diastolic >= 85 ? 'warning' : 'normal';
      const id = newId('BP'), timestamp = nowIso();
      await db.prepare('INSERT INTO blood_pressure (id, elder_id, systolic, diastolic, heart_rate, status, note, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, elderId, systolic, diastolic, heartRate, status, String(body.note || 'Đo thử qua API thiết bị').slice(0, 300), timestamp).run();
      if (status === 'critical') await db.prepare('INSERT INTO alerts (id, elder_id, type, title, detail, severity, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(newId('ALT'), elderId, 'bp_critical', 'Đã ghi nhận chỉ số vượt ngưỡng cấu hình', `Đo được ${systolic}/${diastolic} mmHg, nhịp tim ${heartRate} bpm. Cần người chăm sóc xem lại.`, 'critical', 'pending', timestamp).run();
      return json(request, { success: true, id, status, agent: await agentStatus(db, elderId) }, 201);
    }

    return json(request, { error: 'Không tìm thấy API.' }, 404);
  } catch (error) {
    return json(request, { error: 'Lỗi xử lý API.', detail: error instanceof Error ? error.message : String(error) }, 500);
  }
}
