// ============================================================
// pages/login.js - Multi-role Login Page
// ============================================================
(function () {
  const DEMO_ACCOUNTS = [
    { role: 'elder',    roleLabel: 'Mô phỏng Robot (Tại nhà)',  email: 'nguoicaotuoi@demo.com', password: '123456', icon: '🤖', color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { role: 'family',   roleLabel: 'Người thân (App Theo dõi)', email: 'nguoithan@demo.com',    password: '123456', icon: '👩', color: 'bg-purple-50 border-purple-200 text-purple-700' },
    { role: 'caregiver',roleLabel: 'Điều dưỡng',               email: 'dieuduong@demo.com',    password: '123456', icon: '👩‍⚕️', color: 'bg-green-50 border-green-200 text-green-700' },
    { role: 'doctor',   roleLabel: 'Bác sĩ',                   email: 'bacsi@demo.com',        password: '123456', icon: '👨‍⚕️', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { role: 'admin',    roleLabel: 'Quản trị viên',            email: 'admin@demo.com',        password: '123456', icon: '🧑‍💼', color: 'bg-slate-50 border-slate-300 text-slate-700' },
    { role: 'operator', roleLabel: 'Điều hành viên',           email: 'operator@demo.com',     password: '123456', icon: '🧑‍💻', color: 'bg-teal-50 border-teal-200 text-teal-700' },
  ];

  function LoginPage({ onLogin, onNavigate }) {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [showPass, setShowPass] = React.useState(false);

    function fillDemo(acc) {
      setEmail(acc.email);
      setPassword(acc.password);
      setError('');
    }

    function handleLogin(e) {
      e.preventDefault();
      setError('');
      setLoading(true);
      setTimeout(() => {
        const users = RTS.getUsers();
        const user = users.find(u => u.email === email.trim() && u.password === password);
        if (user) {
          onLogin(user);
        } else {
          setError('Email hoặc mật khẩu không đúng. Hãy chọn tài khoản demo bên dưới.');
        }
        setLoading(false);
      }, 800);
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 items-start">
          {/* Left - Login form */}
          <div className="w-full lg:w-96 flex-shrink-0">
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-3 bg-white bg-opacity-15 px-5 py-3 rounded-2xl border border-white border-opacity-20">
                <span className="text-4xl">🤖</span>
                <div className="text-left">
                  <div className="text-white font-extrabold text-xl leading-tight">Robot Tâm Sự</div>
                  <div className="text-blue-200 text-xs">Hệ thống chăm sóc người cao tuổi</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">Đăng nhập</h2>
              <p className="text-slate-500 text-sm mb-6">Chào mừng bạn trở lại! 👋</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@demo.com"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 pr-12"
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
                  className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-60 shadow-md"
                >
                  {loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập'}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                <button onClick={() => onNavigate('landing')} className="text-blue-600 hover:underline text-sm">
                  ← Quay về trang chủ
                </button>
              </div>
            </div>
          </div>

          {/* Right - Demo accounts */}
          <div className="flex-1 w-full">
            <div className="bg-white bg-opacity-10 backdrop-blur rounded-2xl p-6 border border-white border-opacity-20">
              <h3 className="text-white font-bold text-lg mb-1">🎯 Tài khoản Demo</h3>
              <p className="text-blue-200 text-sm mb-5">Nhấn vào tài khoản bên dưới để điền thông tin tự động, sau đó bấm Đăng nhập</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEMO_ACCOUNTS.map(acc => (
                  <button
                    key={acc.role}
                    onClick={() => fillDemo(acc)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 bg-white hover:shadow-md transition-all text-left ${
                      email === acc.email ? 'ring-2 ring-white shadow-lg scale-105' : ''
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

              <div className="mt-5 bg-white bg-opacity-10 rounded-xl p-4 text-xs space-y-1.5 text-blue-100">
                <div className="text-white font-bold text-sm mb-1">ℹ️ Kiến trúc hệ thống & Quy định y tế:</div>
                <p>• <strong className="text-white">Người cao tuổi:</strong> Không dùng app; giao tiếp trực tiếp qua Robot Myka bằng giọng nói & vòng bít đo huyết áp cơ học tại nhà.</p>
                <p>• <strong className="text-white">Người thân:</strong> Đăng nhập app để theo dõi (chỉ đọc), xem bảng tổng hợp sức khỏe, đọc lịch sử trò chuyện đẩy từ Telegram, cấu hình RUD Wi-Fi/Bluetooth cho Robot.</p>
                <p>• <strong className="text-white">Tư vấn y tế:</strong> Tuân thủ pháp lý - không tư vấn bệnh qua AI hay chat kín nội bộ; mọi tư vấn bác sĩ được chuyển hướng đến kênh Telegram chính thức.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  window.LoginPage = LoginPage;
})();
