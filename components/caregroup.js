// ============================================================
// components/caregroup.js - Care Group Chat Component
// ============================================================
(function () {
  const ROLE_LABELS = {
    family: 'Người thân',
    caregiver: 'Điều dưỡng',
    doctor: 'Bác sĩ',
    elder: 'Người cao tuổi',
    admin: 'Quản trị',
    operator: 'Điều hành',
  };
  const ROLE_COLORS = {
    family: 'bg-purple-100 text-purple-700',
    caregiver: 'bg-green-100 text-green-700',
    doctor: 'bg-blue-100 text-blue-700',
    elder: 'bg-orange-100 text-orange-700',
    admin: 'bg-slate-100 text-slate-700',
    operator: 'bg-teal-100 text-teal-700',
  };

  function CareGroup({ elderId, currentUser, onClose }) {
    const [group, setGroup] = React.useState(null);
    const [input, setInput] = React.useState('');
    const [msgType, setMsgType] = React.useState('message');
    const bottomRef = React.useRef(null);

    React.useEffect(() => {
      const g = RTS.getCareGroup(elderId);
      setGroup(g);
    }, [elderId]);

    React.useEffect(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [group]);

    function sendMessage() {
      if (!input.trim() || !group) return;
      const msg = {
        id: RTS.genId(),
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        avatar: currentUser.avatar,
        text: input.trim(),
        timestamp: new Date().toISOString(),
        type: msgType,
      };
      RTS.addCareGroupMessage(group.id, msg);
      setInput('');
      // refresh
      setGroup(RTS.getCareGroup(elderId));
    }

    function handleKey(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    }

    if (!group) return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-center">
          <div className="text-4xl mb-2">👥</div>
          <div>Chưa có nhóm chăm sóc</div>
        </div>
      </div>
    );

    return (
      <div className="flex flex-col h-full" style={{ minHeight: 400, maxHeight: 600 }}>
        {/* Group header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 rounded-t-xl flex items-center gap-3">
          <div className="text-2xl">👥</div>
          <div className="flex-1">
            <div className="font-bold">Nhóm Chăm sóc - {group.elderName}</div>
            <div className="text-indigo-200 text-sm">{group.members.length} thành viên</div>
          </div>
          {onClose && (
            <button onClick={onClose} className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 text-xl">×</button>
          )}
        </div>

        {/* Members */}
        <div className="bg-indigo-50 px-4 py-2 border-b flex gap-2 flex-wrap">
          {group.members.map(m => (
            <span key={m.id} className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${ROLE_COLORS[m.role] || 'bg-slate-100 text-slate-700'}`}>
              <span>{m.avatar}</span>
              <span>{m.name}</span>
            </span>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 scrollbar-thin" style={{ minHeight: 200 }}>
          {group.messages.map(msg => (
            <div key={msg.id} className="fade-in">
              <div className="flex gap-2 items-start">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-base flex-shrink-0">{msg.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-slate-800">{msg.userName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[msg.role] || 'bg-slate-100 text-slate-600'}`}>{ROLE_LABELS[msg.role] || msg.role}</span>
                    {msg.type === 'alert' && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">⚠️ Cảnh báo</span>}
                    <span className="text-xs text-slate-400">{RTS.timeAgo(msg.timestamp)}</span>
                  </div>
                  <div className={`px-3 py-2 rounded-lg text-sm ${msg.type === 'alert' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-white border border-slate-200 text-slate-700'}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef}></div>
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-200 bg-white rounded-b-xl">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setMsgType('message')}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${msgType === 'message' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:border-indigo-400'}`}
            >💬 Tin nhắn</button>
            <button
              onClick={() => setMsgType('question')}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${msgType === 'question' ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-300 text-slate-600 hover:border-amber-400'}`}
            >❓ Câu hỏi</button>
            <button
              onClick={() => setMsgType('alert')}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${msgType === 'alert' ? 'bg-red-500 text-white border-red-500' : 'border-slate-300 text-slate-600 hover:border-red-400'}`}
            >⚠️ Cảnh báo</button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-indigo-400"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >Gửi</button>
          </div>
        </div>
      </div>
    );
  }

  window.CareGroup = CareGroup;
})();
