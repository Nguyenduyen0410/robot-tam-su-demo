// Wi-Fi picker. Nearby-network scanning requires device/gateway support.
(function () {
  function WifiNetworkPicker({ currentSsid, onSaved, demoMode = false, initialSsid = '', initialPassword = '' }) {
    const [networks, setNetworks] = React.useState(demoMode ? [{ ssid: initialSsid, signal: 92 }] : []);
    const [selected, setSelected] = React.useState(demoMode ? initialSsid : '');
    const [password, setPassword] = React.useState(demoMode ? initialPassword : '');
    const [showPassword, setShowPassword] = React.useState(demoMode);
    const [scanning, setScanning] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const scan = () => {
      setScanning(true); setMessage('');
      // These are sample access points; web browsers cannot enumerate nearby Wi-Fi networks.
      window.setTimeout(() => {
        setNetworks([{ ssid: 'Myka-Home-2.4G', signal: 92 }, { ssid: 'Home-WiFi', signal: 76 }, { ssid: 'Guest-Network', signal: 54 }]);
        setScanning(false);
        setMessage('Để quét mạng Wi-Fi xung quanh, cần gateway Myka hoặc ứng dụng được cấp quyền.');
      }, 450);
    };
    const submit = async event => {
      event.preventDefault();
      if (!selected) return;
      setSaving(true); setMessage('');
      try {
        await onSaved({ ssid: selected, password });
        setMessage(demoMode ? `Đã hoàn tất bước kết nối mạng “${selected}”.` : `Đã gửi cấu hình Wi-Fi cho “${selected}”. Mật khẩu không được lưu.`);
        setShowPassword(false); setPassword('');
      } catch (error) { setMessage(error.message || 'Không lưu được cấu hình Wi-Fi.'); }
      finally { setSaving(false); }
    };
    return <article className="bg-white border border-slate-200 rounded-xl p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Cập nhật Wi-Fi</h3><p className="text-sm text-slate-500 mt-1">Mạng hiện tại: {currentSsid || 'Chưa cấu hình'}</p></div>{!demoMode && <button type="button" onClick={scan} disabled={scanning} className="rounded-lg bg-blue-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60">{scanning ? 'Đang quét…' : 'Quét mạng Wi-Fi'}</button>}</div>{!demoMode && <p className="text-xs text-amber-800 bg-amber-50 rounded-lg p-3 mt-3">Trình duyệt web không thể quét Wi-Fi xung quanh. Để tìm mạng thật, cần gateway Myka hoặc ứng dụng được cấp quyền.</p>}{networks.length > 0 && <div className="space-y-2 mt-3">{networks.map(network => <button type="button" key={network.ssid} onClick={() => { setSelected(network.ssid); setPassword(demoMode ? initialPassword : ''); setShowPassword(true); setMessage(''); }} className={`w-full rounded-xl border p-3 text-left flex justify-between items-center ${selected === network.ssid ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}><span>📶 {network.ssid}{network.ssid === currentSsid && <small className="ml-2 text-emerald-700">Đang dùng</small>}</span><span className="text-sm text-slate-500">{network.signal}%</span></button>)}</div>}{showPassword && <form onSubmit={submit} className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4"><label className="block text-sm font-semibold">Mật khẩu Wi-Fi · {selected}<input type="password" required autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Nhập mật khẩu mạng đã chọn" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal" /></label><button disabled={saving} className="mt-3 w-full rounded-xl bg-blue-700 py-3 font-bold text-white disabled:opacity-60">{saving ? 'Đang lưu…' : 'Kết nối mạng đã chọn'}</button></form>}{message && <p role="status" className="text-sm text-blue-800 mt-3">{message}</p>}</article>;
  }
  window.WifiNetworkPicker = WifiNetworkPicker;
})();
