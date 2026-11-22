(function (root) {
  const metrics = {
    sleep: { label: 'Giấc ngủ', unit: 'giờ' },
    activity: { label: 'Vận động', unit: 'lượt' },
    glucose: { label: 'Đường huyết', unit: 'mmol/L' },
    spo2: { label: 'SpO₂', unit: '%' },
    weight: { label: 'Cân nặng', unit: 'kg' }
  };
  const activities = ['Đi dạo', 'Thăm hàng xóm', 'Tưới cây', 'Khác', 'Không vận động'];
  const dayMs = 86400000;
  const today = (now = new Date()) => new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now);
  const dayAt = (end, offset) => new Date(Date.parse(end) + offset * dayMs).toISOString().slice(0, 10);
  const number = (value, min, max, message) => {
    const n = String(value ?? '').trim() === '' ? NaN : Number(String(value).replace(',', '.'));
    if (!Number.isFinite(n) || n < min || n > max) throw new Error(message);
    return n;
  };
  const clock = value => {
    const parts = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
    if (!parts) throw new Error('Vui lòng kiểm tra giờ ngủ và giờ thức.');
    return Number(parts[1]) * 60 + Number(parts[2]);
  };

  function create(metric, input, id, end = today()) {
    const day = input.day;
    const time = Date.parse(day);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(time) ||
        new Date(time).toISOString().slice(0, 10) !== day || day > end) {
      throw new Error('Nhập ngày ghi nhận hợp lệ và không ở tương lai.');
    }
    if (!Object.hasOwn(metrics, metric)) throw new Error('Chỉ số không hợp lệ.');
    const note = (input.note || '').trim();
    const record = { id, metric, day, recordedBy: 'Người thân', note, unit: metrics[metric].unit };

    if (metric === 'sleep') {
      const { start, wake, previousDay, duration } = input;
      let minutes = null;
      if (input.sleepMode === 'clock' && start && wake) {
        const diff = clock(wake) - clock(start) + (previousDay ? 1440 : 0);
        if (diff <= 0 || diff > 1440) throw new Error('Kiểm tra giờ thức và lựa chọn ngủ từ hôm trước.');
        minutes = diff;
      } else if (input.sleepMode === 'duration') {
        minutes = Math.round(number(duration, 1, 1440, 'Nhập thời lượng từ 1 đến 1.440 phút.'));
      } else if (!note) {
        throw new Error('Nếu thiếu giờ, hãy ghi lại điều Ngoại kể trong phần ghi chú.');
      }
      return { ...record, source: 'Ngoại kể khi người thân hỏi thăm', value: minutes === null ? null : minutes / 60,
        start: input.sleepMode === 'clock' ? start : '', wake: input.sleepMode === 'clock' ? wake : '',
        previousDay, sleepMode: input.sleepMode, duration };
    }

    if (metric === 'activity') {
      const activity = input.activity;
      if (!activities.includes(activity) || (activity === 'Khác' && !note)) {
        throw new Error('Chọn hoạt động hoặc mô tả hoạt động khác trong ghi chú.');
      }
      const none = activity === 'Không vận động';
      const minutes = none || input.duration === '' ? null :
        number(input.duration, 1, 1440, 'Số phút vận động phải từ 1 đến 1.440.');
      return { ...record, source: 'Ngoại kể khi người thân hỏi thăm', activity, minutes, value: none ? 0 : 1 };
    }

    const source = (input.source || '').trim();
    if (!source) throw new Error('Nhập tên thiết bị, bác sĩ hoặc cơ sở cung cấp kết quả.');
    if (!input.measuredTime) throw new Error('Nhập giờ đo theo kết quả được cung cấp.');
    clock(input.measuredTime);
    if (!['fasting', 'after_meal', 'unknown'].includes(input.context)) throw new Error('Bối cảnh đo không hợp lệ.');
    const unit = metric === 'glucose' && input.unit === 'mg/dL' ? 'mg/dL' : record.unit;
    return { ...record, unit, source, measuredTime: input.measuredTime, context: input.context,
      value: number(input.value, metric === 'spo2' ? 0 : 0.01, metric === 'spo2' ? 100 : Number.MAX_SAFE_INTEGER,
        'Nhập giá trị đo hợp lệ theo đơn vị đã chọn.') };
  }

  function save(records, entry) {
    const others = records.filter(r => r.id !== entry.id);
    const same = r => r.day === entry.day && r.metric === entry.metric;
    if (entry.metric === 'sleep' && others.some(same)) throw new Error('Ngày này đã có giấc ngủ. Hãy chỉnh bản ghi đã lưu.');
    if (entry.metric === 'activity' && others.some(r => same(r) && (r.value === 0 || entry.value === 0))) {
      throw new Error('Không thể ghi “Không vận động” cùng với hoạt động đã ghi trong ngày.');
    }
    return [...others, entry];
  }

  function summarize(records, metric, end, days, unit, context) {
    const begin = dayAt(end, 1 - days);
    const selected = records.filter(r => r.metric === metric && r.day >= begin && r.day <= end &&
      (metric !== 'glucose' || (r.unit === unit && (context === 'all' || r.context === context))));
    const points = [];
    for (let i = 0; i < days; i++) {
      const day = dayAt(begin, i);
      const measured = selected.filter(r => r.day === day && r.value !== null);
      if (metric === 'activity' && measured.length) {
        points.push({ day, value: measured.reduce((n, r) => n + r.value, 0) });
      } else {
        points.push(...measured.map(r => ({ day, value: r.value, time: r.measuredTime })));
      }
    }
    points.sort((a, b) => a.day.localeCompare(b.day) || (a.time || '').localeCompare(b.time || ''));
    const values = points.map(p => p.value);
    return {
      begin, selected, points, coverage: new Set(points.map(p => p.day)).size,
      latest: values.at(-1) ?? null,
      mean: values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : null,
      spread: values.length >= 2 ? Math.max(...values) - Math.min(...values) : null
    };
  }

  function summarizeVitals(readings) {
    const daily = new Map();
    for (const row of readings) {
      const date = new Date(row.timestamp);
      if (!Number.isFinite(date.getTime())) continue;
      const day = today(date);
      const bucket = daily.get(day) || { systolic: [], diastolic: [], pulse: [] };
      const values = { systolic: row.systolic, diastolic: row.diastolic, pulse: row.heart_rate ?? row.heartRate };
      for (const [key, value] of Object.entries(values)) {
        if (value != null && String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) > 0) {
          bucket[key].push(Number(value));
        }
      }
      daily.set(day, bucket);
    }
    return [...daily.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, bucket]) => ({
      day,
      ...Object.fromEntries(Object.entries(bucket).map(([key, values]) =>
        [key, values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : null]))
    })).filter(row => Object.keys(row).some(key => key !== 'day' && row[key] !== null));
  }

  function examples(end) {
    return [6, 4, 2].flatMap((offset, i) => {
      const day = dayAt(end, -offset);
      const shared = { day, note: 'Dữ liệu giả lập', duration: '', measuredTime: '08:00',
        source: 'Phiếu kết quả giả lập', context: 'fasting' };
      return [
        ['sleep', { sleepMode: 'duration', duration: [390, 435, 420][i] }],
        ['activity', { activity: ['Đi dạo', 'Tưới cây', 'Thăm hàng xóm'][i] }],
        ['glucose', { value: [5.7, 6.3, 6.0][i], unit: 'mmol/L' }],
        ['spo2', { value: [97, 98, 96][i] }],
        ['weight', { value: [55, 55.4, 55.2][i] }]
      ].map(([metric, value]) => create(metric, { ...shared, ...value }, `sample-${metric}-${day}`, end));
    });
  }
  root.MykaCareJournal = { metrics, activities, today, dayAt, create, save, summarize, summarizeVitals, examples };
})(typeof module === 'object' ? module.exports : window);
