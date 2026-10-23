// Read-only adapter for the payload format described in 3rd_party_api_guide.md.
// This public demo uses only the synthetic examples printed in that document.
// Do not enable live reads here until the app API enforces family authentication.
const GUIDE_BPM = [
  { id: 'demo-bpm-17', sys: 124, dia: 78, pul: 71, status: 'normal', timestamp: '2026-10-17 07:40:00', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-bpm-18', sys: 126, dia: 79, pul: 73, status: 'normal', timestamp: '2026-10-18 08:05:00', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-bpm-19', sys: 132, dia: 82, pul: 75, status: 'elevated', timestamp: '2026-10-19 08:15:00', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-bpm-20', sys: 145, dia: 90, pul: 88, status: 'hypertension_stage_2', timestamp: '2026-10-20 08:20:00', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-bpm-21', sys: 121, dia: 76, pul: 70, status: 'normal', timestamp: '2026-10-21 08:10:00', robot_id: 'ROBOT-DEFAULT' },
  { id: 'bpm-003', sys: 122, dia: 80, pul: 74, status: 'hypertension_stage_1', timestamp: '2026-10-22 11:14:25', robot_id: 'ROBOT-DEFAULT' },
  { id: 'bpm-002', sys: 116, dia: 76, pul: 70, status: 'normal', timestamp: '2026-10-22 12:14:25', robot_id: 'ROBOT-DEFAULT' },
  { id: 'bpm-001', sys: 118, dia: 78, pul: 72, status: 'normal', timestamp: '2026-10-23 13:14:25', robot_id: 'ROBOT-DEFAULT' },
];

const GUIDE_CHAT = [
  { id: 'demo-msg-17-u', timestamp: '2026-10-17 08:10:00', role: 'user', content: 'Myka ơi, sáng nay trời mát quá con ha.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-17-a', timestamp: '2026-10-17 08:10:15', role: 'assistant', content: 'Dạ, con nghe Ngoại nói trời mát. Ngoại muốn con mở bài nhạc quen thuộc không ạ?', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-17-u2', timestamp: '2026-10-17 08:12:00', role: 'user', content: 'Ừ, con mở bài Ngoại hay nghe hôm trước nhé.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-17-a2', timestamp: '2026-10-17 08:12:12', role: 'assistant', content: 'Dạ, con mở nhạc cho Ngoại nghe đây ạ.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-18-u', timestamp: '2026-10-18 09:20:00', role: 'user', content: 'Trưa nay con Duyên có ghé ăn cơm với Ngoại không?', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-18-a', timestamp: '2026-10-18 09:20:18', role: 'assistant', content: 'Dạ, con chưa có lịch của chị Duyên. Con ghi lại lời Ngoại hỏi để gia đình tiện xem nhé.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-18-u2', timestamp: '2026-10-18 09:22:00', role: 'user', content: 'Con nhắn chị Duyên gọi cho Ngoại khi rảnh được không?', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-18-a2', timestamp: '2026-10-18 09:22:14', role: 'assistant', content: 'Dạ, con đã ghi nhận lời nhắn để gia đình xem trong ứng dụng ạ.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-19-u', timestamp: '2026-10-19 15:05:00', role: 'user', content: 'Ngoại muốn nghe lại bài hát ngày xưa.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-19-a', timestamp: '2026-10-19 15:05:12', role: 'assistant', content: 'Dạ được ạ. Ngoại muốn nghe bài nào, con sẽ giúp mở bài đó.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-19-u2', timestamp: '2026-10-19 15:07:00', role: 'user', content: 'Bài nào có giai điệu vui vui ấy con.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-19-a2', timestamp: '2026-10-19 15:07:16', role: 'assistant', content: 'Dạ, con chọn một bài có giai điệu vui để Ngoại nghe nhé.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-20-u', timestamp: '2026-10-20 10:35:00', role: 'user', content: 'Sáng nay Ngoại thấy hơi mệt, con ghi lại giúp Ngoại nhé.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-20-a', timestamp: '2026-10-20 10:35:16', role: 'assistant', content: 'Dạ, con đã ghi lại lời Ngoại chia sẻ để gia đình xem. Nếu Ngoại thấy không ổn, Ngoại gọi người thân ở gần nhé.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-20-u2', timestamp: '2026-10-20 10:37:00', role: 'user', content: 'Ngoại nghỉ một lát rồi sẽ gọi con Duyên.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-20-a2', timestamp: '2026-10-20 10:37:12', role: 'assistant', content: 'Dạ, con ghi nhận rồi ạ. Ngoại cứ gọi người thân nếu muốn có người ở cạnh nhé.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-21-u', timestamp: '2026-10-21 19:10:00', role: 'user', content: 'Myka kể cho Ngoại nghe chuyện vui đi con.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-21-a', timestamp: '2026-10-21 19:10:14', role: 'assistant', content: 'Dạ, con kể Ngoại nghe một chuyện vui ngắn nhé…', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-21-u2', timestamp: '2026-10-21 19:13:00', role: 'user', content: 'Chuyện vui quá, Ngoại cười rồi nè.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-21-a2', timestamp: '2026-10-21 19:13:13', role: 'assistant', content: 'Dạ, nghe Ngoại cười là con vui rồi. Ngoại muốn nghe thêm chuyện nữa không ạ?', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-22-u', timestamp: '2026-10-22 16:25:00', role: 'user', content: 'Ngoại vừa gọi điện cho con Duyên xong rồi.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-22-a', timestamp: '2026-10-22 16:25:12', role: 'assistant', content: 'Dạ, con vui vì Ngoại vừa trò chuyện với chị Duyên ạ.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-22-u2', timestamp: '2026-10-22 16:27:00', role: 'user', content: 'Cuối tuần chị ấy sẽ sang thăm Ngoại.', robot_id: 'ROBOT-DEFAULT' },
  { id: 'demo-msg-22-a2', timestamp: '2026-10-22 16:27:12', role: 'assistant', content: 'Dạ, con ghi lại lời Ngoại kể. Chắc Ngoại mong đến cuối tuần lắm ạ.', robot_id: 'ROBOT-DEFAULT' },
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
