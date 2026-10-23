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
let conversationLogsSchemaReady = false;

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
    const count = await db.prepare('SELECT COUNT(*) AS total FROM conversation_logs WHERE elder_id = ?').bind(elderId).first();
    if (!Number(count?.total || 0)) {
      const localDate = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const at = time => new Date(`${localDate}T${time}:00+07:00`).toISOString();
      const samples = [
        ['CHAT-DEMO-01', 'elder', 'Myka ơi, hôm nay con thấy hơi mệt. Con ghi lời nhắn để Duyên gọi hỏi thăm mẹ nhé.', at('08:20'), 'family_followup'],
        ['CHAT-DEMO-02', 'myka', 'Dạ, Myka đã ghi nhận lời nhắn để người thân xem lại trong ứng dụng.', at('08:21'), 'none'],
        ['CHAT-DEMO-03', 'elder', 'Chiều nay thời tiết thế nào Myka?', at('15:10'), 'none'],
        ['CHAT-DEMO-04', 'myka', 'Dạ, đây là một cuộc trò chuyện minh họa trong bản demo Myka.', at('15:11'), 'none'],
      ];
      await db.batch(samples.map(([id, speaker, message, timestamp, flag]) => db.prepare(`INSERT OR IGNORE INTO conversation_logs (id, elder_id, speaker, message_text, timestamp, source, review_flag)
        VALUES (?, ?, ?, ?, ?, 'demo', ?)`).bind(id, elderId, speaker, message, timestamp, flag)));
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
      const days = Math.min(30, Math.max(7, Number(new URL(request.url).searchParams.get('days') || 7)));
      const { results } = await db.prepare(`SELECT * FROM blood_pressure WHERE elder_id = ? AND timestamp >= datetime('now', ?) ORDER BY timestamp DESC`).bind(elderId, `-${days} days`).all();
      if (!results.length) return json(request, { elder_id: elderId, summary: null, daily_readings: [] });
      const latest = results[0];
      const avg = (key) => Math.round(results.reduce((sum, row) => sum + Number(row[key] || 0), 0) / results.length * 10) / 10;
      const status = Number(latest.systolic) >= 140 || Number(latest.diastolic) >= 90 ? 'critical' : Number(latest.systolic) >= 130 || Number(latest.diastolic) >= 85 ? 'warning' : 'normal';
      return json(request, {
        elder_id: elderId, period_days: days, elder_name: 'Người thân demo',
        latest_reading: latest,
        statistics: { total_measurements: results.length, avg_systolic: avg('systolic'), avg_diastolic: avg('diastolic'), avg_heart_rate: avg('heart_rate'), overall_status: status, overall_label: status === 'normal' ? 'Trong ngưỡng theo dõi' : status === 'warning' ? 'Cần người chăm sóc lưu ý' : 'Đã phát hiện chỉ số vượt ngưỡng' },
        daily_readings: results,
      });
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
      const allowedModes = new Set(['off', '2h', '5h', 'until_off']);
      const allowedVoices = new Set(['male_young_warm', 'male_middle_steady', 'female_young_sweet', 'female_middle_calm']);
      const mode = String(body.dnd_mode || 'off');
      const voice = String(body.voice_profile || 'female_young_sweet');
      const robotName = String(body.robot_name || '').trim().slice(0, 40);
      if (!allowedModes.has(mode)) return json(request, { error: 'Lựa chọn Không làm phiền không hợp lệ.' }, 422);
      if (!allowedVoices.has(voice)) return json(request, { error: 'Lựa chọn giọng nói không hợp lệ.' }, 422);
      const dndUntil = mode === '2h' ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        : mode === '5h' ? new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString() : null;
      const updatedAt = nowIso();
      await db.prepare(`INSERT INTO family_preferences (elder_id, dnd_mode, dnd_until, voice_profile, robot_name, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(elder_id) DO UPDATE SET dnd_mode = excluded.dnd_mode, dnd_until = excluded.dnd_until,
        voice_profile = excluded.voice_profile, robot_name = excluded.robot_name, updated_at = excluded.updated_at`)
        .bind(elderId, mode, dndUntil, voice, robotName, updatedAt).run();
      return json(request, { success: true, dnd_mode: mode, dnd_until: dndUntil, dnd_enabled: mode !== 'off', voice_profile: voice, robot_name: robotName, updated_at: updatedAt });
    }

    if (request.method === 'GET' && area === 'family' && section === 'conversation-history' && elderId) {
      await ensureConversationLogs(db, elderId);
      const requestedDate = new URL(request.url).searchParams.get('date') || new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) return json(request, { error: 'Ngày không hợp lệ.' }, 422);
      const { results } = await db.prepare(`SELECT id, elder_id, speaker, message_text, timestamp, source, review_flag
        FROM conversation_logs WHERE elder_id = ? AND substr(timestamp, 1, 10) = ? ORDER BY timestamp ASC`).bind(elderId, requestedDate).all();
      return json(request, {
        elder_id: elderId, date: requestedDate, source: results.some(row => row.source === 'telegram') ? 'telegram' : results.length ? 'demo' : 'none',
        review_needed_count: results.filter(row => row.review_flag === 'family_followup').length,
        messages: results,
      });
    }

    if (request.method === 'GET' && area === 'family' && section === 'schedules' && elderId) {
      const { results } = await db.prepare("SELECT * FROM care_schedule WHERE elder_id = ? AND scheduled_at >= datetime('now', '-30 days') ORDER BY scheduled_at ASC").bind(elderId).all();
      return json(request, results);
    }
    if (request.method === 'GET' && area === 'family' && section === 'maintenance-notifications' && elderId) {
      const { results } = await db.prepare('SELECT * FROM maintenance_notifications WHERE elder_id = ? ORDER BY COALESCE(due_at, created_at) ASC').bind(elderId).all();
      return json(request, results);
    }
    if (request.method === 'GET' && area === 'family' && section === 'subscription' && elderId) {
      const { results } = await db.prepare('SELECT * FROM service_payments WHERE elder_id = ? ORDER BY period_start DESC').bind(elderId).all();
      const current = results.find(row => row.status === 'paid' && row.period_start <= new Date().toISOString().slice(0, 10) && row.period_end >= new Date().toISOString().slice(0, 10)) || null;
      return json(request, { elder_id: elderId, current_plan: current, payments: results });
    }
    if (request.method === 'GET' && area === 'family' && section === 'alerts' && elderId) {
      const { results } = await db.prepare('SELECT * FROM alerts WHERE elder_id = ? ORDER BY timestamp DESC').bind(elderId).all();
      return json(request, results);
    }
    if (request.method === 'GET' && area === 'family' && section === 'agent-status' && elderId) {
      return json(request, await agentStatus(db, elderId));
    }
    if (request.method === 'GET' && area === 'family' && section === 'telegram-consultation' && elderId) {
      const row = await db.prepare('SELECT group_name, members_summary, is_active, group_chat_url FROM telegram_consultation WHERE elder_id = ?').bind(elderId).first();
      return row ? json(request, row) : json(request, { error: 'Chưa cấu hình nhóm Telegram.' }, 404);
    }
    if (request.method === 'GET' && area === 'device' && section === 'connectivity' && elderId) {
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
