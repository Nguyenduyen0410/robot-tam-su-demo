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
      <main className="myka-login">
        <div className="myka-login-shell">
          <aside className="myka-login-story" aria-label="Myka đồng hành cùng gia đình">
            <div className="myka-story-top"><span className="myka-story-dot" /> CHĂM SÓC TỪ NHỮNG ĐIỀU NHỎ</div>
            <div className="myka-story-copy"><h2>Ở xa một chút.<br /><em>Quan tâm gần hơn.</em></h2><p>Cùng Myka giữ kết nối với sức khỏe và những điều thường ngày của người thân.</p></div>
            <div className="myka-robot-scene" aria-hidden="true">
              <div className="myka-scene-orbit" />
              <svg className="myka-login-robot" viewBox="0 0 320 310" fill="none">
                <ellipse cx="160" cy="282" rx="94" ry="12" fill="#153e51" opacity=".12" />
                <path d="M100 205C88 212 76 233 77 246C85 258 98 253 111 239M220 205C232 212 244 233 243 246C235 258 222 253 209 239" fill="#dcebe5" stroke="#c5d9d1" strokeWidth="2"/>
                <path d="M117 193H203L216 252C218 265 207 276 194 276H126C113 276 102 265 104 252L117 193Z" fill="#f8fbf9" stroke="#d4e1dc" strokeWidth="2"/>
                <rect x="140" y="249" width="40" height="5" rx="2.5" fill="#c9ddd4"/>
                <rect x="155" y="41" width="10" height="27" rx="5" fill="#bad6ca"/><circle cx="160" cy="37" r="10" fill="#f4cda4"/>
                <rect x="55" y="111" width="25" height="57" rx="12.5" fill="#dae9e1"/><rect x="240" y="111" width="25" height="57" rx="12.5" fill="#dae9e1"/>
                <rect x="71" y="68" width="178" height="139" rx="49" fill="#fcfdfa" stroke="#d6e4de" strokeWidth="2"/>
                <rect x="90" y="89" width="140" height="93" rx="33" fill="#193c4a"/>
                <path d="M116 131Q126 117 136 131M184 131Q194 117 204 131" stroke="#b9e4d2" strokeWidth="7" strokeLinecap="round"/>
                <path d="M148 153Q160 165 172 153" stroke="#b9e4d2" strokeWidth="5" strokeLinecap="round"/>
                <circle cx="109" cy="148" r="6" fill="#f2c3ad" opacity=".8"/><circle cx="211" cy="148" r="6" fill="#f2c3ad" opacity=".8"/>
                <path d="M160 238L150 229C140 219 151 210 160 220C169 210 180 219 170 229L160 238Z" fill="#e9ac95"/>
              </svg>
              <div className="myka-scene-note myka-scene-note-top"><span className="material-symbols-rounded">favorite</span><div><strong>Thêm một chút an tâm</strong><small>Từ những lần hỏi han mỗi ngày</small></div></div>
              <div className="myka-scene-note myka-scene-note-bottom"><span className="material-symbols-rounded">calendar_today</span><div><strong>Nhớ những điều quan trọng</strong><small>Lịch thuốc, lịch khám của người thân</small></div></div>
            </div>
            <div className="myka-story-footer"><span className="material-symbols-rounded">spa</span> Một người bạn của Ngoại. Một kết nối của gia đình.</div>
          </aside>
          <section className="myka-login-form-panel" aria-labelledby="myka-login-title">
            <a href="#/landing" className="myka-login-brand" onClick={event => { event.preventDefault(); onNavigate('landing'); }} aria-label="Myka Care — về trang chủ">
              <span className="myka-login-brand-mark"><span className="material-symbols-rounded" aria-hidden="true">volunteer_activism</span></span><span><strong>Myka<span>Care</span></strong><small>Đồng hành chăm sóc gia đình</small></span>
            </a>
            <div className="myka-login-intro"><span className="myka-login-eyebrow">KHÔNG GIAN GIA ĐÌNH</span><h1 id="myka-login-title">{recoveryStep ? 'Kết nối lại với Myka' : 'Chào mừng trở lại.'}</h1><p>{recoveryStep ? 'Lấy lại quyền truy cập để tiếp tục chăm sóc người thân.' : 'Một nơi để bạn luôn gần người mình thương.'}</p></div>
            <div className="myka-login-fields">
{recoveryStep > 0 ? <div className="space-y-4">
                <div className="flex items-center justify-between"><h3 className="font-bold text-xl text-slate-800">{recoveryStep === 1 ? 'Khôi phục mật khẩu' : recoveryStep === 2 ? 'Xác nhận email' : 'Tạo mật khẩu mới'}</h3><button type="button" onClick={() => { setRecoveryStep(0); setRecoveryMessage(''); }} className="text-sm text-blue-700">Quay lại</button></div>
                {recoveryStep === 1 && <><label className="block text-sm font-semibold">Email tài khoản<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ten@email.com" className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-xl" /></label><p className="text-xs text-slate-500">Chỉ khôi phục sau khi tài khoản đã đăng nhập và máy đo đã ghép nối trên thiết bị này.</p><button type="button" onClick={() => { const account = RTS.getUsers().find(u => u.role === 'family' && u.email === email.trim()) || (DEMO_ACCOUNTS.some(a => a.email === email.trim()) ? { id: email.trim() === 'caidat@demo.com' ? 'U-DEMO-SETUP' : 'U002' } : null); if (!account) { setRecoveryMessage('Email chưa khớp tài khoản.'); return; } if (!RTS.LS.get(`myka_ever_logged_in_${account.id}`) || !RTS.LS.get(`myka_device_paired_${account.id}`)) { setRecoveryMessage('Tài khoản cần đăng nhập và ghép máy đo ít nhất một lần trước khi khôi phục.'); return; } setRecoveryStep(2); setRecoveryMessage('Mã xác nhận: 246810. Email chưa được gửi.'); }} className="w-full rounded-xl bg-blue-700 text-white font-bold py-3">Gửi mã xác nhận</button></>}
                {recoveryStep === 2 && <><p className="text-sm text-slate-600">Nhập mã xác nhận gửi tới <b>{email}</b>.</p><input inputMode="numeric" maxLength="6" value={recoveryCode} onChange={e => setRecoveryCode(e.target.value.replace(/\D/g, ''))} placeholder="••••••" className="w-full px-4 py-3 border border-slate-200 rounded-xl tracking-[.5em] text-center" /><p className="text-xs text-slate-500">Mã xác nhận: 246810. Email chưa được gửi.</p><button type="button" onClick={() => recoveryCode === '246810' ? (setRecoveryStep(3), setRecoveryMessage('')) : setRecoveryMessage('Mã chưa đúng. Vui lòng kiểm tra lại.')} className="w-full rounded-xl bg-blue-700 text-white font-bold py-3">Xác nhận email</button></>}
                {recoveryStep === 3 && <><label className="block text-sm font-semibold">Mật khẩu mới<input type="password" minLength="8" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Ít nhất 8 ký tự" className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-xl" /></label><button type="button" onClick={() => { if (newPassword.length < 8) { setRecoveryMessage('Mật khẩu cần ít nhất 8 ký tự.'); return; } const demo = DEMO_ACCOUNTS.find(a => a.email === email.trim()); if (demo) { const saved = RTS.LS.get('myka_demo_passwords') || {}; RTS.LS.set('myka_demo_passwords', { ...saved, [email.trim()]: newPassword }); } else { const users = RTS.getUsers().map(u => u.email === email.trim() ? { ...u, password: newPassword } : u); RTS.LS.set('rts_users', users); } setRecoveryStep(0); setPassword(''); setRecoveryMessage('Đã đổi mật khẩu trên thiết bị này.'); }} className="w-full rounded-xl bg-blue-700 text-white font-bold py-3">Lưu mật khẩu mới</button></>}
                {recoveryMessage && <p role="status" className="text-sm text-blue-800 bg-blue-50 rounded-xl p-3">{recoveryMessage}</p>}
              </div> : <React.Fragment>
              <form onSubmit={handleLogin} className="myka-auth-form">
                <div className="myka-auth-field"><label htmlFor="myka-email">Email</label><div className="myka-auth-input"><span className="material-symbols-rounded" aria-hidden="true">mail</span><input id="myka-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="Nhập email của bạn" required /></div></div>
                <div className="myka-auth-field"><div className="myka-auth-label-row"><label htmlFor="myka-password">Mật khẩu</label><button type="button" className="myka-auth-forgot" onClick={() => { setRecoveryStep(1); setRecoveryMessage(''); }}>Quên mật khẩu?</button></div><div className="myka-auth-input"><span className="material-symbols-rounded" aria-hidden="true">lock</span><input id="myka-password" type={showPass ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nhập mật khẩu" required /><button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPass} className="myka-password-toggle"><span className="material-symbols-rounded" aria-hidden="true">{showPass ? 'visibility_off' : 'visibility'}</span></button></div></div>
                {error && <div role="alert" className="myka-login-error"><span className="material-symbols-rounded" aria-hidden="true">error</span>{error}</div>}
                {recoveryMessage && <p role="status" className="myka-login-feedback">{recoveryMessage}</p>}
                <button type="submit" disabled={loading} className="myka-auth-submit"><span>{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</span><span className={`material-symbols-rounded ${loading ? 'myka-login-loading' : ''}`} aria-hidden="true">{loading ? 'progress_activity' : 'arrow_forward'}</span></button>
              </form>
              <div className="myka-login-divider"><span>Hoặc khám phá Myka</span></div>
              <div className="myka-login-demos" aria-label="Truy cập nhanh">{DEMO_ACCOUNTS.map((acc,index) => <button key={acc.email} type="button" onClick={() => fillDemo(acc)} aria-pressed={email === acc.email} className={`myka-demo-option ${email === acc.email ? 'is-selected' : ''}`}><span className="material-symbols-rounded myka-demo-icon" aria-hidden="true">{index === 0 ? 'home_health' : 'smart_toy'}</span><span><strong>{acc.roleLabel}</strong><small>{index === 0 ? 'Xem không gian chăm sóc' : 'Thử kết nối thiết bị'}</small></span><span className="material-symbols-rounded myka-demo-check" aria-hidden="true">{email === acc.email ? 'check_circle' : 'chevron_right'}</span></button>)}</div>
              <p className="myka-login-demo-hint">Chọn một trải nghiệm để điền sẵn thông tin đăng nhập.</p>
            </React.Fragment>}
            </div>
            <div className="myka-login-bottom"><button type="button" onClick={() => onNavigate('landing')}><span className="material-symbols-rounded" aria-hidden="true">arrow_back</span> Về trang chủ</button><span>MYKA CARE COMPANION</span></div>
          </section>
        </div>
      </main>
    );
  }
  window.LoginPage = LoginPage;
})();
