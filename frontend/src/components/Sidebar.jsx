import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Users, ClipboardList, LayoutDashboard,
  LogOut, ChevronRight, X, Settings,
} from 'lucide-react';

const residentLinks = [
  { to: '/resident/reports/new', icon: FileText,      label: 'New Report' },
  { to: '/resident/reports',     icon: ClipboardList, label: 'My Reports' },
];

const adminLinks = [
  { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/residents',  icon: Users,           label: 'Residents' },
  { to: '/admin/reports',    icon: ClipboardList,   label: 'Reports' },
];

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'admin' ? adminLinks : residentLinks;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="w-64 h-full bg-white border-r border-gray-100 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/ghs-logo.png" alt="GHS Logo" className="h-12 w-12 object-contain flex-shrink-0" />
          <p className="text-sm font-bold text-gray-800 leading-tight">Residency System</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {/* <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pb-2">
          {user?.role === 'admin' ? 'Admin Menu' : 'Menu'}
        </p> */}
        {links.map(({ to, icon: Icon, label }, i) => (
          <NavLink
            key={to}
            to={to}
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
                <Icon size={17} className="flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="opacity-70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <NavLink
          to={user?.role === 'admin' ? '/admin/settings' : '/resident/settings'}
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
                     hover:bg-red-50 hover:text-primary transition-all duration-200 font-medium"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
