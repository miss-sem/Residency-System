import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { messageAPI } from '../../services/api';
import { Send, MessageSquare, Loader2 } from 'lucide-react';

const Avatar = ({ name, size = 8 }) => {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div className={`w-${size} h-${size} rounded-full bg-primary flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold text-xs">{initials}</span>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex items-end gap-2 mb-3 animate-fade-in">
    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
      <span className="text-gray-500 font-bold text-[10px]">A</span>
    </div>
    <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
      <div className="flex gap-1 items-center h-3">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  </div>
);

const ResidentMessages = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [adminId, setAdminId]     = useState(null);
  const [adminName, setAdminName] = useState('Admin');
  const [isTyping, setIsTyping]   = useState(false);
  const bottomRef  = useRef(null);
  const typingRef  = useRef(null);

  // Load admin conversation
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await messageAPI.getConversations();
        const adminConv = data.conversations.find(c => c.user.role === 'admin');
        if (adminConv) {
          setAdminId(adminConv.user._id);
          setAdminName(adminConv.user.name);
          const msgs = await messageAPI.getMessages(adminConv.user._id);
          setMessages(msgs.data.messages);
        } else {
          // No prior conversation — fetch admin's profile so we can initiate one
          const { data: contact } = await messageAPI.getAdminContact();
          setAdminId(contact.user._id);
          setAdminName(contact.user.name);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onMessage = (msg) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setIsTyping(false);
    };

    const onTyping = ({ from }) => {
      if (adminId && from === adminId) {
        setIsTyping(true);
        clearTimeout(typingRef.current);
        typingRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const onStopTyping = ({ from }) => {
      if (adminId && from === adminId) setIsTyping(false);
    };

    socket.on('new_message', onMessage);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);
    return () => {
      socket.off('new_message', onMessage);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
    };
  }, [socket, adminId]);

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!socket || !adminId) return;
    socket.emit('typing', { to: adminId, from: user._id, name: user.name });
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      socket.emit('stop_typing', { to: adminId, from: user._id });
    }, 1500);
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !adminId) return;
    setSending(true);
    try {
      const { data } = await messageAPI.sendMessage({ receiverId: adminId, content: text });
      setMessages(prev => prev.find(m => m._id === data.message._id) ? prev : [...prev, data.message]);
      setInput('');
      if (socket && adminId) socket.emit('stop_typing', { to: adminId, from: user._id });
    } finally {
      setSending(false);
    }
  }, [input, adminId, sending, socket, user._id]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  const groupedMessages = () => {
    const groups = [];
    let lastDate = '';
    for (const m of messages) {
      const d = new Date(m.createdAt).toDateString();
      if (d !== lastDate) { groups.push({ type: 'date', label: fmtDate(m.createdAt) }); lastDate = d; }
      groups.push({ type: 'msg', msg: m });
    }
    return groups;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  const isMine = (msg) => msg.sender?._id === user._id || msg.sender === user._id;

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <Avatar name={adminName} size={9} />
        <div>
          <p className="text-sm font-bold text-gray-800">{adminName}</p>
          <p className="text-xs text-gray-400">Administrator</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
              <MessageSquare size={24} className="text-primary" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No messages yet</p>
            <p className="text-xs text-gray-400">Send a message to your administrator</p>
          </div>
        )}

        {groupedMessages().map((item, idx) => {
          if (item.type === 'date') {
            return (
              <div key={`d-${idx}`} className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] text-gray-400 font-medium px-2">{item.label}</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            );
          }

          const m = item.msg;
          const mine = isMine(m);
          return (
            <div key={m._id} className={`flex items-end gap-2 mb-3 ${mine ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
              {!mine && <Avatar name={adminName} size={7} />}
              <div className={`max-w-[70%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                <div className={`px-4 py-2.5 text-sm leading-relaxed
                  ${mine
                    ? 'bg-primary text-white rounded-2xl rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm'}`}>
                  {m.content}
                </div>
                <span className="text-[10px] text-gray-400 px-1">{fmtTime(m.createdAt)}</span>
              </div>
            </div>
          );
        })}

        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white">
        <div className="flex items-end gap-3">
          <textarea
            rows={1}
            value={input}
            onChange={handleTyping}
            onKeyDown={handleKey}
            placeholder="Type a message… (Enter to send)"
            className="flex-1 resize-none border border-gray-200 px-4 py-3 text-sm text-gray-800
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20
                       focus:border-primary transition-all duration-200 max-h-32 overflow-y-auto"
            style={{ fieldSizing: 'content' }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending || !adminId}
            className="btn-primary px-4 py-3 flex-shrink-0 disabled:opacity-50"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResidentMessages;
