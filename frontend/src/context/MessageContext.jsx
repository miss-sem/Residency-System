import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { messageAPI } from '../services/api';

const MessageContext = createContext(null);

export const MessageProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    messageAPI.getUnreadCount()
      .then(({ data }) => setUnreadCount(data.count))
      .catch(() => {});
  }, [user?._id]);

  useEffect(() => {
    if (!socket || !user) return;
    const onMessage = (msg) => {
      const receiverId = msg.receiver?._id || msg.receiver;
      if (String(receiverId) === String(user._id)) {
        setUnreadCount(prev => prev + 1);
      }
    };
    socket.on('new_message', onMessage);
    return () => socket.off('new_message', onMessage);
  }, [socket, user?._id]);

  const resetUnread = useCallback(() => setUnreadCount(0), []);

  return (
    <MessageContext.Provider value={{ unreadCount, resetUnread }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => useContext(MessageContext);
