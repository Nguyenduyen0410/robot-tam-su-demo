// Bank-transfer checkout with clearly marked, non-functional sample payment details.
(function () {
  function PaymentCheckout({ amount, purpose, cycleLabel, onClose }) {
    const [stage, setStage] = React.useState('transfer');
    const formattedAmount = Number(amount || 0).toLocaleString('vi-VN');
    return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-3 sm:p-5" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="myka-payment-title" className="w-full max-w-lg max-h-[94vh] overflow-y-auto rounded-[1.75rem] bg-[#fffefa] p-5 shadow-2xl sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold tracking-[.12em] text-blue-700">MYKA CARE · THANH TOÁN</p><h2 id="myka-payment-title" className="mt-1 text-xl font-extrabold text-slate-900">{stage === 'done' ? 'Thông tin thanh toán' : purpose}</h2><p className="mt-1 text-sm text-slate-500">{stage === 'done' ? 'Trạng thái giao dịch' : 'Chuyển khoản ngân hàng · gói Myka Care Companion'}</p></div>
          <button type="button" onClick={onClose} aria-label="Đóng thanh toán" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-xl text-slate-600 hover:bg-slate-50">×</button>
        </header>

        {stage === 'transfer' ? <>
          <article className="mt-5 rounded-2xl bg-gradient-to-br from-[#1f5ba7] to-[#4b86bd] p-4 text-white sm:p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-blue-100">{purpose === 'Đăng ký dịch vụ' ? 'SỐ TIỀN ĐĂNG KÝ' : 'SỐ TIỀN GIA HẠN'}</p><p className="mt-1 text-3xl font-extrabold">{formattedAmount} <span className="text-base">đ</span></p></div><span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold">{cycleLabel || 'Kỳ dịch vụ'}</span></div>
            <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-sm"><span className="text-blue-100">Dịch vụ</span><span className="text-right font-semibold">Myka Care Companion</span></div>
          </article>

          <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-950"><span className="material-symbols-rounded shrink-0 text-amber-700" aria-hidden="true">info</span><p><strong>Thông tin thanh toán mẫu.</strong> Số tài khoản và mã QR bên dưới chỉ để minh họa giao diện, không dùng để chuyển tiền thật.</p></div>

          <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
            <div className="space-y-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phương thức thanh toán</p><p className="mt-1 font-bold text-slate-900">Chuyển khoản ngân hàng</p><p className="text-xs text-slate-500">Thông tin nhận tiền và nội dung chuyển khoản.</p></div>
              <div><p className="text-xs text-slate-500">Ngân hàng nhận</p><p className="font-semibold text-slate-800">Vietcombank · mẫu</p></div>
              <div><p className="text-xs text-slate-500">Số tài khoản</p><p className="font-mono font-bold tracking-wide text-slate-900">0000 0000 0000</p></div>
              <div><p className="text-xs text-slate-500">Tên người nhận</p><p className="font-semibold text-slate-800">MYKA CARE DEMO</p></div>
              <div><p className="text-xs text-slate-500">Nội dung chuyển khoản</p><p className="font-mono font-semibold text-blue-800">MYKA E001 CARE</p></div>
            </div>
            <div className="mx-auto text-center"><div className="grid h-36 w-36 place-items-center rounded-2xl border border-slate-200 bg-white p-2" aria-label="Mã QR thanh toán minh họa">{(() => { const size = 21; const cells = []; for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const inFinder = (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7); let dark; if (inFinder) { const ox = x >= size - 7 ? x - (size - 7) : x; const oy = y >= size - 7 ? y - (size - 7) : y; dark = ox === 0 || ox === 6 || oy === 0 || oy === 6 || (ox >= 2 && ox <= 4 && oy >= 2 && oy <= 4); } else dark = ((x * 13 + y * 7 + x * y * 3) % 9) < 4; if (dark) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#12304a" />); } return <svg viewBox={`-1 -1 ${size + 2} ${size + 2}`} className="h-full w-full" role="img" aria-label="QR minh họa, không quét thanh toán">{cells}</svg>; })()}</div><p className="mt-2 text-xs font-semibold text-slate-600">QR minh họa</p></div>
          </div>
          <ol className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-3"><li className="rounded-xl bg-blue-50/70 p-3"><span className="font-bold text-blue-800">1.</span> Kiểm tra số tiền</li><li className="rounded-xl bg-blue-50/70 p-3"><span className="font-bold text-blue-800">2.</span> Xem thông tin thanh toán</li><li className="rounded-xl bg-blue-50/70 p-3"><span className="font-bold text-blue-800">3.</span> Chờ xác nhận giao dịch</li></ol>
          <footer className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700">Đóng</button><button type="button" onClick={() => setStage('done')} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-800">Đã chuyển khoản</button></footer>
        </> : <>
          <div role="status" className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-blue-700"><span className="material-symbols-rounded text-3xl" aria-hidden="true">hourglass_top</span></span><h3 className="mt-3 text-lg font-extrabold text-slate-900">Đang chờ xác nhận thanh toán</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">Giao dịch chưa được ngân hàng xác nhận. Trạng thái hóa đơn sẽ cập nhật sau khi hệ thống nhận được xác nhận thanh toán.</p></div>
          <button type="button" onClick={onClose} className="mt-5 w-full rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800">Quay lại gói dịch vụ</button>
        </>}
      </section>
    </div>;
  }
  window.PaymentCheckout = PaymentCheckout;
})();
