import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessageContext';
import {
  Users, ClipboardList, LayoutDashboard,
  LogOut, ChevronRight, X, Settings, Download,
  MessageSquare, Calendar, Plus, UserPlus,
} from 'lucide-react';

const residentLinks = [
  { to: '/resident/reports/new', icon: Plus,            label: 'Create' },
  { to: '/resident/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resident/reports',     icon: ClipboardList,   label: 'My Reports' },
  { to: '/resident/generate',    icon: Download,        label: 'Generate Report' },
  { to: '/resident/calendar',    icon: Calendar,        label: 'Calendar' },
  { to: '/resident/messages',    icon: MessageSquare,   label: 'Chat' },
];

const adminLinks = [
  { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/residents',  icon: Users,           label: 'Residents' },
  { to: '/admin/reports',    icon: ClipboardList,   label: 'Reports' },
  { to: '/admin/invite',     icon: UserPlus,        label: 'Invite Reviewer' },
  { to: '/admin/messages',   icon: MessageSquare,   label: 'Chat' },
];

const reviewerLinks = [
  { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/residents',  icon: Users,           label: 'Residents' },
  { to: '/admin/reports',    icon: ClipboardList,   label: 'Reports' },
  { to: '/admin/messages',   icon: MessageSquare,   label: 'Chat' },
];

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useMessages();
  const navigate = useNavigate();
  const links = user?.role === 'admin' ? adminLinks
    : user?.role === 'reviewer' ? reviewerLinks
    : residentLinks;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="w-64 h-full bg-white border-r border-gray-100 flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">LB</span>
          </div>
          <p className="text-sm font-bold text-gray-800 leading-tight">LogBook</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map((link, i) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200
               ${isActive
                 ? 'bg-primary/10 text-primary'
                 : 'bg-white text-gray-500 hover:bg-primary/10 hover:text-primary'}`
            }
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {({ isActive }) => (
              <>
                <link.icon size={17} className="flex-shrink-0" />
                <span className="flex-1">{link.label}</span>
                {link.label === 'Chat' && !isActive && unreadCount > 0
                  ? <span className="min-w-[20px] h-5 px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  : isActive && <ChevronRight size={14} className="opacity-70" />
                }
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <NavLink
          to={user?.role === 'resident' ? '/resident/settings' : '/admin/settings'}
          end
          onClick={onClose}
          className={({ isActive }) =>
            `w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200
             ${isActive
               ? 'bg-primary/10 text-primary'
               : 'bg-white text-gray-500 hover:bg-primary/10 hover:text-primary'}`
          }
        >
          {({ isActive }) => (
            <>
              <Settings size={16} className="flex-shrink-0" />
              <span className="flex-1">Settings</span>
              {isActive && <ChevronRight size={14} className="opacity-70" />}
            </>
          )}
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500
                     hover:bg-red-50 hover:text-red-500 transition-all duration-200 font-medium"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
