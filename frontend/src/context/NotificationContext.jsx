import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import api from '../services/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  // Load existing notifications on mount
  useEffect(() => {
    if (!user) { setNotifications([]); setUnread(0); return; }
    api.get('/notifications')
      .then(({ data }) => {
        setNotifications(data.notifications);
        setUnread(data.notifications.filter(n => !n.read).length);
      })
      .catch(() => {});
  }, [user?._id]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNotif = (notif) => {
      setNotifications(prev => [notif, ...prev].slice(0, 50));
      setUnread(prev => prev + 1);

      // Browser push when tab hidden
      if (document.hidden && Notification.permission === 'granted') {
        new Notification('LogBook System', { body: notif.message, icon: '/favicon.ico' });
      }
    };

    socket.on('notification', handleNotif);
    return () => socket.off('notification', handleNotif);
  }, [socket]);

  const markAllRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch (_) {}
  }, []);

  const markOneRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (_) {}
  }, []);

  const requestBrowserPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unread, markAllRead, markOneRead, requestBrowserPermission }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
