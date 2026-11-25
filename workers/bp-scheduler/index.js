// Retired: 09:00/19:00 are caregiver reminders, never measurement timestamps.
// Keep the durable-object class exported so an existing Cloudflare binding can deploy safely.
export class BpClock {
  constructor(ctx) { this.ctx = ctx; }
  async fetch() {
    return Response.json({ enabled: false, reason: 'measurement_scheduler_retired' });
  }
  async alarm() {
    await this.ctx.storage.delete('pending');
    await this.ctx.storage.deleteAlarm();
  }
}

export default {
  async scheduled() {
    return;
  },
  async fetch() {
    return Response.json({ service: 'myka-bp-scheduler', enabled: false, reason: '09:00/19:00 are caregiver reminders, not measurement times.' }, { status: 410 });
  },
};
