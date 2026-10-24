// Bank-transfer checkout. Payment details are unavailable until a receiving account is configured.
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

          <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-950"><span className="material-symbols-rounded shrink-0 text-amber-700" aria-hidden="true">info</span><p><strong>Tài khoản nhận tiền chưa được kết nối với ngân hàng.</strong> Hiện chưa thể nhận hoặc xác nhận giao dịch chuyển khoản.</p></div>

          <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
            <div className="space-y-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phương thức thanh toán</p><p className="mt-1 font-bold text-slate-900">Chuyển khoản ngân hàng</p><p className="text-xs text-slate-500">Thông tin tài khoản nhận tiền sẽ hiển thị tại đây.</p></div>
              <div><p className="text-xs text-slate-500">Ngân hàng nhận</p><p className="font-semibold text-slate-800">Chưa cấu hình</p></div>
              <div><p className="text-xs text-slate-500">Số tài khoản</p><p className="font-semibold text-slate-800">Chưa cấu hình</p></div>
              <div><p className="text-xs text-slate-500">Tên người nhận</p><p className="font-semibold text-slate-800">Chưa cấu hình</p></div>
            </div>
            <div className="mx-auto grid h-36 w-36 place-items-center rounded-2xl bg-blue-50 text-blue-700"><span className="material-symbols-rounded text-5xl" aria-hidden="true">account_balance</span></div>
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
