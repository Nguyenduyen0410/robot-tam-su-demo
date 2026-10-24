// ============================================================
// components/chat.js - Robot Companion Chat UI
// ============================================================
(function () {
  const ROBOT_RESPONSES = {
    keywords: [
      {
        keys: ['huyết áp', 'blood pressure', 'chẩn đoán', 'uống thuốc gì', 'bệnh gì', 'chữa bệnh', 'có nguy hiểm không'],
        response: '⚠️ Cháu là Robot Tâm Sự, không có chức năng tư vấn y khoa hay chẩn đoán bệnh tật. Chỉ số huyết áp của Ngoại được lưu lại để gia đình xem.\n\n👉 Nếu Ngoại thấy không khỏe hoặc cần tư vấn điều trị, xin vui lòng liên hệ nhân viên y tế qua nhóm Telegram của gia đình hoặc bấm nút SOS khẩn cấp ạ!'
      },
      {
        keys: ['thuốc', 'uống thuốc', 'lịch thuốc'],
        response: '💊 Dạ Ngoại ơi, Myka chỉ nhắc giờ uống thuốc theo đúng lịch bác sĩ đã kê sẵn thôi ạ (không tự ý đổi hay tư vấn thuốc). Ngoại nhớ uống thuốc đúng giờ và uống kèm nước ấm nhé!'
      },
      {
        keys: ['gọi', 'duyên', 'con gái', 'người thân'],
        response: '📞 Ngoại muốn gọi cho Chị Duyên đúng không ạ? Ngoại có thể bấm nút "Gọi Chị Duyên" hoặc nói "Myka, gọi cho Duyên" để Myka kết nối qua loa ngoài cho Ngoại ngay nhé! ❤️'
      },
      {
        keys: ['buồn', 'cô đơn', 'nhớ', 'chán'],
        response: '🤗 Ngoại ơi, Myka luôn ở bên cạnh trò chuyện với Ngoại mà! Chị Duyên và cả nhà luôn thương Ngoại lắm. Ngoại có muốn Myka kể một câu chuyện vui ngày xưa cho Ngoại nghe không ạ? 😊'
      },
      {
        keys: ['đau', 'mệt', 'chóng mặt', 'khó chịu'],
        response: '🚨 Ngoại đang thấy mệt trong người ạ? Ngoại ngồi nghỉ ngơi trên giường giúp Myka nhé! Myka đã gửi thông báo đến Chị Duyên và Điều dưỡng Lan rồi ạ. Nếu Ngoại cần gấp, bấm nút SOS đỏ ngay nha Ngoại!'
      },
      {
        keys: ['kể chuyện', 'chuyện vui', 'hài'],
        response: '😄 Dạ, để Myka kể chuyện này cho Ngoại nghe vui nhé:\nCó một ông cụ đi dạo gặp bạn, bạn khen: "Dạo này trông bác khỏe ra đấy!". Cụ cười bảo: "Bí quyết là mỗi sáng nghe robot chào một câu và ăn cơm đúng bữa đấy bác ạ!" 😂\nNgoại thấy vui hơn chưa ạ?'
      },
      {
        keys: ['thời tiết', 'trời', 'nóng', 'lạnh', 'mưa', 'nắng'],
        response: '☀️ Thời tiết hôm nay khá mát mẻ, khoảng 26-28 độ C, gió nhẹ. Ngoại nhớ mặc áo ấm khi ra ban công và uống đủ nước ấm nhé! 😊'
      },
      {
        keys: ['chào', 'hello', 'hi', 'xin chào', 'bạn tên'],
        response: '🤖 Dạ con chào Ngoại ạ! Con là Myka - Robot tâm sự cùng Ngoại. Hôm nay Ngoại ăn cơm có ngon miệng không ạ?'
      },
    ],
    default: [
      '🤖 Dạ Ngoại ơi, Myka rất vui khi được nói chuyện với Ngoại! Myka luôn ở đây lắng nghe Ngoại tâm sự chuyện ngày xưa, kể chuyện vui cho Ngoại nghe nhé! 😊',
      '💙 Cảm ơn Ngoại đã chia sẻ với Myka! Ngoại có muốn nghe một bài hát ru quen thuộc không ạ?',
      '🌸 Cuộc sống luôn có những điều vui vẻ bình dị. Myka luôn ở bên đồng hành cùng Ngoại 24/7!',
    ],
  };

  function getRobotResponse(text) {
    const lower = text.toLowerCase();
    for (const item of ROBOT_RESPONSES.keywords) {
      if (item.keys.some(k => lower.includes(k))) {
        return item.response;
      }
    }
    return ROBOT_RESPONSES.default[Math.floor(Math.random() * ROBOT_RESPONSES.default.length)];
  }

  const QUICK_REPLIES = [
    'Tôi muốn tâm sự',
    'Kể chuyện vui cho tôi',
    'Thời tiết hôm nay thế nào?',
    'Mở bài hát ru',
    'Gọi Chị Duyên',
    'Nhắc lịch hôm nay'
  ];

  function RobotChat({ onClose, elderName }) {
    const [messages, setMessages] = React.useState([
      {
        id: 'init',
        sender: 'robot',
        text: `🤖 Xin chào ${elderName || 'bà'}! Tôi là Robot Tâm Sự của bà. Hôm nay bà cảm thấy thế nào? Tôi luôn ở đây để lắng nghe và hỗ trợ bà! 😊`,
        time: new Date().toISOString(),
      }
    ]);
    const [input, setInput] = React.useState('');
    const [isTyping, setIsTyping] = React.useState(false);
    const bottomRef = React.useRef(null);

    React.useEffect(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [messages, isTyping]);

    function sendMessage(text) {
      if (!text.trim()) return;
      const userMsg = { id: RTS.genId(), sender: 'user', text: text.trim(), time: new Date().toISOString() };
      setMessages(prev => [...prev, userMsg]);
      
      // Đồng bộ tin nhắn của người già vào RTS Chat History (từ thiết bị Robot về App)
      RTS.addChatHistory({
        id: RTS.genId(),
        elderId: 'E001',
        text: text.trim(),
        timestamp: new Date().toISOString(),
        sender: 'elder'
      });

      // Phát hiện dấu hiệu tâm lý hoặc sức khỏe qua lời nói để cảnh báo
      const lower = text.toLowerCase();
      const distressWords = ['đau', 'mệt', 'chóng mặt', 'khó chịu', 'buồn', 'cô đơn', 'ngã', 'sốt'];
      if (distressWords.some(w => lower.includes(w))) {
        RTS.addNotification({
          id: RTS.genId(),
          toUserId: 'U002',
          type: 'chat_summary',
          title: '💬 Robot ghi nhận chia sẻ từ Bà Hoa',
          detail: `Bà vừa tâm sự với Robot: "${text.trim()}". Người thân nên gọi điện hoặc ghé thăm.`,
          elderId: 'E001',
          timestamp: new Date().toISOString(),
          read: false
        });
        RTS.addNotification({
          id: RTS.genId(),
          toUserId: 'U003',
          type: 'chat_summary',
          title: '💬 Dấu hiệu sức khỏe từ lời nói - P101',
          detail: `Bà Nguyễn Thị Hoa chia sẻ với Robot: "${text.trim()}". Điều dưỡng lưu ý thăm khám.`,
          elderId: 'E001',
          timestamp: new Date().toISOString(),
          read: false
        });
      }

      setInput('');
      setIsTyping(true);
      setTimeout(() => {
        const response = getRobotResponse(text);
        const botMsg = { id: RTS.genId(), sender: 'robot', text: response, time: new Date().toISOString() };
        setMessages(prev => [...prev, botMsg]);
        
        // Lưu phản hồi của Robot vào lịch sử
        RTS.addChatHistory({
          id: RTS.genId(),
          elderId: 'E001',
          text: response,
          timestamp: new Date().toISOString(),
          sender: 'robot'
        });

        setIsTyping(false);
      }, 1200 + Math.random() * 800);
    }

    function handleKey(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ height: '85vh' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">🤖</div>
            <div className="flex-1">
              <div className="font-bold text-lg">Robot Tâm Sự</div>
              <div className="text-blue-100 text-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                Đang hoạt động • Luôn sẵn sàng
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 text-xl">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-slate-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} fade-in`}>
                {msg.sender === 'robot' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-base flex-shrink-0 mt-1">🤖</div>
                )}
                <div className={`max-w-xs px-4 py-3 text-base whitespace-pre-line ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-robot'}`}>
                  {msg.text}
                  <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                    {RTS.formatTime(msg.time)}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 fade-in">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-base flex-shrink-0">🤖</div>
                <div className="chat-bubble-robot px-4 py-3">
                  <span className="text-slate-500 text-sm">Robot đang trả lời</span>
                  <span className="ml-1 animate-pulse">...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef}></div>
          </div>

          {/* Quick replies */}
          <div className="px-4 py-2 border-t border-slate-100 overflow-x-auto">
            <div className="flex gap-2 pb-1">
              {QUICK_REPLIES.map(qr => (
                <button
                  key={qr}
                  onClick={() => sendMessage(qr)}
                  className="flex-shrink-0 text-sm px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Nhắn tin với Robot Tâm Sự..."
              className="flex-1 px-4 py-3 text-base border border-slate-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xl"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    );
  }

  window.RobotChat = RobotChat;
})();
