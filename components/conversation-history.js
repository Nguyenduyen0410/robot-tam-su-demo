// Scrollable Messenger-style conversation history grouped by day.
(function () {
  function ConversationHistory({ messages, loading, error, robotName }) {
    const listRef = React.useRef(null);
    const groups = React.useMemo(() => {
      const map = new Map();
      (messages || []).forEach(message => {
        const day = String(message.timestamp).slice(0, 10);
        if (!map.has(day)) map.set(day, []);
        map.get(day).push(message);
      });
      return [...map.entries()];
    }, [messages]);
    const scrollToDay = day => {
      document.getElementById(`conversation-day-${day}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    React.useEffect(() => {
      if (groups.length) document.getElementById(`conversation-day-${groups[0][0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [groups]);
    return <div>
      {groups.length > 1 && <div className="flex gap-2 overflow-x-auto pb-3 mb-2">{groups.map(([day]) => <button key={day} onClick={() => scrollToDay(day)} className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800">{new Date(`${day}T12:00:00`).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}</button>)}</div>}
      <div ref={listRef} className="max-h-[65vh] min-h-48 overflow-y-auto overscroll-contain rounded-2xl bg-slate-50 p-3 sm:p-5 scrollbar-thin">
        {loading ? <p className="py-10 text-center text-sm text-slate-500">Đang tải nhật ký…</p>
          : error ? <p role="status" className="py-10 text-center text-sm text-rose-700">{error}</p>
            : groups.length ? groups.map(([day, dayMessages]) => <section key={day} id={`conversation-day-${day}`} className="scroll-mt-3"><div className="sticky top-0 z-10 flex justify-center py-2"><span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">{new Date(`${day}T12:00:00`).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div><ol className="space-y-3 pb-4">{dayMessages.map(message => { const fromElder = message.speaker === 'elder'; return <li key={message.id} className={`flex ${fromElder ? 'justify-start' : 'justify-end'}`}><article className={`max-w-[92%] sm:max-w-[78%] min-w-24 rounded-2xl px-4 py-3 shadow-sm ${fromElder ? 'bg-white text-slate-800 rounded-tl-sm' : 'bg-violet-600 text-white rounded-tr-sm'}`}><div className={`flex flex-wrap items-center gap-2 mb-1 ${fromElder ? '' : 'justify-end'}`}><span className="text-xs font-bold">{fromElder ? 'Ngoại · Bà Hoa' : robotName?.trim() || 'Myka · con'}</span><time className={`text-[11px] ${fromElder ? 'text-slate-500' : 'text-violet-100'}`}>{new Date(message.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</time>{message.review_flag === 'family_followup' && <span className="text-[11px] rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">Gia đình xem lại</span>}</div><p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.message_text}</p></article></li>; })}</ol></section>)
              : <p className="py-10 text-center text-sm text-slate-500">Ngày này chưa có bản ghi trò chuyện.</p>}
      </div>
    </div>;
  }
  window.ConversationHistory = ConversationHistory;
})();
