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

export async function onRequest({ request, env, params }) {
  const headers = corsHeaders(request);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!env.MYKA_DB) return json(request, { error: 'Thiếu binding cơ sở dữ liệu MYKA_DB trong Cloudflare Pages.' }, 503);

  const parts = String(params.path || '').split('/').filter(Boolean).map(decodeURIComponent);
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
