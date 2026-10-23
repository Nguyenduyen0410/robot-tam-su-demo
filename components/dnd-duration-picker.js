// Custom hour/minute picker for Do Not Disturb.
(function () {
  function DndDurationPicker({ onSelect }) {
    const [open, setOpen] = React.useState(false);
    const [hours, setHours] = React.useState(2);
    const [minutes, setMinutes] = React.useState(0);
    const options = Array.from({ length: 24 }, (_, index) => index + 1);
    const apply = () => { onSelect(hours, minutes); setOpen(false); };
    return <><button type="button" onClick={() => setOpen(true)} className="rounded-xl border border-violet-300 px-4 py-3 font-semibold text-violet-800 hover:bg-violet-50">Tùy chọn thời lượng…</button>{open && <div className="fixed inset-0 z-50 bg-slate-900/40 p-4 grid place-items-end sm:place-items-center" onMouseDown={e => e.target === e.currentTarget && setOpen(false)}><section className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl"><p className="text-sm font-semibold text-violet-700">KHÔNG LÀM PHIỀN</p><h2 className="text-xl font-bold mt-1">Chọn thời lượng</h2><div className="grid grid-cols-2 gap-4 mt-5"><label className="text-sm font-semibold">Giờ<select size="5" value={hours} onChange={e => setHours(Number(e.target.value))} className="block w-full rounded-xl border mt-2 p-2">{options.map(hour => <option key={hour} value={hour}>{hour} giờ</option>)}</select></label><label className="text-sm font-semibold">Phút<select size="5" value={minutes} onChange={e => setMinutes(Number(e.target.value))} className="block w-full rounded-xl border mt-2 p-2">{[0, 15, 30, 45].map(minute => <option key={minute} value={minute}>{minute} phút</option>)}</select></label></div><div className="flex justify-end gap-2 mt-5"><button onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2">Hủy</button><button onClick={apply} className="rounded-xl bg-violet-600 text-white px-5 py-2 font-bold">Áp dụng</button></div></section></div>}</>;
  }
  window.DndDurationPicker = DndDurationPicker;
})();
