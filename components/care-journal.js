(function () {
  const journal = window.MykaCareJournal;
  const { metrics, activities } = journal;
  const fieldStyle = 'mt-1 block w-full rounded-xl border border-slate-300 bg-white p-3';
  const contextLabels = { fasting: 'Lúc đói', after_meal: 'Sau ăn', unknown: 'Chưa rõ' };
  const format = number => number == null ? 'Chưa có thời lượng' :
    number.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  const dateLabel = day => day.split('-').slice(1).reverse().join('/');
  const empty = () => ({
    day: journal.today(), sleepMode: 'clock', start: '', wake: '', previousDay: true,
    duration: '', activity: activities[0], note: '', value: '', measuredTime: '',
    unit: 'mmol/L', context: 'unknown', source: ''
  });

  function Trend({ summary, label, unit, days, bar, onLoadExamples }) {
    if (!summary.points.length) return <div className="my-2 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/70 p-5 text-center sm:p-6">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-sky-100 text-xl text-sky-700">
        📊
      </div>
      <h4 className="mt-2.5 text-sm sm:text-base font-bold text-slate-900">
        Chưa có dữ liệu {label ? label.toLowerCase() : ''} để vẽ biểu đồ
      </h4>
      <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-600 leading-relaxed">
        <strong>Chỉ dẫn hiển thị:</strong> Nhập từ <strong>1 ngày</strong> để bắt đầu xem biểu đồ cột/đường; nhập từ <strong>2 ngày</strong> để hiển thị khoảng dao động; và tối thiểu <strong>3 ngày/tuần</strong> để phân tích xu hướng ổn định sinh hoạt.
      </p>
      {onLoadExamples && <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onLoadExamples}
          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-sky-700 transition"
        >
          <span>✨ Nạp dữ liệu mẫu để xem thử biểu đồ ngay</span>
        </button>
      </div>}
      <p className="mt-2 text-[11px] text-slate-500">
        Hoặc điền biểu mẫu bên cạnh để lưu kết quả thực tế đầu tiên cho Ngoại.
      </p>
    </div>;
    const max = Math.max(1, ...summary.points.map(p => p.value));
    const x = p => {
      const dayIndex = (Date.parse(p.day) - Date.parse(summary.begin)) / 86400000;
      const [hour, minute] = (p.time || '12:00').split(':').map(Number);
      return 88 + (dayIndex + (hour * 60 + minute) / 1440) / days * 596;
    };
    const y = p => 206 - p.value / max * 155;
    return <svg viewBox="0 0 720 260" className="w-full" role="img" aria-label={`Biểu đồ ${label} trong ${days} ngày`}>
      {(bar && max % 2 ? [0, 1] : [0, 0.5, 1]).map(part => <g key={part}>
        <line x1="88" x2="684" y1={206 - part * 155} y2={206 - part * 155} stroke="#cbd5e1" />
        <text x="78" y={211 - part * 155} textAnchor="end" fontSize="17" fill="#475569">{format(max * part)}</text>
      </g>)}
      <text x="88" y="26" fontSize="19" fill="#475569">{unit}</text>
      {Array.from({ length: days }, (_, i) => i).filter(i => days === 7 || i % 5 === 0 || i === days - 1).map(i => {
        const day = journal.dayAt(summary.begin, i);
        return <text key={day} x={x({ day })} y="240" fontSize="17" fill="#475569" textAnchor="middle">{dateLabel(day)}</text>;
      })}
      {!bar && summary.points.slice(1).map((point, i) => {
        const previous = summary.points[i];
        if (Date.parse(point.day) - Date.parse(previous.day) > 86400000) return null;
        return <line key={i} x1={x(previous)} y1={y(previous)} x2={x(point)} y2={y(point)}
          stroke="#1760ad" strokeWidth="3" />;
      })}
      {summary.points.map((point, i) => {
        const title = <title>{dateLabel(point.day)} {point.time || ''}: {format(point.value)} {unit}</title>;
        const width = Math.min(32, 410 / days);
        return bar && point.value > 0
          ? <rect key={i} x={x(point) - width / 2} y={y(point)} width={width} height={206 - y(point)}
            rx="3" fill="#1760ad">{title}</rect>
          : bar
            ? <text key={i} x={x(point)} y="200" textAnchor="middle" fontSize="17" fill="#475569">{title}0</text>
            : <circle key={i} cx={x(point)} cy={y(point)} r="6" fill="#1760ad">{title}</circle>;
      })}
    </svg>;
  }

  function SleepHighlight({ summary, days }) {
    const missing = days - summary.coverage;
    const spreadMinutes = Math.round((summary.spread ?? 0) * 60);
    const longest = summary.points.reduce((max, point) =>
      !max || point.value > max.value ? point : max, null);
    const enoughToCompare = summary.coverage >= 2;
    const evenDuration = enoughToCompare && spreadMinutes <= 60;
    const observation = !enoughToCompare
      ? 'Chưa đủ ghi nhận để xem thời lượng ngủ có đều giữa các ngày.'
      : evenDuration
        ? `Trong ${missing ? 'các ngày đã ghi' : `${days} ngày qua`}, thời lượng ngủ của Ngoại khá đều. Ngày ngủ nhiều nhất và ít nhất chênh ${spreadMinutes} phút.`
        : `Ngày ${dateLabel(longest.day)} Ngoại ngủ ${format(longest.value)} giờ, nhiều nhất trong các ngày đã ghi. Ngày ngủ nhiều nhất và ít nhất chênh ${spreadMinutes} phút.`;
    return <aside aria-label="Điểm đáng chú ý về giấc ngủ" className="mt-3 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-slate-800">
      <p className="font-bold text-teal-900">Điểm đáng chú ý về giấc ngủ</p>
      <p className="mt-1">{observation}</p>
      {missing > 0 && <p className="mt-1">Còn {missing} ngày chưa ghi thời lượng ngủ. Nếu biết, bạn có thể bổ sung để nhìn rõ xu hướng hơn.</p>}
      {evenDuration && missing === 0 && <p className="mt-1">Bạn có thể động viên Ngoại duy trì nếp ngủ hiện tại nếu Ngoại thấy thoải mái.</p>}
      {enoughToCompare && !evenDuration && <p className="mt-1">Bạn có thể hỏi Ngoại hôm đó có gì khác thường và khi thức dậy cảm thấy thế nào.</p>}
    </aside>;
  }

  window.CareJournal = function CareJournal({ elderId, days }) {
    const storageKey = `myka_care_journal_v1:${elderId}`;
    function read() {
      const rows = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!Array.isArray(rows)) throw new Error('Dữ liệu nhật ký không hợp lệ.');
      return rows;
    }
    const [records, setRecords] = React.useState(() => {
      try { return read(); } catch { return []; }
    });
    const [metric, setMetric] = React.useState('sleep');
    const [draft, setDraft] = React.useState(empty);
    const [editing, setEditing] = React.useState(null);
    const [message, setMessage] = React.useState('');
    const [error, setError] = React.useState('');
    const [unit, setUnit] = React.useState('mmol/L');
    const [context, setContext] = React.useState('all');
    const end = journal.today();
    const summary = journal.summarize(records, metric, end, days, unit, context);
    const previous = journal.summarize(records, metric, journal.dayAt(end, -days), days, unit, context);
    const displayUnit = metric === 'glucose' ? unit : metrics[metric].unit;
    const mixedGlucose = metric === 'glucose' && context === 'all' &&
      new Set([...summary.selected, ...previous.selected].map(row => row.context)).size > 1;
    const lastPoint = summary.points.at(-1);
    const earlierPoint = summary.points.findLast(point => point.day !== lastPoint?.day);
    const missing = ['sleep', 'activity'].filter(key => !records.some(row =>
      row.metric === key && row.day >= summary.begin && row.day <= end && row.value !== null
    )).map(key => metrics[key].label);
    const field = key => ({ value: draft[key], onChange: e => setDraft({ ...draft, [key]: e.target.value }) });
    const clear = () => { setEditing(null); setDraft(empty()); setError(''); };
    const save = event => {
      event.preventDefault();
      setError('');
      setMessage('');
      try {
        const record = journal.create(metric, draft, editing || crypto.randomUUID(), end);
        const next = journal.save(read(), record);
        localStorage.setItem(storageKey, JSON.stringify(next));
        setRecords(next);
        if (metric === 'glucose') { setUnit(record.unit); setContext('all'); }
        clear();
        setMessage('Đã lưu bản ghi trên trình duyệt này.');
      } catch (err) { setError(err.message); }
    };
    const formRef = React.useRef(null);
    const edit = record => {
      setEditing(record.id);
      let editDuration = '';
      if (record.metric === 'activity') {
        editDuration = record.minutes ?? '';
      } else if (record.metric === 'sleep') {
        editDuration = record.value != null ? record.value : (record.duration ? (Number(record.duration) > 24 ? (Number(record.duration)/60).toFixed(1) : record.duration) : '');
      } else {
        editDuration = record.duration ?? '';
      }
      setDraft({ ...empty(), ...record,
        duration: editDuration,
        value: record.value ?? '' });
      setError('');
      setMessage(`Đang chỉnh sửa bản ghi ngày ${dateLabel(record.day)}. Hãy điều chỉnh và bấm Lưu thay đổi.`);
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        formRef.current.classList.add('ring-4', 'ring-blue-400');
        setTimeout(() => {
          if (formRef.current) formRef.current.classList.remove('ring-4', 'ring-blue-400');
        }, 1800);
      }
    };
    const loadExamples = () => {
      setError('');
      try {
        if (read().length) return;
        const rows = journal.examples(end);
        localStorage.setItem(storageKey, JSON.stringify(rows));
        setRecords(rows);
        setMessage('Đã nạp dữ liệu giả lập. Bạn có thể tự nhập thêm để xem biểu đồ thay đổi.');
      } catch (err) { setError(err.message); }
    };
    const coverageLabel = metric === 'sleep' ? 'đêm có thời lượng' : 'ngày có dữ liệu';
    const totalActivities = summary.points.reduce((sum, p) => sum + p.value, 0);
    const activeDays = summary.points.filter(p => p.value > 0).length;
    const inactiveDays = summary.points.filter(p => p.value === 0);
    const missingDays = days - summary.coverage;
    const isExternal = !['sleep', 'activity'].includes(metric);
    const sleepSummary = journal.summarize(records, 'sleep', end, days);
    const activitySummary = journal.summarize(records, 'activity', end, days);
    const sleepByDay = new Map(sleepSummary.points.map(point => [point.day, point.value]));
    const noActivityDays = activitySummary.points.filter(point => point.value === 0);
    const pairedDays = activitySummary.points.filter(point => sleepByDay.has(point.day)).length;
    const lastInactive = noActivityDays.at(-1);
    const followUp = Object.entries(metrics).filter(([key]) => !['sleep', 'activity'].includes(key))
      .map(([key, item]) => ({
        label: item.label,
        last: records.filter(row => row.metric === key && row.day <= end && row.value != null)
          .reduce((latest, row) => row.day > latest ? row.day : latest, '')
      }));
    return <section className="my-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-label="Nhật ký sức khỏe">
      <h2 className="text-xl font-bold">Nhật ký sức khỏe do người thân ghi</h2>
      <p className="mt-1 text-sm text-slate-600">Hồ sơ {elderId} · Bản trình diễn lưu trên trình duyệt này. Chỉ nhập dữ liệu giả lập.</p>
      <aside className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[16rem]">
            <p className="font-bold text-sky-950">💡 Hướng dẫn dành cho người thân</p>
            <p className="mt-1 text-slate-700">
              Đây là nhật ký sức khỏe do người thân tự ghi nhận sau khi hỏi thăm Ngoại (tách biệt với Huyết áp tự động từ Robot Myka).
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {missing.length
                ? `Hiện tại chưa có số liệu cho: ${missing.join(', ')}. Cần tối thiểu 1–2 ngày để vẽ biểu đồ và 3 ngày/tuần để so sánh xu hướng.`
                : 'Đã có dữ liệu ghi nhận giấc ngủ và vận động trong kỳ này.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!records.length ? (
              <button
                type="button"
                onClick={loadExamples}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 transition"
              >
                <span>✨ Nạp dữ liệu mẫu để thử</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Đặt lại nhật ký về trạng thái trống ban đầu để kiểm tra giao diện?')) {
                    localStorage.removeItem(storageKey);
                    setRecords([]);
                    setMessage('Đã đặt lại dữ liệu nhật ký về trạng thái ban đầu.');
                  }
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                <span>Đặt lại về trống</span>
              </button>
            )}
          </div>
        </div>
      </aside>
      <div className="my-4 flex flex-wrap gap-2" aria-label="Chọn chỉ số">
        {Object.entries(metrics).map(([key, item]) => <button key={key} type="button" aria-pressed={key === metric}
          onClick={() => { setMetric(key); clear(); setMessage(''); }}
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${key === metric ? 'bg-blue-700 text-white' : 'bg-white text-blue-900'}`}>
          {item.label}
        </button>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <form ref={formRef} onSubmit={save} className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-5 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">{editing ? 'Sửa ghi nhận' : 'Thêm ghi nhận'} {metrics[metric].label.toLocaleLowerCase('vi')}</h3>
            {editing && <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">Đang sửa</span>}
          </div>
          <label className="block">{metric === 'sleep' ? 'Ngày thức dậy' : isExternal ? 'Ngày đo' : 'Ngày hoạt động'}
            <input required type="date" max={end} className={fieldStyle} {...field('day')} />
          </label>
          {metric === 'sleep' && <>
            <p className="text-sm text-slate-700">Nguồn: Ngoại kể khi người thân hỏi thăm. Ghi giờ bắt đầu ngủ nếu Ngoại nhớ.</p>
            <label className="block">Cách ghi
              <select className={fieldStyle} {...field('sleepMode')}><option value="clock">Giờ ngủ và giờ thức</option><option value="duration">Thời lượng ước tính</option></select>
            </label>
            {draft.sleepMode === 'clock' ? <>
              <div className="grid grid-cols-2 gap-3">
                <label>Giờ bắt đầu ngủ<input type="time" className={fieldStyle} {...field('start')} /></label>
                <label>Giờ thức dậy<input type="time" className={fieldStyle} {...field('wake')} /></label>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={draft.previousDay}
                onChange={e => setDraft({ ...draft, previousDay: e.target.checked })} /> Bắt đầu ngủ từ hôm trước</label>
            </> : <label className="block">Thời lượng ước tính (giờ)<input required type="number" step="0.1" min="0.5" max="24" className={fieldStyle} placeholder="Ví dụ: 7 hoặc 7.5" {...field('duration')} /></label>}
          </>}
          {metric === 'activity' && <>
            <p className="text-sm text-slate-700">Nguồn: Ngoại kể khi người thân hỏi thăm.</p>
            <label className="block">Hoạt động<select className={fieldStyle} {...field('activity')}>{activities.map(a => <option key={a}>{a}</option>)}</select></label>
            {draft.activity !== 'Không vận động' && <label className="block">Thời lượng (phút, nếu biết)
              <input type="number" min="1" max="1440" className={fieldStyle} {...field('duration')} />
            </label>}
          </>}
          {isExternal && <>
            <p className="text-sm text-slate-700">Nhập theo kết quả đã nhận, kèm thời điểm đo và nguồn cung cấp.</p>
            <label className="block">Nguồn kết quả
              <input required maxLength="120" className={fieldStyle} placeholder={metric === 'weight' ? 'Ví dụ: cân tại nhà' : 'Ví dụ: kết quả bác sĩ cung cấp'} {...field('source')} />
            </label>
            <label className="block">Giờ đo<input required type="time" className={fieldStyle} {...field('measuredTime')} /></label>
            <label className="block">Giá trị ({metric === 'glucose' ? draft.unit : metrics[metric].unit})
              <input required inputMode="decimal" className={fieldStyle} {...field('value')} />
            </label>
            {metric === 'glucose' && <>
              <label className="block">Đơn vị trên kết quả<select className={fieldStyle} {...field('unit')}><option>mmol/L</option><option>mg/dL</option></select></label>
              <label className="block">Bối cảnh đo<select className={fieldStyle} {...field('context')}>{Object.entries(contextLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            </>}
          </>}
          <label className="block">Ghi chú<textarea className={fieldStyle} rows="2" maxLength="300" {...field('note')} /></label>
          <div className="flex flex-wrap gap-2"><button className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 transition shadow-sm">{editing ? 'Lưu thay đổi' : 'Lưu ghi nhận'}</button>
            {editing && <button type="button" onClick={clear} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition">Hủy sửa</button>}</div>
          {message && <p role="status" className="text-sm text-green-800">{message}</p>}
          {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
        </form>
        <div className="min-w-0 space-y-3">
          <h3 className="font-bold">{metrics[metric].label} trong {days} ngày</h3>
          {metric === 'glucose' && <div className="grid grid-cols-2 gap-2">
            <label>Đơn vị biểu đồ<select className={fieldStyle} value={unit} onChange={e => setUnit(e.target.value)}><option>mmol/L</option><option>mg/dL</option></select></label>
            <label>Bối cảnh biểu đồ<select className={fieldStyle} value={context} onChange={e => setContext(e.target.value)}><option value="all">Tất cả</option>{Object.entries(contextLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          </div>}
          {metric === 'activity' ? <div className="space-y-1 rounded-xl bg-blue-50 p-3 text-sm">
            <p className="font-bold text-blue-950">{activeDays} ngày có vận động · {totalActivities} lượt được ghi nhận</p>
            <p>{inactiveDays.length} ngày được ghi là không vận động{inactiveDays.length ? ` (${inactiveDays.map(p => dateLabel(p.day)).join(', ')})` : ''}. {missingDays} ngày chưa có ghi nhận.</p>
          </div> : <p className="text-sm text-slate-600">{isExternal
            ? summary.selected.length ? `${summary.selected.length} kết quả đã nhập theo bộ lọc hiện tại.` : 'Chưa có kết quả đã nhập theo bộ lọc hiện tại.'
            : `${summary.coverage}/${days} ${coverageLabel}.`}</p>}
          {metric !== 'activity' && summary.points.length > 0 && <dl className="grid grid-cols-3 gap-2 rounded-xl bg-blue-50 p-3 text-sm">
            {[
              ['Gần nhất', summary.latest],
              [metric === 'activity' ? 'TB/ngày có ghi' : 'Trung bình', summary.mean],
              ['Khoảng dao động', summary.points.length > 1 ? summary.spread : null]
            ].map(([label, value]) => <div key={label}>
              <dt className="text-slate-600">{label}</dt>
              <dd className="font-bold text-blue-950">{value == null || (mixedGlucose && label !== 'Gần nhất') ? '—' : `${format(value)} ${displayUnit}`}</dd>
            </div>)}
          </dl>}
          <Trend summary={summary} label={metrics[metric].label} days={days} unit={displayUnit} bar={metric === 'activity'} onLoadExamples={!records.length ? loadExamples : null} />
          {metric === 'sleep' && <SleepHighlight summary={summary} days={days} />}
          {metric === 'activity' ? <div className="space-y-1 text-sm text-slate-700">
            <p>Số 0 là ngày đã ghi không vận động. Ngày không có cột hoặc số 0 là ngày chưa ghi.</p>
            {!!inactiveDays.length && <p>Bạn có thể hỏi thăm Ngoại về {inactiveDays.length === 1 ? `ngày ${dateLabel(inactiveDays[0].day)}` : 'những ngày đã ghi không vận động'} để hiểu bối cảnh.</p>}
            <p>{missingDays === 0 && previous.coverage === days
              ? `Kỳ trước có ${previous.points.filter(p => p.value > 0).length} ngày có vận động, so với ${activeDays} ngày kỳ này.`
              : 'Cần ghi đủ ngày ở cả hai kỳ để so sánh số ngày có vận động.'}</p>
          </div> : <p className="text-sm text-slate-700">
            {mixedGlucose
              ? 'Chọn cùng bối cảnh đo để tính mức dao động và so sánh các kỳ đường huyết.'
              : summary.coverage >= 2 && previous.coverage >= 2
              ? `Trung bình kỳ này ${format(summary.mean)} ${displayUnit} (${summary.coverage} ngày có dữ liệu), kỳ trước ${format(previous.mean)} ${displayUnit} (${previous.coverage} ngày). Xem lại thời điểm và nguồn nếu thấy thay đổi.`
              : earlierPoint
                ? `Ghi nhận gần nhất ngày ${dateLabel(lastPoint.day)} là ${format(lastPoint.value)} ${displayUnit}, so với ${format(earlierPoint.value)} ${displayUnit} ngày ${dateLabel(earlierPoint.day)}. Chưa đủ dữ liệu để so sánh hai kỳ.`
                : 'Chưa đủ điểm đo để mô tả thay đổi.'}
            {' '}{isExternal ? 'Khoảng trống thể hiện ngày không có kết quả trong bộ lọc.' : 'Ngày chưa ghi được để trống.'}
          </p>}
          {!!summary.selected.length && <ul className="divide-y rounded-xl border border-slate-200">
            {summary.selected.slice().sort((a, b) => b.day.localeCompare(a.day) || (b.measuredTime || '').localeCompare(a.measuredTime || '')).map(r => <li key={r.id} className="flex items-start justify-between gap-3 p-3 text-sm">
              <div><p className="font-semibold">{dateLabel(r.day)} {r.measuredTime || ''} · {r.metric === 'activity' ?
                r.activity + (r.minutes == null ? '' : ` (${r.minutes} phút)`) : format(r.value) + (r.value == null ? '' : ` ${r.unit}`)}</p>
                <p className="text-slate-600">{r.recordedBy} ghi · {r.source}{r.metric === 'glucose' ? ` · ${contextLabels[r.context]}` : ''}</p>
                {r.metric === 'sleep' && r.start && r.wake && <p className="text-slate-600">
                  Ngủ {r.start}{r.previousDay ? ' hôm trước' : ''} · Thức {r.wake}
                </p>}
                {r.note && <p className="text-slate-600">{r.note}</p>}</div>
              <button type="button" className="font-semibold text-blue-700" onClick={() => edit(r)}>Sửa</button>
            </li>)}
          </ul>}
        </div>
      </div>
      <section className="mt-6 space-y-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-6" aria-label="Tổng kết chăm sóc">
        <h3 className="text-lg font-bold text-blue-950">Tổng kết chăm sóc · {days} ngày</h3>
        <p className="text-sm text-slate-700">{dateLabel(sleepSummary.begin)}–{dateLabel(end)} · Nhật ký người thân ghi</p>
        <p>{sleepSummary.coverage}/{days} ngày có thời lượng ngủ · {activitySummary.points.filter(p => p.value > 0).length} ngày có vận động · {pairedDays} ngày có cả hai ghi nhận.</p>
        {(sleepSummary.points.length > 0 || activitySummary.points.length > 0) && <div className="grid gap-3 xl:grid-cols-2">
          <article className="rounded-xl bg-white p-3">
            <h4 className="font-semibold">Giấc ngủ theo ngày thức dậy</h4>
            <Trend summary={sleepSummary} label="giấc ngủ" days={days} unit="giờ" onLoadExamples={!records.length ? loadExamples : null} />
            {metric !== 'sleep' && <SleepHighlight summary={sleepSummary} days={days} />}
          </article>
          <article className="rounded-xl bg-white p-3">
            <h4 className="font-semibold">Vận động theo ngày</h4>
            <Trend summary={activitySummary} label="vận động" days={days} unit="lượt" bar onLoadExamples={!records.length ? loadExamples : null} />
          </article>
        </div>}
        <p className="text-sm">Số 0 trên biểu đồ vận động là ngày đã ghi không vận động. Ngày chưa nhập được để trống.</p>
        <div className="rounded-xl bg-white p-4">
          <h4 className="font-semibold">Việc người thân có thể làm</h4>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
            <li>{lastInactive
              ? `Ngày ${dateLabel(lastInactive.day)} đã ghi 0 lượt vận động${sleepByDay.has(lastInactive.day) ? `, ngủ ${format(sleepByDay.get(lastInactive.day))} giờ` : ', chưa ghi thời lượng ngủ'}. Hỏi thêm Ngoại hôm đó sinh hoạt và cảm thấy thế nào.`
              : 'Khi hỏi thăm, có thể hỏi Ngoại dạo này ngủ thế nào và tâm trạng ra sao, rồi ghi lại điều Ngoại chia sẻ.'}</li>
            {followUp.map(({ label, last }) => <li key={label}>{label} · {last ? `Gần nhất ngày ${dateLabel(last)}` : 'Chưa có kết quả trong nhật ký'}. Có kết quả mới thì cập nhật kèm nguồn.</li>)}
          </ul>
        </div>
        <p className="text-sm text-slate-700">Tổng kết mô tả các ghi nhận hiện có. Nếu có số đo hoặc triệu chứng khiến bạn lo lắng, hãy trao đổi với bác sĩ và cung cấp thời điểm, giá trị cùng nguồn đo.</p>
      </section>
    </section>;
  };
})();
