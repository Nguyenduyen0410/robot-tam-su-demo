(function () {
  const FEATURES = [
    { icon:'monitor_heart', title:'Sức khỏe', desc:'Xem lịch sử huyết áp, nhịp tim và xu hướng trong 7 hoặc 30 ngày.', tag:'HIỂU THÊM MỖI NGÀY' },
    { icon:'calendar_month', title:'Lịch chăm sóc', desc:'Thêm, sửa và theo dõi lịch uống thuốc, lịch tái khám của người thân.', tag:'NHỚ ĐIỀU QUAN TRỌNG' },
    { icon:'person_book', title:'Hồ sơ người cao tuổi', desc:'Bổ sung tuổi, địa chỉ và tiền sử để thông tin chăm sóc luôn ở cùng một nơi.', tag:'CHĂM SÓC PHÙ HỢP' },
    { icon:'devices', title:'Kết nối thiết bị', desc:'Quản lý thiết bị trong hồ sơ, tên thiết bị và cấu hình Wi-Fi, Bluetooth.', tag:'KẾT NỐI THUẬN TIỆN' },
    { icon:'build', title:'Bảo trì', desc:'Xem những nhắc nhở bảo trì và thời hạn cần lưu ý cho thiết bị Myka.', tag:'ĐỒNG HÀNH LÂU DÀI' },
    { icon:'sync', title:'Trạng thái dữ liệu', desc:'Kiểm tra phản hồi máy chủ và thời gian cập nhật số đo gần nhất.', tag:'THÔNG TIN RÕ RÀNG' },
    { icon:'forum', title:'Nhật ký Myka', desc:'Đọc lại những cuộc trò chuyện theo ngày, lưu ý nội dung gia đình cần xem lại.', tag:'LẮNG NGHE NHIỀU HƠN' },
    { icon:'tune', title:'Cài đặt', desc:'Chọn thời lượng Không làm phiền, kiểu giọng và tên robot hiển thị.', tag:'THEO CÁCH CỦA GIA ĐÌNH' },
    { icon:'receipt_long', title:'Gói & thanh toán', desc:'Xem phí dịch vụ, kỳ gia hạn và lịch sử thanh toán một cách rõ ràng.', tag:'DỄ DÀNG QUẢN LÝ' },
  ];
  function LandingPage({ onNavigate }) {
    const [showFeatures,setShowFeatures] = React.useState(false);
    const featuresRef = React.useRef(null);
    const featureTriggerRef = React.useRef(null);
    React.useEffect(() => {
      if (!showFeatures) return;
      const closeOnEscape = event => {
        if (event.key === 'Escape') setShowFeatures(false);
        if (event.key === 'Tab') {
          const focusable = featuresRef.current?.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]');
          if (!focusable?.length) return;
          const first = focusable[0], last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      };
      document.addEventListener('keydown',closeOnEscape);
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.removeEventListener('keydown',closeOnEscape); document.body.style.overflow = previousOverflow; featureTriggerRef.current?.focus(); };
    },[showFeatures]);
    return <main className="myka-app-welcome">
      <div className="myka-entry-shell">
        <header className="myka-entry-brand"><span className="material-symbols-rounded" aria-hidden="true">volunteer_activism</span><div><strong>Myka<span>Care</span></strong><small>Đồng hành chăm sóc gia đình</small></div></header>
        <div className="myka-entry-photo"><img src="assets/family-care-hero.png" alt="Bà và con gái cùng trò chuyện, nắm tay trong không gian gia đình ấm áp" fetchPriority="high"/><div className="myka-entry-photo-label"><span className="material-symbols-rounded" aria-hidden="true">favorite</span> Gần nhau từ những điều nhỏ</div></div>
        <section className="myka-entry-content" aria-labelledby="myka-entry-title"><div className="myka-entry-eyebrow"><span/> KHÔNG GIAN CHĂM SÓC GIA ĐÌNH</div><h1 id="myka-entry-title">Chăm sóc người thân,<br/><span>gần gũi mỗi ngày.</span></h1><p>Theo dõi sức khỏe, nhớ lịch chăm sóc và cùng Myka quan tâm ông bà mỗi ngày.</p>
          <div className="myka-entry-shortcuts" aria-label="Những tiện ích chính">{[['monitor_heart','Sức khỏe'],['calendar_month','Lịch chăm sóc'],['diversity_1','Gia đình']].map(([icon,title]) => <div key={title}><span className="material-symbols-rounded" aria-hidden="true">{icon}</span><span>{title}</span></div>)}</div>
          <button className="myka-entry-start" onClick={() => onNavigate('login')}>Vào ứng dụng<span className="material-symbols-rounded" aria-hidden="true">arrow_forward</span></button>
          <button className="myka-entry-discover" ref={featureTriggerRef} aria-expanded={showFeatures} aria-controls="myka-features-dialog" onClick={() => setShowFeatures(true)}>Myka có thể giúp gì cho gia đình?<span className="material-symbols-rounded" aria-hidden="true">expand_more</span></button>
          <div className="myka-entry-footnote"><span className="material-symbols-rounded" aria-hidden="true">spa</span> Dành cho người thân chăm sóc người cao tuổi</div>
        </section>
      </div>
      {showFeatures && <div className="myka-feature-backdrop" onClick={event => { if (event.target === event.currentTarget) setShowFeatures(false); }}><section className="myka-feature-sheet" ref={featuresRef} id="myka-features-dialog" role="dialog" aria-modal="true" aria-labelledby="myka-feature-title"><div className="myka-feature-sheet-header"><div><small>CÙNG MYKA CHĂM SÓC</small><h2 id="myka-feature-title">Thông tin cần thiết, ở cùng một nơi.</h2></div><button type="button" onClick={() => setShowFeatures(false)} aria-label="Đóng danh sách chức năng" autoFocus><span className="material-symbols-rounded" aria-hidden="true">close</span></button></div><div className="myka-feature-sheet-list">{FEATURES.map(feature => <article key={feature.title}><span className="material-symbols-rounded" aria-hidden="true">{feature.icon}</span><div><h3>{feature.title}</h3><p>{feature.desc}</p></div></article>)}</div><div className="myka-feature-sheet-note"><span className="material-symbols-rounded" aria-hidden="true">send</span><p>Trao đổi với nhóm chăm sóc qua Telegram riêng khi kênh đã được thiết lập.</p></div><button className="myka-entry-start" onClick={() => onNavigate('login')}>Bắt đầu cùng Myka<span className="material-symbols-rounded" aria-hidden="true">arrow_forward</span></button></section></div>}
    </main>;
  }
  window.LandingPage=LandingPage;
})();
