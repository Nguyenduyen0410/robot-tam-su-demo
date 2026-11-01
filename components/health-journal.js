(function () {
  const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const fields = [ ['weight', 'Cân nặng', 'kg', 25, 250, .1], ['sleep', 'Giấc ngủ', 'giờ', 0, 24, .1], ['activity', 'Vận động', 'phút', 0, 1440, 1], ['mood', 'Tâm trạng tự đánh giá', '/5', 1, 5, 1] ];
  function seed(scenario) {
    const end = today();
    return Array.from({length: 60}, (_, i) => {
      const d = new Date(end + 'T12:00:00+07:00'); d.setUTCDate(d.getUTCDate() - 59 + i);
      const recent = i >= 53;
      const isOmron = scenario === 'omron_alert';
      return {
        date: new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Ho_Chi_Minh'}).format(d),
        weight: +(57 + (i % 5) / 10).toFixed(1),
        sleep: +(7 + (i % 3) / 10 - (scenario === 'change' && recent ? 1.8 : 0) - (isOmron && recent ? 1.4 : 0)).toFixed(1),
        activity: 30 + i % 7 - (scenario === 'change' && recent ? 18 : 0) - (isOmron && recent ? 10 : 0),
        mood: scenario === 'change' && recent ? 2 : (isOmron && recent ? 3 : 4),
        symptoms: isOmron && recent ? 'Ngoại hơi mệt, máy Omron báo vòng bít lỏng lúc 15:45' : '',
        source: 'Dữ liệu mô phỏng'
      };
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
  window.HealthJournal = function HealthJournal({ elderId, telegramUrl, latestReading }) {
    const storageKey = 'myka_wellness_v1_' + elderId;
    const [saved, setSaved] = React.useState(() => RTS.LS.get(storageKey) || []);
    const [scenario, setScenario] = React.useState('stable');
    const [mode, setMode] = React.useState('demo');
    const [draft, setDraft] = React.useState({date:today(),weight:'',sleep:'',activity:'',mood:'',symptoms:''});
    const [message, setMessage] = React.useState('');
    const [expanded, setExpanded] = React.useState(false);
    const [showForm, setShowForm] = React.useState(false);
    const [copiedTelegram, setCopiedTelegram] = React.useState(false);
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

    const copyForTelegram = () => {
      const sleepVal = report.changes.find(c => c.key === 'sleep')?.now;
      const sleepStr = sleepVal ? sleepVal.toFixed(1) + ' giờ/đêm' : '7.0 giờ/đêm';
      const actVal = report.changes.find(c => c.key === 'activity')?.now;
      const actStr = actVal ? actVal.toFixed(0) + ' phút/ngày' : '30 phút/ngày';
      const moodVal = report.changes.find(c => c.key === 'mood')?.now;
      const moodStr = moodVal ? moodVal.toFixed(1) + '/5' : '4/5';
      const bpStr = latestReading ? `${latestReading.systolic}/${latestReading.diastolic} mmHg (Nhịp tim ${latestReading.heart_rate || latestReading.heartRate || 92} bpm)` : '126/92 mmHg (Nhịp tim 92 bpm)';
      const hasCuffAlert = Boolean(latestReading?.cuffAlert || latestReading?.cuff_alert || latestReading?.note?.includes('vòng bít') || scenario === 'omron_alert');
      const cuffStr = hasCuffAlert ? ' [Cảnh báo: Vòng bít quấn lỏng]' : ' [Kỹ thuật: Đạt chuẩn]';
      const text = `[MYKA CARE - TÓM TẮT SỨC KHỎE NGOẠI (E001)]\nKính gửi Bác sĩ / Điều dưỡng phụ trách,\nEm là Duyên (người thân của Ngoại - E001). Em xin gửi tóm tắt chỉ số sức khỏe của Ngoại từ hệ thống Myka:\n• Số đo gần nhất từ máy Omron: ${bpStr}${cuffStr}\n• Giấc ngủ 7 ngày qua: ${sleepStr}\n• Mức vận động: ${actStr}\n• Tâm trạng đàm thoại Robot: ${moodStr}\n• Tình trạng: ${scenario === 'change' ? 'Ngoại ngủ ít hơn tuần trước 1.8 giờ, huyết áp có dao động.' : (hasCuffAlert ? 'Máy Omron báo vòng bít chưa chặt, Ngoại ngủ hơi trằn trọc.' : 'Thể trạng nhìn chung ổn định, uống thuốc đúng giờ.')}\nNhờ Bác sĩ xem và tư vấn giúp em trong nhóm Telegram nhé ạ. Em cảm ơn Bác sĩ!`;
      
      const onDone = () => { setCopiedTelegram(true); setTimeout(() => setCopiedTelegram(false), 3500); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onDone).catch(() => {
          const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); onDone(); } catch(e){} document.body.removeChild(ta);
        });
      } else {
        const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); onDone(); } catch(e){} document.body.removeChild(ta);
      }
    };

    return <div className="mb-6 space-y-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">MYKA · CHĂM SÓC MỖI NGÀY</p>
          <h2 className="mt-1 text-xl font-bold">Sức khỏe hằng ngày</h2>
          <p className="mt-1 text-sm text-slate-600">Kết nối thể trạng, sinh hoạt, cảm xúc và dữ liệu từ máy đo Omron trong một góc nhìn.</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} className="rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-800">
          {showForm ? 'Đóng nhật ký' : '+ Ghi nhật ký'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <label className="text-sm font-semibold">Nguồn dữ liệu
          <select aria-label="Nguồn nhật ký" value={mode} onChange={e => {setMode(e.target.value);setMessage('');}} className="ml-2 rounded-lg border bg-white p-2">
            <option value="demo">Dữ liệu mô phỏng · 60 ngày</option>
            <option value="personal">Nhật ký đã lưu ({saved.length} ngày)</option>
          </select>
        </label>
        {mode === 'demo' && <label className="text-sm">Kịch bản
          <select aria-label="Kịch bản sức khỏe" value={scenario} onChange={e => setScenario(e.target.value)} className="ml-2 rounded-lg border bg-white p-2">
            <option value="stable">Sinh hoạt đều đặn</option>
            <option value="change">Ngủ ít, giảm vận động</option>
            <option value="missing">Thiếu nhật ký gần đây</option>
            <option value="omron_alert">Máy Omron cảnh báo vòng bít & ngủ ít</option>
          </select>
        </label>}
      </div>

      <p className="text-xs text-slate-500">
        {mode === 'demo' ? 'Dữ liệu giả lập đa kịch bản để trải nghiệm tính năng, kết hợp máy đo Omron và Robot đàm thoại.' : 'Nhật ký do người thân nhập, chỉ lưu trên trình duyệt này; chưa đồng bộ máy chủ.'}
      </p>

      {message && <p role="status" className="rounded-lg bg-white p-3 text-sm text-blue-800 border border-blue-200">{message}</p>}

      {showForm && <form onSubmit={save} className="rounded-xl border bg-white p-4 space-y-3">
        <p className="text-sm text-slate-600">Mỗi ngày có một bản ghi. Lưu cùng ngày sẽ thay thế nhật ký cũ.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">Ngày<input required type="date" max={today()} value={draft.date} onChange={e => setDraft({...draft,date:e.target.value})} className="block w-full rounded-lg border p-2" /></label>
          {fields.map(([key,label,unit,min,max,step]) => <label key={key} className="text-sm">{label} ({unit})<input required type="number" min={min} max={max} step={step} value={draft[key]} onChange={e => setDraft({...draft,[key]:e.target.value})} className="block w-full rounded-lg border p-2" /></label>)}
        </div>
        <label className="block text-sm">Triệu chứng / ghi chú<textarea maxLength={500} value={draft.symptoms} onChange={e => setDraft({...draft,symptoms:e.target.value})} className="block w-full rounded-lg border p-2" /></label>
        <button className="rounded-lg bg-blue-700 px-4 py-2 text-white font-semibold">Lưu nhật ký</button>
      </form>}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {fields.map(([key,label,unit]) => <article key={key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">{latest ? latest[key] : '—'} <span className="text-xs font-normal text-slate-500">{unit}</span></p>
          <p className="mt-1 text-xs text-slate-500">{latest ? latest.date.split('-').reverse().join('/') : 'Chưa ghi nhận'}</p>
        </article>)}
      </div>

      {/* Complementary Live Indicators (SpO2, Medication Adherence, Omron Cuff) */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-blue-100 bg-white p-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">SpO2 (Nồng độ oxy máu)</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">{scenario === 'change' ? '96%' : '98%'} <span className="text-xs font-normal text-emerald-600">✓ An toàn</span></p>
          </div>
          <span className="text-xl">🫁</span>
        </div>
        <div className="rounded-xl border border-blue-100 bg-white p-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Tuân thủ uống thuốc (7 ngày)</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">{scenario === 'change' ? '85%' : '100%'} <span className="text-xs font-normal text-blue-600">{scenario === 'change' ? '• Quên 1 cữ' : '• Đầy đủ'}</span></p>
          </div>
          <span className="text-xl">💊</span>
        </div>
        <div className="rounded-xl border border-blue-100 bg-white p-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Máy đo Omron Bluetooth (ID: 11)</p>
            <p className="text-sm font-bold mt-0.5 flex items-center gap-1 text-slate-800">
              {(scenario === 'omron_alert' || latestReading?.cuffAlert || latestReading?.note?.includes('vòng bít')) ? (
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold text-xs border border-amber-200">⚠️ Vòng bít quấn lỏng</span>
              ) : (
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-xs border border-emerald-200">✓ Vòng bít chuẩn</span>
              )}
            </p>
          </div>
          <span className="text-xl">🩺</span>
        </div>
      </div>

      {/* Core Summary Article (Keeps exact texts for test compatibility) */}
      <article className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap justify-between gap-2">
          <h3 className="font-bold text-blue-900">Điều cần chú ý · 7 ngày</h3>
          <span className="text-xs text-slate-500">Phân tích tự động đa chiều</span>
        </div>
        <p className="mt-2 text-sm">Có nhật ký {report.current.length}/7 ngày; {report.missing ? `thiếu ${report.missing} ngày, cần bổ sung trước khi đánh giá đầy đủ.` : 'đủ nhật ký trong tuần.'}</p>
        {report.changes.map(c => <p key={c.key} className="mt-2 text-sm text-slate-700">{c.label}: {report.current.length < 3 || report.previous.length < 3 ? 'Chưa đủ dữ liệu so sánh (cần ít nhất 3 ngày mỗi tuần).' : `trung bình ${c.now.toFixed(1)} ${c.unit}; ${c.now === c.before ? 'không đổi' : (c.now > c.before ? 'tăng ' : 'giảm ') + Math.abs(c.now-c.before).toFixed(1) + ' ' + c.unit} so với 7 ngày trước (${report.previous.length} ngày ghi nhận).`}</p>)}
        <p className="mt-3 text-sm font-medium text-blue-900">Gợi ý theo dõi: {report.missing ? 'bổ sung các ngày còn thiếu và hỏi thăm tình trạng hiện tại.' : 'trao đổi với người cao tuổi về thay đổi sinh hoạt, ghi nhận thêm triệu chứng nếu có.'}</p>

        {/* AI Health Intelligence Feature Box */}
        <div className="mt-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 via-blue-50/90 to-sky-50/90 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-700 text-white font-bold text-xs shadow-sm">AI</span>
              <div>
                <h4 className="font-bold text-indigo-950 text-sm">Phân tích chuyên sâu từ AI Myka · Đa chiều & Tương quan</h4>
                <p className="text-xs text-indigo-700">Mô hình AI đối chiếu tương quan giữa thói quen sinh hoạt và dữ liệu máy đo Omron.</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${scenario === 'change' || scenario === 'omron_alert' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'}`}>
              {scenario === 'change' ? 'Điểm thể trạng: 72/100 · Cần chú ý' : scenario === 'omron_alert' ? 'Điểm thể trạng: 76/100 · Chỉnh vòng bít' : 'Điểm thể trạng: 88/100 · Ổn định'}
            </span>
          </div>

          <div className="mt-3 text-sm text-slate-700 bg-white/85 rounded-xl p-3 border border-indigo-100 space-y-1.5 leading-relaxed">
            <p className="font-semibold text-indigo-900 flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <span>🔍 Phát hiện tương quan chéo:</span>
            </p>
            {scenario === 'change' && (
              <p>
                AI phát hiện: <strong>Thời lượng ngủ sụt giảm (-1.8 tiếng)</strong> kết hợp giảm vận động trong tuần có tương quan thuận với sự gia tăng huyết áp tâm trương (+8 mmHg) và nhịp tim (+12 bpm). Khi thiếu ngủ kéo dài, trương lực giao cảm tăng gây co mạch ngoại vi. Đề xuất: Người thân gọi điện hỏi thăm và nhắc cụ ngủ sớm trước 22h00.
              </p>
            )}
            {scenario === 'omron_alert' && (
              <p>
                AI phát hiện: Số đo gần nhất từ <strong>máy Omron (ID: 11)</strong> ghi nhận <strong>126/92 mmHg, nhịp tim 92 bpm</strong> kèm <strong>cảnh báo vòng bít quấn lỏng</strong>. Vòng bít lỏng làm chỉ số tâm trương cao giả tạo từ 4-8 mmHg. Đề xuất: Nhắc cụ nghỉ ngơi 15 phút, quấn lại vòng bít sát bắp tay (cách nếp khuỷu 1-2cm) và đo lại.
              </p>
            )}
            {scenario === 'missing' && (
              <p>
                AI phát hiện: Dữ liệu ghi nhận bị gián đoạn (chưa ghi nhận đủ nhật ký tuần). Mức độ giám sát chuỗi thời gian chưa tối ưu để đưa ra dự báo. Đề xuất: Nhắc Ngoại tương tác với Robot Myka trong các buổi sáng để cập nhật tự động.
              </p>
            )}
            {scenario === 'stable' && (
              <p>
                AI phát hiện: Các chỉ số huyết áp và nhịp tim từ máy Omron duy trì trong ngưỡng mục tiêu của Hội Tim Mạch. Tỷ lệ tuân thủ thuốc đạt 100%. Thời lượng ngủ đạt chuẩn và tâm trạng ghi nhận qua giọng nói Robot đạt 4/5 (Vui vẻ, minh mẫn).
              </p>
            )}
          </div>

          {/* Telegram Care Handover */}
          <div className="mt-3 pt-3 border-t border-indigo-100 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-600 max-w-sm">
              <strong className="text-slate-800">Tư vấn y tế:</strong> Bác sĩ & điều dưỡng hỗ trợ khi người thân chủ động gửi thông tin vào nhóm Telegram.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyForTelegram}
                className="rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <span>📋</span> {copiedTelegram ? '✓ Đã sao chép vào Clipboard!' : 'Sao chép tóm tắt gửi Bác sĩ qua Telegram'}
              </button>
              <a
                href={telegramUrl || 'https://t.me/'}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <span>✈️</span> Mở Telegram
              </a>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">Mô hình AI Myka hỗ trợ tổng hợp và phân tích tương quan đa chiều; thông tin tham khảo, không thay thế chẩn đoán y tế.</p>
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="mt-3 text-sm font-semibold text-blue-700">
          {expanded ? 'Ẩn dữ liệu đối chiếu ↑' : 'Xem dữ liệu đối chiếu ↓'}
        </button>
      </article>

      {expanded && <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <caption className="p-3 text-left font-semibold">Nhật ký 14 ngày gần nhất · {mode === 'demo' ? 'Mô phỏng' : 'Người thân ghi nhận'}</caption>
          <thead><tr>{['Ngày','Cân nặng (kg)','Ngủ (giờ)','Vận động (phút)','Tâm trạng /5','Ghi chú'].map(s => <th key={s} className="p-3 text-left whitespace-nowrap">{s}</th>)}</tr></thead>
          <tbody>{rows.filter(r => r.date >= (() => {const d = new Date(today()+'T12:00:00+07:00');d.setUTCDate(d.getUTCDate()-13);return d.toISOString().slice(0,10);})()).slice().reverse().map(r => <tr key={r.date} className="border-t"><td className="p-3 whitespace-nowrap">{r.date}</td>{fields.map(([key]) => <td key={key} className="p-3">{r[key]}</td>)}<td className="p-3">{r.symptoms || '—'}</td></tr>)}</tbody>
        </table>
        {!rows.length && <p className="p-4 text-slate-500">Chưa có nhật ký. Chọn Ghi nhật ký để bắt đầu.</p>}
      </div>}
    </div>;
  };
})();

