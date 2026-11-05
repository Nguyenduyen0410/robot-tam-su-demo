// Nominal demo delivery: one persisted alarm per scheduled measurement.
// The API records actual receipt time; late alarms/retries are never backdated.
export function nextDelivery(nowMs) {
  const localDate = new Date(nowMs + 7 * 3600000).toISOString().slice(0, 10);
  const candidates = [];
  for (let day = 0; day < 2; day++) {
    const date = new Date(Date.parse(`${localDate}T00:00:00Z`) + day * 86400000).toISOString().slice(0, 10);
    for (const [slot, hour] of [['morning', '09'], ['evening', '19']]) {
      const measuredAt = Date.parse(`${date}T${hour}:00:00+07:00`);
      // Leave up to five seconds for the API trip; this is a demo target, not an SLA.
      const delaySeconds = 20 + ((Math.floor(measuredAt / 86400000) + (slot === 'evening' ? 7 : 0)) % 11);
      const dueAt = measuredAt + delaySeconds * 1000;
      if (dueAt > nowMs) candidates.push({ slot, measuredAt, dueAt, delaySeconds, attempt: 0 });
    }
  }
  return candidates.sort((a, b) => a.dueAt - b.dueAt)[0];
}

export class BpClock {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }
  async fetch(request = new Request('https://scheduler.internal/arm')) {
    const path = new URL(request.url).pathname;
    if (path === '/status') return Response.json({ pending: await this.ctx.storage.get('pending'), last_delivery: await this.ctx.storage.get('last_delivery'), last_failure: await this.ctx.storage.get('last_failure') });
    if (path === '/probe') {
      const job = await request.json();
      await this.ctx.storage.put('pending', job);
      await this.ctx.storage.setAlarm(job.dueAt);
      return Response.json({ armed: true, job });
    }
    // Cron initializes/repairs missing alarms without postponing an existing one.
    if (await this.ctx.storage.getAlarm() === null) {
      const pending = await this.ctx.storage.get('pending');
      const job = pending && Date.now() - pending.measuredAt < 3600000 ? pending : nextDelivery(Date.now());
      await this.ctx.storage.put('pending', job);
      await this.ctx.storage.setAlarm(Math.max(Date.now() + 1000, job.dueAt));
    }
    return Response.json({ armed: true, next_alarm: await this.ctx.storage.getAlarm() });
  }
  async alarm() {
    const job = await this.ctx.storage.get('pending');
    if (!job) { await this.fetch(); return; }
    try {
      if (Date.now() < job.dueAt) {
        await this.ctx.storage.setAlarm(job.dueAt);
        return;
      }
      if (Date.now() - job.measuredAt >= 3600000) throw new Error('delivery_window_expired');
      const url = job.kind === 'probe'
        ? `${this.env.API_BASE}/api/device/bp-record/E-TIMING-TEST`
        : `${this.env.API_BASE}/api/demo-scheduler/tick/E001?slot=${job.slot}`;
      const response = await fetch(url, {
        method: 'POST', headers: { Origin: this.env.API_BASE, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
        ...(job.kind === 'probe' ? { body: JSON.stringify({ systolic: 120, diastolic: 78, heart_rate: 72, measured_at: new Date(job.measuredAt).toISOString(), note: `TIMING-VERIFY-E12:${job.id}` }) } : {}),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(`delivery_http_${response.status}`);
      if (result.reason === 'outside_schedule_window') throw new Error('clock_before_measurement');
      const receipt = result.reading?.received_at;
      await this.ctx.storage.put('last_delivery', {
        ...job, completed_at: new Date().toISOString(), result,
        latency_seconds: receipt ? (Date.parse(receipt) - job.measuredAt) / 1000 : null,
      });
    } catch (error) {
      const failure = { ...job, failed_at: new Date().toISOString(), error: String(error) };
      await this.ctx.storage.put('last_failure', failure);
      if (Date.now() - job.measuredAt < 3600000) {
        const retry = { ...job, attempt: job.attempt + 1 };
        await this.ctx.storage.put('pending', retry);
        await this.ctx.storage.setAlarm(Date.now() + Math.min(30000, 5000 * 2 ** Math.min(retry.attempt, 3)));
        return;
      }
    }
    if (job.kind === 'probe') { await this.ctx.storage.delete('pending'); return; }
    const next = nextDelivery(Date.now());
    await this.ctx.storage.put('pending', next);
    await this.ctx.storage.setAlarm(next.dueAt);
  }
}

export default {
  async scheduled(_event, env, ctx) {
    const clock = env.CLOCK.get(env.CLOCK.idFromName('E001-v1'));
    ctx.waitUntil(clock.fetch('https://scheduler.internal/arm'));
  },
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/_verify') {
      if (!env.PROBE_TOKEN || request.headers.get('Authorization') !== `Bearer ${env.PROBE_TOKEN}`) return new Response('Not found', { status: 404 });
      if (request.method === 'POST') {
        const { delay_seconds: delaySeconds } = await request.json();
        if (![20, 25, 30].includes(delaySeconds)) return new Response('Invalid probe delay', { status: 422 });
        const id = `probe-${crypto.randomUUID()}`, measuredAt = Date.now();
        const job = { id, kind: 'probe', measuredAt, dueAt: measuredAt + delaySeconds * 1000, delaySeconds, attempt: 0 };
        const clock = env.CLOCK.get(env.CLOCK.idFromName(id));
        return clock.fetch(new Request('https://scheduler.internal/probe', { method: 'POST', body: JSON.stringify(job) }));
      }
      const id = url.searchParams.get('id');
      if (!/^probe-[a-f0-9-]{36}$/.test(id || '')) return new Response('Invalid probe id', { status: 422 });
      return env.CLOCK.get(env.CLOCK.idFromName(id)).fetch('https://scheduler.internal/status');
    }
    return Response.json({ service: 'myka-bp-scheduler', mode: 'synthetic', nominal_delay_seconds: [20, 35] });
  },
};
