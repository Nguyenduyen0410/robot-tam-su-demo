// ============================================================
// components/chat.js - Robot Companion Chat UI
// ============================================================
(function () {
  const ROBOT_RESPONSES = {
    keywords: [
      { keys: ['huyết áp', 'blood pressure', 'đo'], response: '💓 Huyết áp của bà hôm nay đang ở mức bình thường. Bà nhớ đo huyết áp lúc 9 giờ sáng và 2 giờ chiều theo lịch nhé! Nếu bà cảm thấy đau đầu hoặc chóng mặt, hãy bấm nút SOS ngay ạ.' },
      { keys: ['thuốc', 'uống thuốc', 'medication'], response: '💊 Lịch uống thuốc hôm nay của bà:\n• 8:00 - Amlodipine 5mg (thuốc huyết áp)\n• 12:00 - Metformin 500mg (thuốc tiểu đường)\n• 20:00 - Melatonin 3mg (thuốc ngủ)\n\nBà đã uống thuốc buổi sáng chưa ạ? 😊' },
      { keys: ['gọi', 'con', 'gia đình', 'người thân'], response: '📞 Bà muốn gọi cho gia đình ạ? Tôi sẽ kết nối ngay! Bấm nút "Gọi người thân" màu xanh trên màn hình để gọi cho con gái Hương nhé. Gia đình luôn yêu thương bà! ❤️' },
      { keys: ['buồn', 'cô đơn', 'nhớ', 'sad', 'lonely'], response: '🤗 Bà ơi, con robot này luôn ở bên bà! Bà không bao giờ cô đơn đâu ạ. Con gái Hương và gia đình rất yêu bà và luôn nghĩ đến bà. Bà có muốn nghe một câu chuyện vui không? Hay bà kể cho tôi nghe hôm nay bà đã làm gì nhé! 😊' },
      { keys: ['đau', 'khó chịu', 'mệt', 'chóng mặt'], response: '🏥 Bà đang cảm thấy không khỏe ạ? Nếu bà đau hoặc rất khó chịu, xin bà bấm nút SOS đỏ ngay để được trợ giúp khẩn cấp! Điều dưỡng Lan sẽ đến ngay. Tôi sẽ thông báo cho gia đình bà biết.' },
      { keys: ['kể chuyện', 'chuyện vui', 'hài'], response: '😄 Ồ bà thích nghe chuyện vui à! Để tôi kể:\n\nMột ông cụ đi khám bệnh, bác sĩ hỏi: "Ông có hút thuốc không?"\nÔng cụ đáp: "Không bao giờ!"\nBác sĩ: "Uống rượu không?"\n"Không ạ!"\nBác sĩ: "Ông sống lâu thế này nhờ đâu vậy?"\nÔng cụ cười: "Nhờ không đi gặp bác sĩ thường xuyên!" 😂\n\nBà thấy vui hơn chưa ạ?' },
      { keys: ['ăn', 'bữa ăn', 'đói', 'ăn gì'], response: '🍲 Hôm nay bà ăn gì rồi ạ? Với người cao tuổi có huyết áp, bà nên ăn nhiều rau xanh, trái cây tươi, hạn chế muối và thức ăn dầu mỡ. Bữa trưa có canh rau ngon không ạ? 😊' },
      { keys: ['thời tiết', 'trời', 'nóng', 'lạnh'], response: '☀️ Thời tiết hôm nay khá mát mẻ, khoảng 25-28 độ C. Bà nhớ mặc đủ ấm khi ra ngoài nhé! Với huyết áp, thời tiết thay đổi có thể ảnh hưởng - bà theo dõi cẩn thận ạ.' },
      { keys: ['chào', 'hello', 'hi', 'xin chào', 'bạn tên'], response: '🤖 Xin chào bà Hoa! Tôi là Robot Tâm Sự, người bạn đồng hành của bà. Tôi luôn ở đây để trò chuyện, nhắc nhở thuốc và hỗ trợ bà 24/7. Hôm nay bà khỏe không ạ?' },
    ],
    default: [
      '🤖 Bà ơi, tôi rất vui khi được nói chuyện với bà! Bà có thể hỏi tôi về huyết áp, lịch uống thuốc, hay chúng ta cùng trò chuyện nhé. Tôi luôn ở đây bên bà! 😊',
      '💙 Cảm ơn bà đã chia sẻ với tôi! Bà có muốn tôi kể một câu chuyện vui, hay bà cần hỗ trợ gì không ạ?',
      '🌸 Hôm nay bà trông rất vui! Cuộc sống luôn có những điều tốt đẹp xung quanh chúng ta phải không bà? Bà có muốn nói về điều gì đó không ạ?',
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
    'Tôi muốn nói chuyện',
    'Kể chuyện vui cho tôi',
    'Huyết áp của tôi thế nào?',
    'Gọi con gái tôi',
    'Lịch thuốc hôm nay',
    'Tôi cảm thấy mệt',
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
