(function () {
  const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const fields = [ ['weight', 'Cân nặng', 'kg', 25, 250, .1], ['sleep', 'Giấc ngủ', 'giờ', 0, 24, .1], ['activity', 'Vận động', 'phút', 0, 1440, 1], ['mood', 'Tâm trạng tự đánh giá', '/5', 1, 5, 1] ];
  function seed(scenario) {
    const end = today();
    return Array.from({length: 60}, (_, i) => {
      const d = new Date(end + 'T12:00:00+07:00'); d.setUTCDate(d.getUTCDate() - 59 + i);
      const recent = i >= 53;
      return { date: new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Ho_Chi_Minh'}).format(d), weight: +(57 + (i % 5) / 10).toFixed(1), sleep: +(7 + (i % 3) / 10 - (scenario === 'change' && recent ? 1.8 : 0)).toFixed(1), activity: 30 + i % 7 - (scenario === 'change' && recent ? 18 : 0), mood: scenario === 'change' && recent ? 2 : 4, symptoms: '', source: 'Dữ liệu mô phỏng' };
    }).filter((_, i) => scenario !== 'missing' || i < 53 || i % 3 === 0);
  }
  function summarize(rows) {
    const end = new Date(today() + 'T12:00:00+07:00').getTime();
    const age = r => Math.round((end - new Date(r.date + 'T12:00:00+07:00').getTime()) / 86400000);
    const current = rows.filter(r => age(r) >= 0 && age(r) < 7);
    const previous = rows.filter(r => age(r) >= 7 && age(r) < 14);
    const mean = (rs, key) => rs.length ? rs.reduce((s,r) => s + Number(r[key]),0) / rs.length : null;
    return { current, previous, missing: 7 - current.length, mean, changes: fields.slice(1).map(([key,label,unit]) => ({ key,label,unit, now:mean(current,key), before:mean(previous,key) })) };
  }
  window.MykaWellness = {seed, summarize};
  window.HealthJournal = function HealthJournal({ elderId }) {
    const storageKey = 'myka_wellness_v1_' + elderId;
    const [saved, setSaved] = React.useState(() => RTS.LS.get(storageKey) || []);
    const [scenario,setScenario] = React.useState('stable');
    const [mode,setMode] = React.useState('demo');
    const [draft,setDraft] = React.useState({date:today(),weight:'',sleep:'',activity:'',mood:'',symptoms:''});
    const [message,setMessage] = React.useState('');
    const [expanded,setExpanded] = React.useState(false);
    const [showForm,setShowForm] = React.useState(false);
    const rows = (mode === 'demo' ? seed(scenario) : saved).slice().sort((a,b) => a.date.localeCompare(b.date));
    const report = summarize(rows);
    const latest = rows[rows.length - 1];
    function save(e) {
      e.preventDefault();
      const row = {...draft, source:'Người thân ghi nhận'};
      for (const [key,label,,min,max] of fields) {
        row[key] = Number(draft[key]);
        if (draft[key] === '' || !Number.isFinite(row[key]) || row[key] < min || row[key] > max || (key === 'mood' && !Number.isInteger(row[key]))) { setMessage('Vui lòng kiểm tra ' + label.toLowerCase() + '.'); return; }
      }
      if (!row.date || row.date > today()) {setMessage('Ngày ghi nhận phải từ hôm nay trở về trước.');return;}
      const next = [...saved.filter(r => r.date !== row.date),row];
      try { RTS.LS.set(storageKey,next); setSaved(next); setMode('personal'); setMessage('Đã lưu nhật ký trên trình duyệt này.'); setShowForm(false); } catch {setMessage('Không lưu được. Vui lòng kiểm tra dung lượng trình duyệt.');}
    }
    return <div className="mb-6 space-y-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">MYKA · CHĂM SÓC MỖI NGÀY</p><h2 className="mt-1 text-xl font-bold">Sức khỏe hằng ngày</h2><p className="mt-1 text-sm text-slate-600">Kết nối thể trạng, sinh hoạt và tinh thần trong một góc nhìn.</p></div><button type="button" onClick={() => setShowForm(!showForm)} className="rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white">{showForm ? 'Đóng nhật ký' : '+ Ghi nhật ký'}</button></div>
      <div className="flex flex-wrap gap-3 items-center"><label className="text-sm font-semibold">Nguồn dữ liệu <select aria-label="Nguồn nhật ký" value={mode} onChange={e => {setMode(e.target.value);setMessage('');}} className="ml-2 rounded-lg border bg-white p-2"><option value="demo">Dữ liệu mô phỏng · 60 ngày</option><option value="personal">Nhật ký đã lưu ({saved.length} ngày)</option></select></label>{mode === 'demo' && <label className="text-sm">Kịch bản <select aria-label="Kịch bản sức khỏe" value={scenario} onChange={e => setScenario(e.target.value)} className="ml-2 rounded-lg border bg-white p-2"><option value="stable">Sinh hoạt đều đặn</option><option value="change">Ngủ ít, giảm vận động</option><option value="missing">Thiếu nhật ký gần đây</option></select></label>}</div>
      <p className="text-xs text-slate-500">{mode === 'demo' ? 'Dữ liệu giả lập để trải nghiệm tính năng, tách riêng lịch sử huyết áp bên dưới.' : 'Nhật ký do người thân nhập, chỉ lưu trên trình duyệt này; chưa đồng bộ máy chủ.'}</p>
      {message && <p role="status" className="rounded-lg bg-white p-3 text-sm text-blue-800">{message}</p>}
      {showForm && <form onSubmit={save} className="rounded-xl border bg-white p-4 space-y-3"><p className="text-sm text-slate-600">Mỗi ngày có một bản ghi. Lưu cùng ngày sẽ thay thế nhật ký cũ.</p><div className="grid sm:grid-cols-2 gap-3"><label className="text-sm">Ngày<input required type="date" max={today()} value={draft.date} onChange={e => setDraft({...draft,date:e.target.value})} className="block w-full rounded-lg border p-2" /></label>{fields.map(([key,label,unit,min,max,step]) => <label key={key} className="text-sm">{label} ({unit})<input required type="number" min={min} max={max} step={step} value={draft[key]} onChange={e => setDraft({...draft,[key]:e.target.value})} className="block w-full rounded-lg border p-2" /></label>)}</div><label className="block text-sm">Triệu chứng / ghi chú<textarea maxLength={500} value={draft.symptoms} onChange={e => setDraft({...draft,symptoms:e.target.value})} className="block w-full rounded-lg border p-2" /></label><button className="rounded-lg bg-blue-700 px-4 py-2 text-white">Lưu nhật ký</button></form>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{fields.map(([key,label,unit]) => <article key={key} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{latest ? latest[key] : '—'} <span className="text-xs font-normal">{unit}</span></p><p className="mt-1 text-xs text-slate-500">{latest ? latest.date.split('-').reverse().join('/') : 'Chưa ghi nhận'}</p></article>)}</div>
      <article className="rounded-xl border border-blue-200 bg-white p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold text-blue-900">Điều cần chú ý · 7 ngày</h3><span className="text-xs text-slate-500">Phân tích tự động bằng quy tắc</span></div><p className="mt-2 text-sm">Có nhật ký {report.current.length}/7 ngày; {report.missing ? `thiếu ${report.missing} ngày, cần bổ sung trước khi đánh giá đầy đủ.` : 'đủ nhật ký trong tuần.'}</p>{report.changes.map(c => <p key={c.key} className="mt-2 text-sm text-slate-700">{c.label}: {report.current.length < 3 || report.previous.length < 3 ? 'Chưa đủ dữ liệu so sánh (cần ít nhất 3 ngày mỗi tuần).' : `trung bình ${c.now.toFixed(1)} ${c.unit}; ${c.now === c.before ? 'không đổi' : (c.now > c.before ? 'tăng ' : 'giảm ') + Math.abs(c.now-c.before).toFixed(1) + ' ' + c.unit} so với 7 ngày trước (${report.previous.length} ngày ghi nhận).`}</p>)}<p className="mt-3 text-sm font-medium text-blue-900">Gợi ý theo dõi: {report.missing ? 'bổ sung các ngày còn thiếu và hỏi thăm tình trạng hiện tại.' : 'trao đổi với người cao tuổi về thay đổi sinh hoạt, ghi nhận thêm triệu chứng nếu có.'}</p><p className="mt-2 text-xs text-slate-500">Bản thử nghiệm chưa kết nối mô hình AI. Nhận xét mô tả dữ liệu, không kết luận bệnh hoặc nguyên nhân.</p><button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="mt-3 text-sm font-semibold text-blue-700">{expanded ? 'Ẩn dữ liệu đối chiếu ↑' : 'Xem dữ liệu đối chiếu ↓'}</button></article>
      {expanded && <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm"><caption className="p-3 text-left font-semibold">Nhật ký 14 ngày gần nhất · {mode === 'demo' ? 'Mô phỏng' : 'Người thân ghi nhận'}</caption><thead><tr>{['Ngày','Cân nặng (kg)','Ngủ (giờ)','Vận động (phút)','Tâm trạng /5','Ghi chú'].map(s => <th key={s} className="p-3 text-left whitespace-nowrap">{s}</th>)}</tr></thead><tbody>{rows.filter(r => r.date >= (() => {const d = new Date(today()+'T12:00:00+07:00');d.setUTCDate(d.getUTCDate()-13);return d.toISOString().slice(0,10);})()).slice().reverse().map(r => <tr key={r.date} className="border-t"><td className="p-3 whitespace-nowrap">{r.date}</td>{fields.map(([key]) => <td key={key} className="p-3">{r[key]}</td>)}<td className="p-3">{r.symptoms || '—'}</td></tr>)}</tbody></table>{!rows.length && <p className="p-4 text-slate-500">Chưa có nhật ký. Chọn Ghi nhật ký để bắt đầu.</p>}</div>}
    </div>;
  };
})();
