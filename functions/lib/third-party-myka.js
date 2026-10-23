// Read-only adapter for the payload format described in 3rd_party_api_guide.md.
// This public demo uses only the synthetic examples printed in that document.
// Do not enable live reads here until the app API enforces family authentication.
const GUIDE_BPM = [
  { id: 'bpm-003', sys: 122, dia: 80, pul: 74, status: 'hypertension_stage_1', timestamp: '2026-10-22 11:14:25', robot_id: 'ROBOT-DEFAULT' },
  { id: 'bpm-002', sys: 116, dia: 76, pul: 70, status: 'normal', timestamp: '2026-10-22 12:14:25', robot_id: 'ROBOT-DEFAULT' },
  { id: 'bpm-001', sys: 118, dia: 78, pul: 72, status: 'normal', timestamp: '2026-10-23 13:14:25', robot_id: 'ROBOT-DEFAULT' },
];

const GUIDE_CHAT = [
  { id: 'msg-3', turn_id: 4, timestamp: '2026-10-23 13:14:25', role: 'user', sender_name: 'Ngoại', content: 'Kể cho bà một câu đố vui đi cháu', robot_id: 'ROBOT-DEFAULT' },
  { id: 'msg-4', turn_id: 4, timestamp: '2026-10-23 13:14:25', role: 'assistant', sender_name: 'Cháu', content: 'Con gì có cánh mà không biết bay? Đố ngoại đó!', robot_id: 'ROBOT-DEFAULT' },
  { id: 'msg-1', turn_id: 5, timestamp: '2026-10-23 13:14:25', role: 'user', sender_name: 'Ngoại', content: 'Tạm biệt cháu nhé, ngoại đi ngủ đây', robot_id: 'ROBOT-DEFAULT' },
  { id: 'msg-2', turn_id: 5, timestamp: '2026-10-23 13:14:25', role: 'assistant', sender_name: 'Cháu', content: 'Chúc ngoại ngủ thật ngon giấc và có giấc mơ đẹp ạ!', robot_id: 'ROBOT-DEFAULT' },
];

function timestampOf(value) {
  if (typeof value === 'number') return new Date(value < 1e12 ? value * 1000 : value).toISOString();
  const raw = String(value || '');
  if (/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(raw)) return `${raw.replace(' ', 'T')}+07:00`;
  return raw;
}

export async function getReadOnlyBpm(_env, days) {
  const sourceRows = GUIDE_BPM;
  const cutoff = Date.now() - days * 86400000;
  const rows = sourceRows.map(row => {
    const timestamp = timestampOf(row.measured_at || row.timestamp);
    const systolic = Number(row.sys ?? row.systolic);
    const diastolic = Number(row.dia ?? row.diastolic);
    const heartRate = Number(row.pul ?? row.heart_rate ?? row.heartRate);
    return {
      id: String(row.id || `MYKA-${timestamp}`), elder_id: 'E001', systolic, diastolic,
      heart_rate: heartRate, status: String(row.status || 'unknown'), timestamp,
      note: 'Đọc từ Robot Myka API · chỉ số gốc; không bao gồm lời khuyên y tế.',
      source: 'third_party_guide_demo',
    };
  }).filter(row => Number.isFinite(Date.parse(row.timestamp)) && Date.parse(row.timestamp) >= cutoff
    && Number.isFinite(row.systolic) && Number.isFinite(row.diastolic) && Number.isFinite(row.heart_rate));
  return { rows: rows.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)), source: 'third_party_guide_demo' };
}

export async function getReadOnlyChat(_env, date) {
  const messages = GUIDE_CHAT.map(row => ({
    id: String(row.id), speaker: row.role === 'user' ? 'elder' : 'myka',
    message_text: String(row.content || ''), timestamp: timestampOf(row.timestamp),
    source: 'third_party_guide_demo', review_flag: 'none',
  })).filter(row => row.message_text && row.timestamp.slice(0, 10) === date)
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  return { messages, source: 'third_party_guide_demo' };
}
