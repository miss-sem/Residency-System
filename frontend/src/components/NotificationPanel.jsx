import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { X, CheckCheck } from 'lucide-react';

const TYPE_ICON = {
  message:          '💬',
  report_reviewed:  '✅',
  report_submitted: '📋',
  feedback:         '📝',
  invite:           '📩',
};

const NotificationPanel = ({ onClose, className = '' }) => {
  const { notifications, unread, markAllRead, markOneRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = async (n) => {
    if (!n.read) await markOneRead(n._id);
    if (n.link) navigate(n.link);
    onClose();
  };

  const unreadList = notifications.filter(n => !n.read);

  return (
    <div className={`bg-white border border-gray-100 shadow-2xl z-50 animate-fade-in overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-bold text-gray-800">Notifications</span>
        <div className="flex items-center gap-2">
          {unreadList.length > 0 && (
            <button onClick={markAllRead} title="Dismiss all"
              className="text-xs text-primary hover:underline flex items-center gap-1">
              <CheckCheck size={12} /> Clear all
            </button>
          )}
          <button onClick={onClose} className="p-0.5 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {unreadList.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">You're all caught up</div>
        ) : (
          unreadList.map((n) => (
            <button
              key={n._id}
              onClick={() => handleClick(n)}
              className="w-full text-left flex items-start gap-3 px-4 py-3 border-b border-gray-50
                transition-colors duration-150 hover:bg-primary/[0.03] bg-primary/[0.02]"
            >
              <span className="text-base mt-0.5 flex-shrink-0">{TYPE_ICON[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-snug text-gray-800 font-semibold">{n.message}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(n.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0 mt-1.5" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
