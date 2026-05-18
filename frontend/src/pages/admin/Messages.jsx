import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { messageAPI } from '../../services/api';
import { Send, MessageSquare, Loader2, Search, SquarePen, X } from 'lucide-react';

const Avatar = ({ name, size = 9, online = false }) => {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div className="relative flex-shrink-0">
      <div className={`w-${size} h-${size} rounded-full bg-primary/20 flex items-center justify-center`}>
        <span className="text-primary font-bold text-xs">{initials}</span>
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
      )}
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex items-end gap-2 mb-3 animate-fade-in">
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

const AdminMessages = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [active, setActive]       = useState(null);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [search, setSearch]       = useState('');
  const [isTyping, setIsTyping]   = useState(false);
  const [contacts, setContacts]   = useState([]);
  const [composing, setComposing] = useState(false);
  const bottomRef    = useRef(null);
  const typingRef    = useRef(null);
  const didInitRef   = useRef(false);

  // Load conversations — only auto-select on first load
  const loadConversations = useCallback(async () => {
    try {
      const { data } = await messageAPI.getConversations();
      setConversations(data.conversations);
      if (!didInitRef.current && data.conversations.length > 0) {
        setActive(data.conversations[0]);
        didInitRef.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    messageAPI.getContacts().then(({ data }) => setContacts(data.contacts)).catch(() => {});
  }, []);

  // Load messages for active conversation
  useEffect(() => {
    if (!active) return;
    setMessages([]);
    messageAPI.getMessages(active.user._id).then(({ data }) => setMessages(data.messages));
  }, [active?.user._id]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Socket
  useEffect(() => {
    if (!socket) return;

    const onMessage = (msg) => {
      const senderId = msg.sender?._id || msg.sender;
      if (active && senderId === active.user._id) {
        setMessages(prev => prev.find(m => m._id === msg._id) ? prev : [...prev, msg]);
        setIsTyping(false);
      }
      loadConversations();
    };

    const onTyping = ({ from, name }) => {
      if (active && from === active.user._id) {
        setIsTyping(true);
        clearTimeout(typingRef.current);
        typingRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const onStopTyping = ({ from }) => {
      if (active && from === active.user._id) setIsTyping(false);
    };

    socket.on('new_message', onMessage);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);
    return () => {
      socket.off('new_message', onMessage);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
    };
  }, [socket, active?.user._id]);

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!socket || !active) return;
    socket.emit('typing', { to: active.user._id, from: user._id, name: user.name });
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      socket.emit('stop_typing', { to: active.user._id, from: user._id });
    }, 1500);
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !active) return;
    setSending(true);
    try {
      const { data } = await messageAPI.sendMessage({ receiverId: active.user._id, content: text });
      setMessages(prev => prev.find(m => m._id === data.message._id) ? prev : [...prev, data.message]);
      setInput('');
      if (socket) socket.emit('stop_typing', { to: active.user._id, from: user._id });
      loadConversations();
    } finally {
      setSending(false);
    }
  }, [input, active, sending, socket, user._id]);

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

  const isMine = (msg) => msg.sender?._id === user._id || msg.sender === user._id;
  const isOnline = (id) => onlineUsers.includes(id);

  const startConversation = (contact) => {
    const existing = conversations.find(c => c.user._id === contact._id);
    setActive(existing || { user: contact, lastMessage: null, unread: 0 });
    setComposing(false);
    setSearch('');
  };

  const filtered = conversations.filter(c =>
    c.user.name.toLowerCase().includes(search.toLowerCase()) ||
    c.user.email.toLowerCase().includes(search.toLowerCase())
  );

  // Reviewers not already in conversations
  const newContacts = contacts.filter(c => !conversations.some(cv => cv.user._id === c._id));

  return (
    <div className="flex h-full animate-fade-in">

      {/* Left: conversation list */}
      <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col bg-white">
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare size={17} className="text-primary" /> Messages
            </h1>
            {contacts.length > 0 && (
              <button
                onClick={() => setComposing(v => !v)}
                title={composing ? 'Cancel' : 'New message'}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-all">
                {composing ? <X size={15} /> : <SquarePen size={15} />}
              </button>
            )}
          </div>

          {composing ? (
            <div className="animate-fade-in">
              <p className="text-xs text-gray-400 mb-2">Start a conversation with a reviewer:</p>
              {contacts.map(c => (
                <button key={c._id} onClick={() => startConversation(c)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/[0.06] transition-colors text-left">
                  <Avatar name={c.name} size={7} online={isOnline(c._id)} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.email}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 focus:outline-none
                           focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={22} />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-400">No conversations yet</div>
          )}
          {filtered.map((conv) => (
            <button
              key={conv.user._id}
              onClick={() => setActive(conv)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50
                transition-all duration-150 text-left
                ${active?.user._id === conv.user._id ? 'bg-primary/[0.06] border-l-2 border-l-primary' : 'hover:bg-gray-50'}`}
            >
              <Avatar name={conv.user.name} size={9} online={isOnline(conv.user._id)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800 truncate">{conv.user.name}</p>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 bg-primary text-white text-[10px] font-bold
                                     rounded-full flex items-center justify-center flex-shrink-0 ml-1">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {conv.lastMessage?.content || 'No messages yet'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: chat panel */}
      {active ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
            <Avatar name={active.user.name} size={9} online={isOnline(active.user._id)} />
            <div>
              <p className="text-sm font-bold text-gray-800">{active.user.name}</p>
              <p className="text-xs text-gray-400">
                {isOnline(active.user._id) ? (
                  <span className="text-green-500 font-medium">Online</span>
                ) : (
                  active.user.email
                )}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
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
                  {!mine && <Avatar name={active.user.name} size={7} />}
                  <div className={`max-w-[70%] flex flex-col gap-0.5 ${mine ? 'items-end' : 'items-start'}`}>
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
                placeholder="Type a reply… (Enter to send)"
                className="flex-1 resize-none border border-gray-200 px-4 py-3 text-sm
                           placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20
                           focus:border-primary transition-all duration-200 max-h-32 overflow-y-auto"
                style={{ fieldSizing: 'content' }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="btn-primary px-4 py-3 flex-shrink-0 disabled:opacity-50"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <MessageSquare size={28} className="text-primary" />
          </div>
          <p className="text-sm font-semibold text-gray-700">Select a conversation</p>
          <p className="text-xs text-gray-400">Choose a conversation or start a new one</p>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
