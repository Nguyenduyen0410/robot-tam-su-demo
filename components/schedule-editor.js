// Schedule editor and mock notification handoff.
(function () {
  function scheduleNotification(data) {
    // Demo placeholder for a future push-notification API integration.
    console.info('[Myka demo] scheduleNotification', data);
    return { queued: false, demo: true };
  }
  function ScheduleEditor({ onClose, onSave, initialSchedule }) {
    const initialTime = initialSchedule?.scheduled_at ? new Date(initialSchedule.scheduled_at) : new Date();
    const localDateTime = new Date(initialTime.getTime() - initialTime.getTimezoneOffset() * 60000).toISOString();
    const [type, setType] = React.useState(initialSchedule?.type || 'medication');
    const [title, setTitle] = React.useState(initialSchedule?.title || '');
    const [date, setDate] = React.useState(localDateTime.slice(0, 10));
    const [time, setTime] = React.useState(initialSchedule ? localDateTime.slice(11, 16) : '08:00');
    const [detail, setDetail] = React.useState(initialSchedule?.detail || '');
    const submit = event => {
      event.preventDefault();
      const row = { id: initialSchedule?.id || `SCH-${Date.now()}`, elder_id: initialSchedule?.elder_id || 'E001', type, title: title.trim() || (type === 'medication' ? 'Nhắc uống thuốc' : 'Lịch tái khám'), detail: detail.trim(), scheduled_at: `${date}T${time}:00+07:00`, confirmed: Boolean(initialSchedule?.confirmed) };
      if (!initialSchedule) scheduleNotification(row);
      onSave(row);
    };
    return <div className="fixed inset-0 z-50 bg-slate-900/40 p-4 grid place-items-center" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}><form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-violet-700">LỊCH CHĂM SÓC</p><h2 className="text-xl font-bold mt-1">{initialSchedule ? 'Chỉnh sửa lịch' : 'Thêm lịch mới'}</h2></div><button type="button" onClick={onClose} aria-label="Đóng" className="rounded-full border w-9 h-9">×</button></div><label className="block text-sm font-semibold mt-5">Loại lịch<select value={type} onChange={e => setType(e.target.value)} className="block mt-1 w-full rounded-xl border p-3"><option value="medication">Uống thuốc</option><option value="checkup">Tái khám</option></select></label><label className="block text-sm font-semibold mt-4">Tên lịch<input value={title} onChange={e => setTitle(e.target.value)} placeholder={type === 'medication' ? 'Ví dụ: Uống thuốc huyết áp' : 'Ví dụ: Tái khám tại bệnh viện'} className="block mt-1 w-full rounded-xl border p-3" /></label><div className="grid grid-cols-2 gap-3 mt-4"><label className="text-sm font-semibold">Ngày<input required type="date" value={date} onChange={e => setDate(e.target.value)} className="block mt-1 w-full rounded-xl border p-3" /></label><label className="text-sm font-semibold">Giờ<input required type="time" value={time} onChange={e => setTime(e.target.value)} className="block mt-1 w-full rounded-xl border p-3" /></label></div><label className="block text-sm font-semibold mt-4">Ghi chú<input value={detail} onChange={e => setDetail(e.target.value)} placeholder="Liều dùng, địa điểm…" className="block mt-1 w-full rounded-xl border p-3" /></label><p className="text-xs text-amber-800 bg-amber-50 rounded-xl p-3 mt-4">Để nhận lời nhắc, hãy bật thông báo lịch trên điện thoại.</p><div className="flex justify-end gap-2 mt-5"><button type="button" onClick={onClose} className="rounded-xl border px-4 py-2">Hủy</button><button className="rounded-xl bg-violet-600 text-white px-5 py-2 font-bold">{initialSchedule ? 'Lưu thay đổi' : 'Lưu lịch'}</button></div></form></div>;
  }
  window.ScheduleEditor = ScheduleEditor;
  window.scheduleNotification = scheduleNotification;
})();
