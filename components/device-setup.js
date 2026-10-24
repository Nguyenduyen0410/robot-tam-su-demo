// Guided onboarding for pairing the Myka device.
(function () {
  function DeviceSetupScreen({ apiUrl, onPaired, demoMode = false }) {
    const [step, setStep] = React.useState(0);
    const [serial, setSerial] = React.useState(demoMode ? 'MYKA-0001' : '');
    const [deviceName, setDeviceName] = React.useState(demoMode ? 'Myka Care BP-01' : 'Máy đo Myka');
    const [wifiSaved, setWifiSaved] = React.useState(false);
    const [cameraOn, setCameraOn] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const videoRef = React.useRef(null);
    const streamRef = React.useRef(null);

    React.useEffect(() => () => streamRef.current?.getTracks().forEach(track => track.stop()), []);
    React.useEffect(() => {
      if (!cameraOn || !videoRef.current || !navigator.mediaDevices?.getUserMedia) return;
      let detector;
      let stopped = false;
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
          if ('BarcodeDetector' in window) {
            detector = new window.BarcodeDetector({ formats: ['qr_code'] });
            const scan = async () => {
              if (stopped || !videoRef.current) return;
              try {
                const codes = await detector.detect(videoRef.current);
                if (codes[0]?.rawValue) {
                  setSerial(codes[0].rawValue.slice(0, 80)); setMessage('Đã đọc mã QR.'); setCameraOn(false); return;
                }
              } catch (_) { /* Camera/browser may not support QR decoding. */ }
              if (!stopped) requestAnimationFrame(scan);
            };
            scan();
          } else setMessage('Camera đã mở. Trình duyệt này chưa hỗ trợ đọc QR; vui lòng nhập mã máy bên dưới.');
        })
        .catch(() => { setMessage('Không mở được camera. Hãy cấp quyền camera hoặc nhập mã máy thủ công.'); setCameraOn(false); });
      return () => { stopped = true; streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null; };
    }, [cameraOn]);

    const startSetup = () => { setStep(1); setMessage(''); };
    const chooseBluetoothDevice = async () => {
      setBusy(true); setMessage('');
      try {
        if (demoMode) {
          setDeviceName('Myka Care BP-01');
          setMessage('Đã tìm thấy Myka Care BP-01.');
          return;
        }
        if (!navigator.bluetooth) throw new Error('Trình duyệt này chưa hỗ trợ Web Bluetooth. Bạn có thể nhập mã máy để tiếp tục.');
        const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
        setDeviceName(device.name || 'Máy đo Myka');
        setMessage(`Đã chọn ${device.name || 'thiết bị Bluetooth'}. Kết nối phần cứng vẫn cần firmware tương thích.`);
      } catch (error) { setMessage(error.message || 'Bạn chưa chọn thiết bị.'); }
      finally { setBusy(false); }
    };
    const savePairing = async () => {
      if (demoMode) {
        setMessage('Đã hoàn tất bước ghép nối trong hướng dẫn.');
        setStep(3);
        return;
      }
      if (!serial.trim()) { setMessage('Nhập mã số máy hoặc quét QR trước.'); setStep(1); return; }
      setBusy(true); setMessage('');
      try {
        const response = await fetch(apiUrl('/device/bluetooth/pair/E001'), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_name: deviceName.trim() || 'Máy đo Myka', device_type: 'sphygmomanometer', serial_number: serial.trim() }),
        });
        if (!response.ok) throw new Error('Không lưu được trạng thái ghép nối vào API.');
        await response.json();
        setStep(3);
      } catch (error) { setMessage(`${error.message} Trạng thái phần cứng chưa được xác nhận.`); }
      finally { setBusy(false); }
    };
    const saveWifi = async ({ ssid, password }) => {
      if (demoMode) {
        // The guided account uses a fixed sample password and must not change shared device data.
        setWifiSaved(true);
        return;
      }
      const response = await fetch(apiUrl('/device/wifi/E001'), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ssid, password }),
      });
      if (!response.ok) throw new Error('Không lưu được mạng Wi-Fi.');
      setWifiSaved(true);
    };

    const steps = ['Xác thực thiết bị', 'Ghép nối Bluetooth', 'Kết nối mạng Wi-Fi'];
    if (!step) return <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 p-5 grid place-items-center"><section className="w-full max-w-xl bg-white rounded-3xl border border-blue-100 p-7 shadow-xl shadow-blue-100"><div className="text-5xl mb-4">🤖</div><p className="text-sm font-bold text-blue-700">MYKA CARE COMPANION</p><h1 className="text-2xl sm:text-3xl font-extrabold mt-2">{demoMode ? 'Kết nối máy Myka lần đầu' : 'Chưa có thiết bị được kết nối'}</h1><p className="text-slate-600 mt-2">Thiết lập thiết bị Myka của bạn qua 3 bước đơn giản.</p><ol className="mt-7 space-y-3">{steps.map((title, index) => <li key={title} className="flex gap-4 items-center rounded-2xl bg-slate-50 p-4"><span className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold grid place-items-center">0{index + 1}</span><span className="font-semibold">{title}</span></li>)}</ol>{demoMode && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">Thông tin máy, mạng và mật khẩu mẫu đã được điền sẵn để bạn lần lượt xem các bước.</p>}<button onClick={startSetup} className="w-full mt-7 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 shadow-lg shadow-blue-200">Bắt đầu thiết lập</button></section></div>;

    return <div className="min-h-screen bg-slate-50 p-4 sm:p-8 grid place-items-center"><section className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-xl"><div className="flex gap-2 mb-7">{steps.map((title, index) => <div key={title} className="flex-1"><div className={`h-2 rounded-full ${step >= index + 1 ? 'bg-violet-600' : 'bg-slate-200'}`} /><p className="text-[11px] sm:text-xs text-slate-500 mt-2">0{index + 1} · {title}</p></div>)}</div>
      <h1 className="text-2xl font-bold">{steps[step - 1]}</h1>
      {step === 1 && <div className="mt-5 space-y-4">{demoMode ? <><p className="text-sm text-slate-600">Thông tin máy đã được nhận sẵn. Không cần nhập mã.</p><div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4"><svg viewBox="0 0 11 11" role="img" aria-label="Mã QR thiết bị Myka minh họa" className="h-28 w-28 rounded-lg bg-white p-2">{Array.from({ length: 121 }, (_, index) => { const x = index % 11, y = Math.floor(index / 11); const finder = (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7); const dark = finder ? x === 0 || x === 2 || y === 0 || y === 2 || x === 8 || y === 8 || (x === 1 && y === 1) || (x === 9 && y === 1) || (x === 1 && y === 9) : ((x * 7 + y * 11 + x * y) % 5 < 2); return dark ? <rect key={index} x={x} y={y} width="1" height="1" fill="#12304a" /> : null; })}</svg><div><div className="font-semibold text-slate-800">Mã QR trên máy Myka</div><p className="mt-1 text-sm text-slate-600">Mã máy đã được điền sẵn từ QR.</p><div className="mt-2 inline-flex rounded-lg bg-white px-3 py-2 font-mono font-bold text-blue-900">MYKA-0001</div><button onClick={() => { setSerial('MYKA-0001'); setDeviceName('Myka Care BP-01'); setMessage('Đã quét QR và nhận mã máy MYKA-0001.'); }} className="mt-3 block rounded-lg bg-blue-100 px-4 py-2 font-semibold text-blue-800">📷 Quét lại mã QR</button></div></div><div className="rounded-xl border border-slate-200 p-4"><div className="text-sm text-slate-500">Tên thiết bị</div><div className="mt-1 font-semibold text-slate-800">{deviceName}</div></div><button onClick={() => setStep(2)} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Tiếp tục</button></> : <><p className="text-sm text-slate-600">Quét mã QR trên thân máy hoặc nhập mã số máy.</p>{cameraOn && <video ref={videoRef} autoPlay playsInline className="w-full max-h-64 rounded-xl bg-slate-900 object-cover" />}<div className="flex flex-wrap gap-2"><button onClick={() => { setMessage(''); setCameraOn(true); }} className="rounded-lg bg-blue-100 px-4 py-2 font-semibold text-blue-800">📷 Mở camera quét QR</button><button onClick={() => setCameraOn(false)} className="rounded-lg border px-4 py-2">Tắt camera</button></div><label className="block text-sm font-semibold">Mã số máy<input value={serial} onChange={e => setSerial(e.target.value)} placeholder="Ví dụ: MYKA-0001" className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label><label className="block text-sm font-semibold">Tên thiết bị<input value={deviceName} onChange={e => setDeviceName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label><button onClick={() => setStep(2)} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Tiếp tục</button></>}</div>}
      {step === 2 && <div className="mt-5 space-y-4">{demoMode ? <><p className="text-sm text-slate-600">Bật Bluetooth trên máy đo để ghép nối.</p><div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><div className="font-semibold text-slate-800">Myka Care BP-01</div><div className="mt-1 text-sm text-blue-800">Bluetooth · Sẵn sàng ghép nối</div></div><div className="flex flex-wrap gap-3"><button disabled={busy} onClick={chooseBluetoothDevice} className="rounded-xl border border-blue-200 bg-white px-5 py-3 font-bold text-blue-800 disabled:opacity-60">{busy ? 'Đang tìm…' : 'Tìm thiết bị Bluetooth'}</button><button disabled={busy} onClick={savePairing} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-60">Kết nối Bluetooth</button></div><p className="text-xs text-slate-500">Thao tác được hoàn tất tự động trong hồ sơ hướng dẫn; máy thật cần Bluetooth tương thích.</p></> : <><p className="text-sm text-slate-600">Bật máy đo và cho phép trình duyệt tìm thiết bị Bluetooth ở gần. Cần HTTPS và trình duyệt hỗ trợ Web Bluetooth.</p><button disabled={busy} onClick={chooseBluetoothDevice} className="rounded-xl bg-sky-600 text-white px-5 py-3 font-bold disabled:opacity-60">{busy ? 'Đang tìm…' : 'Tìm thiết bị Bluetooth'}</button><div><button onClick={savePairing} disabled={busy} className="rounded-xl bg-blue-700 text-white px-5 py-3 font-bold disabled:opacity-60">Lưu ghép nối và tiếp tục</button><p className="text-xs text-slate-500 mt-2">Thiết bị sẽ hiển thị đã kết nối khi phần cứng xác nhận ghép nối.</p></div></>}</div>}
      {step === 3 && <div className="mt-5"><WifiNetworkPicker currentSsid={demoMode ? 'Myka-Home-2.4G' : ''} demoMode={demoMode} initialSsid="Myka-Home-2.4G" initialPassword="MykaDemo-2468" onSaved={saveWifi} /><p className="text-xs text-slate-500 mt-3">{demoMode ? 'Mật khẩu mẫu chỉ dùng trong màn hình hướng dẫn, không được gửi hoặc lưu.' : 'Kết nối Wi-Fi sẽ hoàn tất khi gateway Myka nhận cấu hình.'}</p></div>}
      {message && <p role="status" className="mt-4 rounded-xl bg-amber-50 text-amber-900 p-3 text-sm">{message}</p>}
      <div className="mt-6 flex justify-between"><button onClick={() => setStep(Math.max(1, step - 1))} className="rounded-lg border px-4 py-2">Quay lại</button>{step === 3 && <button disabled={!wifiSaved} onClick={onPaired} className="rounded-xl bg-violet-600 text-white px-5 py-2.5 font-bold disabled:opacity-40">{wifiSaved ? 'Hoàn tất thiết lập' : 'Lưu Wi-Fi để hoàn tất'}</button>}</div>
    </section></div>;
  }
  window.DeviceSetupScreen = DeviceSetupScreen;
})();
