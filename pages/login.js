// ============================================================
// pages/login.js - Myka Care Companion login for family members only
// ============================================================
(function () {
  const DEMO_ACCOUNTS = [
    { role: 'family', roleLabel: 'Đã cài đặt robot', email: 'nguoithan@demo.com', password: '123456', icon: '👩', setupMode: false },
    { role: 'family', roleLabel: 'Cài đặt từ đầu', email: 'caidat@demo.com', password: '123456', icon: '🤖', setupMode: true },
  ];

  function LoginPage({ onLogin, onNavigate }) {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [showPass, setShowPass] = React.useState(false);
    const [recoveryStep, setRecoveryStep] = React.useState(0);
    const [recoveryCode, setRecoveryCode] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [recoveryMessage, setRecoveryMessage] = React.useState('');

    function fillDemo(acc) {
      setEmail(acc.email);
      const changedDemoPasswords = RTS.LS.get('myka_demo_passwords') || {};
      setPassword(changedDemoPasswords[acc.email] || acc.password);
      setError('');
    }

    function handleLogin(e) {
      e.preventDefault();
      setError('');
      setLoading(true);
      setTimeout(() => {
        const users = RTS.getUsers();
        const changedDemoPasswords = RTS.LS.get('myka_demo_passwords') || {};
        const account = DEMO_ACCOUNTS.find(item => item.email === email.trim() && (changedDemoPasswords[item.email] || item.password) === password);
        const user = account?.setupMode
          ? { id: 'U-DEMO-SETUP', role: 'family', email: account.email, name: 'Chị Duyên', elderId: 'E001', demoSetupMode: true }
          : users.find(u => u.role === 'family' && u.email === email.trim() && (changedDemoPasswords[u.email] || u.password) === password);
        if (user) {
          onLogin(user);
        } else {
          setError('Thông tin đăng nhập không hợp lệ. Ứng dụng này chỉ dành cho tài khoản Người thân.');
        }
        setLoading(false);
      }, 800);
    }

    return (
      <div className="min-h-screen bg-[#f4f8f7] flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl overflow-hidden rounded-[30px] bg-white shadow-[0_24px_80px_rgba(21,81,72,.12)] border border-emerald-950/5 flex flex-col lg:flex-row">
          {/* Left - Login form */}
          <div className="w-full lg:w-[440px] flex-shrink-0 p-6 sm:p-10">
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-3 px-2 py-2 rounded-2xl">
                <span className="w-12 h-12 rounded-2xl bg-emerald-700 text-white grid place-items-center text-2xl">✿</span>
                <div className="text-left">
                  <div className="text-slate-900 font-extrabold text-xl leading-tight">Myka Care</div>
                  <div className="text-emerald-700 text-xs">Đồng hành chăm sóc gia đình</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-1">
              <p className="text-xs font-bold tracking-[.18em] text-emerald-700 mb-2">KHÔNG GIAN GIA ĐÌNH</p>
              <h2 className="text-3xl font-bold text-slate-800 mb-1">Chào mừng trở lại</h2>
              <p className="text-slate-500 text-sm mb-7">Đăng nhập để xem thông tin chăm sóc người thân.</p>

              {recoveryStep > 0 ? <div className="space-y-4">
                <div className="flex items-center justify-between"><h3 className="font-bold text-xl text-slate-800">{recoveryStep === 1 ? 'Khôi phục mật khẩu' : recoveryStep === 2 ? 'Xác nhận email' : 'Tạo mật khẩu mới'}</h3><button type="button" onClick={() => { setRecoveryStep(0); setRecoveryMessage(''); }} className="text-sm text-emerald-700">Quay lại</button></div>
                {recoveryStep === 1 && <><label className="block text-sm font-semibold">Email tài khoản<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ten@email.com" className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-xl" /></label><p className="text-xs text-slate-500">Chỉ khôi phục sau khi tài khoản đã đăng nhập và máy đo đã ghép nối trên thiết bị này.</p><button type="button" onClick={() => { const account = RTS.getUsers().find(u => u.role === 'family' && u.email === email.trim()) || (DEMO_ACCOUNTS.some(a => a.email === email.trim()) ? { id: email.trim() === 'caidat@demo.com' ? 'U-DEMO-SETUP' : 'U002' } : null); if (!account) { setRecoveryMessage('Email chưa khớp tài khoản demo.'); return; } if (!RTS.LS.get(`myka_ever_logged_in_${account.id}`) || !RTS.LS.get(`myka_device_paired_${account.id}`)) { setRecoveryMessage('Tài khoản cần đăng nhập và ghép máy đo ít nhất một lần trước khi khôi phục.'); return; } setRecoveryStep(2); setRecoveryMessage('Mã demo: 246810 (email chưa được gửi thật).'); }} className="w-full rounded-xl bg-emerald-700 text-white font-bold py-3">Gửi mã xác nhận</button></>}
                {recoveryStep === 2 && <><p className="text-sm text-slate-600">Nhập mã xác nhận gửi tới <b>{email}</b>.</p><input inputMode="numeric" maxLength="6" value={recoveryCode} onChange={e => setRecoveryCode(e.target.value.replace(/\D/g, ''))} placeholder="••••••" className="w-full px-4 py-3 border border-slate-200 rounded-xl tracking-[.5em] text-center" /><p className="text-xs text-slate-500">Bản demo: nhập mã 246810. Email chưa được gửi thật.</p><button type="button" onClick={() => recoveryCode === '246810' ? (setRecoveryStep(3), setRecoveryMessage('')) : setRecoveryMessage('Mã chưa đúng. Vui lòng kiểm tra lại.')} className="w-full rounded-xl bg-emerald-700 text-white font-bold py-3">Xác nhận email</button></>}
                {recoveryStep === 3 && <><label className="block text-sm font-semibold">Mật khẩu mới<input type="password" minLength="8" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Ít nhất 8 ký tự" className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-xl" /></label><button type="button" onClick={() => { if (newPassword.length < 8) { setRecoveryMessage('Mật khẩu cần ít nhất 8 ký tự.'); return; } const demo = DEMO_ACCOUNTS.find(a => a.email === email.trim()); if (demo) { const saved = RTS.LS.get('myka_demo_passwords') || {}; RTS.LS.set('myka_demo_passwords', { ...saved, [email.trim()]: newPassword }); } else { const users = RTS.getUsers().map(u => u.email === email.trim() ? { ...u, password: newPassword } : u); RTS.LS.set('rts_users', users); } setRecoveryStep(0); setPassword(''); setRecoveryMessage('Đã đổi mật khẩu trên thiết bị này.'); }} className="w-full rounded-xl bg-emerald-700 text-white font-bold py-3">Lưu mật khẩu mới</button></>}
                {recoveryMessage && <p role="status" className="text-sm text-emerald-800 bg-emerald-50 rounded-xl p-3">{recoveryMessage}</p>}
              </div> : <>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@demo.com"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 pr-12"
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg">
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition disabled:opacity-60 shadow-md shadow-emerald-900/10"
                >
                  {loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập'}
                </button>
              </form>

              <button type="button" onClick={() => { setRecoveryStep(1); setRecoveryMessage(''); }} className="mt-5 w-full text-center text-sm font-semibold text-emerald-700 hover:text-emerald-900">Quên mật khẩu?</button>

              <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                <button onClick={() => onNavigate('landing')} className="text-emerald-700 hover:underline text-sm">
                  ← Quay về trang chủ
                </button>
              </div>
              </>}
            </div>
          </div>

          {/* Right - Demo accounts */}
          <div className="flex-1 w-full bg-gradient-to-br from-emerald-800 via-teal-700 to-cyan-800 p-6 sm:p-10 flex flex-col justify-center">
            <div className="rounded-3xl p-2">
              <p className="text-emerald-100 text-xs font-bold tracking-[.2em] mb-3">MYKA CARE COMPANION</p>
              <h3 className="text-white font-bold text-3xl mb-2">Chăm sóc bắt đầu từ sự quan tâm.</h3>
              <p className="text-emerald-50/80 text-sm mb-7 max-w-lg">Một nơi để gia đình xem lại thông tin sức khỏe, lịch chăm sóc và thiết bị Myka của người thân.</p>
              <h4 className="text-white font-semibold mb-3">Trải nghiệm bản demo</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEMO_ACCOUNTS.map(acc => (
                  <button
                    key={acc.email}
                    onClick={() => fillDemo(acc)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 bg-white hover:shadow-md transition-all text-left ${
                      email === acc.email ? 'ring-2 ring-emerald-300 shadow-lg' : ''
                    }`}
                  >
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                      {acc.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-sm">{acc.roleLabel}</div>
                      <div className="text-slate-500 text-xs truncate">{acc.email}</div>
                      <div className="text-slate-400 text-xs">Mật khẩu: 123456</div>
                    </div>
                    {email === acc.email && (
                      <span className="text-green-500 text-lg flex-shrink-0">✓</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-white/20 pt-4 text-xs leading-relaxed text-emerald-50/80">
                Dành cho người thân · Thông tin sức khỏe và lịch chăm sóc · Không có giám sát té ngã hoặc theo dõi trực tiếp.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  window.LoginPage = LoginPage;
})();
