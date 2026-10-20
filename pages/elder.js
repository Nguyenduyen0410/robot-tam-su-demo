// ============================================================
// pages/elder.js - Elder Dashboard
// ============================================================
(function () {
  function BPModal({ onClose }) {
    const [phase, setPhase] = React.useState('ready'); // ready | measuring | result
    const [result, setResult] = React.useState(null);
    const [progress, setProgress] = React.useState(0);

    function startMeasure() {
      setPhase('measuring');
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            const systolic  = Math.floor(Math.random() * 31) + 110;
            const diastolic = Math.floor(Math.random() * 21) + 70;
            const heartRate = Math.floor(Math.random() * 21) + 65;
            const res = { systolic, diastolic, heartRate, timestamp: new Date().toISOString(), id: RTS.genId() };
            const status = RTS.bpStatus(systolic);
            res.status = status;
            setResult(res);
            setPhase('result');
            // save
            RTS.addBP({ ...res, elderId: 'E001', recordedBy: 'device' });
            RTS.addAuditLog({ id: RTS.genId(), userId: 'U001', userName: 'Bà Nguyễn Thị Hoa', action: 'Đo huyết áp', detail: `Kết quả: ${systolic}/${diastolic} mmHg, nhịp tim: ${heartRate} bpm`, timestamp: new Date().toISOString() });
            
            // Đồng bộ kết quả từ Robot về App cho Người thân, Điều dưỡng & Bác sĩ
            const label = RTS.bpLabel(systolic);
            RTS.addNotification({
              id: RTS.genId(),
              toUserId: 'U002',
              type: 'bp_result',
              title: '💓 Kết quả đo huyết áp mới',
              detail: `Bà Nguyễn Thị Hoa vừa hoàn thành đo: ${systolic}/${diastolic} mmHg, nhịp tim ${heartRate} bpm (${label})`,
              elderId: 'E001',
              timestamp: new Date().toISOString(),
              read: false
            });

            if (status === 'critical' || status === 'warning') {
              // Cảnh báo gửi tới Điều dưỡng và Bác sĩ
              RTS.addNotification({
                id: RTS.genId(),
                toUserId: 'U003',
                type: 'bp_alert',
                title: status === 'critical' ? '🚨 Cảnh báo huyết áp nguy hiểm' : '⚠️ Cảnh báo huyết áp cần theo dõi',
                detail: `Bà Nguyễn Thị Hoa: ${systolic}/${diastolic} mmHg, nhịp tim ${heartRate} bpm. Cần kiểm tra tại phòng P101.`,
                elderId: 'E001',
                timestamp: new Date().toISOString(),
                read: false
              });
              RTS.addNotification({
                id: RTS.genId(),
                toUserId: 'U004',
                type: 'bp_alert',
                title: status === 'critical' ? '🚨 Bệnh nhân HA cao khẩn cấp' : '⚠️ Bệnh nhân có chỉ số HA dao động',
                detail: `Bà Nguyễn Thị Hoa: ${systolic}/${diastolic} mmHg (${label}). Bác sĩ xem xét phác đồ điều trị.`,
                elderId: 'E001',
                timestamp: new Date().toISOString(),
                read: false
              });
              RTS.addAlert({
                id: RTS.genId(),
                elderId: 'E001',
                elderName: 'Bà Nguyễn Thị Hoa',
                type: 'bp_high',
                title: status === 'critical' ? 'Huyết áp nguy hiểm từ thiết bị' : 'Huyết áp vượt ngưỡng an toàn',
                detail: `Kết quả đo: ${systolic}/${diastolic} mmHg lúc ${new Date().toLocaleTimeString('vi-VN')}`,
                timestamp: new Date().toISOString(),
                severity: status === 'critical' ? 'critical' : 'warning',
                status: 'pending',
                riskLevel: status === 'critical' ? 'Cao' : 'Trung bình'
              });
            }
            return 100;
          }
          return p + 3;
        });
      }, 90);
    }

    const statusColor = result ? (result.status === 'normal' ? 'text-green-600' : result.status === 'warning' ? 'text-yellow-600' : 'text-red-600') : '';
    const statusLabel = result ? RTS.bpLabel(result.systolic) : '';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center fade-in">
          <div className="text-6xl mb-4">💓</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Đo Huyết Áp</h2>

          {phase === 'ready' && (
            <div>
              <p className="text-slate-500 mb-6 text-lg">Đặt tay lên thiết bị và nhấn nút bên dưới để bắt đầu đo.</p>
              <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm text-blue-700">
                💡 Ngồi thẳng, thư giãn 5 phút trước khi đo. Không nói chuyện trong khi đo.
              </div>
              <button onClick={startMeasure} className="w-full py-4 bg-blue-600 text-white text-xl font-bold rounded-2xl hover:bg-blue-700 shadow-lg">
                ▶️ Bắt đầu đo
              </button>
            </div>
          )}

          {phase === 'measuring' && (
            <div>
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-32 h-32 spinner" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8"/>
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#2563EB" strokeWidth="8"
                    strokeDasharray={`${progress * 3.39} 339`} strokeLinecap="round" strokeDashoffset="0"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">{progress}%</span>
                </div>
              </div>
              <p className="text-slate-600 text-lg animate-pulse">Đang đo huyết áp...</p>
              <p className="text-slate-400 text-sm mt-2">Vui lòng giữ nguyên tư thế</p>
            </div>
          )}

          {phase === 'result' && result && (
            <div>
              <div className={`text-5xl font-extrabold mb-1 ${statusColor}`}>
                {result.systolic}/{result.diastolic}
              </div>
              <div className="text-slate-500 text-sm mb-1">mmHg</div>
              <div className={`text-lg font-bold mb-4 ${statusColor}`}>💗 Nhịp tim: {result.heartRate} bpm</div>
              <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-bold mb-4 ${
                result.status === 'normal' ? 'bg-green-100 text-green-700' :
                result.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {result.status === 'normal' ? '✅' : result.status === 'warning' ? '⚠️' : '🚨'}
                {statusLabel}
              </div>
              {result.status === 'critical' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm">
                  ⚠️ Huyết áp cao! Điều dưỡng đã được thông báo.
                </div>
              )}
              <div className="text-slate-400 text-sm mb-6">Đo lúc {RTS.formatTime(result.timestamp)}</div>
              <button onClick={onClose} className="w-full py-3.5 bg-blue-600 text-white text-lg font-bold rounded-2xl hover:bg-blue-700">
                ✓ Đóng
              </button>
            </div>
          )}

          {phase !== 'measuring' && (
            <button onClick={onClose} className="mt-3 text-slate-400 hover:text-slate-600 text-sm">Huỷ</button>
          )}
        </div>
      </div>
    );
  }

  function SOSModal({ onClose }) {
    const [phase, setPhase] = React.useState('confirm'); // confirm | sent

    function confirmSOS() {
      const event = {
        id: RTS.genId(),
        elderId: 'E001',
        elderName: 'Bà Nguyễn Thị Hoa',
        timestamp: new Date().toISOString(),
        status: 'pending',
        respondedBy: null,
        note: '',
      };
      RTS.addSOS(event);
      RTS.addAlert({
        id: RTS.genId(),
        elderId: 'E001',
        elderName: 'Bà Nguyễn Thị Hoa',
        type: 'sos',
        title: '🆘 SOS - Cần trợ giúp khẩn cấp',
        detail: 'Người cao tuổi bấm nút SOS trên thiết bị Robot lúc ' + new Date().toLocaleTimeString('vi-VN'),
        timestamp: new Date().toISOString(),
        severity: 'critical',
        status: 'pending',
      });
      // Gửi thông báo khẩn cấp đồng thời tới Người thân, Điều dưỡng và Bác sĩ
      RTS.addNotification({
        id: RTS.genId(),
        toUserId: 'U002',
        type: 'sos',
        title: '🚨 KHẨN CẤP: SOS từ Bà Nguyễn Thị Hoa',
        detail: 'Bà vừa kích hoạt nút SOS khẩn cấp trên Robot Tâm Sự! Đang kết nối điều dưỡng.',
        elderId: 'E001',
        timestamp: new Date().toISOString(),
        read: false
      });
      RTS.addNotification({
        id: RTS.genId(),
        toUserId: 'U003',
        type: 'sos',
        title: '🚨 KHẨN CẤP: SOS từ Bà Nguyễn Thị Hoa (P101)',
        detail: 'Bà Hoa bấm nút SOS khẩn cấp tại phòng P101. Điều dưỡng cần đến hỗ trợ ngay!',
        elderId: 'E001',
        timestamp: new Date().toISOString(),
        read: false
      });
      RTS.addNotification({
        id: RTS.genId(),
        toUserId: 'U004',
        type: 'sos',
        title: '🚨 KHẨN CẤP: Sự kiện SOS - Bà Nguyễn Thị Hoa',
        detail: 'Kích hoạt SOS lúc ' + new Date().toLocaleTimeString('vi-VN') + '. Điều dưỡng đang xử lý.',
        elderId: 'E001',
        timestamp: new Date().toISOString(),
        read: false
      });
      setPhase('sent');
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center fade-in">
          {phase === 'confirm' ? (
            <div>
              <div className="text-7xl mb-4">🆘</div>
              <h2 className="text-2xl font-bold text-red-700 mb-3">Gửi Cảnh báo SOS?</h2>
              <p className="text-slate-600 text-lg mb-6">Điều dưỡng và gia đình sẽ được thông báo ngay lập tức để đến hỗ trợ bạn.</p>
              <button
                onClick={confirmSOS}
                className="w-full py-4 bg-red-600 text-white text-xl font-bold rounded-2xl hover:bg-red-700 sos-pulse mb-3 shadow-lg"
              >
                🆘 Xác nhận gửi SOS
              </button>
              <button onClick={onClose} className="w-full py-3 border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 text-lg">
                Huỷ bỏ
              </button>
            </div>
          ) : (
            <div>
              <div className="text-7xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-green-700 mb-3">Đã gửi cảnh báo SOS!</h2>
              <p className="text-slate-600 text-lg mb-4">Điều dưỡng và gia đình đã nhận được thông báo. Hãy bình tĩnh, họ sẽ đến ngay!</p>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="text-green-700 font-bold">📞 Điều dưỡng Lan đang trên đường đến</div>
                <div className="text-green-600 text-sm mt-1">Ước tính: 2-3 phút</div>
              </div>
              <button onClick={onClose} className="w-full py-3.5 bg-green-600 text-white text-lg font-bold rounded-2xl hover:bg-green-700">
                ✓ Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function CallModal({ onClose }) {
    const [calling, setCalling] = React.useState(true);
    React.useEffect(() => {
      const t = setTimeout(() => setCalling(false), 3000);
      return () => clearTimeout(t);
    }, []);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 text-center fade-in">
          <div className={`text-7xl mb-4 ${calling ? 'animate-pulse' : ''}`}>📞</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{calling ? 'Đang gọi...' : 'Đang kết nối'}</h2>
          <p className="text-slate-500 text-lg mb-2">Chị Nguyễn Thu Hương</p>
          {calling ? (
            <p className="text-blue-500 animate-pulse text-base mb-6">Đang chờ bắt máy...</p>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-6 text-green-700 text-sm">
              ✅ Đã kết nối! (Mô phỏng demo)
            </div>
          )}
          <button onClick={onClose} className="w-full py-3.5 bg-red-500 text-white text-lg font-bold rounded-2xl hover:bg-red-600">
            📵 Kết thúc cuộc gọi
          </button>
        </div>
      </div>
    );
  }

  function ElderDashboard({ user, onLogout }) {
    const [showBP, setShowBP] = React.useState(false);
    const [showSOS, setShowSOS] = React.useState(false);
    const [showChat, setShowChat] = React.useState(false);
    const [showCall, setShowCall] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('home');
    const [schedules, setSchedules] = React.useState([]);
    const [bpHistory, setBpHistory] = React.useState([]);
    const [currentTime, setCurrentTime] = React.useState(new Date());

    React.useEffect(() => {
      setSchedules(RTS.getSchedules('E001'));
      setBpHistory(RTS.getBP('E001').slice(-3).reverse());
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

    function refreshData() {
      setSchedules(RTS.getSchedules('E001'));
      setBpHistory(RTS.getBP('E001').slice(-3).reverse());
    }

    function confirmSchedule(id) {
      RTS.updateSchedule(id, { confirmed: true, confirmedAt: new Date().toISOString() });
      refreshData();
    }

    const latestBP = bpHistory[0];

    return (
      <div className="min-h-screen bg-slate-100" style={{ fontSize: '1.1rem' }}>
        {/* Top bar */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">👵</div>
            <div>
              <div className="font-bold text-xl">{user.name}</div>
              <div className="text-blue-200 text-sm">
                {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} •
                {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
              </div>
            </div>
          </div>
          <button onClick={onLogout} className="text-blue-200 hover:text-white text-sm px-3 py-1 rounded-lg hover:bg-blue-600">Thoát</button>
        </div>

        {/* BP status bar */}
        {latestBP && (
          <div className={`px-4 py-3 text-center text-base font-semibold ${
            latestBP.status === 'normal' ? 'bg-green-50 text-green-700 border-b border-green-200' :
            latestBP.status === 'warning' ? 'bg-yellow-50 text-yellow-700 border-b border-yellow-200' :
            'bg-red-50 text-red-700 border-b border-red-200'
          }`}>
            💓 Huyết áp gần nhất: {latestBP.systolic}/{latestBP.diastolic} mmHg • {RTS.bpLabel(latestBP.systolic)} • {RTS.timeAgo(latestBP.timestamp)}
          </div>
        )}

        {/* Content */}
        <div className="max-w-lg mx-auto px-4 py-5">
          {activeTab === 'home' && (
            <div className="space-y-4">
              {/* SOS Big Button */}
              <button
                onClick={() => setShowSOS(true)}
                className="w-full py-6 bg-red-600 text-white text-3xl font-extrabold rounded-3xl sos-pulse shadow-xl flex items-center justify-center gap-3"
              >
                🆘 <span>SOS - Gọi Cứu thương</span>
              </button>

              {/* Main Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setShowBP(true); }}
                  className="bg-white border-2 border-blue-200 rounded-2xl p-5 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-400 transition shadow-sm"
                >
                  <span className="text-4xl">💓</span>
                  <span className="text-blue-700 font-bold text-lg text-center">Đo Huyết Áp</span>
                </button>
                <button
                  onClick={() => setShowChat(true)}
                  className="bg-white border-2 border-purple-200 rounded-2xl p-5 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-400 transition shadow-sm"
                >
                  <span className="text-4xl">🤖</span>
                  <span className="text-purple-700 font-bold text-lg text-center">Chat với Robot</span>
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="bg-white border-2 border-green-200 rounded-2xl p-5 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-400 transition shadow-sm"
                >
                  <span className="text-4xl">📅</span>
                  <span className="text-green-700 font-bold text-lg text-center">Lịch hôm nay</span>
                  <span className="text-sm text-slate-500">{schedules.filter(s => !s.confirmed).length} việc cần làm</span>
                </button>
                <button
                  onClick={() => setShowCall(true)}
                  className="bg-white border-2 border-orange-200 rounded-2xl p-5 flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-400 transition shadow-sm"
                >
                  <span className="text-4xl">📞</span>
                  <span className="text-orange-700 font-bold text-lg text-center">Gọi Người thân</span>
                </button>
              </div>

              {/* Health snapshot */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="font-bold text-slate-700 text-xl mb-3">📊 Sức khỏe hôm nay</h3>
                {bpHistory.length > 0 ? (
                  <div className="space-y-2">
                    {bpHistory.map(bp => (
                      <div key={bp.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div className="text-slate-500 text-base">🕐 {RTS.formatTime(bp.timestamp)}</div>
                        <div className={`font-bold text-lg ${bp.status === 'normal' ? 'bp-normal' : bp.status === 'warning' ? 'bp-warning' : 'bp-critical'}`}>
                          {bp.systolic}/{bp.diastolic}
                        </div>
                        <div className="text-slate-400 text-sm">💗 {bp.heartRate}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-4">Chưa có dữ liệu đo hôm nay</p>
                )}
              </div>

              {/* Quick care group */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="font-bold text-slate-700 text-xl mb-3">💬 Tin nhắn mới từ gia đình</h3>
                <div className="space-y-2">
                  <div className="flex gap-3 items-start">
                    <span className="text-xl">👩</span>
                    <div className="bg-blue-50 rounded-xl px-3 py-2 text-base flex-1">
                      <div className="font-semibold text-blue-700 text-sm">Chị Hương</div>
                      Mẹ ơi, mẹ uống thuốc chưa? Con nhớ mẹ lắm! ❤️
                    </div>
                  </div>
                </div>
                <button onClick={() => setActiveTab('care')} className="mt-3 text-blue-600 text-sm hover:underline">Xem tất cả tin nhắn →</button>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-800 text-2xl">📅 Lịch hôm nay</h2>
              {schedules.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-slate-400">
                  <div className="text-5xl mb-3">✅</div>
                  <div className="text-xl">Không có lịch hôm nay</div>
                </div>
              ) : (
                schedules.map(s => (
                  <div key={s.id} className={`bg-white rounded-2xl shadow-sm p-5 border-l-4 ${s.confirmed ? 'border-green-500 opacity-70' : 'border-blue-500'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{s.icon}</span>
                        <div>
                          <div className="font-bold text-slate-800 text-xl">{s.title}</div>
                          <div className="text-slate-500 text-base mt-1">{s.detail}</div>
                          <div className="text-blue-600 font-semibold mt-1">🕐 {RTS.formatTime(s.time)}</div>
                        </div>
                      </div>
                      {!s.confirmed ? (
                        <button
                          onClick={() => confirmSchedule(s.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 flex-shrink-0"
                        >
                          ✓ Xác nhận
                        </button>
                      ) : (
                        <span className="text-green-600 font-bold text-base flex-shrink-0">✅ Đã làm</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'care' && (
            <div>
              <h2 className="font-bold text-slate-800 text-2xl mb-4">👥 Nhóm Chăm sóc</h2>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <CareGroup elderId="E001" currentUser={user} />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg">
          <div className="max-w-lg mx-auto flex">
            {[
              { id: 'home', icon: '🏠', label: 'Trang chủ' },
              { id: 'schedule', icon: '📅', label: 'Lịch' },
              { id: 'care', icon: '👥', label: 'Gia đình' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center py-3 transition-colors ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span className="text-2xl">{tab.icon}</span>
                <span className="text-xs mt-0.5 font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 70 }}></div>

        {/* Modals */}
        {showBP && <BPModal onClose={() => { setShowBP(false); refreshData(); }} />}
        {showSOS && <SOSModal onClose={() => setShowSOS(false)} />}
        {showCall && <CallModal onClose={() => setShowCall(false)} />}
        {showChat && <RobotChat onClose={() => setShowChat(false)} elderName={user.name} />}
      </div>
    );
  }

  window.ElderDashboard = ElderDashboard;
})();
