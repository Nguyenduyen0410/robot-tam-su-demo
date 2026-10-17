// ============================================================
// pages/landing.js - Landing Page (US-00)
// ============================================================
(function () {
  const FEATURES = [
    { icon: '🤖', title: 'Robot Đồng hành', desc: 'Robot thông minh trò chuyện, lắng nghe và đồng hành cùng người cao tuổi 24/7. Hỗ trợ giọng nói tự nhiên tiếng Việt.', color: 'from-blue-500 to-blue-600' },
    { icon: '💓', title: 'Theo dõi Huyết áp', desc: 'Đo và lưu trữ chỉ số huyết áp tự động, cảnh báo khi vượt ngưỡng an toàn. Biểu đồ xu hướng 7-30 ngày.', color: 'from-red-500 to-red-600' },
    { icon: '🆘', title: 'SOS Khẩn cấp', desc: 'Nút SOS một chạm, thông báo tức thời đến gia đình và điều dưỡng. Phản hồi trong vòng 3 phút.', color: 'from-orange-500 to-orange-600' },
    { icon: '📅', title: 'Lịch Chăm sóc', desc: 'Nhắc nhở uống thuốc, đo huyết áp và lịch hẹn khám theo thời gian thực. Xác nhận dễ dàng.', color: 'from-green-500 to-green-600' },
    { icon: '👨‍👩‍👧', title: 'Kết nối Gia đình', desc: 'Gia đình theo dõi sức khỏe và trò chuyện cùng người thân mọi lúc mọi nơi qua ứng dụng.', color: 'from-purple-500 to-purple-600' },
    { icon: '👥', title: 'Nhóm Chăm sóc', desc: 'Kết nối gia đình, điều dưỡng và bác sĩ trong một nhóm chăm sóc, chia sẻ thông tin liền mạch.', color: 'from-teal-500 to-teal-600' },
  ];

  const STATS = [
    { num: '1,200+', label: 'Người cao tuổi' },
    { num: '98%', label: 'Độ hài lòng' },
    { num: '< 3 phút', label: 'Thời gian phản hồi SOS' },
    { num: '24/7', label: 'Hỗ trợ liên tục' },
  ];

  const PLANS = [
    { name: 'Tiêu chuẩn', price: '1.500.000', period: 'tháng', color: 'border-slate-200', btnColor: 'bg-slate-700', features: ['Robot Đồng hành cơ bản', 'Đo huyết áp tự động', 'Cảnh báo SOS', 'Kết nối 1 người thân', 'Nhắc nhở thuốc'] },
    { name: 'Nâng cao', price: '2.800.000', period: 'tháng', color: 'border-blue-500', btnColor: 'bg-blue-600', badge: 'Phổ biến nhất', features: ['Tất cả tính năng Tiêu chuẩn', 'Nhóm chăm sóc đầy đủ', 'Kết nối bác sĩ chuyên khoa', 'Báo cáo sức khỏe hàng tuần', 'Kết nối 5 người thân', 'Ưu tiên hỗ trợ'] },
    { name: 'Cao cấp', price: '4.500.000', period: 'tháng', color: 'border-purple-400', btnColor: 'bg-purple-600', features: ['Tất cả tính năng Nâng cao', 'Bác sĩ riêng tư', 'Điều dưỡng 24/7', 'Không giới hạn người thân', 'Báo cáo theo yêu cầu', 'Hỗ trợ tận nhà'] },
  ];

  function LandingPage({ onNavigate }) {
    const [menuOpen, setMenuOpen] = React.useState(false);

    return (
      <div className="min-h-screen bg-white">
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🤖</span>
              <div>
                <div className="font-bold text-slate-800 text-lg leading-tight">Robot Tâm Sự</div>
                <div className="text-xs text-slate-500">Hệ thống chăm sóc người cao tuổi</div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium">Tính năng</a>
              <a href="#stats" className="text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium">Thống kê</a>
              <a href="#pricing" className="text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium">Gói dịch vụ</a>
              <button
                onClick={() => onNavigate('login')}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
              >
                Đăng nhập
              </button>
            </div>
            <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          </div>
          {menuOpen && (
            <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-2">
              <a href="#features" className="block py-2 text-slate-600">Tính năng</a>
              <a href="#pricing" className="block py-2 text-slate-600">Gói dịch vụ</a>
              <button onClick={() => onNavigate('login')} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Đăng nhập</button>
            </div>
          )}
        </nav>

        {/* Hero */}
        <section className="pt-24 pb-16 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-500 bg-opacity-40 text-blue-100 px-4 py-1.5 rounded-full text-sm mb-4 border border-blue-400">
                <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse"></span>
                Hệ thống chăm sóc người cao tuổi thế hệ mới
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
                Robot Tâm Sự <br />
                <span className="text-blue-200">với Người Cao Tuổi</span>
              </h1>
              <p className="text-blue-100 text-lg mb-8 leading-relaxed max-w-xl">
                Đồng hành chăm sóc sức khỏe 24/7, kết nối gia đình và đội ngũ y tế chuyên nghiệp.
                Theo dõi huyết áp thông minh, nhắc nhở thuốc và ứng phó khẩn cấp nhanh chóng.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition shadow-lg text-lg"
                >
                  🚀 Trải nghiệm Demo
                </button>
                <a href="#features" className="px-8 py-4 border-2 border-blue-300 text-white font-semibold rounded-xl hover:bg-blue-600 transition text-center text-lg">
                  Tìm hiểu thêm ↓
                </a>
              </div>
            </div>
            <div className="flex-shrink-0 text-center">
              <div className="w-56 h-56 md:w-72 md:h-72 bg-white bg-opacity-10 rounded-full flex items-center justify-center border-4 border-blue-300 border-opacity-40 shadow-2xl mx-auto">
                <span className="text-8xl md:text-9xl">🤖</span>
              </div>
              <div className="mt-4 flex justify-center gap-3 text-sm">
                <span className="bg-green-400 text-white px-3 py-1 rounded-full font-medium">✓ Đang hoạt động</span>
                <span className="bg-blue-400 bg-opacity-60 text-white px-3 py-1 rounded-full">1,200+ Người dùng</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section id="stats" className="py-12 bg-slate-800">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(s => (
              <div key={s.num} className="text-center text-white">
                <div className="text-3xl md:text-4xl font-extrabold text-blue-400">{s.num}</div>
                <div className="text-slate-300 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-3">6 Nhóm Tính Năng Chính</h2>
              <p className="text-slate-500 max-w-xl mx-auto">Giải pháp toàn diện cho việc chăm sóc sức khỏe và tinh thần của người cao tuổi</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map(f => (
                <div key={f.title} className="group bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-14 h-14 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center text-3xl mb-4 shadow-md`}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-slate-800 text-xl mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-blue-50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-800 mb-10 text-center">Cách hoạt động</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: '1', icon: '📦', title: 'Cài đặt Robot', desc: 'Thiết bị Robot Tâm Sự được giao và cài đặt tại nhà/phòng của người cao tuổi' },
                { step: '2', icon: '👤', title: 'Tạo hồ sơ', desc: 'Điền thông tin sức khỏe, danh sách thuốc và liên kết với gia đình' },
                { step: '3', icon: '💬', title: 'Bắt đầu chăm sóc', desc: 'Robot tự động nhắc nhở, đo huyết áp và trò chuyện mỗi ngày' },
                { step: '4', icon: '📊', title: 'Theo dõi & Cảnh báo', desc: 'Gia đình và bác sĩ nhận báo cáo và cảnh báo kịp thời qua ứng dụng' },
              ].map(s => (
                <div key={s.step} className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 shadow-lg">
                    {s.step}
                  </div>
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <h4 className="font-bold text-slate-800 mb-1">{s.title}</h4>
                  <p className="text-slate-500 text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-3">Gói Dịch vụ</h2>
              <p className="text-slate-500">Lựa chọn gói phù hợp với nhu cầu chăm sóc của gia đình bạn</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map(p => (
                <div key={p.name} className={`border-2 ${p.color} rounded-2xl p-6 relative ${p.badge ? 'shadow-xl scale-105' : ''}`}>
                  {p.badge && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-4 py-1 rounded-full font-semibold">{p.badge}</div>
                  )}
                  <h3 className="font-bold text-xl text-slate-800 mb-1">{p.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-slate-800">{p.price}</span>
                    <span className="text-slate-500 text-sm"> ₫/{p.period}</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {p.features.map(f => (
                      <li key={f} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => onNavigate('login')}
                    className={`w-full py-3 ${p.btnColor} text-white rounded-xl font-semibold hover:opacity-90 transition`}
                  >
                    Đăng ký ngay
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-4">Bắt đầu chăm sóc người thân ngay hôm nay</h2>
            <p className="text-blue-200 mb-8">Dùng thử miễn phí 30 ngày. Không cần thẻ tín dụng.</p>
            <button
              onClick={() => onNavigate('login')}
              className="px-10 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 shadow-xl text-lg transition"
            >
              🚀 Trải nghiệm Demo ngay
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-8">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <div>
                <div className="text-white font-bold">Robot Tâm Sự</div>
                <div className="text-xs">© 2024 RobotCare Vietnam</div>
              </div>
            </div>
            <div className="text-sm text-center">Hệ thống chăm sóc người cao tuổi thông minh • Hotline: 1800 1234</div>
            <div className="flex gap-4 text-sm">
              <a href="#" className="hover:text-white">Chính sách</a>
              <a href="#" className="hover:text-white">Điều khoản</a>
              <a href="#" className="hover:text-white">Liên hệ</a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  window.LandingPage = LandingPage;
})();
