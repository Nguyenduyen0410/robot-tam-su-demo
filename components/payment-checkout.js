// Safe demo checkout: illustrates a bank-transfer flow without accepting or recording real payments.
(function () {
  function DemoTransferArt() {
    const size = 21;
    const cells = [];
    const inFinder = (x, y, left, top) => x >= left && x < left + 7 && y >= top && y < top + 7;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const finder = [[0, 0], [14, 0], [0, 14]].find(([left, top]) => inFinder(x, y, left, top));
        let dark;
        if (finder) {
          const [left, top] = finder;
          const dx = x - left, dy = y - top;
          dark = dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
        } else {
          dark = ((x * 7 + y * 11 + x * y * 3) % 9) < 4;
        }
        if (dark) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" rx=".12" />);
      }
    }
    return <svg viewBox="-1 -1 23 23" role="img" aria-label="Hình QR minh họa, không dùng để chuyển khoản" className="h-36 w-36 rounded-xl bg-white p-2 text-[#173f68]">{cells}</svg>;
  }

  function PaymentCheckout({ amount, purpose, cycleLabel, onClose }) {
    const [stage, setStage] = React.useState('transfer');
    const [copied, setCopied] = React.useState('');
    const demoCode = `MYKA-DEMO-${purpose === 'Đăng ký dịch vụ' ? 'DK' : 'GH'}-E001`;
    const formattedAmount = Number(amount || 0).toLocaleString('vi-VN');
    const copyText = async (value, label) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(label);
        window.setTimeout(() => setCopied(''), 1800);
      } catch (_) {
        setCopied('Không thể sao chép trên trình duyệt này');
        window.setTimeout(() => setCopied(''), 2400);
      }
    };
    return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-3 sm:p-5" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="myka-payment-title" className="w-full max-w-lg max-h-[94vh] overflow-y-auto rounded-[1.75rem] bg-[#fffefa] p-5 shadow-2xl sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold tracking-[.12em] text-blue-700">MYKA CARE · THANH TOÁN</p><h2 id="myka-payment-title" className="mt-1 text-xl font-extrabold text-slate-900">{stage === 'done' ? 'Hoàn tất bước demo' : purpose}</h2><p className="mt-1 text-sm text-slate-500">{stage === 'done' ? 'Màn hình minh họa đã kết thúc.' : 'Chuyển khoản ngân hàng · gói Myka Care Companion'}</p></div>
          <button type="button" onClick={onClose} aria-label="Đóng thanh toán" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-xl text-slate-600 hover:bg-slate-50">×</button>
        </header>

        {stage === 'transfer' ? <>
          <article className="mt-5 rounded-2xl bg-gradient-to-br from-[#1f5ba7] to-[#4b86bd] p-4 text-white sm:p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-blue-100">{purpose === 'Đăng ký dịch vụ' ? 'SỐ TIỀN ĐĂNG KÝ' : 'SỐ TIỀN GIA HẠN'}</p><p className="mt-1 text-3xl font-extrabold">{formattedAmount} <span className="text-base">đ</span></p></div><span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold">{cycleLabel || 'Kỳ dịch vụ'}</span></div>
            <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-sm"><span className="text-blue-100">Dịch vụ</span><span className="text-right font-semibold">Myka Care Companion</span></div>
          </article>

          <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-950"><span className="material-symbols-rounded shrink-0 text-amber-700" aria-hidden="true">info</span><p><strong>Thông tin hoàn toàn giả lập.</strong> Không chuyển tiền thật, không quét QR này. Bước demo không thay đổi trạng thái hóa đơn.</p></div>

          <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
            <div className="space-y-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ngân hàng nhận (demo)</p><p className="mt-1 font-bold text-slate-900">MYKA DEMO BANK</p><p className="text-xs text-slate-500">Tài khoản minh họa · không tồn tại</p></div>
              <div className="flex items-center justify-between gap-2"><div><p className="text-xs text-slate-500">Số tài khoản demo</p><p className="font-bold tracking-wide text-blue-900">DEMO-0001</p></div><button type="button" onClick={() => copyText('DEMO-0001', 'Đã sao chép số demo')} className="rounded-lg border border-blue-100 px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-50">Sao chép</button></div>
              <div><p className="text-xs text-slate-500">Tên người nhận</p><p className="font-semibold text-slate-800">MYKA DEMO · KHÔNG GIAO DỊCH</p></div>
              <div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-xs text-slate-500">Nội dung chuyển khoản</p><p className="truncate font-bold text-slate-800">{demoCode}</p></div><button type="button" onClick={() => copyText(demoCode, 'Đã sao chép mã demo')} className="shrink-0 rounded-lg border border-blue-100 px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-50">Sao chép</button></div>
            </div>
            <div className="mx-auto text-center"><DemoTransferArt /><p className="mt-2 text-[11px] font-bold text-slate-600">QR MINH HỌA · KHÔNG QUÉT</p></div>
          </div>
          <p aria-live="polite" className="mt-2 min-h-5 text-center text-xs font-semibold text-blue-800">{copied}</p>
          <ol className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-3"><li className="rounded-xl bg-blue-50/70 p-3"><span className="font-bold text-blue-800">1.</span> Xem thông tin demo</li><li className="rounded-xl bg-blue-50/70 p-3"><span className="font-bold text-blue-800">2.</span> Kiểm tra số tiền và mã</li><li className="rounded-xl bg-blue-50/70 p-3"><span className="font-bold text-blue-800">3.</span> Kết thúc bước thử nghiệm</li></ol>
          <footer className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700">Đóng</button><button type="button" onClick={() => setStage('done')} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-800">Hoàn tất bước demo</button></footer>
        </> : <>
          <div role="status" className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-blue-700"><span className="material-symbols-rounded text-3xl" aria-hidden="true">task_alt</span></span><h3 className="mt-3 text-lg font-extrabold text-slate-900">Bạn đã xem xong luồng thanh toán</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">Đây chỉ là thao tác demo. Không có giao dịch nào được gửi; hóa đơn vẫn giữ nguyên trạng thái hiện tại.</p><p className="mt-3 rounded-xl bg-white p-3 text-sm font-bold text-blue-900">Mã tham chiếu minh họa: {demoCode}</p></div>
          <button type="button" onClick={onClose} className="mt-5 w-full rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800">Quay lại gói dịch vụ</button>
        </>}
      </section>
    </div>;
  }
  window.PaymentCheckout = PaymentCheckout;
})();
