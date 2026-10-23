// Safe demo checkout: returns an internal mock deep link; no real transaction is created.
(function () {
  function PaymentCheckout({ amount, onClose }) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [checkout, setCheckout] = React.useState(null);
    const [showCheckoutView, setShowCheckoutView] = React.useState(false);
    const handlePayment = async () => {
      setIsLoading(true); setCheckout(null);
      try {
        // Simulate the latency of requesting a payment URL from a provider API.
        await new Promise(resolve => setTimeout(resolve, 700));
        setCheckout({ url: `myka-demo://checkout?amount=${encodeURIComponent(amount)}`, amount, demo: true });
      } finally { setIsLoading(false); }
    };
    return <div className="fixed inset-0 z-50 bg-slate-900/40 p-4 grid place-items-center" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><div className="flex justify-between"><div><p className="text-sm font-semibold text-violet-700">THANH TOÁN MYKA</p><h2 className="text-xl font-bold mt-1">{Number(amount).toLocaleString('vi-VN')} đ</h2></div><button onClick={onClose} aria-label="Đóng" className="rounded-full border w-9 h-9">×</button></div>{isLoading ? <div className="py-9 text-center"><span className="inline-block w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full spinner"/><p className="text-sm text-slate-600 mt-3">Đang tạo yêu cầu thanh toán…</p></div> : checkout ? <div className="mt-5"><div role="status" className="rounded-2xl bg-amber-50 border border-amber-200 p-4"><p className="font-bold text-amber-900">Chế độ demo — chưa phát sinh giao dịch</p><p className="text-sm text-amber-800 mt-2">API giả lập trả về deep link mẫu. Chưa cấu hình cổng thanh toán/ngân hàng; trạng thái hóa đơn không thay đổi.</p><code className="block text-xs break-all mt-2">{checkout.url}</code></div>{showCheckoutView && <div className="mt-3 rounded-2xl border bg-slate-50 p-5 text-center"><div className="mx-auto w-20 h-20 rounded-xl bg-white border-4 border-dashed border-violet-300 grid place-items-center text-3xl">▦</div><p className="font-bold mt-3">Myka Demo Checkout</p><p className="text-sm text-slate-600 mt-1">{Number(amount).toLocaleString('vi-VN')} đ</p><p className="text-xs text-slate-500 mt-2">Màn hình WebView minh họa · không thể dùng để thanh toán.</p></div>}</div> : <p className="text-sm text-slate-600 mt-4">Tạo yêu cầu thử nghiệm để xem luồng checkout.</p>}<div className="flex justify-end gap-2 mt-5"><button onClick={onClose} className="rounded-xl border px-4 py-2">Đóng</button>{checkout ? <button onClick={() => setShowCheckoutView(true)} className="rounded-xl bg-violet-600 text-white px-5 py-2 font-bold">Mở checkout demo</button> : <button disabled={isLoading} onClick={handlePayment} className="rounded-xl bg-violet-600 text-white px-5 py-2 font-bold disabled:opacity-60">{isLoading ? 'Đang xử lý…' : 'Tạo yêu cầu demo'}</button>}</div></section></div>;
  }
  window.PaymentCheckout = PaymentCheckout;
})();
